/**
 * MobileControls — on-screen virtual gamepad for touch devices.
 *
 * Layout:
 *   Bottom-left  → virtual joystick (move)
 *   Bottom-right → Jump, Sprint, Inventory buttons
 *   Right side   → Attack (mine) and Place buttons
 *   Full screen  → camera-look drag zone (behind all buttons)
 *
 * Feeds input directly into FirstPersonControls via engine.controls.
 */
import { useEffect, useRef, useCallback } from 'react';

const JOYSTICK_RADIUS = 52;
const DEAD_ZONE       = 0.12;

export const MobileControls = ({ engine, visible }) => {
    const joystickBase  = useRef(null);
    const joystickThumb = useRef(null);
    const lookZone      = useRef(null);

    // Track active touches
    const joystickTouch = useRef(null);
    const lookTouch     = useRef(null);
    const joystickOrigin= useRef({ x: 0, y: 0 });

    // ── Joystick ──────────────────────────────────────────────────────────
    const updateJoystick = useCallback((dx, dy) => {
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(dist, JOYSTICK_RADIUS);
        const nx = dist > 0 ? (dx / dist) * clamped : 0;
        const ny = dist > 0 ? (dy / dist) * clamped : 0;

        // Move thumb visually
        if (joystickThumb.current) {
            joystickThumb.current.style.transform = `translate(${nx}px, ${ny}px)`;
        }

        // Inject into controls keystate
        const ctrl = engine?.controls;
        if (!ctrl) return;
        const ax = nx / JOYSTICK_RADIUS;
        const ay = ny / JOYSTICK_RADIUS;
        ctrl.keystate.KeyW = ay < -DEAD_ZONE;
        ctrl.keystate.KeyS = ay >  DEAD_ZONE;
        ctrl.keystate.KeyA = ax < -DEAD_ZONE;
        ctrl.keystate.KeyD = ax >  DEAD_ZONE;
    }, [engine]);

    const resetJoystick = useCallback(() => {
        if (joystickThumb.current) joystickThumb.current.style.transform = 'translate(0,0)';
        const ctrl = engine?.controls;
        if (!ctrl) return;
        ctrl.keystate.KeyW = false;
        ctrl.keystate.KeyS = false;
        ctrl.keystate.KeyA = false;
        ctrl.keystate.KeyD = false;
    }, [engine]);

    // ── Camera look ───────────────────────────────────────────────────────
    const handleLookMove = useCallback((e) => {
        if (!lookTouch.current) return;
        const touch = [...e.changedTouches].find(t => t.identifier === lookTouch.current.id);
        if (!touch) return;

        const dx = touch.clientX - lookTouch.current.x;
        const dy = touch.clientY - lookTouch.current.y;
        lookTouch.current.x = touch.clientX;
        lookTouch.current.y = touch.clientY;

        const ctrl = engine?.controls;
        if (!ctrl) return;
        const sens = (engine?.settings?.get('touchSensitivity') ?? 0.005);
        const max  = Math.PI * 0.5;
        const rot  = ctrl.rotation;
        rot.y += dx * sens;
        rot.x  = Math.max(-max, Math.min(max, rot.x + dy * sens));
        engine.camera?.rotate(rot.x, rot.y, 0);
    }, [engine]);

    // ── Main touch router ─────────────────────────────────────────────────
    useEffect(() => {
        if (!visible) return;

        const base = joystickBase.current;
        const look = lookZone.current;
        if (!base || !look) return;

        const onJoyStart = (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            joystickTouch.current = touch.identifier;
            const rect = base.getBoundingClientRect();
            joystickOrigin.current = {
                x: rect.left + rect.width  / 2,
                y: rect.top  + rect.height / 2,
            };
        };

        const onJoyMove = (e) => {
            e.preventDefault();
            const touch = [...e.changedTouches].find(t => t.identifier === joystickTouch.current);
            if (!touch) return;
            const dx = touch.clientX - joystickOrigin.current.x;
            const dy = touch.clientY - joystickOrigin.current.y;
            updateJoystick(dx, dy);
        };

        const onJoyEnd = (e) => {
            const touch = [...e.changedTouches].find(t => t.identifier === joystickTouch.current);
            if (!touch) return;
            joystickTouch.current = null;
            resetJoystick();
        };

        const onLookStart = (e) => {
            if (lookTouch.current) return; // already tracking one finger
            const touch = e.changedTouches[0];
            lookTouch.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
        };

        const onLookEnd = (e) => {
            if (!lookTouch.current) return;
            const touch = [...e.changedTouches].find(t => t.identifier === lookTouch.current.id);
            if (touch) lookTouch.current = null;
        };

        base.addEventListener('touchstart', onJoyStart, { passive: false });
        base.addEventListener('touchmove',  onJoyMove,  { passive: false });
        base.addEventListener('touchend',   onJoyEnd,   { passive: false });

        look.addEventListener('touchstart', onLookStart, { passive: true });
        look.addEventListener('touchmove',  handleLookMove, { passive: true });
        look.addEventListener('touchend',   onLookEnd,   { passive: true });

        return () => {
            base.removeEventListener('touchstart', onJoyStart);
            base.removeEventListener('touchmove',  onJoyMove);
            base.removeEventListener('touchend',   onJoyEnd);
            look.removeEventListener('touchstart', onLookStart);
            look.removeEventListener('touchmove',  handleLookMove);
            look.removeEventListener('touchend',   onLookEnd);
        };
    }, [visible, updateJoystick, resetJoystick, handleLookMove]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[80] pointer-events-none">

            {/* Camera look zone — full screen behind everything */}
            <div ref={lookZone} className="absolute inset-0 pointer-events-auto" style={{ touchAction: 'none' }} />

            {/* Joystick — bottom left */}
            <div className="absolute bottom-36 left-6 pointer-events-auto" style={{ touchAction: 'none' }}>
                <div
                    ref={joystickBase}
                    className="relative flex items-center justify-center rounded-full border-2 border-white/20 bg-slate-950/50 backdrop-blur-md"
                    style={{ width: JOYSTICK_RADIUS * 2, height: JOYSTICK_RADIUS * 2 }}
                >
                    {/* Directional hints */}
                    {['▲', '▶', '▼', '◀'].map((arrow, i) => {
                        const positions = [
                            { top: 4,  left: '50%', transform: 'translateX(-50%)' },
                            { right: 4, top: '50%', transform: 'translateY(-50%)' },
                            { bottom: 4, left: '50%', transform: 'translateX(-50%)' },
                            { left: 4, top: '50%',  transform: 'translateY(-50%)' },
                        ];
                        return (
                            <span
                                key={i}
                                className="absolute text-[8px] text-white/20 font-bold select-none"
                                style={positions[i]}
                            >
                                {arrow}
                            </span>
                        );
                    })}

                    {/* Thumb */}
                    <div
                        ref={joystickThumb}
                        className="w-10 h-10 rounded-full bg-white/25 border border-white/30 backdrop-blur-sm shadow-lg transition-none"
                        style={{ willChange: 'transform' }}
                    />
                </div>
            </div>

            {/* Action buttons — bottom right */}
            <div className="absolute bottom-36 right-6 flex flex-col gap-3 items-end pointer-events-auto">
                <ActionButton
                    label="⬆ Jump"
                    color="sky"
                    onStart={() => { if (engine?.controls) engine.controls.keystate.Space = true;  }}
                    onEnd=  {() => { if (engine?.controls) engine.controls.keystate.Space = false; }}
                />
                <div className="flex gap-3">
                    <ActionButton
                        label="⚡ Sprint"
                        color="amber"
                        onStart={() => { if (engine?.controls) engine.controls.keystate.ControlLeft = true;  }}
                        onEnd=  {() => { if (engine?.controls) engine.controls.keystate.ControlLeft = false; }}
                    />
                    <ActionButton
                        label="🎒 Bag"
                        color="purple"
                        onStart={() => engine?.toggleInventory?.()}
                    />
                </div>
            </div>

            {/* Attack / Place — right side mid */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
                <ActionButton
                    label="⛏ Mine"
                    color="red"
                    large
                    onStart={() => {
                        // Simulate a left-click raycast via controls
                        const ctrl = engine?.controls;
                        if (!ctrl) return;
                        ctrl.isMining = true;
                        // Set target to whatever is centred on screen
                        const { Vector3 } = window.__vf_math ?? {};
                        // fallback: trigger via synthetic mouse event
                        engine?.canvas?.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
                    }}
                    onEnd={() => {
                        if (engine?.controls) { engine.controls.isMining = false; engine.controls.miningTarget = null; }
                        engine?.canvas?.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true }));
                    }}
                />
                <ActionButton
                    label="🧱 Place"
                    color="green"
                    large
                    onStart={() => {
                        engine?.canvas?.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true }));
                    }}
                    onEnd={() => {
                        engine?.canvas?.dispatchEvent(new MouseEvent('mouseup', { button: 2, bubbles: true }));
                    }}
                />
            </div>

            {/* Pause button — top right */}
            <div className="absolute top-5 right-5 pointer-events-auto">
                <ActionButton
                    label="⏸"
                    color="slate"
                    onStart={() => engine?.paused ? engine.resume() : engine?.pause()}
                />
            </div>
        </div>
    );
};

// ── Shared touch button ─────────────────────────────────────────────────────

const colorMap = {
    sky:    'bg-sky-500/30    border-sky-400/50    active:bg-sky-500/60',
    amber:  'bg-amber-500/30  border-amber-400/50  active:bg-amber-500/60',
    red:    'bg-red-500/30    border-red-400/50    active:bg-red-500/60',
    green:  'bg-emerald-500/30 border-emerald-400/50 active:bg-emerald-500/60',
    purple: 'bg-purple-500/30 border-purple-400/50 active:bg-purple-500/60',
    slate:  'bg-slate-700/50  border-slate-500/50  active:bg-slate-600/70',
};

const ActionButton = ({ label, color = 'slate', large = false, onStart, onEnd }) => (
    <button
        className={`
            ${large ? 'w-16 h-16 text-lg' : 'w-12 h-12 text-xs'}
            rounded-2xl border backdrop-blur-md
            font-black text-white/80 select-none
            transition-colors duration-75
            ${colorMap[color] ?? colorMap.slate}
        `}
        onTouchStart={(e) => { e.preventDefault(); onStart?.(); }}
        onTouchEnd={(e)   => { e.preventDefault(); onEnd?.();   }}
        style={{ touchAction: 'none' }}
    >
        {label}
    </button>
);
