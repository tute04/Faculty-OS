# Faculty OS 🎓
A premium academic management system built for students who want to stay organized without the drama.

## Core Features
- **Smart Dashboard**: Context-aware greeting and focus section for upcoming exams.
- **Academic Profile**: Personalized experience based on your University, Career, and Year of study.
- **Exam Tracker**: Algorithmic priority scoring and urgency-based visual hierarchy.
- **Weekly Planner**: Manage your university load, study blocks, and personal projects.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion.
- **Backend & Auth**: Supabase (PostgreSQL, Realtime, Auth).

---

## Getting Started

### 1. Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:
```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Supabase Authentication Setup
To use the new email/password and onboarding flow, configure your Supabase project:
1. **Authentication > Providers**:
   - Enable **Email**.
   - (Optional) Enable **Confirm email** to require verification.
   - Disable **Google** (or keep enabled if you wish to re-add the logic later).
2. **Database > Schema**:
   - Run the migrations found in `supabase/migrations/` to set up the `profiles` table and the `handle_new_user` trigger.

### 3. Installation & Development
```bash
npm install
npm run dev
```

---

## Authentication Flow
Faculty OS uses a multi-step onboarding process:
1. **Account Creation**: Sign up with email and a strong password (min 6 chars).
2. **Personalization**: Tell us your Name, University, Career, and Year.
3. **Seed Data**: Your workspace is automatically populated with sample data to get you started immediately.

## Password Recovery
- If you forget your password, use the **Recuperar contraseña** link on the login page.
- You'll receive a secure link to reset your password and set a new one.

---
Built with ⚡ by Antigravity.
