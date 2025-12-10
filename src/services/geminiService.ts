import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WorkoutLog, NutritionGoal, DietPlan } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
console.log("DEBUG: VITE_GEMINI_API_KEY available:", !!import.meta.env.VITE_GEMINI_API_KEY);
console.log("DEBUG: apiKey length:", apiKey.length);
const genAI = new GoogleGenAI({ apiKey });

// Helper to convert file to base64 with mime type
export const fileToGenerativePart = async (file: File): Promise<{ mimeType: string, data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data
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
    const systemPrompt = `
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
    `;

    const parts: any[] = [{ text: systemPrompt }];

    // Add User Input (Text or File)
    if (input.text) {
      parts.push({ text: `WOD Text Description:\n${input.text}` });
    } else if (input.file) {
      parts.push({
        inlineData: {
          mimeType: input.file.mimeType,
          data: input.file.data
        }
      });
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            durationMinutes: { type: Type.NUMBER },
            calories: { type: Type.NUMBER },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  weight: { type: Type.STRING },
                  reps: { type: Type.STRING }
                }
              }
            }
          },
          required: ["name", "description", "durationMinutes", "calories", "exercises"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);

  } catch (error) {
    console.error("Error analyzing WOD:", error);
    throw error;
  }
};

export const evaluatePerformance = async (log: WorkoutLog, user: UserProfile): Promise<{ xpEarned: number, newLevel: string | null, feedback: string }> => {
  try {
    const prompt = `
      Evaluate the user's performance in this CrossFit workout to award XP and determine if they should level up.

      User Profile:
      - Current Level: ${user.fitnessLevel}
      - Current XP: ${user.xp}
      - Weight: ${user.weight}kg
      - Gender: ${user.gender}

      Workout Performed:
      - Name: ${log.name}
      - Description: ${log.description}
      - Duration: ${log.durationMinutes} min
      - Exercises & Weights: ${JSON.stringify(log.exercises)}

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
      Return JSON.
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            xpEarned: { type: Type.NUMBER },
            newLevel: { type: Type.STRING, enum: ['beginner', 'intermediate', 'rx', 'elite', null], nullable: true },
            feedback: { type: Type.STRING }
          },
          required: ["xpEarned", "feedback"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error evaluating performance:", error);
    // Fallback
    return { xpEarned: 50, newLevel: null, feedback: "¡Buen trabajo! Sigue así." };
  }
};

// Kept for backward compatibility if needed, but analyzeWod handles it now
export const analyzeWodImage = async (base64Image: string, user: UserProfile): Promise<Partial<WorkoutLog>> => {
  return analyzeWod({ file: { mimeType: 'image/jpeg', data: base64Image } }, user);
}

export const generateHomeWorkout = async (user: UserProfile, difficulty?: string): Promise<any> => {
  try {
    const prompt = `
      Create a challenging Home CrossFit Workout for this user:
      - Age: ${user.age}
      - Gender: ${user.gender}
      - Fitness Level: ${difficulty || user.fitnessLevel} (IMPORTANT: Adjust intensity to this specific level)
      - Available Equipment: ${user.equipment && user.equipment.length > 0 ? user.equipment.join(', ') : 'None (Bodyweight only)'}
      - Location: ${user.country || 'General'}

      The workout should follow a standard CrossFit structure: Warmup, Skill/Strength, WOD, and Cooldown.
      
      IMPORTANT:
      1. If the user has equipment, incorporate it intelligently into the workout.
      2. Ensure the workout is DIFFERENT from typical bodyweight routines if equipment is available.
      3. Focus on variety and high intensity.
      4. **Difficulty Level**: The user explicitly requested a **${difficulty || user.fitnessLevel}** workout. Ensure the scaling, reps, and movements match this level perfectly.

      IMPORTANT: Return a structured JSON with a 'sections' array.
      Each section (Warmup, Skill, WOD, Cooldown) must have an 'exercises' array.
      Each exercise must have:
      - name: string
      - instruction: string (reps, sets, or specific details)
      - durationSeconds: number (0 if it's for reps, otherwise the time in seconds for the timer)
      
      Provide a motivational quote at the end in 'tips'.
      IMPORTANT: RESPOND IN SPANISH.
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            estimatedCalories: { type: Type.NUMBER },
            tips: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        instruction: { type: Type.STRING },
                        durationSeconds: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating workout:", error);
    throw error;
  }
};

export const analyzeFood = async (imageBase64: string): Promise<any> => {
  try {
    const prompt = `
      Act as an expert nutritionist. Analyze this image of a meal.
      Identify the food items present.
      Estimate the total calories and breakdown of macronutrients (Protein, Carbs, Fat).
      Provide a brief, actionable health tip regarding this meal.

      CRITICAL INSTRUCTION: If the image is blurry, dark, or the food is not clearly identifiable, DO NOT FAIL.
      Instead, make your BEST EXPERT GUESS based on the general context, colors, and shapes.
      Assume standard portion sizes if not clear.
      It is better to provide an estimation than to say "I cannot analyze this".

      IMPORTANT: Return ONLY a valid JSON object with this structure:
      {
        "foodItems": ["item1", "item2"],
        "calories": number,
        "macros": {
          "protein": number,
          "carbs": number,
          "fat": number
        },
        "tips": "string"
      }
      Respond in Spanish.
    `;

    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);


  } catch (error) {
    console.error("Error analyzing food:", error);
    throw error;
  }
};

export const generateDietPlan = async (user: UserProfile, goal: NutritionGoal): Promise<DietPlan> => {
  try {
    const prompt = `
      Act as an expert sports nutritionist. Create a daily diet plan for a CrossFit athlete.
      
      User Profile:
      - Weight: ${user.weight}kg
      - Height: ${user.height}cm
      - Age: ${user.age}
      - Gender: ${user.gender}
      - Activity Level: High (CrossFit)
      - Location/Country: ${user.country || 'General'}
      - Goal: ${goal} (lose_weight, gain_muscle, maintain, performance)

      Tasks:
      1. Calculate target daily calories and macros (Protein, Carbs, Fat) for this specific goal.
      2. Suggest 4 meals (Breakfast, Lunch, Dinner, Snack) that fit these macros.
      3. **CRITICAL**: The menu MUST be based on the cuisine and available ingredients of **${user.country || 'the user\'s region'}**.
      4. **CRITICAL**: Generate a **UNIQUE and DIFFERENT** menu every time this is called. Do not repeat generic suggestions. Be creative with the daily menu.

      IMPORTANT: Return ONLY a valid JSON object with this structure:
      {
        "goal": "${goal}",
        "dailyCalories": number,
        "macros": {
          "protein": number,
          "carbs": number,
          "fat": number
        },
        "meals": [
          { "name": "Meal Name", "description": "Brief description of ingredients (Local style)", "calories": number }
        ]
      }
      Respond in Spanish.
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);

  } catch (error) {
    console.error("Error generating diet plan:", error);
    throw error;
  }
};