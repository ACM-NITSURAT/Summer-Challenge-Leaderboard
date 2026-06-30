import React, { useEffect, useState } from 'react';

type ModalProps = {
  isOpen: boolean;
  type: 'flag' | 'unflag' | 'alert' | 'reason';
  title?: string;
  message?: string;
  targetHacker?: string;
  onConfirm: (notes?: string) => void;
  onCancel: () => void;
};

export default function ActionModal({ isOpen, type, title, message, targetHacker, onConfirm, onCancel }: ModalProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) setNotes('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
      
      <div className="relative bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-md p-6 transform transition-all">
        <h3 className="text-xl font-bold text-white mb-2">
          {type === 'alert' ? title || 'Notice' : 
           type === 'reason' ? title || 'Flag Reason' :
           type === 'flag' ? 'Flag Participant' : 'Unflag Participant'}
        </h3>
        
        {type === 'reason' ? (
          <div className="mb-6 mt-4">
            <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-lg text-red-200 text-sm mb-4">
              {message}
            </div>
            <p className="text-xs text-slate-400 italic">
              Note: If you believe this is a mistake, please contact the organizers.
            </p>
          </div>
        ) : (
          <p className="text-slate-300 text-sm mb-6">
            {type === 'alert' ? message : 
             type === 'flag' ? `Please provide a reason for flagging ${targetHacker}. They will be removed from the official rankings.` : 
             `Are you sure you want to unflag ${targetHacker}? They will be restored to the leaderboard.`}
          </p>
        )}

        {type === 'flag' && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reason (Notes)</label>
            <input 
              type="text" 
              autoFocus
              placeholder="e.g. Manual code review"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && onConfirm(notes)}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2">
          {(type === 'flag' || type === 'unflag') && (
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          
          <button 
            onClick={() => onConfirm(notes)}
            className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-colors cursor-pointer ${
              type === 'alert' || type === 'reason' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
              type === 'flag' ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 
              'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            }`}
          >
            {type === 'alert' || type === 'reason' ? 'Close' : type === 'flag' ? 'Flag Hacker' : 'Unflag Hacker'}
          </button>
        </div>
      </div>
    </div>
  );
}
