import React from 'react';
import Icon from './Icon';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'framework', label: '7-Step Framework' },
    { id: 'horizons', label: 'Time Horizons' },
    { id: 'assistant', label: 'Problem Assistant' },
    { id: 'reflection', label: 'Reflection' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('framework')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Icon name="Brain" className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-slate-900 hidden sm:block">SolveSmart</span>
          </div>
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
