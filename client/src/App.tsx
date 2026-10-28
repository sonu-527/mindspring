import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CrisisModal } from './components/CrisisModal';
import { StudentDashboard } from './pages/StudentDashboard';
import { TodoPlanner } from './pages/TodoPlanner';
import { WellbeingCenter } from './pages/WellbeingCenter';
import { AICompanion } from './pages/AICompanion';
import { WellbeingGames } from './pages/WellbeingGames';
import { SupportDirectory } from './pages/SupportDirectory';
import { ParentDashboard } from './pages/ParentDashboard';
import { CounsellorDashboard } from './pages/CounsellorDashboard';
import { ProfileSettings } from './pages/ProfileSettings';
import { User, Role } from './types';
import { api } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.getCurrentUser();
      if (res && res.user) {
        setCurrentUser(res.user);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      // 401 or network error - session is missing or unauthenticated
    }

    // In development only, explicitly bootstrap a demo session when session is missing
    const isDev = Boolean((import.meta as any).env?.DEV);
    if (isDev) {
      try {
        const bootRes = await api.bootstrapDemoSession('student-1');
        if (bootRes && bootRes.success && bootRes.user) {
          setCurrentUser(bootRes.user);
          setIsLoading(false);
          return;
        }
      } catch (bootErr) {
        console.warn('Development demo session bootstrap failed:', bootErr);
      }
    }

    // In production or if demo bootstrap fails, never fake authentication
    setCurrentUser(null);
    setIsLoading(false);
  };

  const handleRoleSwitch = async (role: Role, userId?: string) => {
    // In production, never call demo role-switch endpoints
    const isDev = Boolean((import.meta as any).env?.DEV);
    if (!isDev) {
      console.warn('Role switching is disabled in production environments.');
      return;
    }

    try {
      const res = await api.switchRole(role, userId);
      // Ensure role changes update the current user only after the server confirms success
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        if (role === 'parent') {
          setCurrentTab('parent-view');
        } else if (role === 'counsellor') {
          setCurrentTab('counsellor-view');
        } else {
          setCurrentTab('dashboard');
        }
      }
    } catch (err) {
      console.error('Role switch error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-lavender-600 animate-spin flex items-center justify-center text-white font-bold">
            🌸
          </div>
          <p className="text-sm font-bold text-slate-700">Loading MindSpring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
        onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
      />

      {/* Main Layout */}
      {!currentUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md bg-white p-8 rounded-3xl border border-lavender-100 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-lavender-50 border border-lavender-200 text-3xl flex items-center justify-center mx-auto">
              🌸
            </div>
            <h2 className="text-xl font-bold text-slate-800">Welcome to MindSpring</h2>
            <p className="text-sm text-slate-600">
              Please sign in or use the demo role switcher in the navbar to explore MindSpring.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
          
          {/* Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            userRole={currentUser.role}
          />

          {/* Content Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
            {currentTab === 'dashboard' && (
              <StudentDashboard
                currentUser={currentUser}
                onNavigateTab={setCurrentTab}
                onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
              />
            )}

            {(currentTab === 'planner' || currentTab === 'academic') && (
              <TodoPlanner currentUser={currentUser} />
            )}

            {currentTab === 'wellbeing' && (
              <WellbeingCenter
                currentUser={currentUser}
                onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'companion' && (
              <AICompanion
                currentUser={currentUser}
                onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
              />
            )}

            {currentTab === 'games' && (
              <WellbeingGames />
            )}

            {currentTab === 'support' && (
              <SupportDirectory
                currentUser={currentUser}
                onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
              />
            )}

            {currentTab === 'parent-view' && (
              <ParentDashboard />
            )}

            {currentTab === 'counsellor-view' && (
              <CounsellorDashboard />
            )}

            {currentTab === 'settings' && (
              <ProfileSettings
                currentUser={currentUser}
                onUpdateUser={setCurrentUser}
              />
            )}
          </main>

        </div>
      )}

      {/* 24x7 Verified Crisis Helpline Modal */}
      <CrisisModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
      />

    </div>
  );
}

export default App;
