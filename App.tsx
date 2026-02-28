import React, { useState, useRef } from 'react';
import { AppStep, StyleOption, ScriptCategory, ScriptTemplate, VideoModel, ScriptOption, Scene } from './types';
import { STYLES, SCRIPT_CATEGORIES, VIDEO_MODELS } from './constants';
import { generateTopicIdeas, generateVideo, setCustomConfig, testApiConnection, generateScriptByScenes, generateScript } from './services/geminiService';
import StepIndicator from './components/StepIndicator';
import LoadingOverlay from './components/LoadingOverlay';
import { Sparkles, AlertCircle, Settings, CheckCircle2, XCircle, Clapperboard, BookOpen, Camera, ArrowRight, RefreshCw, Wand2, Clock, Maximize2, Download, Monitor, ChevronRight, ShoppingBag, Brain, Headset, ExternalLink, Link2, Bot, X, Eye, EyeOff, Save, Play, Film } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [topic, setTopic] = useState('');
  
  // Style Selection State
  const [selectedStylePath, setSelectedStylePath] = useState<StyleOption[]>([]);
  // Custom Style State
  const [showCustomStyleModal, setShowCustomStyleModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // New State for Step 1 (Templates)
  const [selectedCategory, setSelectedCategory] = useState<ScriptCategory | null>(SCRIPT_CATEGORIES[0]);
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate | null>(null);

  // New State for Topic Suggestions
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  // New State for Script
  const [generatedScript, setGeneratedScript] = useState<ScriptOption | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Video Configuration
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModel>('sora-2-all');
  const [videoDuration, setVideoDuration] = useState<number>(10); // Default to 10s for Sora
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  
  // Generation State
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('极光_api_key') || '');
  const [baseUrlInput, setBaseUrlInput] = useState(() => localStorage.getItem('极光_base_url') || 'https://api.jiguangmanying.xyz');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  // Support Modal State
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Links Modal State
  const [showLinksModal, setShowLinksModal] = useState(false);

  // Pricing Modal State
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Cancellation Reference
  const loadingSession = useRef(0);
  const videoController = useRef<AbortController | null>(null);

  // Calculate Reachable Steps
  const enabledSteps = [AppStep.INPUT];
  if (generatedScript) enabledSteps.push(AppStep.SCRIPT);
  if (generatedVideoUrl) enabledSteps.push(AppStep.VIDEO_GENERATION);

  // Navigation Logic
  const handleStepClick = (targetStep: AppStep) => {
    if (targetStep === AppStep.INPUT) { setStep(targetStep); return; }
    if (targetStep === AppStep.SCRIPT && !generatedScript) { setError("Please generate a script first!"); return; }
    if (targetStep === AppStep.VIDEO_GENERATION && !generatedVideoUrl) { setError("Please generate a video first!"); return; }
    setStep(targetStep);
  };

  // Helper to get active style modifier string
  const getFullStyleModifier = () => {
      const topStyle = selectedStylePath[0];
      if (!topStyle) return '';
      return selectedStylePath.map(s => s.promptModifier).join(' ');
  };

  const handleStyleSelect = (style: StyleOption, level: number) => {
      if (style.id === 'custom') {
          setCustomName('');
          setCustomPrompt('');
          setShowCustomStyleModal(true);
          return;
      }
      const newPath = [...selectedStylePath.slice(0, level), style];
      setSelectedStylePath(newPath);
  };

  const saveCustomStyle = () => {
      if (!customName.trim() || !customPrompt.trim()) return;
      const customStyleOption: StyleOption = {
          id: 'custom_user',
          name: customName,
          description: 'User Custom Style',
          promptModifier: `Style: ${customPrompt}`,
          previewUrl: 'https://picsum.photos/seed/custom/300/200'
      };
      setSelectedStylePath([customStyleOption]);
      setShowCustomStyleModal(false);
  };

  const isStyleSelectionComplete = () => {
      if (selectedStylePath.length === 0) return false;
      const lastStyle = selectedStylePath[selectedStylePath.length - 1];
      if (lastStyle.subStyles && lastStyle.subStyles.length > 0) return false;
      return true;
  };

  const handleGenerateTopics = async () => {
    if (!selectedCategory || !selectedTemplate) return;
    const styleName = selectedStylePath.map(s => s.name).join(' + ');
    setIsGeneratingTopics(true);
    try {
        const ideas = await generateTopicIdeas(selectedCategory.name, selectedTemplate.name, styleName);
        setTopicSuggestions(ideas);
        if ((!topic || typeof topic !== 'string' || !topic.trim()) && ideas.length > 0) {
            const randomIndex = Math.floor(Math.random() * ideas.length);
            setTopic(ideas[randomIndex]);
        }
    } catch (e: any) {
        alert("Failed to generate ideas: " + e.message);
    } finally {
        setIsGeneratingTopics(false);
    }
  };

  const handleGenerateScriptAction = async () => {
    if (!topic || !selectedTemplate || selectedStylePath.length === 0) return;

    setIsGeneratingScript(true);
    setLoadingMessage("Generating production script...");
    setError(null);

    try {
        const styleModifier = getFullStyleModifier();
        const styleName = selectedStylePath.map(s => s.name).join(' + ');
        const modelName = VIDEO_MODELS.find(m => m.id === selectedVideoModel)?.name || selectedVideoModel;
        
        const script = await generateScriptByScenes(
            topic,
            styleModifier,
            styleName,
            selectedTemplate.name,
            videoDuration,
            1, // Default to 1 scene for now as per previous logic
            aspectRatio,
            modelName
        );

        setGeneratedScript(script);
        
        const parsedScenes = await generateScript(script.content, styleModifier);
        setScenes(parsedScenes);
        
        setStep(AppStep.SCRIPT);
    } catch (err: any) {
        setError(err.message || 'Script generation failed.');
    } finally {
        setIsGeneratingScript(false);
    }
  };

  const handleGenerateVideoAction = async () => {
    if (!generatedScript || scenes.length === 0) return;

    const sessionId = ++loadingSession.current;
    
    if (videoController.current) {
        videoController.current.abort();
    }
    const controller = new AbortController();
    videoController.current = controller;

    setIsGeneratingVideo(true);
    setLoadingMessage(`Generating Video with ${selectedVideoModel}...`);
    setError(null);

    try {
        // Extract content after "【完整剧本内容】" or use full content
        const fullContent = generatedScript.content;
        let promptToUse = fullContent;
        const marker = "【完整剧本内容】";
        const markerIndex = fullContent.indexOf(marker);
        if (markerIndex !== -1) {
             // Get content after the marker, removing the marker and any colon/newline
             let contentAfter = fullContent.substring(markerIndex + marker.length);
             if (contentAfter.startsWith("：") || contentAfter.startsWith(":")) {
                 contentAfter = contentAfter.substring(1);
             }
             promptToUse = contentAfter.trim();
        }

        const videoUrl = await generateVideo(
            promptToUse,
            aspectRatio,
            videoDuration,
            selectedVideoModel,
            controller.signal
        );

        if (loadingSession.current !== sessionId) return;

        setGeneratedVideoUrl(videoUrl);
        setStep(AppStep.VIDEO_GENERATION);

    } catch (err: any) {
        if (loadingSession.current !== sessionId) return;
        if (err.message === 'Aborted') return;
        setError(err.message || 'Video generation failed.');
    } finally {
        if (loadingSession.current === sessionId) setIsGeneratingVideo(false);
        videoController.current = null;
    }
  };

  const handleCancelLoading = () => {
    loadingSession.current++;
    if (videoController.current) {
        videoController.current.abort();
        videoController.current = null;
    }
    setIsGeneratingVideo(false);
  };

  const handleSaveConfig = () => {
      if(apiKeyInput.trim()) {
          setCustomConfig(apiKeyInput.trim(), baseUrlInput.trim());
          setShowConfigModal(false);
          alert(`Custom Config Saved: Using ${baseUrlInput}`);
      }
  };

  const renderStyleSelection = (styles: StyleOption[], level: number = 0) => {
      const selectedStyle = selectedStylePath[level];
      return (
        <div className="animate-fade-in space-y-4">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                 {styles.map((style) => {
                    const isSelected = selectedStyle?.id === style.id || selectedStyle?.id === 'custom_user' && style.id === 'custom';
                    const displayName = (style.id === 'custom' && selectedStyle?.id === 'custom_user') ? selectedStyle.name : style.name;

                    return (
                        <button 
                            key={style.id} 
                            onClick={() => {
                                handleStyleSelect(style, level);
                            }} 
                            className={clsx(
                                "h-16 flex items-center justify-center transition-all px-2 font-normal tracking-wide relative border-2 border-black font-sans text-lg whitespace-nowrap",
                                isSelected 
                                    ? "bg-[#FACC15] text-black transform -translate-y-1" 
                                    : "bg-white text-black hover:bg-gray-50 hover:text-black"
                            )}
                            title={style.name}
                        >
                            {displayName}
                       </button>
                    )
                 })}
             </div>
             
             {selectedStyle && selectedStyle.subStyles && selectedStyle.subStyles.length > 0 && (
                 <div className="relative mt-4 pt-2 border-l-4 border-dotted border-black pl-6 ml-2">
                     <div className="animate-in slide-in-from-left-2 duration-300">
                         <h4 className="text-xl font-bangers text-white mb-4 flex items-center gap-2">
                             <ArrowRight className="text-[#FACC15]" size={24} />
                             SUB-STYLE ({selectedStyle.name})
                         </h4>
                         {renderStyleSelection(selectedStyle.subStyles, level + 1)}
                     </div>
                 </div>
             )}
        </div>
      );
  };

  // Get available durations for selected model
  const currentModelConfig = VIDEO_MODELS.find(m => m.id === selectedVideoModel);
  const availableDurations = currentModelConfig ? currentModelConfig.durations : [5];

  // Effect to update duration if not valid for new model
  React.useEffect(() => {
      if (currentModelConfig && !currentModelConfig.durations.includes(videoDuration)) {
          setVideoDuration(currentModelConfig.durations[0]);
      }
  }, [selectedVideoModel, currentModelConfig]);

  return (
    <div className="min-h-screen pb-20 font-sans relative">
      <header className="border-b-4 border-black bg-[#FACC15] sticky top-0 z-[100] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
             <Bot size={52} className="text-black" strokeWidth={2.5} />
             <h1 className="font-sans font-black text-4xl tracking-wider text-black uppercase drop-shadow-sm">极光漫影 AI短视频创作平台</h1>
          </div>
          <div className="flex items-center gap-4 relative z-[101]">
              <button onClick={() => setShowConfigModal(true)} className="flex items-center justify-center w-12 h-12 bg-white text-black border-2 border-black text-xl hover:bg-gray-100 transition-all duration-200 rounded-full hover:translate-y-1" title="System Config">
                 <Settings size={24} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => setShowPricingModal(true)}
                className="flex items-center justify-center w-12 h-12 bg-white text-black border-2 border-black text-xl hover:bg-gray-100 transition-all duration-200 rounded-full hover:translate-y-1 font-sans font-black" 
                title="PRICE DESC(价格说明)"
              >
                ¥
              </button>
              <button 
                  onClick={() => setShowSupportModal(true)} 
                  className="flex items-center justify-center w-12 h-12 bg-white text-black border-2 border-black text-xl hover:bg-gray-100 transition-all duration-200 rounded-full hover:translate-y-1" 
                  title="Contact Support"
              >
                 <Headset size={24} strokeWidth={2.5} />
              </button>
              <button 
                  onClick={() => setShowLinksModal(true)}
                  className="flex items-center justify-center w-12 h-12 bg-white text-black border-2 border-black text-xl hover:bg-gray-100 transition-all duration-200 rounded-full hover:translate-y-1"
                  title="FRIENDLY LINKS(友情链接)"
              >
                  <Link2 size={24} strokeWidth={2.5} />
              </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      {showSupportModal && (
          <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black w-full max-w-lg relative animate-in zoom-in duration-200">
                  <div className="bg-[#FACC15] border-b-4 border-black p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <Headset className="w-6 h-6 text-black" strokeWidth={2.5} />
                          <h2 className="text-3xl font-black text-black tracking-wide font-sans uppercase">联系客服 / SUPPORT</h2>
                      </div>
                      <button onClick={() => setShowSupportModal(false)} className="bg-[#EF4444] hover:bg-[#DC2626] border-2 border-black text-white p-1 transition-colors"><X size={24} strokeWidth={3} /></button>
                  </div>
                  <div className="p-6 bg-[#FFFBEB] relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-[#FACC15] border-l-2 border-b-2 border-black px-3 py-1 font-bold text-xs">ONLINE</div>
                      <div className="flex flex-col items-center space-y-4 mt-2">
                          <div className="w-20 h-20 bg-[#3B82F6] rounded-full flex items-center justify-center border-2 border-black"><Headset className="text-white w-10 h-10" /></div>
                          <h3 className="text-xl font-bold text-gray-500 tracking-wider font-sans uppercase">WECHAT SUPPORT</h3>
                          <div className="w-full flex border-2 border-black cursor-pointer hover:translate-y-1 transition-transform bg-white" onClick={() => { navigator.clipboard.writeText("VIVA-API"); alert("WeChat ID copied: VIVA-API"); }} title="Click to copy">
                              <div className="bg-[#4ADE80] w-1/3 flex items-center justify-center border-r-2 border-black p-3"><span className="font-bold text-lg">微信客服</span></div>
                              <div className="flex-1 flex items-center justify-center p-3 bg-white"><span className="font-black text-2xl tracking-widest">VIVA-API</span></div>
                          </div>
                      </div>
                      <div className="w-full border-t-2 border-dashed border-gray-300 my-6"></div>
                      <div className="text-center space-y-3">
                          <h4 className="font-sans font-bold text-xl flex items-center justify-center gap-2"><span className="w-3 h-3 bg-[#10B981] rounded-full border-2 border-black"></span>招募优质API代理</h4>
                          <p className="text-gray-600 font-bold text-sm">名额有限，欢迎想通过AI创业的伙伴加入。</p>
                          <a href="https://my.feishu.cn/wiki/O6Q9wrxxci898Wkj6ndcFnlknJd" target="_blank" className="block w-full bg-[#EF4444] text-white font-black text-xl py-4 border-2 border-black hover:translate-y-1 transition-all flex items-center justify-center gap-2">查看更多详情 <ExternalLink size={20} /></a>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showLinksModal && (
          <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black w-full max-w-3xl relative animate-in zoom-in duration-200 overflow-hidden">
                   <div className="bg-[#FACC15] text-black p-4 flex justify-between items-center border-b-4 border-black">
                        <div className="flex items-center gap-3"><Link2 className="w-6 h-6 text-black" strokeWidth={2.5} /> <h2 className="text-3xl font-black text-black tracking-wide font-sans uppercase">友情链接 / FRIENDLY LINKS</h2></div>
                        <button onClick={() => setShowLinksModal(false)} className="bg-[#EF4444] hover:bg-[#DC2626] border-2 border-black text-white p-1 transition-colors"><X size={24} strokeWidth={3} /></button>
                   </div>
                   <div className="p-8 grid grid-cols-1 gap-6 font-sans bg-[#FFFBEB]">
                        <a href="https://api.jiguangmanying.xyz" target="_blank" className="group flex flex-col md:flex-row items-stretch bg-white border-4 border-black p-0 hover:-translate-y-1 transition-transform relative overflow-hidden">
                             <div className="w-full md:w-32 bg-black border-b-4 md:border-b-0 md:border-r-4 border-black flex items-center justify-center shrink-0 group-hover:bg-gray-900 transition-colors min-h-[120px]"><Monitor className="text-[#FACC15] w-12 h-12" strokeWidth={2.5} /></div>
                             <div className="p-5 flex-1 w-full flex flex-col justify-center">
                                 <div className="flex justify-between items-start mb-2"><h4 className="font-sans font-black text-2xl text-black leading-none">API 主站</h4><ExternalLink size={20} className="text-gray-400 group-hover:text-black transition-colors" /></div>
                                 <p className="text-gray-600 font-bold text-sm leading-relaxed mb-3">一站式模型聚合平台。用于创建API令牌(Key)，查询调用日志与额度消耗。</p>
                                 <div><span className="inline-block bg-black text-white px-2 py-1 font-mono text-xs font-bold">api.jiguangmanying.xyz</span></div>
                             </div>
                        </a>
                        <a href="https://p.vivaapi.cn" target="_blank" className="group flex flex-col md:flex-row items-stretch bg-white border-4 border-black p-0 hover:-translate-y-1 transition-transform relative overflow-hidden">
                             <div className="w-full md:w-32 bg-[#FACC15] border-b-4 md:border-b-0 md:border-r-4 border-black flex items-center justify-center shrink-0 group-hover:bg-[#EAB308] transition-colors min-h-[120px]"><Bot className="text-black w-12 h-12" strokeWidth={2.5} /></div>
                             <div className="p-5 flex-1 w-full flex flex-col justify-center">
                                 <div className="flex justify-between items-start mb-2"><h4 className="font-sans font-black text-2xl text-black leading-none">VIVA AI 助手</h4><ExternalLink size={20} className="text-gray-400 group-hover:text-black transition-colors" /></div>
                                 <p className="text-gray-600 font-bold text-sm leading-relaxed mb-3">AI对话，生图，生视频，生语音等专属分站。</p>
                                 <div><span className="inline-block bg-black text-white px-2 py-1 font-mono text-xs font-bold">p.vivaapi.cn</span></div>
                             </div>
                        </a>
                   </div>
              </div>
          </div>
      )}

      {showCustomStyleModal && (
          <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black w-full max-w-lg relative animate-in zoom-in duration-200">
                  <div className="bg-[#FACC15] border-b-4 border-black p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3"><Wand2 className="w-6 h-6 text-black" strokeWidth={2.5} /> <h2 className="text-3xl font-black text-black tracking-wide font-sans">自定义风格 / Custom</h2></div>
                      <button onClick={() => setShowCustomStyleModal(false)} className="bg-[#EF4444] hover:bg-[#DC2626] border-2 border-black text-white p-1 transition-colors"><X size={24} strokeWidth={3} /></button>
                  </div>
                  <div className="p-6 bg-white space-y-4">
                      <div className="space-y-2">
                          <label className="text-lg font-bold text-black">风格名称 / Style Name</label>
                          <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full border-2 border-black p-3 text-lg font-medium outline-none focus:bg-yellow-50" placeholder="例如：赛博朋克" autoFocus />
                      </div>
                      <div className="space-y-2">
                          <label className="text-lg font-bold text-black">AI 风格提示词 / AI Style Prompt</label>
                          <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} className="w-full border-2 border-black p-3 text-lg font-medium h-32 resize-none outline-none focus:bg-yellow-50" placeholder="例如：电影质感，高对比度，霓虹色彩..." />
                      </div>
                      <div className="pt-2">
                          <button onClick={saveCustomStyle} disabled={!customName.trim() || !customPrompt.trim()} className="w-full bg-[#FACC15] hover:bg-[#EAB308] text-black border-2 border-black py-3 font-black text-xl tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 transition-all">确认风格 / Confirm Style</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showConfigModal && (
          <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black w-full max-w-2xl relative animate-in zoom-in duration-200">
                   <div className="bg-[#FACC15] border-b-4 border-black p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3"><Settings className="w-6 h-6 text-black" strokeWidth={2.5} /> <h2 className="text-3xl font-black text-black tracking-wide font-sans uppercase">系统设置 / SETTINGS</h2></div>
                        <button onClick={() => setShowConfigModal(false)} className="bg-[#EF4444] hover:bg-[#DC2626] border-2 border-black text-white p-1 transition-colors"><X size={24} strokeWidth={3} /></button>
                   </div>
                   <div className="p-8 space-y-6">
                      <p className="text-[#EF4444] font-bold text-lg leading-relaxed">API令牌分组：限时特价→default→优质gemini→sora-vip→逆向</p>
                      <div className="space-y-2">
                          <label className="text-base font-black text-black flex items-center gap-2"><a href="https://api.jiguangmanying.xyz/console/token" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-colors">API令牌获取地址 <ExternalLink size={16} /></a></label>
                          <input type="text" value={baseUrlInput} onChange={e => setBaseUrlInput(e.target.value)} className="w-full bg-white border-2 border-black p-3 font-mono text-lg outline-none focus:bg-[#FFFBEB] transition-colors text-gray-700" placeholder="https://api.jiguangmanying.xyz" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-base font-black text-black">API令牌 (KEY)</label>
                          <div className="relative">
                            <input type={showApiKey ? "text" : "password"} value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} className="w-full bg-white border-2 border-black p-3 font-mono text-lg outline-none focus:bg-[#FFFBEB] transition-colors tracking-widest pr-12" placeholder="sk-..." />
                            <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-black transition-colors">{showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                          </div>
                      </div>
                      <button onClick={handleSaveConfig} className="w-full bg-[#FACC15] text-black border-2 border-black py-4 font-black text-lg tracking-wide uppercase hover:translate-y-1 transition-all mt-4 flex items-center justify-center gap-2"><Save size={20} strokeWidth={2.5} />保存设置/SAVE SETTINGS</button>
                   </div>
              </div>
          </div>
      )}

      {showPricingModal && (
          <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black w-full max-w-2xl relative animate-in zoom-in duration-200">
                  <div className="bg-[#FACC15] border-b-4 border-black p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3"><ShoppingBag className="w-6 h-6 text-black" strokeWidth={2.5} /> <h2 className="text-3xl font-black text-black tracking-wide font-sans uppercase">价格说明 / PRICING</h2></div>
                      <button onClick={() => setShowPricingModal(false)} className="bg-[#EF4444] hover:bg-[#DC2626] border-2 border-black text-white p-1 transition-colors"><X size={24} strokeWidth={3} /></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="space-y-2">
                          <label className="text-base font-black text-black uppercase">Gemini-3-Pro-Preview</label>
                          <div className="w-full bg-white border-2 border-black p-4 font-mono text-lg text-gray-700 flex flex-col gap-1">
                              <div className="flex justify-between border-b border-dashed border-gray-300 pb-1"><span>Input (提示)</span> <span className="font-bold text-black">¥1.20 / 1M tokens</span></div>
                              <div className="flex justify-between pt-1"><span>Output (补全)</span> <span className="font-bold text-black">¥7.20 / 1M tokens</span></div>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-base font-black text-black uppercase">Veo 3.1 Fast</label>
                          <div className="w-full bg-white border-2 border-black p-4 font-mono text-lg text-gray-700">
                              <div className="flex justify-between"><span>Video Generation</span> <span className="font-bold text-black">¥0.126 / 条</span></div>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-base font-black text-black uppercase">Grok Video 3</label>
                          <div className="w-full bg-white border-2 border-black p-4 font-mono text-lg text-gray-700 flex flex-col gap-1">
                              <div className="flex justify-between border-b border-dashed border-gray-300 pb-1"><span>10 Seconds</span> <span className="font-bold text-black">¥0.28 / 条</span></div>
                              <div className="flex justify-between pt-1"><span>15 Seconds</span> <span className="font-bold text-black">¥0.35 / 条</span></div>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-base font-black text-black uppercase">Sora 2 (sora-vip分组)</label>
                          <div className="w-full bg-white border-2 border-black p-4 font-mono text-lg text-gray-700">
                              <div className="flex justify-between"><span>Video Generation</span> <span className="font-bold text-black">¥0.56 / 条</span></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10">
        <StepIndicator currentStep={step} onStepClick={handleStepClick} enabledSteps={enabledSteps} />

        {error && (
          <div className="mb-8 bg-red-100 border-l-8 border-red-600 text-red-800 p-4 flex items-center gap-3">
            <AlertCircle size={32} />
            <span className="font-bold uppercase tracking-wide text-lg">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto font-bold underline hover:text-red-950">DISMISS</button>
          </div>
        )}

        {step === AppStep.INPUT && (
          <div className="max-w-7xl mx-auto space-y-12 pb-20">
            <div className="text-center space-y-3 mb-12">
                <h2 className="text-6xl font-bangers text-white uppercase tracking-wider drop-shadow-[4px_4px_0_#000]">Step 1. The Concept</h2>
                <p className="text-white text-xl font-normal bg-black inline-block px-4 py-1 transform -skew-x-12 border-2 border-white">Choose your adventure path.</p>
            </div>

            {/* Template Selection */}
            {selectedCategory && (
                <div className="space-y-5 bg-black p-6 border-4 border-white relative mt-8">
                     <div className="absolute -top-5 left-10 bg-white border-2 border-black px-4 py-1 font-bangers text-xl transform -rotate-1">
                        SELECT TEMPLATE ({selectedCategory.name})
                     </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                        {selectedCategory.templates.map(tpl => (
                            <button 
                                key={tpl.id} 
                                onClick={() => setSelectedTemplate(tpl)}
                                className={clsx(
                                    "px-6 h-16 flex items-center justify-center font-normal text-lg border-2 border-black transition-all uppercase tracking-wide font-bangers",
                                    selectedTemplate?.id === tpl.id 
                                        ? "bg-[#FACC15] text-black"
                                        : "bg-white text-black hover:bg-gray-100"
                                )}
                            >
                                {tpl.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Visual Style Selection */}
            {selectedCategory && selectedTemplate && (
                <div className="space-y-5 bg-black p-6 border-4 border-white relative mt-8">
                     <div className="absolute -top-5 left-10 bg-white border-2 border-black px-4 py-1 font-bangers text-xl transform -rotate-1">
                        COMIC STYLE (漫剧风格)
                     </div>
                     <div className="pt-4">
                        {renderStyleSelection(STYLES, 0)}
                     </div>
                 </div>
            )}

            {/* Topic Input & Video Config */}
            {selectedTemplate && selectedStylePath.length > 0 && (
                <div className="space-y-5 bg-black p-6 border-4 border-white relative mt-8">
                     <div className="absolute -top-5 left-10 bg-white border-2 border-black px-4 py-1 font-bangers text-xl transform -rotate-1 flex items-center justify-center">
                        CREATIVE IDEA (创意想法)
                     </div>

                     <div className="space-y-6 pt-6">
                         <div className="relative group">
                            {isGeneratingTopics ? (
                               <div className="absolute top-3.5 left-4 z-20 h-10 px-4 flex items-center gap-1 bg-[#8B5CF6] border-2 border-black rounded-full transition-all">
                                   <Brain size={18} className="text-[#FACC15] animate-spin" />
                                   <span className="font-bold text-white tracking-wide text-xs animate-pulse font-sans">AI创意生成中...</span>
                               </div>
                            ) : (
                                <button 
                                     onClick={handleGenerateTopics}
                                     className="absolute top-3.5 left-4 z-20 w-10 h-10 flex items-center justify-center bg-[#8B5CF6] hover:bg-[#7C3AED] border-2 border-black rounded-full transition-all hover:scale-110"
                                     title="AI Brainstorm"
                                 >
                                     <Brain size={20} className="text-white" /> 
                                 </button>
                            )}

                            <textarea 
                                value={topic} 
                                onChange={(e) => setTopic(e.target.value)} 
                                placeholder={isGeneratingTopics ? "请耐心等待..." : "左侧图标点一下，AI创意马上来"}
                                className={clsx(
                                    "w-full h-32 bg-white border-4 border-black py-5 px-6 text-lg font-normal font-sans outline-none resize-none text-black leading-relaxed placeholder:text-gray-400 focus:bg-yellow-50 transition-colors",
                                    isGeneratingTopics ? "pl-52" : "pl-20"
                                )}
                            />
                         </div>
                         
                         {topicSuggestions.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {topicSuggestions.map((suggestion, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setTopic(suggestion)}
                                        className="bg-white hover:bg-[#FACC15] border-2 border-black px-4 py-2 text-lg uppercase transition-colors font-normal text-left truncate"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                         )}

                         <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-8 border-t-2 border-dashed border-gray-600">
                            <div>
                                <h3 className="text-2xl font-bangers text-white mb-2 flex items-center gap-2">
                                    <Film size={24} /> 
                                    <span>VIDEO MODEL <span className="text-xl ml-1 font-normal">(视频模型)</span></span>
                                </h3>
                                <div className="relative">
                                    <select
                                        value={selectedVideoModel}
                                        onChange={(e) => setSelectedVideoModel(e.target.value as VideoModel)}
                                        className="w-full h-14 bg-white border-4 border-black px-6 text-2xl font-normal outline-none appearance-none cursor-pointer hover:bg-gray-50 uppercase"
                                    >
                                        {VIDEO_MODELS.map(model => (
                                            <option key={model.id} value={model.id}>{model.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                                        <ChevronRight className="rotate-90" size={24} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bangers text-white mb-2 flex items-center gap-2">
                                    <Clock size={24} /> 
                                    <span>DURATION <span className="text-xl ml-1 font-normal">(视频时长)</span></span>
                                </h3>
                                <div className="relative">
                                    <select
                                        value={videoDuration}
                                        onChange={(e) => setVideoDuration(Number(e.target.value))}
                                        className="w-full h-14 bg-white border-4 border-black px-6 text-2xl font-normal outline-none appearance-none cursor-pointer hover:bg-gray-50 uppercase"
                                    >
                                        {availableDurations.map(d => (
                                            <option key={d} value={d}>{d} SECONDS ({d}秒)</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                                        <ChevronRight className="rotate-90" size={24} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bangers text-white mb-2 flex items-center gap-2">
                                    <Monitor size={24} /> 
                                    <span>ASPECT RATIO <span className="text-xl ml-1 font-normal">(视频比例)</span></span>
                                </h3>
                                <div className="relative">
                                    <select
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9')}
                                        className="w-full h-14 bg-white border-4 border-black px-6 text-2xl font-normal outline-none appearance-none cursor-pointer hover:bg-gray-50 uppercase"
                                    >
                                        <option value="9:16">9:16 (VERTICAL)</option>
                                        <option value="16:9">16:9 (HORIZONTAL)</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                                        <ChevronRight className="rotate-90" size={24} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                         </div>
                     </div>
                         
                    <div className="flex justify-center pt-8 pb-4">
                        <button 
                            onClick={handleGenerateScriptAction} 
                            disabled={!topic.trim() || !isStyleSelectionComplete() || isGeneratingScript} 
                            className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-12 py-5 font-bangers text-3xl tracking-widest uppercase border-4 border-black hover:-translate-y-1 transition-all flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <BookOpen className="text-[#FACC15]" size={32} /> 
                            <span>GENERATE SCRIPT</span>
                            <ArrowRight size={32} />
                        </button>
                    </div>
                </div>
            )}
          </div>
        )}

        {step === AppStep.SCRIPT && generatedScript && (
          <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            <div className="text-center space-y-3 mb-8">
                <h2 className="text-6xl font-bangers text-white uppercase tracking-wider drop-shadow-[4px_4px_0_#000]">Step 2. The Script</h2>
                <p className="text-white text-xl font-normal bg-black inline-block px-4 py-1 transform -skew-x-12 border-2 border-white">Review and refine your story.</p>
            </div>

            <div className="bg-black border-4 border-white p-8 relative">
                <div className="absolute -top-5 left-10 bg-white border-2 border-black px-4 py-1 font-bangers text-xl transform -rotate-1">
                    PRODUCTION SCRIPT
                </div>
                
                <div className="space-y-6 pt-4">
                    <div className="bg-white border-4 border-black p-6">
                        <div className="prose prose-lg max-w-none">
                            <textarea 
                                value={generatedScript.content}
                                onChange={(e) => setGeneratedScript({...generatedScript, content: e.target.value})}
                                className="w-full h-[400px] bg-gray-50 border-2 border-black p-6 font-sans text-lg outline-none focus:bg-white transition-colors resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-center gap-6 pt-4">
                        <button 
                            onClick={() => setStep(AppStep.INPUT)}
                            className="bg-white hover:bg-gray-100 text-black px-10 py-5 font-bangers text-2xl tracking-wide uppercase border-4 border-black hover:-translate-y-1 transition-all flex items-center gap-3"
                        >
                            <RefreshCw size={24} /> Back to Concept
                        </button>

                        <button 
                            onClick={handleGenerateVideoAction} 
                            disabled={isGeneratingVideo}
                            className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-12 py-5 font-bangers text-3xl tracking-widest uppercase border-4 border-black hover:-translate-y-1 transition-all flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Sparkles className="text-[#FACC15]" size={32} /> 
                            <span>GENERATE VIDEO</span>
                            <ArrowRight size={32} />
                        </button>
                    </div>
                </div>
            </div>
          </div>
        )}

        {step === AppStep.VIDEO_GENERATION && generatedVideoUrl && (
            <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
                <div className="text-center space-y-3 mb-8">
                    <h2 className="text-6xl font-bangers text-white uppercase tracking-wider drop-shadow-[4px_4px_0_#000]">Step 3. Video Result</h2>
                    <p className="text-white text-xl font-normal bg-black inline-block px-4 py-1 transform -skew-x-12 border-2 border-white">Your AI-generated masterpiece.</p>
                </div>

                <div className="bg-zinc-900 border-4 border-white p-8 relative overflow-hidden group">
                    {/* Decorative film holes */}
                    <div className="absolute left-2 top-0 bottom-0 w-8 flex flex-col gap-4 py-4">
                        {Array.from({length: 12}).map((_, i) => (
                            <div key={i} className="w-6 h-4 bg-white rounded-sm opacity-20"></div>
                        ))}
                    </div>
                    <div className="absolute right-2 top-0 bottom-0 w-8 flex flex-col gap-4 py-4">
                        {Array.from({length: 12}).map((_, i) => (
                            <div key={i} className="w-6 h-4 bg-white rounded-sm opacity-20"></div>
                        ))}
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-8 mx-4 md:mx-12">
                         <div className={clsx(
                             "relative border-8 border-black bg-black shadow-[0_0_50px_rgba(255,255,255,0.1)] rounded-lg overflow-hidden", 
                             aspectRatio === '16:9' ? 'w-full aspect-video max-w-5xl' : 'h-[75vh] aspect-[9/16]'
                         )}>
                            <video 
                                src={generatedVideoUrl} 
                                controls 
                                autoPlay 
                                loop 
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Display Prompt Used */}
                        <div className="w-full max-w-5xl bg-black/80 border-2 border-white/20 p-6 rounded-lg backdrop-blur-sm">
                            <h4 className="text-[#FACC15] font-bangers text-xl tracking-wide uppercase mb-2">Video Generation Prompt Used:</h4>
                            <p className="text-white/80 font-mono text-sm whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                                {(() => {
                                    const fullContent = generatedScript?.content || "";
                                    const marker = "【完整剧本内容】";
                                    const markerIndex = fullContent.indexOf(marker);
                                    if (markerIndex !== -1) {
                                         let contentAfter = fullContent.substring(markerIndex + marker.length);
                                         if (contentAfter.startsWith("：") || contentAfter.startsWith(":")) {
                                             contentAfter = contentAfter.substring(1);
                                         }
                                         return contentAfter.trim();
                                    }
                                    return fullContent;
                                })()}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-6 w-full mt-4">
                            <button 
                                onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = generatedVideoUrl;
                                    a.download = `aurora_video_${Date.now()}.mp4`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }}
                                className="bg-[#FACC15] hover:bg-[#EAB308] text-black px-10 py-5 font-bangers text-3xl tracking-wide uppercase border-4 border-black hover:-translate-y-1 transition-all flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <Download size={28} /> Download Video
                            </button>

                            <button 
                                onClick={() => setStep(AppStep.INPUT)}
                                className="bg-white hover:bg-gray-100 text-black px-10 py-5 font-bangers text-3xl tracking-wide uppercase border-4 border-black hover:-translate-y-1 transition-all flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <RefreshCw size={28} /> Create New
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </main>
      {(isGeneratingVideo || isGeneratingScript) && <LoadingOverlay message={loadingMessage} onCancel={handleCancelLoading} showLink={isGeneratingVideo} />}
    </div>
  );
}

export default App;
