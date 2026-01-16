import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Timer, Volume2 } from 'lucide-react';

export default function RestTimer({ duration, onFinished, onCancel }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const audioRef = useRef(new Audio("https://www.myinstants.com/media/sounds/light-weight-baby.mp3"));

  useEffect(() => {
    if (timeLeft <= 0) {
      // 1. Play Ronnie Coleman
      audioRef.current.play().catch(() => {});
      
      // 2. Trigger Haptic Pulse
      if ("vibrate" in navigator) {
        navigator.vibrate([500, 200, 500]);
      }
      
      // Auto-close after sound plays
      const timeout = setTimeout(() => onFinished(), 2000);
      return () => clearTimeout(timeout);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onFinished]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
    >
      <div className="glass-card p-10 w-full max-w-xs text-center border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        <Timer size={48} className="text-emerald-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Resting</h2>
        <div className="text-7xl font-black italic text-white mb-6 font-mono">{timeLeft}s</div>
        <button onClick={onCancel} className="w-full py-4 bg-white/5 text-zinc-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">
          Skip Rest
        </button>
      </div>
    </motion.div>
  );
}