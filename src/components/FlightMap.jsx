import React, { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map bounds
function SetBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [100, 100], maxZoom: 10 });
        }
    }, [bounds, map]);
    return null;
}

// Helper to wrap longitudes for shortest path crossing 180th meridian
const wrapLongitude = (lon1, lon2) => {
    const diff = lon2 - lon1;
    if (diff > 180) return lon2 - 360;
    if (diff < -180) return lon2 + 360;
    return lon2;
};

// Helper to normalize longitude to [-180, 180]
const normalizeLon = (lon) => {
    let n = lon;
    while (n > 180) n -= 360;
    while (n < -180) n += 360;
    return n;
};

// Helper to generate arc points for curved lines
const getArcPoints = (start, end) => {
    const points = [];
    const steps = 60;

    const startLat = start[0];
    const startLon = start[1];
    const endLat = end[0];
    const targetLon = wrapLongitude(startLon, end[1]);

    // Calculate distance and average latitude for curvature
    const dLat = endLat - startLat;
    const dLon = targetLon - startLon;
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);

    const avgLat = (startLat + endLat) / 2;
    // Bulge direction: Towards North Pole in NH, Towards South Pole in SH
    const bulgeDir = avgLat >= 0 ? 1 : -1;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;

        // Linear interpolation
        const lat = startLat + dLat * t;
        const lon = startLon + dLon * t;

        // Curvature bulge
        const bulge = Math.sin(Math.PI * t) * (dist * 0.15) * bulgeDir;

        points.push([lat + bulge, lon]);
    }
    return points;
};

// Split a path that crosses the antimeridian into multiple segments
const splitPath = (points) => {
    if (points.length < 2) return [points];

    const segments = [];
    let currentChunk = [[points[0][0], normalizeLon(points[0][1])]];

    for (let i = 1; i < points.length; i++) {
        const prevLon = normalizeLon(points[i - 1][1]);
        const currLon = normalizeLon(points[i][1]);
        const currLat = points[i][0];

        if (Math.abs(currLon - prevLon) > 180) {
            // Found a crossing!
            segments.push(currentChunk);
            currentChunk = [];

            // Note: For a perfectly clean line we'd interpolate to exactly 180/ -180
            // but with enough steps it's visually fine.
        }
        currentChunk.push([currLat, currLon]);
    }
    segments.push(currentChunk);
    return segments;
};

const FlightMap = ({ trips }) => {
    const [airportCoords, setAirportCoords] = useState({});

    useEffect(() => {
        const baseUrl = import.meta.env.BASE_URL || '/';
        fetch(`${baseUrl}airports_coords.json`)
            .then(r => r.json())
            .then(data => setAirportCoords(data))
            .catch(err => console.error('Failed to load airport coordinates:', err));
    }, []);

    const { flightPaths, uniqueAirports, bounds, topRoutes, topAirports, airportCounts } = useMemo(() => {
        const paths = [];
        const airports = new Map();
        const allCoords = [];

        // Flatten all flights from all trips and prepare for analysis
        let allFlights = [];
        const routeCounts = {};

        trips.forEach(trip => {
            trip.flights.forEach(flight => {
                if (!flight.origin || !flight.destination) return;

                // Construct date object for sorting
                const startDateStr = flight.start?.date || trip.startDate || '1970-01-01';
                const startTimeStr = flight.start?.time || '00:00:00';
                const endDateStr = flight.end?.date || flight.start?.date || trip.startDate || '1970-01-01';
                const endTimeStr = flight.end?.time || '00:00:00';

                const start = new Date(`${startDateStr}T${startTimeStr}`);
                const end = new Date(`${endDateStr}T${endTimeStr}`);

                allFlights.push({
                    ...flight,
                    startTime: start.getTime(),
                    endTime: end.getTime(),
                    startObj: start,
                    endObj: end
                });

                // Prepare visualization data (paths & coords)
                const originCoord = airportCoords[flight.origin];
                const destCoord = airportCoords[flight.destination];

                // Update route counts (bidirectional)
                const routeKey = [flight.origin, flight.destination].sort().join('-');
                routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;

                if (originCoord && destCoord) {
                    const arcPoints = getArcPoints(originCoord, destCoord);
                    const segments = splitPath(arcPoints);

                    paths.push({
                        id: `${flight.origin}-${flight.destination}-${flight.start?.date}-${Math.random()}`,
                        segments,
                        flight,
                        routeKey
                    });

                    if (!airports.has(flight.origin)) airports.set(flight.origin, originCoord);
                    if (!airports.has(flight.destination)) airports.set(flight.destination, destCoord);

                    allCoords.push(originCoord);
                    allCoords.push(destCoord);
                }
            });
        });

        // Sort flights by time
        allFlights.sort((a, b) => a.startTime - b.startTime);

        // Calculate Airport Visits (12h Stopover Rule)
        const airportCounts = {};

        allFlights.forEach((flight, i) => {
            // ALWAYS count origin
            airportCounts[flight.origin] = (airportCounts[flight.origin] || 0) + 1;

            // Check destination
            let countDestination = true;
            const nextFlight = allFlights[i + 1];

            if (nextFlight) {
                const isConnection = nextFlight.origin === flight.destination;

                if (isConnection) {
                    // Check time difference
                    const diffMs = nextFlight.startTime - flight.endTime;
                    const diffHours = diffMs / (1000 * 60 * 60);

                    // If connection is < 12h, it's a stopover/transit -> Do NOT count
                    if (diffHours <= 12 && diffHours >= 0) {
                        countDestination = false;
                    }
                }
            }

            if (countDestination) {
                airportCounts[flight.destination] = (airportCounts[flight.destination] || 0) + 1;
            }
        });

        // Identify Top 5 Airports
        const topAirportsList = Object.entries(airportCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([code, count], index) => ({ code, count, index }));

        const topAirportsMap = new Map(topAirportsList.map(a => [a.code, a]));

        // Identify Top 5 Routes
        const topRoutesList = Object.entries(routeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([key, count], index) => ({ key, count, index }));

        const topRoutesMap = new Map(topRoutesList.map(r => [r.key, r]));

        return {
            flightPaths: paths,
            uniqueAirports: Array.from(airports.entries()),
            bounds: allCoords.length > 0 ? L.latLngBounds(allCoords) : null,
            topRoutes: topRoutesMap,
            topAirports: topAirportsMap,
            airportCounts
        };
    }, [trips, airportCoords]);

    const topColors = [
        '#FFD700', // Gold
        '#FF8C00', // Dark Orange
        '#FF1493', // Deep Pink
        '#00CED1', // Dark Cyan
        '#32CD32'  // Lime Green
    ];

    const getRouteStyle = (routeKey) => {
        const top = topRoutes.get(routeKey);
        if (top) {
            return {
                color: topColors[top.index],
                weight: 3,
                opacity: 0.8,
                count: top.count
            };
        }
        return {
            color: 'var(--color-primary)',
            weight: 1.5,
            opacity: 0.4,
            count: 0
        };
    };

    const getAirportStyle = (code) => {
        const top = topAirports.get(code);
        const count = airportCounts[code] || 0;
        if (top) {
            return {
                color: topColors[top.index],
                size: 10,
                count
            };
        }
        return {
            color: 'var(--color-primary)',
            size: 6,
            count
        };
    };

    // CartoDB Dark Matter theme for a premium look
    const tileLayerUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    return (
        <div className="card" style={{ height: '650px', padding: 0, overflow: 'hidden', marginBottom: '2rem', border: 'none' }}>
            <MapContainer
                center={[20, 0]}
                zoom={2}
                minZoom={2}
                worldCopyJump={true}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url={tileLayerUrl}
                    attribution={attribution}
                />

                {flightPaths.map(path => {
                    const style = getRouteStyle(path.routeKey);
                    return (
                        <React.Fragment key={path.id}>
                            {path.segments.map((segment, idx) => (
                                <Polyline
                                    key={`${path.id}-seg-${idx}`}
                                    positions={segment}
                                    pathOptions={{
                                        color: style.color,
                                        weight: style.weight,
                                        opacity: style.opacity,
                                        lineCap: 'round'
                                    }}
                                >
                                    <Popup>
                                        <strong>{path.flight.airline} {path.flight.flightNumber}</strong><br />
                                        {path.flight.origin} → {path.flight.destination}<br />
                                        {path.flight.start?.date}
                                        {style.count > 0 && <><br /><strong>Flights on this route: {style.count}</strong></>}
                                    </Popup>
                                </Polyline>
                            ))}
                        </React.Fragment>
                    );
                })}

                {uniqueAirports.map(([code, coord]) => {
                    const style = getAirportStyle(code);
                    return (
                        <Marker
                            key={code}
                            position={coord}
                            icon={L.divIcon({
                                className: 'custom-marker',
                                html: `<div style="background-color: ${style.color}; width: ${style.size}px; height: ${style.size}px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.4);"></div>`,
                                iconSize: [style.size, style.size],
                                iconAnchor: [style.size / 2, style.size / 2]
                            })}
                        >
                            <Popup>
                                <strong>Airport: {code}</strong>
                                <br />Total visits: {style.count}
                            </Popup>
                        </Marker>
                    );
                })}

                {bounds && <SetBounds bounds={bounds} />}
            </MapContainer>
        </div>
    );
};

export default FlightMap;
