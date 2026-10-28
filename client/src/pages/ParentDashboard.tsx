import React, { useState, useEffect } from 'react';
import { Users, Heart, BookOpen, Lock, Sparkles, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const ParentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getParentDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load parent dashboard:', err);
      setError(err?.message || 'Access restricted to authorized parents and guardians.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-lavender-600 animate-spin flex items-center justify-center text-white font-bold">
          🌸
        </div>
        <p className="text-xs font-bold text-slate-600">Loading Parent & Guardian Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>Parent Access Restricted</span>
        </div>
        <p className="text-xs">{error}</p>
        <p className="text-[11px] text-rose-600">Please switch to a verified parent account (e.g. Mrs. Sunita Sharma) in the top navbar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-lavender-700 font-semibold text-xs mb-1">
            <Users className="w-4 h-4" />
            <span>Family Support & Authorized Overview</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Parent & Guardian Dashboard</h1>
          <p className="text-xs text-slate-500">
            Authorized academic milestones and gentle guidance for supporting your child's emotional wellbeing.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-800">{data?.parentName || 'Mrs. Sunita Sharma'}</p>
          <p className="text-[11px] text-slate-500">Child: {data?.student?.name || 'Aarav Sharma'}</p>
        </div>
      </div>

      {/* Privacy Notice Card */}
      <div className="p-4 rounded-2xl bg-lavender-50 border border-lavender-100 flex items-start gap-3 text-xs text-lavender-900 leading-relaxed">
        <Lock className="w-4 h-4 text-lavender-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Adolescent Privacy Assurance: </span>
          {data?.privacyNotice || 'Personal journal entries and confidential counsellor dialogues remain strictly shielded between the student and certified professionals.'}
        </div>
      </div>

      {/* Authorized Academic Progress Overview */}
      <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Study Habits & To-Do Routine Overview</h2>
            <p className="text-xs text-slate-500">Target: {data?.student?.examGoal || 'JEE Main & Advanced 2027'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {data?.student?.studyConsistencyStreak || '14 consecutive days'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">To-Do Completion</p>
            <p className="text-lg font-bold text-slate-800">{data?.student?.taskCompletionRate || 'Healthy Routine'}</p>
            <p className="text-[11px] text-slate-400 mt-1">Balanced mix of practice, revision, and rest</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Daily Rest & Micro-Breaks</p>
            <p className="text-lg font-bold text-sage-700">Consistent Pacing</p>
            <p className="text-[11px] text-slate-400 mt-1">Taking regular screen-free recovery intervals</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Weekly Focus Hours</p>
            <p className="text-lg font-bold text-lavender-700">{data?.student?.weeklyStudyHours || '35-40 hrs logged'}</p>
            <p className="text-[11px] text-slate-400 mt-1">Sustainable target without sleep sacrifice</p>
          </div>
        </div>
      </div>

      {/* Parent Guide to Exam Stress */}
      <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <h2 className="text-base font-bold text-slate-800">Parent Guide to Exam Stress & Conversations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.parentSupportGuide?.map((g: any, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-800 mb-2">{g.heading}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{g.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
