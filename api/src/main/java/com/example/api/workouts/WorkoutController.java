package com.example.api.workouts;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/workouts")
class WorkoutController {

    private final WorkoutRepository workouts;

    WorkoutController(WorkoutRepository workouts) {
        this.workouts = workouts;
    }

    @GetMapping
    List<Workout> findAll() {
        return this.workouts.findAll();
    }

    @GetMapping("/{id}")
    ResponseEntity<Workout> findById(@PathVariable Long id) {
        return this.workouts.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    Workout create(@RequestBody Workout workout) {
        return this.workouts.save(workout);
    }

    @PutMapping("/{id}")
    ResponseEntity<Workout> update(@PathVariable Long id, @RequestBody Workout updated) {
        return this.workouts.findById(id).map((existing) -> {
                existing.setName(updated.getName());
                existing.setDescription(updated.getDescription());
                existing.setDurationMinutes(updated.getDurationMinutes());
                existing.setDifficultyLevel(updated.getDifficultyLevel());
                return ResponseEntity.ok(workouts.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteWorkout(@PathVariable Long id) {
        if (this.workouts.existsById(id)) {
            this.workouts.deleteById(id);
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Workout not found with id: " + id);
        }
    }
}
