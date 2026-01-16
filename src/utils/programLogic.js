const INTENSITIES = [0.65, 0.75, 0.85, 0.90];
const REPS = ["12-15", "9-12", "6-9", "2-4"];

export const generate12WeekPlan = (userId, coreMaxes) => {
  const plan = [];

  const dailyStructure = [
    { day: 1, name: 'Chest & Core', focus: 'Chest & Core', categories: 'Chest', exercises: [
      { name: 'Bench Press (Main)', core: 'benchpress', type: 'core', muscles: 'Pectorals, Triceps, Front Deltoids', category: 'Chest' },
      { name: 'Incline DB Press', type: 'accessory', muscles: 'Upper Pectorals, Front Deltoids', category: 'Chest' },
      { name: 'Pushups', type: 'accessory', muscles: 'Pectorals, Core, Triceps', category: 'Chest' },
      { name: 'Hanging Leg Raises', type: 'abs', muscles: 'Lower Rectus Abdominis, Obliques', category: 'Core' }
    ]},
    { day: 2, name: 'Legs', focus: 'Legs', categories: 'Legs', exercises: [
      { name: 'Squat (Main)', core: 'squat', type: 'core', muscles: 'Quadriceps, Glutes, Hamstrings', category: 'Legs' },
      { name: 'Leg Press', type: 'accessory', muscles: 'Quadriceps, Glutes', category: 'Legs' },
      { name: 'Calf Raises', type: 'accessory', muscles: 'Gastrocnemius', category: 'Legs' }
    ]},
    { day: 3, name: 'Back & Cardio', focus: 'Back & Cardio', categories: 'Back', exercises: [
      { name: 'Deadlift (Main)', core: 'deadlift', type: 'core', muscles: 'Posterior Chain, Back', category: 'Back' },
      { name: 'Lat Pulldowns', type: 'accessory', muscles: 'Lats, Biceps', category: 'Back' },
      { name: 'Seated Rows', type: 'accessory', muscles: 'Mid-Back', category: 'Back' }
    ]},
    { day: 4, name: 'Shoulders & Arms', focus: 'Shoulders & Arms', categories: 'Shoulders', exercises: [
      { name: 'Overhead Press (Main)', core: 'overheadpress', type: 'core', muscles: 'Deltoids, Triceps', category: 'Shoulders' },
      { name: 'Lateral Raises', type: 'accessory', muscles: 'Side Delts', category: 'Shoulders' },
      { name: 'Bicep Curls', type: 'accessory', muscles: 'Biceps', category: 'Arms' },
      { name: 'Tricep Extensions', type: 'accessory', muscles: 'Triceps', category: 'Arms' }
    ]}
  ];

  for (let week = 1; week <= 12; week++) {
    const cycleIdx = (week - 1) % 4;
    const weightBump = (Math.ceil(week / 4) - 1) * 5;

    dailyStructure.forEach((session) => {
      // Create the array of exercises for this specific day
      const dailyExercises = session.exercises.map((ex) => {
        let targetWeight = 0;
        if (ex.type === 'core') {
          const baseMax = parseInt(coreMaxes[ex.core]) || 0;
          const extraBump = (ex.core === 'squat' || ex.core === 'deadlift') ? weightBump * 2 : weightBump;
          targetWeight = Math.round(((baseMax + extraBump) * INTENSITIES[cycleIdx]) / 5) * 5;
        } else {
          targetWeight = "Adjustable"; // Accessory movements use feel/RPE
        }

        return {
          name: ex.name,
          weight: targetWeight,
          reps: ex.type === 'core' ? REPS[cycleIdx] : "10-12",
          sets: 4, // Default sets
          muscles: ex.muscles,
          category: ex.category // Used for the images!
        };
      });

      // Push ONE object per day into the plan
      plan.push({
        user_id: userId,
        week: week, // Matches your DB column name
        day_number: session.day,
        focus: session.focus,
        exercises: JSON.stringify(dailyExercises) // Converts the array to a JSON string for the DB
      });
    });
  }
  return plan;
};