import { motion, AnimatePresence } from 'framer-motion';

export const HUD = ({ engine, state }) => {
    const { health, hunger, fps, hotbar, selectedSlot, position, showFPS, showF3, damageFlash } = state;

    return (
        <div className="hud-root font-sans selection:bg-sky-500/30">
            {/* ── Damage flash vignette ── */}
            <AnimatePresence>
                {damageFlash && (
                    <motion.div
                        key="dmg-flash"
                        initial={{ opacity: 0.65 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 pointer-events-none z-50"
                        style={{ background: 'radial-gradient(ellipse at center, transparent 25%, rgba(180,0,0,0.55) 100%)' }}
                    />
                )}
            </AnimatePresence>

            {/* ── Top-left: FPS + Clock ── */}
            <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
                <div className="flex items-center gap-2">
                    {showFPS !== false && (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl"
                        >
                            <div className={`w-2 h-2 rounded-full ${fps >= 50 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : fps >= 30 ? 'bg-amber-400' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'}`} />
                            <span className="text-xs font-black text-white/90 tracking-tight">{fps} <span className="text-[10px] text-white/40 uppercase ml-0.5">FPS</span></span>
                        </motion.div>
                    )}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl"
                    >
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">World Time</span>
                        <span className="text-xs font-black text-white">{engine.dayNight.getTimeString()}</span>
                    </motion.div>
                </div>
                {showF3 && <F3Panel state={state} />}
            </div>

            {/* ── Top-right: Minimap + XYZ ── */}
            <div className="absolute top-6 right-6 flex flex-col items-end gap-4 pointer-events-none">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
                >
                    <Minimap engine={engine} position={position} />
                </motion.div>

                {position && (
                    <motion.div 
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-2xl"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-sky-400/60 uppercase">X</span>
                            <span className="text-xs font-black text-white">{Math.floor(position.x)}</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-400/60 uppercase">Y</span>
                            <span className="text-xs font-black text-white">{Math.floor(position.y)}</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-rose-400/60 uppercase">Z</span>
                            <span className="text-xs font-black text-white">{Math.floor(position.z)}</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── Crosshair ── */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 relative">
                    <div className="absolute inset-0 border-2 border-white/40 rounded-full scale-50" />
                    <div className="absolute top-1/2 left-0 w-4 h-0.5 bg-white/60 -translate-y-1/2 rounded-full" />
                    <div className="absolute left-1/2 top-0 w-0.5 h-4 bg-white/60 -translate-x-1/2 rounded-full" />
                </div>
            </div>

            {/* ── Bottom HUD ── */}
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 pointer-events-none">
                
                {/* Item Name Overlay (Appears on slot change) */}
                <AnimatePresence mode="wait">
                    {hotbar[selectedSlot] && (
                        <motion.div
                            key={selectedSlot}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10 shadow-2xl"
                        >
                            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">
                                {hotbar[selectedSlot].name || hotbar[selectedSlot].id.replace(/_/g, ' ')}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Vitals + XP row */}
                <div className="flex flex-col items-center gap-4 px-12 py-5 bg-black/20 backdrop-blur-lg rounded-[48px] border border-white/5 shadow-2xl">
                    <div className="flex items-end justify-center gap-16">
                        {/* Health */}
                        <div className="flex flex-col items-start gap-1.5">
                            <div className="flex gap-1">
                                {[...Array(10)].map((_, i) => (
                                    <HeartIcon key={i}
                                        full={health > i * 2 + 1}
                                        half={health === i * 2 + 1}
                                        empty={health <= i * 2}
                                    />
                                ))}
                            </div>
                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(health / 20) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* XP Bar */}
                        <div className="flex flex-col items-center gap-1 mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-emerald-400">{state.xpLevel ?? 0}</span>
                            </div>
                            <div className="w-48 h-2 bg-black/40 rounded-full border border-white/5 p-0.5 shadow-inner">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((state.xp ?? 0) * 100).toFixed(1)}%` }}
                                />
                            </div>
                        </div>

                        {/* Hunger */}
                        <div className="flex flex-col items-end gap-1.5">
                            <div className="flex gap-1 flex-row-reverse">
                                {[...Array(10)].map((_, i) => (
                                    <HungerIcon key={i}
                                        full={hunger > i * 2 + 1}
                                        half={hunger === i * 2 + 1}
                                        empty={hunger <= i * 2}
                                    />
                                ))}
                            </div>
                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-gradient-to-l from-amber-500 to-orange-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(hunger / 20) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hotbar */}
                <Hotbar hotbar={hotbar} selectedSlot={selectedSlot} />
            </div>
        </div>
    );
};

// ── Modern Glass Hotbar ──

const Hotbar = ({ hotbar, selectedSlot }) => (
    <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex gap-2 p-3 bg-black/40 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
    >
        {[...Array(9)].map((_, i) => (
            <HotbarSlot key={i} item={hotbar?.[i]} selected={i === selectedSlot} slotNum={i + 1} />
        ))}
    </motion.div>
);

const HotbarSlot = ({ item, selected, slotNum }) => (
    <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
        ${selected ? 'bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.4)] scale-110 z-10' : 'bg-white/5 hover:bg-white/10'}`}>
        {selected && (
            <motion.div 
                layoutId="slot-glow"
                className="absolute inset-0 rounded-2xl border-2 border-white/40"
            />
        )}
        {item && (
            <div className="relative group">
                <img
                    src={`/textures/items/${item.id}.png`}
                    className="w-10 h-10 object-contain drop-shadow-xl"
                    style={{ imageRendering: 'pixelated' }}
                    onError={e => {
                        const t = e.target;
                        if (t.src.includes('/items/')) {
                            t.src = `/textures/packs/igneous/blocks/${item.id}.png`;
                        } else if (!t.src.includes('fallback')) {
                            t.src = '/textures/packs/igneous/blocks/grass_block_side.png';
                        }
                    }}
                />
                {item.count > 1 && (
                    <span className={`absolute -bottom-1 -right-1 text-[10px] font-black drop-shadow-md px-1 rounded-md
                        ${selected ? 'bg-black/40 text-white' : 'bg-sky-500 text-white'}`}>
                        {item.count}
                    </span>
                )}
            </div>
        )}
        <span className={`absolute -top-1 -left-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-lg border
            ${selected ? 'bg-white text-sky-500 border-transparent' : 'bg-black/60 text-white/40 border-white/10'}`}>
            {slotNum}
        </span>
    </div>
);

// ── Premium SVG Icons ──

const HeartIcon = ({ full, empty }) => (
    <div className="relative w-4 h-4">
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-sm">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={empty ? 'rgba(255,255,255,0.05)' : '#f43f5e'}
                stroke={empty ? 'rgba(255,255,255,0.1)' : 'transparent'}
                strokeWidth="1.5"
            />
            {!empty && !full && (
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill="#be123c"
                    clipPath="inset(0 0 0 50%)"
                />
            )}
        </svg>
    </div>
);

const HungerIcon = ({ full, empty }) => (
    <div className="relative w-4 h-4">
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-sm">
            <path d="M18,18.5C18,19.33 17.33,20 16.5,20H7.5C6.67,20 6,19.33 6,18.5V11.5L8,7.5H16L18,11.5V18.5Z" 
                fill={empty ? 'rgba(255,255,255,0.05)' : '#f59e0b'}
                stroke={empty ? 'rgba(255,255,255,0.1)' : 'transparent'}
                strokeWidth="1.5"
            />
            {!empty && !full && (
                <path d="M18,18.5C18,19.33 17.33,20 16.5,20H7.5C6.67,20 6,19.33 6,18.5V11.5L8,7.5H16L18,11.5V18.5Z" 
                    fill="#b45309"
                    clipPath="inset(0 0 0 50%)"
                />
            )}
        </svg>
    </div>
);

// ── F3 debug overlay ──

const F3Panel = ({ state }) => {
    const { position, fps, gameMode } = state;
    if (!position) return null;
    const cx = Math.floor(position.x / 16);
    const cz = Math.floor(position.z / 16);
    return (
        <div className="mc-f3">
            <div className="text-yellow-300 font-bold">VoxelForge v0.1</div>
            <div>FPS: <span className="text-white">{fps}</span></div>
            <div>XYZ: <span className="text-white">{position.x.toFixed(2)} / {position.y.toFixed(2)} / {position.z.toFixed(2)}</span></div>
            <div>Chunk: <span className="text-sky-300">{cx} {cz}</span></div>
            <div>Mode: <span className="text-emerald-300 uppercase">{gameMode}</span></div>
            {window.performance?.memory && (
                <div>Mem: <span className="text-white">{(window.performance.memory.usedJSHeapSize / 1048576).toFixed(0)} MB</span></div>
            )}
        </div>
    );
};

// ── Minimap ──
import { useRef, useEffect } from 'react';

const Minimap = ({ engine, position }) => {
    const canvasRef = useRef(null);
    const lastUpdate = useRef(0);
    const lastPos = useRef({ x: 0, z: 0 });
    
    // Internal resolution
    const internalSize = 64; 
    // Display size
    const displaySize = 128;
    // Blocks per pixel
    const scale = 2;  

    useEffect(() => {
        if (!canvasRef.current || !engine || !position) return;
        
        const now = performance.now();
        const dist = Math.abs(position.x - lastPos.current.x) + Math.abs(position.z - lastPos.current.z);
        
        // Throttle updates: Max 10 FPS OR player moved > 1 block
        if (now - lastUpdate.current < 100 && dist < 1) return;
        lastUpdate.current = now;
        lastPos.current = { x: position.x, z: position.z };

        const ctx = canvasRef.current.getContext('2d');
        const cm = engine.chunkManager;
        const half = internalSize / 2;

        ctx.clearRect(0, 0, internalSize, internalSize);
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(half, half, half, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        // Draw terrain
        const idata = ctx.createImageData(internalSize, internalSize);
        for (let y = 0; y < internalSize; y++) {
            for (let x = 0; x < internalSize; x++) {
                const wx = position.x + (x - half) * scale;
                const wz = position.z + (y - half) * scale;
                
                let topBlock = null;
                for (let wy = Math.min(Math.floor(position.y) + 10, 255); wy > 0; wy--) {
                    const b = cm.getBlockAt(wx, wy, wz);
                    if (b && b.solid) {
                        topBlock = b;
                        break;
                    }
                }

                const i = (y * internalSize + x) * 4;
                if (topBlock) {
                    let r=100, g=100, b=100;
                    if (topBlock.name.includes('grass')) { r=80; g=160; b=80; }
                    else if (topBlock.name.includes('sand')) { r=220; g=200; b=140; }
                    else if (topBlock.name.includes('water')) { r=40; g=80; b=200; }
                    else if (topBlock.name.includes('leaves')) { r=40; g=120; b=40; }
                    else if (topBlock.name.includes('log')) { r=100; g=80; b=60; }
                    else if (topBlock.name.includes('snow')) { r=240; g=240; b=255; }
                    
                    idata.data[i] = r;
                    idata.data[i+1] = g;
                    idata.data[i+2] = b;
                    idata.data[i+3] = 255;
                } else {
                    idata.data[i+3] = 0;
                }
            }
        }
        
        const temp = document.createElement('canvas');
        temp.width = internalSize; temp.height = internalSize;
        temp.getContext('2d').putImageData(idata, 0, 0);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(half, half, half - 1, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(temp, 0, 0);
        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(half, half, 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (engine.camera) {
            const facing = engine.camera.facing;
            const angle = Math.atan2(facing.z, facing.x);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(half, half);
            ctx.lineTo(half + Math.cos(angle) * 6, half + Math.sin(angle) * 6);
            ctx.stroke();
        }

    }, [position, engine]);

    return (
        <div className="relative p-1 bg-black/20 rounded-full border-2 border-white/5 backdrop-blur-md shadow-2xl">
            <canvas 
                ref={canvasRef} 
                width={internalSize} 
                height={internalSize} 
                style={{ width: displaySize, height: displaySize, imageRendering: 'pixelated' }}
                className="rounded-full" 
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-sky-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                Sat-Link
            </div>
        </div>
    );
};
