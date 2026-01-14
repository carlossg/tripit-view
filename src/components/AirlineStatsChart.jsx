import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label, airlineCodes }) => {
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
                {filteredPayload.map((entry, index) => {
                    const code = airlineCodes && airlineCodes[entry.name];
                    return (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <div style={{ width: '10px', height: '10px', backgroundColor: entry.color, borderRadius: '2px' }}></div>
                            <span style={{ color: 'var(--color-text-muted)' }}>
                                {entry.name}{code ? ` (${code})` : ''}:
                            </span>
                            <span style={{ fontWeight: 'bold' }}>{entry.value}</span>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

const AirlineStatsChart = ({ stats }) => {
    if (!stats || !stats.years) return null;

    const airlineCodes = stats.airlineCodes || {};

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

    // Colors for different airlines - expanded palette for better differentiation
    const colors = [
        '#2563eb', '#db2777', '#10b981', '#f59e0b', '#7c3aed',
        '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6',
        '#f97316', '#84cc16', '#06b6d4', '#6366f1', '#a855f7',
        '#d946ef', '#f43f5e', '#fbbf24', '#34d399', '#2dd4bf',
        '#3b82f6', '#9333ea', '#e11d48', '#ea580c', '#16a34a',
        '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3',
        '#db2777', '#e11d48', '#f43f5e', '#fb7185', '#fda4af',
        '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7',
        '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ecfdf5',
        '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#ecfeff',
        '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff',
        '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f5f3ff'
    ];

    // Helper to get color for an airline to ensure consistency
    const getAirlineColor = (airline, index) => {
        return colors[index % colors.length];
    };

    // Prepare data for All-Time chart
    const allTimeData = airlineList.map((airline, index) => ({
        name: airline,
        code: airlineCodes[airline] || '',
        flights: airlineCounts[airline],
        color: getAirlineColor(airline, index)
    })).slice(0, 20);

    // Custom label for stacked bars to show IATA code inside if it fits
    const renderStackedBarLabel = (props) => {
        const { x, y, width, height, value, airlineName } = props;
        const code = airlineCodes[airlineName];
        // Only show if the bar is wide enough, tall enough, and has a value
        if (value > 0 && width > 20 && height > 15 && code) {
            return (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    fill="#fff"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={10}
                    style={{ pointerEvents: 'none', fontWeight: 'bold', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}
                >
                    {code}
                </text>
            );
        }
        return null;
    };

    // Custom label for vertical bars to show "Code - Count" or just "Count"
    const renderVerticalBarLabel = (props) => {
        const { x, y, width, height, value, index } = props;
        const entry = allTimeData[index];
        const labelText = entry && entry.code ? `${entry.code}: ${value}` : value;

        return (
            <text
                x={x + width + 5}
                y={y + height / 2}
                fill="var(--color-text-muted)"
                fontSize={12}
                dominantBaseline="middle"
            >
                {labelText}
            </text>
        );
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem', marginBottom: '2rem' }}>
            {/* Yearly Stacked Chart */}
            <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>Flights by Airline per Year</h2>
                <div style={{ height: '450px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                content={<CustomTooltip airlineCodes={airlineCodes} />}
                                wrapperStyle={{ zIndex: 10000 }}
                            />
                            <Legend />
                            {airlineList.map((airline, index) => (
                                <Bar
                                    key={airline}
                                    dataKey={airline}
                                    stackId="a"
                                    fill={getAirlineColor(airline, index)}
                                    // Last bar in stack gets top rounding
                                    radius={index === airlineList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                    label={(props) => renderStackedBarLabel({ ...props, airlineName: airline })}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* All-Time Bar Chart */}
            <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>All-Time Top Airlines</h2>
                <div style={{ height: allTimeData.length * 35 + 100, minHeight: '400px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={allTimeData}
                            margin={{ top: 5, right: 60, left: 40, bottom: 5 }} // Increased right margin for labels
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name" // Back to full name
                                type="category"
                                width={150}
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
                                radius={[0, 4, 4, 0]}
                                label={renderVerticalBarLabel}
                            >
                                {allTimeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AirlineStatsChart;
