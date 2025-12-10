import React, { useState } from 'react';
import ChatSession from './components/ChatSession';
import ReportView from './components/ReportView';
import AboutModal from './components/AboutModal';
import Icon from './components/Icon';
import { FullReportData } from './types';

function App() {
  const [view, setView] = useState<'chat' | 'report'>('chat');
  const [showAbout, setShowAbout] = useState(false);
  const [reportData, setReportData] = useState<FullReportData | null>(null);

  const handleAnalysisComplete = (data: FullReportData) => {
    setReportData(data);
    setView('report');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Minimal Header */}
      {view === 'chat' && (
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <Icon name="Brain" className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">SolveSmart</span>
          </div>
          {/* Methodology Link Removed */}
        </header>
      )}

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        {view === 'chat' ? (
          <div className="flex-grow flex flex-col items-center justify-center p-4">
             <ChatSession onComplete={handleAnalysisComplete} />
          </div>
        ) : (
          <ReportView 
             data={reportData!} 
             onBack={() => setView('chat')} 
          />
        )}
      </main>

      {/* Modals */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default App;