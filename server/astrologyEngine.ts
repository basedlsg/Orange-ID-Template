
export function calculateNatalChart({ utcDateTime, latitude, longitude }) {
  try {
    // Basic validation
    if (!utcDateTime || !latitude || !longitude) {
      throw new Error("Missing required parameters for natal chart calculation");
    }

    // Return dummy data for now - implement actual calculation later
    return {
      planets: [],
      houses: [],
      aspects: []
    };
  } catch (error) {
    console.error("Error calculating natal chart:", error);
    throw new Error("Failed to calculate natal chart. Please try again later.");
  }
}
