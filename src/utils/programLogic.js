const INTENSITIES = [0.65, 0.75, 0.85, 0.90];
const REPS = ["12-15", "9-12", "6-9", "2-4"];

export const generate12WeekPlan = (userId, coreMaxes) => {
  const plan = [];
  
 const dailyStructure = [
  { 
    day: 1, name: 'Chest & Core', 
    exercises: [
      { name: 'Bench Press (Main)', core: 'benchpress', type: 'core', muscles: 'Pectorals, Triceps, Front Deltoids' },
      { name: 'Incline DB Press', type: 'accessory', muscles: 'Upper Pectorals, Front Deltoids' },
      { name: 'Cable Flyes', type: 'accessory', muscles: 'Inner Pectorals' },
      { name: 'Pushups', type: 'accessory', muscles: 'Pectorals, Core, Triceps' },
      { name: 'Hanging Leg Raises', type: 'abs', muscles: 'Lower Rectus Abdominis, Obliques' }
    ]
  },
  { 
    day: 2, name: 'Legs', 
    exercises: [
      { name: 'Squat (Main)', core: 'squat', type: 'core', muscles: 'Quadriceps, Glutes, Hamstrings, Spinal Erectors' },
      { name: 'Leg Press', type: 'accessory', muscles: 'Quadriceps, Glutes' },
      { name: 'Leg Extensions', type: 'accessory', muscles: 'Quadriceps (Isolated)' },
      { name: 'Hamstring Curls', type: 'accessory', muscles: 'Hamstrings' },
      { name: 'Calf Raises', type: 'accessory', muscles: 'Gastrocnemius, Soleus' }
    ]
  },
  { 
    day: 3, name: 'Back & Cardio', 
    exercises: [
      { name: 'Deadlift (Main)', core: 'deadlift', type: 'core', muscles: 'Posterior Chain (Glutes, Hamstrings, Back), Forearms' },
      { name: 'Lat Pulldowns', type: 'accessory', muscles: 'Latissimus Dorsi, Biceps, Teres Major' },
      { name: 'Seated Rows', type: 'accessory', muscles: 'Rhomboids, Mid-Traps, Latissimus Dorsi' },
      { name: 'Face Pulls', type: 'accessory', muscles: 'Rear Deltoids, Rotator Cuff, Upper Traps' },
      { name: 'Rowing machine', type: 'cardio', muscles: 'Full Body Aerobic, Core, Back' }
    ]
  },
  { 
    day: 4, name: 'Shoulders & Arms', 
    exercises: [
      { name: 'Overhead Press (Main)', core: 'overheadpress', type: 'core', muscles: 'Deltoids, Triceps, Upper Pectorals, Core Stability' },
      { name: 'Lateral Raises', type: 'accessory', muscles: 'Lateral (Side) Deltoids' },
      { name: 'Bicep Curls', type: 'accessory', muscles: 'Biceps Brachii, Brachialis' },
      { name: 'Tricep Extensions', type: 'accessory', muscles: 'Triceps Brachii (Long & Lateral Heads)' },
      { name: 'Plank', type: 'abs', muscles: 'Transverse Abdominis, Core Stability' }
    ]
  }
];

  for (let week = 1; week <= 12; week++) {
    const cycleIdx = (week - 1) % 4;
    const weightBump = (Math.ceil(week / 4) - 1) * 5;

    dailyStructure.forEach((session) => {
      session.exercises.forEach((ex) => {
        for (let setNum = 1; setNum <= 4; setNum++) {
          let targetWeight = 0;
          if (ex.type === 'core') {
            const baseMax = parseInt(coreMaxes[ex.core]) || 0;
            const extraBump = (ex.core === 'squat' || ex.core === 'deadlift') ? weightBump * 2 : weightBump;
            targetWeight = Math.round(((baseMax + extraBump) * INTENSITIES[cycleIdx]) / 5) * 5;
          }

          plan.push({
            user_id: userId,
            week_number: week,
            day_number: session.day,
            exercise_name: ex.name,
            set_number: setNum,
            target_reps: ex.type === 'core' ? REPS[cycleIdx] : "10-12",
            target_weight_lb: targetWeight,
            is_completed: false
          });
        }
      });
    });
  }
  return plan;
};