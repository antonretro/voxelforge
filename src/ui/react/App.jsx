import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainMenu }       from './MainMenu.jsx';
import { HUD }            from './HUD.jsx';
import { Inventory }      from './Inventory.jsx';
import { PauseMenu }      from './PauseMenu.jsx';
import { DeathScreen }    from './DeathScreen.jsx';
import { ChatBox }        from './ChatBox.jsx';
import { UpdateLog }     from './UpdateLog.jsx';
import { CommunityMenu } from './CommunityMenu.jsx';
import { MobileControls } from './MobileControls.jsx';

const isTouchDevice = () => navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

// gameState drives top-level screen switches
// 'menu' | 'playing' | 'paused' | 'dead'

export const App = ({ engine }) => {
    const [gameState,    setGameState]    = useState('menu');
    const [deathCause,   setDeathCause]   = useState('generic');
    const [showInventory,setShowInventory]= useState(false);
    const [chatOpen,     setChatOpen]     = useState(false);
    const [showF3,       setShowF3]       = useState(false);
    const [damageFlash,  setDamageFlash]  = useState(false);
    const [isMobile]                      = useState(isTouchDevice);
    const [showUpdateLog, setShowUpdateLog] = useState(false);
    const [showCommunity, setShowCommunity] = useState(false);

    const [hudState, setHudState] = useState({
        health: 20,
        hunger: 20,
        fps: 60,
        hotbar: [],
        selectedSlot: 0,
        position: null,
        gameMode: 'creative',
    });

    useEffect(() => {
        if (!engine) return;

        // Sync engine vitals → HUD every tick
        const onTick = () => {
            const pos = engine.camera?.position;
            setHudState({
                health:      engine.survival?.health      ?? 20,
                hunger:      engine.survival?.hunger      ?? 20,
                fps:         Math.round(engine.getFps()   ?? 60),
                hotbar:      engine.player?.hotbar        ?? [],
                selectedSlot:engine.controls?.selectedSlot ?? 0,
                position:    pos ? { x: pos.x, y: pos.y, z: pos.z } : null,
                gameMode:    engine.settings?.get('gameMode') ?? 'creative',
            });
        };

        // Top-level state transitions
        const onStateChange = (state) => {
            setGameState(state);
            // Close chat / inventory on any state transition
            if (state !== 'playing') {
                setChatOpen(false);
                setShowInventory(false);
                if (engine.controls) engine.controls.chatOpen = false;
            }
        };

        const onInventoryToggle = (visible) => setShowInventory(visible);
        const onPlayerDeath     = ({ cause } = {}) => { setDeathCause(cause ?? 'generic'); setGameState('dead'); };
        const onOpenChat        = ()         => { setChatOpen(true);  if (engine.controls) engine.controls.chatOpen = true;  };
        const onCloseChat       = ()         => { setChatOpen(false); if (engine.controls) engine.controls.chatOpen = false; };
        const onToggleF3        = ()         => setShowF3(v => !v);
        const onPlayerDamage    = ()         => {
            setDamageFlash(true);
            setTimeout(() => setDamageFlash(false), 500);
        };

        engine.on('tick',             onTick);
        engine.on('stateChange',      onStateChange);
        engine.on('inventoryToggle',  onInventoryToggle);
        engine.on('playerDeath',      onPlayerDeath);
        engine.on('openChat',         onOpenChat);
        engine.on('closeChat',        onCloseChat);
        engine.on('toggleF3',         onToggleF3);
        engine.on('playerDamage',     onPlayerDamage);

        return () => {
            engine.off('tick',            onTick);
            engine.off('stateChange',     onStateChange);
            engine.off('inventoryToggle', onInventoryToggle);
            engine.off('playerDeath',     onPlayerDeath);
            engine.off('openChat',        onOpenChat);
            engine.off('closeChat',       onCloseChat);
            engine.off('toggleF3',        onToggleF3);
            engine.off('playerDamage',    onPlayerDamage);
        };
    }, [engine]);

    // Relay network chat messages into engine event so ChatBox picks them up
    useEffect(() => {
        if (!engine) return;
        // NetworkManager calls engine.hud?.chat?.addMessage — shim it here
        if (!engine.hud) engine.hud = {};
        engine.hud.chat = {
            addMessage: (username, message) => engine.emit('chatMessage', { username, message }),
        };
    }, [engine]);

    const handleRespawn = () => {
        engine.survival?.respawn();
    };

    return (
        <div className="w-full h-full relative select-none">

            {/* ── Menu ── */}
            <AnimatePresence>
                {gameState === 'menu' && (
                    <motion.div
                        key="main-menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ui-overlay"
                    >
                        <MainMenu
                            engine={engine}
                            onPlay={(params) => engine.startGame(params)}
                            onMultiplayerJoin={() => {/* already handled inside MultiplayerMenu */}}
                            onShowUpdates={() => setShowUpdateLog(true)}
                            onShowCommunity={() => setShowCommunity(true)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── In-game UI (HUD, inventory, chat) ── */}
            <AnimatePresence>
                {(gameState === 'playing' || gameState === 'paused') && (
                    <motion.div
                        key="game-hud"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        <HUD
                            engine={engine}
                            state={{
                                ...hudState,
                                showFPS:     engine?.settings?.get('showFPS') ?? true,
                                showF3,
                                damageFlash,
                            }}
                        />

                        {/* Chat overlay — always visible when playing */}
                        <ChatBox
                            engine={engine}
                            isOpen={chatOpen}
                            onClose={() => {
                                setChatOpen(false);
                                if (engine.controls) engine.controls.chatOpen = false;
                            }}
                        />

                        {/* Inventory modal */}
                        <AnimatePresence>
                            {showInventory && (
                                <motion.div
                                    key="inventory-overlay"
                                    initial={{ opacity: 0, scale: 0.92, y: 16 }}
                                    animate={{ opacity: 1, scale: 1,    y: 0  }}
                                    exit={{   opacity: 0, scale: 0.92, y: 16 }}
                                    className="ui-overlay flex items-center justify-center bg-slate-950/60 backdrop-blur-md"
                                >
                                    <Inventory engine={engine} onClose={() => engine.toggleInventory()} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Pause menu ── */}
            <AnimatePresence>
                {gameState === 'paused' && (
                    <motion.div key="pause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <PauseMenu engine={engine} onResume={() => engine.resume()} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Mobile controls (touch devices only, while actively playing) ── */}
            <MobileControls
                engine={engine}
                visible={isMobile && (gameState === 'playing')}
            />

            {/* ── Death screen ── */}
            <AnimatePresence>
                {gameState === 'dead' && (
                    <motion.div key="dead" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <DeathScreen engine={engine} onRespawn={handleRespawn} cause={deathCause} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Update Log ── */}
            <AnimatePresence>
                {showUpdateLog && (
                    <UpdateLog onClose={() => setShowUpdateLog(false)} />
                )}
            </AnimatePresence>

            {/* ── Community Hub ── */}
            <AnimatePresence>
                {showCommunity && (
                    <motion.div 
                        key="community-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ui-overlay flex items-center justify-center bg-slate-950/40 backdrop-blur-md"
                    >
                        <CommunityMenu 
                            onBack={() => setShowCommunity(false)} 
                            onPlayGame={(id) => {
                                setShowCommunity(false);
                                engine.startGame({ name: id, seed: id, type: 'infinite', difficulty: 'normal' });
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
