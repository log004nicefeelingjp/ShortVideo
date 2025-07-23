
export interface Scene {
  id: number;
  imagePrompt: string;
  narratorScript: string;
  imageUrl: string | null;
}

export interface ScriptData {
    scenes: {
        image_prompt: string;
        narrator_script: string;
    }[];
}