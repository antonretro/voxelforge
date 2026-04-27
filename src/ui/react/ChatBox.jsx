import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';

const MAX_MESSAGES = 50;
const FADE_AFTER   = 8000; // ms before messages start fading

export const ChatBox = ({ engine, isOpen, onClose }) => {
    const [messages, setMessages]   = useState([]);
    const [input,    setInput]      = useState('');
    const inputRef                  = useRef(null);
    const listRef                   = useRef(null);

    useEffect(() => {
        if (!engine) return;

        const handleChat = (msg) => {
            setMessages(prev => {
                const next = [...prev, { ...msg, id: Date.now() + Math.random(), ts: Date.now() }];
                return next.slice(-MAX_MESSAGES);
            });
        };

        engine.on('chatMessage', handleChat);
        return () => engine.off('chatMessage', handleChat);
    }, [engine]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isOpen]);

    const send = () => {
        const text = input.trim();
        if (!text) { onClose(); return; }
        const username = engine?.settings?.get('username') ?? 'Player';
        engine?.network?.sendChat(text);
        // Echo locally
        engine?.emit('chatMessage', { username, message: text, local: true });
        setInput('');
        onClose();
    };

    const onKey = (e) => {
        if (e.key === 'Enter')  { e.preventDefault(); send(); }
        if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        e.stopPropagation();
    };

    return (
        <div className="fixed bottom-28 left-6 z-[90] flex flex-col gap-1 pointer-events-none w-96">
            {/* Message list — always visible in-game (fades when closed) */}
            <div
                ref={listRef}
                className="flex flex-col gap-0.5 max-h-48 overflow-y-auto pointer-events-none"
            >
                <AnimatePresence initial={false}>
                    {messages.map(msg => (
                        <ChatMessage key={msg.id} msg={msg} isOpen={isOpen} />
                    ))}
                </AnimatePresence>
            </div>

            {/* Input field */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scaleY: 0.8 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: 8, scaleY: 0.8 }}
                        className="flex gap-2 pointer-events-auto"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={onKey}
                            maxLength={256}
                            placeholder="Press Enter to send, Esc to cancel…"
                            className="flex-1 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-sky-500/50 placeholder:text-white/25"
                        />
                        <button
                            onClick={send}
                            className="px-3 py-2.5 bg-sky-500/20 border border-sky-500/30 rounded-xl text-sky-400 hover:bg-sky-500/30 transition-colors"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ChatMessage = ({ msg, isOpen }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (isOpen) return; // Keep visible while chat is open
        const t = setTimeout(() => setVisible(false), FADE_AFTER);
        return () => clearTimeout(t);
    }, [isOpen]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, transition: { duration: 1 } }}
                    className="flex items-baseline gap-1.5 px-2 py-0.5 rounded"
                >
                    <span
                        className="text-[10px] font-black shrink-0"
                        style={{ color: msg.local ? '#38bdf8' : stringToColor(msg.username) }}
                    >
                        {msg.username}:
                    </span>
                    <span className="text-[10px] text-white/80 font-medium leading-relaxed break-all">
                        {msg.message}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Deterministic colour from username string
function stringToColor(str = '') {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 75%, 65%)`;
}
