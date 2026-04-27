import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, Search, Shield, ArrowRight } from 'lucide-react';
import { ITEMS } from '../../data/items.js';
import { CraftingSystem } from '../../systems/CraftingSystem.js';
import { RECIPE_BOOK } from '../../data/recipeBook.js';

const craftingSystem = new CraftingSystem(RECIPE_BOOK);
const MAX_STACK = 64;

const CATEGORIES = [
    { id: 'all',         label: 'All' },
    { id: 'Building',    label: 'Blocks' },
    { id: 'Natural',     label: 'Natural' },
    { id: 'Tools',       label: 'Tools' },
    { id: 'Consumables', label: 'Food' },
    { id: 'Redstone',    label: 'Redstone' },
    { id: 'Misc',        label: 'Misc' },
];

function canStack(a, b) {
    return a && b && a.id === b.id && b.count < (b.stackSize || MAX_STACK);
}

// ── Main Component ────────────────────────────────────────────────────────────

export const Inventory = ({ engine, onClose }) => {
    const [gameMode, setGameMode] = useState(() => engine.settings?.get('gameMode') || 'survival');
    const isCreative = gameMode === 'creative';

    // All slot state lives here — single source of truth
    const [inv,       setInv]       = useState(() => [...(engine.player?.inventory || Array(27).fill(null))]);
    const [hotbar,    setHotbar]    = useState(() => [...(engine.player?.hotbar    || Array(9).fill(null))]);
    const [craftGrid, setCraftGrid] = useState(() => Array(9).fill(null));
    const [carry,     setCarry]     = useState(null);
    const [mousePos,  setMousePos]  = useState({ x: 0, y: 0 });
    const [hovered,   setHovered]   = useState(null);
    const [category,  setCategory]  = useState('all');
    const [search,    setSearch]    = useState('');

    const container = engine.activeContainer || null;
    const [chestInv, setChestInv] = useState(() => container?.inventory ? [...container.inventory] : Array(27).fill(null));

    const dragSrc = useRef(null);

    // Write React state back to engine so the game world stays in sync
    const syncToEngine = useCallback((nextInv, nextHotbar) => {
        if (engine.player) {
            if (nextInv)    engine.player.inventory = nextInv;
            if (nextHotbar) engine.player.hotbar    = nextHotbar;
            engine.player.dirty = true;
        }
    }, [engine]);

    // External changes (e.g. picking up item in world)
    useEffect(() => {
        const onInv = () => setInv([...(engine.player?.inventory || [])]);
        const onHot = () => setHotbar([...(engine.player?.hotbar    || [])]);
        engine.on('inventoryUpdate', onInv);
        engine.on('hotbarUpdate',    onHot);
        const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', onMove);
        return () => {
            engine.off('inventoryUpdate', onInv);
            engine.off('hotbarUpdate',    onHot);
            window.removeEventListener('mousemove', onMove);
        };
    }, [engine]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Creative item list
    const creativeItems = useMemo(() => {
        const items = [...(ITEMS || [])];
        const seen = new Set(items.map(i => i.id));
        (engine.blocks || []).forEach(b => {
            if (seen.has(b.name)) return;
            const rt = b.rawTextures || {};
            items.push({
                id: b.name,
                name: b.name.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
                stackSize: 64, placeBlock: b.name,
                texture: rt.texture || rt.top || rt.side || 'grass_block_side',
                category: b.transparent ? 'Misc' : (b.id < 50 ? 'Natural' : 'Building'),
            });
            seen.add(b.name);
        });
        return items;
    }, [engine.blocks]);

    const filteredItems = useMemo(() => {
        const q = search.toLowerCase();
        return creativeItems.filter(item =>
            (category === 'all' || item.category === category) &&
            (!q || (item.name || '').toLowerCase().includes(q))
        );
    }, [creativeItems, category, search]);

    const craftResult = useMemo(() => {
        const grid = container?.type === 'crafting_table'
            ? craftGrid
            : [craftGrid[0], craftGrid[1], null, craftGrid[3], craftGrid[4], null, null, null, null];
        return craftingSystem.match(grid);
    }, [craftGrid, container]);

    // ── Helpers to get/set a slot array by name ──────────────────────────────

    const getArr = (type) => {
        if (type === 'inv')     return inv;
        if (type === 'hotbar')  return hotbar;
        if (type === 'chest')   return chestInv;
        if (type === 'crafting')return craftGrid;
        return null;
    };

    const setArr = useCallback((type, next) => {
        if (type === 'inv')      { setInv(next);       syncToEngine(next, null); }
        else if (type === 'hotbar')   { setHotbar(next);    syncToEngine(null, next); }
        else if (type === 'chest')    { setChestInv(next);  if (container) container.inventory = next; }
        else if (type === 'crafting') { setCraftGrid(next); }
    }, [syncToEngine, container]);

    // ── Click handler ────────────────────────────────────────────────────────

    const handleClick = useCallback((type, idx, rightClick = false, shiftClick = false) => {
        // Creative: pick up unlimited stack
        if (type === 'creative') {
            const item = filteredItems[idx];
            if (!item) return;
            setCarry(carry ? null : { ...item, count: item.stackSize || MAX_STACK });
            return;
        }

        const arr = getArr(type);
        if (!arr) return;
        const next = [...arr];
        const slot = next[idx] ? { ...next[idx] } : null;

        // Shift+click — auto-move between inv ↔ hotbar
        if (shiftClick && slot) {
            if (type === 'inv') {
                const hNext = [...hotbar];
                const emptyHot = hNext.findIndex(s => !s);
                if (emptyHot !== -1) { hNext[emptyHot] = slot; next[idx] = null; setArr('inv', next); setArr('hotbar', hNext); }
            } else if (type === 'hotbar') {
                const iNext = [...inv];
                const emptyInv = iNext.findIndex(s => !s);
                if (emptyInv !== -1) { iNext[emptyInv] = slot; next[idx] = null; setArr('hotbar', next); setArr('inv', iNext); }
            }
            return;
        }

        // No carry — pick up
        if (!carry) {
            if (!slot) return;
            if (rightClick && slot.count > 1) {
                const take = Math.ceil(slot.count / 2);
                setCarry({ ...slot, count: take });
                next[idx] = { ...slot, count: slot.count - take };
            } else {
                setCarry(slot);
                next[idx] = null;
            }
            setArr(type, next);
            return;
        }

        // Has carry — place
        let newCarry = { ...carry };
        let newSlot  = slot;

        if (rightClick) {
            if (!newSlot) {
                newSlot = { ...carry, count: 1 };
                newCarry.count -= 1;
            } else if (canStack(newCarry, newSlot)) {
                newSlot = { ...newSlot, count: newSlot.count + 1 };
                newCarry.count -= 1;
            } else {
                [newSlot, newCarry] = [newCarry, newSlot];
            }
        } else {
            if (!newSlot) {
                newSlot  = carry;
                newCarry = null;
            } else if (canStack(newCarry, newSlot)) {
                const space = (newSlot.stackSize || MAX_STACK) - newSlot.count;
                const moved = Math.min(space, newCarry.count);
                newSlot  = { ...newSlot,  count: newSlot.count + moved };
                newCarry = newCarry.count - moved > 0 ? { ...newCarry, count: newCarry.count - moved } : null;
            } else {
                [newSlot, newCarry] = [newCarry, newSlot];
            }
        }

        if (newCarry?.count <= 0) newCarry = null;
        next[idx] = newSlot;
        setArr(type, next);
        setCarry(newCarry);
    }, [carry, filteredItems, inv, hotbar, craftGrid, chestInv, getArr, setArr]);

    // ── Drag & drop ──────────────────────────────────────────────────────────

    const handleDrop = useCallback((dstType, dstIdx) => {
        const src = dragSrc.current;
        if (!src) return;
        const { type: srcType, idx: srcIdx } = src;
        if (srcType === dstType && srcIdx === dstIdx) return;

        if (srcType === 'creative') {
            const item = filteredItems[srcIdx];
            if (!item) return;
            const dstArr = [...getArr(dstType)];
            dstArr[dstIdx] = { ...item, count: item.stackSize || MAX_STACK };
            setArr(dstType, dstArr);
            return;
        }

        const srcArr = [...getArr(srcType)];
        const dstArr = srcType === dstType ? srcArr : [...getArr(dstType)];
        const sItem = srcArr[srcIdx] ? { ...srcArr[srcIdx] } : null;
        const dItem = dstArr[dstIdx] ? { ...dstArr[dstIdx] } : null;
        if (!sItem) return;

        if (!dItem) {
            dstArr[dstIdx] = sItem;
            srcArr[srcIdx] = null;
        } else if (canStack(sItem, dItem)) {
            const space = (dItem.stackSize || MAX_STACK) - dItem.count;
            const moved = Math.min(space, sItem.count);
            dstArr[dstIdx] = { ...dItem, count: dItem.count + moved };
            srcArr[srcIdx] = sItem.count - moved > 0 ? { ...sItem, count: sItem.count - moved } : null;
        } else {
            srcArr[srcIdx] = dItem;
            dstArr[dstIdx] = sItem;
        }

        setArr(srcType, srcArr);
        if (srcType !== dstType) setArr(dstType, dstArr);
    }, [filteredItems, getArr, setArr]);

    // ── Crafting result ──────────────────────────────────────────────────────

    const consumeCraft = useCallback(() => {
        const isBench = container?.type === 'crafting_table';
        const indices = isBench ? [0,1,2,3,4,5,6,7,8] : [0,1,3,4];
        setCraftGrid(prev => {
            const next = [...prev];
            indices.forEach(i => {
                if (next[i]) {
                    next[i] = next[i].count > 1 ? { ...next[i], count: next[i].count - 1 } : null;
                }
            });
            return next;
        });
    }, [container]);

    const handleCraftClick = useCallback((shiftKey = false) => {
        if (!craftResult) return;
        const { result } = craftResult;
        if (shiftKey) {
            // Auto-craft into inventory
            const iNext = [...inv];
            let crafted = true;
            while (crafted && craftResult) {
                const slot = iNext.findIndex(s => !s || (s.id === result.id && s.count < (s.stackSize || MAX_STACK)));
                if (slot === -1) break;
                if (!iNext[slot]) iNext[slot] = { ...result };
                else iNext[slot] = { ...iNext[slot], count: iNext[slot].count + result.count };
                consumeCraft();
                crafted = !!craftResult;
            }
            setArr('inv', iNext);
        } else {
            if (carry && (carry.id !== result.id || carry.count + result.count > MAX_STACK)) return;
            setCarry(prev => prev ? { ...prev, count: prev.count + result.count } : { ...result });
            consumeCraft();
        }
    }, [craftResult, carry, inv, consumeCraft, setArr]);

    // ── Slot shorthand ────────────────────────────────────────────────────────
    const S = (type, i) => ({
        item:        getArr(type)?.[i] ?? null,
        onHover:     setHovered,
        onClick:     (rc, sc) => handleClick(type, i, rc, sc),
        onDragStart: () => { dragSrc.current = { type, idx: i }; },
        onDrop:      () => handleDrop(type, i),
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>

            <div style={{ background:'#1a1a2e', border:'2px solid #2a2a4a', borderRadius:12, padding:24, minWidth:620, maxHeight:'90vh', overflowY:'auto' }}
                className="relative select-none">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-white font-black uppercase tracking-widest text-sm">
                            {isCreative ? 'Creative' : 'Inventory'}
                        </h2>
                        {hovered && <span className="text-sky-400 text-xs font-bold opacity-60">— {hovered.name}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        {['survival','creative'].map(m => (
                            <button key={m} onClick={() => { engine.settings?.set('gameMode', m); setGameMode(m); }}
                                className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${gameMode===m ? 'bg-sky-600 text-white' : 'text-white/30 hover:text-white/60'}`}>
                                {m}
                            </button>
                        ))}
                        <button onClick={onClose} className="ml-2 p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {isCreative ? (
                    <div className="flex flex-col gap-3 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            {CATEGORIES.map(c => (
                                <button key={c.id} onClick={() => setCategory(c.id)}
                                    className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${category===c.id ? 'bg-sky-600 text-white' : 'bg-white/5 text-white/30 hover:text-white/60'}`}>
                                    {c.label}
                                </button>
                            ))}
                            <div className="relative ml-auto">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" size={12} />
                                <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded pl-7 pr-3 py-1 text-xs text-white placeholder-white/20 focus:outline-none focus:border-sky-500/50 w-36" />
                            </div>
                        </div>
                        <div className="grid gap-1 overflow-y-auto max-h-52 pr-1" style={{ gridTemplateColumns:'repeat(9,44px)' }}>
                            {filteredItems.map((_, i) => <Slot key={`cr-${i}`} {...S('creative', i)} />)}
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-5 items-start mb-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-1">Armor</span>
                            {[0,1,2,3].map(i => <Slot key={i} icon={<Shield size={14} className="text-white/15"/>} onHover={setHovered} />)}
                        </div>
                        <div className="w-24 h-36 rounded-lg border border-white/5 bg-black/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-white/10 text-[9px] font-black uppercase tracking-widest rotate-90">Player</span>
                        </div>
                        <div className="flex flex-col gap-2 items-center">
                            <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">Craft</span>
                            <div className="grid grid-cols-2 gap-1">
                                {[0,1,3,4].map(i => <Slot key={i} {...S('crafting', i)} />)}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <ArrowRight size={14} className="text-white/20" />
                                <CraftSlot result={craftResult} onClick={(e) => handleCraftClick(e.shiftKey)} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="h-px bg-white/5 mb-3" />

                {/* Chest */}
                {container?.type === 'chest' && (
                    <div className="mb-3">
                        <span className="text-amber-400/60 text-[9px] font-black uppercase tracking-widest block mb-2">{container.title || 'Chest'}</span>
                        <div className="grid gap-1" style={{ gridTemplateColumns:'repeat(9,44px)' }}>
                            {Array.from({length:27}).map((_,i) => <Slot key={i} {...S('chest', i)} />)}
                        </div>
                        <div className="h-px bg-white/5 my-3" />
                    </div>
                )}

                {/* Crafting table */}
                {container?.type === 'crafting_table' && (
                    <div className="flex gap-4 items-center mb-4">
                        <div>
                            <span className="text-sky-400/60 text-[9px] font-black uppercase tracking-widest block mb-2">Crafting Table</span>
                            <div className="grid grid-cols-3 gap-1">
                                {Array.from({length:9}).map((_,i) => <Slot key={i} {...S('crafting', i)} />)}
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-white/20 flex-shrink-0" />
                        <CraftSlot result={craftResult} onClick={(e) => handleCraftClick(e.shiftKey)} large />
                    </div>
                )}

                {/* Inventory 3×9 */}
                <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">Inventory</span>
                        <button onClick={() => { engine.player?.sortInventory?.(); setInv([...(engine.player?.inventory||[])]); }}
                            className="text-[9px] text-white/20 hover:text-white/50 font-black uppercase tracking-widest transition-colors">Sort</button>
                    </div>
                    <div className="grid gap-1" style={{ gridTemplateColumns:'repeat(9,44px)' }}>
                        {Array.from({length:27}).map((_,i) => <Slot key={i} {...S('inv', i)} />)}
                    </div>
                </div>

                {/* Hotbar */}
                <div>
                    <span className="text-sky-400/40 text-[9px] font-black uppercase tracking-widest block mb-1">Hotbar</span>
                    <div className="grid gap-1" style={{ gridTemplateColumns:'repeat(9,44px)' }}>
                        {Array.from({length:9}).map((_,i) => <Slot key={i} {...S('hotbar', i)} highlight />)}
                    </div>
                </div>
            </div>

            {/* Cursor carry ghost */}
            {carry && (
                <div className="fixed pointer-events-none z-[200]"
                    style={{ left: mousePos.x - 22, top: mousePos.y - 22 }}>
                    <SlotItem item={carry} />
                </div>
            )}
        </div>
    );
};

// ── Slot ──────────────────────────────────────────────────────────────────────

const Slot = ({ item, highlight, icon, onClick, onHover, onDragStart, onDrop }) => {
    const [hover, setHover] = useState(false);
    return (
        <div
            draggable={!!item}
            onDragStart={(e) => { e.stopPropagation(); onDragStart?.(); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop?.(); }}
            onClick={(e) => { e.stopPropagation(); onClick?.(false, e.shiftKey); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onClick?.(true, e.shiftKey); }}
            onMouseEnter={() => { setHover(true);  onHover?.(item ?? null); }}
            onMouseLeave={() => { setHover(false); onHover?.(null); }}
            style={{
                width: 44, height: 44, flexShrink: 0,
                background: highlight ? 'rgba(56,189,248,0.08)' : hover ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.35)',
                border: `1.5px solid ${highlight ? (hover ? 'rgba(56,189,248,0.5)' : 'rgba(56,189,248,0.25)') : (hover ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)')}`,
                borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', cursor: 'pointer', boxSizing: 'border-box', transition: 'background 0.1s, border-color 0.1s',
            }}
        >
            {!item && icon}
            {item && <SlotItem item={item} />}
        </div>
    );
};

// ── Craft output slot ────────────────────────────────────────────────────────

const CraftSlot = ({ result, onClick, large }) => (
    <div onClick={onClick} style={{
        width: large ? 52 : 44, height: large ? 52 : 44,
        background: result ? 'rgba(56,189,248,0.12)' : 'rgba(0,0,0,0.2)',
        border: `1.5px solid ${result ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: result ? 'pointer' : 'default', transition: 'all 0.15s',
    }}>
        {result && <SlotItem item={result.result} />}
    </div>
);

// ── SlotItem ──────────────────────────────────────────────────────────────────

const SlotItem = ({ item }) => {
    const triedFallback = useRef(false);
    useEffect(() => { triedFallback.current = false; }, [item?.id]);
    return (
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', width:34, height:34 }}>
            <img src={`/textures/items/${item.texture || item.id}.png`}
                style={{ width:30, height:30, objectFit:'contain', imageRendering:'pixelated' }}
                onError={(e) => {
                    if (!triedFallback.current) {
                        triedFallback.current = true;
                        e.target.src = `/textures/packs/igneous/blocks/${item.texture || item.id}.png`;
                    }
                }}
            />
            {item.count > 1 && (
                <span style={{ position:'absolute', bottom:-2, right:-2, fontSize:10, fontWeight:900, color:'#fff', textShadow:'1px 1px 0 #000,-1px -1px 0 #000', fontFamily:'monospace', lineHeight:1 }}>
                    {item.count}
                </span>
            )}
        </div>
    );
};
