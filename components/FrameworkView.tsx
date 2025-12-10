import React from 'react';
import Icon, { Icons } from './Icon';
import { StepDefinition } from '../types';

const steps: StepDefinition[] = [
  { id: 1, title: 'Define Problem', action: 'Think Impact', question: 'What do we need to know?', icon: 'Target' },
  { id: 2, title: 'Structure Problem', action: 'Think Breaking Down', question: 'What are the key elements?', icon: 'Layers' },
  { id: 3, title: 'Prioritize Issues', action: 'Think Speed', question: 'Which issues are most important?', icon: 'ListOrdered' },
  { id: 4, title: 'Develop Workplan', action: 'Think Efficiency', question: 'Where/How should we spend time?', icon: 'CalendarClock' },
  { id: 5, title: 'Conduct Analyses', action: 'Think Evidence', question: 'What are we trying to prove?', icon: 'Search' },
  { id: 6, title: 'Synthesize Findings', action: 'Think "So What"', question: 'What implications do findings have?', icon: 'Lightbulb' },
  { id: 7, title: 'Develop Recommendations', action: 'Think Solution', question: 'What should we do?', icon: 'FileText' },
];

const FrameworkView: React.FC = () => {
  return (
    <div className="py-12 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Strategic Problem Solving Process</h2>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500">
          A hypothesis-led methodology to navigate complex challenges efficiently, used by top strategy consultants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 transform -translate-y-1/2 rounded-full"></div>

        {steps.map((step) => (
          <div key={step.id} className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -top-4 -left-4 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg border-4 border-white">
              {step.id}
            </div>
            
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Icon name={step.icon as keyof typeof Icons} className="text-indigo-600 w-8 h-8" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
            
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold uppercase tracking-wider rounded-full">
                {step.action}
              </span>
            </div>
            
            <p className="text-slate-600 italic border-l-4 border-slate-200 pl-3">
              "{step.question}"
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-slate-50 rounded-2xl p-8 border border-slate-200">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 bg-white p-4 rounded-full shadow-md">
            <Icon name="AlertCircle" className="text-amber-500 w-12 h-12" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">The Critical First Step</h4>
            <p className="text-slate-600">
              All problem-solving efforts begin with <strong>defining the problem</strong>. Without this, you risk solving the wrong issue, relying on bias, or biting off more than you can chew.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameworkView;