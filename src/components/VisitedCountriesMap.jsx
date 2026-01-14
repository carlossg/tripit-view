import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const VisitedCountriesMap = ({ stats, automatedStats, manualVisitedCountries = {}, onToggleCountry }) => {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [activePopup, setActivePopup] = useState(null); // { isoCode, name, latlng }

    useEffect(() => {
        const baseUrl = import.meta.env.BASE_URL || '/';
        fetch(`${baseUrl}world.geojson`)
            .then(r => r.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error('Failed to load world geojson:', err));
    }, []);

    // Help resolve ISO codes from incomplete GeoJSON data
    const getIsoCode = (feature) => {
        const props = feature.properties;
        let code = props['ISO3166-1-Alpha-2'] || props.ISO_A2 || props.iso_a2;

        // Handle cases where ISO code is missing or -99 (broken in many GeoJSON exports)
        if (!code || code === '-99' || code === -99) {
            const name = props.name || props.NAME;
            const geoFix = {
                'France': 'FR',
                'Norway': 'NO',
                'Kosovo': 'XK',
                'Northern Cyprus': 'CY',
                'Somaliland': 'SO'
            };
            if (geoFix[name]) return geoFix[name];
        }
        return code;
    };

    const automatedVisitedSet = useMemo(() => new Set(automatedStats?.uniqueCountries || []), [automatedStats]);
    const finalVisitedSet = useMemo(() => new Set(stats?.uniqueCountries || []), [stats]);

    const onEachFeature = (feature, layer) => {
        const countryName = feature.properties.name || feature.properties.NAME;
        const isoCode = getIsoCode(feature);

        layer.on({
            click: (e) => {
                L.DomEvent.stopPropagation(e);
                setActivePopup({
                    isoCode,
                    name: countryName,
                    latlng: e.latlng
                });
            }
        });
    };

    const countryStyle = (feature) => {
        const isoCode = getIsoCode(feature);
        const isVisited = finalVisitedSet.has(isoCode);

        return {
            fillColor: isVisited ? 'var(--color-accent)' : '#333333',
            weight: 1,
            opacity: 1,
            color: '#444444',
            fillOpacity: isVisited ? 0.7 : 0.2
        };
    };

    if (!geoJsonData) {
        return (
            <div className="card" style={{ height: '650px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1d23', color: 'white' }}>
                <div>Loading world map...</div>
            </div>
        );
    }

    const renderPopup = () => {
        if (!activePopup) return null;

        const isAutomated = automatedVisitedSet.has(activePopup.isoCode);
        const isFinalVisited = finalVisitedSet.has(activePopup.isoCode);
        const isManualOverride = manualVisitedCountries.hasOwnProperty(activePopup.isoCode);

        let statusText = 'Not visited yet';
        if (isFinalVisited) {
            statusText = isAutomated ? 'Visited (Automated)' : 'Visited (Manual)';
        } else if (isAutomated && !isFinalVisited) {
            statusText = 'Not visited (Manual Override)';
        }

        return (
            <Popup
                position={activePopup.latlng}
                onClose={() => setActivePopup(null)}
            >
                <div style={{ padding: '0.5rem', fontFamily: 'var(--font-sans)', minWidth: '180px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{activePopup.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.75rem' }}>
                        {statusText}
                    </div>

                    <button
                        className="btn-primary"
                        style={{
                            width: '100%',
                            fontSize: '0.8rem',
                            padding: '0.4rem',
                            backgroundColor: isFinalVisited ? '#ef4444' : 'var(--color-primary)'
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleCountry(activePopup.isoCode);
                            setActivePopup(null);
                        }}
                    >
                        {isFinalVisited ? 'Mark as Not Visited' : 'Mark as Visited'}
                    </button>

                    {isManualOverride && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '0.5rem', textAlign: 'center', opacity: 0.8 }}>
                            Manual Override Active
                        </div>
                    )}
                </div>
            </Popup>
        );
    };

    return (
        <div className="card" style={{ height: '650px', padding: 0, overflow: 'hidden', marginBottom: '2rem', border: 'none' }}>
            <MapContainer
                center={[20, 0]}
                zoom={2}
                minZoom={2}
                worldCopyJump={true}
                style={{ height: '100%', width: '100%', background: '#1a1d23' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <GeoJSON
                    data={geoJsonData}
                    style={countryStyle}
                    onEachFeature={onEachFeature}
                />
                {renderPopup()}
            </MapContainer>
        </div>
    );
};

export default VisitedCountriesMap;
