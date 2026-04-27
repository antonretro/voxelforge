import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Map as MapIcon, Home, Pickaxe, Droplets, X, ChevronRight, Globe } from 'lucide-react';

const UPDATES = [
    {
        title: 'Exploration Overhaul',
        icon: <Globe className="w-5 h-5 text-sky-400" />,
        desc: 'World generation has been expanded to 29 unique biomes. Explore Lush Caves, Ice Spikes, and expansive Wooded Badlands.',
        color: 'from-sky-500/20 to-transparent'
    },
    {
        title: 'Dynamic Hydrology',
        icon: <Droplets className="w-5 h-5 text-blue-400" />,
        desc: 'Rivers now carve through the landscape, winding between mountains. In cold biomes, they freeze into solid ice.',
        color: 'from-blue-500/20 to-transparent'
    },
    {
        title: 'Living Structures',
        icon: <Home className="w-5 h-5 text-emerald-400" />,
        desc: 'Discover randomly generated Villages and abandoned Mineshafts branching deep underground with oak supports and hidden loot.',
        color: 'from-emerald-500/20 to-transparent'
    },
    {
        title: '25+ New Blocks',
        icon: <Pickaxe className="w-5 h-5 text-amber-400" />,
        desc: 'Added Lanterns, Rails, Torches, Hay Blocks, and a full suite of vegetation including Lily Pads and Sugar Cane.',
        color: 'from-amber-500/20 to-transparent'
    }
];

const NEW_BLOCKS = [
    'torch', 'lantern', 'rail', 'cobweb', 'hay_block', 'pumpkin', 
    'lily_pad', 'sugar_cane', 'iron_bars', 'spawner', 'wheat_stage7'
];

export const UpdateLog = ({ onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-4xl bg-[#0a1122] rounded-[48px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative"
            >
                {/* Header Section */}
                <div className="p-10 pb-6 flex items-center justify-between border-b border-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-sky-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Update 1.2.0</span>
                            </div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tight text-white">The World Expansion</h1>
                        </div>
                        <p className="text-white/40 text-sm font-medium">Massive terrain overhaul, new structures, and the hydrology update.</p>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all group"
                    >
                        <X className="w-6 h-6 text-white/30 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        {UPDATES.map((update, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + idx * 0.05 }}
                                className={`p-6 rounded-[32px] bg-gradient-to-br ${update.color} border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        {update.icon}
                                    </div>
                                    <h3 className="text-lg font-black uppercase italic tracking-tight text-white">{update.title}</h3>
                                </div>
                                <p className="text-white/50 text-xs leading-relaxed font-medium">
                                    {update.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Block Showcase */}
                    <div className="mt-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-white/5" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">New Block Library</h4>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center">
                            {NEW_BLOCKS.map((id, idx) => (
                                <motion.div
                                    key={id}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + idx * 0.03 }}
                                    className="group relative"
                                >
                                    <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all cursor-help">
                                        <img 
                                            src={`${import.meta.env.BASE_URL}textures/packs/igneous/blocks/${id}.png`}
                                            className="w-8 h-8 image-pixelated drop-shadow-lg"
                                            alt={id}
                                            onError={(e) => e.target.src = `${import.meta.env.BASE_URL}textures/items/${id}.png`}
                                        />
                                    </div>
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-white/10 rounded text-[9px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        {id.replace(/_/g, ' ').toUpperCase()}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-center gap-4">
                    <button 
                        onClick={onClose}
                        className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black uppercase italic tracking-widest text-xs rounded-2xl shadow-[0_10px_30px_rgba(14,165,233,0.3)] transition-all flex items-center gap-3"
                    >
                        Jump Back In
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            </motion.div>
        </motion.div>
    );
};
