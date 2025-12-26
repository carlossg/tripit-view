import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { MapPin, Calendar, Plane } from 'lucide-react';

const TripCard = ({ trip }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
        return isValid(date) ? format(date, 'MMM d, yyyy') : '';
    };

    return (
        <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--color-primary)', transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{trip.displayName}</h3>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={14} /> {trip.location || 'Unknown Location'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={14} /> {formatDate(trip.startDate)} - {formatDate(trip.endDate)} ({trip.days} days)
                        </span>
                        {trip.flights.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Plane size={14} /> {trip.flights.length} flights
                            </span>
                        )}
                        {trip.travelers?.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {trip.travelers.join(', ')}
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary-light)', opacity: 0.5 }}>
                        {trip.year}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TripCard;
