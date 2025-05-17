
export function calculateNatalChart({ utcDateTime, latitude, longitude }) {
  try {
    // Log the inputs received by the function
    console.log('astrologyEngine received details:', JSON.stringify({ utcDateTime, latitude, longitude }, null, 2));
    
    // Basic validation
    if (!utcDateTime || !latitude || !longitude) {
      throw new Error("Missing required parameters for natal chart calculation");
    }

    // Build the chart data 
    const chartData = {
      julianDay: 0, // Would normally calculate this from utcDateTime
      planets: [],
      houses: [],
      aspects: []
    };
    
    // Log the final chart data before returning
    console.log('Final chartData from astrologyEngine:', JSON.stringify(chartData, null, 2));
    
    return chartData;
  } catch (error) {
    console.error("Error calculating natal chart:", error);
    throw new Error("Failed to calculate natal chart. Please try again later.");
  }
}
