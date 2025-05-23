package com.example.api.workouts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
interface WorkoutRepository extends JpaRepository<Workout, Long> {
}
