
import React, { useState, useRef, useEffect } from 'react';
import { Scene, AssetItem, VideoModel } from '../types';
import { RefreshCw, Download, Maximize2, Wand2, X, Archive, AlertTriangle, ImagePlus, Edit2, Upload, Film, Trash2, LayoutGrid, PlayCircle, Clapperboard, ChevronDown, Layers, Clock, Zap, FileText, Image as ImageIcon, Video, List } from 'lucide-react';
import { clsx } from 'clsx';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

interface Props {
  scenes: Scene[];
  assets: { characters: AssetItem[], coreScenes: AssetItem[] };
  onRegenerateImage: (sceneIndex: number) => void;
  onUpdatePrompt: (sceneIndex: number, newPrompt: string, lang: 'en' | 'zh') => void;
  onUpdateScript: (sceneIndex: number, newScript: string) => void;
  onUpdateVideoPrompt?: (sceneIndex: number, newPrompt: string) => void;
  onSelectSceneImage?: (sceneIndex: number, historyIndex: number) => void;
  onManualUpload: (sceneIndex: number, file: File) => void;
  onDeleteImage: (sceneIndex: number) => void;
  onEnlarge: (base64Image: string) => void;
  aspectRatio: '9:16' | '16:9';
  onGenerateVideo?: (sceneIndex: number, duration: number, model: VideoModel) => void;
  onBatchGenerateVideos?: (model: VideoModel) => void;
  onEditImage?: (sceneIndex: number, instruction: string) => void;
  onRefinePrompt?: (sceneIndex: number) => void;
  topic?: string;
  onCancelVideoGeneration?: (sceneIndex: number) => void;
}

const StoryboardGrid: React.FC<Props> = ({ 
    scenes, assets, onRegenerateImage, onUpdatePrompt, onUpdateScript, onUpdateVideoPrompt,
    onSelectSceneImage, onManualUpload, onDeleteImage, onEnlarge, aspectRatio, onGenerateVideo, onBatchGenerateVideos, onEditImage, onRefinePrompt, topic,
    onCancelVideoGeneration
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  
  // Video Model State
  const [videoModel, setVideoModel] = useState<VideoModel>('sora-2-all');
  
  const handleDownloadImage = (base64Data: string, sceneNum: number) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = `scene_${sceneNum}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportProject = async () => {
      setIsExporting(true);
      try {
          const zip = new JSZip();
          const imgFolder = zip.folder(`storyboards_${aspectRatio.replace(':','x')}`);
          const excelData = scenes.map(scene => ({
              "场景编号": scene.sceneNumber,
              "剧本/动作": scene.script,
              "画面提示词": scene.visualPrompt || "",
              "Sora提示词(中)": scene.videoPromptZh || "",
              "Sora提示词(英)": scene.videoPrompt || "",
              "图片文件名": `scene_${scene.sceneNumber}.png`,
              "视频链接": scene.videoUrls?.join(', ') || ""
          }));
          
          scenes.forEach(scene => { if (scene.imageUrl) imgFolder?.file(`scene_${scene.sceneNumber}.png`, scene.imageUrl, { base64: true }); });
          
          const worksheet = XLSX.utils.json_to_sheet(excelData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Script & Prompts");
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          zip.file("project_data.xlsx", excelBuffer);
          const content = await zip.generateAsync({ type: "blob" });
          const url = window.URL.createObjectURL(content);
          const link = document.createElement('a'); link.href = url; 
          // Use topic as filename if available
          const safeTopic = topic ? topic.trim().replace(/[\\/:*?"<>|]/g, '_') : "Aurora_Project";
          link.download = `${safeTopic}.zip`; 
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
      } catch (error) { console.error("Export failed:", error); } finally { setIsExporting(false); }
  };

  const submitEdit = () => {
      if (editingSceneIndex !== null && editInstruction.trim() && onEditImage) {
          onEditImage(editingSceneIndex, editInstruction.trim());
          setEditingSceneIndex(null);
          setEditInstruction('');
      }
  };

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto animate-fade-in relative">
      {/* Edit Modal */}
      {editingSceneIndex !== null && (
          <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black p-8 max-w-lg w-full comic-shadow-lg animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
                      <h3 className="text-3xl font-bangers text-black flex items-center gap-2">
                          <Wand2 className="text-[#FACC15]" size={32} /> 
                          AI MAGIC EDIT
                      </h3>
                      <button onClick={() => setEditingSceneIndex(null)} className="text-black hover:text-red-500 transition-colors">
                          <X size={32} strokeWidth={3} />
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      {scenes[editingSceneIndex].imageUrl && (
                          <div className="w-full h-48 bg-black border-2 border-black overflow-hidden mb-4 relative">
                              <img src={`data:image/png;base64,${scenes[editingSceneIndex].imageUrl}`} className="w-full h-full object-contain" />
                          </div>
                      )}
                      
                      <div>
                          <label className="text-xl font-bangers text-black mb-2 block">INSTRUCTION</label>
                          <textarea 
                              value={editInstruction}
                              onChange={(e) => setEditInstruction(e.target.value)}
                              placeholder="e.g., Turn the character around, Make it rain..."
                              className="w-full bg-gray-100 border-2 border-black p-4 text-black focus:bg-white outline-none resize-none h-32 text-lg font-bold"
                              autoFocus
                          />
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4">
                          <button onClick={() => setEditingSceneIndex(null)} className="px-6 py-3 bg-gray-200 border-2 border-black hover:bg-gray-300 text-black font-bold font-bangers tracking-wide text-xl">
                              CANCEL
                          </button>
                          <button 
                            onClick={submitEdit}
                            disabled={!editInstruction.trim()}
                            className="px-8 py-3 bg-[#FACC15] border-2 border-black hover:bg-[#EAB308] text-black font-bold font-bangers tracking-wide text-xl disabled:opacity-50"
                          >
                              APPLY MAGIC
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-black pb-6 gap-6">
        <div className="flex-1">
            <h2 className="text-6xl font-bangers text-white uppercase tracking-wider drop-shadow-md">Step 4. ACTION!</h2>
            <p className="text-gray-400 text-xl font-bold font-comic mt-2">The storyboard is ready. Refine, Redraw, and Animate!</p>
            
            <div className="flex flex-wrap items-center gap-4 mt-6">
                <span className="text-sm font-bold text-black bg-[#FACC15] px-3 py-1 border-2 border-black transform -skew-x-12">
                RATIO: {aspectRatio}
                </span>
                
                {/* Redesigned Slidable Video Model Selector to match Asset Selector */}
                <div className="flex items-center bg-white border-2 border-black p-1.5 rounded-full gap-2 min-w-[320px]">
                    <button
                        onClick={() => setVideoModel('sora-2-all')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full transition-all relative group",
                            videoModel === 'sora-2-all' 
                                ? "bg-[#FACC15] text-black border-2 border-black" 
                                : "bg-transparent text-gray-400 hover:bg-gray-100 border-2 border-transparent"
                        )}
                    >
                        <div className="flex flex-col items-start leading-none">
                            <span className="font-bangers text-lg tracking-wide">SORA-2-ALL</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setVideoModel('veo_3_1-fast')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full transition-all relative group",
                            videoModel === 'veo_3_1-fast' 
                                ? "bg-[#FACC15] text-black border-2 border-black" 
                                : "bg-transparent text-gray-400 hover:bg-gray-100 border-2 border-transparent"
                        )}
                    >
                        <div className="flex flex-col items-start leading-none">
                            <span className="font-bangers text-lg tracking-wide">VEO 3.1</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
        
        <div className="flex gap-3">
            <a 
                href="https://www.jiguangmanying.xyz/console/task" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-8 py-3 border-4 border-black font-bangers text-xl hover:-translate-y-1 transition-all no-underline"
            >
                <List size={20} /> TASKS (查询进度)
            </a>

            <button 
                onClick={handleExportProject}
                disabled={isExporting}
                className="flex items-center gap-2 bg-[#FACC15] hover:bg-[#EAB308] text-black px-8 py-3 border-4 border-black font-bangers text-xl hover:-translate-y-1 transition-all"
            >
                <Archive size={20} /> {isExporting ? 'ZIPPING...' : 'EXPORT ZIP（素材下载）'}
            </button>
        </div>
      </div>

      <div className="flex flex-col gap-10">
          {scenes.map((scene, index) => (
             <SceneRow 
                key={scene.sceneNumber}
                scene={scene}
                index={index}
                aspectRatio={aspectRatio}
                videoModel={videoModel}
                onRegenerate={() => onRegenerateImage(index)}
                onUpdatePrompt={onUpdatePrompt}
                onUpdateScript={onUpdateScript}
                onUpdateVideoPrompt={onUpdateVideoPrompt}
                onEnlarge={onEnlarge}
                onDownload={() => scene.imageUrl && handleDownloadImage(scene.imageUrl, scene.sceneNumber)}
                onUpload={(f) => onManualUpload(index, f)}
                onDelete={() => onDeleteImage(index)}
                onGenerateVideo={(duration) => onGenerateVideo && onGenerateVideo(index, duration, videoModel)}
                onEditImage={() => setEditingSceneIndex(index)}
                onCancelVideo={() => onCancelVideoGeneration && onCancelVideoGeneration(index)}
             />
          ))}
      </div>
    </div>
  );
};

interface CardProps {
    scene: Scene;
    index: number;
    aspectRatio: '9:16' | '16:9';
    videoModel: VideoModel;
    onRegenerate: () => void;
    onUpdatePrompt: (i: number, p: string, l: 'en' | 'zh') => void;
    onUpdateScript: (i: number, s: string) => void;
    onUpdateVideoPrompt?: (i: number, p: string) => void;
    onEnlarge: (img: string) => void;
    onDownload: () => void;
    onUpload: (f: File) => void;
    onDelete: () => void;
    onGenerateVideo: (duration: number) => void;
    onEditImage: () => void;
    onCancelVideo?: () => void;
}

const SceneRow: React.FC<CardProps> = ({ 
    scene, index, aspectRatio, videoModel, onRegenerate, onUpdatePrompt, onUpdateScript, onUpdateVideoPrompt,
    onEnlarge, onDownload, onUpload, onDelete, onGenerateVideo, onEditImage, onCancelVideo
}) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const aspectClass = aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video';
    const gridItemAspectClass = aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video';
    
    // Tab state
    const [activeTab, setActiveTab] = useState<'script' | 'visual' | 'video'>('script');
    
    // Duration Logic
    // veo_3_1-fast only supports 8s. sora-2 supports 10, 15.
    const isVeo = videoModel === 'veo_3_1-fast';
    const [selectedDuration, setSelectedDuration] = useState<number>(scene.videoDuration || (isVeo ? 8 : 10));

    // Sync duration when model changes
    useEffect(() => {
        if (isVeo) {
            setSelectedDuration(8);
        } else if (selectedDuration === 8) {
            // Default sora duration
            setSelectedDuration(10);
        }
    }, [videoModel]);

    const videoUrls = scene.videoUrls || (scene.videoUrl ? [scene.videoUrl] : []);
    const hasMultipleVideos = videoUrls.length > 1;

    const uploadBtnClass = "flex items-center gap-2 bg-[#FACC15] hover:bg-[#EAB308] text-black px-6 py-2 border-2 border-black font-bangers text-xl hover:-translate-y-1 transition-all";

    return (
        <div className="bg-white border-4 border-black p-0 flex flex-col md:flex-row group relative h-auto">
             {/* Left Column: Image/Video Display (Expanded Space) */}
            <div className={`relative flex-1 bg-gray-100 border-b-4 md:border-b-0 md:border-r-4 border-black min-h-[400px]`}>
                 <div className={`relative w-full h-full flex items-center justify-center bg-black/5`}>
                    <div className={clsx(
                        "relative w-full max-h-[700px] transition-all", 
                        hasMultipleVideos ? "h-full" : aspectClass
                    )}>
                        
                        {scene.isGeneratingVideo && scene.imageUrl ? (
                             <div className="w-full h-full relative shadow-xl border-2 border-black">
                                <img 
                                    src={`data:image/png;base64,${scene.imageUrl}`} 
                                    className="w-full h-full object-cover" 
                                    alt={`Scene ${scene.sceneNumber}`}
                                />
                                <div className="absolute inset-0 bg-black/70 z-10 flex flex-col items-center justify-center text-center p-4">
                                    {/* Stop Button */}
                                    {onCancelVideo && (
                                        <button 
                                            onClick={onCancelVideo}
                                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full border-2 border-white shadow-md z-50 transition-transform hover:scale-110"
                                            title="Stop Video Generation"
                                        >
                                            <X size={24} strokeWidth={3} />
                                        </button>
                                    )}
                                    <RefreshCw className="animate-spin text-[#FACC15] mb-4" size={48} />
                                    <span className="font-bangers text-white text-3xl tracking-wider uppercase">GENERATING {videoModel.replace('_', ' ').replace('-fast', '').toUpperCase()}...</span>
                                    <p className="text-gray-300 font-sans font-bold mt-2 text-sm">THIS MAY TAKE A FEW MINUTES</p>
                                </div>
                             </div>
                        ) : scene.isGeneratingImage ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20 border-2 border-black">
                                <RefreshCw className="animate-spin text-black mb-2" size={32} />
                                <span className="font-bangers text-black text-xl animate-pulse">DRAWING...</span>
                            </div>
                        ) : videoUrls.length > 0 ? (
                            <div className={clsx(
                                "w-full",
                                hasMultipleVideos ? "flex flex-col gap-6 overflow-y-auto h-full max-h-[700px] pr-2" : "h-full"
                            )}>
                                {videoUrls.map((url, idx) => (
                                    <div key={idx} className={clsx(
                                        "relative group border-2 border-black bg-black shadow-md shrink-0 w-full",
                                        hasMultipleVideos ? gridItemAspectClass : "w-full h-full"
                                    )}>
                                        <video 
                                            src={url} 
                                            controls 
                                            className="w-full h-full object-contain" // Use contain to prevent obscured content
                                            autoPlay={idx === 0}
                                            loop
                                            muted
                                        />
                                        <div className="absolute top-2 right-2 z-20 pointer-events-none">
                                             <span className="bg-[#10B981] text-white text-[10px] font-bold px-2 py-1 border-2 border-black shadow-sm">
                                                VAR.{idx + 1}
                                             </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : scene.imageUrl ? (
                            <div className="w-full h-full relative shadow-xl border-2 border-black">
                                <img 
                                    src={`data:image/png;base64,${scene.imageUrl}`} 
                                    className="w-full h-full object-cover" 
                                    alt={`Scene ${scene.sceneNumber}`}
                                />
                                {/* Hover Overlay Controls */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-center gap-3 p-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => onEnlarge(scene.imageUrl!)} className="bg-white border-2 border-black p-3 hover:bg-gray-100 transform hover:scale-110 transition-transform" title="Zoom">
                                            <Maximize2 size={24} />
                                        </button>
                                        <button onClick={onDownload} className="bg-[#FACC15] border-2 border-black p-3 hover:bg-[#EAB308] transform hover:scale-110 transition-transform" title="Download Image">
                                            <Download size={24} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <button onClick={onEditImage} className="bg-[#A78BFA] border-2 border-black px-4 py-2 font-bangers tracking-wide text-white hover:bg-[#8B5CF6] flex items-center gap-2 text-xl">
                                            <Wand2 size={20} /> EDIT
                                        </button>
                                        <button onClick={() => fileRef.current?.click()} className={uploadBtnClass} title="Upload New">
                                            <Upload size={20} /> UPLOAD
                                        </button>
                                        <button onClick={onRegenerate} className="bg-[#3B82F6] border-2 border-black px-4 py-2 font-bangers tracking-wide text-white hover:bg-[#2563EB] flex items-center gap-2 text-xl">
                                            <RefreshCw size={20} /> REDRAW
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center border-2 border-black bg-gray-200">
                                {scene.error ? (
                                    <>
                                        <AlertTriangle className="text-red-500 mb-2" size={32} />
                                        <p className="text-xs font-bold text-red-600 mb-2">{scene.error}</p>
                                        <button onClick={onRegenerate} className="bg-red-100 border-2 border-red-500 text-red-600 px-3 py-1 font-bold text-xs uppercase hover:bg-red-200">Retry</button>
                                    </>
                                ) : (
                                    <>
                                        <ImagePlus className="text-gray-400 mb-2" size={48} />
                                        <span className="text-gray-500 font-bangers text-xl">NO IMAGE</span>
                                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                                            <button onClick={onRegenerate} className="bg-black text-white border-2 border-black px-4 py-2 font-bangers text-xl hover:bg-gray-800 flex items-center gap-2">
                                                <RefreshCw size={20} /> GENERATE
                                            </button>
                                            <button onClick={() => fileRef.current?.click()} className={uploadBtnClass}>
                                                <Upload size={20} /> UPLOAD
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        
                        <div className="absolute top-0 left-0 bg-black text-white px-3 py-1 font-bangers text-lg z-20 border-b-2 border-r-2 border-white">
                            SCENE {String(scene.sceneNumber).padStart(2,'0')}
                        </div>
                     </div>
                 </div>
                 <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            </div>
            
            {/* Right Column: Content & Actions (Fixed Width) */}
            <div className="md:w-96 p-6 flex flex-col gap-4 bg-white relative shrink-0">
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex flex-col">
                        {/* Redesigned Tabs - Optimized Style */}
                        <div className="flex p-1 bg-gray-200 border-2 border-black rounded-lg mb-4">
                            <button
                                onClick={() => setActiveTab('script')}
                                className={clsx(
                                    "flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition-all border-2",
                                    activeTab === 'script' ? "bg-white border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                                )}
                            >
                                <FileText size={16} /> 剧本
                            </button>
                            <button
                                onClick={() => setActiveTab('visual')}
                                className={clsx(
                                    "flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition-all border-2",
                                    activeTab === 'visual' ? "bg-white border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                                )}
                            >
                                <ImageIcon size={16} /> 画面
                            </button>
                            <button
                                onClick={() => setActiveTab('video')}
                                className={clsx(
                                    "flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-md transition-all border-2",
                                    activeTab === 'video' ? "bg-white border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                                )}
                            >
                                <Video size={16} /> 视频
                            </button>
                        </div>

                        <textarea 
                            value={
                                activeTab === 'script' ? scene.script : 
                                activeTab === 'visual' ? scene.visualPrompt : 
                                (scene.videoPrompt || '')
                            }
                            onChange={(e) => {
                                if (activeTab === 'script') onUpdateScript(index, e.target.value);
                                else if (activeTab === 'visual') onUpdatePrompt(index, e.target.value, 'en');
                                else if (activeTab === 'video') onUpdateVideoPrompt && onUpdateVideoPrompt(index, e.target.value);
                            }}
                            className="w-full bg-yellow-50 border-2 border-black p-4 text-lg font-medium font-sans resize-none flex-1 min-h-[500px] outline-none focus:bg-white transition-colors leading-relaxed"
                            placeholder={activeTab === 'video' ? "Video generation prompt..." : ""}
                        />
                    </div>
                </div>
                
                <div className="pt-4 border-t-2 border-gray-100 flex flex-col gap-3">
                     <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            {aspectRatio} / {videoModel.toUpperCase().replace('-FAST','')} / {scene.imageUrl ? 'GENERATED' : 'PENDING'}
                        </div>
                     </div>

                     <div className="flex gap-2 items-center">
                        <div className="relative flex-shrink-0">
                            {isVeo ? (
                                <div className="bg-white border-2 border-black px-3 py-3 font-bangers text-lg h-full flex items-center justify-center min-w-[60px]">
                                    8s
                                </div>
                            ) : (
                                <>
                                    <select 
                                        value={selectedDuration}
                                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                                        className="appearance-none bg-white border-2 border-black px-3 py-3 pr-8 font-bangers text-lg focus:outline-none cursor-pointer hover:bg-gray-50 h-full"
                                    >
                                        <option value={10}>10s</option>
                                        <option value={15}>15s</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
                                </>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => onGenerateVideo(selectedDuration)}
                            disabled={scene.isGeneratingVideo || !scene.imageUrl}
                            className={clsx(
                                "flex-1 px-4 py-3 font-bangers tracking-wide text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg",
                                videoUrls.length > 0 ? "bg-[#10B981] hover:bg-[#059669] border-2 border-black" : "bg-black hover:bg-gray-800 border-2 border-black"
                            )}
                        >
                            {scene.isGeneratingVideo ? <RefreshCw className="animate-spin" size={20} /> : (videoUrls.length > 0 ? <PlayCircle size={20} /> : <Film size={20} />)}
                            {scene.isGeneratingVideo ? 'MAKING...' : (videoUrls.length > 0 ? 'RE-GENERATE' : 'GENERATE VIDEO')}
                        </button>
                     </div>
                     
                     {videoUrls.length > 0 && !scene.isGeneratingVideo && (
                         <div className="space-y-2 mt-2">
                            {videoUrls.map((url, i) => (
                                <a 
                                    key={i}
                                    href={url}
                                    download={`scene_${scene.sceneNumber}_v${i+1}.mp4`}
                                    className="w-full flex items-center justify-center gap-2 bg-[#FACC15] hover:bg-[#EAB308] border-2 border-black py-2 font-bangers tracking-wide text-black text-lg transition-colors uppercase"
                                >
                                    <Download size={18} /> DOWNLOAD V.{i+1}
                                </a>
                            ))}
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default StoryboardGrid;
