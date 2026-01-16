import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Check, Plus, Target, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkoutDashboard({ session }) {
  const [workout, setWorkout] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [selectedMuscles, setSelectedMuscles] = useState(null);
  
  // NEW: State for tracking set completion and extra sets
  const [completedSets, setCompletedSets] = useState({});
  const [extraSets, setExtraSets] = useState({});

  useEffect(() => {
    if (session) fetchWorkout();
  }, [session]);

  const fetchWorkout = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', session.user.id)
        .order('week', { ascending: true })
        .order('day_number', { ascending: true });

      if (error) throw error;
      setWorkout(data || []);
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Toggle logic with sound trigger
  const toggleSet = (exerciseId, setIndex, isLastSet) => {
    const key = `${exerciseId}-${setIndex}`;
    const isNowCompleted = !completedSets[key];
    
    setCompletedSets(prev => ({ ...prev, [key]: isNowCompleted }));

    if (isNowCompleted && isLastSet) {
      const audio = new Audio('/sounds/lightweight.mp3');
      audio.play().catch(e => console.log("Audio waiting for user interaction"));
    }
  };

  // NEW: Add extra set logic
  const addSet = (exerciseId) => {
    setExtraSets(prev => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || 0) + 1
    }));
  };

  if (loading) return <div className="text-center p-10 text-zinc-500 font-black animate-pulse">SYNCHRONIZING PROTOCOL...</div>;
  if (workout.length === 0) return null;

  const currentDay = workout[currentDayIndex];
  const exercises = JSON.parse(currentDay?.exercises || '[]');

  return (
    <div className="space-y-6">
      {/* NAVIGATION HEADER */}
      <div className="flex items-center justify-between mb-8 bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
        <button 
          onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
          className="p-3 text-emerald-500 disabled:opacity-20"
          disabled={currentDayIndex === 0}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="text-center">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Week {currentDay.week} • Day {currentDay.day_number}</p>
          <h2 className="text-xl font-black italic uppercase text-white">{currentDay.focus}</h2>
        </div>

        <button 
          onClick={() => setCurrentDayIndex(Math.min(workout.length - 1, currentDayIndex + 1))}
          className="p-3 text-emerald-500 disabled:opacity-20"
          disabled={currentDayIndex === workout.length - 1}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* EXERCISE LIST */}
      <div className="space-y-4">
        {exercises.map((ex, idx) => {
          const exerciseId = `${currentDay.id}-${idx}`;
          const totalSets = (ex.sets || 0) + (extraSets[exerciseId] || 0);

          return (
            <div key={idx} className="glass-card overflow-hidden border-white/5">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black italic uppercase text-white leading-tight">{ex.name}</h3>
                    <p className="text-emerald-500 font-mono text-sm">{ex.weight} LBS • {ex.reps} REPS</p>
                  </div>
                  <button 
                    onClick={() => setSelectedMuscles({ name: ex.name, list: ex.muscles || 'Target Muscles' })}
                    className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-emerald-500"
                  >
                    <Info size={18} />
                  </button>
                </div>

                {/* THE SETS GRID (UPDATED) */}
                <div className="space-y-2">
                  {[...Array(totalSets)].map((_, i) => {
                    const isCompleted = completedSets[`${exerciseId}-${i}`];
                    const isLast = i === totalSets - 1;

                    return (
                      <div 
                        key={i} 
                        onClick={() => toggleSet(exerciseId, i, isLast)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isCompleted 
                            ? 'bg-emerald-500/20 border-emerald-500/50' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className={`text-xs font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-zinc-500'}`}>
                          SET {i + 1}
                        </span>
                        <div className={`p-1 rounded-md transition-all ${isCompleted ? 'bg-emerald-500 text-black scale-110' : 'bg-zinc-800 text-zinc-600'}`}>
                          <Check size={14} strokeWidth={4} />
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* ADD SET BUTTON */}
                  <button 
                    onClick={() => addSet(exerciseId)}
                    className="w-full py-3 mt-2 border border-dashed border-zinc-800 rounded-xl text-[10px] font-black text-zinc-600 hover:border-emerald-500/50 hover:text-emerald-500 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add Extra Set
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MUSCLE INFO MODAL (WITH IMAGE) */}
      <AnimatePresence>
        {selectedMuscles && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              className="glass-card w-full max-w-xs p-8 text-center border-emerald-500/30"
            >
              {/* Image Path logic: matches /public/muscles/chest.png etc */}
              <img 
                src={`/muscles/${selectedMuscles.list.split(',')[0].toLowerCase().trim()}.png`}
                alt="Muscle Map"
                className="w-full h-48 object-contain mb-6 mx-auto"
                onError={(e) => {
                   e.target.onerror = null;
                   e.target.src = "https://www.svgrepo.com/show/447034/muscle.svg";
                }}
              />

              <h2 className="text-xl font-black italic uppercase text-white mb-2">{selectedMuscles.name}</h2>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Primary Drivers</p>
              <p className="text-zinc-300 text-sm italic font-bold mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
                {selectedMuscles.list}
              </p>
              <button 
                onClick={() => setSelectedMuscles(null)} 
                className="w-full py-4 bg-emerald-500 text-emerald-950 rounded-xl text-[10px] font-black uppercase shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Back to Training
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}