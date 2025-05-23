package com.example.api.workouts;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
class DataInitializer implements CommandLineRunner {

    private final WorkoutRepository workouts;

    DataInitializer(WorkoutRepository workouts) {
        this.workouts = workouts;
    }

    @Override
    public void run(String... args) throws Exception {
        if (this.workouts.count() == 0L) { // Only seed if DB is empty
            List<Workout> workouts = Arrays.asList(
                new Workout("Morning Yoga Flow", "Gentle flow to start the day.", 30, "Beginner"),
                new Workout("HIIT Cardio Blast", "High-intensity interval training.", 20, "Intermediate"),
                new Workout("Strength Training - Full Body", "Compound movements for overall strength.", 60, "Advanced"),
                new Workout("Carved Rock Core Sculpt", "Intense core workout.", 25, "Intermediate"),
                new Workout("Evening Stretch & Relax", "Cooldown and flexibility.", 15, "Beginner")
            );
            this.workouts.saveAll(workouts);
            System.out.println("Database seeded with " + workouts.size() + " Carved Rock Fitness workouts.");
        }
    }
}
