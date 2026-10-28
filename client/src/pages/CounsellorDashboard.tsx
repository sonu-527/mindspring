import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  BookOpen, 
  HeartHandshake,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export const CounsellorDashboard: React.FC = () => {
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
      const res = await api.getCounsellorDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load counsellor dashboard:', err);
      setError(err?.message || 'Access restricted to certified mental health counsellors.');
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
        <p className="text-xs font-bold text-slate-600">Loading Counsellor Desk & Triage Queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>Access Restricted</span>
        </div>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  const triageQueue = data?.triageQueue || [];
  const counsellor = data?.counsellor || {};
  const guidelines = data?.guidelines || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-lavender-700 font-semibold text-xs mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Clinical Care & Triage Console</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Counsellor Desk</h1>
          <p className="text-xs text-slate-500">
            Confidential student consultation booking requests, clinical triage queue, and safeguarding protocols.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-800">{counsellor.name || 'Dr. Ananya Roy, M.Phil'}</p>
          <p className="text-[11px] text-slate-500 font-mono">License: {counsellor.license || 'RCI-CLIN-2021-9844'}</p>
        </div>
      </div>

      {/* Caseload & Confidentiality Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-lavender-100 shadow-card">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
            <Users className="w-4 h-4 text-lavender-600" />
            <span>Active Student Caseload</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{counsellor.activeCaseload || 8} Students</p>
          <p className="text-[11px] text-slate-400 mt-1">JEE / NEET aspirants under active guidance</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-lavender-100 shadow-card">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Pending Triage Requests</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{triageQueue.length} Bookings</p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting 1-on-1 consultation scheduling</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-lavender-100 shadow-card">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
            <Lock className="w-4 h-4 text-purple-600" />
            <span>Client Confidentiality</span>
          </div>
          <p className="text-xs font-bold text-purple-800 mt-1">Mental Healthcare Act 2017</p>
          <p className="text-[11px] text-slate-400 mt-1">Zero-knowledge notes shielded from schools & parents</p>
        </div>
      </div>

      {/* Student Consultation Triage Queue */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lavender-100 shadow-card space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-lavender-700" />
            <h2 className="text-base font-bold text-slate-800">Student Consultation Requests & Triage Queue</h2>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-lavender-50 text-lavender-800 border border-lavender-200">
            {triageQueue.length} Active {triageQueue.length === 1 ? 'Request' : 'Requests'}
          </span>
        </div>

        {triageQueue.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">All consultation requests have been addressed.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">New student booking requests will appear here in real time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {triageQueue.map((req: any) => (
              <div 
                key={req.id} 
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-lavender-200 transition-all space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-lavender-100 text-lavender-700 font-bold text-xs flex items-center justify-center">
                      {req.studentName ? req.studentName[0] : 'S'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{req.studentName || 'Student'}</p>
                      <p className="text-[11px] text-slate-500">Target Counsellor: {req.counsellorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      req.status === 'Confirmed' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {req.status || 'Pending Review'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pl-10 text-xs text-slate-700">
                  <p className="font-medium text-slate-800"><span className="text-slate-500">Reason: </span>{req.reason}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5"><span className="font-semibold text-slate-600">Preferred Slot: </span>{req.preferredSlot}</p>
                  {req.confidentialNotes && (
                    <p className="text-[11px] text-slate-400 mt-1 italic flex items-center gap-1">
                      <Lock className="w-3 h-3 inline text-slate-400" />
                      {req.confidentialNotes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Safeguarding Guidelines */}
      <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-card space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <FileText className="w-4 h-4 text-lavender-600" />
          <span>Clinical Practice & Safeguarding Guidelines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          {guidelines.map((g: string, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-lavender-100 text-lavender-700 font-bold text-[10px] flex items-center justify-center mb-2">
                {idx + 1}
              </span>
              <p>{g}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
