
import React, { useState, useRef, useEffect } from 'react';
import { 
  analyzeProblemStatement, 
  generateIssueTree, 
  generatePrioritization, 
  generateWorkplan, 
  generateSynthesis 
} from '../services/geminiService';
import { 
  SmartAnalysis, 
  IssueTreeResult, 
  PrioritizationResult, 
  WorkplanItem, 
  SynthesisResult,
  ChatMessage,
  FullReportData,
  IssueNode,
  ChatAction
} from '../types';
import Icon from './Icon';

interface ChatSessionProps {
  onComplete: (data: FullReportData) => void;
  initialData?: FullReportData | null;
}

const ChatSession: React.FC<ChatSessionProps> = ({ onComplete, initialData }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'define' | 'structure' | 'prioritize' | 'plan'>('define');
  const [isRefining, setIsRefining] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const [reportData, setReportData] = useState<FullReportData>(initialData || {
    originalProblem: '',
    smartAnalysis: null,
    issueTree: null,
    prioritization: null,
    workplan: null,
    synthesis: null
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const toggleNode = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInput(prev => prev + (prev ? '\n' : '') + text.substring(0, 500));
    };
    reader.readAsText(file);
  };

  const addMessage = (role: 'user' | 'assistant', content: string, type: ChatMessage['type'] = 'text', data?: any, actions?: ChatAction[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      type,
      content,
      data,
      actions,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleActionClick = async (actionValue: string) => {
    setMessages(prev => prev.map(msg => ({ ...msg, actions: undefined })));
    setActiveTooltipId(null);

    if (step === 'define') {
      if (actionValue === 'confirm_smart') {
         addMessage('user', 'Confirmed. Proceed to structure.');
         setTimeout(() => {
             addMessage('assistant', `Phase 2: **Structure**. How should we break down this challenge?`, 'text', null, [
                { 
                  label: 'Quantitative Drivers', 
                  value: 'type_formulaic', 
                  style: 'primary',
                  tooltip: 'Best for problems involving metrics, revenue, or costs. We will map the specific drivers that mathematically lead to your target.' 
                },
                { 
                  label: 'Qualitative Pillars', 
                  value: 'type_thematic', 
                  style: 'primary',
                  tooltip: 'Best for ambiguous strategic challenges like market positioning or organization. We will break this into distinct conceptual themes.' 
                }
             ]);
             setStep('structure');
         }, 400);
      } else if (actionValue === 'refine_smart') {
         setIsRefining(true);
         addMessage('assistant', 'Understood. What aspects of the objective need adjustment?');
         if (reportData.smartAnalysis?.improvedStatement) setInput(reportData.smartAnalysis.improvedStatement);
      }
    } else if (step === 'structure') {
       if (actionValue === 'type_formulaic' || actionValue === 'type_thematic') {
          const type = actionValue === 'type_formulaic' ? 'formulaic' : 'thematic';
          addMessage('user', actionValue === 'type_formulaic' ? 'Formulaic breakdown' : 'Thematic breakdown');
          await runStructureGeneration(type);
       } else if (actionValue === 'confirm_tree') {
          addMessage('user', 'Structure verified.');
          setStep('prioritize');
          await runPrioritization();
       } else if (actionValue === 'refine_tree') {
          setIsRefining(true);
          addMessage('assistant', 'How should we pivot the breakdown?');
       }
    } else if (step === 'prioritize') {
       if (actionValue === 'confirm_prioritization') {
          addMessage('user', 'Priorities approved.');
          setStep('plan');
          await runPlanGeneration();
       } else if (actionValue === 'refine_prioritization') {
          setIsRefining(true);
          addMessage('assistant', 'Which areas should we prioritize instead?');
       }
    } else if (step === 'plan') {
       if (actionValue === 'confirm_plan') {
          addMessage('user', 'Plan approved.');
          const synth = await generateSynthesis(reportData.smartAnalysis?.improvedStatement || '', '');
          const newReport = { ...reportData, synthesis: synth };
          setReportData(newReport);
          addMessage('assistant', 'Strategic intent synthesized. You can now access the full report or continue refining logic below.', 'synthesis', synth);
       }
    }
  };

  const runStructureGeneration = async (type: 'formulaic' | 'thematic', feedback?: string) => {
      setIsLoading(true);
      try {
        const tree = await generateIssueTree(reportData.smartAnalysis?.improvedStatement || reportData.originalProblem, type); 
        setReportData(prev => ({ ...prev, issueTree: tree }));
        addMessage('assistant', feedback ? 'Revised logic map:' : 'I have deconstructed your challenge into a logical pyramid of drivers:', 'issue-tree', tree);
        setTimeout(() => {
           addMessage('assistant', 'Does this structured breakdown align with your mental model?', 'text', null, [
             { label: '✅ Yes, Prioritize Now', value: 'confirm_tree', style: 'primary' },
             { label: '✍️ Refine Structure', value: 'refine_tree', style: 'secondary' }
           ]);
        }, 500);
      } catch(e) { addMessage('assistant', 'Structuring failed.'); } finally { setIsLoading(false); }
  };

  const runPrioritization = async (feedback?: string) => {
     setIsLoading(true);
     try {
        const issues: string[] = [];
        const traverse = (node: IssueNode) => {
           if (node.type === 'issue') issues.push(node.label);
           node.children?.forEach(traverse);
        };
        if (reportData.issueTree) traverse(reportData.issueTree.root);
        const priority = await generatePrioritization(issues); 
        setReportData(prev => ({ ...prev, prioritization: priority }));
        addMessage('assistant', feedback ? 'Revised prioritization:' : 'Applying the 80/20 rule to identify the high-impact factors:', 'matrix', priority);
        setTimeout(() => {
           addMessage('assistant', 'Are these the right levers for 80% impact?', 'text', null, [
             { label: '✅ Generate Plan', value: 'confirm_prioritization', style: 'primary' },
             { label: '✍️ Adjust Focus', value: 'refine_prioritization', style: 'secondary' }
           ]);
        }, 500);
     } catch(e) { addMessage('assistant', 'Prioritization failed.'); } finally { setIsLoading(false); }
  };

  const runPlanGeneration = async (feedback?: string) => {
     setIsLoading(true);
     try {
         const priorityIssues = reportData.prioritization?.items
            .filter(i => i.isParetoTop20 || i.quadrant === 'Quick Wins')
            .map(i => i.label).slice(0, 5) || [];
         const plan = await generateWorkplan(priorityIssues);
         setReportData(prev => ({ ...prev, workplan: plan }));
         addMessage('assistant', 'I have constructed a hypothesis-led action plan for the priority issues:', 'workplan', plan);
         setTimeout(() => {
            addMessage('assistant', 'Ready to finalize recommendations?', 'text', null, [
              { label: '✅ Final Synthesis', value: 'confirm_plan', style: 'primary' },
              { label: '✍️ Refine Plan', value: 'refine_plan', style: 'secondary' }
            ]);
         }, 500);
     } catch (e) { addMessage('assistant', 'Planning failed.'); } finally { setIsLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    addMessage('user', userText);

    if (reportData.synthesis) {
        setIsLoading(true);
        try {
            const newSynth = await generateSynthesis(reportData.smartAnalysis?.improvedStatement || reportData.originalProblem, `Additional Context: ${userText}`);
            setReportData(prev => ({ ...prev, synthesis: newSynth }));
            addMessage('assistant', 'Strategy evolved. Core recommendations updated.', 'synthesis', newSynth);
        } catch (e) { addMessage('assistant', 'Update failed.'); } finally { setIsLoading(false); }
        return;
    }

    if (isRefining) {
        setIsRefining(false);
        if (step === 'define') {
            setReportData(prev => ({ ...prev, originalProblem: userText }));
            await runSmartAnalysis(userText);
        } else if (step === 'structure') await runStructureGeneration('thematic', userText); 
        else if (step === 'prioritize') await runPrioritization(userText);
        else if (step === 'plan') await runPlanGeneration(userText);
        return;
    }

    if (step === 'define') {
       setReportData(prev => ({ ...prev, originalProblem: userText }));
       await runSmartAnalysis(userText);
    }
  };

  const runSmartAnalysis = async (problemText: string) => {
      setIsLoading(true);
      try {
          const analysis = await analyzeProblemStatement(problemText, '');
          setReportData(prev => ({ ...prev, smartAnalysis: analysis }));
          addMessage('assistant', 'Refining objective parameters for analytical precision:', 'smart-analysis', analysis, [
             { label: '✅ Proceed', value: 'confirm_smart', style: 'primary' },
             { label: '✍️ Refine Definition', value: 'refine_smart', style: 'secondary' }
          ]);
      } catch (error) { addMessage('assistant', 'Analysis failed.'); } finally { setIsLoading(false); }
  };

  // --- Renderers ---

  const renderSmartAnalysis = (data: SmartAnalysis) => (
    <div className="bg-white rounded-[24px] sm:rounded-[32px] modern-shadow border border-slate-100 overflow-hidden my-4 max-w-full sm:max-w-3xl w-full">
      <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center gap-2">
          <Icon name="Target" size={16} className="text-indigo-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objective Definition</span>
      </div>
      <div className="flex flex-col md:flex-row">
         <div className="p-5 sm:p-8 md:w-3/5 border-b md:border-b-0 md:border-r border-slate-50">
            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-2">Refined Statement</h4>
            <div className="text-slate-900 font-extrabold text-base sm:text-lg lg:text-xl leading-snug break-words">"{data.improvedStatement}"</div>
            <div className="mt-6 pt-6 border-t border-slate-50 flex gap-3">
               <div className="bg-indigo-100 p-2 rounded-xl h-fit flex-shrink-0">
                  <Icon name="Zap" className="text-indigo-600" size={16} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-indigo-700 uppercase mb-1">Critical Challenge</p>
                  <p className="text-[11px] sm:text-xs text-slate-600 font-medium italic leading-relaxed break-words">"{data.challengerQuestions[0]}"</p>
               </div>
            </div>
         </div>
         <div className="p-5 sm:p-8 md:w-2/5 bg-slate-50/30">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5 sm:gap-3">
               {[
                  { label: 'Specific', check: data.isSpecific },
                  { label: 'Measurable', check: data.isMeasurable },
                  { label: 'Actionable', check: data.isActionable },
                  { label: 'Time-bound', check: data.isTimeBound },
               ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3">
                     <div className={`p-1 rounded-full flex-shrink-0 ${item.check ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                        <Icon name={item.check ? "CheckCircle2" : "X"} size={10} className="text-white" />
                     </div>
                     <span className={`text-[10px] sm:text-sm font-bold ${item.check ? 'text-slate-800' : 'text-slate-400'}`}>{item.label}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );

  const renderIssueTree = (data: IssueTreeResult) => (
     <div className="bg-white rounded-[24px] sm:rounded-[32px] modern-shadow border border-slate-100 p-0 my-4 max-w-full sm:max-w-3xl w-full overflow-hidden">
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center gap-2">
           <Icon name="Layers" size={16} className="text-indigo-600" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Pyramid</span>
        </div>
        <div className="p-4 sm:p-8">
           <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center">
                <div className="bg-slate-900 text-white px-5 sm:px-6 py-3 rounded-2xl text-xs sm:text-base font-black shadow-lg text-center w-full max-w-sm sm:max-w-md break-words">
                  {data.root.label}
                  {data.root.explanation && <p className="text-[10px] font-bold text-slate-400 mt-1 lowercase italic leading-tight">{data.root.explanation}</p>}
                </div>
                <div className="h-4 sm:h-6 w-0.5 bg-slate-200"></div>
              </div>

              <div className="space-y-4">
                 {data.root.children?.map((cat, i) => (
                    <div key={cat.id || i} className="group/cat relative">
                       <div className="bg-indigo-50 border border-indigo-100 p-3 sm:p-4 rounded-2xl flex items-start gap-3">
                          <div className="bg-indigo-600 text-white p-1 rounded-lg mt-0.5 flex-shrink-0">
                            <Icon name="Layers" size={14} />
                          </div>
                          <div className="flex-grow">
                            <h5 className="text-[11px] sm:text-sm font-black text-indigo-900 break-words">{cat.label}</h5>
                            {cat.explanation && <p className="text-[10px] font-medium text-indigo-600 mt-1 leading-relaxed break-words">{cat.explanation}</p>}
                          </div>
                       </div>
                       
                       <div className="pl-4 sm:pl-6 ml-3 sm:ml-4 border-l-2 border-indigo-100/50 mt-2 space-y-3">
                          {cat.children?.map((issue, j) => (
                             <div key={issue.id || j} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm flex flex-col gap-1 transition-all hover:border-indigo-200">
                                <h6 className="text-[10px] sm:text-xs font-bold text-slate-800 break-words">{issue.label}</h6>
                                {issue.explanation && <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic break-words">"{issue.explanation}"</p>}
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
     </div>
  );

  const renderMatrix = (data: PrioritizationResult) => (
     <div className="bg-white rounded-[24px] sm:rounded-[32px] modern-shadow border border-slate-100 p-0 my-4 max-w-full sm:max-w-2xl w-full overflow-hidden">
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center gap-2">
           <Icon name="ListOrdered" size={16} className="text-indigo-600" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioritization</span>
        </div>
        <div className="p-4 sm:p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-[24px]">
                 <h5 className="text-[9px] font-black uppercase text-emerald-700 mb-3 tracking-widest">Quick Wins</h5>
                 <ul className="space-y-2">{data.items.filter(i => i.quadrant === 'Quick Wins').slice(0,3).map((item, idx) => (<li key={idx} className="text-[10px] sm:text-[11px] text-slate-900 font-bold leading-tight flex items-start gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div> <span className="break-words">{item.label}</span></li>))}</ul>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-[24px]">
                 <h5 className="text-[9px] font-black uppercase text-blue-700 mb-3 tracking-widest">Strategic Moves</h5>
                 <ul className="space-y-2">{data.items.filter(i => i.quadrant === 'Major Projects').slice(0,3).map((item, idx) => (<li key={idx} className="text-[10px] sm:text-[11px] text-slate-900 font-bold leading-tight flex items-start gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div> <span className="break-words">{item.label}</span></li>))}</ul>
              </div>
           </div>
           <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-bold italic break-words">{data.paretoSummary}</p>
        </div>
     </div>
  );

  const renderWorkplan = (data: WorkplanItem[]) => (
    <div className="bg-white rounded-[24px] sm:rounded-[32px] modern-shadow border border-slate-100 p-0 my-4 max-w-full sm:max-w-4xl w-full overflow-hidden">
       <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center gap-2">
          <Icon name="CalendarClock" size={16} className="text-indigo-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Action Plan</span>
       </div>
       
       {/* Mobile List View */}
       <div className="block sm:hidden p-4 space-y-4">
          {data.map((item, i) => (
             <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-start">
                   <h6 className="text-[11px] font-black text-slate-900 uppercase tracking-tight break-words">{item.issue}</h6>
                   <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase whitespace-nowrap">{item.timing}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Hypothesis</p>
                   <p className="text-[11px] text-slate-600 font-bold italic leading-relaxed break-words">"{item.hypothesis}"</p>
                </div>
             </div>
          ))}
       </div>

       {/* Desktop Table View */}
       <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-50/50 text-slate-400 font-black text-[9px] uppercase tracking-widest">
                <tr><th className="px-6 py-4">Action Item</th><th className="px-6 py-4">Goal / Hypothesis</th><th className="px-6 py-4">Timing</th></tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {data.map((item, i) => (
                   <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-xs text-slate-900 leading-tight break-words max-w-[180px]">{item.issue}</td>
                      <td className="px-6 py-4 text-[11px] text-slate-500 font-bold italic break-words leading-relaxed">"{item.hypothesis}"</td>
                      <td className="px-6 py-4 text-[10px] text-indigo-600 font-black uppercase tracking-tighter whitespace-nowrap">{item.timing}</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderSynthesis = (data: SynthesisResult) => (
     <div className="bg-indigo-600 rounded-[24px] sm:rounded-[40px] modern-shadow p-6 sm:p-10 my-4 max-w-full sm:max-w-2xl w-full text-white">
        <div className="flex items-center gap-4 mb-6">
           <div className="bg-white/10 p-3 rounded-[20px] backdrop-blur-md">
              <Icon name="Target" size={24} className="text-white" />
           </div>
           <h4 className="font-black text-xl sm:text-2xl tracking-tighter">Strategic Intent</h4>
        </div>
        <p className="text-indigo-50 mb-8 font-black text-lg sm:text-xl leading-snug break-words">"{data.recommendation.text}"</p>
        <button onClick={() => onComplete(reportData)} className="w-full bg-white text-indigo-600 px-6 py-4 rounded-[20px] text-[11px] sm:text-sm font-black shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 active:scale-95">
           Unlock Final Strategy <Icon name="ArrowRight" size={18} />
        </button>
     </div>
  );

  if (!hasAcceptedDisclaimer && !initialData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 py-10 animate-fade-in bg-[#fcfcfd]">
        <div className="max-w-2xl w-full bg-white rounded-[32px] sm:rounded-[40px] modern-shadow p-8 sm:p-16 border border-slate-100 flex flex-col items-center text-center">
          <div className="bg-indigo-50 p-5 rounded-[28px] mb-8 shadow-inner text-indigo-600">
            <Icon name="Brain" size={32} />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter mb-6">The Map is Not the Terrain.</h2>
          <div className="space-y-6 text-slate-500 font-bold leading-relaxed mb-10 text-sm sm:text-lg">
            <p>Logic is a lantern in a complex landscape. It reveals paths, but it does not walk them for you.</p>
            <div className="bg-slate-50 p-5 sm:p-6 rounded-[28px] border border-slate-100 text-left text-[10px] sm:text-xs font-bold text-slate-700 italic space-y-4">
              <p><strong>Strategic & Legal Notice:</strong> This system uses probabilistic AI inference to help you structure your thinking. It possesses no legal authority or professional certification.</p>
              <p className="text-slate-900 not-italic">By proceeding, you assume full responsibility for any business decisions made based on this session.</p>
            </div>
          </div>
          <button onClick={() => setHasAcceptedDisclaimer(true)} className="w-full bg-slate-900 text-white px-6 sm:px-8 py-5 rounded-[24px] font-black uppercase text-[11px] sm:text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 flex items-center justify-center gap-3">
            Accept & Start Session <Icon name="ArrowRight" size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 sm:px-6 py-10 animate-fade-in bg-[#fcfcfd]">
         <div className="mb-10 sm:mb-12 text-center space-y-4 max-w-2xl">
            <h2 className="text-3xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-tight">Think clear.</h2>
            <p className="text-slate-500 text-sm sm:text-xl font-bold leading-relaxed">Deconstruct complex business challenges with rigorous logical frameworks and a clear path to impact.</p>
         </div>
         <div className="w-full max-w-3xl">
            <div className="relative group">
               <div className="relative flex flex-col items-stretch bg-white border border-slate-100 rounded-[28px] sm:rounded-[36px] shadow-2xl shadow-slate-200/50 transition-all group-focus-within:ring-4 group-focus-within:ring-indigo-50 group-focus-within:border-indigo-200 overflow-hidden">
                  <div className="flex items-center flex-grow">
                     <textarea 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                        placeholder="Describe your current challenge..." 
                        className="flex-grow bg-transparent border-none text-slate-800 placeholder-slate-400 focus:ring-0 text-base sm:text-xl font-bold py-8 px-8 sm:py-10 sm:px-10 resize-none min-h-[140px] sm:min-h-[180px]" 
                        autoFocus 
                        rows={4}
                     />
                  </div>
                  <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-slate-50/50 border-t border-slate-100">
                     <div className="flex items-center gap-2">
                       <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all" title="Upload context">
                          <Icon name="Paperclip" size={22} />
                       </button>
                       <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all" title="Voice Input">
                          <Icon name="Mic" size={22} />
                       </button>
                     </div>
                     <button onClick={handleSend} disabled={!input.trim() || isLoading} className={`px-6 sm:px-8 py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 font-black text-[11px] sm:text-sm uppercase tracking-widest ${input.trim() ? 'bg-slate-900 text-white hover:scale-105 shadow-indigo-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>
                        Analyze <Icon name="ArrowRight" size={18} />
                     </button>
                  </div>
               </div>
            </div>
         </div>
         <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.json" onChange={handleFileUpload} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto bg-white rounded-none sm:rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative" onClick={() => setActiveTooltipId(null)}>
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 sm:p-12 space-y-8 scroll-smooth bg-[#fcfcfd]/50 pb-72 sm:pb-80">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col animate-fade-in">
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full overflow-hidden`}>
                {msg.type === 'text' && (
                  <div className={`px-5 sm:px-6 py-3.5 rounded-[24px] sm:rounded-[28px] max-w-[95%] sm:max-w-lg shadow-sm text-[13px] sm:text-sm font-bold leading-relaxed break-words ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-indigo-100/10'}`}>
                    {msg.content}
                  </div>
                )}
                {msg.type === 'smart-analysis' && msg.data && renderSmartAnalysis(msg.data)}
                {msg.type === 'issue-tree' && msg.data && renderIssueTree(msg.data)}
                {msg.type === 'matrix' && msg.data && renderMatrix(msg.data)}
                {msg.type === 'workplan' && msg.data && renderWorkplan(msg.data)}
                {msg.type === 'synthesis' && msg.data && renderSynthesis(msg.data)}
                
                {msg.actions && (
                  <div className="mt-4 flex flex-col md:flex-row md:items-start gap-4 w-full mb-12">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {msg.actions.map((action, idx) => {
                        const tooltipId = `${msg.id}-${idx}`;
                        const hasTooltip = !!action.tooltip;
                        return (
                          <div key={idx} className="flex items-center gap-1.5">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleActionClick(action.value); 
                              }} 
                              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95 shadow-lg relative z-[20] ${action.style === 'secondary' ? 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
                            >
                              {action.label}
                            </button>
                            {hasTooltip && (
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setActiveTooltipId(activeTooltipId === tooltipId ? null : tooltipId); 
                                }} 
                                className={`p-2 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 transition-all relative z-[20] ${activeTooltipId === tooltipId ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : ''}`} 
                                title="Why this?"
                              >
                                <Icon name="AlertCircle" size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {msg.actions.some((a, i) => `${msg.id}-${i}` === activeTooltipId) && (
                      <div className="animate-fade-in w-full md:w-64 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-white/10 z-[100] relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-indigo-400">
                             <Icon name="Lightbulb" size={14} />
                             <span className="uppercase tracking-widest text-[9px] font-black">Methodology</span>
                          </div>
                          <button onClick={() => setActiveTooltipId(null)} className="text-slate-500 hover:text-white transition-colors">
                            <Icon name="X" size={14} />
                          </button>
                        </div>
                        <p className="text-[11px] font-bold leading-relaxed text-slate-300">
                          {msg.actions.find((_, i) => `${msg.id}-${i}` === activeTooltipId)?.tooltip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <span className="text-[8px] sm:text-[9px] font-black text-slate-300 mt-2 px-1 uppercase tracking-[0.2em]">{msg.role === 'assistant' ? 'Partner' : 'Me'}</span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (<div className="flex justify-start mb-10"><div className="bg-white px-5 py-3 rounded-[24px] rounded-bl-none border border-slate-100 shadow-xl flex items-center gap-2.5"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-300"></div></div></div>)}
      </div>
      
      {/* Fixed Bottom Input Bar Container */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-10 pb-6 sm:pb-10 px-4 sm:px-10 z-[110] pointer-events-none">
        <div className="max-w-4xl mx-auto relative flex flex-col bg-white border-2 border-slate-100 rounded-[32px] sm:rounded-[40px] p-2.5 sm:p-5 transition-all focus-within:ring-8 focus-within:ring-indigo-50/50 focus-within:border-indigo-100 shadow-2xl shadow-slate-200/50 pointer-events-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3">
             <div className="flex-grow flex items-start">
                <div className="flex flex-col gap-1 flex-shrink-0 mt-2 sm:mt-2.5">
                   <button onClick={() => fileInputRef.current?.click()} className="p-3 sm:p-4 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-all" title="Upload context"><Icon name="Paperclip" size={22} /></button>
                   <button className="p-3 sm:p-4 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-all" title="Voice Input"><Icon name="Mic" size={22} /></button>
                </div>
                <textarea 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                  placeholder={reportData.synthesis ? "Adjust strategic intent..." : isRefining ? "What specifically should we change?" : "Deconstruct your challenge here..."} 
                  className="w-full bg-transparent border-none p-4 sm:p-6 text-sm sm:text-lg text-slate-900 placeholder-slate-400 focus:ring-0 font-bold resize-none max-h-[180px] sm:max-h-[220px] min-h-[80px] sm:min-h-[120px] leading-relaxed" 
                  rows={2} 
                />
             </div>
             <div className="flex justify-end items-center gap-3 pr-2 pb-2">
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isLoading} 
                  className="p-4 sm:p-5 bg-slate-900 text-white rounded-3xl sm:rounded-[32px] hover:bg-black disabled:opacity-30 transition-all shadow-2xl shadow-slate-900/20 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center active:scale-95 group"
                >
                  <Icon name="ArrowRight" size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.json" onChange={handleFileUpload} />
    </div>
  );
};

export default ChatSession;
