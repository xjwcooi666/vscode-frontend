
import { GoogleGenAI } from "@google/genai";
import { Alert, SensorReading, MetricType } from "../types";
import { METRIC_CONFIG } from '../constants';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this environment, we assume it's always available.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getAlertAnalysis = async (alert: Alert, latestReading: SensorReading): Promise<string> => {
  try {
    const metricConfig = METRIC_CONFIG[alert.metric as MetricType];
    const unit = metricConfig.unit;

    const prompt = `
      You are an expert veterinarian and pig farming consultant. An environmental sensor in a pigsty has triggered an alert.
      
      Alert Details:
      - Pigsty: ${alert.pigstyName}
      - Metric: ${alert.metric}
      - Detected Value: ${alert.value.toFixed(1)} ${unit}
      - Severity: ${alert.level}
      - Threshold Condition: ${alert.message}

      Current Full Environment Readings for this Pigsty:
      - Temperature: ${latestReading.temperature.toFixed(1)}°C
      - Humidity: ${latestReading.humidity.toFixed(1)}%
      - Ammonia (NH3): ${latestReading.ammonia.toFixed(1)} ppm
      - Light Intensity: ${latestReading.light.toFixed(1)} lux

      Based on this information, provide:
      1. **Risk Analysis:** A brief, clear analysis of the potential risks this situation poses to the pigs' health, well-being, and productivity. Be specific about the type of pigs if the name suggests it (e.g., 'Farrowing').
      2. **Recommended Actions:** A numbered list of immediate, practical actions the farm technician should take to mitigate the issue.

      Format your response using Markdown.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text;

  } catch (error) {
    console.error("Error fetching Gemini analysis:", error);
    return "Error: Could not retrieve AI analysis. Please check your connection and API key.";
  }
};
