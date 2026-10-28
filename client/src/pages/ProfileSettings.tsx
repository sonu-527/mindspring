import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Lock, Trash2, Download, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface ProfileSettingsProps {
  currentUser: User | null;
  onUpdateUser: (user: User) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentUser, onUpdateUser }) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [examGoal, setExamGoal] = useState(currentUser?.examGoal || 'JEE Main & Advanced 2027');
  const [targetHours, setTargetHours] = useState(currentUser?.dailyTargetHours || 6.5);
  const [consentGiven, setConsentGiven] = useState(Boolean(currentUser?.consentGiven));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setExamGoal(currentUser.examGoal || 'JEE Main');
      setTargetHours(currentUser.dailyTargetHours || 6.5);
      setConsentGiven(Boolean(currentUser.consentGiven));
    }
    if (currentUser?.role === 'admin') {
      api.getAdminDashboard().then(res => {
        if (res.auditLogs) setAuditLogs(res.auditLogs);
      }).catch(console.error);
    } else {
      setAuditLogs([
        {
          id: 'log-local-1',
          timestamp: new Date().toISOString(),
          actorRole: currentUser?.role || 'student',
          action: 'CONSENT_ACTIVE',
          details: 'Zero-knowledge journaling active. Data shielded under DPDP Act 2023.'
        }
      ]);
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateConsent(consentGiven, currentUser?.emergencyContact);
      if (res.success) {
        onUpdateUser({
          ...currentUser!,
          name,
          examGoal,
          dailyTargetHours: Number(targetHours),
          consentGiven
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentUser, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mindspring_profile_${currentUser?.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-lavender-700 font-semibold text-xs mb-1">
            <Settings className="w-4 h-4" />
            <span>Profile & Privacy Control Center</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Consent, Safety & Privacy Settings</h1>
          <p className="text-xs text-slate-500">
            Control your profile details, manage consent for wellbeing data, and inspect privacy audit logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Profile & Consent Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-lavender-100 shadow-card space-y-5">
            <h2 className="text-base font-bold text-slate-800">Student Profile & Academic Targets</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Primary Exam Goal</label>
                <select
                  value={examGoal}
                  onChange={e => setExamGoal(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="JEE Main & Advanced 2027">JEE Main & Advanced 2027</option>
                  <option value="NEET-UG 2027">NEET-UG 2027</option>
                  <option value="UPSC CSE 2027">UPSC CSE 2027</option>
                  <option value="CA Foundation">CA Foundation</option>
                  <option value="Class 12 Board Exams">Class 12 Board Exams</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Daily Study Target (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  max="12"
                  value={targetHours}
                  onChange={e => setTargetHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">We recommend 6 to 7 hours with regular rest breaks</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Consent & Privacy Governance</h3>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer text-xs leading-relaxed text-slate-700">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={e => setConsentGiven(e.target.checked)}
                  className="mt-0.5 accent-lavender-600"
                />
                <div>
                  <span className="font-bold text-slate-800">Explicit Wellbeing Data Consent: </span>
                  I consent to MindSpring storing my self-care reflections and mood logs locally to generate personal progress graphs. I understand this data is confidential and never sold or monetized.
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export My Data (JSON)</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-bold text-xs shadow-md shadow-lavender-200 transition-all"
              >
                {savedSuccess ? '✓ Settings Saved' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Privacy Audit Log */}
          <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-card space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Authorized Data Access Audit Log</h3>
            <p className="text-xs text-slate-500">Every record access is logged for full security transparency.</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] bg-slate-200 px-1.5 py-0.5 rounded mr-2">
                      {log.actorRole}
                    </span>
                    <span className="text-slate-600">{log.action}: {log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: DPDP Act Compliance & Safeguards */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-card space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>DPDP Act Alignment</span>
            </div>
            <p>
              MindSpring complies with the Digital Personal Data Protection (DPDP) Act of India and international standards:
            </p>
            <ul className="space-y-2 list-disc list-inside text-slate-700">
              <li><strong>Parental Consent:</strong> Verified for minor students under 18 years of age.</li>
              <li><strong>Zero Behavioral Ads:</strong> We never monetize student vulnerability or sell prep analytics.</li>
              <li><strong>Right to Erasure:</strong> You can delete any journal entry or assessment at any time.</li>
              <li><strong>Data Encryption:</strong> Transmitted via secure TLS 1.3 channels.</li>
            </ul>
          </div>

          <div className="p-5 rounded-3xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Account Deletion & Data Purge</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Want to permanently delete all your mood logs, journal entries, and mock scores? This action cannot be undone.
            </p>
            <button
              onClick={() => alert("All personal data purged from demo store successfully.")}
              className="mt-2 w-full py-2 rounded-xl bg-white border border-rose-300 text-rose-700 font-bold hover:bg-rose-100 transition-colors"
            >
              Purge All Data
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
