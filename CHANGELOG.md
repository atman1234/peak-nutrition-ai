# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.12] - 2025-08-22 (Alpha)

### Fixed | 2025-08-22 08:43:07

- fixed themeing of charts on web version

### Files Changed (4) | 2025-08-22 08:43:07

- Modified: src/components/charts/web/CalorieChart.tsx
- Modified: src/components/charts/web/WeightChart.tsx
- Untracked: .git_simplifier_backups/backup_20250822_084307.json
- Untracked: src/constants/theme.web.ts

## [0.1.0-alpha.11] - 2025-08-21 (Alpha)

### Added | 2025-08-21 20:23:26

- fixed web bundling issues - added charts and analytics for web and user profile page

## [0.1.0-alpha.10] - 2025-08-21 (Alpha)

### Fixed | 2025-08-21 13:05:49

- fixed web bundling issues

## [0.1.0-alpha.9] - 2025-08-21 (Alpha)

### Added | 2025-08-21 12:42:33

- added profile and profile edit pages

### Files Changed (4) | 2025-08-21 12:42:33

- Modified: FOOD_IMPLEMENTATION_PLAN.md
- Modified: app/(app)/profile/index.tsx
- Untracked: .git_simplifier_backups/backup_20250821_124233.json
- Untracked: src/components/ui/UpgradeModal.tsx

## [0.1.0-alpha.8] - 2025-08-21 (Alpha)

### Fixed | 2025-08-21 12:29:53

- fixed food search in mobile, got usda search working in both

### Files Changed (5) | 2025-08-21 12:29:53

- Modified: FOOD_IMPLEMENTATION_PLAN.md
- Modified: src/components/food/FoodAutocomplete.tsx
- Modified: src/components/food/QuickFoodAdd.tsx
- Modified: src/components/food/USDASearchModal.tsx
- Untracked: .git_simplifier_backups/backup_20250821_122953.json

## [0.1.0-alpha.7] - 2025-08-21 (Alpha)

### Fixed | 2025-08-21 12:12:46

- fixed analytics page by fixing broken npm packages

### Files Changed (9) | 2025-08-21 12:12:46

- Modified: FOOD_IMPLEMENTATION_PLAN.md
- Modified: bun.lock
- Modified: package.json
- Modified: src/components/food/FoodLogEntry.tsx
- Modified: src/components/food/MealSection.tsx
- Modified: src/components/food/QuickFoodAdd.tsx
- Modified: src/components/food/TodaysFoodLog.tsx
- Untracked: .git_simplifier_backups/backup_20250821_121246.json
- Untracked: src/components/food/USDASearchModal.tsx

## [0.1.0-alpha.6] - 2025-08-21 (Alpha)

### Added | 2025-08-21 12:04:12

- working on improving the food section to be on par with the app we're migrating from, added all options for quick/advanced food entries - fixed login bug where it doesnt redirect, added favorites to food tab/section, cut down mobile to 2 favorites/page, got macros working again

### Files Changed (3) | 2025-08-21 12:04:12

- Modified: app/(app)/food/index.tsx
- Modified: src/components/food/FavoritesCarousel.tsx
- Untracked: .git_simplifier_backups/backup_20250821_120412.json

## [0.1.0-alpha.5] - 2025-08-21 (Alpha)

### Added | 2025-08-21 12:00:08

- working on improving the food section to be on par with the app we're migrating from, added all options for quick/advanced food entries - fixed login bug where it doesnt redirect, added favorites to food tab/section, cut down mobile to 2 favorites/page, got macros working again

### Files Changed (3) | 2025-08-21 12:00:08

- Modified: src/components/food/FavoritesCarousel.tsx
- Modified: src/components/food/QuickFoodAdd.tsx
- Untracked: .git_simplifier_backups/backup_20250821_120007.json

## [0.1.0-alpha.4] - 2025-08-21 (Alpha)

### Added | 2025-08-21 11:50:31

- working on improving the food section to be on par with the app we're migrating from, added all options for quick/advanced food entries - fixed login bug where it doesnt redirect, added favorites to food tab/section

### Files Changed (5) | 2025-08-21 11:50:31

- Modified: .gitignore
- Modified: FOOD_IMPLEMENTATION_PLAN.md
- Modified: app/(app)/food/index.tsx
- Modified: src/components/food/FavoritesCarousel.tsx
- Untracked: .git_simplifier_backups/backup_20250821_115031.json

## [0.1.0-alpha.3] - 2025-08-21 (Alpha)

### Added | 2025-08-21 11:46:16

- working on improving the food section to be on par with the app we're migrating from, added all options for quick/advanced food entries - fixed login bug where it doesnt redirect, added favorites to food tab/section

## [0.1.0-alpha.2] - 2025-08-21 (Alpha)

### Added | 2025-08-21 11:11:46

- working on improving the food section to be on par with the app we're migrating from, added all options for quick/advanced food entries

### Files Changed (6) | 2025-08-21 11:11:46

- Modified: app/(app)/food/index.tsx
- Modified: src/components/food/FoodAutocomplete.tsx
- Modified: src/components/food/MealTypePicker.tsx
- Modified: src/components/food/QuickFoodAdd.tsx
- Untracked: .git_simplifier_backups/backup_20250821_111146.json
- Untracked: FOOD_IMPLEMENTATION_PLAN.md

## [0.1.0-alpha.1] - 2025-08-21 (Alpha)

### Added | 2025-08-21 10:26:51

- working on improving the food section to be on par with the app we're migrating from, missing tons of features

### Files Changed (9) | 2025-08-21 10:26:51

- Modified: src/components/charts/MacroChart.tsx
- Modified: src/components/food/FoodLogEntry.tsx
- Modified: src/components/food/MealSection.tsx
- Modified: src/components/food/QuickFoodAdd.tsx
- Modified: src/components/food/TodaysFoodLog.tsx
- Modified: src/components/ui/Button.tsx
- Modified: src/components/ui/Card.tsx
- Modified: src/components/ui/StatCard.tsx
- Untracked: .git_simplifier_backups/backup_20250821_102651.json
