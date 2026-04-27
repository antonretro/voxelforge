import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor, Volume2, Gamepad2, User, X, RotateCcw, ChevronLeft,
    Loader2, CheckCircle2, AlertCircle, Copy, RefreshCw
} from 'lucide-react';

// Preset skins — pulled from well-known Minecraft usernames via Mojang API
const SKIN_PRESETS = [
    { label: 'Steve',    username: 'Steve'    },
    { label: 'Alex',     username: 'Alex'     },
    { label: 'Notch',    username: 'Notch'    },
    { label: 'Herobrine',username: 'Herobrine'},
    { label: 'Dream',    username: 'Dream'    },
    { label: 'Technoblade', username: 'Technoblade' },
];

const TABS = [
    { id: 'video',    label: 'Video',    Icon: Monitor   },
    { id: 'audio',    label: 'Audio',    Icon: Volume2   },
    { id: 'controls', label: 'Controls', Icon: Gamepad2  },
    { id: 'gameplay', label: 'Gameplay', Icon: Gamepad2  },
    { id: 'profile',  label: 'Profile',  Icon: User      },
];

export const SettingsPanel = ({ engine, onClose, onBack }) => {
    const [activeTab, setActiveTab] = useState('video');
    const [values, setValues]       = useState(() => engine?.settings?.getAll() ?? {});

    const apply = (key, value) => {
        engine?.settings?.set(key, value);
        setValues(prev => ({ ...prev, [key]: value }));

        // Live-apply where possible
        if (key === 'fov'             && engine?.camera)    engine.camera.fov = value;
        if (key === 'resolutionScale' && engine?.renderer)  engine.renderer.setResolutionScale(value);
    };

    const reset = () => {
        engine?.settings?.reset();
        setValues(engine?.settings?.getAll() ?? {});
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-3xl bg-[#080d1a] rounded-[40px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.95)] overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-10 py-7 border-b border-white/5">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">Settings</h2>
                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            Configure your experience
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 rounded-2xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <div className="w-44 p-4 border-r border-white/5 flex flex-col gap-1 shrink-0">
                    {TABS.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                activeTab === id
                                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                    : 'text-white/30 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {label}
                        </button>
                    ))}

                    <div className="flex-1" />

                    <button
                        onClick={reset}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset All
                    </button>
                </div>

                {/* Content area */}
                <div className="flex-1 max-h-[68vh] overflow-y-auto p-8 space-y-1 scrollbar-thin">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-5"
                        >
                            {activeTab === 'video'    && <VideoTab    values={values} apply={apply} />}
                            {activeTab === 'audio'    && <AudioTab    values={values} apply={apply} />}
                            {activeTab === 'controls' && <ControlsTab values={values} apply={apply} />}
                            {activeTab === 'gameplay' && <GameplayTab values={values} apply={apply} />}
                            {activeTab === 'profile'  && <ProfileTab  values={values} apply={apply} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

// ---------- Tab content components ----------

const VideoTab = ({ values, apply }) => (
    <>
        <SectionLabel>Display</SectionLabel>
        <Slider label="Field of View"      value={values.fov ?? 75}             min={60}  max={120} step={1}    unit="°"  onChange={v => apply('fov', v)} />
        <Slider label="Render Distance"    value={values.renderDistance ?? 4}   min={2}   max={16}  step={1}    unit=" chunks" onChange={v => apply('renderDistance', v)} />
        <Slider label="Resolution Scale"   value={values.resolutionScale ?? 1}  min={0.5} max={2}   step={0.25} unit="x"  onChange={v => apply('resolutionScale', v)} />
        <Select label="FPS Cap"            value={String(values.fpsCap ?? 60)}
            options={['30', '60', '120', '144', '240', 'Unlimited']}
            onChange={v => apply('fpsCap', v === 'Unlimited' ? 0 : parseInt(v))} />
        <Toggle label="Frame Rate Cap"     value={values.frameSkip ?? true}     onChange={v => apply('frameSkip', v)} />
        <SectionLabel>Quality</SectionLabel>
        <Toggle label="Anti-Aliasing"      value={values.antiAlias ?? true}     onChange={v => apply('antiAlias', v)} />
        <Toggle label="Shadows"            value={values.shadows ?? true}       onChange={v => apply('shadows', v)} />
        <Toggle label="Show FPS Counter"   value={values.showFPS ?? false}      onChange={v => apply('showFPS', v)} />
        <Toggle label="Show F3 Debug Info" value={values.showF3 ?? false}       onChange={v => apply('showF3', v)} />
        <Toggle label="Show Coordinates"   value={values.showCoords ?? false}   onChange={v => apply('showCoords', v)} />

        <div className="pt-6 border-t border-white/5 space-y-4">
            <p className="text-[10px] text-sky-400 font-black uppercase tracking-[0.2em] px-1">Engine Stability</p>
            <button 
                onClick={() => {
                    apply('renderDistance', 2);
                    apply('resolutionScale', 0.5);
                    apply('shadows', false);
                    apply('antiAlias', false);
                }}
                className="w-full py-4 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-2xl text-sky-400 text-[10px] font-black uppercase tracking-widest transition-all"
            >
                Apply Safe Performance Preset
            </button>
            <p className="text-[9px] text-white/20 px-1 leading-relaxed">
                Recommended for integrated graphics or mobile devices. Reduces render distance and quality for maximum stability.
            </p>
        </div>
    </>
);

const AudioTab = ({ values, apply }) => (
    <>
        <SectionLabel>Volume</SectionLabel>
        <Slider label="Master Volume" value={values.masterVolume ?? 1}   min={0} max={1} step={0.05}
            display={v => `${Math.round(v * 100)}%`} onChange={v => apply('masterVolume', v)} />
        <Slider label="Music Volume"  value={values.musicVolume ?? 0.5}  min={0} max={1} step={0.05}
            display={v => `${Math.round(v * 100)}%`} onChange={v => apply('musicVolume', v)} />
        <Slider label="SFX Volume"    value={values.sfxVolume ?? 0.8}    min={0} max={1} step={0.05}
            display={v => `${Math.round(v * 100)}%`} onChange={v => apply('sfxVolume', v)} />
    </>
);

const ControlsTab = ({ values, apply }) => (
    <>
        <SectionLabel>Mouse</SectionLabel>
        <Slider
            label="Mouse Sensitivity"
            value={values.mouseSensitivity ?? 0.003}
            min={0.0005} max={0.01} step={0.0005}
            display={v => (v * 1000).toFixed(1)}
            onChange={v => apply('mouseSensitivity', v)}
        />
        <SectionLabel>Keybindings</SectionLabel>
        <div className="space-y-1.5">
            {[
                ['Move',        'WASD'],
                ['Jump',        'Space'],
                ['Sprint',      'Ctrl'],
                ['Fly Down',    'Shift'],
                ['Inventory',   'E'],
                ['Chat',        'T'],
                ['Pause',       'Esc'],
                ['Debug Info',  'F3'],
            ].map(([action, key]) => (
                <div key={action} className="flex justify-between items-center px-4 py-2.5 bg-white/3 rounded-xl border border-white/5">
                    <span className="text-xs text-white/50 font-medium">{action}</span>
                    <kbd className="bg-white/10 border border-white/10 px-3 py-1 rounded-lg font-mono text-white/60 text-[10px]">{key}</kbd>
                </div>
            ))}
        </div>
    </>
);

const GameplayTab = ({ values, apply }) => (
    <>
        <SectionLabel>World</SectionLabel>
        <Toggle label="Day / Night Cycle" value={values.dayNightCycle ?? true}  onChange={v => apply('dayNightCycle', v)} />
        <Select label="Default Game Mode"  value={values.gameMode ?? 'creative'}
            options={['creative', 'survival']} onChange={v => apply('gameMode', v)} />
        <SectionLabel>Localisation</SectionLabel>
        <Select label="Language" value={values.language ?? 'en'}
            options={['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'ru']}
            onChange={v => apply('language', v)} />
    </>
);

// Profile tab with Mojang skin API integration
const ProfileTab = ({ values, apply }) => {
    const [skinInput,  setSkinInput]  = useState(values.skinUsername ?? '');
    const [skinStatus, setSkinStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
    const [skinUrl,    setSkinUrl]    = useState(null);
    const [skinMsg,    setSkinMsg]    = useState('');

    const fetchSkin = useCallback((username) => {
        if (!username.trim()) { setSkinStatus(null); setSkinUrl(null); return; }
        setSkinStatus('loading');
        // Validate by attempting to load the avatar image — no CORS fetch needed
        const avatarUrl    = `https://crafatar.com/avatars/${encodeURIComponent(username)}?size=64&overlay=true`;
        const skinRenderUrl = `https://crafatar.com/renders/body/${encodeURIComponent(username)}?scale=4&overlay=true`;
        const probe = new Image();
        probe.crossOrigin = 'anonymous';
        probe.onload = () => {
            setSkinUrl(skinRenderUrl);
            setSkinStatus('ok');
            setSkinMsg(`Skin loaded for ${username}`);
            apply('skinUsername', username);
        };
        probe.onerror = () => {
            setSkinStatus('error');
            setSkinMsg('Player not found on Minecraft servers');
            setSkinUrl(null);
        };
        probe.src = avatarUrl;
    }, [apply]);

    // Auto-fetch when preset is selected
    const selectPreset = (username) => {
        setSkinInput(username);
        fetchSkin(username);
    };

    return (
        <>
            <SectionLabel>Identity</SectionLabel>
            <div className="space-y-2">
                <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">Display Name</label>
                <input
                    type="text"
                    value={values.username ?? 'Player'}
                    onChange={e => apply('username', e.target.value)}
                    maxLength={20}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                />
            </div>

            <SectionLabel>Minecraft Skin</SectionLabel>

            {/* Preset skin buttons */}
            <div>
                <p className="text-[10px] text-white/30 font-medium mb-2 ml-1">Quick presets</p>
                <div className="flex flex-wrap gap-2">
                    {SKIN_PRESETS.map(({ label, username }) => (
                        <button
                            key={label}
                            onClick={() => selectPreset(username)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                skinInput === username
                                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom username input */}
            <div className="space-y-2">
                <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                    Minecraft Username
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={skinInput}
                        onChange={e => setSkinInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchSkin(skinInput)}
                        placeholder="Enter Minecraft username…"
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                    />
                    <button
                        onClick={() => fetchSkin(skinInput)}
                        disabled={skinStatus === 'loading'}
                        className="px-4 py-3 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 disabled:opacity-40 transition-all"
                    >
                        {skinStatus === 'loading'
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <RefreshCw className="w-4 h-4" />
                        }
                    </button>
                </div>

                {/* Status feedback */}
                <AnimatePresence>
                    {skinStatus && skinStatus !== 'loading' && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex items-center gap-2 text-[10px] font-bold ml-1 ${skinStatus === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                            {skinStatus === 'ok'
                                ? <CheckCircle2 className="w-3 h-3" />
                                : <AlertCircle  className="w-3 h-3" />
                            }
                            {skinMsg}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Skin preview */}
            <AnimatePresence>
                {skinUrl && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-6 p-4 bg-white/3 border border-white/10 rounded-2xl"
                    >
                        <img
                            src={skinUrl}
                            alt="Skin preview"
                            className="h-28 object-contain drop-shadow-lg"
                            style={{ imageRendering: 'pixelated' }}
                        />
                        <div>
                            <p className="text-sm font-black text-white">{skinInput}</p>
                            <p className="text-[10px] text-white/30 mt-1">This skin will appear on your player model in multiplayer.</p>
                            <button
                                onClick={() => navigator.clipboard.writeText(skinInput)}
                                className="mt-3 flex items-center gap-2 text-[10px] text-sky-400/60 hover:text-sky-400 transition-colors"
                            >
                                <Copy className="w-3 h-3" /> Copy username
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// ---------- Reusable primitives ----------

const SectionLabel = ({ children }) => (
    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] pt-2 pb-1 border-b border-white/5">
        {children}
    </p>
);

const Slider = ({ label, value, min, max, step, unit = '', display, onChange }) => {
    const shown = display ? display(value) : value;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-xs text-white/50 font-bold">{label}</label>
                <span className="text-xs font-mono text-sky-400">{shown}{!display ? unit : ''}</span>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-sky-500 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/15 font-mono">
                <span>{min}</span><span>{max}</span>
            </div>
        </div>
    );
};

const Toggle = ({ label, value, onChange }) => (
    <div className="flex justify-between items-center">
        <label className="text-xs text-white/50 font-bold">{label}</label>
        <button
            onClick={() => onChange(!value)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-sky-500' : 'bg-white/10'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value ? 'left-6' : 'left-1'}`} />
        </button>
    </div>
);

const Select = ({ label, value, options, onChange }) => (
    <div className="flex justify-between items-center gap-4">
        <label className="text-xs text-white/50 font-bold shrink-0">{label}</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-sky-500/50 transition-colors capitalize cursor-pointer"
        >
            {options.map(o => (
                <option key={o} value={o} className="bg-slate-900 capitalize">{o}</option>
            ))}
        </select>
    </div>
);
