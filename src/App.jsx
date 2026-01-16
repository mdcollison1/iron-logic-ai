import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import WorkoutDashboard from './components/WorkoutDashboard';
import ProgressChart from './components/ProgressChart';
import { generate12WeekPlan } from './utils/programLogic';
import { Dumbbell, Rocket, Trash2, LogOut, TrendingUp, Lock, User } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState([]);
  
  const [maxes, setMaxes] = useState({
    benchpress: '',
    squat: '',
    deadlift: '',
    overheadpress: ''
  });

  useEffect(() => {
    // Check for existing session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchExistingPlan(session.user.id);
    });

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchExistingPlan(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

const fetchExistingPlan = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', userId);
    
    // Check if data actually exists before setting it
    if (data && data.length > 0) {
      setGeneratedPlan(data);
    } else {
      setGeneratedPlan([]); // Keep it empty but defined
    }
  } catch (err) {
    console.error("Fetch failed:", err);
    setGeneratedPlan([]);
  }
};

  // NEW: PASSWORD-BASED LOGIN LOGIC
  // This bypasses the iPhone "Magic Link" loop frustration.
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // We use a default password to keep the UI simple for you
    const defaultPassword = 'IronLogicUser123!';

    // 1. Try to Sign In
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: defaultPassword,
    });

    // 2. If user doesn't exist, Sign them Up automatically
    if (signInError && signInError.message.includes("Invalid login credentials")) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: defaultPassword,
        options: {
          data: { first_name: firstName }
        }
      });

      if (signUpError) {
        alert("Setup Error: " + signUpError.message);
      } else {
        alert(`Welcome aboard, ${firstName}! Account initialized.`);
      }
    } else if (signInError) {
      alert("Login Error: " + signInError.message);
    }

    setLoading(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (!maxes.benchpress || !maxes.squat || !maxes.deadlift || !maxes.overheadpress) {
        throw new Error("Please enter all 1RM values first.");
      }

      const plan = generate12WeekPlan(session.user.id, maxes);
      const { error } = await supabase.from('workout_plans').insert(plan);
      if (error) throw error;
      
      setGeneratedPlan(plan);
      alert("12-Week Protocol Deployed!");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Erase current program and start over?")) return;
    const { error } = await supabase.from('workout_plans').delete().eq('user_id', session.user.id);
    if (!error) {
      setGeneratedPlan([]);
      window.location.reload();
    }
  };

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-white text-center">
        <div className="glass-card p-8 w-full max-w-md border-emerald-500/20 shadow-2xl">
          <Dumbbell className="mx-auto mb-4 text-emerald-500" size={48} />
          <h1 className="text-3xl font-black italic uppercase mb-2 tracking-tighter text-white">Iron Logic AI</h1>
          <p className="text-zinc-500 mb-8 text-xs uppercase tracking-[0.2em] font-black">Initialization Protocol</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="text-[10px] uppercase font-black text-zinc-600 ml-1">First Name</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3.5 text-zinc-600" size={16} />
                <input 
                  type="text" 
                  placeholder="NAME"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-800 font-bold"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>

            <div className="text-left">
              <label className="text-[10px] uppercase font-black text-zinc-600 ml-1">Email Address</label>
              <input 
                type="email" 
                placeholder="EMAIL"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 mt-1 text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-800 font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="neon-button w-full flex items-center justify-center gap-2 py-4 mt-4"
            >
              <Lock size={18} /> {loading ? "ESTABLISHING..." : "START TRAINING"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- DASHBOARD SCREEN ---
  const userName = session?.user?.user_metadata?.first_name || 'Athlete';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <nav className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <span className="font-black italic uppercase tracking-tighter text-emerald-500 flex items-center gap-2">
          <TrendingUp size={18} /> Welcome, {userName}
        </span>
        <button onClick={() => supabase.auth.signOut()} className="text-zinc-500 hover:text-white transition-colors">
          <LogOut size={20} />
        </button>
      </nav>

      <main className="max-w-md mx-auto py-8 px-6">
        {generatedPlan.length === 0 && (
          <div className="glass-card p-6 mb-8 border-emerald-500/10 shadow-xl">
            <h2 className="text-xl font-black italic uppercase mb-4 flex items-center gap-2 text-white">
              <Rocket size={20} className="text-emerald-500" /> 
              Initial Protocol
            </h2>
            
            <div className="space-y-4">
              {['benchpress', 'squat', 'deadlift', 'overheadpress'].map((lift) => (
                <div key={lift}>
                  <label className="text-[10px] uppercase font-black text-zinc-500 ml-1 tracking-widest">
                    {lift.replace('press', ' Press')} Max
                  </label>
                  <input 
                    type="number" placeholder="0 lbs"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 mt-1 text-emerald-400 font-mono focus:border-emerald-500/50 outline-none transition-all text-xl"
                    value={maxes[lift]}
                    onChange={(e) => setMaxes({...maxes, [lift]: e.target.value})} 
                  />
                </div>
              ))}

              <button onClick={handleGenerate} disabled={loading} className="neon-button w-full mt-6 py-4 disabled:opacity-50">
                {loading ? "CALCULATING..." : "GENERATE 12-WEEK PLAN"}
              </button>
            </div>
          </div>
        )}

        {generatedPlan.length > 0 && (
          <div className="mb-8">
            <ProgressChart plan={generatedPlan} />
            <button 
              onClick={handleReset}
              className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase font-black text-red-500/40 hover:text-red-500 transition-colors mx-auto tracking-[0.2em]"
            >
              <Trash2 size={12} /> Reset Protocol and Start Over
            </button>
          </div>
        )}

        <WorkoutDashboard session={session} />
      </main>
    </div>
  );
}

export default App;
