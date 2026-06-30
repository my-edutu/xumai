# XUM AI - Agent Development Guidelines

## Essential Commands

### Development
```bash
cd xum_ai_app  # Main app directory
npm run dev          # Start web dev server (Vite)
npm start            # Start Expo dev server (mobile)
npm run web          # Start Expo web
npm run android       # Run Android build
npm run ios          # Run iOS build
```

### Build & Deploy
```bash
npm run build        # Build for production (Vite)
npm run build:apk    # Build Android APK via EAS
npm run build:ios    # Build iOS via EAS
npm run preview      # Preview production build
```

### Type Generation
```bash
npm run generate-types  # Generate Supabase TypeScript types from DB
npm run verify-backend   # Verify Supabase configuration
```

### Testing
No explicit test runner configured. Test by:
- Running the app with `npm run dev` or `npm start`
- Testing screens manually in the Expo dev client
- Checking console logs for errors

---

## Code Style Guidelines

### Imports
- Group imports by type with blank lines between groups
- Order: React imports, third-party, relative imports
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { TaskType } from './types';
```

### Naming Conventions
- **Components:** PascalCase (`UserProfileScreen.tsx`, `Header.tsx`)
- **Functions:** camelCase (`getUserBalance`, `submitTask`)
- **Interfaces/Types:** PascalCase (`TaskSubmission`, `UploadResult`)
- **Enums:** UPPER_SNAKE_CASE (`ScreenName.HOME`, `TaskType.VOICE`)
- **Constants:** UPPER_SNAKE_CASE (`VALIDATOR_REWARD`, `MIN_VOTES`)
- **Files:** PascalCase for components, camelCase for utilities

### Type Definitions
- Centralize types in `src/types.ts` and `src/services/types.ts`
- Use `interface` for object shapes, `type` for unions/aliases
- Always annotate function parameters and return types
```typescript
export interface TaskSubmission {
  id?: string;
  user_id: string;
  task_type: TaskType;
  status: SubmissionStatus;
}

async function submitTask(
  userId: string,
  promptId: string,
  taskType: TaskType
): Promise<SubmissionResult> {
  // implementation
}
```

### Error Handling
- Use try-catch for all async operations
- Return standardized error objects: `{ success: boolean, error?: string }`
- Log non-blocking errors with `console.warn`, not `console.error`
- Implement Supabase guard pattern:
```typescript
function ensureSupabase(tag: string): boolean {
  if (!isSupabaseConfigured) {
    console.warn(`[${tag}] Supabase not configured`);
    return false;
  }
  return true;
}
```

### Service Pattern
- All services in `src/services/`
- Export named functions, not default
- Use `src/services/index.ts` for centralized exports
- Services should be self-contained with clear single responsibility

### State Management
- Use Zustand for global state
- Type state interfaces explicitly
- Separate state and actions clearly:
```typescript
interface AppState {
  userId: string | null;
  walletBalance: number;
  setUserId: (id: string | null) => void;
  setWalletBalance: (balance: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),
}));
```

### Styling (NativeWind/Tailwind)
- Use utility classes consistently
- Custom colors defined in `tailwind.config.js`
- Avoid inline styles; use classes for maintainability
- Prefer kebab-case for class names: `bg-white/5`, `text-cyan-400`

### File Organization
```
src/
├── components/     # Reusable UI components
├── screens/        # Page/screen components
├── services/      # Business logic & API calls
├── store/         # Zustand state stores
├── types.ts       # Central type definitions
├── supabaseClient.ts
└── App.tsx        # Main entry point
```

### Comment Style
- Use JSDoc-style comments for functions and modules
- Add section dividers with clear headers:
```typescript
/**
 * XUM AI - Task Service
 * Handles media uploads and task submission.
 */

// ============================================================================
// STORAGE BUCKETS
// ============================================================================
```

### TypeScript Configuration
- Strict mode enabled
- Path alias: `@/*` → `src/*`
- ES2020 target, ESNext module
- No unused locals/params warnings disabled (allow for flexibility)

### Supabase Integration
- Use `supabaseClient.ts` for all Supabase operations
- Check `isSupabaseConfigured` before making requests
- Use RPC functions for complex queries when available
- All tables have RLS policies - respect row-level security

### Screen Components
- Use TypeScript props interfaces
- Destructure props in function signature
- Keep screens focused on single responsibility
- Extract reusable logic into custom hooks or services

### Path Aliases
- Use `@/*` for imports from `src/`
- Example: `import { TaskType } from '@/services/types'`

---

## Development Workflow

1. **Before coding:** Generate types with `npm run generate-types` after DB changes
2. **During coding:** Use `npm run dev` for hot reload
3. **After coding:** Test thoroughly in Expo dev client
4. **Type safety:** Ensure TypeScript compiles without errors
5. **Style:** Follow existing patterns in similar files

---

## Important Notes

- No official linter configured - follow existing patterns
- No test runner - manual testing required
- Supabase is the backend - all data flows through it
- Clerk handles authentication - sync with `users` table
- Both mobile (Expo) and web (Vite) builds from same codebase