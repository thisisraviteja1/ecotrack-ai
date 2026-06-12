# EcoTrack AI - Carbon Footprint Awareness Platform

EcoTrack AI is a fully client-side, production-ready Carbon Footprint Awareness Platform designed to help users measure their carbon footprint, track daily green habits, receive deterministic sustainability recommendations, and complete eco challenges.

This project is built using a modern frontend-only architecture with zero external database or API dependencies, ensuring 100% stability, no environment variable requirements, and zero risk of internal server errors.

---

## 🚀 Key Features

1. **Carbon Footprint Calculator**
   - Interactive inputs for transport mode, distance, electricity consumption, heating/cooling habits, food diet, shopping frequency, and recycling habits.
   - Calculates monthly and annual footprints (in kg CO₂) along with an overall Carbon Score out of 100.
2. **Interactive Dashboard**
   - Displays real-time charts (Emissions Split, You vs Average Citizen, and Weekly XP Trend) using responsive Recharts graphs.
   - Summarizes monthly footprint, reduction percentages, achievement level, and total eco points (XP).
3. **Daily Habit Tracker**
   - Check-in daily for carbon-reducing actions: cycling, walking, recycling, using public transport, and energy saving.
   - Earn XP points and progress from "Beginner" to "Climate Champion".
4. **Missions & Challenges**
   - Join themed eco-challenges (e.g. "No Plastic Week", "Plant a Tree") to earn major XP rewards.
5. **Sustainability Report**
   - Generate and download a formatted carbon footprint summary report as a text/markdown file locally.
6. **Local AI Coach**
   - Chat with an interactive sustainability coach powered by local expert rule-based logic.

---

## 🛠️ Tech Stack & Design

- **Core**: React 19, TypeScript 5, Vite 8, Tailwind CSS 4.
- **Charts**: Recharts.
- **Icons**: Lucide React.
- **Data Persistence**: Browser `localStorage` (100% client-side database emulation).
- **Aesthetic**: Premium dark mode design with modern glassmorphism panels, subtle green gradients, and micro-animations.

---

## ⚙️ Getting Started

### Installation
Clone the repository, install dependencies, and start the development server:

```bash
npm install
npm run dev
```

The application will run immediately at `http://localhost:5173/` without any environment configuration.

---

## 🧪 Testing Suite

We maintain a component and integration test suite targeting >90% coverage using Jest and React Testing Library.

To run the unit tests:
```bash
npm run test
```

To run tests with coverage reporting:
```bash
npm run test:coverage
```

---

## 📦 Production Build & Deployment

To compile the production build:
```bash
npm run build
```

This generates a optimized client-side bundle in the `dist/` directory.

### Vercel Deployment
To deploy to Vercel as a Static Single Page Application (SPA):
1. Import the project on Vercel.
2. Choose **Vite** as the Framework Preset.
3. Configure the output directory as `dist` (default).
4. Deploy! No environment variables or build configurations required.
