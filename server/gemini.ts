import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { log } from "./vite";
import {
  type BirthData,
  type InsertNatalChart as OriginalInsertNatalChart,
  // type NatalChart, // NatalChart type itself is not directly used in this file's function signatures
} from "@shared/schema"; // Corrected import for types

// Temporary extended type for InsertNatalChart - TODO: Update shared/schema.ts
interface InsertNatalChart extends OriginalInsertNatalChart {
  birthDataId?: number;
  orangeId?: string;
  dominantPlanet?: string;
  dominantSign?: string;
  dominantElement?: string;
  dominantModality?: string;
  chartPattern?: string;
  houseCusps?: Record<string, string>;
  keyLifeThemes?: string[];
  strengths?: string[];
  challenges?: string[];
  careerPathways?: string[];
  relationshipNeeds?: string[];
  spiritualDevelopment?: string[];
  chironSign?: string;
  northNodeSign?: string;
  southNodeSign?: string;
  lilithSign?: string;
  fortuneSign?: string;
  midheavenSign?: string;
  [key: string]: any; // Allow other properties
}

// Temporary type definition for InsertAstrologicalAspect - TODO: Move to shared/schema.ts and define DB table
export interface InsertAstrologicalAspect {
  natalChartId?: number;
  orangeId?: string;
  planet1: string;
  aspectType: string;
  planet2: string;
  orbDegrees?: number | null;
  interpretation: string;
  keywords: string[];
  [key: string]: any;
}

// Bedrock Claude API configuration - ensure these are securely managed
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBdDVJrXw3Jpo27cuT5CuvM-o4BRUhIW0Y";

// Initialize the API client using GoogleGenAI
const genAI = new GoogleGenAI({ apiKey: apiKey });

// Define the generation config to be used by the models
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

// Define safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const MODEL_NAME = "gemini-1.5-flash-latest";

function cleanJsonResponse(text: string): string {
  const match = text.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    return match[1];
  }
  // Fallback for cases where it might just have ``` at start/end without 'json'
  const simplerMatch = text.match(/```([\s\S]*?)```/);
  if (simplerMatch && simplerMatch[1]) {
    return simplerMatch[1];
  }
  return text; // Return original if no markdown code block detected
}

/**
 * Generate a natal chart based on birth data
 */
export async function generateNatalChart(birthData: BirthData, requestOrangeId?: string): Promise<InsertNatalChart> {
  try {
    log("Attempting to generate natal chart", "gemini");
    log(`Incoming birthData for natal chart: ${JSON.stringify(birthData)}`, "gemini");
    log(`birthData.userId for natal chart: ${birthData.userId}`, "gemini");

    if (!birthData.birthLatitude || !birthData.birthLongitude) {
      throw new Error("Birth location coordinates (latitude/longitude) are required for chart generation");
    }

    log("Sending request to Gemini for natal chart", "gemini");

    const geminiPromptString = `
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
        "chironSign": "zodiac sign of chiron",
        "northNodeSign": "zodiac sign of the north node",
        "southNodeSign": "zodiac sign of the south node",
        "lilithSign": "zodiac sign of black moon lilith",
        "fortuneSign": "zodiac sign of the part of fortune",
        "midheavenSign": "zodiac sign of the midheaven (MC)",
        "dominantPlanet": "most influential planet in the chart",
        "dominantSign": "most emphasized zodiac sign in the chart",
        "dominantElement": "most prominent element (fire, earth, air, water)",
        "dominantModality": "most prominent modality (cardinal, fixed, mutable)",
        "chartPattern": "overall pattern of the chart (e.g., bowl, bucket, splash)",
        "houseCusps": {
          "house1": "zodiac sign on the cusp of the 1st house (Ascendant)",
          "house2": "zodiac sign on the cusp of the 2nd house",
          "house3": "zodiac sign on the cusp of the 3rd house",
          "house4": "zodiac sign on the cusp of the 4th house (IC)",
          "house5": "zodiac sign on the cusp of the 5th house",
          "house6": "zodiac sign on the cusp of the 6th house",
          "house7": "zodiac sign on the cusp of the 7th house (Descendant)",
          "house8": "zodiac sign on the cusp of the 8th house",
          "house9": "zodiac sign on the cusp of the 9th house",
          "house10": "zodiac sign on the cusp of the 10th house (MC)",
          "house11": "zodiac sign on the cusp of the 11th house",
          "house12": "zodiac sign on the cusp of the 12th house"
        },
        "keyLifeThemes": ["brief description of a key life theme"],
        "strengths": ["description of a key strength"],
        "challenges": ["description of a key challenge"],
        "careerPathways": ["suggested career pathway based on the chart"],
        "relationshipNeeds": ["description of relationship needs and patterns"],
        "spiritualDevelopment": ["insights into spiritual growth and development"]
      }
      Ensure the entire response is a single, valid JSON object. Do not include any explanatory text before or after the JSON.
      If any specific piece of information (like birth time) is unknown and prevents a precise calculation for a field (e.g., ascendantSign or houseCusps), output "Unknown" for that specific field in the JSON structure.
      It is critical that only the JSON is returned.
    `;
    
    const requestPayload = {
      contents: [{ role: "user", parts: [{ text: geminiPromptString }] }],
      generationConfig,
      safetySettings,
    };
    
    const result = await genAI.models.generateContent({ model: MODEL_NAME, ...requestPayload });
    let responseText = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    log("Raw response from Gemini (natal chart): " + responseText.substring(0, 100) + "...", "gemini");
    responseText = cleanJsonResponse(responseText);
    log("Cleaned response from Gemini (natal chart): " + responseText.substring(0,100) + "...", "gemini");

    log("Received response from Gemini for natal chart", "gemini");
    log("Generated natal chart text (summary)", "gemini");

    const chartData = JSON.parse(responseText) as InsertNatalChart;
    chartData.birthDataId = typeof birthData.id === 'number' ? birthData.id : undefined;
    
    log(`Assigning userId to chartData. Current birthData.userId: ${birthData.userId}`, "gemini");
    chartData.userId = birthData.userId;

    if (requestOrangeId) chartData.orangeId = requestOrangeId;

    log("Successfully parsed natal chart data", "gemini");
    return chartData;

  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    log(`Error in generateNatalChart: ${errorMessage}`, "gemini");
    throw new Error(`Failed to generate natal chart: ${errorMessage}`);
  }
}

/**
 * Generate astrological aspects based on natal chart data
 */
export async function generateAstrologicalAspects(chartData: InsertNatalChart, requestOrangeId?: string): Promise<InsertAstrologicalAspect[]> {
  try {
    log("Attempting to generate astrological aspects", "gemini");

    log("Sending request to Gemini for aspects", "gemini");

    const geminiPromptString = `
      Based on the following natal chart data:
      Sun Sign: ${chartData.sunSign}
      Moon Sign: ${chartData.moonSign}
      Ascendant Sign: ${chartData.ascendantSign}
      Mercury Sign: ${chartData.mercurySign}
      Venus Sign: ${chartData.venusSign}
      Mars Sign: ${chartData.marsSign}
      Jupiter Sign: ${chartData.jupiterSign}
      Saturn Sign: ${chartData.saturnSign}
      Uranus Sign: ${chartData.uranusSign}
      Neptune Sign: ${chartData.neptuneSign}
      Pluto Sign: ${chartData.plutoSign}
      Dominant Planet: ${chartData.dominantPlanet}
      Dominant Sign: ${chartData.dominantSign}

      Please generate a list of significant astrological aspects (e.g., Sun trine Moon, Mars square Saturn).
      For each aspect, provide:
      1. planet1: The first planet or point.
      2. aspectType: The type of aspect (e.g., Conjunction, Sextile, Square, Trine, Opposition).
      3. planet2: The second planet or point.
      4. orbDegrees: The orb of the aspect in degrees (if applicable, otherwise null).
      5. interpretation: A brief interpretation of this aspect's meaning in the context of the chart.
      6. keywords: A few keywords summarizing the aspect.
      Return the response as a JSON array of objects, where each object represents an aspect.
      Example format:
      [
        {"planet1": "Sun", "aspectType": "Trine", "planet2": "Moon", "orbDegrees": 2.5, "interpretation": "Harmony...", "keywords": ["harmony"]},
        {"planet1": "Mars", "aspectType": "Square", "planet2": "Saturn", "orbDegrees": 1.0, "interpretation": "Tension...", "keywords": ["tension"]}
      ]
      Ensure the entire response is a single, valid JSON array. Do not include any explanatory text before or after the JSON.
      It is critical that only the JSON is returned.
    `;
    
    const requestPayload = {
      contents: [{ role: "user", parts: [{ text: geminiPromptString }] }],
      generationConfig,
      safetySettings,
    };
    
    const result = await genAI.models.generateContent({ model: MODEL_NAME, ...requestPayload });
    let responseText = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    log("Raw response from Gemini (aspects): " + responseText.substring(0, 100) + "...", "gemini");
    responseText = cleanJsonResponse(responseText);
    log("Cleaned response from Gemini (aspects): " + responseText.substring(0,100) + "...", "gemini");

    log("Received response from Gemini for aspects", "gemini");
    log("Generated aspects text (summary)", "gemini");

    const aspectsData = JSON.parse(responseText) as InsertAstrologicalAspect[];
    const processedAspects = aspectsData.map(aspect => ({
      ...aspect,
      natalChartId: typeof chartData.id === 'number' ? chartData.id : undefined,
      userId: chartData.userId,
      orangeId: requestOrangeId,
    }));

    log("Successfully parsed aspects data", "gemini");
    return processedAspects;

  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    log(`Error in generateAstrologicalAspects: ${errorMessage}`, "gemini");
    throw new Error(`Failed to generate astrological aspects: ${errorMessage}`);
  }
}