import { GoogleGenerativeAI } from "@google/generative-ai";
import { BirthData, NatalChart, type InsertNatalChart } from "@shared/schema";
import { log } from "./vite";

// Initialize the Gemini API with the API key
// Hardcoded API key - in production, use environment variables instead
const apiKey = "AIzaSyBdDVJrXw3Jpo27cuT5CuvM-o4BRUhIW0Y"; // process.env.GEMINI_API_KEY
console.log("Using Gemini API key:", apiKey ? "Key is set" : "Key is NOT set");

// Initialize the API client
const genAI = new GoogleGenerativeAI(apiKey);

// Model configuration
const geminiPro = genAI.getGenerativeModel({ 
  model: "gemini-1.0-pro",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  }
});

/**
 * Generate a natal chart based on birth data
 */
export async function generateNatalChart(birthData: BirthData): Promise<InsertNatalChart> {
  try {
    log("Generating natal chart with Gemini AI", "gemini");
    
    // Validate birth data
    if (!birthData.birthLatitude || !birthData.birthLongitude) {
      throw new Error("Birth location coordinates (latitude/longitude) are required for chart generation");
    }
    
    // Create prompt for Gemini to generate the natal chart
    const prompt = `
      Generate a detailed astrological natal chart based on the following birth information:
      
      Birth Date: ${birthData.birthDate}
      Birth Time: ${birthData.birthTime || "Unknown"}
      Birth Location: ${birthData.birthLocation || "Unknown"}
      Birth Latitude: ${birthData.birthLatitude || "Unknown"}
      Birth Longitude: ${birthData.birthLongitude || "Unknown"}
      
      Please analyze this birth data and provide the following astrological information in JSON format:
      
      {
        "sunSign": "zodiac sign of the sun",
        "moonSign": "zodiac sign of the moon",
        "ascendantSign": "zodiac sign of the ascendant/rising sign",
        "mercurySign": "zodiac sign of mercury",
        "venusSign": "zodiac sign of venus",
        "marsSign": "zodiac sign of mars",
        "jupiterSign": "zodiac sign of jupiter",
        "saturnSign": "zodiac sign of saturn",
        "uranusSign": "zodiac sign of uranus",
        "neptuneSign": "zodiac sign of neptune",
        "plutoSign": "zodiac sign of pluto",
        "houses": "brief description of significant house placements",
        "aspects": "brief description of significant aspects between planets"
      }
      
      Please ensure the response is in proper JSON format. Use standard astrological calculations based on the birth details. The signs should be one of: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, or pisces.
    `;
    
    // Generate content with Gemini
    const result = await geminiPro.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response as JSON
    try {
      // Extract JSON from the response if it's embedded in text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      
      // Parse the JSON
      const natalChartData = JSON.parse(jsonStr);
      
      // Format the result for database insertion
      const chartResult: InsertNatalChart = {
        userId: birthData.userId,
        sunSign: natalChartData.sunSign?.toLowerCase() || null,
        moonSign: natalChartData.moonSign?.toLowerCase() || null,
        ascendantSign: natalChartData.ascendantSign?.toLowerCase() || null,
        mercurySign: natalChartData.mercurySign?.toLowerCase() || null,
        venusSign: natalChartData.venusSign?.toLowerCase() || null,
        marsSign: natalChartData.marsSign?.toLowerCase() || null,
        jupiterSign: natalChartData.jupiterSign?.toLowerCase() || null,
        saturnSign: natalChartData.saturnSign?.toLowerCase() || null,
        uranusSign: natalChartData.uranusSign?.toLowerCase() || null,
        neptuneSign: natalChartData.neptuneSign?.toLowerCase() || null,
        plutoSign: natalChartData.plutoSign?.toLowerCase() || null,
        houses: natalChartData.houses || null,
        aspects: natalChartData.aspects || null,
        chartData: JSON.stringify(natalChartData)
      };
      
      return chartResult;
    } catch (jsonError) {
      console.error("Failed to parse Gemini response as JSON:", jsonError);
      console.log("Raw response:", text);
      
      // Fallback with some default values if we can't parse the JSON
      return {
        userId: birthData.userId,
        sunSign: "unknown",
        moonSign: "unknown",
        ascendantSign: "unknown",
        chartData: JSON.stringify({})
      };
    }
    
  } catch (error) {
    console.error("Error generating natal chart with Gemini:", error);
    throw new Error(`Failed to generate natal chart: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate astrological insights for spiritual discussions
 */
export async function generateAstrologicalInsights(natalChart: NatalChart, topic: string): Promise<{
  astrologicalContext: string,
  kabbalisticElements?: string
}> {
  try {
    log("Generating astrological insights with Gemini AI", "gemini");
    
    // Create prompt for Gemini to generate insights
    const prompt = `
      Generate astrological insights and potential Kabbalistic connections for a spiritual discussion.
      
      Natal Chart Information:
      - Sun Sign: ${natalChart.sunSign || "Unknown"}
      - Moon Sign: ${natalChart.moonSign || "Unknown"}
      - Ascendant Sign: ${natalChart.ascendantSign || "Unknown"}
      - Mercury Sign: ${natalChart.mercurySign || "Unknown"}
      - Venus Sign: ${natalChart.venusSign || "Unknown"}
      - Mars Sign: ${natalChart.marsSign || "Unknown"}
      - Jupiter Sign: ${natalChart.jupiterSign || "Unknown"}
      - Saturn Sign: ${natalChart.saturnSign || "Unknown"}
      
      Discussion Topic: ${topic}
      
      Please provide two sections in your response:
      
      1. "Astrological Context": Explain how this topic relates to the person's natal chart, including relevant planetary influences, aspects, and astrological timings.
      
      2. "Kabbalistic Elements": Suggest connections between the discussion topic, the person's astrological profile, and Kabbalistic concepts such as the Tree of Life, Sephirot, Hebrew letters, or other mystical Jewish traditions.
      
      Format your response as JSON with these two keys.
    `;
    
    // Generate content with Gemini
    const result = await geminiPro.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response as JSON
    try {
      // Extract JSON from the response if it's embedded in text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      
      // Parse the JSON
      const insights = JSON.parse(jsonStr);
      
      return {
        astrologicalContext: insights.astrologicalContext || "",
        kabbalisticElements: insights.kabbalisticElements || ""
      };
    } catch (jsonError) {
      console.error("Failed to parse Gemini insights response as JSON:", jsonError);
      
      // If we can't parse JSON, extract sections from text
      const astroMatch = text.match(/Astrological Context:?([\s\S]*?)(?=Kabbalistic Elements:|$)/i);
      const kabbalahMatch = text.match(/Kabbalistic Elements:?([\s\S]*?)(?=$)/i);
      
      return {
        astrologicalContext: astroMatch ? astroMatch[1].trim() : "Unable to generate astrological context.",
        kabbalisticElements: kabbalahMatch ? kabbalahMatch[1].trim() : "Unable to generate Kabbalistic elements."
      };
    }
    
  } catch (error) {
    console.error("Error generating astrological insights with Gemini:", error);
    return {
      astrologicalContext: "Unable to generate insights at this time. Please try again later.",
      kabbalisticElements: "Unable to generate Kabbalistic connections at this time."
    };
  }
}