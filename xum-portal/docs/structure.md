# Company Portal - Application Structure

## 1. Directory Layout
Specific to the Company Portal project.

```text
company/
├── docs/               # Project-specific documentation
├── supabase/           # SQL and backend configurations for company features
├── src/
│   ├── components/     # UI components
│   ├── pages/          # View routes
│   ├── theme/          # Premium design styles
│   └── lib/            # Utilities and Supabase client
├── index.html
└── package.json
```

## 2. Shared Sync
The portal syncs with the main XUM AI database but operates on its own set of tables (Projects, Deposits) while interacting with shared tables (Tasks, Submissions).
