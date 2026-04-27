import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Box, Shield, Zap, Flame, Grid3x3, Hammer, Search, Leaf, Palette, Cpu, Carrot, Package, Star, Map } from 'lucide-react';
import { ITEMS } from '../../data/items.js';
import { CraftingSystem } from '../../systems/CraftingSystem.js';
import { RECIPE_BOOK } from '../../data/recipeBook.js';

const craftingSystem = new CraftingSystem(RECIPE_BOOK);
const MAX_STACK = 64;

const CATEGORIES = [
    { id: 'Building',   icon: Box,     label: 'Building' },
    { id: 'Natural',    icon: Leaf,    label: 'Natural' },
    { id: 'Redstone',   icon: Cpu,     label: 'Redstone' },
    { id: 'Blueprint',  icon: Map,     label: 'Architecture' },
    { id: 'Consumables',icon: Carrot,  label: 'Consumables' },
    { id: 'Tools',      icon: Hammer,  label: 'Tools' },
    { id: 'Misc',       icon: Palette, label: 'Miscellaneous' }
];

export const Inventory = ({ engine, onClose }) => {
    const [gameMode, setGameMode] = useState(() => engine.settings?.get('gameMode') || 'survival');
    const isCreative = gameMode === 'creative';
    const container = engine.activeContainer || { type: 'player', title: 'Inventory', size: 27 };
    
    const [inventory, setInventory] = useState(() => engine.player?.inventory || Array(27).fill(null));
    const [hotbar, setHotbar]       = useState(() => engine.player?.hotbar || Array(9).fill(null));
    const [craftingGrid, setCraftingGrid] = useState(Array(9).fill(null)); // 3x3
    const [activeCategory, setActiveCategory] = useState('Building');
    const [searchQuery, setSearchQuery] = useState('');
    const [carryItem, setCarryItem] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Sync state with engine
    useEffect(() => {
        const syncInv = () => setInventory([...(engine.player?.inventory || [])]);
        const syncHot = () => setHotbar([...(engine.player?.hotbar || [])]);

        // Initial sync
        syncInv();
        syncHot();

        engine.on('inventoryUpdate', syncInv);
        engine.on('hotbarUpdate', syncHot);

        const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handleMove);
        
        return () => {
            engine.off('inventoryUpdate', syncInv);
            engine.off('hotbarUpdate', syncHot);
            window.removeEventListener('mousemove', handleMove);
        };
    }, [engine]);

    const [hoveredItem, setHoveredItem] = useState(null);

    const allItems = useMemo(() => {
        const items = [...(ITEMS || [])];
        const existingIds = new Set(items.map(i => i.id));
        
        // Add all engine blocks that aren't already items
        (engine.blocks || []).forEach(block => {
            if (!existingIds.has(block.name)) {
                const rt = block.rawTextures || {};
                items.push({
                    id: block.name,
                    name: block.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    stackSize: 64,
                    placeBlock: block.name,
                    texture: rt.texture || rt.top || rt.side || 'grass_block_side',
                    category: block.transparent ? 'Misc' : (block.id < 50 ? 'Natural' : 'Building')
                });
            }
        });
        return items;
    }, [engine.blocks]);

    const filteredItems = useMemo(() => {
        if (!isCreative) return [];
        return allItems.filter(item => {
            const name = item.name || '';
            const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [isCreative, searchQuery, activeCategory, allItems]);

    const craftingResult = useMemo(() => {
        const isBench = container.type === 'crafting_table';
        const grid = isBench ? craftingGrid : [craftingGrid[0], craftingGrid[1], null, craftingGrid[3], craftingGrid[4], null, null, null, null];
        return craftingSystem.match(grid);
    }, [craftingGrid, container.type]);

    const handleSlotClick = (type, idx, isRightClick = false, isShiftClick = false) => {
        let target;
        let updateFn;
        
        if (type === 'inventory') {
            target = engine.player.inventory;
            updateFn = () => setInventory([...engine.player.inventory]);
        } else if (type === 'hotbar') {
            target = engine.player.hotbar;
            updateFn = () => setHotbar([...engine.player.hotbar]);
        } else if (type === 'container') {
            target = container.inventory;
            updateFn = () => setInventory([...engine.player.inventory]);
        } else if (type === 'crafting') {
            target = craftingGrid;
            updateFn = () => setCraftingGrid([...craftingGrid]);
        } else if (type === 'creative') {
            const item = filteredItems[idx];
            if (!carryItem) {
                setCarryItem({ ...item, count: item.stackSize || MAX_STACK });
            } else {
                setCarryItem(null);
            }
            return;
        }
        
        const slotItem = target[idx];

        // 1. Shift-Click: Instant transfer
        if (isShiftClick && slotItem) {
            if (type === 'inventory') {
                if (engine.player.addItemToHotbar(slotItem)) target[idx] = null;
            } else if (type === 'hotbar') {
                if (engine.player.addItemToInventory(slotItem)) target[idx] = null;
            }
            updateFn();
            setInventory([...engine.player.inventory]);
            setHotbar([...engine.player.hotbar]);
            return;
        }

        // 2. Standard Interactions
        if (!carryItem) {
            if (!slotItem) return;
            if (isRightClick && slotItem.count > 1) {
                const take = Math.ceil(slotItem.count / 2);
                setCarryItem({ ...slotItem, count: take });
                slotItem.count -= take;
            } else {
                setCarryItem({ ...slotItem });
                target[idx] = null;
            }
        } else {
            if (isRightClick) {
                // Place single item
                if (!slotItem) {
                    target[idx] = { ...carryItem, count: 1 };
                    carryItem.count--;
                } else if (slotItem.id === carryItem.id && slotItem.count < (slotItem.stackSize || MAX_STACK)) {
                    slotItem.count++;
                    carryItem.count--;
                } else {
                    // Swap
                    const temp = { ...slotItem };
                    target[idx] = { ...carryItem };
                    setCarryItem(temp);
                }
                if (carryItem.count <= 0) setCarryItem(null);
            } else {
                // Place/Stack/Swap
                if (!slotItem) {
                    target[idx] = { ...carryItem };
                    setCarryItem(null);
                } else if (slotItem.id === carryItem.id && slotItem.count < (slotItem.stackSize || MAX_STACK)) {
                    const space = (slotItem.stackSize || MAX_STACK) - slotItem.count;
                    const moved = Math.min(space, carryItem.count);
                    slotItem.count += moved;
                    carryItem.count -= moved;
                    if (carryItem.count <= 0) setCarryItem(null);
                } else {
                    const temp = { ...slotItem };
                    target[idx] = { ...carryItem };
                    setCarryItem(temp);
                }
            }
        }
        
        if (updateFn) updateFn();
        engine.player.dirty = true;
    };

    const handleDragDrop = (sourceType, sourceIdx, targetType, targetIdx) => {
        if (sourceType === targetType && sourceIdx === targetIdx) return;
        
        const getTarget = (t) => {
            if (t === 'inventory') return engine.player.inventory;
            if (t === 'hotbar') return engine.player.hotbar;
            if (t === 'container') return container.inventory;
            if (t === 'crafting') return craftingGrid;
            return null;
        };
        
        const getUpdateFn = (t) => {
            if (t === 'inventory') return () => setInventory([...engine.player.inventory]);
            if (t === 'hotbar') return () => setHotbar([...engine.player.hotbar]);
            if (t === 'container') return () => setInventory([...engine.player.inventory]);
            if (t === 'crafting') return () => setCraftingGrid([...craftingGrid]);
            return () => {};
        };

        if (sourceType === 'creative') {
            const sItem = filteredItems[sourceIdx];
            const tTarget = getTarget(targetType);
            const tItem = tTarget[targetIdx];
            if (!tItem) {
                tTarget[targetIdx] = { ...sItem, count: sItem.stackSize || MAX_STACK };
            } else if (tItem.id === sItem.id && tItem.count < (tItem.stackSize || MAX_STACK)) {
                tItem.count = tItem.stackSize || MAX_STACK;
            } else {
                tTarget[targetIdx] = { ...sItem, count: sItem.stackSize || MAX_STACK };
            }
            getUpdateFn(targetType)();
            engine.player.dirty = true;
            return;
        }

        const sTarget = getTarget(sourceType);
        const tTarget = getTarget(targetType);
        if (!sTarget || !tTarget) return;

        const sItem = sTarget[sourceIdx];
        const tItem = tTarget[targetIdx];

        if (!sItem) return;

        if (!tItem) {
            tTarget[targetIdx] = { ...sItem };
            sTarget[sourceIdx] = null;
        } else if (sItem.id === tItem.id && tItem.count < (tItem.stackSize || MAX_STACK)) {
            const space = (tItem.stackSize || MAX_STACK) - tItem.count;
            const moved = Math.min(space, sItem.count);
            tItem.count += moved;
            sItem.count -= moved;
            if (sItem.count <= 0) sTarget[sourceIdx] = null;
        } else {
            // Swap
            sTarget[sourceIdx] = { ...tItem };
            tTarget[targetIdx] = { ...sItem };
        }

        getUpdateFn(sourceType)();
        if (sourceType !== targetType) getUpdateFn(targetType)();
        engine.player.dirty = true;
    };

    const handleCraftingResultClick = (isShiftClick = false) => {
        if (!craftingResult) return;
        
        const processOnce = () => {
            const { result } = craftingResult;
            if (carryItem && (carryItem.id !== result.id || carryItem.count + result.count > MAX_STACK)) return false;

            if (!carryItem) {
                setCarryItem({ ...result });
            } else {
                carryItem.count += result.count;
            }

            // Consume ingredients
            const isBench = container.type === 'crafting_table';
            const indices = isBench ? [0,1,2,3,4,5,6,7,8] : [0,1,3,4];
            const newGrid = [...craftingGrid];
            indices.forEach(i => {
                if (newGrid[i]) {
                    newGrid[i].count--;
                    if (newGrid[i].count <= 0) newGrid[i] = null;
                }
            });
            setCraftingGrid(newGrid);
            return true;
        };

        if (isShiftClick) {
            // Craft as much as possible and put in inventory
            while (craftingResult) {
                const { result } = craftingResult;
                const canAdd = engine.player.addItem({ ...result });
                if (!canAdd) break;

                // Consume ingredients
                const isBench = container.type === 'crafting_table';
                const indices = isBench ? [0,1,2,3,4,5,6,7,8] : [0,1,3,4];
                const newGrid = [...craftingGrid];
                indices.forEach(i => {
                    if (newGrid[i]) {
                        newGrid[i].count--;
                        if (newGrid[i].count <= 0) newGrid[i] = null;
                    }
                });
                setCraftingGrid(newGrid);
                // The re-run of useMemo will update craftingResult for the next iteration
            }
        } else {
            processOnce();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                layoutId="inventory-card"
                className="inventory-card"
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-2xl transition-colors text-white/40 hover:text-white z-50">
                    <X size={24} />
                </button>

                <div className="flex gap-8 h-full">
                    {/* Sidebar Tabs */}
                    <div className="flex flex-col gap-3 border-r border-white/5 pr-6">
                        <TabButton active={!isCreative} icon={Package} label="Survival" onClick={() => { engine.settings?.set('gameMode', 'survival'); setGameMode('survival'); }} />
                        <TabButton active={isCreative} icon={Star} label="Creative" onClick={() => { engine.settings?.set('gameMode', 'creative'); setGameMode('creative'); }} />
                        
                        <div className="h-px bg-white/5 my-4" />
                        
                        {isCreative && CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`p-4 rounded-2xl transition-all flex flex-col items-center gap-1 group
                                    ${activeCategory === cat.id ? 'bg-sky-500 text-white shadow-lg' : 'text-white/20 hover:text-white/40 hover:bg-white/5'}`}
                            >
                                <cat.icon size={20} />
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-6 flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex justify-between items-center h-12">
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
                                    {isCreative ? 'Creative Inventory' : 'Inventory'}
                                </h2>
                                <AnimatePresence mode="wait">
                                    {hoveredItem && (
                                        <motion.span 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.3em]"
                                        >
                                            {hoveredItem.name} <span className="text-white/20 mx-2">|</span> {hoveredItem.category || 'Misc'}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                            {isCreative && (
                                <div className="relative w-72">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                    <input 
                                        type="text"
                                        placeholder="Search archives..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-8">
                            {/* Main Grid Area */}
                            <div className="flex-1">
                                {isCreative ? (
                                    <div className="grid grid-cols-6 md:grid-cols-9 gap-2 max-h-[40vh] overflow-y-auto p-1 custom-scrollbar">
                                        {filteredItems.map((item, i) => (
                                            <Slot key={`creative-${i}`} item={item} onHover={setHoveredItem} onClick={(rc, sc) => handleSlotClick('creative', i, rc, sc)} onDragStart={(e) => { e.dataTransfer.setData('sType', 'creative'); e.dataTransfer.setData('sIdx', i); }} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        <div className="flex gap-8 items-start">
                                            {/* Armor */}
                                            <div className="flex flex-col gap-2">
                                                {[...Array(4)].map((_, i) => <Slot key={`armor-${i}`} onHover={setHoveredItem} icon={<Shield className="w-5 h-5 text-white/10" />} />)}
                                            </div>
                                            {/* Player Preview */}
                                            <div className="w-36 h-56 bg-black/20 rounded-[32px] border border-white/5 flex items-center justify-center relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent" />
                                                <span className="text-[10px] text-white/10 uppercase tracking-[0.3em] font-black rotate-90">Biological</span>
                                            </div>
                                            {/* Crafting */}
                                            <div className="flex flex-col gap-3 items-center">
                                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Crafting</span>
                                                <div className="grid grid-cols-2 gap-2 p-4 bg-white/5 rounded-3xl border border-white/5">
                                                    {[0,1,3,4].map(i => (
                                                        <Slot key={`craft-${i}`} item={craftingGrid[i]} onHover={setHoveredItem} onClick={(rc, sc) => handleSlotClick('crafting', i, rc, sc)} onDragStart={(e) => { e.dataTransfer.setData('sType', 'crafting'); e.dataTransfer.setData('sIdx', i); }} onDrop={(e) => handleDragDrop(e.dataTransfer.getData('sType'), parseInt(e.dataTransfer.getData('sIdx')), 'crafting', i)} />
                                                    ))}
                                                </div>
                                                <div className="w-14 h-14 bg-sky-500/10 border border-sky-400/20 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer" onClick={(e) => handleCraftingResultClick(e.shiftKey)}>
                                                    {craftingResult && <SlotItem item={craftingResult.result} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Workbench (If active) */}
                            {container.type === 'crafting_table' && (
                                <div className="flex flex-col gap-3 items-center p-6 bg-sky-500/5 rounded-[40px] border border-sky-400/10">
                                    <span className="text-[10px] font-bold text-sky-400/60 uppercase tracking-widest">Crafting Table</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Array.from({ length: 9 }).map((_, i) => (
                                            <Slot key={`bench-${i}`} item={craftingGrid[i]} onHover={setHoveredItem} onClick={(rc, sc) => handleSlotClick('crafting', i, rc, sc)} onDragStart={(e) => { e.dataTransfer.setData('sType', 'crafting'); e.dataTransfer.setData('sIdx', i); }} onDrop={(e) => handleDragDrop(e.dataTransfer.getData('sType'), parseInt(e.dataTransfer.getData('sIdx')), 'crafting', i)} />
                                        ))}
                                    </div>
                                    <div className="w-16 h-16 bg-sky-500/20 border border-sky-400/40 rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer" onClick={(e) => handleCraftingResultClick(e.shiftKey)}>
                                        {craftingResult && <SlotItem item={craftingResult.result} size="large" />}
                                    </div>
                                </div>
                            )}

                            {/* Chest Inventory (If active) */}
                            {container.type === 'chest' && (
                                <div className="flex flex-col gap-3 items-center p-6 bg-amber-500/5 rounded-[40px] border border-amber-400/10">
                                    <h3 className="text-amber-400 text-sm font-black uppercase tracking-widest">{container.title || 'Chest'}</h3>
                                    <div className="grid grid-cols-9 gap-2">
                                        {(container.inventory || Array(27).fill(null)).map((item, i) => (
                                            <Slot key={`chest-${i}`} item={item} onHover={setHoveredItem} onClick={(rc, sc) => handleSlotClick('container', i, rc, sc)} onDragStart={(e) => { e.dataTransfer.setData('sType', 'container'); e.dataTransfer.setData('sIdx', i); }} onDrop={(e) => handleDragDrop(e.dataTransfer.getData('sType'), parseInt(e.dataTransfer.getData('sIdx')), 'container', i)} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <hr className="border-white/5" />

                        {/* Player Storage */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Inventory</span>
                                        <button 
                                            onClick={() => engine.player.sortInventory()}
                                            className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-bold text-white/30 hover:text-white uppercase tracking-widest transition-all active:scale-95"
                                        >
                                            Sort & Stack
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-9 gap-2">
                                        {inventory.map((item, i) => (
                                            <Slot key={`inv-${i}`} item={item} onHover={setHoveredItem} onClick={(rc, sc) => handleSlotClick('inventory', i, rc, sc)} onDragStart={(e) => { e.dataTransfer.setData('sType', 'inventory'); e.dataTransfer.setData('sIdx', i); }} onDrop={(e) => handleDragDrop(e.dataTransfer.getData('sType'), parseInt(e.dataTransfer.getData('sIdx')), 'inventory', i)} />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-sky-400/60 uppercase tracking-widest">Hotbar</span>
                                    <div className="grid grid-cols-9 gap-2">
                                        {hotbar.map((item, i) => (
                                            <Slot key={`hot-${i}`} item={item} highlight onHover={setHoveredItem} onClick={(rc, sc) => handleSlotClick('hotbar', i, rc, sc)} onDragStart={(e) => { e.dataTransfer.setData('sType', 'hotbar'); e.dataTransfer.setData('sIdx', i); }} onDrop={(e) => handleDragDrop(e.dataTransfer.getData('sType'), parseInt(e.dataTransfer.getData('sIdx')), 'hotbar', i)} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>
            </motion.div>

            {/* Carry Ghost */}
            {carryItem && (
                <div className="fixed pointer-events-none z-[1000] -translate-x-1/2 -translate-y-1/2" style={{ left: mousePos.x, top: mousePos.y }}>
                    <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl">
                        <SlotItem item={carryItem} />
                    </div>
                </div>
            )}
        </div>
    );
};

const Slot = ({ item, highlight, icon, onClick, onHover, onDragStart, onDrop }) => (
    <motion.div 
        draggable={!!item}
        onDragStart={onDragStart}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={(e) => onClick?.(false, e.shiftKey)}
        onContextMenu={(e) => { e.preventDefault(); onClick?.(true, e.shiftKey); }}
        onMouseEnter={() => onHover?.(item)}
        onMouseLeave={() => onHover?.(null)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center relative cursor-pointer transition-all
            ${highlight ? 'bg-sky-500/10 border border-sky-400/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'bg-black/40 border border-white/5 hover:border-white/20'}`}
    >
        {icon && !item && icon}
        {item && <SlotItem item={item} />}
    </motion.div>
);

const SlotItem = ({ item, size }) => {
    const getTexturePath = (id, texture) => {
        const fileName = texture || id;
        return `/textures/items/${fileName}.png`;
    };

    return (
        <div className="flex flex-col items-center pointer-events-none relative">
            <img 
                src={getTexturePath(item.id, item.texture)} 
                className={`${size === 'large' ? 'w-10 h-10' : 'w-8 h-8'} object-contain drop-shadow-md`}
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => { 
                    const fileName = item.texture || item.id;
                    if (e.target.src.includes('/items/')) {
                        // Fallback to blocks directory
                        e.target.src = `/textures/packs/igneous/blocks/${fileName}.png`;
                    } else if (!e.target.src.includes('grass_block_side')) {
                        // Final fallback to a generic item texture if available
                        e.target.src = '/textures/packs/igneous/blocks/grass_block_side.png';
                    }
                }}
            />
            {item.count > 1 && (
                <span className="absolute -bottom-1 -right-1 text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] font-mono">
                    {item.count}
                </span>
            )}
        </div>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`p-4 rounded-[24px] transition-all flex flex-col items-center gap-1 group
            ${active ? 'bg-sky-500 text-white shadow-lg' : 'text-white/20 hover:text-white/40 hover:bg-white/5'}`}
    >
        <Icon size={20} />
        <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{label}</span>
    </button>
);
