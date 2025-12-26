import React, { useState, useEffect, useRef } from 'react';
import { isBefore, isAfter, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import TripCard from './TripCard';

const TripList = ({ trips, onSelectTrip }) => {
    const [limit, setLimit] = useState(10);
    const observerTarget = useRef(null);
    const now = new Date();

    // Categorize Trips
    const currentTrips = [];
    const plannedTrips = [];
    const pastTrips = [];

    trips.forEach(trip => {
        const start = trip.startDate ? new Date(trip.startDate) : null;
        const end = trip.endDate ? new Date(trip.endDate) : null;

        if (!start) {
            pastTrips.push(trip);
            return;
        }

        const safeEnd = end ? endOfDay(end) : endOfDay(start);
        const safeStart = startOfDay(start);

        if (isWithinInterval(now, { start: safeStart, end: safeEnd })) {
            currentTrips.push(trip);
        } else if (isAfter(safeStart, now)) {
            plannedTrips.push(trip);
        } else {
            pastTrips.push(trip);
        }
    });

    plannedTrips.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    pastTrips.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    // Infinite Scroll Logic
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setLimit(prev => prev + 10);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, []);

    const renderSection = (title, items, isPast = false) => {
        if (items.length === 0) return null;

        const visibleItems = isPast ? items.slice(0, limit) : items;

        return (
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>{title}</h2>
                    <span style={{
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '99px',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                    }}>{items.length}</span>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {visibleItems.map(trip => (
                        <div key={trip.id} onClick={() => onSelectTrip(trip)} style={{ cursor: 'pointer' }}>
                            <TripCard trip={trip} />
                        </div>
                    ))}
                </div>

                {isPast && items.length > limit && (
                    <div ref={observerTarget} style={{ height: '40px', marginTop: '1rem' }}>
                        {/* Sentinel for IntersectionObserver */}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            {renderSection('Current Trips', currentTrips)}
            {renderSection('Planned Trips', plannedTrips)}
            {renderSection('Past Trips', pastTrips, true)}
        </div>
    );
};

export default TripList;
