
import React, { useState } from 'react';
import ChatSession from './components/ChatSession';
import ReportView from './components/ReportView';
import AboutModal from './components/AboutModal';
import SettingsView from './components/SettingsView';
import AuthPage from './components/AuthPage';
import Icon from './components/Icon';
import { FullReportData } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'chat' | 'report' | 'settings'>('chat');
  const [showAbout, setShowAbout] = useState(false);
  const [reportData, setReportData] = useState<FullReportData | null>(null);

  const handleAnalysisComplete = (data: FullReportData) => {
    setReportData(data);
    setView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setView('chat');
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('chat')}>
          <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
            <Icon name="Brain" className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-2xl text-slate-900 tracking-tighter">Rationalist</span>
        </div>
        
        <div className="flex items-center gap-3">
          {reportData && view !== 'settings' && (
            <button 
              onClick={() => setView(view === 'chat' ? 'report' : 'chat')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100/50 transition-all flex items-center gap-2 border border-indigo-100/50"
            >
              <Icon name={view === 'chat' ? 'FileText' : 'MessageSquare'} size={18} />
              <span className="hidden sm:inline">{view === 'chat' ? 'Strategy Report' : 'Refine Logic'}</span>
            </button>
          )}
          
          <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block"></div>
          
          <button 
            onClick={() => setShowAbout(true)}
            className="text-slate-400 hover:text-slate-900 p-2.5 rounded-2xl hover:bg-slate-50 transition-all"
            title="Search Insights"
          >
            <Icon name="Search" size={20} />
          </button>
          
          <button 
            onClick={() => setView('settings')}
            className={`p-2.5 rounded-2xl transition-all ${view === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            title="Settings"
          >
            <Icon name="Briefcase" size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col overflow-y-auto">
        {view === 'settings' ? (
          <SettingsView onBack={() => setView('chat')} onLogout={() => setIsAuthenticated(false)} />
        ) : view === 'report' && reportData ? (
          <div className="animate-fade-in flex flex-col pb-20">
            <ReportView 
               data={reportData} 
               onBack={() => setView('chat')} 
            />
            
            {/* Contextual Refinement Bar */}
            <div className="max-w-5xl mx-auto w-full px-6 mt-12 mb-20">
               <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-md">
                           <Icon name="MessageSquare" size={20} />
                        </div>
                        <div>
                           <h3 className="font-extrabold text-slate-900 text-lg">Logic Refinement</h3>
                           <p className="text-sm text-slate-500 font-medium">Feed Rationalist more context to evolve the strategy.</p>
                        </div>
                     </div>
                  </div>
                  <div className="h-[750px] max-h-[85vh]">
                     <ChatSession initialData={reportData} onComplete={handleAnalysisComplete} />
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-4">
             <ChatSession onComplete={handleAnalysisComplete} />
          </div>
        )}
      </main>

      {/* Modals */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default App;
