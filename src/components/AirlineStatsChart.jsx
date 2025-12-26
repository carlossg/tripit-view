import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Filter out zero values and sort by value descending
        const filteredPayload = payload
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

        if (filteredPayload.length === 0) return null;

        return (
            <div className="card" style={{
                padding: '0.75rem',
                border: '1px solid var(--color-border)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
                backgroundColor: '#ffffff', // Explicit solid white
                color: '#1e293b', // Explicit dark text
                fontSize: '0.875rem',
                zIndex: 9999,
                position: 'relative'
            }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{label}</p>
                {filteredPayload.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <div style={{ width: '10px', height: '10px', backgroundColor: entry.color, borderRadius: '2px' }}></div>
                        <span style={{ color: 'var(--color-text-muted)' }}>{entry.name}:</span>
                        <span style={{ fontWeight: 'bold' }}>{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const AirlineStatsChart = ({ stats }) => {
    if (!stats || !stats.years) return null;

    // Get all unique airlines and their total counts
    const airlineCounts = {};
    Object.values(stats.years).forEach(yearData => {
        if (yearData.airlines) {
            Object.entries(yearData.airlines).forEach(([a, count]) => {
                airlineCounts[a] = (airlineCounts[a] || 0) + count;
            });
        }
    });

    // Sort airlines by total count descending for the legend/stacking
    const airlineList = Object.keys(airlineCounts).sort((a, b) => airlineCounts[b] - airlineCounts[a]);

    // Prepare data for stacked bar chart: { year: '2023', 'United': 5, 'American': 2, ... }
    const data = Object.entries(stats.years)
        .map(([year, yearData]) => {
            const entry = { year };
            airlineList.forEach(airline => {
                entry[airline] = yearData.airlines ? (yearData.airlines[airline] || 0) : 0;
            });
            return entry;
        })
        .sort((a, b) => a.year.localeCompare(b.year));

    // Colors for different airlines - using a palette
    const colors = [
        '#2563eb', '#db2777', '#10b981', '#f59e0b', '#7c3aed',
        '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'
    ];

    // Prepare data for All-Time chart
    const allTimeData = airlineList.map(airline => ({
        name: airline,
        flights: airlineCounts[airline]
    })).slice(0, 15); // Show top 15

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem', marginBottom: '2rem' }}>
            {/* Yearly Stacked Chart */}
            <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>Flights by Airline per Year</h2>
                <div style={{ height: '400px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                content={<CustomTooltip />}
                                wrapperStyle={{ zIndex: 10000 }}
                            />
                            <Legend />
                            {airlineList.map((airline, index) => (
                                <Bar
                                    key={airline}
                                    dataKey={airline}
                                    stackId="a"
                                    fill={colors[index % colors.length]}
                                    radius={index === airlineList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* All-Time Bar Chart */}
            <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>All-Time Top Airlines</h2>
                <div style={{ height: airlineList.length * 30 + 100, minHeight: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={allTimeData}
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={120}
                                axisLine={false}
                                tickLine={false}
                                style={{ fontSize: '0.875rem' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--color-bg-app)', opacity: 0.4 }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: 'var(--shadow-lg)',
                                    backgroundColor: 'var(--color-bg-card)'
                                }}
                            />
                            <Bar
                                dataKey="flights"
                                fill="var(--color-primary)"
                                radius={[0, 4, 4, 0]}
                                label={{ position: 'right', fill: 'var(--color-text-muted)', fontSize: 12 }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AirlineStatsChart;
