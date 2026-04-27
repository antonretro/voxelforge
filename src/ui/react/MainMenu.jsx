import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Settings, Globe, Code, Cpu, Users, Sparkles } from 'lucide-react';
import { CreateWorld }      from './CreateWorld.jsx';
import { SettingsPanel }    from './SettingsPanel.jsx';
import { MultiplayerMenu }  from './MultiplayerMenu.jsx';

export const MainMenu = ({ engine, onPlay, onMultiplayerJoin, onShowUpdates, onShowCommunity }) => {
    const [view, setView] = useState('main');

    const handleCreate = (params) => onPlay(params);
    const handleMultiplayerJoin = () => {
        onMultiplayerJoin?.();
        onPlay({ name: 'Multiplayer', seed: 0, type: 'infinite', difficulty: 'normal', multiplayer: true });
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            <VoxelBackground />
            {/* Dark gradient overlay — heavier at bottom for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
            {/* Left-edge vignette so buttons sit on a readable surface */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

            <AnimatePresence mode="wait">
                {view === 'main' && (
                    <MainView key="main"
                        onCreate={() => setView('create')}
                        onSettings={() => setView('settings')}
                        onMultiplayer={() => setView('multiplayer')}
                        onShowUpdates={onShowUpdates}
                        onShowCommunity={onShowCommunity}
                    />
                )}
                {view === 'create' && (
                    <FullScreenPanel key="create">
                        <CreateWorld onBack={() => setView('main')} onCreate={handleCreate} />
                    </FullScreenPanel>
                )}
                {view === 'settings' && (
                    <FullScreenPanel key="settings">
                        <SettingsPanel engine={engine} onClose={() => setView('main')} onBack={() => setView('main')} />
                    </FullScreenPanel>
                )}
                {view === 'multiplayer' && (
                    <FullScreenPanel key="mp">
                        <MultiplayerMenu engine={engine} onBack={() => setView('main')} onJoined={handleMultiplayerJoin} />
                    </FullScreenPanel>
                )}
            </AnimatePresence>
        </div>
    );
};

// ---------- Main full-screen layout ----------

const MainView = ({ onCreate, onSettings, onMultiplayer, onShowUpdates, onShowCommunity }) => (
    <motion.div
        key="main-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, x: -60 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="absolute inset-0 flex flex-col justify-center select-none px-12 md:px-24"
    >
        {/* Content Group: Grouped for vertical centering */}
        <div className="flex flex-col max-w-xl">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, type: 'spring', stiffness: 220, damping: 22 }}
                className="mb-14"
            >
                <span className="text-sky-400 font-black tracking-[0.5em] text-[10px] uppercase mb-2 block ml-1 opacity-80">
                    The Voyage of Discovery
                </span>
                <h1 className="text-[clamp(3.5rem,8vw,8rem)] font-black italic tracking-tighter text-white leading-none drop-shadow-[0_8px_40px_rgba(0,0,0,0.8)] whitespace-nowrap"
                    style={{
                        textShadow: '-4px 4px 0 #0c4a6e, -8px 8px 0 #082f49, 0 10px 40px rgba(0,0,0,0.5)'
                    }}>
                    VOXEL<span className="text-sky-400">FORGE</span>
                </h1>
                <div className="mt-6 flex items-center gap-4">
                    <div className="h-[2px] w-8 bg-sky-400/60" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-slate-300 drop-shadow-sm">
                        High Performance Voxel Engine
                    </span>
                </div>
            </motion.div>

            {/* Nav buttons */}
            <motion.div
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.16, type: 'spring', stiffness: 200, damping: 24 }}
                className="flex flex-col gap-3.5 w-80"
            >
                <NavButton primary icon={<Play className="w-5 h-5 fill-current" />} onClick={onCreate}>
                    Play / Create World
                </NavButton>
                <NavButton icon={<Users className="w-5 h-5" />} onClick={onMultiplayer}>
                    Multiplayer
                </NavButton>
                <NavButton icon={<Settings className="w-5 h-5" />} onClick={onSettings}>
                    Options
                </NavButton>
                <NavButton icon={<Sparkles className="w-5 h-5" />} onClick={onShowUpdates}>
                    What's New
                </NavButton>
                <NavButton icon={<Globe className="w-5 h-5" />} onClick={onShowCommunity}>
                    Community
                </NavButton>
            </motion.div>
        </div>

        {/* Footer — pinned to bottom-left */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-8 left-12 md:left-24 flex items-center gap-4 opacity-40 hover:opacity-100 transition-opacity cursor-default"
        >
            <div className="flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/80">
                    © 2026 Antigravity Systems
                </span>
            </div>
            <div className="h-px w-4 bg-white/10" />
            <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/80">
                    Build v1.4.2-α
                </span>
            </div>
        </motion.div>
    </motion.div>
);

// ---------- Full-screen sub-panel wrapper ----------

const FullScreenPanel = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 80 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="absolute inset-0 flex items-center justify-center p-6 md:p-10"
    >
        {children}
    </motion.div>
);

// ---------- Nav button ----------

const NavButton = ({ children, icon, onClick, primary = false }) => (
    <motion.button
        whileHover={{ x: 8, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
            group relative flex items-center gap-5 px-8 py-5 rounded-2xl overflow-hidden
            font-black uppercase tracking-[0.25em] text-[12px] transition-all duration-300 text-left
            ${primary
                ? 'bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 text-slate-950 shadow-[0_20px_50px_-12px_rgba(14,165,233,0.5)] border-t border-sky-300/30'
                : 'bg-slate-950/40 text-slate-400 border border-white/5 hover:border-sky-500/30 hover:bg-slate-900/60 hover:text-white backdrop-blur-xl shadow-2xl'}
        `}
    >
        {/* Glow effect on primary */}
        {primary && (
            <div className="absolute inset-0 bg-sky-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        )}

        {/* Hover accent */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-transform duration-500 origin-bottom scale-y-0 group-hover:scale-y-100
            ${primary ? 'bg-white/50' : 'bg-sky-500'}`}
        />

        <div className={`relative z-10 p-2.5 rounded-xl transition-all duration-300 
            ${primary 
                ? 'bg-slate-950/10 text-slate-950' 
                : 'bg-white/5 text-sky-400/70 group-hover:text-sky-400 group-hover:bg-sky-500/10'}`}
        >
            {icon}
        </div>
        
        <span className="relative z-10 flex-1">{children}</span>

        {/* Subtle shine sweep */}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
    </motion.button>
);

// ---------- Animated voxel background ----------

const BLOCK_COLORS = [
    '#22c55e', '#16a34a', '#15803d', '#4ade80',
    '#92400e', '#78350f', '#a16207', '#b45309',
    '#6b7280', '#374151', '#94a3b8', '#475569',
    '#0ea5e9', '#0369a1', '#38bdf8', '#7dd3fc',
    '#f97316', '#dc2626', '#ef4444',
    '#a855f7', '#7c3aed', '#c084fc',
    '#facc15', '#fbbf24', '#fde68a',
];

function useVoxelParticles(count = 60) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const particles = Array.from({ length: count }, () => ({
            x:       Math.random() * 100,
            y:       Math.random() * 110,
            size:    12 + Math.random() * 44,
            color:   BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)],
            vy:      0.012 + Math.random() * 0.028,
            vx:      (Math.random() - 0.5) * 0.018,
            rot:     Math.random() * 360,
            vr:      (Math.random() - 0.5) * 0.45,
            opacity: 0.22 + Math.random() * 0.32,
        }));

        let running = true;
        const tick = () => {
            if (!running) return;
            for (const p of particles) {
                p.y   -= p.vy;
                p.x   += p.vx;
                p.rot += p.vr;
                if (p.y < -8)  { p.y = 108; p.x = Math.random() * 100; }
                if (p.x < -5)  p.x = 105;
                if (p.x > 105) p.x = -5;
            }
            if (el) {
                el.innerHTML = particles.map(p => `<div style="
                    position:absolute;left:${p.x}%;top:${p.y}%;
                    width:${p.size}px;height:${p.size}px;
                    background:${p.color};opacity:${p.opacity};
                    transform:rotate(${p.rot}deg);border-radius:4px;
                    pointer-events:none;
                    box-shadow:0 0 ${p.size * 0.7}px ${p.color}55,inset 0 0 ${p.size * 0.25}px rgba(255,255,255,0.2);
                "></div>`).join('');
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        return () => { running = false; };
    }, [count]);

    return ref;
}

const VoxelBackground = () => {
    const ref = useVoxelParticles(60);
    return (
        <div
            ref={ref}
            className="absolute inset-0 overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at 60% 40%, #0d2040 0%, #08101e 50%, #020508 100%)' }}
        />
    );
};
