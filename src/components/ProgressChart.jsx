import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ProgressChart({ plan }) {
  // We only want to chart the "Main" lifts to keep the graph clean
  const mainLifts = plan.filter(ex => ex.exercise_name.includes('(Main)'));
  
  // Format data for the chart: { week: 1, 'Bench Press': 135, 'Squat': 225 ... }
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const week = i + 1;
    const weekData = { week: `W${week}` };
    
    mainLifts.filter(ex => ex.week_number === week).forEach(ex => {
      weekData[ex.exercise_name.replace(' (Main)', '')] = ex.target_weight_lb;
    });
    
    return weekData;
  });

  return (
    <div className="glass-card p-6 mt-8 h-[350px] w-full">
      <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-4">Projected Growth</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="week" 
            stroke="#71717a" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            unit="lb"
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
          <Line type="monotone" dataKey="Bench Press" stroke="#10b981" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="Squat" stroke="#3b82f6" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="Deadlift" stroke="#f59e0b" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="Overhead Press" stroke="#ef4444" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}