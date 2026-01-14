import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { ISO_TO_CONTINENT, CONTINENTS } from '../utils/continents';

const CountryListByContinent = ({ stats, automatedStats, manualVisitedCountries, onToggleCountry, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Get all countries with their names using Intl API
    const allCountries = useMemo(() => {
        const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
        const countries = [];

        for (const [iso, continent] of Object.entries(ISO_TO_CONTINENT)) {
            try {
                const name = displayNames.of(iso);
                if (name && name !== iso) { // Filter out invalid codes
                    countries.push({ iso, name, continent });
                }
            } catch (e) {
                // Skip invalid codes
            }
        }

        return countries.sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    // Group countries by continent
    const countriesByContinent = useMemo(() => {
        const filtered = searchQuery
            ? allCountries.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : allCountries;

        const grouped = {};
        CONTINENTS.forEach(continent => {
            grouped[continent] = filtered.filter(c => c.continent === continent);
        });

        return grouped;
    }, [allCountries, searchQuery]);

    const automatedVisited = new Set(automatedStats?.uniqueCountries || []);
    const finalVisited = new Set(stats?.uniqueCountries || []);

    const getStatus = (iso) => {
        const isAutomated = automatedVisited.has(iso);
        const isFinalVisited = finalVisited.has(iso);

        if (isFinalVisited && isAutomated) return 'automated';
        if (isFinalVisited && !isAutomated) return 'manual-visited';
        if (!isFinalVisited && isAutomated) return 'manual-not-visited';
        return 'not-visited';
    };

    const handleToggle = (iso) => {
        onToggleCountry(iso);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
        }} onClick={onClose}>
            <div className="card" style={{
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Manage Countries</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            color: 'var(--color-text-secondary)'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--color-text-secondary)'
                        }} />
                        <input
                            type="text"
                            placeholder="Search countries..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                border: '1px solid var(--color-border)',
                                borderRadius: '0.5rem',
                                fontSize: '0.95rem',
                                backgroundColor: 'var(--color-bg-card)',
                                color: 'var(--color-text-main)'
                            }}
                        />
                    </div>
                </div>

                {/* Country List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {CONTINENTS.map(continent => {
                        const countries = countriesByContinent[continent];
                        if (countries.length === 0) return null;

                        return (
                            <div key={continent} style={{ marginBottom: '2rem' }}>
                                <h3 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    marginBottom: '0.75rem',
                                    color: 'var(--color-primary)',
                                    position: 'sticky',
                                    top: 0,
                                    backgroundColor: 'var(--color-bg-card)',
                                    padding: '0.5rem 0',
                                    zIndex: 1
                                }}>
                                    {continent} ({countries.filter(c => finalVisited.has(c.iso)).length}/{countries.length})
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                    gap: '0.5rem'
                                }}>
                                    {countries.map(country => {
                                        const status = getStatus(country.iso);
                                        const isVisited = finalVisited.has(country.iso);

                                        return (
                                            <label
                                                key={country.iso}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.5rem',
                                                    cursor: 'pointer',
                                                    borderRadius: '0.25rem',
                                                    backgroundColor: isVisited ? 'rgba(13, 204, 242, 0.1)' : 'transparent',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isVisited}
                                                    onChange={() => handleToggle(country.iso)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span style={{ flex: 1, fontSize: '0.9rem' }}>
                                                    {country.name}
                                                </span>
                                                {status === 'automated' && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        color: 'var(--color-accent)',
                                                        fontWeight: '500'
                                                    }}>Auto</span>
                                                )}
                                                {status === 'manual-visited' && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        color: 'var(--color-primary)',
                                                        fontWeight: '500'
                                                    }}>Manual</span>
                                                )}
                                                {status === 'manual-not-visited' && (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        color: '#ef4444',
                                                        fontWeight: '500'
                                                    }}>Hidden</span>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CountryListByContinent;
