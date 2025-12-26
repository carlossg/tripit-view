import React, { useState, useMemo, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { parseTrips, calculateStats } from './utils/parser';

const STORAGE_KEY = 'tripit_viewer_data';
const TRAVELERS_KEY = 'tripit_selected_travelers';

function App() {
  const [rawData, setRawData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      return null;
    } catch (e) {
      console.error('Failed to load data from localStorage:', e);
      return null;
    }
  });

  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(!rawData);

  const [selectedTravelers, setSelectedTravelers] = useState(() => {
    try {
      const saved = localStorage.getItem(TRAVELERS_KEY);
      return saved ? JSON.parse(saved) : null; // null means "select all"
    } catch (e) {
      return null;
    }
  });

  // Load sample data if no user data exists
  useEffect(() => {
    if (!rawData) {
      const baseUrl = import.meta.env.BASE_URL || '/';
      fetch(`${baseUrl}sample-data.json`)
        .then(r => r.json())
        .then(data => {
          setRawData(data);
          setIsSample(true);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load sample data:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Sync rawData to localStorage
  useEffect(() => {
    if (rawData) {
      // Don't save sample data to localStorage as "user data"
      if (!isSample) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
        } catch (e) {
          console.warn('LocalStorage quota exceeded:', e);
        }
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [rawData, isSample]);

  // Sync selectedTravelers to localStorage
  useEffect(() => {
    if (selectedTravelers && !isSample) {
      localStorage.setItem(TRAVELERS_KEY, JSON.stringify(selectedTravelers));
    } else {
      localStorage.removeItem(TRAVELERS_KEY);
    }
  }, [selectedTravelers, isSample]);

  // Derive everything from rawData and selection
  const { filteredTrips, stats, allTravelers } = useMemo(() => {
    if (!rawData) return { allTrips: [], filteredTrips: [], stats: null, allTravelers: [] };

    const parsedTrips = parseTrips(rawData);

    // Get all unique travelers from all parsed trips
    const travelersSet = new Set();
    parsedTrips.forEach(t => t.travelers?.forEach(tr => travelersSet.add(tr)));
    const travelersArray = Array.from(travelersSet).sort();

    // Filter trips
    const filtered = selectedTravelers && selectedTravelers.length > 0
      ? parsedTrips.filter(t => t.travelers?.some(tr => selectedTravelers.includes(tr)))
      : parsedTrips;

    const calculatedStats = calculateStats(filtered);

    return {
      filteredTrips: filtered,
      stats: calculatedStats,
      allTravelers: travelersArray
    };
  }, [rawData, selectedTravelers]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-text-muted)', fontFamily: 'inherit' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '500' }}>Preparing your journey...</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Data stays in your browser 🔒</div>
        </div>
      </div>
    );
  }

  // We always render Dashboard now. If rawData is somehow missing, Dashboard's internal logic
  // or the initial load effect will eventually populate it.
  return (
    <Dashboard
      trips={filteredTrips}
      stats={stats}
      allTravelers={allTravelers}
      selectedTravelers={selectedTravelers}
      isSample={isSample}
      onTravelersChange={setSelectedTravelers}
      onDataLoaded={(data) => {
        setRawData(data);
        setIsSample(false);
        setSelectedTravelers(null);
      }}
    />
  );
}

export default App;
