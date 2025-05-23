package com.example.api.workouts;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.util.Objects;

@Entity
public class Workout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private int durationMinutes;
    private String difficultyLevel;

    public Workout() {
    }

    public Workout(String name, String description, int durationMinutes, String difficultyLevel) {
        this.name = name;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.difficultyLevel = difficultyLevel;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getDifficultyLevel() {
        return difficultyLevel;
    }

    public void setDifficultyLevel(String difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Workout workout = (Workout) o;
        return durationMinutes == workout.durationMinutes &&
               Objects.equals(id, workout.id) &&
               Objects.equals(name, workout.name) &&
               Objects.equals(description, workout.description) &&
               Objects.equals(difficultyLevel, workout.difficultyLevel);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, description, durationMinutes, difficultyLevel);
    }

    @Override
    public String toString() {
        return "Workout{" +
               "id=" + id +
               ", name='" + name + '\'' +
               ", description='" + description + '\'' +
               ", durationMinutes=" + durationMinutes +
               ", difficultyLevel='" + difficultyLevel + '\'' +
               '}';
    }
}
