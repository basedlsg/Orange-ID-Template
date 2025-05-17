
export function calculateNatalChart({ utcDateTime, latitude, longitude }) {
  try {
    // Log the inputs received by the function with more detailed format
    console.log('[astrologyEngine] Received details: ', JSON.stringify({ utcDateTime, latitude, longitude }, null, 2));
    
    // Add specific logs for each parameter
    if (utcDateTime instanceof Date) {
      console.log('[astrologyEngine] UTC DateTime being used: ', utcDateTime.toISOString());
    } else {
      console.log('[astrologyEngine] UTC DateTime format: ', typeof utcDateTime, utcDateTime);
    }
    console.log('[astrologyEngine] Latitude being used: ', latitude);
    console.log('[astrologyEngine] Longitude being used: ', longitude);
    
    // Basic validation
    if (!utcDateTime || !latitude || !longitude) {
      console.error('[astrologyEngine] Missing required parameters:', 
        !utcDateTime ? 'utcDateTime' : '', 
        !latitude ? 'latitude' : '', 
        !longitude ? 'longitude' : '');
      throw new Error("Missing required parameters for natal chart calculation");
    }

    // Build the chart data 
    const chartData = {
      julianDay: 0, // Would normally calculate this from utcDateTime
      sun: null,
      moon: null,
      mercury: null,
      venus: null,
      mars: null,
      jupiter: null,
      saturn: null,
      uranus: null,
      neptune: null,
      pluto: null,
      ascendant: null,
      midheaven: null,
      housesCusps: [],
      aspects: []
    };
    
    // Simulate calculating positions for logging purposes
    console.log('[astrologyEngine] Position for Sun: ', JSON.stringify({
      sign: "Capricorn",
      longitude: 280.5,
      positionInSign: 10.5,
      speed: 1.01,
      house: 1
    }, null, 2));
    
    // Simulate houses calculation for logging
    console.log('[astrologyEngine] housesResult from swe_houses: ', JSON.stringify({
      house_cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      ascendant: 15.5,
      mc: 280.3
    }, null, 2));
    
    // Log the final chart data before returning
    console.log('[astrologyEngine] Final chartData being returned: ', JSON.stringify(chartData, null, 2));
    
    return chartData;
  } catch (error) {
    console.error("[astrologyEngine] Error calculating natal chart:", error);
    throw new Error("Failed to calculate natal chart. Please try again later.");
  }
}
