import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './app/page';
import DashboardPage from './app/dashboard/page';
import CalculatorPage from './app/calculator/page';
import CoachPage from './app/coach/page';
import ChallengesPage from './app/challenges/page';
import MarketplacePage from './app/marketplace/page';
import LeaderboardPage from './app/leaderboard/page';
import LoginPage from './app/login/page';
import RegisterPage from './app/register/page';

export default function App() {
  const [view, setView] = useState('landing');

  useEffect(() => {
    // Listen for custom navigation triggers from link mocks
    const handleViewChange = (e: any) => {
      const targetView = e.detail;
      setView(targetView);
      window.location.hash = targetView;
    };

    window.addEventListener('ecotrack-view-change', handleViewChange);

    // Initial hash routing support
    const handleHashChange = () => {
      const initialHash = window.location.hash.replace('#', '') || 'landing';
      setView(initialHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on startup

    return () => {
      window.removeEventListener('ecotrack-view-change', handleViewChange);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardPage />;
      case 'calculator':
        return <CalculatorPage />;
      case 'coach':
        return <CoachPage />;
      case 'challenges':
        return <ChallengesPage />;
      case 'marketplace':
        return <MarketplacePage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-emerald-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:z-50 focus:font-extrabold"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6" tabIndex={-1}>
        {renderView()}
      </main>
    </div>
  );
}
