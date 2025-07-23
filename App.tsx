import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scene } from './types';
import { generateImagePromptForScript, generateImage } from './services/geminiService';
import Loader from './components/Loader';
import { PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, SyncIcon, UploadIcon } from './components/icons';

const App: React.FC = () => {
    const [scriptFile, setScriptFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const sceneDurationRef = useRef<number>(0);

    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [regeneratingSceneId, setRegeneratingSceneId] = useState<number | null>(null);

    // Audio playback effect
    useEffect(() => {
        if (isPlaying) {
            audioRef.current?.play();
        } else {
            audioRef.current?.pause();
        }
    }, [isPlaying]);
    
    // Cleanup on unmount
    useEffect(() => {
      const url = audioUrl;
      return () => {
        // Revoke the object URL to avoid memory leaks
        if (url) {
            URL.revokeObjectURL(url);
        }
      }
    }, [audioUrl]);

    const handleScriptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'text/plain') {
            setScriptFile(file);
            setError(null);
        } else {
            setScriptFile(null);
            e.target.value = ''; // Reset file input
            setError('有効なテキストファイル（.txt）を選択してください。');
        }
    };

    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            setAudioFile(file);
            setError(null);
        } else {
            setAudioFile(null);
            e.target.value = ''; // Reset file input
            setError('有効な音声ファイルを選択してください。');
        }
    };

    const handleCreateStoryboard = async () => {
        if (!scriptFile || !audioFile) {
            setError('テキストファイルと音声ファイルの両方をアップロードしてください。');
            return;
        }
        setIsLoading(true);
        setError(null);
        setScenes([]);
        setCurrentSceneIndex(0);
        setIsPlaying(false);
        if(audioRef.current) audioRef.current.currentTime = 0;

        try {
            setLoadingMessage('スクリプトを読み込み中...');
            const scriptContent = await scriptFile.text();
            const scriptLines = scriptContent.split('\n').filter(line => line.trim() !== '');
            
            if (scriptLines.length === 0) {
                throw new Error("スクリプトファイルが空か、内容がありません。");
            }

            const initialScenes: Scene[] = scriptLines.map((line, index) => ({
                id: index,
                imagePrompt: '', // Will be generated
                narratorScript: line,
                imageUrl: null,
            }));
            setScenes(initialScenes);
            
            const newAudioUrl = URL.createObjectURL(audioFile);
            setAudioUrl(newAudioUrl);

            for (let i = 0; i < initialScenes.length; i++) {
                setLoadingMessage(`シーン ${i + 1}/${initialScenes.length} のプロンプトを生成中...`);
                const prompt = await generateImagePromptForScript(initialScenes[i].narratorScript);
                 setScenes(prevScenes =>
                    prevScenes.map(s => (s.id === i ? { ...s, imagePrompt: prompt } : s))
                );

                setLoadingMessage(`シーン ${i + 1}/${initialScenes.length} の画像を生成中...`);
                const imageUrl = await generateImage(prompt);
                setScenes(prevScenes =>
                    prevScenes.map(s => (s.id === i ? { ...s, imageUrl } : s))
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
            setAudioUrl(null);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const togglePlayPause = () => {
      if (scenes.length > 0 && audioUrl) {
          setIsPlaying(prev => !prev);
      }
    };

    const handleAudioTimeUpdate = () => {
        if (!audioRef.current || sceneDurationRef.current === 0) return;
        const newIndex = Math.min(
            scenes.length - 1,
            Math.floor(audioRef.current.currentTime / sceneDurationRef.current)
        );
        if (newIndex !== currentSceneIndex) {
            setCurrentSceneIndex(newIndex);
        }
        // Force a re-render to update the progress bar
        forceUpdate({}); 
    };
    
    const handleAudioLoadedMetadata = () => {
        if (!audioRef.current || scenes.length === 0) return;
        const duration = audioRef.current.duration;
        if (duration && isFinite(duration)) {
             sceneDurationRef.current = duration / scenes.length;
        }
    };
    
    const handleAudioEnded = () => {
        setIsPlaying(false);
        setCurrentSceneIndex(scenes.length - 1);
    }

    const goToScene = useCallback((index: number) => {
        if (scenes.length === 0 || !audioRef.current || !isFinite(sceneDurationRef.current)) return;
        const newIndex = (index + scenes.length) % scenes.length;
        setCurrentSceneIndex(newIndex);
        audioRef.current.currentTime = newIndex * sceneDurationRef.current;
    }, [scenes.length]);

    const nextScene = useCallback(() => goToScene(currentSceneIndex + 1), [currentSceneIndex, goToScene]);
    const prevScene = useCallback(() => goToScene(currentSceneIndex - 1), [currentSceneIndex, goToScene]);
    
    const [, forceUpdate] = useState({}); // To force re-render for progress bar

    const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newScript = e.target.value;
        setScenes(prev => prev.map((s, i) => i === currentSceneIndex ? { ...s, narratorScript: newScript } : s));
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newPrompt = e.target.value;
        setScenes(prev => prev.map((s, i) => i === currentSceneIndex ? { ...s, imagePrompt: newPrompt } : s));
    };
    
    const handleRegenerateImage = async () => {
        if (!currentScene) return;
        setIsPlaying(false);
        setRegeneratingSceneId(currentScene.id);
        setError(null);
        try {
            const imageUrl = await generateImage(currentScene.imagePrompt);
            setScenes(prev => prev.map(s => s.id === currentScene.id ? { ...s, imageUrl } : s));
        } catch (err) {
            setError(err instanceof Error ? err.message : '画像の再生成に失敗しました。');
        } finally {
            setRegeneratingSceneId(null);
        }
    };

    const currentScene = scenes[currentSceneIndex];

    const renderControlPanel = () => (
        <aside className="xl:w-1/3 2xl:w-1/4 bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col">
            <h2 className="text-2xl font-semibold mb-6 text-cyan-400">ビデオ設定</h2>
            <div className="space-y-6 flex-grow">
                <div>
                    <label htmlFor="scriptFile" className="block text-sm font-medium text-slate-300 mb-2">1. ナレーション原稿 (.txt)</label>
                    <label className="w-full flex items-center justify-center px-4 py-3 bg-slate-700 border border-slate-600 rounded-md cursor-pointer hover:bg-slate-600 transition">
                        <UploadIcon className="w-5 h-5 mr-2" />
                        <span className="text-sm text-slate-300 truncate">{scriptFile ? scriptFile.name : 'ファイルを選択'}</span>
                        <input id="scriptFile" type="file" accept=".txt" onChange={handleScriptFileChange} className="hidden" />
                    </label>
                    <p className="text-xs text-slate-400 mt-1">1行が1シーンになります。</p>
                </div>
                <div>
                    <label htmlFor="audioFile" className="block text-sm font-medium text-slate-300 mb-2">2. ナレーション音声</label>
                     <label className="w-full flex items-center justify-center px-4 py-3 bg-slate-700 border border-slate-600 rounded-md cursor-pointer hover:bg-slate-600 transition">
                        <UploadIcon className="w-5 h-5 mr-2" />
                        <span className="text-sm text-slate-300 truncate">{audioFile ? audioFile.name : 'ファイルを選択'}</span>
                        <input id="audioFile" type="file" accept="audio/*" onChange={handleAudioFileChange} className="hidden" />
                    </label>
                    <p className="text-xs text-slate-400 mt-1">MP3, WAVなどに対応しています。</p>
                </div>
            </div>
            <button
                onClick={handleCreateStoryboard}
                disabled={isLoading || !scriptFile || !audioFile}
                className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
                <SparklesIcon className="w-5 h-5" />
                {isLoading ? '生成中...' : 'ストーリーボードを作成'}
            </button>
            {error && !isLoading && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
        </aside>
    );

    const renderPreview = () => (
        <div className="w-full md:w-1/2 lg:w-2/5 bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700 flex flex-col items-center justify-center p-6 min-h-[60vh] md:min-h-0">
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onLoadedMetadata={handleAudioLoadedMetadata}
                    onEnded={handleAudioEnded}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
            )}
            {isLoading ? (
                <Loader message={loadingMessage} />
            ) : scenes.length > 0 ? (
                <div className="w-full h-full flex flex-col">
                    <div className="flex-grow relative w-full aspect-[9/16] max-w-sm mx-auto bg-slate-900 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700">
                        {scenes.map((scene, index) => {
                            const isVisible = index === currentSceneIndex;
                            const isRegenerating = regeneratingSceneId === scene.id;
                            return (
                                <div
                                    key={scene.id}
                                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                >
                                    {scene.imageUrl && !isRegenerating ? (
                                        <img src={scene.imageUrl} alt={`Scene ${index + 1}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-700">
                                            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="w-full max-w-sm mx-auto mt-4 text-center">
                        <p className="text-slate-300 h-12 flex items-center justify-center px-2">{currentScene?.narratorScript || ''}</p>
                    </div>
                    <div className="w-full max-w-sm mx-auto mt-4 flex items-center justify-center space-x-4">
                        <button onClick={prevScene} className="p-3 bg-slate-700 rounded-full hover:bg-slate-600 transition disabled:opacity-50" disabled={isLoading || scenes.length === 0}><ChevronLeftIcon className="w-6 h-6" /></button>
                        <button
                            onClick={togglePlayPause}
                            className="p-4 bg-cyan-500 rounded-full hover:bg-cyan-600 transition disabled:opacity-50"
                            disabled={isLoading || scenes.length === 0 || scenes.some(s => !s.imageUrl) || regeneratingSceneId !== null || !audioUrl}
                        >
                            {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
                        </button>
                        <button onClick={nextScene} className="p-3 bg-slate-700 rounded-full hover:bg-slate-600 transition disabled:opacity-50" disabled={isLoading || scenes.length === 0}><ChevronRightIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="w-full max-w-sm mx-auto mt-4 relative h-1.5 bg-slate-600 rounded-full overflow-hidden">
                        <div 
                            className="absolute top-0 left-0 h-full bg-cyan-400 transition-width duration-100"
                            style={{ width: `${audioRef.current && audioRef.current.duration ? (audioRef.current.currentTime / audioRef.current.duration) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-400">
                    <h3 className="text-xl font-semibold mb-2">準備完了</h3>
                    <p>左のパネルでナレーション原稿と音声ファイルを<br/>アップロードしてください。</p>
                </div>
            )}
        </div>
    );
    
    const renderEditor = () => (
         <div className="w-full md:w-1/2 lg:w-3/5 bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700 p-6 flex flex-col">
             {scenes.length > 0 && currentScene ? (
                <div className="flex flex-col h-full">
                    <h3 className="text-2xl font-semibold mb-4 text-cyan-400">シーン {currentSceneIndex + 1} の編集</h3>
                    <div className="space-y-4 flex-grow flex flex-col">
                        <div className="flex flex-col flex-grow">
                            <label htmlFor="narratorScript" className="block text-sm font-medium text-slate-300 mb-2">ナレーション</label>
                            <textarea
                                id="narratorScript"
                                value={currentScene.narratorScript}
                                onChange={handleScriptChange}
                                rows={4}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition flex-grow"
                            />
                        </div>
                        <div className="flex flex-col flex-grow">
                            <label htmlFor="imagePrompt" className="block text-sm font-medium text-slate-300 mb-2">画像プロンプト</label>
                            <textarea
                                id="imagePrompt"
                                value={currentScene.imagePrompt}
                                onChange={handlePromptChange}
                                rows={6}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition flex-grow"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleRegenerateImage}
                        disabled={isLoading || regeneratingSceneId !== null}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <SyncIcon className={`w-5 h-5 ${regeneratingSceneId === currentScene.id ? 'animate-spin' : ''}`} />
                        {regeneratingSceneId === currentScene.id ? '画像を生成中...' : 'このシーンの画像を再生成'}
                    </button>
                    {error && regeneratingSceneId !== null && <p className="text-red-400 mt-2 text-sm text-center">{error}</p>}
                </div>
             ) : (
                <div className="text-center text-slate-400 m-auto">
                    <h3 className="text-xl font-semibold mb-2">エディター</h3>
                    <p>ストーリーボードを生成すると、<br/>ここで各シーンの編集ができます。</p>
                </div>
             )}
        </div>
    );
    
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 md:p-8 font-sans">
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-600">
                    AI ショート動画クリエーター
                </h1>
                <p className="text-slate-400 mt-2">あなたの原稿とナレーションから、AIがビデオを生成します</p>
            </header>

            <main className="flex-grow flex flex-col xl:flex-row gap-8">
                {renderControlPanel()}

                <section className="flex-grow xl:w-2/3 2xl:w-3/4 flex flex-col md:flex-row gap-8">
                    {renderPreview()}
                    {renderEditor()}
                </section>
            </main>
        </div>
    );
};

export default App;
