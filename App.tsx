import React, { useState, useEffect, useCallback } from 'react';
import { Scene } from './types';
import { generateScript, generateImage } from './services/geminiService';
import Loader from './components/Loader';
import { PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, SyncIcon } from './components/icons';

const App: React.FC = () => {
    const [topic, setTopic] = useState<string>('宇宙の魅力');
    const [sceneCount, setSceneCount] = useState<number>(5);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [regeneratingSceneId, setRegeneratingSceneId] = useState<number | null>(null);

    // Speech synthesis effect
    useEffect(() => {
        if (isPlaying && scenes.length > 0 && scenes[currentSceneIndex]) {
            const script = scenes[currentSceneIndex].narratorScript;
            const utterance = new SpeechSynthesisUtterance(script);
            utterance.lang = 'ja-JP';
            utterance.rate = 1.0;

            utterance.onend = () => {
                if (currentSceneIndex < scenes.length - 1) {
                    setCurrentSceneIndex(prev => prev + 1);
                } else {
                    setIsPlaying(false); // End of storyboard
                }
            };
            
            utterance.onerror = (event) => {
                console.error("Speech synthesis error:", event.error);
                setIsPlaying(false);
            };

            window.speechSynthesis.speak(utterance);

            return () => {
                window.speechSynthesis.cancel();
            };
        } else {
             window.speechSynthesis.cancel();
        }
    }, [isPlaying, currentSceneIndex, scenes]);
    
    // Cleanup on unmount
    useEffect(() => {
      return () => {
        window.speechSynthesis.cancel();
      }
    }, []);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('トピックを入力してください。');
            return;
        }
        setIsLoading(true);
        setError(null);
        setScenes([]);
        setCurrentSceneIndex(0);
        setIsPlaying(false);
        window.speechSynthesis.cancel();

        try {
            setLoadingMessage('AIがシナリオを執筆中...');
            const scriptData = await generateScript(topic, sceneCount);
            
            const initialScenes: Scene[] = scriptData.scenes.map((s, index) => ({
                id: index,
                imagePrompt: s.image_prompt,
                narratorScript: s.narrator_script,
                imageUrl: null,
            }));
            setScenes(initialScenes);

            for (let i = 0; i < initialScenes.length; i++) {
                setLoadingMessage(`シーン ${i + 1}/${initialScenes.length} の画像を生成中...`);
                const imageUrl = await generateImage(initialScenes[i].imagePrompt);
                setScenes(prevScenes =>
                    prevScenes.map(s => (s.id === i ? { ...s, imageUrl } : s))
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const togglePlayPause = () => {
      if (isPlaying) {
        setIsPlaying(false);
      } else if (scenes.length > 0) {
        // If at the end, restart from the beginning
        if (currentSceneIndex === scenes.length - 1 && !scenes[currentSceneIndex]?.narratorScript) {
             setCurrentSceneIndex(0);
        }
        setIsPlaying(true);
      }
    };

    const nextScene = useCallback(() => {
        setIsPlaying(false);
        if (scenes.length > 0) {
            setCurrentSceneIndex(prev => (prev + 1) % scenes.length);
        }
    }, [scenes.length]);

    const prevScene = useCallback(() => {
        setIsPlaying(false);
        if (scenes.length > 0) {
            setCurrentSceneIndex(prev => (prev - 1 + scenes.length) % scenes.length);
        }
    }, [scenes.length]);

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

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 md:p-8 font-sans">
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-600">
                    AI ショート動画クリエーター
                </h1>
                <p className="text-slate-400 mt-2">AIの力で、あなたのアイデアを魅力的なビデオストーリーに</p>
            </header>

            <main className="flex-grow flex flex-col xl:flex-row gap-8">
                {/* Control Panel */}
                <aside className="xl:w-1/3 2xl:w-1/4 bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col">
                    <h2 className="text-2xl font-semibold mb-6 text-cyan-400">ビデオ設定</h2>
                    <div className="space-y-6 flex-grow">
                        <div>
                            <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-2">動画のトピック</label>
                            <input
                                id="topic"
                                type="text"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="例：未来の東京"
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                            />
                        </div>
                        <div>
                            <label htmlFor="sceneCount" className="block text-sm font-medium text-slate-300 mb-2">シーンの数: {sceneCount}</label>
                            <input
                                id="sceneCount"
                                type="range"
                                min="3"
                                max="10"
                                value={sceneCount}
                                onChange={e => setSceneCount(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? '生成中...' : 'ストーリーボードを作成'}
                    </button>
                    {error && !isLoading && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
                </aside>

                {/* Video Preview & Editor */}
                <section className="flex-grow xl:w-2/3 2xl:w-3/4 flex flex-col md:flex-row gap-8">
                     {/* Video Preview */}
                    <div className="w-full md:w-1/2 lg:w-2/5 bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700 flex flex-col items-center justify-center p-6 min-h-[60vh] md:min-h-0">
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
                                        disabled={isLoading || scenes.length === 0 || scenes.some(s => !s.imageUrl) || regeneratingSceneId !== null}
                                    >
                                        {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
                                    </button>
                                    <button onClick={nextScene} className="p-3 bg-slate-700 rounded-full hover:bg-slate-600 transition disabled:opacity-50" disabled={isLoading || scenes.length === 0}><ChevronRightIcon className="w-6 h-6" /></button>
                                </div>
                                <div className="w-full max-w-xs mx-auto mt-4 flex justify-center items-center space-x-2">
                                    {scenes.map((_, index) => (
                                        <div key={index} className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSceneIndex ? 'bg-cyan-400 w-6' : 'bg-slate-600 w-2'}`}></div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400">
                                <h3 className="text-xl font-semibold mb-2">準備完了</h3>
                                <p>左のパネルで動画のトピックとシーン数を設定し、<br/>「ストーリーボードを作成」ボタンを押してください。</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Scene Editor */}
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
                </section>
            </main>
        </div>
    );
};

export default App;
