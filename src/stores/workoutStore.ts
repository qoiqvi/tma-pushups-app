import { create } from 'zustand';
import { WorkoutSet } from '@/components/workout/SetsList';

interface CurrentWorkout {
  id: string;
  startTime: Date;
  sets: WorkoutSet[];
}

interface WorkoutStore {
  // State
  currentWorkout: CurrentWorkout | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  startWorkout: (workoutId: string) => void;
  addSet: (reps: number) => void;
  updateSet: (setId: string, reps: number) => void;
  deleteSet: (setId: string) => void;
  finishWorkout: () => { duration: number; totalReps: number; totalSets: number };
  cancelWorkout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getTotalReps: () => number;
  getTotalSets: () => number;
  getDuration: () => number;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  // Initial state
  currentWorkout: null,
  isLoading: false,
  error: null,

  // Actions
  startWorkout: (workoutId: string) => {
    set({
      currentWorkout: {
        id: workoutId,
        startTime: new Date(),
        sets: []
      },
      error: null
    });
  },

  addSet: (reps: number) => {
    const state = get();
    if (!state.currentWorkout) return;

    const newSet: WorkoutSet = {
      id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      setNumber: state.currentWorkout.sets.length + 1,
      reps
    };

    set({
      currentWorkout: {
        ...state.currentWorkout,
        sets: [...state.currentWorkout.sets, newSet]
      }
    });
  },

  updateSet: (setId: string, reps: number) => {
    const state = get();
    if (!state.currentWorkout) return;

    set({
      currentWorkout: {
        ...state.currentWorkout,
        sets: state.currentWorkout.sets.map(set =>
          set.id === setId ? { ...set, reps } : set
        )
      }
    });
  },

  deleteSet: (setId: string) => {
    const state = get();
    if (!state.currentWorkout) return;

    const filteredSets = state.currentWorkout.sets.filter(set => set.id !== setId);
    
    // Renumber remaining sets
    const renumberedSets = filteredSets.map((set, index) => ({
      ...set,
      setNumber: index + 1
    }));

    set({
      currentWorkout: {
        ...state.currentWorkout,
        sets: renumberedSets
      }
    });
  },

  finishWorkout: () => {
    const state = get();
    if (!state.currentWorkout) {
      return { duration: 0, totalReps: 0, totalSets: 0 };
    }

    const duration = Math.floor((Date.now() - state.currentWorkout.startTime.getTime()) / 1000);
    const totalReps = state.currentWorkout.sets.reduce((sum, set) => sum + set.reps, 0);
    const totalSets = state.currentWorkout.sets.length;

    const result = { duration, totalReps, totalSets };

    // Clear the current workout
    set({
      currentWorkout: null,
      error: null
    });

    return result;
  },

  cancelWorkout: () => {
    set({
      currentWorkout: null,
      error: null
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Computed values
  getTotalReps: () => {
    const state = get();
    if (!state.currentWorkout) return 0;
    return state.currentWorkout.sets.reduce((sum, set) => sum + set.reps, 0);
  },

  getTotalSets: () => {
    const state = get();
    if (!state.currentWorkout) return 0;
    return state.currentWorkout.sets.length;
  },

  getDuration: () => {
    const state = get();
    if (!state.currentWorkout) return 0;
    return Math.floor((Date.now() - state.currentWorkout.startTime.getTime()) / 1000);
  }
}));