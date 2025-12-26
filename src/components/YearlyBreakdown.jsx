import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { ArrowLeft } from 'lucide-react';

const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const YearlyBreakdown = ({ stats }) => {
    const [selectedYear, setSelectedYear] = useState(null);

    if (!stats || !stats.years) return null;

    const yearlyData = Object.entries(stats.years)
        .map(([year, data]) => ({
            year,
            Trips: data.trips,
            Flights: data.flights,
            Days: data.days,
            Distance: Math.round(data.distance)
        }))
        .sort((a, b) => a.year.localeCompare(b.year));

    const renderChart = (data, dataKey, title, onBarClick) => (
        <div style={{ height: '350px', width: '100%', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>{title} (Miles & Counts)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={onBarClick}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey={dataKey} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} label={{ value: 'Trips/Flights/Days', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: 'var(--color-text-muted)' } }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} label={{ value: 'Miles', angle: 90, position: 'insideRight', style: { fontSize: '12px', fill: '#6366f1' } }} />
                    <Tooltip
                        cursor={{ fill: 'var(--color-bg-app)', opacity: 0.4 }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', backgroundColor: 'var(--color-bg-card)' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar
                        yAxisId="left"
                        dataKey="Trips"
                        fill="var(--color-primary)"
                        radius={[4, 4, 0, 0]}
                        style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                    />
                    <Bar
                        yAxisId="left"
                        dataKey="Flights"
                        fill="var(--color-accent)"
                        radius={[4, 4, 0, 0]}
                        style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                    />
                    <Bar
                        yAxisId="left"
                        dataKey="Days"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                    />
                    <Bar
                        yAxisId="right"
                        dataKey="Distance"
                        name="Miles"
                        fill="#6366f1"
                        fillOpacity={0.6}
                        radius={[4, 4, 0, 0]}
                        style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    if (selectedYear) {
        const yearStats = stats.years[selectedYear];
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            const mData = yearStats.months[m] || { trips: 0, flights: 0, days: 0, distance: 0 };
            return {
                month: MONTH_NAMES[i],
                Trips: mData.trips,
                Flights: mData.flights,
                Days: mData.days,
                Distance: Math.round(mData.distance || 0)
            };
        });

        return (
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setSelectedYear(null)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--color-primary)', display: 'flex', alignItems: 'center'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ margin: 0 }}>Stats for {selectedYear}</h2>
                </div>
                {renderChart(monthlyData, 'month', 'Monthly Activity')}
            </div>
        );
    }

    const handleYearClick = (state) => {
        if (state && state.activeLabel) {
            setSelectedYear(state.activeLabel);
        }
    };

    return (
        <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Yearly Statistics</h2>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Click a bar to see monthly details</span>
            </div>
            {renderChart(yearlyData, 'year', 'Trips & Flights by Year', handleYearClick)}
        </div>
    );
};

export default YearlyBreakdown;
