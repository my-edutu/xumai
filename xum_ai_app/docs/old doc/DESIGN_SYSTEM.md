# XUM AI Design System

> **Comprehensive design system for consistent styling across the XUM AI application**

## Table of Contents
- [Overview](#overview)
- [Design Tokens](#design-tokens)
- [Typography](#typography)
- [Colors \& Theming](#colors--theming)
- [Component Primitives](#component-primitives)
- [Utility Functions](#utility-functions)
- [Usage Examples](#usage-examples)

---

## Overview

The XUM AI Design System provides a comprehensive set of reusable components, design tokens, and utilities to ensure visual consistency and developer efficiency across the application.

### Key Benefits
- ✅ **Consistency**: Unified visual language across all screens
- ✅ **Type-Safe**: Full TypeScript support with autocomplete
- ✅ **Theme-Aware**: Automatic light/dark mode support
- ✅ **Accessible**: WCAG-compliant touch targets and contrast ratios
- ✅ **Developer-Friendly**: Easy to use with clear APIs

---

## Design Tokens

Design tokens are the foundation of our design system. They define primitive values for spacing, colors, typography, and more.

### Importing Tokens

```typescript
import { 
  SPACING, 
  TYPOGRAPHY, 
  LAYOUT, 
  SHADOWS, 
  PALETTE,
  TEXT_STYLES,
  ANIMATION,
  OPACITY,
  Z_INDEX
} from '../constants/designTokens';
```

### Spacing (8-point grid)

```typescript
SPACING.xs    // 4px
SPACING.sm    // 8px
SPACING.md    // 16px
SPACING.lg    // 24px
SPACING.xl    // 32px
SPACING.xxl   // 48px
SPACING.xxxl  // 64px
```

### Layout Constants

```typescript
LAYOUT.buttonHeight     // 56px - Standard button height
LAYOUT.inputHeight      // 56px - Standard input height
LAYOUT.touchTarget      // 44px - Minimum touch target
LAYOUT.radius.sm        // 8px
LAYOUT.radius.md        // 12px
LAYOUT.radius.lg        // 16px
LAYOUT.radius.pill      // 999px - Fully rounded
```

### Animations

```typescript
ANIMATION.duration.fast     // 150ms
ANIMATION.duration.normal   // 250ms
ANIMATION.duration.slow     // 350ms
```

### Opacity Scale

```typescript
OPACITY.subtle      // 0.1
OPACITY.light       // 0.2
OPACITY.medium      // 0.4
OPACITY.strong      // 0.6
```

### Z-Index Layering

```typescript
Z_INDEX.dropdown        // 1000
Z_INDEX.modal           // 1050
Z_INDEX.notification    // 1080
```

---

## Typography

Pre-defined text styles ensure consistency across the app.

### Text Style Usage

```typescript
import { TEXT_STYLES } from '../constants/designTokens';
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <>
      <Text style={[TEXT_STYLES.h1, { color: theme.text }]}>
        Hero Heading
      </Text>
      <Text style={[TEXT_STYLES.body, { color: theme.textSecondary }]}>
        Body text goes here
      </Text>
      <Text style={[TEXT_STYLES.caption, { color: theme.textTertiary }]}>
        Caption text
      </Text>
    </>
  );
}
```

### Available Text Styles

| Style | Size | Weight | Use Case |
|-------|------|--------|----------|
| `h1` | 48px | Bold | Page titles |
| `h2` | 32px | Bold | Section headers |
| `h3` | 24px | Bold | Subsection headers |
| `h4` | 20px | Semibold | Card titles |
| `h5` | 16px | Semibold | Small headings |
| `h6` | 14px | Semibold | Labels |
| `bodyLarge` | 16px | Regular | Large body text |
| `body` | 14px | Regular | Standard body text |
| `bodySmall` | 12px | Regular | Small body text |
| `label` | 14px | Medium | Form labels |
| `caption` | 10px | Regular | Captions |
| `captionBold` | 10px | Bold | Uppercase labels |
| `button` | 14px | Bold | Button text |
| `code` | 12px | Regular | Monospace code |

---

## Colors & Theming

The app uses a dynamic theming system with multiple color presets.

### Using Theme Colors

```typescript
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>Hello</Text>
      <View style={{ borderColor: theme.border }} />
    </View>
  );
}
```

### Available Theme Colors

- `theme.primary` - Brand primary color
- `theme.background` - Page background
- `theme.surface` - Card/component background
- `theme.surfaceHighlight` - Slightly lighter surface
- `theme.border` - Border color
- `theme.text` - Primary text
- `theme.textSecondary` - Secondary text
- `theme.textTertiary` - Tertiary text
- `theme.success` - Success states
- `theme.error` - Error states
- `theme.warning` - Warning states

---

## Component Primitives

Reusable UI components built with the design system.

### Button

```typescript
import { Button } from '../components/primitives';

// Primary button
<Button onPress={handlePress}>Save Changes</Button>

// With variants
<Button variant="secondary">Cancel</Button>
<Button variant="outline">Learn More</Button>
<Button variant="ghost">Close</Button>
<Button variant="danger">Delete</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With icons
<Button leftIcon="check">Confirm</Button>
<Button rightIcon="arrow-forward">Next</Button>

// States
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean
- `leftIcon` / `rightIcon`: MaterialIcons name
- `fullWidth`: boolean

---

### Card

```typescript
import { Card } from '../components/primitives';

// Basic card
<Card>
  <Text>Card content</Text>
</Card>

// With title and subtitle
<Card title="Welcome" subtitle="Get started with XUM AI">
  <Text>Content here</Text>
</Card>

// Pressable card
<Card onPress={handlePress}>
  <Text>Tap me!</Text>
</Card>

// Glass morphism effect
<Card glass>
  <Text>Glass card</Text>
</Card>

// With footer
<Card
  title="Task"
  footer={<Button>Complete</Button>}
>
  <Text>Task details</Text>
</Card>
```

**Props:**
- `title`: string
- `subtitle`: string
- `footer`: React.ReactNode
- `onPress`: () => void
- `glass`: boolean
- `padding`: number

---

### Input

```typescript
import { Input } from '../components/primitives';

// Basic input
<Input placeholder="Enter text" />

// With label
<Input label="Email" placeholder="you@example.com" />

// With error
<Input 
  label="Password" 
  error="Password is required" 
  secureTextEntry 
/>

// With icons
<Input leftIcon="search" placeholder="Search..." />
<Input rightIcon="visibility" placeholder="Password" />

// Multiline
<Input 
  label="Description" 
  multiline 
  numberOfLines={4} 
/>
```

**Props:**
- `label`: string
- `error`: string
- `leftIcon` / `rightIcon`: MaterialIcons name
- All standard `TextInputProps`

---

### Badge

```typescript
import { Badge } from '../components/primitives';

// Basic badge
<Badge>New</Badge>

// With variants
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="info">Beta</Badge>

// With sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>

// With icon
<Badge icon="check" variant="success">Verified</Badge>
```

**Props:**
- `variant`: 'default' | 'success' | 'warning' | 'error' | 'info'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: MaterialIcons name

---

### Avatar

```typescript
import { Avatar } from '../components/primitives';

// With image
<Avatar source="https://example.com/avatar.jpg" />

// With initials fallback
<Avatar initials="JD" />

// Different sizes
<Avatar size="sm" initials="JD" />
<Avatar size="md" initials="JD" />
<Avatar size="lg" initials="JD" />
<Avatar size="xl" initials="JD" />

// With status indicator
<Avatar 
  source="https://example.com/avatar.jpg"
  showStatus
  online
/>
```

**Props:**
- `source`: string (image URI)
- `initials`: string (2 characters)
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `showStatus`: boolean
- `online`: boolean

---

## Utility Functions

Helper functions for common styling tasks.

### Color Utilities

```typescript
import { rgba, hexToRgb, getContrastColor } from '../utils/styleUtils';

// Convert hex to rgba
const semiTransparent = rgba('#1349ec', 0.5); // 'rgba(19, 73, 236, 0.5)'

// Convert hex to RGB object
const rgb = hexToRgb('#1349ec'); // { r: 19, g: 73, b: 236 }

// Get contrast color
const textColor = getContrastColor('#1349ec'); // 'light' or 'dark'
```

### Themed Styles

```typescript
import { createThemedStyles } from '../utils/styleUtils';

const useStyles = createThemedStyles((theme) => ({
  container: {
    backgroundColor: theme.background,
    padding: SPACING.lg,
  },
  text: {
    color: theme.text,
    ...TEXT_STYLES.body,
  },
}));

function MyComponent() {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  
  return <View style={styles.container}>...</View>;
}
```

### Glass Effect

```typescript
import { glassEffect } from '../utils/styleUtils';

<View style={[styles.card, glassEffect(theme.primary, 0.1)]}>
  {/* Glass morphism card */}
</View>
```

---

## Usage Examples

### Complete Form Example

```typescript
import React, { useState } from 'react';
import { View } from 'react-native';
import { Input, Button } from '../components/primitives';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/designTokens';

function LoginForm() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <View style={{ padding: SPACING.lg }}>
      <Input
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        leftIcon="email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Input
        label="Password"
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        leftIcon="lock"
        secureTextEntry
        error={error}
      />
      
      <Button 
        fullWidth 
        onPress={handleLogin}
        style={{ marginTop: SPACING.lg }}
      >
        Sign In
      </Button>
      
      <Button 
        variant="ghost" 
        fullWidth
        onPress={handleForgot}
      >
        Forgot Password?
      </Button>
    </View>
  );
}
```

### Card Grid Example

```typescript
import { Card, Badge } from '../components/primitives';
import { SPACING } from '../constants/designTokens';

function TaskGrid() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
      {tasks.map(task => (
        <Card
          key={task.id}
          title={task.title}
          subtitle={task.description}
          onPress={() => handleTaskPress(task.id)}
          style={{ width: '48%' }}
          footer={
            <Badge variant={task.status === 'active' ? 'success' : 'default'}>
              {task.status}
            </Badge>
          }
        >
          {/* Task content */}
        </Card>
      ))}
    </View>
  );
}
```

---

## Migration Guide

### From Inline Styles

**Before:**
```typescript
<Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '700' }}>
  Hello
</Text>
```

**After:**
```typescript
<Text style={[TEXT_STYLES.label, { color: theme.text }]}>
  Hello
</Text>
```

### From Custom Buttons

**Before:**
```typescript
<TouchableOpacity style={{ 
  backgroundColor: '#1349ec',
  padding: 16,
  borderRadius: 12,
  alignItems: 'center'
}}>
  <Text style={{ color: 'white', fontWeight: 'bold' }}>Click Me</Text>
</TouchableOpacity>
```

**After:**
```typescript
<Button onPress={handlePress}>Click Me</Button>
```

---

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Use TEXT_STYLES** for typography instead of inline font styles
3. **Access colors through theme** for automatic light/dark mode support
4. **Use primitive components** when possible instead of building custom ones
5. **Import from barrel exports** for cleaner imports:
   ```typescript
   import { Button, Card, Input } from '../components/primitives';
   ```

---

Made with ❤️ by the XUM AI Team
