import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Users, Copy, Check, Loader2, ChevronLeft, ArrowRight, X } from 'lucide-react';

export const MultiplayerMenu = ({ engine, onBack, onJoined }) => {
    const [mode, setMode] = useState(null); // null | 'host' | 'join'

    return (
        <motion.div
            key="mp-root"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-lg bg-[#080d1a] rounded-[48px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.9)] p-12 flex flex-col gap-8 relative overflow-hidden"
        >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/8 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-4 relative z-10">
                <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-3xl font-black uppercase italic text-white tracking-tight">Multiplayer</h2>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-0.5">Peer-to-peer WebRTC</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!mode && (
                    <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 relative z-10">
                        <ModeCard
                            icon={<Wifi className="w-6 h-6 text-sky-400" />}
                            title="Host a Game"
                            desc="Create a room and share the code with friends."
                            onClick={() => setMode('host')}
                        />
                        <ModeCard
                            icon={<Users className="w-6 h-6 text-emerald-400" />}
                            title="Join a Game"
                            desc="Enter a room code to connect to a friend's world."
                            onClick={() => setMode('join')}
                        />
                    </motion.div>
                )}

                {mode === 'host' && (
                    <HostPanel key="host" engine={engine} onBack={() => setMode(null)} onReady={onJoined} />
                )}

                {mode === 'join' && (
                    <JoinPanel key="join" engine={engine} onBack={() => setMode(null)} onJoined={onJoined} />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ---------- Host panel ----------

const HostPanel = ({ engine, onBack, onReady }) => {
    const [state,   setState]   = useState('idle'); // idle | loading | ready
    const [code,    setCode]    = useState('');
    const [copied,  setCopied]  = useState(false);
    const [error,   setError]   = useState('');

    const startHosting = async () => {
        setState('loading');
        setError('');
        try {
            const id = await engine.network.host();
            setCode(id);
            setState('ready');
        } catch (e) {
            setError('Failed to create room. Check your connection.');
            setState('idle');
        }
    };

    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5 relative z-10">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-black uppercase tracking-tight text-white italic">Host a Game</h3>
            </div>

            {state === 'idle' && (
                <div className="space-y-4">
                    <p className="text-sm text-white/40">
                        Click <span className="text-sky-400 font-bold">Start Hosting</span> to generate a room code. Share it with friends so they can join your world.
                    </p>
                    {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>}
                    <ActionButton primary onClick={startHosting}>
                        <Wifi className="w-4 h-4" /> Start Hosting
                    </ActionButton>
                </div>
            )}

            {state === 'loading' && (
                <div className="flex flex-col items-center gap-4 py-6">
                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                    <p className="text-white/40 text-sm">Connecting to signalling server…</p>
                </div>
            )}

            {state === 'ready' && (
                <div className="space-y-5">
                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">Room Code</p>
                        <p className="text-xl font-mono font-black text-emerald-400 break-all">{code}</p>
                    </div>
                    <button
                        onClick={copy}
                        className={`w-full flex items-center justify-center gap-3 py-3 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all ${
                            copied
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                    <ActionButton primary onClick={onReady}>
                        <ArrowRight className="w-4 h-4" /> Enter World
                    </ActionButton>
                    <p className="text-[10px] text-white/20 text-center">Waiting for players to connect…</p>
                </div>
            )}
        </motion.div>
    );
};

// ---------- Join panel ----------

const JoinPanel = ({ engine, onBack, onJoined }) => {
    const [code,  setCode]  = useState('');
    const [state, setState] = useState('idle'); // idle | loading | error
    const [error, setError] = useState('');

    const join = async () => {
        if (!code.trim()) return;
        setState('loading');
        setError('');
        try {
            await engine.network.join(code.trim());
            onJoined();
        } catch {
            setError('Could not connect. Check the room code and try again.');
            setState('idle');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5 relative z-10">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-black uppercase tracking-tight text-white italic">Join a Game</h3>
            </div>

            <p className="text-sm text-white/40">Ask the host for their room code and paste it below.</p>

            <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && join()}
                placeholder="Paste room code…"
                disabled={state === 'loading'}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-mono text-sm focus:outline-none focus:border-sky-500/50 transition-colors disabled:opacity-50"
            />

            {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>}

            <ActionButton primary disabled={!code.trim() || state === 'loading'} onClick={join}>
                {state === 'loading'
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                    : <><ArrowRight className="w-4 h-4" /> Join World</>
                }
            </ActionButton>
        </motion.div>
    );
};

// ---------- Shared primitives ----------

const ModeCard = ({ icon, title, desc, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="w-full flex items-start gap-5 p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-white/15 hover:bg-white/6 transition-all text-left"
    >
        <div className="p-2.5 rounded-xl bg-white/5 shrink-0">{icon}</div>
        <div className="flex-1">
            <p className="text-sm font-black text-white uppercase tracking-tight">{title}</p>
            <p className="text-[10px] text-white/35 font-medium mt-1 leading-relaxed">{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 self-center" />
    </motion.button>
);

const ActionButton = ({ children, primary, danger, disabled, onClick }) => (
    <motion.button
        whileHover={!disabled ? { scale: 1.03 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        onClick={!disabled ? onClick : undefined}
        disabled={disabled}
        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            primary ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.25)]'
            : danger ? 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25'
            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
        }`}
    >
        {children}
    </motion.button>
);
