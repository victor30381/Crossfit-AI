import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserProfile, WorkoutLog, NutritionGoal, DietPlan } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the API only if the key exists to avoid immediate errors on load, 
// but checks will be performed inside functions.
const genAI = new GoogleGenerativeAI(apiKey || "DUMMY_KEY");

// Helper to convert file to base64 with mime type
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string, mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export interface WodAnalysisInput {
  text?: string;
  file?: {
    mimeType: string;
    data: string;
  };
}

export const analyzeWod = async (input: WodAnalysisInput, user: UserProfile): Promise<Partial<WorkoutLog>> => {
  try {
    if (!apiKey) throw new Error("API Key Missing or Invalid");

    const systemInstruction = `
      Act as an expert CrossFit coach and nutritionist.
      Analyze the provided WOD (Workout of the Day) information.
      The input might be an image of a whiteboard, a PDF document, or raw text pasted by the user.

      User Profile for Context:
      - Weight: ${user.weight}kg
      - Height: ${user.height}cm
      - Age: ${user.age}
      - Gender: ${user.gender}
      - Level: ${user.fitnessLevel}

      Tasks:
      1. Identify the name of the workout (if any, otherwise create a short descriptive name).
      2. Extract or summarize the exercises.
      3. Estimate the duration in minutes (if not specified, estimate based on average Rx times for this user level).
      4. CALCULATE the estimated calories burned for THIS SPECIFIC USER performing this workout. Be precise with the physics of their body weight and intensity.

      IMPORTANT: RESPOND IN SPANISH.
      Return the response in strict JSON format.
      Structure: { "name": "...", "description": "...", "durationMinutes": 0, "calories": 0, "exercises": [{"name": "...", "weight": "...", "reps": "..."}] }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemInstruction
    });

    const parts: any[] = [];

    if (input.text) {
      parts.push({ text: `WOD Text Description:\n${input.text}` });
    }

    if (input.file) {
      parts.push({
        inlineData: {
          data: input.file.data,
          mimeType: input.file.mimeType
        }
      });
    }

    if (parts.length === 0) {
      throw new Error("No input provided for analysis");
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);

  } catch (error) {
    console.error("Error analyzing WOD:", error);
    alert(`Error AI (Analyze WOD): ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

export const evaluatePerformance = async (log: WorkoutLog, user: UserProfile): Promise<{ xpEarned: number, newLevel: string | null, feedback: string }> => {
  try {
    if (!apiKey) throw new Error("API Key Missing");

    const systemInstruction = `
      Evaluate the user's performance in this CrossFit workout to award XP and determine if they should level up.

      User Profile:
      - Current Level: ${user.fitnessLevel}
      - Current XP: ${user.xp}
      - Weight: ${user.weight} kg
      - Gender: ${user.gender}

      Levels Scale (Reference):
      - Beginner: Learning movements, low weights.
      - Intermediate: Consistent movements, moderate weights (e.g., Thruster 30kg).
      - Rx: Standard competition weights (e.g., Thruster 43/30kg, Pull-ups).
      - Elite: Advanced skills (Muscle-ups), heavy weights.

      Task:
      1. Calculate XP earned based on intensity, duration, and weights used relative to their body weight and current level. Base XP is 100. Bonus for heavy weights or PRs.
      2. Determine if the user qualifies for the NEXT level based on this performance (e.g., if Beginner uses Rx weights).
      3. Provide a short, motivating feedback message (max 2 sentences).

      IMPORTANT: RESPOND IN SPANISH.
      Return JSON: { "xpEarned": number, "newLevel": "beginner" | "intermediate" | "rx" | "elite" | null, "feedback": "..." }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemInstruction
    });

    const prompt = `
      Workout Performed:
      - Name: ${log.name}
      - Description: ${log.description}
      - Duration: ${log.durationMinutes} min
      - Exercises & Weights: ${JSON.stringify(log.exercises)}
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);

  } catch (error) {
    console.error("Error evaluating performance:", error);
    alert(`Error AI (Evaluate): ${error instanceof Error ? error.message : String(error)}`);
    return { xpEarned: 50, newLevel: null, feedback: "¡Buen trabajo! Sigue así. (AI Offline)" };
  }
};

export const analyzeWodImage = async (base64Image: string, user: UserProfile): Promise<Partial<WorkoutLog>> => {
  return analyzeWod({ file: { mimeType: 'image/jpeg', data: base64Image } }, user);
}

export const generateHomeWorkout = async (user: UserProfile, difficulty?: string): Promise<any> => {
  try {
    if (!apiKey) throw new Error("API Key Missing");

    const systemInstruction = `
      Create a challenging Home CrossFit Workout for this user.
      The workout should follow a standard CrossFit structure: Warmup, Skill/Strength, WOD, and Cooldown.
      
      IMPORTANT:
      1. If the user has equipment, incorporate it intelligently.
      2. Ensure the workout is DIFFERENT from typical bodyweight routines if equipment is available.
      3. Focus on variety and high intensity.
      4. Difficulty Level: ${difficulty || user.fitnessLevel}.
      
      IMPORTANT: Return a structured JSON with a 'sections' array.
      Structure: {
        "title": "...",
        "estimatedCalories": 0,
        "tips": "...",
        "sections": [
           { 
             "name": "Warmup", 
             "exercises": [ { "name": "...", "instruction": "...", "durationSeconds": 0 } ] 
           }
        ]
      }
      Respond in Spanish.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemInstruction
    });

    const prompt = `
      User Details:
      - Age: ${user.age}
      - Gender: ${user.gender}
      - Fitness Level: ${difficulty || user.fitnessLevel}
      - Available Equipment: ${user.equipment && user.equipment.length > 0 ? user.equipment.join(', ') : 'None (Bodyweight only)'}
      - Location: ${user.country || 'General'}
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);

  } catch (error) {
    console.error("Error generating workout:", error);
    alert(`Error AI (Generate Workout): ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

export const analyzeFood = async (imageBase64: string): Promise<any> => {
  try {
    if (!apiKey) throw new Error("API Key Missing");

    const systemInstruction = `
      Act as an expert nutritionist. Analyze this image of a meal.
      Identify the food items present.
      Estimate the total calories and breakdown of macronutrients (Protein, Carbs, Fat).
      Provide a brief, actionable health tip regarding this meal.

      Structure:
      {
        "foodItems": ["item1", "item2"],
        "calories": number,
        "macros": { "protein": number, "carbs": number, "fat": number },
        "tips": "string"
      }
      Respond in Spanish.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemInstruction
    });

    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]
      }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);

  } catch (error) {
    console.error("Error analyzing food:", error);
    alert(`Error AI (Food): ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

export const analyzeFoodText = async (description: string): Promise<any> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key Missing");

    const systemInstruction = `
      Act as an expert nutritionist. Analyze this text description of a meal.
      Identify the food items present.
      Estimate the total calories and breakdown of macronutrients (Protein, Carbs, Fat).
      Provide a brief, actionable health tip regarding this meal.

      Structure:
      {
        "foodItems": ["item1", "item2"],
        "calories": number,
        "macros": { "protein": number, "carbs": number, "fat": number },
        "tips": "string"
      }
      Respond in Spanish.
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: description }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);

  } catch (error) {
    console.error("Error analyzing food text:", error);
    alert(`Error AI (Food Text): ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

export const generateDietPlan = async (user: UserProfile, goal: NutritionGoal): Promise<DietPlan> => {
  try {
    if (!apiKey) throw new Error("API Key Missing");

    const systemInstruction = `
      Act as an expert sports nutritionist. Create a daily diet plan for a CrossFit athlete.
      
      Structure:
      {
        "goal": "${goal}",
        "dailyCalories": number,
        "macros": { "protein": number, "carbs": number, "fat": number },
        "meals": [ { "name": "...", "description": "...", "calories": number } ]
      }
      Respond in Spanish.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemInstruction
    });

    const prompt = `
      User Profile:
      - Weight: ${user.weight}kg
      - Height: ${user.height}cm
      - Age: ${user.age}
      - Gender: ${user.gender}
      - Activity Level: High (CrossFit)
      - Location/Country: ${user.country || 'General'}
      - Goal: ${goal}
      
      Tasks:
      1. Calculate target daily calories and macros.
      2. Suggest 4 meals (Breakfast, Lunch, Dinner, Snack).
      3. CRITICAL: Based on ${user.country || 'the user\'s region'} cuisine.
      4. Unique and creative menu.
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);

  } catch (error) {
    console.error("Error generating diet plan:", error);
    alert(`Error AI (Diet): ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};