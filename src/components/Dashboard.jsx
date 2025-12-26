import React, { useState } from 'react';
import { Download, Upload, BarChart2 } from 'lucide-react';
import StatsSummary from './StatsSummary';
import YearlyBreakdown from './YearlyBreakdown';
import TripList from './TripList';
import TripDetail from './TripDetail';
import AirlineStatsChart from './AirlineStatsChart';

const SampleDataNotice = () => (
    <div className="card" style={{
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        marginBottom: '2rem',
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
        border: 'none',
        boxShadow: 'var(--shadow-lg)'
    }}>
        <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                👋 Viewing Sample Data
            </h3>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
                This is a demo. To see your own stats, <strong>request a JSON export</strong> from TripIt support (support@tripit.com) and use the <strong>Load New File</strong> button.
                <span style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>🔒 Your data never leaves your browser.</span>
            </p>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', transform: 'rotate(-45deg)', animation: 'bounce 2s infinite' }}>
            ↗️
        </div>
    </div>
);

const Dashboard = ({ stats, trips, allTravelers, selectedTravelers, isSample, onTravelersChange, onDataLoaded }) => {
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [showAirlineStats, setShowAirlineStats] = useState(false);
    const [showTravelerFilter, setShowTravelerFilter] = useState(false);

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                onDataLoaded(json);
            } catch (err) {
                alert('Error parsing JSON file. Please ensure it is valid.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const handleExport = () => {
        const headers = ['DisplayName', 'StartDate', 'EndDate', 'Location', 'Country', 'Year', 'Days', 'FlightsCount', 'Travelers'];
        const rows = trips.map(t => [
            `"${t.displayName}"`,
            t.startDate,
            t.endDate,
            `"${t.location}"`,
            t.country,
            t.year,
            t.days,
            t.flights.length,
            `"${(t.travelers || []).join(', ')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'tripit_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleTraveler = (traveler) => {
        const current = selectedTravelers || allTravelers;
        let next;

        if (current.includes(traveler)) {
            next = current.filter(t => t !== traveler);
        } else {
            next = [...current, traveler];
        }

        if (next.length === allTravelers.length) {
            onTravelersChange(null);
        } else {
            onTravelersChange(next.length === 0 ? [] : next);
        }
    };

    return (
        <div className="container" onClick={() => setShowTravelerFilter(false)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="text-gradient" style={{ margin: 0 }}>Trip Dashboard</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* Traveler Filter */}
                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button
                            className="btn-primary"
                            style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)', border: '1px solid #e2e8f0' }}
                            onClick={() => setShowTravelerFilter(!showTravelerFilter)}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Travelers ({selectedTravelers ? selectedTravelers.length : 'All'})
                            </span>
                        </button>
                        {showTravelerFilter && (
                            <div className="card" style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                                zIndex: 1000, width: '250px', padding: '1rem',
                                boxShadow: 'var(--shadow-lg)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>Filter by Traveler</span>
                                    <button
                                        onClick={() => onTravelersChange(null)}
                                        style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        Select All
                                    </button>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {allTravelers.map(t => (
                                        <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={!selectedTravelers || selectedTravelers.includes(t)}
                                                onChange={() => toggleTraveler(t)}
                                            />
                                            {t}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="btn-primary" style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)', border: '1px solid #e2e8f0' }} onClick={() => setShowAirlineStats(!showAirlineStats)}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={16} /> Airline Stats</span>
                    </button>
                    <button className="btn-primary" style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)', border: '1px solid #e2e8f0' }} onClick={handleExport}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Download size={16} /> Export CSV</span>
                    </button>

                    <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload size={16} /> Load New File
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileInput}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </div>

            {isSample && <SampleDataNotice />}

            <StatsSummary stats={stats} />

            <YearlyBreakdown stats={stats} />

            {showAirlineStats && <AirlineStatsChart stats={stats} />}

            <TripList trips={trips} onSelectTrip={setSelectedTrip} />

            {selectedTrip && (
                <TripDetail trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
            )}
        </div>
    );
};

export default Dashboard;
