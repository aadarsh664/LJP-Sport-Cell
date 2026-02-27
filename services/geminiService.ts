import { GoogleGenAI } from "@google/genai";

// Helper to get client with current key (handles Veo/Pro constraints)
const getClient = async (isProModel: boolean = false): Promise<GoogleGenAI> => {
    let apiKey = process.env.API_KEY;

    if (isProModel) {
        if ((window as any).aistudio) {
             const hasKey = await (window as any).aistudio.hasSelectedApiKey();
             if (!hasKey) {
                 await (window as any).aistudio.openSelectKey();
             }
        }
        // When using the AI Studio picker, the key is injected into env
        apiKey = process.env.API_KEY; 
    }

    if (!apiKey) {
        console.warn("No API Key found. Ensure environment variable or AI Studio selection.");
    }

    return new GoogleGenAI({ apiKey: apiKey });
};

// Image Generation using Nano Banana Pro (Gemini 3 Pro Image)
export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string | null> => {
    try {
        const ai = await getClient(true); // Force API key selection
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    imageSize: size,
                    aspectRatio: "1:1" // Default square
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        throw error;
    }
};

// Image Editing using Nano Banana (Gemini 2.5 Flash Image)
export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
    try {
        const ai = await getClient(false);
        // Clean base64 header if present
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: cleanBase64,
                            mimeType: 'image/jpeg' // Assuming standard upload
                        }
                    },
                    { text: prompt }
                ]
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Gemini Edit Error:", error);
        throw error;
    }
};