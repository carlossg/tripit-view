import { differenceInDays, parseISO, getYear, isValid, isBefore, isAfter, isWithinInterval, eachDayOfInterval, format } from 'date-fns';

/**
 * Fixes mojibake (encoding issues) in strings or objects recursively.
 */
const deepEncodingFix = (obj) => {
    if (!obj) return obj;
    if (typeof obj === 'string') {
        try {
            // Handles UTF-8 bytes that were misread as Latin-1 (e.g., Ã© -> é)
            return decodeURIComponent(escape(obj));
        } catch (e) {
            return obj;
        }
    }
    if (Array.isArray(obj)) {
        return obj.map(deepEncodingFix);
    }
    if (typeof obj === 'object') {
        const fixedObj = {};
        for (const key in obj) {
            fixedObj[key] = deepEncodingFix(obj[key]);
        }
        return fixedObj;
    }
    return obj;
};

const COUNTRY_NAME_TO_ISO = {
    'france': 'FR',
    'frans': 'FR',
    'united kingdom': 'GB',
    'uk': 'GB',
    'great britain': 'GB',
    'united states': 'US',
    'usa': 'US',
    'germany': 'DE',
    'deutschland': 'DE',
    'spain': 'ES',
    'españa': 'ES',
    'italy': 'IT',
    'italia': 'IT',
    'brazil': 'BR',
    'brasil': 'BR',
    'mexico': 'MX',
    'méxico': 'MX',
    'canada': 'CA',
    'australia': 'AU',
    'china': 'CN',
    'japan': 'JP',
    'india': 'IN',
    'netherlands': 'NL',
    'nederland': 'NL',
    'switzerland': 'CH',
    'schweiz': 'CH',
    'suisse': 'CH',
    'belgium': 'BE',
    'belgië': 'BE',
    'belgique': 'BE',
    'portugal': 'PT',
    'austria': 'AT',
    'österreich': 'AT',
    'sweden': 'SE',
    'sverige': 'SE',
    'norway': 'NO',
    'norge': 'NO',
    'denmark': 'DK',
    'danmark': 'DK',
    'finland': 'FI',
    'suomi': 'FI',
    'ireland': 'IE',
    'éire': 'IE',
    'argentina': 'AR',
    'chile': 'CL',
    'colombia': 'CO',
    'peru': 'PE',
    'russia': 'RU',
    'south africa': 'ZA',
    'new zealand': 'NZ',
    'singapore': 'SG',
    'thailand': 'TH',
    'united arab emirates': 'AE',
    'uae': 'AE',
    'turkey': 'TR',
    'türkiye': 'TR',
    'greece': 'GR',
    'hellas': 'GR',
    'poland': 'PL',
    'polska': 'PL',
    'czech republic': 'CZ',
    'czechia': 'CZ',
    'hungary': 'HU',
    'israel': 'IL',
    'egypt': 'EG',
    'morocco': 'MA',
    // ISO3 to ISO2 fallback
    'fra': 'FR',
    'nor': 'NO',
    'gbr': 'GB',
    'usa': 'US',
    'deu': 'DE',
    'esp': 'ES',
    'ita': 'IT',
    'can': 'CA',
    'aus': 'AU',
    'jpn': 'JP',
    'chn': 'CN',
    'ind': 'IN',
    'nld': 'NL',
    'che': 'CH',
    'bel': 'BE',
    'prt': 'PT',
    'aut': 'AT',
    'swe': 'SE',
    'dnk': 'DK',
    'fin': 'FI',
    'irl': 'IE',
    'tha': 'TH',
    'tur': 'TR'
};

const resolveCountryCode = (val) => {
    if (!val) return null;
    let clean = val.trim().toLowerCase();

    // Basic cleaning (e.g. remove "the " from "The Netherlands")
    if (clean.startsWith('the ')) clean = clean.slice(4);

    // Exact 2-letter ISO code
    if (clean.length === 2 && /^[a-z]{2}$/i.test(clean)) return clean.toUpperCase();

    // Check direct mapping (full names or ISO3)
    if (COUNTRY_NAME_TO_ISO[clean]) return COUNTRY_NAME_TO_ISO[clean];

    // Check for 2-letter code at the end (e.g., "Paris, FR" or "London GB")
    const last2Match = clean.match(/[\s,]([a-z]{2})$/i);
    if (last2Match) return last2Match[1].toUpperCase();

    // Check if any known country name appears as a word in the string
    // This handles "Oslo, Norway", "Norway (Europe)", "France - Paris", etc.
    for (const [name, iso] of Object.entries(COUNTRY_NAME_TO_ISO)) {
        if (clean.includes(name)) {
            const index = clean.indexOf(name);
            // Word boundary check: character before and after should not be a letter
            const charBefore = index > 0 ? clean[index - 1] : ' ';
            const charAfter = index + name.length < clean.length ? clean[index + name.length] : ' ';

            if (!/[a-z]/.test(charBefore) && !/[a-z]/.test(charAfter)) {
                return iso;
            }
        }
    }

    return null;
};

export const parseTrips = (jsonData) => {
    if (!jsonData || !jsonData.Trips) return [];

    return jsonData.Trips.map(rawTrip => {
        const trip = deepEncodingFix(rawTrip);
        const data = trip.TripData || {};
        const objects = trip.Objects || [];

        // Extract Traveler Names
        const travelersSet = new Set();
        const normalizeName = (t) => {
            if (!t || !t.first_name) return null;
            const first = t.first_name.trim();
            if (!first) return null;
            return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
        };

        objects.forEach(obj => {
            const rawTravelers = obj.Traveler ? (Array.isArray(obj.Traveler) ? obj.Traveler : [obj.Traveler]) : [];
            const rawGuests = obj.Guest ? (Array.isArray(obj.Guest) ? obj.Guest : [obj.Guest]) : [];
            [...rawTravelers, ...rawGuests].forEach(t => {
                const name = normalizeName(t);
                if (name) travelersSet.add(name);
            });
        });

        const travelers = Array.from(travelersSet).sort();

        // Parse all objects into a unified timeline
        const timeline = [];
        const flights = []; // Keep for stats

        objects.forEach(obj => {
            let type = 'other';
            let details = {};

            const startDate = obj.StartDateTime?.date ? new Date(obj.StartDateTime.date + 'T' + (obj.StartDateTime.time || '00:00') + 'Z') : null; // Simple ISO conversion for sorting
            const endDate = obj.EndDateTime?.date ? new Date(obj.EndDateTime.date + 'T' + (obj.EndDateTime.time || '00:00') + 'Z') : null;

            const objTravelersSet = new Set();
            const rawTravelers = obj.Traveler ? (Array.isArray(obj.Traveler) ? obj.Traveler : [obj.Traveler]) : [];
            const rawGuests = obj.Guest ? (Array.isArray(obj.Guest) ? obj.Guest : [obj.Guest]) : [];

            [...rawTravelers, ...rawGuests].forEach(t => {
                const name = normalizeName(t);
                if (name) objTravelersSet.add(name);
            });
            const objTravelers = Array.from(objTravelersSet).sort();

            // Detect Type
            if (obj.Segment && Object.keys(obj.Segment).length > 0) {
                type = 'flight';
                const rawSegments = Array.isArray(obj.Segment) ? obj.Segment : [obj.Segment];
                const segments = rawSegments.filter(s => s && Object.keys(s).length > 0);

                if (segments.length === 0) {
                    // Flight with no segments (e.g. just traveller info), treat as generic or skip
                    type = 'flight_booking'; // specialized handling or just fallback
                    details = { ...obj };
                } else {
                    segments.forEach(seg => {
                        const flightData = {
                            type: 'flight',
                            name: `Flight to ${seg.end_city_name || seg.end_airport_code || 'Unknown'}`,
                            airline: seg.marketing_airline,
                            flightNumber: seg.marketing_flight_number ? `${seg.marketing_airline_code} ${seg.marketing_flight_number}` : 'Unknown Flight',
                            start: seg.StartDateTime,
                            end: seg.EndDateTime,
                            origin: seg.start_airport_code,
                            destination: seg.end_airport_code,
                            duration: seg.duration,
                            distance: seg.distance,
                            aircraft: seg.aircraft_display_name,
                            airlineCode: seg.marketing_airline_code,
                            travelers: objTravelers
                        };
                        timeline.push(flightData);
                        flights.push(flightData);
                    });
                    return; // Segments pushed individually
                }
            } else if (obj.display_name === 'Flight') {
                // Handle Flight with missing/empty segments
                const flightDate = data.start_date || obj.booking_date;
                const flightData = {
                    type: 'flight',
                    name: 'Flight (Details Unavailable)',
                    airline: obj.booking_site_name || 'Unknown Airline',
                    airlineCode: '',
                    flightNumber: 'Unknown',
                    start: { date: flightDate },
                    end: { date: flightDate },
                    origin: 'Unknown',
                    destination: 'Unknown',
                    duration: 'N/A',
                    distance: '',
                    aircraft: '',
                    travelers: objTravelers
                };
                timeline.push(flightData);
                flights.push(flightData);
            } else if (obj.room_type || (obj.display_name && obj.display_name.toLowerCase().includes('hotel'))) {
                type = 'lodging';
                details = { ...obj, address: obj.Address };
            } else if (obj.display_name && (obj.display_name.toLowerCase().includes('car rental') || obj.supplier_name?.toLowerCase().includes('sixt') || obj.supplier_name?.toLowerCase().includes('hertz'))) {
                type = 'car';
                details = { ...obj };
            } else if (obj.display_name && (obj.display_name.toLowerCase().includes('train') || obj.display_name.toLowerCase().includes('rail'))) {
                type = 'rail';
                details = { ...obj };
            } else {
                type = 'activity'; // Default fallback
                details = { ...obj };
            }

            if (startDate) {
                timeline.push({
                    type,
                    name: obj.display_name || type,
                    start: obj.StartDateTime,
                    end: obj.EndDateTime,
                    details,
                    travelers: objTravelers,
                    ...details // spread generic details
                });
            }
        });

        // Sort timeline
        timeline.sort((a, b) => {
            const da = a.start?.date ? new Date(a.start.date + 'T' + (a.start.time || '00:00')) : new Date(0);
            const db = b.start?.date ? new Date(b.start.date + 'T' + (b.start.time || '00:00')) : new Date(0);
            return da - db;
        });

        const startDate = data.start_date ? parseISO(data.start_date) : null;
        const endDate = data.end_date ? parseISO(data.end_date) : null;
        let days = 0;
        if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
            days = differenceInDays(endDate, startDate) + 1;
        }

        return {
            id: data.id || Math.random().toString(36),
            displayName: data.displayName || data.display_name,
            location: data.primary_location,
            startDate: data.start_date,
            endDate: data.end_date,
            image: data.image_url,
            year: startDate ? getYear(startDate) : null,
            days,
            country: resolveCountryCode(data.PrimaryLocationAddress?.country) || resolveCountryCode(data.primary_location),
            flights,
            travelers,
            timeline
        };
    }).sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(b.startDate) - new Date(a.startDate);
    });
};

export const calculateStats = (trips, iataToCountry = {}) => {
    const stats = {
        totalTrips: trips.length,
        totalFlights: 0,
        totalDistanceMi: 0,
        totalDays: 0,
        countriesVisited: new Set(),
        airlines: {},
        airlineCodes: {}, // Mapping name -> code
        years: {},
        allTravelers: new Set()
    };

    // To handle unique days accurately across overlapping trips
    const allTravelDays = new Set();
    const yearlyTravelDays = {}; // year -> Set
    const monthlyTravelDays = {}; // year-month -> Set

    trips.forEach(trip => {
        if (trip.travelers) {
            trip.travelers.forEach(t => stats.allTravelers.add(t));
        }

        // Add country from trip summary
        if (trip.country) {
            if (trip.country.length === 2) stats.countriesVisited.add(trip.country.toUpperCase());
        }

        // Add countries from hotel/lodging addresses in timeline
        trip.timeline.forEach(item => {
            if (item.type === 'lodging') {
                const country = resolveCountryCode(item.details?.Address?.country || item.address?.country);
                if (country) {
                    stats.countriesVisited.add(country);
                }
            }
        });

        const start = trip.startDate ? parseISO(trip.startDate) : null;
        const end = trip.endDate ? parseISO(trip.endDate) : null;

        if (start && end && isValid(start) && isValid(end)) {
            try {
                const interval = eachDayOfInterval({ start, end });
                interval.forEach(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const yearStr = format(day, 'yyyy');
                    const monthStr = format(day, 'yyyy-MM');

                    allTravelDays.add(dateStr);

                    if (!yearlyTravelDays[yearStr]) yearlyTravelDays[yearStr] = new Set();
                    yearlyTravelDays[yearStr].add(dateStr);

                    if (!monthlyTravelDays[monthStr]) monthlyTravelDays[monthStr] = new Set();
                    monthlyTravelDays[monthStr].add(dateStr);
                });
            } catch (e) {
                console.error('Error calculating interval for trip:', trip.displayName, e);
            }
        }

        // Initialize structures
        const startYear = trip.year || 'Unknown';
        if (startYear !== 'Unknown' && !stats.years[startYear]) {
            stats.years[startYear] = { trips: 0, days: 0, flights: 0, distance: 0, months: {} };
        }

        if (startYear !== 'Unknown') stats.years[startYear].trips += 1;

        // Flight Stats (Trips still have their original flight lists)
        trip.flights.forEach(flight => {
            stats.totalFlights += 1;

            // Add countries from airports
            const originCountry = iataToCountry[flight.origin];
            const destCountry = iataToCountry[flight.destination];
            if (originCountry) stats.countriesVisited.add(originCountry.toUpperCase());
            if (destCountry) stats.countriesVisited.add(destCountry.toUpperCase());

            const fYear = flight.start?.date ? getYear(parseISO(flight.start.date)) : startYear;
            const fDate = flight.start?.date ? parseISO(flight.start.date) : null;
            const fMonth = fDate && isValid(fDate) ? fDate.getMonth() + 1 : 'Unknown';

            if (!stats.years[fYear]) {
                stats.years[fYear] = { trips: 0, days: 0, flights: 0, distance: 0, months: {} };
            }
            stats.years[fYear].flights += 1;

            if (fMonth !== 'Unknown') {
                if (!stats.years[fYear].months[fMonth]) {
                    stats.years[fYear].months[fMonth] = { trips: 0, days: 0, flights: 0, distance: 0 };
                }
                stats.years[fYear].months[fMonth].flights += 1;
            }

            const dist = parseFloat((flight.distance || '0').replace(/,/g, '').split(' ')[0]);
            if (!isNaN(dist)) {
                stats.totalDistanceMi += dist;
                stats.years[fYear].distance += dist;
                if (fMonth !== 'Unknown') stats.years[fYear].months[fMonth].distance += dist;
            }

            const airline = flight.airline || 'Unknown';
            stats.airlines[airline] = (stats.airlines[airline] || 0) + 1;

            if (flight.airlineCode && !stats.airlineCodes[airline]) {
                stats.airlineCodes[airline] = flight.airlineCode;
            }

            // Track airline frequency per year
            if (!stats.years[fYear].airlines) stats.years[fYear].airlines = {};
            stats.years[fYear].airlines[airline] = (stats.years[fYear].airlines[airline] || 0) + 1;
        });
    });

    // Finalize days counts from Sets
    stats.totalDays = allTravelDays.size;

    Object.keys(yearlyTravelDays).forEach(year => {
        if (!stats.years[year]) stats.years[year] = { trips: 0, days: 0, flights: 0, distance: 0, months: {} };
        stats.years[year].days = yearlyTravelDays[year].size;
    });

    Object.keys(monthlyTravelDays).forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthNum = parseInt(month, 10);
        if (!stats.years[year]) stats.years[year] = { trips: 0, days: 0, flights: 0, distance: 0, months: {} };
        if (!stats.years[year].months[monthNum]) {
            stats.years[year].months[monthNum] = { trips: 0, days: 0, flights: 0, distance: 0 };
        }
        stats.years[year].months[monthNum].days = monthlyTravelDays[monthKey].size;
    });

    return {
        ...stats,
        countriesCount: stats.countriesVisited.size,
        uniqueCountries: Array.from(stats.countriesVisited),
        allTravelers: Array.from(stats.allTravelers).sort(),
        topAirlines: Object.entries(stats.airlines)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
    };
};
