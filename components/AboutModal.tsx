
import React from 'react';
import Icon from './Icon';

interface AboutModalProps {
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fade-in text-left">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Icon name="X" size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-slate-900 p-2 rounded-lg">
            <Icon name="Target" size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">About Rationalist</h2>
        </div>

        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            <strong>Rationalist</strong> is a strategic guide that helps you break down complex challenges into simple, actionable steps.
          </p>
          <p>
            Instead of jumping to a quick answer, we follow a proven methodology to ensure we solve the right problem with the best logic.
          </p>
          <ul className="space-y-2 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <li className="flex items-center gap-2">
              <Icon name="Target" size={16} className="text-indigo-600" />
              <span className="text-sm font-medium">Clear Problem Definition</span>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="Layers" size={16} className="text-indigo-600" />
              <span className="text-sm font-medium">Step-by-Step Logic Maps</span>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="ListOrdered" size={16} className="text-indigo-600" />
              <span className="text-sm font-medium">High-Impact Action Plans</span>
            </li>
          </ul>
        </div>
        
        <div className="mt-8 text-center border-t border-slate-50 pt-6">
          <button 
            onClick={onClose}
            className="w-full px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
