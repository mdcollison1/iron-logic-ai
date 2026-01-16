import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Calendar, Clock, Target, X, ChevronLeft, ChevronRight } from 'lucide-react';
import RestTimer from './RestTimer';
import confetti from 'canvas-confetti';

export default function WorkoutDashboard({ session }) {
  const [workout, setWorkout] = useState([]);
  const [lastWeekData, setLastWeekData] = useState({});
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [showTimer, setShowTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [selectedMuscles, setSelectedMuscles] = useState(null);

  // Audio Reference for PR
  const prAudioRef = useRef(new Audio("https://www.myinstants.com/media/sounds/ronnie-coleman-yeah-buddy.mp3"));

  const dayNames = { 1: "Mon", 2: "Tue", 3: "Thu", 4: "Fri" };
  const dayFocus = { 1: "Chest & Core", 2: "Legs", 3: "Back & Cardio", 4: "Shoulders & Arms" };

  useEffect(() => { 
    fetchWorkout();
    if (currentWeek > 1) fetchLastWeek();
  }, [currentWeek, currentDay]);

  const fetchWorkout = async () => {
    const { data } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('week_number', currentWeek)
      .eq('day_number', currentDay)
      .order('id', { ascending: true })
      .order('set_number', { ascending: true });
    if (data) setWorkout(data);
  };

  const fetchLastWeek = async () => {
    const { data } = await supabase
      .from('workout_plans')
      .select('exercise_name, set_number, actual_weight_lb')
      .eq('user_id', session.user.id)
      .eq('week_number', currentWeek - 1)
      .eq('day_number', currentDay);
    if (data) {
      const historyMap = data.reduce((acc, row) => {
        acc[`${row.exercise_name}-Set${row.set_number}`] = row.actual_weight_lb;
        return acc;
      }, {});
      setLastWeekData(historyMap);
    }
  };

  const handleUpdate = async (id, field, value) => {
    setWorkout(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    await supabase.from('workout_plans').update({ [field]: value }).eq('id', id);
  };

  const markComplete = async (set) => {
    // PR DETECTION LOGIC
    const prevWeight = lastWeekData[`${set.exercise_name}-Set${set.set_number}`];
    const currentWeight = parseFloat(set.actual_weight_lb);

    if (prevWeight && currentWeight > prevWeight) {
      prAudioRef.current.play().catch(() => {});
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#ffffff', '#3b82f6']
      });
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 300]);
    }

    // Update State & DB
    setWorkout(prev => prev.map(row => row.id === set.id ? { ...row, is_completed: true } : row));
    setShowTimer(false);
    setTimeout(() => setShowTimer(true), 100);
    await supabase.from('workout_plans').update({ is_completed: true }).eq('id', set.id);
  };

  const groupedExercises = workout.reduce((acc, row) => {
    if (!acc[row.exercise_name]) acc[row.exercise_name] = [];
    acc[row.exercise_name].push(row);
    return acc;
  }, {});

  return (
    <div className="pb-32">
      {/* CALENDAR NAVIGATION */}
      <div className="glass-card p-4 mb-6 border-b border-emerald-500/10">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Weekly Schedule</h3>
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentWeek(w => Math.max(1, w-1))}><ChevronLeft size={16}/></button>
                <span className="text-xs font-bold text-white uppercase tracking-widest">Week {currentWeek}</span>
                <button onClick={() => setCurrentWeek(w => Math.min(12, w+1))}><ChevronRight size={16}/></button>
            </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(d => (
            <button key={d} onClick={() => setCurrentDay(d)}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center ${currentDay === d ? 'bg-emerald-500 border-emerald-400 text-emerald-950' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
              <span className="text-[10px] font-black">{dayNames[d]}</span>
              <span className="text-[8px] font-bold truncate w-full text-center">{dayFocus[d].split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* WORKOUT HEADER */}
      <div className="mb-8 px-2 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-black italic uppercase text-white leading-none tracking-tighter">{dayFocus[currentDay]}</h2>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 mt-3">
                <Clock size={12} className="text-emerald-500" />
                <select className="bg-transparent text-[10px] font-bold text-white outline-none" value={restDuration} onChange={(e) => setRestDuration(Number(e.target.value))}>
                    <option value={60}>60s Rest</option>
                    <option value={90}>90s Rest</option>
                    <option value={120}>120s Rest</option>
                </select>
            </div>
        </div>
      </div>

      {/* EXERCISE CARDS */}
      <div className="space-y-6">
        {Object.entries(groupedExercises).map(([name, sets]) => (
          <div key={name} className="glass-card overflow-hidden">
            <div className="bg-white/5 px-5 py-3 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-white font-bold text-sm uppercase italic">{name}</h3>
                <button onClick={() => setSelectedMuscles({ name, list: sets[0].muscles || "Full Body" })} className="text-emerald-500/50 hover:text-emerald-500"><Target size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              {sets.map((set) => {
                const prevWeight = lastWeekData[`${name}-Set${set.set_number}`];
                return (
                  <div key={set.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${set.is_completed ? 'bg-emerald-500/5 opacity-40' : 'bg-white/5 border border-white/5'}`}>
                    <div className="w-12">
                      <p className="text-[9px] font-black text-zinc-500 uppercase">Set {set.set_number}</p>
                      {prevWeight && <p className="text-[8px] text-emerald-400 font-mono italic">LW: {prevWeight}lb</p>}
                    </div>
                    <input type="number" placeholder={`${set.target_weight_lb}lb`} className="w-16 bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-emerald-400 font-mono outline-none" value={set.actual_weight_lb || ''} onChange={(e) => handleUpdate(set.id, 'actual_weight_lb', e.target.value)} />
                    <input type="text" placeholder={set.target_reps} className="w-16 bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white font-mono outline-none" value={set.actual_reps || ''} onChange={(e) => handleUpdate(set.id, 'actual_reps', e.target.value)} />
                    <button onClick={() => markComplete(set)} className={`ml-auto ${set.is_completed ? 'text-emerald-500' : 'text-zinc-800'}`}><CheckCircle2 size={28} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

   {/* MUSCLE MODAL */}
<AnimatePresence>
  {selectedMuscles && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card w-full max-w-xs p-8 text-center border-emerald-500/30">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Target size={40} className="text-emerald-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-black italic uppercase text-white mb-2">{selectedMuscles.name}</h2>
        <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Primary Drivers</p>
        <p className="text-zinc-300 text-sm italic font-bold mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
          {selectedMuscles.list}
        </p>
        <button onClick={() => setSelectedMuscles(null)} className="w-full py-4 bg-emerald-500 text-emerald-950 rounded-xl text-[10px] font-black uppercase">
          Back to Training
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* TIMER */}
      <AnimatePresence>{showTimer && <RestTimer duration={restDuration} onFinished={() => setShowTimer(false)} onCancel={() => setShowTimer(false)} />}</AnimatePresence>
    </div>
  );
}