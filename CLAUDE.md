# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build with watch mode for development
- `npm test` - Run unit tests with Karma/Jasmine
- `npm run lint` - Run ESLint for code quality

### Capacitor (Mobile) Commands
- `npx cap build android` - Build Android app
- `npx cap open android` - Open Android project in Android Studio
- `npx cap build ios` - Build iOS app  
- `npx cap open ios` - Open iOS project in Xcode
- `npx cap sync` - Sync web assets and plugins to native platforms

## Project Architecture

### Framework Stack
- **Angular 15** with Ionic 6 for cross-platform mobile development
- **Capacitor** for native mobile functionality (replaces Cordova)
- **Firebase** integration for potential cloud features
- **ECharts** (via ngx-echarts) for data visualization and charting
- **Ionic Storage** with SQLite driver for local data persistence

### Core Application Structure

**Main Entry Points:**
- `src/main.ts` - Angular bootstrap
- `src/app/app.module.ts` - Root module with storage and Firebase configuration
- `src/app/app-routing.module.ts` - Top-level routing with user setup guard

**Tab-Based Navigation:**
- Dashboard (tab1) - Main overview and charts
- Weight Log (tab2) - Weight entry and history
- Achievements - Progress tracking
- Settings - User preferences and configuration

**Data Architecture:**
- **Models**: `src/models/` contains TypeScript interfaces for WeightLog and MacroLog
- **Services**: `src/services/` contains business logic:
  - `ionic-storage.service.ts` - Main data persistence layer using Ionic Storage with SQLite
  - `weight-log.service.ts` - Weight logging operations
  - `moving-average.service.ts` - Calculations for trend analysis
  - `unit-conversion.service.ts` - Weight unit conversions (lbs/kg)

**Component Organization:**
- **Pages**: `src/app/pages/` - Route-level components for each tab
- **Components**: `src/app/components/` - Reusable UI components:
  - Chart components (trend-chart-echarts, trend-charts)
  - Data entry (weight-entry-modal, macro-tracker)
  - Progress tracking (week-progress)
- **Shared**: `src/app/shared/` - Common utilities like intro swiper

### Data Storage Strategy
- Uses Ionic Storage with SQLite as primary driver for offline-first architecture
- Falls back to IndexedDB and LocalStorage on web platforms
- Storage keys defined in WeightLogStorage enum: 'settings', 'weightLog', 'macroLog'
- Moving averages calculated client-side for trend analysis

### Key Business Logic
- **Weight Tracking**: Supports both pounds and kilograms with automatic conversion
- **Body Composition**: Optional muscle and fat percentage tracking
- **Macro Tracking**: Precision Nutrition-style portion tracking (pnProtein, pnFat, etc.)
- **User Setup Flow**: Guard-protected onboarding with intro swiper
- **Moving Averages**: 7-day rolling averages for trend smoothing

### Testing and Code Quality
- **Unit Tests**: Jasmine/Karma setup for component and service testing
- **Linting**: ESLint with Angular-specific rules and TypeScript support
- **TypeScript**: Configured with strict mode disabled but other strict options enabled

### Mobile Deployment
- **Android**: Builds to `android/` directory, uses Gradle build system
- **iOS**: Builds to `ios/` directory, uses Xcode project
- **Web Output**: Builds to `www/` directory for web deployment or Capacitor packaging