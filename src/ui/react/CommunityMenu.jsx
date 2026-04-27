import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trophy, Zap, Gamepad2, ArrowLeft, ChevronRight, Star, Heart, Clock, Globe, Map as MapIcon, Download } from 'lucide-react';

const MINIGAMES = [
    {
        id: 'parkour',
        name: 'Block Rush',
        desc: 'Test your agility in a procedural sky-high parkour course. Don\'t look down!',
        players: '124 Playing',
        rating: 4.8,
        icon: <Zap className="w-6 h-6 text-yellow-400" />,
        color: 'from-yellow-500/20 to-transparent',
        tag: 'Arcade'
    },
    {
        id: 'spleef',
        name: 'Spleef Arena',
        desc: 'The classic! Dig out the floor beneath your opponents to be the last one standing.',
        players: '82 Playing',
        rating: 4.9,
        icon: <Trophy className="w-6 h-6 text-sky-400" />,
        color: 'from-sky-500/20 to-transparent',
        tag: 'Competitive'
    },
    {
        id: 'arena',
        name: 'Survival Arena',
        desc: 'Battle waves of mobs in a shrinking coliseum. How long can you survive?',
        players: '45 Playing',
        rating: 4.6,
        icon: <Star className="w-6 h-6 text-rose-400" />,
        color: 'from-rose-500/20 to-transparent',
        tag: 'Survival'
    },
    {
        id: 'creative',
        name: 'Creative Canvas',
        desc: 'A shared infinite world for master builders. Showcase your massive voxel structures.',
        players: '210 Playing',
        rating: 4.7,
        icon: <Gamepad2 className="w-6 h-6 text-emerald-400" />,
        color: 'from-emerald-500/20 to-transparent',
        tag: 'Creative'
    }
];

const MAPS = [
    {
        id: 'skyblock',
        name: 'Skyblock Classic',
        desc: 'Survive on a tiny island in the void with only a tree and a chest of basic supplies.',
        downloads: '12k',
        rating: 4.9,
        icon: <Globe className="w-6 h-6 text-sky-400" />,
        color: 'from-sky-500/20 to-transparent',
        tag: 'Survival'
    },
    {
        id: 'adventure',
        name: 'Ancient City',
        desc: 'Explore the ruins of a lost civilization. Solve puzzles and uncover hidden lore.',
        downloads: '8.4k',
        rating: 4.7,
        icon: <MapIcon className="w-6 h-6 text-amber-400" />,
        color: 'from-amber-500/20 to-transparent',
        tag: 'Adventure'
    },
    {
        id: 'parkour_map',
        name: 'Neon Runners',
        desc: 'A high-speed parkour map through a cyberpunk city built entirely in voxels.',
        downloads: '5.2k',
        rating: 4.8,
        icon: <Zap className="w-6 h-6 text-fuchsia-400" />,
        color: 'from-fuchsia-500/20 to-transparent',
        tag: 'Parkour'
    }
];

export const CommunityMenu = ({ onBack, onPlayGame }) => {
    const [tab, setTab] = useState('games');
    const items = tab === 'games' ? MINIGAMES : MAPS;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="w-full max-w-6xl h-[85vh] flex flex-col bg-slate-950/60 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden relative"
        >
            {/* Header */}
            <div className="p-10 pb-6 flex items-center justify-between border-b border-white/5 relative z-10">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onBack}
                        className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Users className="w-5 h-5 text-sky-400" />
                            <h1 className="text-3xl font-black uppercase italic tracking-tight text-white">Community Hub</h1>
                        </div>
                        <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em]">Play Mini-Games & Explore Custom Worlds</p>
                    </div>
                </div>

                <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                    <button 
                        onClick={() => setTab('games')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'games' ? 'bg-sky-500 text-slate-950 shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        Mini-Games
                    </button>
                    <button 
                        onClick={() => setTab('maps')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'maps' ? 'bg-sky-500 text-slate-950 shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        Custom Maps
                    </button>
                </div>
            </div>

            {/* Content Scroll */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={tab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-2 gap-6"
                    >
                        {items.map((game, idx) => (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                className={`group relative p-8 rounded-[40px] bg-gradient-to-br ${game.color} border border-white/5 hover:border-white/20 transition-all cursor-pointer`}
                                onClick={() => onPlayGame(game.id)}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                        {game.icon}
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/80 transition-colors border border-white/5">
                                        {game.tag}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">{game.name}</h3>
                                <p className="text-white/40 text-xs leading-relaxed font-medium mb-6 line-clamp-2">
                                    {game.desc}
                                </p>

                                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                                    <div className="flex items-center gap-4">
                                        {tab === 'games' ? (
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5 text-white/30" />
                                                <span className="text-[10px] font-bold text-white/60 uppercase">{game.players}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <Download className="w-3.5 h-3.5 text-white/30" />
                                                <span className="text-[10px] font-bold text-white/60 uppercase">{game.downloads} Downloads</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5 text-yellow-500/50" />
                                            <span className="text-[10px] font-bold text-white/60 uppercase">{game.rating}</span>
                                        </div>
                                    </div>
                                    
                                    <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-sky-500 group-hover:text-slate-950">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Footer Deco */}
                <div className="mt-12 p-8 rounded-[40px] bg-white/5 border border-white/5 flex items-center justify-between group hover:border-sky-500/30 transition-all relative overflow-hidden">
                    <div className="relative z-10">
                        <span className="text-sky-400 text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Featured Activity</span>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight mb-1">Weekly Build Battle</h2>
                        <p className="text-white/40 text-xs font-medium">Topic: "Floating Island" — Competition ends in 2 days.</p>
                    </div>
                    <button className="relative z-10 px-8 py-4 bg-sky-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-400 transition-all shadow-xl">Join Contest</button>
                    
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        </motion.div>
    );
};
