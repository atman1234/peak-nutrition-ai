# Contributing to Peak Nutrition AI

Thank you for your interest in contributing to Peak Nutrition AI! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18+ 
- **Bun** (preferred package manager)
- **Git** for version control
- **Expo CLI** (`npm install -g @expo/cli`)
- **iOS Simulator** (Mac only) or **Android Emulator**

### Development Setup

1. **Fork the repository**
   ```bash
   gh repo fork VinnyVanGogh/peak-nutrition-ai
   cd peak-nutrition-ai
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Configure your .env file with required API keys
   ```

4. **Start development server**
   ```bash
   bun start
   ```

5. **Test on your preferred platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

## 🛠 Development Workflow

### Branch Naming Convention

Use descriptive branch names with the following prefixes:
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

Example: `feat/workout-tracking` or `fix/chart-rendering-ios`

### Commit Message Format

Follow conventional commit format:
```
type(scope): brief description

Optional longer description explaining the change.

- List specific changes made
- Reference any issues fixed
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(analytics): add AI-powered daily nutrition insights

fix(charts): resolve Victory Native rendering on Android
```

### Code Standards

#### TypeScript
- Use strict TypeScript configuration
- Provide explicit types for function parameters and returns
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names

#### React Native / Expo
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error boundaries
- Optimize for performance (avoid unnecessary re-renders)

#### Styling
- **Always use the theme system** - All components must support automatic light/dark mode
- Use NativeWind (Tailwind CSS) for consistent styling
- Follow the existing design system patterns
- Test on multiple screen sizes

**Required theming pattern:**
```typescript
import { useTheme } from '@/constants/theme';

function MyComponent() {
  const { colors } = useTheme();
  
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
  }), [colors]);
  
  return <View style={styles.container}>...</View>;
}
```

#### Performance Guidelines
- Use `React.memo` for expensive components
- Implement proper list optimization with FlashList
- Avoid inline functions in render methods
- Use `useMemo` and `useCallback` appropriately

## 🧪 Testing

### Manual Testing
- Test on iOS, Android, and Web platforms
- Verify light/dark mode functionality
- Test with different screen sizes and orientations
- Validate user flows end-to-end

### Code Quality
```bash
# Type checking
bunx tsc --noEmit

# Linting (if configured)
bun run lint

# Formatting (if configured)  
bun run format
```

## 📝 Pull Request Process

### Before Submitting
1. **Test thoroughly** on all target platforms
2. **Verify theme compatibility** - Test both light and dark modes
3. **Update documentation** if adding new features
4. **Follow commit message conventions**
5. **Ensure no TypeScript errors**

### Pull Request Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Tested on iOS
- [ ] Tested on Android  
- [ ] Tested on Web
- [ ] Tested light/dark modes
- [ ] No TypeScript errors

## Screenshots/GIFs
Add screenshots or GIFs demonstrating the changes.

## Additional Notes
Any additional context or considerations.
```

### Review Process
1. **Automated checks** must pass (TypeScript, formatting)
2. **Code review** by maintainers
3. **Testing verification** on multiple platforms
4. **Documentation review** if applicable

## 🎨 Design Guidelines

### UI/UX Principles
- **Mobile-first** design approach
- **Accessibility** compliance (WCAG 2.1 AA)
- **Consistent** with existing design patterns
- **Performance** optimized (60fps animations)
- **Native feel** for each platform

### Component Guidelines
- Create reusable, composable components
- Follow existing component patterns
- Include proper TypeScript definitions
- Support theming out of the box
- Handle loading and error states

## 🚦 Areas for Contribution

### High Priority
- **Workout tracking integration**
- **Advanced meal planning features**  
- **Performance optimizations**
- **Accessibility improvements**
- **Test coverage expansion**

### Medium Priority
- **Additional chart types**
- **Export functionality enhancements**
- **UI/UX improvements**
- **Documentation improvements**

### Good First Issues
- **Bug fixes**
- **Documentation updates**
- **Small feature enhancements**
- **Component styling improvements**

## 🔄 Migration Context

This project is a **React Native migration** from a React web application. When contributing:

1. **Understand the migration approach** - We preserve business logic while adapting to mobile patterns
2. **Check existing patterns** - Look at similar components for consistency
3. **Consider cross-platform compatibility** - Ensure features work on iOS, Android, and Web
4. **Maintain feature parity** - Don't remove functionality during improvements

## 📋 Architecture Overview

### Key Technologies
- **Expo React Native** ~53.0 - Cross-platform framework
- **TypeScript** - Type safety
- **Supabase** - Backend as a service
- **Victory Native XL** - Charts and data visualization
- **NativeWind** - Styling framework
- **React Query** - Server state management

### Project Structure
```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and integrations
├── types/         # TypeScript definitions
└── constants/     # Theme and configuration

app/               # Expo Router (file-based routing)
├── (app)/        # Authenticated routes
├── (auth)/       # Authentication routes
└── _layout.tsx   # Root layout
```

## ❓ Getting Help

### Communication Channels
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Pull Request Comments** - Code-specific discussions

### Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Victory Native Documentation](https://commerce.nearform.com/open-source/victory-native)

## 🎉 Recognition

Contributors will be:
- **Acknowledged** in release notes
- **Listed** in the project's contributors section
- **Credited** for significant contributions

---

**Thank you for contributing to Peak Nutrition AI!** Your efforts help create a better nutrition tracking experience for everyone. 🚀