import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Settings, LogOut, Copy, Check, Map } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel.jsx';

export const PauseMenu = ({ engine, onResume }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [copied, setCopied]             = useState(false);

    const copySeed = () => {
        const seed = engine.currentWorld?.seed ?? 0;
        navigator.clipboard.writeText(String(seed));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (showSettings) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
                <SettingsPanel
                    engine={engine}
                    onClose={() => setShowSettings(false)}
                    onBack={() => setShowSettings(false)}
                />
            </div>
        );
    }

    return (
        <div className="ui-overlay flex items-center justify-center bg-slate-950/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 24 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="w-80 bg-[#080d1a] rounded-[40px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.9)] p-10 flex flex-col items-center gap-4 relative overflow-hidden"
            >
                {/* Glow */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-sky-500/8 rounded-full blur-[80px] pointer-events-none" />

                <div className="text-center mb-2 relative z-10">
                    <h2 className="text-3xl font-black uppercase italic text-white tracking-tight">Paused</h2>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">Game is paused</p>
                </div>

                <div className="w-full flex flex-col gap-2 relative z-10">
                    <PauseButton primary icon={<Play className="w-4 h-4 fill-current" />} onClick={onResume}>
                        Resume
                    </PauseButton>

                    <PauseButton icon={<Settings className="w-4 h-4" />} onClick={() => setShowSettings(true)}>
                        Settings
                    </PauseButton>

                    <PauseButton icon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} onClick={copySeed}>
                        {copied ? 'Copied!' : 'Copy World Seed'}
                    </PauseButton>

                    <div className="h-px bg-white/5 my-1" />

                    <PauseButton danger icon={<LogOut className="w-4 h-4" />} onClick={() => engine.backToMenu()}>
                        Main Menu
                    </PauseButton>
                </div>

                {/* Version tag */}
                <p className="text-white/10 text-[9px] font-mono uppercase tracking-widest mt-2 relative z-10">
                    VoxelForge Alpha
                </p>
            </motion.div>
        </div>
    );
};

const PauseButton = ({ children, icon, onClick, primary = false, danger = false }) => (
    <motion.button
        whileHover={{ scale: 1.03, x: 4 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`
            w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-200
            ${primary ? 'bg-sky-500 text-slate-950 shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:bg-sky-400'
            : danger  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
            :           'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 hover:text-white'}
        `}
    >
        <span className={primary ? 'text-slate-950/70' : danger ? 'text-red-400/60' : 'text-sky-400/50'}>
            {icon}
        </span>
        {children}
    </motion.button>
);
