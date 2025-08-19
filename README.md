# Calorie Tracker - React Native

A comprehensive calorie and macro tracking application built with Expo React Native, migrated from a React web application. Provides cross-platform food tracking with premium features for iOS, Android, and Web.

## 🎯 Project Overview

This project is a **React Native migration** of a sophisticated calorie tracking web application. The app provides comprehensive nutrition tracking, analytics, and premium features across all major platforms.

### Core Mission

**Enable users to achieve their health and fitness goals through intelligent calorie and macro tracking with a seamless cross-platform experience.**

## ✨ Key Features

### 🍎 Food Tracking
- **Intelligent Food Search**: Combines USDA Food Database with custom foods and user favorites
- **Smart Portion Management**: AI-powered portion suggestions based on user history
- **Real-time Nutrition Calculations**: Live macro breakdown with detailed nutrition facts
- **Meal Categorization**: Time-based meal suggestions (breakfast, lunch, dinner, snacks)
- **Barcode Scanning**: Quick food entry via product barcode recognition *(coming soon)*

### 📊 Analytics & Insights
- **Daily Dashboard**: Real-time progress tracking with personalized greeting
- **Historical Analytics**: Comprehensive nutrition trends and goal tracking
- **Weight Progress**: Body weight tracking with trend analysis
- **Macro Visualization**: Interactive charts showing protein, carbs, and fat intake
- **Goal Setting**: Customizable daily calorie and macro targets

### 🎨 User Experience
- **Automatic Theming**: Seamless light/dark mode following system preferences
- **Cross-Platform**: Native experience on iOS, Android, and Web
- **Offline Support**: Core functionality works without internet connection
- **Intuitive Interface**: Touch-optimized UI with gesture-friendly interactions

### 💎 Premium Features
- **AI Daily Reviews**: Personalized nutrition insights and recommendations
- **Advanced Analytics**: Historical trend analysis and goal optimization
- **Priority Support**: Direct access to nutrition experts
- **Unlimited Food History**: Complete meal logging with export capabilities
- **Custom Macro Goals**: Flexible nutrition target customization

## 🏗️ Architecture

### Technology Stack

**Framework & Platform**
- **Expo React Native ~53.0** - Cross-platform mobile development
- **React 19** - Latest React features with concurrent rendering
- **TypeScript 5.9** - Type safety and developer experience
- **Expo Router** - File-based navigation system

**Styling & Design**
- **NativeWind** - Tailwind CSS for React Native
- **Custom Design System** - Comprehensive color, typography, and spacing system
- **Automatic Theming** - Dynamic light/dark mode support
- **Responsive Layout** - Adaptive UI for phones, tablets, and web

**State Management**
- **React Query (TanStack Query)** - Server state management and caching
- **React Context** - Authentication and global state
- **Local State** - Component-level state with React hooks

**Backend & APIs**
- **Supabase** - Authentication, database, and edge functions
- **USDA Food API** - Comprehensive food nutrition database
- **Stripe React Native** - Mobile-optimized payment processing
- **AI Integration** - GPT-powered nutrition insights *(premium)*

**Data Visualization**
- **Victory Native** - Interactive charts and data visualization
- **React Native SVG** - Custom graphics and icons

**Development Tools**
- **Bun** - Fast package manager and runtime
- **ESLint + Prettier** - Code quality and formatting
- **TypeScript Strict Mode** - Maximum type safety
- **React Hook Form + Zod** - Form validation and management

### Project Structure

```
calorie_tracker/
├── app/                    # Expo Router routes (file-based)
│   ├── (app)/             # Authenticated app routes
│   │   ├── index.tsx      # Dashboard screen
│   │   ├── food/          # Food tracking screens
│   │   ├── profile/       # User profile management
│   │   └── analytics.tsx  # Charts and insights
│   ├── (auth)/            # Authentication routes
│   │   ├── login.tsx      # Login screen
│   │   └── signup.tsx     # Registration screen
│   └── _layout.tsx        # Root layout with providers
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   ├── food/          # Food tracking components
│   │   └── ui/            # Base UI components
│   ├── hooks/             # Custom React hooks (15+ hooks)
│   ├── lib/               # Utilities and integrations
│   ├── types/             # TypeScript definitions
│   └── constants/         # Design system and theme
└── assets/                # Static assets (icons, fonts)
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and **Bun** package manager
- **iOS**: Xcode and iOS Simulator (macOS only)
- **Android**: Android Studio and Android Emulator
- **Web**: Modern browser with JavaScript enabled

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd calorie_tracker
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Environment setup**:
   ```bash
   cp .env.example .env
   # Add your API keys to .env file
   ```

4. **Start development server**:
   ```bash
   bun start
   ```

5. **Choose your platform**:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# USDA Food API
EXPO_PUBLIC_USDA_API_KEY=your_usda_api_key

# Stripe Payments (Premium Features)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key

# AI Features (Premium)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key

# App Configuration
EXPO_PUBLIC_APP_NAME="Calorie Tracker"
```

## 🧪 Development

### Available Scripts

```bash
# Development
bun start                 # Start Expo development server
bun run ios              # Launch iOS simulator
bun run android          # Launch Android emulator
bun run web              # Launch web browser

# Code Quality
bunx tsc --noEmit        # TypeScript type checking
bun run lint             # ESLint code analysis
bun run format           # Prettier code formatting

# Utilities
bunx expo start -c       # Clear Metro cache
bunx expo install        # Install/update Expo SDK
```

### Testing

```bash
# Test on all platforms
bun start
# Then test: iOS (i), Android (a), Web (w)

# Type checking
bunx tsc --noEmit

# Lint checks
bun run lint
```

### Theme System

All components **must** implement dynamic theming:

```typescript
import { useTheme } from '../constants';

function MyComponent() {
  const { colors } = useTheme();
  
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    text: {
      color: colors.text,
    },
  }), [colors]);
  
  return <View style={styles.container}>...</View>;
}
```

## 📱 Platform Support

### iOS
- **Minimum Version**: iOS 13.4+
- **Target Devices**: iPhone, iPad
- **Features**: Native iOS UI, haptic feedback, deep linking
- **Testing**: iOS Simulator, TestFlight

### Android
- **Minimum Version**: Android 6.0 (API 23)
- **Target Devices**: Phones, tablets
- **Features**: Material Design, adaptive icons, edge-to-edge
- **Testing**: Android Emulator, Google Play Console

### Web
- **Browsers**: Chrome, Safari, Firefox, Edge (modern versions)
- **Features**: Progressive Web App, responsive design
- **Deployment**: Expo Web build, static hosting

## 🎯 Migration Status

This project is **migrated from React to React Native** using a systematic 10-phase approach:

### ✅ Completed Phases (60% Complete)

- **Phase 1**: Project Setup & Configuration
- **Phase 2**: Business Logic Migration (types, hooks, utilities)
- **Phase 3**: Platform Integration Updates (Supabase, Stripe, USDA API)
- **Phase 4**: Navigation Setup (Expo Router, auth guards)
- **Phase 5**: Core UI Components (design system, auth screens, dashboard)
- **Phase 6**: Food Tracking System (search, logging, nutrition display)

### 🔄 Upcoming Phases

- **Phase 7**: Charts Migration (Recharts → Victory Native)
- **Phase 8**: Forms & Validation Polish
- **Phase 9**: Premium Features (Stripe Payment Sheet)
- **Phase 10**: Platform Optimization & Store Submission

### Migration Highlights

- **✅ 100% Business Logic Preserved**: All original functionality maintained
- **✅ Enhanced Mobile UX**: Touch-optimized interface throughout
- **✅ Cross-Platform Compatibility**: Single codebase for iOS, Android, Web
- **✅ Performance Optimized**: Native performance with React Native
- **✅ Modern Architecture**: Latest React Native and Expo features

## 🔮 Roadmap

### Near Term (Next 4 weeks)
- [ ] Complete charts migration to Victory Native
- [ ] Implement Stripe Payment Sheet for mobile payments
- [ ] Add barcode scanning for quick food entry
- [ ] Optimize performance for large food databases

### Medium Term (2-3 months)
- [ ] AI-powered meal planning and suggestions
- [ ] Social features (meal sharing, challenges)
- [ ] Offline-first architecture with sync
- [ ] Apple Health / Google Fit integration

### Long Term (6+ months)
- [ ] Apple Watch and Android Wear apps
- [ ] Advanced analytics dashboard
- [ ] Nutritionist consultation platform
- [ ] Recipe import and meal planning

## 🤝 Contributing

This is a private project, but the architecture and patterns can serve as a reference for React Native migrations.

### Key Patterns

1. **Theme System**: Dynamic light/dark mode with `useTheme` hook
2. **Component Architecture**: Reusable UI library with consistent APIs
3. **Data Management**: React Query for server state, Context for auth
4. **Navigation**: File-based routing with Expo Router
5. **Forms**: React Hook Form + Zod validation
6. **Platform Adaptation**: Unified codebase with platform-specific optimizations

## 📄 License

Private project - All rights reserved.

## 🙏 Acknowledgments

- **Expo Team** - Outstanding React Native development platform
- **Supabase** - Excellent backend-as-a-service
- **USDA** - Comprehensive food nutrition database
- **React Native Community** - Incredible ecosystem and support

---

**Built with ❤️ using React Native and Expo**

*A comprehensive calorie tracking solution for the modern world.*