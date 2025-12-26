import React from 'react';
import { X, Plane, Train, Car, Hotel, Calendar, Clock, MapPin } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

const DetailIcon = ({ type }) => {
    switch (type) {
        case 'flight': return <Plane size={20} />;
        case 'rail': return <Train size={20} />;
        case 'car': return <Car size={20} />;
        case 'lodging': return <Hotel size={20} />;
        default: return <Calendar size={20} />;
    }
}

const TripDetail = ({ trip, onClose }) => {
    if (!trip) return null;

    const formatDate = (startObj) => {
        if (!startObj) return '';

        // Handle either string or TripIt date object {date, time, ...}
        const dateStr = typeof startObj === 'string' ? startObj : startObj.date;
        const timeStr = typeof startObj === 'object' ? startObj.time : null;

        if (!dateStr) return '';

        // Use parseISO on the date part (YYYY-MM-DD) which results in a local date at midnight
        const date = parseISO(dateStr);
        if (!isValid(date)) return '';

        if (timeStr) {
            const [h, m] = timeStr.split(':');
            date.setHours(parseInt(h), parseInt(m));
            return format(date, 'MMM d, h:mm a');
        }

        return format(date, 'MMM d, yyyy');
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '2rem'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--color-bg-card)',
                width: '100%', maxWidth: '800px', maxHeight: '90vh',
                borderRadius: 'var(--radius-lg)',
                display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-app)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{trip.displayName}</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            {trip.location} • {trip.days} days
                            {trip.travelers?.length > 0 && ` • ${trip.travelers.join(', ')}`}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'transparent' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ overflowY: 'auto', padding: '1.5rem' }}>
                    {(!trip.timeline || trip.timeline.length === 0) && (
                        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>No timeline details available.</p>
                    )}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {trip.timeline?.map((item, idx) => (
                            <div key={idx} className="card" style={{ padding: '1rem', borderLeft: item.type === 'flight' ? '4px solid var(--color-primary)' : '4px solid var(--color-accent)' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--color-bg-app)',
                                        borderRadius: '50%',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        <DetailIcon type={item.type} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {/* Header Row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                                                {item.type === 'flight' ? `${item.airline} ${item.flightNumber}` : item.name}
                                            </h3>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                {formatDate(item.start)}
                                            </span>
                                        </div>

                                        {/* Sub-details */}
                                        {item.travelers?.length > 0 && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                                Traveler: {item.travelers.join(', ')}
                                            </div>
                                        )}

                                        {item.type === 'flight' && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{item.origin}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(item.start)}</div>
                                                </div>
                                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                                    <div>{item.duration}</div>
                                                    <div style={{ borderTop: '1px solid currentColor', width: '40px', margin: '2px auto' }}></div>
                                                    <div>{item.stops || 'Nonstop'}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{item.destination}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(item.end)}</div>
                                                </div>
                                            </div>
                                        )}

                                        {item.type === 'lodging' && (
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>
                                                    <MapPin size={16} />
                                                    <span>{item.address?.address}, {item.address?.city}</span>
                                                </div>
                                                {item.end && (
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                        Check-out: {formatDate(item.end)}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {item.type === 'car' && (
                                            <div>
                                                {item.details?.supplier_phone && <p style={{ fontSize: '0.875rem' }}>Phone: {item.details.supplier_phone}</p>}
                                                {item.details?.confirmation_num && <p style={{ fontSize: '0.875rem' }}>Conf: {item.details.confirmation_num}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripDetail;
