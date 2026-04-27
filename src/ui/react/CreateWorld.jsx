
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, Zap, Cpu, ArrowRight, X, ChevronRight, Hash } from 'lucide-react';

export const CreateWorld = ({ onBack, onCreate }) => {
    const [worldName, setWorldName] = useState('New World');
    const [seed, setSeed] = useState(Math.floor(Math.random() * 9999999).toString());
    const [worldType, setWorldType] = useState('infinite'); // infinite, flat, void
    const [difficulty, setDifficulty] = useState('normal'); // peaceful, normal, hardcore
    const [gameMode, setGameMode] = useState('survival'); // survival, creative, spectator, adventure

    const worldTypes = [
        { id: 'infinite', name: 'Infinite', desc: 'Endless procedurally generated terrain with biomes and caves.', icon: <Globe className="w-5 h-5 text-sky-400" /> },
        { id: 'flat', name: 'Superflat', desc: 'A perfectly flat world, great for testing and creative builds.', icon: <Zap className="w-5 h-5 text-amber-400" /> },
        { id: 'void', name: 'Void', desc: 'Start with nothing but a single block in a dark abyss.', icon: <Shield className="w-5 h-5 text-indigo-400" /> }
    ];

    const handleCreate = () => {
        onCreate({
            name: worldName,
            seed: parseInt(seed) || 12345,
            type: worldType,
            difficulty: difficulty,
            gameMode: gameMode
        });
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-4xl p-12 bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-[120px] -z-10" />

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">Create World</h2>
                    <p className="text-white/40 text-sm font-medium tracking-wide uppercase mt-1">Configure your new dimension</p>
                </div>
                <button onClick={onBack} className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-white/40 hover:text-white">
                    <X className="w-8 h-8" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Basics */}
                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] ml-2">World Name</label>
                        <input 
                            type="text" 
                            value={worldName}
                            onChange={(e) => setWorldName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-sky-500/50 transition-colors"
                            placeholder="Enter world name..."
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] ml-2">World Seed</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <input 
                                type="text" 
                                value={seed}
                                onChange={(e) => setSeed(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white font-mono focus:outline-none focus:border-sky-500/50 transition-colors"
                                placeholder="Leave blank for random..."
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] ml-2">Difficulty</label>
                        <div className="flex gap-2">
                            {['peaceful', 'normal', 'hardcore'].map(d => (
                                <button 
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${difficulty === d ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] ml-2">Initial Game Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'survival',  name: 'Survival' },
                                { id: 'creative',  name: 'Creative' },
                                { id: 'adventure', name: 'Adventure' },
                                { id: 'spectator', name: 'Spectator' }
                            ].map(m => (
                                <button 
                                    key={m.id}
                                    onClick={() => setGameMode(m.id)}
                                    className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${gameMode === m.id ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: World Type Selection */}
                <div className="space-y-4">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] ml-2">Generation Type</label>
                    <div className="space-y-3">
                        {worldTypes.map((type) => (
                            <button 
                                key={type.id}
                                onClick={() => setWorldType(type.id)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${worldType === type.id ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-white/5 border-white/5 hover:border-white/10 opacity-60 hover:opacity-100'}`}
                            >
                                <div className={`p-2 rounded-xl bg-slate-950/50 ${worldType === type.id ? 'text-white' : 'text-white/40'}`}>
                                    {type.icon}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{type.name}</h4>
                                    <p className="text-[10px] text-white/40 leading-relaxed mt-1 font-medium">{type.desc}</p>
                                </div>
                                {worldType === type.id && <ChevronRight className="ml-auto w-4 h-4 text-sky-400 self-center" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-4">
                <button 
                    onClick={onBack}
                    className="flex-1 p-6 rounded-3xl bg-white/5 text-white font-black uppercase tracking-[0.2em] hover:bg-white/10 border border-white/5 transition-all"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleCreate}
                    className="flex-[2] p-6 rounded-3xl bg-sky-500 text-slate-950 font-black uppercase tracking-[0.2em] hover:bg-sky-400 shadow-[0_0_50px_rgba(56,189,248,0.3)] flex items-center justify-center gap-3 transition-all group"
                >
                    Generate World <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
            </div>
        </div>
    );
};
