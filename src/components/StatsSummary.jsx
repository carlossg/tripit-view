import React from 'react';
import { Plane, Map, Calendar, Briefcase } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, subtext }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-primary-light)', borderRadius: '50%', color: 'var(--color-primary)' }}>
            <Icon size={24} />
        </div>
        <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{title}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{value}</h3>
            {subtext && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{subtext}</p>}
        </div>
    </div>
);

const StatsSummary = ({ stats }) => {
    if (!stats) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard
                icon={Briefcase}
                title="Total Trips"
                value={stats.totalTrips}
            />
            <StatCard
                icon={Plane}
                title="Total Flights"
                value={stats.totalFlights}
                subtext={`${Math.round(stats.totalDistanceMi).toLocaleString()} miles`}
            />
            <StatCard
                icon={Map}
                title="Countries"
                value={stats.countriesCount}
                subtext="Unique countries visited"
            />
            <StatCard
                icon={Calendar}
                title="Days Travelling"
                value={stats.totalDays}
                subtext="Total duration of all trips"
            />
        </div>
    );
};

export default StatsSummary;
