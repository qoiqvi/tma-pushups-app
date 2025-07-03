# Frontend Implementation Plan for Pushups Tracker Mini App

## Overview
This document provides a comprehensive step-by-step guide for implementing the frontend (UI) part of the Pushups Tracker Telegram Mini App. The backend API is already implemented, and this plan focuses on creating all necessary UI components, screens, and integrations.

## Prerequisites Check
- ✅ Next.js 15 configured
- ✅ TypeScript setup
- ✅ Tailwind CSS with pink theme
- ✅ shadcn/ui components installed
- ✅ React Query hooks prepared (useWorkouts, useStats)
- ✅ Supabase client configured
- ✅ Telegram SDK integrated

## Implementation Order

### Phase 1: Core Components & Navigation (Day 1)

#### 1.1 Navigation Component
Create `src/components/layout/Navigation.tsx`:
```typescript
// Bottom navigation with 4 tabs: Home, Workout, Stats, Settings
// Use lucide-react icons: Home, Activity, BarChart3, Settings
// Active tab should have pink color (text-primary)
// Navigate using Next.js Link component
```

#### 1.2 Layout Component
Create `src/components/layout/Layout.tsx`:
```typescript
// Wrapper component with Navigation at bottom
// Handle safe area insets for mobile devices
// Include Page component from existing code
```

#### 1.3 Loading States
Create `src/components/shared/LoadingSpinner.tsx`:
```typescript
// Pink animated spinner using Tailwind animation
// Sizes: sm, md, lg
```

Create `src/components/shared/SkeletonCard.tsx`:
```typescript
// Skeleton loader for cards with pulse animation
// Match the height of actual content cards
```

### Phase 2: Home Screen Enhancement (Day 1)

#### 2.1 Welcome Card Component
Create `src/components/home/WelcomeCard.tsx`:
```typescript
// Display user's first_name from Telegram
// Show motivational message based on time of day
// Include current streak if > 0
```

#### 2.2 Quick Stats Component
Create `src/components/home/QuickStats.tsx`:
```typescript
// Use useOverallStats hook
// Display: Today's reps, Week total, Current streak
// Loading state with SkeletonCard
// Error state with retry button
```

#### 2.3 Last Workout Card
Create `src/components/home/LastWorkoutCard.tsx`:
```typescript
// Use useWorkouts hook with limit=1
// Show: Date, Total reps, Duration
// "No workouts yet" state
// Link to full workout history
```

#### 2.4 Update Home Page
Modify `src/app/page.tsx`:
```typescript
// Replace static content with real components
// Add navigation to /workout when clicking "Start Workout"
// Handle loading and error states properly
```

### Phase 3: Workout Screen (Day 2)

#### 3.1 Timer Component
Create `src/components/workout/Timer.tsx`:
```typescript
// Display elapsed time in MM:SS format
// Start automatically when component mounts
// Return duration in seconds via callback
// Large, centered display with pink gradient text
```

#### 3.2 Set Input Component
Create `src/components/workout/SetInput.tsx`:
```typescript
// Number input for reps (min=1, max=999)
// Large touch-friendly buttons for +/- adjustment
// "Add Set" button (pink gradient background)
// Haptic feedback on button press (Telegram.WebApp.HapticFeedback)
```

#### 3.3 Sets List Component
Create `src/components/workout/SetsList.tsx`:
```typescript
// Display list of completed sets
// Each item shows: Set #, Reps count, Delete button
// Edit functionality on tap
// Total reps counter at bottom
```

#### 3.4 Workout Controls
Create `src/components/workout/WorkoutControls.tsx`:
```typescript
// "Finish Workout" button (primary color)
// "Cancel Workout" button (text only)
// Confirmation dialog for cancel
```

#### 3.5 Workout Page
Create `src/app/workout/page.tsx`:
```typescript
// Check for active workout using useActiveWorkout
// Create new workout if none active
// Manage workout state with Zustand
// Handle set additions/deletions
// Save workout on finish with duration and totals
```

#### 3.6 Workout Store
Create `src/stores/workoutStore.ts`:
```typescript
interface WorkoutStore {
  currentWorkout: {
    id: string
    startTime: Date
    sets: Array<{ id: string; reps: number }>
  } | null
  
  startWorkout: (workoutId: string) => void
  addSet: (reps: number) => void
  updateSet: (setId: string, reps: number) => void
  deleteSet: (setId: string) => void
  finishWorkout: () => { duration: number; totalReps: number; totalSets: number }
  cancelWorkout: () => void
}
```

### Phase 4: Statistics Screen (Day 3)

#### 4.1 Period Selector Component
Create `src/components/stats/PeriodSelector.tsx`:
```typescript
// Segmented control: Week | Month | All Time
// Pink background for active segment
// Update period in parent component
```

#### 4.2 Stats Cards Component
Create `src/components/stats/StatsCards.tsx`:
```typescript
// Grid of 4 cards showing key metrics
// Total Workouts, Total Reps, Average Reps, Personal Best
// Use usePeriodStats hook
// Number animations on value change
```

#### 4.3 Progress Chart Component
Create `src/components/stats/ProgressChart.tsx`:
```typescript
// Use Recharts library
// Line chart for reps over time
// Bar chart option for sets
// Responsive container
// Pink gradient area fill
// Custom tooltip with workout details
```

#### 4.4 Personal Records Component
Create `src/components/stats/PersonalRecords.tsx`:
```typescript
// List of achievements: Most reps, Longest workout, Best streak
// Trophy icons with pink accent
// Date of achievement
```

#### 4.5 Stats Page
Create `src/app/stats/page.tsx`:
```typescript
// Combine all stats components
// Handle period switching
// Loading states for each section
// Empty state if no workouts
```

### Phase 5: Settings Screen (Day 3)

#### 5.1 Profile Section Component
Create `src/components/settings/ProfileSection.tsx`:
```typescript
// Display Telegram user info
// Username, First/Last name
// Premium badge if applicable
```

#### 5.2 Reminder Settings Component
Create `src/components/settings/ReminderSettings.tsx`:
```typescript
// Toggle for enabling reminders
// Day selector (Mon-Sun checkboxes)
// Time picker for reminder time
// Timezone display
// Save button
```

#### 5.3 Theme Toggle Component
Create `src/components/settings/ThemeToggle.tsx`:
```typescript
// Light/Dark mode switch
// Use Telegram.WebApp.colorScheme
// Update CSS variables accordingly
```

#### 5.4 About Section Component
Create `src/components/settings/AboutSection.tsx`:
```typescript
// App version
// Links: Support, Privacy Policy
// Developer credits
```

#### 5.5 Settings Page
Create `src/app/settings/page.tsx`:
```typescript
// Combine all settings components
// Handle saving preferences
// Success toast on save
```

### Phase 6: Workout Result Screen (Day 4)

#### 6.1 Workout Summary Component
Create `src/components/workout/WorkoutSummary.tsx`:
```typescript
// Display completed workout stats
// Duration, Total reps, Sets breakdown
// Comparison with previous workout
// Motivational message based on performance
```

#### 6.2 Photo Upload Component
Create `src/components/workout/PhotoUpload.tsx`:
```typescript
// Camera/Gallery button
// Preview uploaded image
// Loading state during upload
// Error handling
```

#### 6.3 Share Card Component
Create `src/components/workout/ShareCard.tsx`:
```typescript
// Preview of shareable image with stats overlay
// "Share to Telegram" button
// Download option
```

#### 6.4 Workout Result Page
Create `src/app/workout/result/[id]/page.tsx`:
```typescript
// Load workout data by ID
// Handle photo upload to /api/photos/upload
// Show processing status
// Enable sharing when ready
```

### Phase 7: Enhancements & Polish (Day 4)

#### 7.1 Animations & Transitions
- Page transitions using Framer Motion
- Number count-up animations
- Smooth scroll behaviors
- Pull-to-refresh on main screens

#### 7.2 Error Handling
Create `src/components/shared/ErrorState.tsx`:
```typescript
// Friendly error messages
// Retry button
// Contact support option
```

#### 7.3 Empty States
Create `src/components/shared/EmptyState.tsx`:
```typescript
// Illustrations for no data scenarios
// Call-to-action buttons
// Motivational messages
```

#### 7.4 Toast Notifications
Implement toast system using React Hot Toast:
- Success: Green with checkmark
- Error: Red with X
- Info: Blue with info icon

#### 7.5 Haptic Feedback
Add haptic feedback for:
- Button presses
- Set completion
- Workout finish
- Navigation changes

### Phase 8: Testing & Optimization (Day 5)

#### 8.1 Component Testing Checklist
- [ ] All forms validate input correctly
- [ ] Navigation works on all screens
- [ ] Data loads and updates properly
- [ ] Error states display correctly
- [ ] Loading states show appropriately

#### 8.2 Performance Optimizations
- Implement React.memo for list items
- Use dynamic imports for heavy components
- Optimize images with next/image
- Implement virtual scrolling for long lists
- Add service worker for offline support

#### 8.3 Accessibility
- ARIA labels on all buttons
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support

#### 8.4 Cross-Platform Testing
- iOS Safari (Telegram)
- Android Chrome (Telegram)
- Desktop Telegram
- Different screen sizes

## Component Structure Summary

```
src/
├── components/
│   ├── layout/
│   │   ├── Navigation.tsx
│   │   └── Layout.tsx
│   ├── home/
│   │   ├── WelcomeCard.tsx
│   │   ├── QuickStats.tsx
│   │   └── LastWorkoutCard.tsx
│   ├── workout/
│   │   ├── Timer.tsx
│   │   ├── SetInput.tsx
│   │   ├── SetsList.tsx
│   │   ├── WorkoutControls.tsx
│   │   ├── WorkoutSummary.tsx
│   │   ├── PhotoUpload.tsx
│   │   └── ShareCard.tsx
│   ├── stats/
│   │   ├── PeriodSelector.tsx
│   │   ├── StatsCards.tsx
│   │   ├── ProgressChart.tsx
│   │   └── PersonalRecords.tsx
│   ├── settings/
│   │   ├── ProfileSection.tsx
│   │   ├── ReminderSettings.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── AboutSection.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── SkeletonCard.tsx
│       ├── ErrorState.tsx
│       └── EmptyState.tsx
├── app/
│   ├── page.tsx (update existing)
│   ├── workout/
│   │   ├── page.tsx
│   │   └── result/[id]/
│   │       └── page.tsx
│   ├── stats/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
└── stores/
    └── workoutStore.ts
```

## Integration Points

### API Endpoints Used
- GET/POST `/api/workouts` - Workout CRUD
- GET/PUT `/api/workouts/[id]` - Single workout
- POST `/api/workouts/[id]/sets` - Add sets
- GET `/api/stats` - Statistics data
- GET/PUT `/api/reminders` - Reminder settings
- POST `/api/photos/upload` - Photo upload
- GET `/api/user/me` - User profile

### Telegram SDK Features
- `Telegram.WebApp.initData` - Authentication
- `Telegram.WebApp.HapticFeedback` - Haptic feedback
- `Telegram.WebApp.MainButton` - Primary actions
- `Telegram.WebApp.BackButton` - Navigation
- `Telegram.WebApp.colorScheme` - Theme detection
- `Telegram.WebApp.shareUrl()` - Sharing

### External Libraries
- `recharts` - Charts and graphs
- `date-fns` - Date formatting
- `react-hot-toast` - Toast notifications
- `framer-motion` - Animations (optional)
- `react-hook-form` - Form management

## Success Criteria
- [ ] All screens are functional and connected to API
- [ ] Data persists correctly in Supabase
- [ ] UI is responsive and follows pink theme
- [ ] Telegram SDK features work properly
- [ ] No console errors in production
- [ ] Loading states prevent UI jank
- [ ] Error handling provides clear feedback
- [ ] App works offline with cached data

## Notes for AI Implementation
1. Always check if hooks already exist before creating new ones
2. Use existing UI components from shadcn/ui when possible
3. Follow the established pink color scheme in globals.css
4. Ensure all API calls include Telegram init data header
5. Test each component in isolation before integration
6. Handle loading and error states in every data fetch
7. Use TypeScript strictly - no 'any' types
8. Keep components small and focused on single responsibility
9. Comment complex logic for future maintenance
10. Optimize for mobile-first experience