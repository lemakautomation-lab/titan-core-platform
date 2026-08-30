import "dotenv/config";

import prisma from "./src/infrastructure/database/prisma.client";

const tenantId = "397b7a53-7a09-4a9a-b07c-3182f61bfcfd";

const exercises = [
    {
        name: "Back Squat",
        slug: "back-squat",
        description: "Barbell squat performed with the bar positioned across the upper back.",
        movement: "Squat",
        muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"],
        equipment: ["Barbell", "Rack"],
        trainingObjective: "Strength",
        difficulty: "INTERMEDIATE",
        trainingPhase: "Strength",
    },
    {
        name: "Bench Press",
        slug: "bench-press",
        description: "Barbell horizontal pressing exercise performed from a bench.",
        movement: "Push",
        muscleGroups: ["Chest", "Triceps", "Shoulders"],
        equipment: ["Barbell", "Bench"],
        trainingObjective: "Strength",
        difficulty: "INTERMEDIATE",
        trainingPhase: "Strength",
    },
    {
        name: "Deadlift",
        slug: "deadlift",
        description: "Compound hip-hinge movement lifting a barbell from the floor.",
        movement: "Hinge",
        muscleGroups: ["Hamstrings", "Glutes", "Back"],
        equipment: ["Barbell"],
        trainingObjective: "Strength",
        difficulty: "INTERMEDIATE",
        trainingPhase: "Strength",
    },
    {
        name: "Pull-Up",
        slug: "pull-up",
        description: "Vertical pulling exercise performed by raising the body toward a fixed bar.",
        movement: "Pull",
        muscleGroups: ["Latissimus Dorsi", "Biceps", "Upper Back"],
        equipment: ["Pull-Up Bar"],
        trainingObjective: "Strength",
        difficulty: "INTERMEDIATE",
        trainingPhase: "Strength",
    },
    {
        name: "Walking Lunge",
        slug: "walking-lunge",
        description: "Single-leg locomotion exercise performed with alternating forward lunges.",
        movement: "Lunge",
        muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"],
        equipment: [],
        trainingObjective: "Strength",
        difficulty: "BEGINNER",
        trainingPhase: "General Preparation",
    },
    {
        name: "Plank",
        slug: "plank",
        description: "Isometric trunk stability exercise performed while maintaining a rigid body position.",
        movement: "Core",
        muscleGroups: ["Abdominals", "Core", "Shoulders"],
        equipment: [],
        trainingObjective: "Core Stability",
        difficulty: "BEGINNER",
        trainingPhase: "General Preparation",
    },
];

async function main() {
    for (const exercise of exercises) {
        await prisma.exercise.upsert({
            where: {
                tenantId_slug: {
                    tenantId,
                    slug: exercise.slug,
                },
            },
            update: {
                name: exercise.name,
                description: exercise.description,
                movement: exercise.movement,
                muscleGroups: exercise.muscleGroups,
                equipment: exercise.equipment,
                trainingObjective: exercise.trainingObjective,
                difficulty: exercise.difficulty,
                trainingPhase: exercise.trainingPhase,
                status: "ACTIVE",
            },
            create: {
                tenantId,
                ...exercise,
                status: "ACTIVE",
            },
        });
    }

    console.log(
        `Exercise seed complete: ${exercises.length} exercises for tenant ${tenantId}.`,
    );
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
