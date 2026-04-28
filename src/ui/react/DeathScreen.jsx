import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, LogOut } from 'lucide-react';

const MESSAGES = {
    fall:    (n) => `${n} fell from a high place`,
    void:    (n) => `${n} fell out of the world`,
    starve:  (n) => `${n} starved to death`,
    drown:   (n) => `${n} drowned`,
    generic: (n) => `${n} died`,
};

export const DeathScreen = ({ engine, onRespawn, cause = 'generic' }) => {
    const [timeSurvived, setTimeSurvived] = useState('');

    useEffect(() => {
        const started = engine.currentWorld?._startTime;
        if (started) {
            const secs = Math.floor((Date.now() - started) / 1000);
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            setTimeSurvived(`${m}m ${s}s`);
        }
    }, [engine]);

    const name = engine.settings?.get('playerName') || 'Player';
    const msgFn = MESSAGES[cause] ?? MESSAGES.generic;
    const message = msgFn(name);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-red-950/30 backdrop-blur-sm">
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(80,0,0,0.7) 100%)' }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
                className="relative z-10 flex flex-col items-center gap-8 text-center px-8"
            >
                {/* Title */}
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-6xl font-black uppercase italic text-red-400 drop-shadow-[0_0_60px_rgba(239,68,68,0.6)] tracking-tight"
                    >
                        You Died!
                    </motion.h1>

                    {/* Minecraft-style cause message */}
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="text-white/70 text-lg font-semibold mt-4"
                    >
                        {message}
                    </motion.p>

                    {timeSurvived && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-white/40 text-sm font-medium mt-2"
                        >
                            Survived for <span className="text-white/60 font-bold">{timeSurvived}</span>
                        </motion.p>
                    )}
                </div>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-4"
                >
                    <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onRespawn}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-sky-500 text-slate-950 font-black uppercase tracking-widest text-sm shadow-[0_0_40px_rgba(14,165,233,0.4)] hover:bg-sky-400 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Respawn
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => engine.backToMenu()}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 text-white/60 font-black uppercase tracking-widest text-sm border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Main Menu
                    </motion.button>
                </motion.div>
            </motion.div>
        </div>
    );
};
