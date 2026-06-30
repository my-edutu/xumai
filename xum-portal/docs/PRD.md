# XUM AI - Company Portal PRD

## 1. Overview
The Company Portal is a dedicated web interface for enterprise clients, AI startups, and research institutions to manage data collection and labeling projects. It serves as the bridge between raw data needs and the global workforce of contributors.

## 2. Core Features (MVP)

### 2.1 Project Management
- **Dashboard Overview**: High-level metrics (active projects, total tasks, budget spent, completion rates).
- **Create Project**: Define project scope, target demographics, and quality requirements.
- **Upload Raw Data**: Interface to upload text, images, or audio for labeling.

### 2.2 Task Design
- **Task Creation**: Configure specific task types (e.g., Image Classification, Audio Transcription, RLHF).
- **Consensus Settings**: Define how many workers must agree for a submission to be considered valid.
- **Dynamic Pricing**: Set rewards per task based on complexity.

### 2.3 Monitoring & Analytics
- **Live Progress**: Real-time tracking of task completion.
- **Worker Insights**: Filter data by country, skill level, and accuracy scores.
- **Quality Metrics**: Access rater agreement scores and validation results.

### 2.4 Financials
- **Budget Setup**: Deposit funds for projects.
- **Automated Billing**: Track spending per project.
- **Invoices**: Generate statements for business accounting.

### 2.5 Results & Data
- **Data Export**: Download labeled datasets in formats like JSON, CSV, or COCO.
- **Version Control**: Manage multiple iterations of a dataset.

## 3. Technical Requirements
- **Frontend**: React (Vite) with shared design system.
- **Backend Sync**: Real-time synchronization via Supabase.
- **RBAC**: Strict separation between contributor and company data.

## 4. User Personas
- **Project Manager**: Oversees progress and handles budgeting.
- **Data Scientist**: Defines task logic and exports final datasets.
- **Admin**: Manages team access and API keys.
