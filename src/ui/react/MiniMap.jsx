import { useEffect, useRef } from 'react';

export const MiniMapComponent = ({ engine, position, rotation }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !engine) return;
        
        // Initialize MiniMap if not exists
        if (!engine.minimap) {
            const { MiniMap } = import.meta.glob('../MiniMap.js', { eager: true });
            engine.minimap = new MiniMap(engine);
        }

        engine.minimap.attachDom(containerRef.current, canvasRef.current);
    }, [engine]);

    useEffect(() => {
        if (engine.minimap && position && rotation) {
            engine.minimap.update(0.016, position, rotation.y);
        }
    }, [position, rotation, engine]);

    return (
        <div 
            ref={containerRef}
            className="absolute top-5 right-5 w-32 h-32 md:w-40 md:h-40 bg-slate-950/50 backdrop-blur-xl p-1 rounded-3xl border border-white/10 shadow-2xl pointer-events-none overflow-hidden"
        >
            <canvas 
                ref={canvasRef}
                width={256}
                height={256}
                className="w-full h-full rounded-2xl"
                style={{ imageRendering: 'pixelated' }}
            />
            
            {/* Scanlines effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            
            {/* Glass shine */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        </div>
    );
};
