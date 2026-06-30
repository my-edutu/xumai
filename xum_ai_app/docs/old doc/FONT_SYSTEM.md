# Font System Documentation

## Overview
XUM AI uses **Space Grotesk** as the primary typeface for a modern, clean, and geometric aesthetic, complemented by **JetBrains Mono** for code and technical elements.

## Installed Fonts

### Space Grotesk (Primary UI Font)
- **Display/Headings**: `SpaceGrotesk_700Bold`
- **Body Text**: `SpaceGrotesk_400Regular`

### JetBrains Mono (Monospace/Technical)
- **Code/IDs**: `JetBrainsMono_400Regular`

## Usage

### Method 1: Using Design Tokens Directly (Recommended)
Import the typography tokens and use them in your StyleSheet:

```typescript
import { TYPOGRAPHY } from '../constants/designTokens';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    heading: {
        fontSize: TYPOGRAPHY.size.xl,
        fontFamily: TYPOGRAPHY.fonts.display, // Space Grotesk Bold
        fontWeight: '700',
    },
    bodyText: {
        fontSize: TYPOGRAPHY.size.md,
        fontFamily: TYPOGRAPHY.fonts.body, // Space Grotesk Regular
    },
    codeText: {
        fontSize: TYPOGRAPHY.size.sm,
        fontFamily: TYPOGRAPHY.fonts.mono, // JetBrains Mono
    }
});
```

### Method 2: Using Theme Context
Access fonts through the theme context:

```typescript
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
    const { tokens } = useTheme();
    
    return (
        <Text style={{ fontFamily: tokens.typography.fonts.display }}>
            Heading Text
        </Text>
    );
};
```

## Font Loading

Fonts are automatically loaded in `App.tsx` using the `useAppFonts()` hook from `src/config/fonts.ts`. The app shows a loading indicator while fonts are being prepared.

## Adding New Font Weights

To add additional font weights:

1. Install the font package:
```bash
npm install @expo-google-fonts/space-grotesk
```

2. Update `src/config/fonts.ts`:
```typescript
import {
    SpaceGrotesk_300Light,  // Add this
    SpaceGrotesk_400Regular,
    SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

export function useAppFonts() {
    const [fontsLoaded] = useFonts({
        SpaceGrotesk_300Light,  // Add this
        SpaceGrotesk_400Regular,
        SpaceGrotesk_700Bold,
        JetBrainsMono_400Regular,
    });
    return fontsLoaded;
}
```

3. Update `src/constants/designTokens.ts`:
```typescript
fonts: {
    displayLight: 'SpaceGrotesk_300Light',  // Add this
    display: 'SpaceGrotesk_700Bold',
    body: 'SpaceGrotesk_400Regular',
    mono: 'JetBrainsMono_400Regular',
},
```

## Best Practices

### When to Use Each Font

1. **Display Font (SpaceGrotesk_700Bold)**
   - Page headings
   - Section titles  
   - Call-to-action buttons
   - Stats/Numbers
   - Uppercase labels

2. **Body Font (SpaceGrotesk_400Regular)**
   - Paragraph text
   - Descriptions
   - Form labels
   - General UI text

3. **Mono Font (JetBrainsMono_400Regular)**
   - User IDs
   - Transaction hashes
   - Code snippets
   - Technical data

### Performance Tips

- Always reference fonts via `TYPOGRAPHY.fonts.*` to ensure consistency
- Avoid inline font declarations; use StyleSheet.create
- Test font rendering on both iOS and Android
- Consider font weight compatibility across platforms

## Troubleshooting

### Fonts Not Loading
If fonts don't appear:
1. Check that `useAppFonts()` is called in `App.tsx`
2. Verify npm packages are installed
3. Clear Metro bundler cache: `npx expo start -c`
4. Rebuild the app

### Wrong Font Displayed
- Ensure exact font name matches the package export
- Check for typos in `fontFamily` property
- Verify fontWeight matches available weights

## Platform Differences

### iOS
- Supports all font variants
- Font rendering is smoother

### Android
- May require app rebuild for new fonts
- Font weights might render slightly differently

### Web
- Fonts load via CSS @font-face
- Fallback to system fonts if loading fails

## Related Files

- `src/config/fonts.ts` - Font loading configuration
- `src/constants/designTokens.ts` - Font token definitions
- `src/App.tsx` - Font loading integration
- `src/styles.ts` - Global styles using fonts
