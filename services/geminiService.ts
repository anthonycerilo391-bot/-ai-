

import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { Scene, AssetItem, ChatMessage, ScriptOption, VideoModel } from "../types";
import { AI_SCREENWRITER_INSTRUCTION, SHOT_FLOW_KB, VISUAL_STYLE_KB, EDITING_ANALYSIS_KB } from "../constants";

// Viva API Configuration - Initialize from LocalStorage
let vivaApiKey: string | null = typeof window !== 'undefined' ? localStorage.getItem('极光_api_key') : null;
let vivaBaseUrl: string = (typeof window !== 'undefined' ? localStorage.getItem('极光_base_url') : null) || "https://www.jiguangmanying.xyz";

// Legacy custom config (for Gemini direct)
let customApiKey: string | null = typeof window !== 'undefined' ? localStorage.getItem('custom_api_key') : null;
let customBaseUrl: string | null = typeof window !== 'undefined' ? localStorage.getItem('custom_base_url') : null;

// Unified Setter with Persistence
export const setCustomConfig = (key: string, baseUrl?: string) => {
  vivaApiKey = key;
  if (typeof window !== 'undefined') {
      localStorage.setItem('极光_api_key', key);
  }
  
  if (baseUrl) {
      vivaBaseUrl = baseUrl;
      if (typeof window !== 'undefined') localStorage.setItem('极光_base_url', baseUrl);
  }
  
  // Legacy
  customApiKey = key;
  if (typeof window !== 'undefined') localStorage.setItem('custom_api_key', key);
  
  if (baseUrl) {
      customBaseUrl = baseUrl;
      if (typeof window !== 'undefined') localStorage.setItem('custom_base_url', baseUrl);
  }
};

// Deprecated legacy setter
export const setCustomApiKey = (key: string) => {
  setCustomConfig(key);
};

export const openKeySelection = async () => {
  const win = window as any;
  if (win.aistudio) {
    await win.aistudio.openSelectKey();
  }
};

/**
 * Client for Standard Operations (Always Google Official / Default)
 */
const getDefaultClient = () => {
  // If custom key is set, try to use it (assuming proxy supports Google protocol)
  if (customApiKey) {
      return new GoogleGenAI({ 
          apiKey: customApiKey, 
          baseUrl: customBaseUrl || undefined 
      } as any);
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("系统默认 API Key 未配置且未检测到自定义 Key。");
  }
  return new GoogleGenAI({ apiKey });
};

const translateErrorMessage = (error: any): string => {
    const msg = String(error).toLowerCase();
    if (msg.includes('400') || msg.includes('invalid argument')) return "参数错误 (400)。";
    if (msg.includes('401') || msg.includes('unauthenticated')) return "认证失败 (401): API Key 无效。";
    if (msg.includes('403') || msg.includes('permission denied')) return "权限不足 (403)。";
    if (msg.includes('404') || msg.includes('not found')) return "模型/端点未找到 (404)。";
    if (msg.includes('429') || msg.includes('quota') || msg.includes('exhausted')) return "配额超限 (429)。";
    if (msg.includes('500') || msg.includes('internal')) return "服务器错误 (500)。";
    return `错误: ${msg.substring(0, 100)}...`;
};

const retryOperation = async <T>(
  operation: () => Promise<T>, 
  retries = 3, 
  delay = 2000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const msg = String(error).toLowerCase();
    if (msg.includes('400') || msg.includes('401') || msg.includes('403') || msg.includes('404') || msg.includes('safety')) {
         throw new Error(translateErrorMessage(error));
    }
    if (retries > 0) {
      console.warn(`API Error. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2); 
    }
    throw new Error(translateErrorMessage(error));
  }
};

const cleanJson = (text: string): string => {
    const firstOpenBrace = text.indexOf('{');
    const lastCloseBrace = text.lastIndexOf('}');
    const firstOpenBracket = text.indexOf('[');
    const lastCloseBracket = text.lastIndexOf(']');
    let start = -1;
    let end = -1;
    if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
        start = firstOpenBrace;
        end = lastCloseBrace;
    } else if (firstOpenBracket !== -1) {
        start = firstOpenBracket;
        end = lastCloseBracket;
    }
    if (start !== -1 && end !== -1 && end > start) {
        return text.substring(start, end + 1);
    }
    return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
};

const callVivaTextAI = async (
    prompt: string, 
    systemInstruction?: string, 
    jsonMode: boolean = false,
    imageBytes?: string,
    model: string = 'gemini-3-pro-preview'
): Promise<string> => {
    const executeCall = async (currentModel: string) => {
        const messages: any[] = [];
        if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });

        if (imageBytes) {
            messages.push({
                role: 'user',
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:image/png;base64,${imageBytes}` } }
                ]
            });
        } else {
            messages.push({ role: 'user', content: prompt });
        }

        const body: any = {
            model: currentModel,
            messages: messages,
            stream: false
        };

        if (jsonMode) {
            const jsonInstruction = "\n\nIMPORTANT: Return ONLY valid JSON. Do not use Markdown code blocks (no ```json). Do not add explanations. Just the JSON object/array.";
            const lastMsgIndex = body.messages.length - 1;
            const lastMsg = body.messages[lastMsgIndex];
            if (Array.isArray(lastMsg.content)) {
                 const textPart = lastMsg.content.find((c: any) => c.type === 'text');
                 if (textPart) textPart.text += jsonInstruction;
            } else {
                 lastMsg.content += jsonInstruction;
            }
        }

        const resp = await fetch(`${vivaBaseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${vivaApiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`Viva API Error ${resp.status}: ${errText}`);
        }

        const data = await resp.json();
        return data.choices?.[0]?.message?.content || "";
    };

    try {
        return await executeCall(model);
    } catch (e) {
        if (model === 'gemini-3-pro-preview') {
            console.log("Primary model failed, trying gpt-5-mini fallback...");
            try {
                return await executeCall('gpt-5-mini');
            } catch (fallbackError) {
                console.error("Fallback to gpt-5-mini also failed", fallbackError);
                throw e;
            }
        }
        throw e;
    }
};

const callVivaImageGen = async (promptParts: any[], aspectRatio: string, model: string = 'gemini-2.5-flash-image'): Promise<string> => {
    const apiKey = vivaApiKey || customApiKey || process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");
    const baseUrl = vivaBaseUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const isGemini3Pro = model.includes('gemini-3-pro-image');
    const imageConfig: any = { aspectRatio: aspectRatio };
    const modalities = ["IMAGE"];
    if (isGemini3Pro) {
        imageConfig.imageSize = "1K"; 
        modalities.push("TEXT");
    }
    const body = {
        contents: [{ role: "user", parts: promptParts }],
        generationConfig: { responseModalities: modalities, imageConfig: imageConfig }
    };
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(`Viva Image API Error ${response.status}: ${await response.text()}`);
    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if (part.inline_data && part.inline_data.data) return part.inline_data.data;
        if (part.inlineData && part.inlineData.data) return part.inlineData.data;
    }
    throw new Error("No image data found");
};

export const testApiConnection = async (apiKey: string, baseUrl?: string): Promise<boolean> => {
  try {
      const url = baseUrl || vivaBaseUrl;
      const resp = await fetch(`${url}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gemini-3-pro-preview', messages: [{role: 'user', content: 'ping'}] })
      });
      return resp.ok;
  } catch (e) { return false; }
};

export const translateText = async (text: string, targetLang: 'en' | 'zh'): Promise<string> => {
  return retryOperation(async () => {
    const prompt = `Translate to ${targetLang === 'en' ? 'English' : 'Chinese (Simplified)'}. Return ONLY the translated text.\nText: "${text}"`;
    if (vivaApiKey) return await callVivaTextAI(prompt);
    const ai = getDefaultClient();
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text?.trim() || "";
  });
};

export const analyzeImageForPrompt = async (imageBytes: string): Promise<string> => {
  return retryOperation(async () => {
    const prompt = `Act as a 'Shot Designer'. Analyze this image. Identify the Composition, Tone, and Depth techniques used. Return a concise analysis in Chinese (Simplified) suitable for a visual prompt.`;
    if (vivaApiKey) return await callVivaTextAI(prompt, undefined, false, imageBytes);
    const ai = getDefaultClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [ { inlineData: { mimeType: 'image/png', data: imageBytes } }, { text: prompt } ] }
    });
    return response.text?.trim() || "";
  });
};

export const extractAssetsFromScript = async (script: string): Promise<{ characters: {name: string, description: string}[], scenes: {name: string, description: string}[] }> => {
  return retryOperation(async () => {
    const prompt = `Analyze the script and extract specific character names and core location names.
    For each, provide a brief Visual Description based on the "步骤二" (Visual Prompts) section or the script content itself.
    CRITICAL: Return JSON with structure:
    { 
      "characters": [ { "name": "Name", "description": "Visual details in Simplified Chinese..." } ], 
      "scenes": [ { "name": "Location Name", "description": "Environment details in Simplified Chinese..." } ] 
    }
    Use Simplified Chinese for BOTH Names AND Descriptions (for consistent image generation).
    Script: "${script}"`;
    
    let result: any;
    if (vivaApiKey) {
        const text = await callVivaTextAI(prompt, "You are a precise script analyzer.", true);
        result = JSON.parse(cleanJson(text));
    } else {
        const ai = getDefaultClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 1024 } }
        });
        result = JSON.parse(cleanJson(response.text || "{}"));
    }

    const sanitize = (list: any[]) => (Array.isArray(list) ? list : []).map(item => {
        const name = item.name || (typeof item === 'string' ? item : "Unknown");
        const description = item.description || "";
        return { name, description };
    });

    return { 
        characters: sanitize(result.characters || []), 
        scenes: sanitize(result.scenes || []) 
    };
  });
};

export const generateTopicIdeas = async (categoryName: string, templateName: string, styleName: string): Promise<string[]> => {
    return retryOperation(async () => {
        const prompt = `Generate 10 creative video topic ideas suitable for AI Video Generation (Sora/Veo/Runway style).
        
        Context:
        - Theme/Category: "${categoryName}"
        - Sub-Template: "${templateName}"
        - Visual Style: "${styleName}"
        
        Requirements:
        1. Topics must be highly visual and suitable for short video storytelling.
        2. Focus on specific actions, atmospheric changes, or character expressions.
        3. Output exactly 10 distinct ideas.
        4. Language: Simplified Chinese.
        
        Return JSON: { "topics": [] }`;
        
        if (vivaApiKey) {
            const text = await callVivaTextAI(prompt, "Creative Director", true);
            const result = JSON.parse(cleanJson(text));
            return (result.topics || []).filter((t: any) => typeof t === 'string');
        }
        const ai = getDefaultClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 1024 } }
        });
        const result = JSON.parse(cleanJson(response.text || "{}"));
        return (result.topics || []).filter((t: any) => typeof t === 'string');
    });
};

// Replaces generateSingleShotScript to support scene count
export const generateScriptByScenes = async (
    topic: string, 
    styleModifier: string, 
    styleName: string, 
    templateName: string, 
    duration: number, // Single shot duration
    sceneCount: number,
    aspectRatio: string = '9:16',
    modelName: string = 'Sora 2.0'
): Promise<ScriptOption> => {
    return retryOperation(async () => {
        const prompt = `
        Role: Professional AI Video Director & Scriptwriter (Gemini 3 Pro).
        
        Task: Create a detailed production script for a storyboard.

        [STRICT OUTPUT FORMAT]
        Return valid JSON (Simplified Chinese).
        {
          "title": "Video Title (Chinese)",
          "outline": "One sentence summary (Chinese)",
          "content": "The full text generated according to the instructions below"
        }

        [INSTRUCTIONS]
        请你帮我创作一个漫剧分镜剧本，全程遵循以下所有要求：

        1. content字段的输出格式必须严格按照以下模板：
        【故事题材】：${templateName}
        【漫剧风格】：${styleName}
        【创意想法】：${topic}
        【视频模型/时长/比例】：${modelName}/${duration}S/${aspectRatio}
        【完整剧本内容】：
        (这里生成具体的分镜剧本内容)
        【漫剧风格】：${styleName}

        2. 完整剧本内容硬性输出要求：
        - 总时长严格控制在指定区间，每个分镜标注精准时长，总时长不超范围
        - 内容完全贴合题材调性，节奏适配超短时长，结尾有对应题材的记忆点
        - 固定输出格式：分镜序号+对应时长+画面内容+台词/音效
        - 画面完全贴合指定的美术风格，人物、场景符合创意设定，细节适配AI绘画生成
        - 台词、音效精简适配时长，无冗余内容
        - 分镜数量控制在2-3个，不要过度拆分
        `;
        
        if (vivaApiKey) {
            const text = await callVivaTextAI(prompt, "Professional Chinese Screenwriter", true);
            return JSON.parse(cleanJson(text)) as ScriptOption;
        }
        const ai = getDefaultClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 4096 } }
        });
        return JSON.parse(cleanJson(response.text || "{}")) as ScriptOption;
    });
};

export const generateScript = async (finalScriptText: string, styleModifier: string): Promise<Scene[]> => {
  return retryOperation(async () => {
    const prompt = `
    Task: Parse the provided video script into a structured storyboard list.
    Script Source: "${finalScriptText}"
    
    Instructions:
    - Extract distinct scenes. The script format is typically "分镜序号+对应时长+画面内容+台词/音效".
    - Extract visual prompts from "步骤二：核心画面设定" (Visual Prompts) if available.
    - The 'videoPrompt' should be the scene description (画面内容).
    - If "步骤二" is missing, infer visual prompts from the scene description and style modifier "${styleModifier}".
    - Ensure 'visualPrompt' is in English (optimized for image generation).
    - Ensure 'videoPrompt' is in Simplified Chinese (as in the script).
    - Generate an English 'cameraPrompt' for each scene.
    
    Return JSON Array:
    [
      { 
        "sceneNumber": 1, 
        "script": "Full content of the scene (duration + content + dialogue/audio)...", 
        "visualPrompt": "Optimized English visual prompt...", 
        "videoPrompt": "Chinese scene description...",
        "cameraPrompt": "Camera movement description..." 
      },
      ...
    ]
    `;
    if (vivaApiKey) {
        const text = await callVivaTextAI(prompt, "Storyboard Artist", true);
        return JSON.parse(cleanJson(text)) as Scene[];
    }
    const ai = getDefaultClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 2048 } }
    });
    return JSON.parse(cleanJson(response.text || "[]")) as Scene[];
  });
};

export const generateAssetImage = async (
    name: string,
    type: 'character' | 'scene',
    styleModifier: string,
    aspectRatio: '9:16' | '16:9' = '16:9',
    description?: string, // Derived from script
    model: string = 'gemini-2.5-flash-image'
): Promise<string> => {
    return retryOperation(async () => {
        let specificPrompt = "";
        const descText = description ? `Visual Details: ${description}` : "";

        if (type === 'character') {
            specificPrompt = `
            Task: Create full-body image of "${name}" on PURE WHITE BACKGROUND.
            ${descText}
            POSTURE: If human, stand upright. If ANIMAL or NON-HUMAN, use its NATURAL POSTURE.
            `;
        } else {
            specificPrompt = `
            Task: Environment Concept Art for "${name}". 
            ${descText}
            Pure Scenery. NO PEOPLE.
            `;
        }
        const prompt = `Design a ${type}. ${styleModifier}. ${specificPrompt} Aspect Ratio: ${aspectRatio}.`;
        return await callVivaImageGen([{ text: prompt }], aspectRatio, model);
    });
};

export const generateSceneImage = async (
  visualPrompt: string,
  cameraPrompt: string,
  characters: AssetItem[],
  coreScenes: AssetItem[],
  aspectRatio: '9:16' | '16:9' = '16:9',
  sceneReferenceImages?: Array<{ data: string; mimeType: string } | undefined>,
  model: string = 'gemini-2.5-flash-image'
): Promise<string> => {
    const parts: any[] = [];
    // Constructed prompt handling Chinese visualPrompt gracefully
    let promptInstructions = `Generate a cinematic image. Visual Prompt: "${visualPrompt}". Camera: "${cameraPrompt}". Aspect Ratio: ${aspectRatio}.`;
    
    const addImagePart = (data: string, mimeType: string) => { parts.push({ inline_data: { mime_type: mimeType, data: data } }); };
    characters.forEach(c => { if (c.data && c.autoReference !== false) { addImagePart(c.data, c.mimeType); promptInstructions += ` [Ref Character: ${c.name}]`; } });
    coreScenes.forEach(s => { if (s.data && s.autoReference !== false) { addImagePart(s.data, s.mimeType); promptInstructions += ` [Ref Location: ${s.name}]`; } });
    if (sceneReferenceImages) sceneReferenceImages.forEach(img => { if (img?.data) { addImagePart(img.data, img.mimeType); promptInstructions += ` [Ref Composition]`; } });
    parts.push({ text: promptInstructions });
    return retryOperation(async () => await callVivaImageGen(parts, aspectRatio, model));
};

export const editSceneImage = async (imageBytes: string, instruction: string, aspectRatio: '9:16' | '16:9'): Promise<string> => {
    return retryOperation(async () => {
        const parts = [ { inline_data: { mime_type: 'image/png', data: imageBytes } }, { text: `Edit: ${instruction}. Aspect: ${aspectRatio}` } ];
        return await callVivaImageGen(parts, aspectRatio);
    });
};

export const generateVideo = async (
  prompt: string,
  aspectRatio: '9:16' | '16:9',
  duration: number,
  model: VideoModel,
  signal?: AbortSignal,
  imageBytes?: string
): Promise<string> => {
    let finalPrompt = prompt;
    if (!prompt.toLowerCase().includes('language')) finalPrompt += ", speaking language: Chinese (Mandarin)";
    
    if (vivaApiKey) {
        if (signal?.aborted) throw new Error("Aborted");

        if (model === 'grok-video-3') {
            const grokModel = duration === 15 ? 'grok-video-3-15s' : 'grok-video-3-10s';
            const body: any = {
                model: grokModel,
                prompt: finalPrompt,
                aspect_ratio: aspectRatio,
                size: "720P",
                images: []
            };

            if (imageBytes) {
                body.images.push(`data:image/png;base64,${imageBytes}`);
            }

            const createResp = await fetch(`${vivaBaseUrl}/v1/video/create`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${vivaApiKey}` 
                },
                body: JSON.stringify(body),
                signal: signal
            });

            if (!createResp.ok) throw new Error(`Grok Video API Error ${createResp.status}: ${await createResp.text()}`);
            const createData = await createResp.json();
            const taskId = createData.id;
            if (!taskId) throw new Error("No Task ID returned");

            let videoUrl = null;
            let attempts = 0;
            while (!videoUrl && attempts < 120) {
                if (signal?.aborted) throw new Error("Aborted");
                await new Promise(r => setTimeout(r, 5000)); 
                attempts++;
                const checkResp = await fetch(`${vivaBaseUrl}/v1/video/query?id=${taskId}`, { 
                    headers: { 'Authorization': `Bearer ${vivaApiKey}` }, 
                    signal 
                });
                if (checkResp.ok) {
                    const checkData = await checkResp.json();
                    if (checkData.status === 'completed' || checkData.status === 'success') {
                         videoUrl = checkData.video_url;
                    } else if (checkData.status === 'failed') {
                        throw new Error("Video Generation Failed: " + (checkData.error || "Unknown error"));
                    }
                }
            }
            if (!videoUrl) throw new Error("Timeout");
            return videoUrl;
        }

        const formData = new FormData();
        formData.append('model', model);
        formData.append('prompt', finalPrompt);
        formData.append('seconds', duration.toString()); 
        formData.append('size', aspectRatio === '16:9' ? '16x9' : '9x16'); 
        
        if (imageBytes) {
            const blob = await (await fetch(`data:image/png;base64,${imageBytes}`)).blob();
            formData.append('input_reference', blob, 'image.png');
        }

        const createResp = await fetch(`${vivaBaseUrl}/v1/videos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${vivaApiKey}` },
            body: formData,
            signal: signal
        });
        if (!createResp.ok) throw new Error(`Video API Error ${createResp.status}: ${await createResp.text()}`);
        const createData = await createResp.json();
        const taskId = createData.id;
        if (!taskId) throw new Error("No Task ID returned");
        let videoUrl = null;
        let attempts = 0;
        while (!videoUrl && attempts < 120) {
            if (signal?.aborted) throw new Error("Aborted");
            await new Promise(r => setTimeout(r, 5000)); 
            attempts++;
            const checkResp = await fetch(`${vivaBaseUrl}/v1/videos/${taskId}`, { headers: { 'Authorization': `Bearer ${vivaApiKey}` }, signal });
            if (checkResp.ok) {
                const checkData = await checkResp.json();
                if (checkData.status === 'completed' && checkData.video_url) videoUrl = checkData.video_url;
                else if (checkData.status === 'failed') throw new Error("Video Generation Failed");
            }
        }
        if (!videoUrl) throw new Error("Timeout");
        return videoUrl;
    }

    // Google GenAI Fallback (Veo)
    // Note: Sora is not supported on Google GenAI directly, so this fallback is only for Veo or similar.
    // If model is sora-2-all but no Viva Key, this will fail or default to Veo if we force it.
    // But let's assume if they select Veo it goes here.
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Map model name if necessary, or use the one passed if it's a valid Google model
    const googleModel = model === 'veo_3_1-fast' ? 'veo-3.1-fast-generate-preview' : 'veo-3.1-fast-generate-preview';

    let operation = await ai.models.generateVideos({
        model: googleModel,
        prompt: finalPrompt,
        ...(imageBytes ? { image: { imageBytes: imageBytes, mimeType: 'image/png' } } : {}),
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio }
    });
    while (!operation.done) {
        if (signal?.aborted) throw new Error("Aborted");
        await new Promise(r => setTimeout(r, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
    }
    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    const res = await fetch(`${uri}${uri?.includes('?') ? '&' : '?'}key=${process.env.API_KEY}`, { signal });
    return URL.createObjectURL(await res.blob());
};