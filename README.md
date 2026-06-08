# EcoTrack AI

> **“Understand Your Impact. Reduce Your Footprint. Save the Planet.”**
> 
> *A Premium AI-Powered Carbon Footprint Awareness and Action Platform, built as a prototype for the Google Sustainability Hackathon.*

---

## 🌟 Overview

EcoTrack AI is a complete, production-ready platform designed to help individuals track, understand, and reduce their carbon footprint through daily actions, gamification, and personalized AI coaching.

By combining detailed carbon footprint analytics, interactive tree offset simulations, a Google Gemini-powered sustainability coach, a community leaderboard, and a verified offset marketplace, EcoTrack AI turns climate anxiety into structured, rewarding daily habits.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS (v4), Framer Motion, Recharts, Lucide Icons.
- **Backend**: Node.js, Express.js, Multer (in-memory receipt uploads).
- **Database**: Prisma ORM, SQLite (local database zero-config fallback, ready for PostgreSQL).
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` model integration for coach suggestions, receipt scanning, and habit predictions).
- **Report Engine**: `pdfkit` dynamic server-side PDF generation.

---

## 🚀 Local Setup & Run Guide

To run EcoTrack AI locally in developer mode:

### Prerequisites

- **Node.js** (v18.x or newer) and **npm** installed.
- *(Optional)* A Google Gemini API key. If no key is set, the application automatically runs in a smart mock/fallback mode, enabling complete interactive evaluation without API keys.

---

### Step 1: Clone & Configure Backend

1. Navigate to the `backend/` directory.
2. Initialize environment configurations:
   Create a `.env` file inside `backend/` (already pre-configured during installation):
   ```env
   PORT=5000
   DATABASE_URL="file:./dev.db"
   GEMINI_API_KEY="your-google-gemini-api-key-here"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Push the database schema & seed initial missions and mock users:
   ```bash
   npx prisma db push
   npx ts-node-dev --transpile-only prisma/seed.ts
   ```
5. Start the API server:
   ```bash
   npm run dev
   ```
   *The backend server will launch and listen on `http://localhost:5000`.*

---

### Step 2: Configure & Run Frontend

1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The Next.js client will start on `http://localhost:3000`.*

4. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📊 Core Features

1. **Carbon Footprint Calculator**: Multi-step wizard assessing transportation, electricity usage, diets, shopping patterns, and recycling.
2. **AI Sustainability Coach**: Interactive chatbot offering specialized guidelines for transport, energy, and food.
3. **AI Receipt Scanner**: Upload electric bills or fuel receipts to extract usage and compute CO₂ offsets automatically.
4. **Voice-Based Eco Assistant**: Synthesis reader utilizing the Web Speech API to talk to you directly.
5. **Daily Habit Tracker**: Checklist rewarding points for walking, cycling, recycling, saving power, or carpooling.
6. **Green Challenges**: Enroll in weekly missions (e.g. "No Plastic Week") to unlock big XP achievements.
7. **Leaderboard**: Gamified ranking matching user scores with the community.
8. **Tree Impact Simulator**: Interactive slider showing how planting trees offsets carbon equivalents (charging smartphones, car kilometers).
9. **Offset Marketplace**: Spend Eco points to plant real trees and support wind/solar projects.
10. **PDF Audits**: Click-to-download PDF report detailing your statistics and custom coach recommendations.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register or retrieve user profile session |
| **POST** | `/api/calculator` | Calculate footprint emissions and save score |
| **GET** | `/api/dashboard/:userId` | Get dashboard cards, charts data, and AI predictions |
| **POST** | `/api/habits` | Log daily habits and earn XP points |
| **GET** | `/api/challenges` | Retrieve weekly green missions |
| **POST** | `/api/challenges/join` | Join a weekly eco-mission |
| **POST** | `/api/challenges/complete` | Complete quest and claim points |
| **POST** | `/api/ai/coach` | Ask sustainability coach (Gemini Chat) |
| **POST** | `/api/ai/scan-receipt` | Upload and parse utility bills with Gemini Vision |
| **POST** | `/api/offset/buy` | Spend points on tree-planting projects |
| **GET** | `/api/reports/pdf/:userId` | Download custom PDF report summary |
| **GET** | `/health` | API server health diagnostic |
