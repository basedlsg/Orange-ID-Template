import { GoogleGenerativeAI } from "@google/generative-ai";
import { BirthData, NatalChart, type InsertNatalChart } from "@shared/schema";
import { log } from "./vite";

// Initialize the Gemini API with the API key
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// Attempt to list available models
async function listAvailableModels() {
  try {
    console.log("Listing available Gemini AI models...");
    const result = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey);
    const data = await result.json();
    console.log("Available models:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error listing Gemini models:", error);
    return null;
  }
}

// Try to list models when initializing
listAvailableModels().catch(err => console.error("Failed to list models:", err));

// Let's try with different model names based on Gemini's latest API
// The model name has changed in the Gemini API
const modelName = "gemini-pro"; // Using the standard name as fallback

console.log("Initializing Gemini AI with model:", modelName);
const geminiPro = genAI.getGenerativeModel({ 
  model: modelName,
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40
  }
});

/**
 * Generate a natal chart based on birth data
 */
export async function generateNatalChart(birthData: BirthData): Promise<InsertNatalChart> {
  try {
    log("Generating natal chart with Gemini AI", "gemini");
    
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
    
  } catch (error: any) {
    console.error("Error generating natal chart with Gemini:", error);
    
    // Provide more detailed error information
    if (error && error.message && typeof error.message === 'string' && error.message.includes("404")) {
      throw new Error("Failed to connect to AI service. The API may have changed. Please check the API key and model name.");
    } else if (error && error.message && typeof error.message === 'string' && error.message.includes("403")) {
      throw new Error("Failed to authenticate with AI service. Please check your API key.");
    } else if (!apiKey || apiKey === "") {
      throw new Error("Missing API key for AI service. Please add GEMINI_API_KEY to your environment.");
    } else {
      throw new Error("Failed to generate natal chart. Please try again later.");
    }
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
    
  } catch (error: any) {
    console.error("Error generating astrological insights with Gemini:", error);
    
    let errorMessage = "Unable to generate insights at this time. Please try again later.";
    
    // Provide more detailed error information
    if (error && error.message && typeof error.message === 'string' && error.message.includes("404")) {
      errorMessage = "Failed to connect to AI service. The API may have changed.";
    } else if (error && error.message && typeof error.message === 'string' && error.message.includes("403")) {
      errorMessage = "Failed to authenticate with AI service. Please check your API key.";
    } else if (!apiKey || apiKey === "") {
      errorMessage = "Missing API key for AI service. Please add GEMINI_API_KEY to your environment.";
    }
    
    return {
      astrologicalContext: errorMessage,
      kabbalisticElements: "Unable to generate Kabbalistic connections at this time."
    };
  }
}