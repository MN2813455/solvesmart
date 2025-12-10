import React, { useState } from 'react';
import Icon from './Icon';
import { TimeHorizon } from '../types';

const TimeHorizons: React.FC = () => {
  const [selectedHorizon, setSelectedHorizon] = useState<TimeHorizon>(TimeHorizon.MOMENT);

  const horizonData = {
    [TimeHorizon.MOMENT]: {
      description: "High urgency, limited time. Focus on immediate alignment and defining the core issue.",
      keyFocus: ["Problem Definition", "Stakeholder Alignment", "Scope Control"],
      challenges: ["Imperfect information", "Bias to action over thought", "High stress"],
      icon: "Zap",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200"
    },
    [TimeHorizon.SHORT_TERM]: {
      description: "1-2 weeks. Allows for prioritization and some analysis, but requires strict efficiency.",
      keyFocus: ["Prioritize Issues", "Rapid Analysis", "80/20 Rule"],
      challenges: ["Too many potential paths", "Time management", "Balancing depth vs. speed"],
      icon: "Clock",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    [TimeHorizon.LONG_TERM]: {
      description: "Projects spanning months. High complexity and high value at stake.",
      keyFocus: ["Detailed Workplan", "Dependency Management", "Long-term Stakeholder Management"],
      challenges: ["Complexity creep", "Maintaining alignment", "Knock-on effects of early decisions"],
      icon: "CalendarClock",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200"
    }
  };

  const current = horizonData[selectedHorizon];

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900">Problem-Solving Time Horizons</h2>
        <p className="mt-4 text-slate-500">
          How you approach a problem depends heavily on the time available to solve it.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 p-1 rounded-xl inline-flex">
          {Object.values(TimeHorizon).map((horizon) => (
            <button
              key={horizon}
              onClick={() => setSelectedHorizon(horizon)}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                selectedHorizon === horizon
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {horizon}
            </button>
          ))}
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out transform`}>
        <div className={`rounded-3xl border-2 ${current.borderColor} overflow-hidden shadow-lg bg-white`}>
          <div className={`p-8 ${current.bgColor}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 bg-white rounded-full shadow-sm ${current.color}`}>
                <Icon name={current.icon as any} size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{selectedHorizon}</h3>
            </div>
            <p className="text-lg text-slate-700 max-w-3xl">{current.description}</p>
          </div>

          <div className="p-8 grid md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Critical Actions</h4>
              <ul className="space-y-3">
                {current.keyFocus.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Icon name="CheckCircle2" className="text-teal-500 w-5 h-5 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Common Pitfalls</h4>
              <ul className="space-y-3">
                {current.challenges.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Icon name="AlertCircle" className="text-rose-500 w-5 h-5 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeHorizons;
