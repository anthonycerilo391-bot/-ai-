

export interface AssetItem {
  id: string;
  type: 'character' | 'scene';
  name: string;
  description?: string; // Visual description extracted from script
  data: string; // base64
  mimeType: string;
  previewUrl: string;
  autoReference?: boolean;
}

export type VideoModel = 'sora-2-all' | 'veo_3_1-fast' | 'grok-video-3';

export interface Scene {
  sceneNumber: number;
  script: string;
  visualPrompt: string;
  visualPromptZh?: string; // Chinese visual prompt
  cameraPrompt: string;
  imageUrl?: string; // Base64 (Currently selected image)
  imageHistory?: string[]; // History of generated images (Base64 strings)
  videoUrl?: string; // Deprecated: Use videoUrls[0]
  videoUrls?: string[]; // Array of generated video URLs
  videoPrompt?: string; // Dedicated prompt for video generation (Veo)
  videoPromptZh?: string; // Chinese video prompt
  videoDuration?: 8 | 10 | 15; // User preference for video length
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
  isGeneratingVideoPrompt?: boolean;
  isTranslatingVisual?: boolean; // UI state for translation loading
  isTranslatingVideo?: boolean;  // UI state for translation loading
  error?: string; // Error message for individual scene generation failure
  // Changed from single object to array of objects (max 3)
  sceneReferenceImages?: Array<{
    data: string;
    mimeType: string;
    previewUrl: string;
    analysis?: string; // The reverse-prompted description in Chinese
    isAnalyzing?: boolean; // Loading state for analysis
  } | undefined>;
}

export interface StyleOption {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  promptModifier: string;
  subStyles?: StyleOption[]; // Support for nested styles
}

export enum AppStep {
  INPUT = 'input',
  SCRIPT = 'script',
  VIDEO_GENERATION = 'video_generation',
}

export interface VideoGenerationConfig {
  resolution: '720p' | '1080p';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
}

export interface ScriptCategory {
  id: string;
  name: string;
  description: string;
  templates: ScriptTemplate[];
}

export interface ScriptOption {
  title: string;
  outline: string;
  content: string;
}