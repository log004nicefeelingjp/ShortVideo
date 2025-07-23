
import { GoogleGenAI, Type } from "@google/genai";
import { ScriptData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const scriptGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        scenes: {
            type: Type.ARRAY,
            description: "An array of scenes for the video.",
            items: {
                type: Type.OBJECT,
                properties: {
                    image_prompt: {
                        type: Type.STRING,
                        description: "A detailed, vivid visual prompt for an AI image generator to create a cinematic, photorealistic image for this scene. Focus on a single, clear subject with a specific action, mood, and setting. Describe camera angles and lighting.",
                    },
                    narrator_script: {
                        type: Type.STRING,
                        description: "A short, engaging narrator script for this scene (1-2 sentences).",
                    },
                },
                 required: ["image_prompt", "narrator_script"]
            },
        },
    },
    required: ["scenes"]
};


export const generateScript = async (topic: string, sceneCount: number): Promise<ScriptData> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `ショート動画のスクリプトを作成してください。
            トピック: 「${topic}」
            シーンの数: ${sceneCount}
            
            各シーンについて、画像生成AI用の詳細なプロンプトと、短いナレーション原稿を提供してください。`,
            config: {
                responseMimeType: "application/json",
                responseSchema: scriptGenerationSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText) as ScriptData;

        if (!parsedData.scenes || !Array.isArray(parsedData.scenes)) {
             throw new Error("Invalid script format received from API.");
        }
        
        return parsedData;

    } catch (error) {
        console.error("Error generating script:", error);
        throw new Error("スクリプトの生成に失敗しました。");
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: `cinematic, photorealistic, high detail, ${prompt}`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '9:16',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("画像の生成に失敗しました。");
    }
};