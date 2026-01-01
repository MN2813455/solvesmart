
import React from 'react';
import Icon from './Icon';

interface SettingsViewProps {
  onBack: () => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onLogout }) => {
  return (
    <div className="max-w-3xl mx-auto w-full py-16 px-6 animate-fade-in">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Settings</h2>
        <button 
          onClick={onBack}
          className="text-slate-900 hover:text-indigo-600 font-black uppercase text-xs tracking-widest flex items-center gap-3 transition-colors bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-50"
        >
          <Icon name="ArrowRight" size={16} className="rotate-180" /> Back
        </button>
      </div>

      <div className="space-y-8">
        {/* User Profile */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-[28px] flex items-center justify-center text-indigo-600 shadow-inner">
              <Icon name="Users" size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Lead Consultant</h3>
              <p className="text-slate-400 font-bold">admin@rationalist.io</p>
            </div>
          </div>
          <div className="p-6 bg-slate-50/50 flex justify-end">
            <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Revise Account</button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10 space-y-10">
          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Engine Protocol</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-amber-50 rounded-2xl text-amber-500">
                <Icon name="Zap" size={24} />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg tracking-tight">Deep Logic Mode</p>
                <p className="text-sm text-slate-400 font-bold">Execute rigorous exhaustive logic checks and challenger analysis.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer scale-110">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-14 h-8 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-500">
                <Icon name="MessageSquare" size={24} />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg tracking-tight">Persistent Context</p>
                <p className="text-sm text-slate-400 font-bold">Retain logic history across strategic sessions.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer scale-110">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-14 h-8 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-50/50 rounded-[40px] border border-rose-100 p-10">
          <h4 className="text-[10px] font-black text-rose-300 uppercase tracking-[0.4em] mb-6">Danger Protocol</h4>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 bg-white border border-rose-100 text-rose-600 font-black py-5 rounded-[24px] hover:bg-rose-600 hover:text-white transition-all shadow-sm uppercase text-sm tracking-widest"
          >
            Terminate Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
