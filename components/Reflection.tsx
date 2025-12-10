import React from 'react';
import Icon from './Icon';
import { ReflectionArea } from '../types';

const areas: ReflectionArea[] = [
  { title: 'Actions', question: 'What steps do you take?', icon: 'ListOrdered' },
  { title: 'Stakeholders', question: 'Whom do you involve?', icon: 'Users' },
  { title: 'Approach', question: 'How do you adjust for different problems?', icon: 'Brain' },
  { title: 'Toolkit', question: 'Which resources do you use?', icon: 'Briefcase' },
  { title: 'Strengths', question: 'What do you do well?', icon: 'CheckCircle2' },
  { title: 'Opportunities', question: 'How might you improve?', icon: 'Lightbulb' },
];

const Reflection: React.FC = () => {
  return (
    <div className="py-16 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold">Self-Reflection</h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Being a collaborative leader means constantly evaluating your approach. 
            Consider these key areas to improve your problem-solving impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {areas.map((area, idx) => (
            <div key={idx} className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors border border-slate-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                  <Icon name={area.icon as any} size={24} />
                </div>
                <h3 className="text-xl font-bold">{area.title}</h3>
              </div>
              <p className="text-slate-300 italic">"{area.question}"</p>
              
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                 <textarea 
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-600 placeholder-slate-400 transition-colors"
                    rows={2}
                    placeholder="Enter your thoughts here..."
                 ></textarea>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reflection;