
import React from 'react';
import { FullReportData } from '../types';
import Icon from './Icon';

interface ReportViewProps {
  data: FullReportData;
  onBack: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ data, onBack }) => {
  const handlePrint = () => { window.print(); };

  return (
    <div className="bg-[#fcfcfd] py-6 sm:py-12 px-4 sm:px-6 print:bg-white print:p-0">
      {/* Toolbar */}
      <div className="max-w-5xl mx-auto mb-8 sm:mb-10 flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
        <button 
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center gap-3 text-slate-900 hover:text-indigo-600 font-black text-[11px] sm:text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl bg-white transition-all soft-shadow border border-slate-100"
        >
          <Icon name="ChevronRight" className="rotate-180" size={16} /> Back to Discussion
        </button>
        <button 
          onClick={handlePrint}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          <Icon name="Printer" size={16} /> Save as PDF
        </button>
      </div>

      {/* Modern Report Canvas */}
      <div className="max-w-5xl mx-auto bg-white modern-shadow rounded-[32px] sm:rounded-[48px] p-6 sm:p-16 print:shadow-none print:w-full print:max-w-none border border-slate-100">
        
        {/* Header */}
        <header className="border-b-[3px] border-slate-900 pb-8 sm:pb-12 mb-10 sm:mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <div className="bg-slate-900 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-4 inline-block">Strategic Plan</div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-3 tracking-tighter leading-none">Analysis Summary</h1>
            <p className="text-slate-400 font-bold text-base sm:text-xl tracking-tight">Structured by Rationalist</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em] mb-1">Date</p>
            <p className="font-black text-slate-900 text-lg sm:text-2xl">{new Date().toLocaleDateString()}</p>
          </div>
        </header>

        {/* Answer-First Section */}
        {data.synthesis && (
          <section className="mb-12 sm:mb-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
                <Icon name="Target" size={20} />
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">The Recommendation</h2>
            </div>
            
            <div className="bg-slate-900 text-white p-8 sm:p-16 rounded-[40px] shadow-2xl relative overflow-hidden mb-12">
               <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
                  <Icon name="CheckCircle2" size={150} />
               </div>
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6">Core Action</h3>
               <p className="text-2xl sm:text-4xl font-black leading-tight mb-12">"{data.synthesis.recommendation.text}"</p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  <div className="space-y-5">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-3">Action Steps</h4>
                     <ul className="text-xs sm:text-sm font-bold text-slate-300 space-y-3">
                        {data.synthesis.recommendation.actionableSteps.map((s, i) => <li key={i} className="flex gap-3"><span className="text-indigo-500 flex-shrink-0 font-black">•</span> <span>{s}</span></li>)}
                     </ul>
                  </div>
                  <div className="space-y-5">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-3">Key Stakeholders</h4>
                     <ul className="text-xs sm:text-sm font-bold text-slate-300 space-y-3">
                        {data.synthesis.recommendation.stakeholders.map((s, i) => <li key={i} className="flex gap-3"><span className="text-indigo-500 flex-shrink-0 font-black">•</span> <span>{s}</span></li>)}
                     </ul>
                  </div>
                  <div className="space-y-5">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-3">Resources Needed</h4>
                     <ul className="text-xs sm:text-sm font-bold text-slate-300 space-y-3">
                        {data.synthesis.recommendation.resources.map((s, i) => <li key={i} className="flex gap-3"><span className="text-indigo-500 flex-shrink-0 font-black">•</span> <span>{s}</span></li>)}
                     </ul>
                  </div>
               </div>
            </div>

            <div className="bg-indigo-50 p-8 sm:p-12 rounded-[32px] border border-indigo-100">
               <span className="font-black text-indigo-600 uppercase text-[10px] tracking-[0.4em] block mb-4">Summary Insight</span>
               <p className="text-indigo-900 font-black text-lg sm:text-2xl leading-relaxed italic">
                 {data.synthesis.synthesis}
               </p>
            </div>
          </section>
        )}

        {/* 2. Parameters Section */}
        <section className="mb-12 sm:mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
               <Icon name="Search" size={20} />
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">Objective Parameters</h2>
          </div>
          
          <div className="bg-slate-50 p-6 sm:p-12 rounded-[32px] border-l-[6px] border-indigo-600 mb-10">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Final Objective Statement</h3>
            <p className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
              "{data.smartAnalysis?.improvedStatement || "Not defined"}"
            </p>
          </div>
        </section>

        {/* 3. Logic Map Section */}
        {data.issueTree && (
          <section className="mb-12 sm:mb-20 break-inside-avoid">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
                <Icon name="Layers" size={20} />
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">Logic Map</h2>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-6 sm:p-12 overflow-hidden">
               <div className="flex flex-col items-center">
                  <div className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black text-xl shadow-2xl mb-12 text-center">{data.issueTree.root.label}</div>
                  <div className="flex flex-wrap justify-center gap-12 lg:gap-16 w-full">
                    {data.issueTree.root.children?.map((cat, idx) => (
                       <div key={idx} className="flex flex-col items-center min-w-[200px]">
                          <div className="bg-white text-indigo-700 border-2 border-indigo-100 px-6 py-3 rounded-[20px] font-black text-sm mb-6 shadow-md w-full text-center">
                             {cat.label}
                          </div>
                          {cat.children && (
                             <ul className="space-y-3 w-full">
                                {cat.children.map((issue, cIdx) => (
                                   <li key={cIdx} className="text-xs text-slate-500 bg-white border border-slate-100 px-5 py-3 rounded-xl font-black shadow-sm leading-tight hover:border-indigo-200 transition-colors text-center">
                                      {issue.label}
                                   </li>
                                ))}
                             </ul>
                          )}
                       </div>
                    ))}
                  </div>
               </div>
            </div>
          </section>
        )}

        <footer className="mt-20 sm:mt-24 pt-10 border-t border-slate-100 text-center">
           <p className="text-[9px] text-slate-300 uppercase font-black tracking-[0.5em] leading-relaxed">Generated by Rationalist Professional Strategy Engine</p>
        </footer>
      </div>
    </div>
  );
};

export default ReportView;
