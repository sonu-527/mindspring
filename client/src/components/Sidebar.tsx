import React from 'react';
import { 
  Heart, 
  Bot, 
  Gamepad2, 
  BookHeart, 
  ShieldCheck, 
  Users, 
  Settings, 
  Sparkles,
  CheckSquare
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole?: Role;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, userRole = 'student' }) => {
  // Ordered primarily for Mental Wellbeing; To-Do Planner is placed as the LAST option
  const mainNavItems = [
    { id: 'dashboard', label: 'Wellness Sanctuary', icon: Heart, badge: 'Home' },
    { id: 'companion', label: 'AI Wellbeing Companion', icon: Bot, badge: 'Counselling' },
    { id: 'games', label: 'Wellbeing Games (4)', icon: Gamepad2 },
    { id: 'wellbeing', label: 'Reflective Journal & Trends', icon: BookHeart },
    { id: 'support', label: 'Trusted Circle & Teachers', icon: ShieldCheck },
    { id: 'planner', label: 'To-Do Planner', icon: CheckSquare, badge: 'Daily & Monthly' }
  ];

  const roleNavItems = [
    { id: 'parent-view', label: 'Parent Dashboard', icon: Users, visible: true },
    { id: 'counsellor-view', label: 'Counsellor Desk', icon: ShieldCheck, visible: userRole === 'counsellor' || userRole === 'admin' },
    { id: 'settings', label: 'Consent & Privacy', icon: Settings, visible: true }
  ].filter(item => item.visible);

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-lavender-100 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)]">
      
      <div className="space-y-6">
        {/* Wellbeing First Navigation */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Mental Wellbeing Space
          </p>
          <nav className="space-y-1">
            {mainNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id || (item.id === 'planner' && currentTab === 'academic');
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-lavender-600 text-white shadow-md shadow-lavender-300'
                      : 'text-slate-600 hover:bg-lavender-50 hover:text-lavender-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && !isActive && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      item.badge === 'Daily & Monthly' 
                        ? 'bg-lavender-50 text-lavender-700 border border-lavender-100' 
                        : 'bg-sage-100 text-sage-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Supervision & Privacy Section */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Family & Privacy
          </p>
          <nav className="space-y-1">
            {roleNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sage-600 text-white shadow-md shadow-sage-200'
                      : 'text-slate-600 hover:bg-sage-50 hover:text-sage-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Gentle Wellbeing Reminder Card */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-lavender-50 via-white to-sage-50 border border-lavender-100/80 text-left shadow-sm">
          <div className="flex items-center gap-1.5 text-lavender-700 font-bold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gentle Sanctuary</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            "You are not required to study here. Take off your exam armor, breathe, and let yourself rest."
          </p>
        </div>
      </div>

    </aside>
  );
};
