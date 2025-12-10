import React from 'react';
import Icon from './Icon';

interface AboutModalProps {
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Icon name="X" size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Icon name="Brain" className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">About SolveSmart</h2>
        </div>

        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            We utilize <strong>World-Class Problem Solving Best Practices</strong> derived from top-tier strategy consulting firms.
          </p>
          <p>
            Our hypothesis-led approach forces you to step back, define the real problem (not just the symptom), structure it logically, and prioritize efforts where they matter most.
          </p>
          <ul className="space-y-2 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <li className="flex items-center gap-2">
              <Icon name="Target" size={16} className="text-indigo-600" />
              <span className="text-sm font-medium">SMART Problem Definition</span>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="Layers" size={16} className="text-indigo-600" />
              <span className="text-sm font-medium">MECE Structuring</span>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="ListOrdered" size={16} className="text-indigo-600" />
              <span className="text-sm font-medium">80/20 Prioritization</span>
            </li>
          </ul>
        </div>
        
        <div className="mt-8 text-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;