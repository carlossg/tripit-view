import React, { useState, useMemo, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { parseTrips, calculateStats } from './utils/parser';

const STORAGE_KEY = 'tripit_viewer_data';
const TRAVELERS_KEY = 'tripit_selected_travelers';

const MANUAL_COUNTRIES_KEY = 'tripit_manual_countries';

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

  const [iataToCountry, setIataToCountry] = useState({});
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(!rawData);
  const [selectedTravelers, setSelectedTravelers] = useState(() => {
    try {
      const saved = localStorage.getItem(TRAVELERS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [manualVisitedCountries, setManualVisitedCountries] = useState(() => {
    try {
      const saved = localStorage.getItem(MANUAL_COUNTRIES_KEY);
      if (!saved) return {};

      const parsed = JSON.parse(saved);

      // Clean up corrupted data (remove array indices, keep only ISO code keys with boolean values)
      const cleaned = {};
      for (const [key, value] of Object.entries(parsed)) {
        // Only keep entries where key is a valid ISO code (2 letters) and value is boolean
        if (key.length === 2 && /^[A-Z]{2}$/i.test(key) && typeof value === 'boolean') {
          cleaned[key.toUpperCase()] = value;
        }
      }

      // If we cleaned anything, save the cleaned version
      if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
        console.log('Cleaned corrupted manualVisitedCountries data');
        localStorage.setItem(MANUAL_COUNTRIES_KEY, JSON.stringify(cleaned));
      }

      return cleaned;
    } catch (e) {
      console.error('Failed to load manual countries:', e);
      return {};
    }
  });

  // Load sample data if no user data exists
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || '/';

    // Load IATA to Country mapping
    fetch(`${baseUrl}iata_to_country.json`)
      .then(r => r.json())
      .then(data => setIataToCountry(data))
      .catch(err => console.error('Failed to load iata mapping:', err));

    if (!rawData) {
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
    if (rawData && !isSample) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
      } catch (e) {
        console.warn('LocalStorage quota exceeded:', e);
      }
    }
  }, [rawData, isSample]);

  // Sync selectedTravelers to localStorage
  useEffect(() => {
    if (selectedTravelers && !isSample) {
      localStorage.setItem(TRAVELERS_KEY, JSON.stringify(selectedTravelers));
    }
  }, [selectedTravelers, isSample]);

  // Sync manualVisitedCountries to localStorage
  useEffect(() => {
    localStorage.setItem(MANUAL_COUNTRIES_KEY, JSON.stringify(manualVisitedCountries));
  }, [manualVisitedCountries]);

  const toggleCountryVisited = (isoCode) => {
    setManualVisitedCountries(prev => {
      const isCurrentlyVisited = stats.countriesVisited.has(isoCode);
      const isAutomated = automatedStats.countriesVisited.has(isoCode);
      const nextStatus = !isCurrentlyVisited;

      const nextOverrides = { ...prev };
      if (nextStatus === isAutomated) {
        delete nextOverrides[isoCode];
      } else {
        nextOverrides[isoCode] = nextStatus;
      }
      return nextOverrides;
    });
  };

  const onDataLoaded = (data) => {
    // Check if this is a bundled TripIt Viewer export
    if (data._tripitViewerExport && data.rawData) {
      setRawData(data.rawData);
      setManualVisitedCountries(data.manualVisitedCountries || {});
      setIsSample(false);
    } else {
      // Regular TripIt JSON export
      setRawData(data);
      setIsSample(false);
    }
  };

  // Derive everything from rawData and selection
  const { filteredTrips, stats, automatedStats, allTravelers } = useMemo(() => {
    if (!rawData) return { filteredTrips: [], stats: null, automatedStats: null, allTravelers: [] };

    const parsedTrips = parseTrips(rawData);

    // Get all unique travelers
    const travelersSet = new Set();
    parsedTrips.forEach(t => t.travelers?.forEach(tr => travelersSet.add(tr)));
    const travelersArray = Array.from(travelersSet).sort();

    // Filter trips
    const filtered = selectedTravelers && selectedTravelers.length > 0
      ? parsedTrips.filter(t => t.travelers?.some(tr => selectedTravelers.includes(tr)))
      : parsedTrips;

    const calculatedStats = calculateStats(filtered, iataToCountry);

    // Deep copy for automated stats reference
    const automated = { ...calculatedStats };
    automated.countriesVisited = new Set(calculatedStats.countriesVisited);
    automated.uniqueCountries = [...calculatedStats.uniqueCountries];

    // Apply overrides
    if (calculatedStats) {
      Object.entries(manualVisitedCountries).forEach(([code, isVisited]) => {
        if (isVisited) {
          calculatedStats.countriesVisited.add(code);
        } else {
          calculatedStats.countriesVisited.delete(code);
        }
      });
      calculatedStats.uniqueCountries = Array.from(calculatedStats.countriesVisited).sort();
      calculatedStats.countriesCount = calculatedStats.uniqueCountries.length;

      // Attach raw data for export
      calculatedStats._rawData = rawData;
    }

    return {
      filteredTrips: filtered,
      stats: calculatedStats,
      automatedStats: automated,
      allTravelers: travelersArray
    };
  }, [rawData, selectedTravelers, iataToCountry, manualVisitedCountries]);

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
      automatedStats={automatedStats}
      allTravelers={allTravelers}
      selectedTravelers={selectedTravelers}
      manualVisitedCountries={manualVisitedCountries}
      isSample={isSample}
      onTravelersChange={setSelectedTravelers}
      onToggleCountry={toggleCountryVisited}
      onDataLoaded={onDataLoaded}
    />
  );
}

export default App;
