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
}

const ChatSession: React.FC<ChatSessionProps> = ({ onComplete }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'define' | 'structure' | 'prioritize' | 'plan'>('define');
  
  // Refinement State
  const [isRefining, setIsRefining] = useState(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  
  // Data State for Report
  const [reportData, setReportData] = useState<FullReportData>({
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
  }, [messages, isLoading, waitingForConfirmation]);

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
    setWaitingForConfirmation(false);
    
    // Clear actions from previous messages
    setMessages(prev => prev.map(msg => ({ ...msg, actions: undefined })));

    // --- STEP 1: DEFINE ---
    if (step === 'define') {
      if (actionValue === 'confirm_smart') {
         addMessage('user', 'Yes, that looks correct.');
         setTimeout(() => {
             addMessage('assistant', `To structure this effectively, how would you classify this problem?`, 'text', null, [
                { label: 'Structured (Formulaic)', value: 'type_structured', style: 'primary' },
                { label: 'Nebulous (Complex)', value: 'type_nebulous', style: 'primary' }
             ]);
             setStep('structure');
         }, 500);
      } else if (actionValue === 'refine_smart') {
         setIsRefining(true);
         addMessage('user', 'I need to refine it.');
         addMessage('assistant', 'Please provide the corrected problem statement or clarify what is missing.');
         if (reportData.smartAnalysis?.improvedStatement) {
           setInput(reportData.smartAnalysis.improvedStatement);
         }
      }
    
    // --- STEP 2: STRUCTURE ---
    } else if (step === 'structure') {
       if (actionValue === 'type_structured' || actionValue === 'type_nebulous') {
          const type = actionValue === 'type_structured' ? 'structured' : 'nebulous';
          addMessage('user', actionValue === 'type_structured' ? 'Structured' : 'Nebulous / Complex');
          await runStructureGeneration(type);
       } else if (actionValue === 'confirm_tree') {
          addMessage('user', 'Yes, let\'s prioritize.');
          setStep('prioritize');
          await runPrioritization();
       } else if (actionValue === 'refine_tree') {
          setIsRefining(true);
          addMessage('user', 'I want to adjust the structure.');
          addMessage('assistant', 'What changes would you like to make to the issue tree?');
       }
    
    // --- STEP 3: PRIORITIZE ---
    } else if (step === 'prioritize') {
       if (actionValue === 'confirm_prioritization') {
          addMessage('user', 'Prioritization looks good.');
          setStep('plan');
          await runPlanGeneration();
       } else if (actionValue === 'refine_prioritization') {
          setIsRefining(true);
          addMessage('user', 'I want to adjust the priorities.');
          addMessage('assistant', 'Which issues should be moved or re-prioritized?');
       }

    // --- STEP 4: PLAN ---
    } else if (step === 'plan') {
       if (actionValue === 'confirm_plan') {
          addMessage('user', 'Plan approved. Generate report.');
          const synth = await generateSynthesis(reportData.smartAnalysis?.improvedStatement || '', '');
          setReportData(prev => ({ ...prev, synthesis: synth }));
          addMessage('assistant', 'Here is your strategic recommendation.', 'synthesis', synth);
       } else if (actionValue === 'refine_plan') {
          setIsRefining(true);
          addMessage('user', 'I want to adjust the plan.');
          addMessage('assistant', 'What updates do you want to make to the workplan?');
       }
    }
  };

  // --- Generation Helpers ---

  const runStructureGeneration = async (type: 'structured' | 'nebulous', feedback?: string) => {
      setIsLoading(true);
      try {
        const tree = await generateIssueTree(
            reportData.smartAnalysis?.improvedStatement || reportData.originalProblem, 
            type
        ); 
        
        setReportData(prev => ({ ...prev, issueTree: tree }));
        addMessage('assistant', feedback ? 'Here is the updated structure.' : 'Here is the MECE structural breakdown.', 'issue-tree', tree);
        
        setTimeout(() => {
           addMessage('assistant', 'Does this structure look logical?', 'text', null, [
             { label: 'Yes, Prioritize', value: 'confirm_tree', style: 'primary' },
             { label: 'Refine / Comment', value: 'refine_tree', style: 'secondary' }
           ]);
        }, 600);
      } catch(e) { 
        addMessage('assistant', 'Error generating tree.'); 
      } finally { setIsLoading(false); }
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
        addMessage('assistant', feedback ? 'Updated prioritization matrix.' : 'I have prioritized the issues using the 80/20 rule.', 'matrix', priority);
        
        setTimeout(() => {
           addMessage('assistant', 'Does this prioritization align with your goals?', 'text', null, [
             { label: 'Yes, Create Plan', value: 'confirm_prioritization', style: 'primary' },
             { label: 'Refine / Comment', value: 'refine_prioritization', style: 'secondary' }
           ]);
        }, 600);
     } catch(e) { addMessage('assistant', 'Error prioritizing.'); }
     finally { setIsLoading(false); }
  };

  const runPlanGeneration = async (feedback?: string) => {
     setIsLoading(true);
     try {
         const priorityIssues = reportData.prioritization?.items
            .filter(i => i.isParetoTop20 || i.quadrant === 'Quick Wins')
            .map(i => i.label).slice(0, 5) || [];

         const plan = await generateWorkplan(priorityIssues);
         setReportData(prev => ({ ...prev, workplan: plan }));
         
         addMessage('assistant', feedback ? 'Updated workplan.' : 'Here is the hypothesis-led workplan.', 'workplan', plan);
         
         setTimeout(() => {
            addMessage('assistant', 'Ready to finalize recommendations?', 'text', null, [
              { label: 'Yes, Synthesize', value: 'confirm_plan', style: 'primary' },
              { label: 'Refine / Comment', value: 'refine_plan', style: 'secondary' }
            ]);
         }, 600);
     } catch (e) { addMessage('assistant', 'Error planning.'); }
     finally { setIsLoading(false); }
  };

  // --- Main Input Handler ---

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    addMessage('user', userText);

    // --- REFINEMENT MODE ---
    if (isRefining) {
        setIsRefining(false);
        if (step === 'define') {
            setReportData(prev => ({ ...prev, originalProblem: userText }));
            await runSmartAnalysis(userText);
        } else if (step === 'structure') {
            await runStructureGeneration('nebulous', userText); 
        } else if (step === 'prioritize') {
            await runPrioritization(userText);
        } else if (step === 'plan') {
            await runPlanGeneration(userText);
        }
        return;
    }

    // --- NORMAL FLOW (START) ---
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
          
          addMessage('assistant', 'I have analyzed your problem statement. Please review the SMART criteria.', 'smart-analysis', analysis, [
             { label: '✅ Yes, Proceed', value: 'confirm_smart', style: 'primary' },
             { label: '✍️ Refine / Comment', value: 'refine_smart', style: 'secondary' }
          ]);
          setWaitingForConfirmation(true);
      } catch (error) {
          addMessage('assistant', 'Error during analysis.');
      } finally {
          setIsLoading(false);
      }
  };

  // --- Renderers ---

  const renderSmartAnalysis = (data: SmartAnalysis) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden my-2 max-w-3xl w-full">
      <div className="flex flex-col md:flex-row">
         <div className="p-5 md:w-3/5 border-b md:border-b-0 md:border-r border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Improved Statement</h4>
            <div className="text-slate-900 font-medium text-base leading-relaxed">
               "{data.improvedStatement}"
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
               <Icon name="Zap" className="text-amber-500 flex-shrink-0" size={16} />
               <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Challenger Question</p>
                  <p className="text-xs text-slate-600 italic">"{data.challengerQuestions[0]}"</p>
               </div>
            </div>
         </div>
         <div className="p-5 md:w-2/5 bg-slate-50/50">
            <div className="space-y-2">
               {[
                  { label: 'Specific', check: data.isSpecific },
                  { label: 'Measurable', check: data.isMeasurable },
                  { label: 'Actionable', check: data.isActionable },
                  { label: 'Relevant', check: data.isRelevant },
                  { label: 'Time-bound', check: data.isTimeBound },
               ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                     <Icon name={item.check ? "CheckCircle2" : "X"} size={14} className={item.check ? "text-emerald-500" : "text-slate-300"} />
                     <span className={`text-xs font-medium ${item.check ? 'text-slate-700' : 'text-slate-400'}`}>{item.label}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );

  const renderIssueTree = (data: IssueTreeResult) => (
     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 my-2 max-w-3xl w-full overflow-x-auto">
        <div className="flex flex-col items-center min-w-[500px]">
           <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium mb-4 shadow-sm">{data.root.label}</div>
           <div className="flex gap-4 justify-center w-full">
              {data.root.children?.map((cat, i) => (
                 <div key={i} className="flex flex-col items-center">
                    <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-md text-xs font-bold mb-2">{cat.label}</div>
                    <div className="flex flex-col gap-1.5">
                       {cat.children?.map((issue, j) => (
                          <div key={j} className="bg-white border border-slate-100 text-slate-600 text-[10px] px-2 py-1.5 rounded shadow-sm text-center w-[130px] leading-tight">
                             {issue.label}
                          </div>
                       ))}
                    </div>
                 </div>
              ))}
           </div>
        </div>
     </div>
  );

  const renderMatrix = (data: PrioritizationResult) => (
     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 my-2 max-w-2xl w-full">
        <div className="grid grid-cols-2 gap-3 mb-3">
           <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg">
              <h5 className="text-[10px] font-bold uppercase text-emerald-700 mb-2">Quick Wins</h5>
              <ul className="space-y-1">
                {data.items.filter(i => i.quadrant === 'Quick Wins').slice(0,3).map((item, idx) => (
                   <li key={idx} className="text-xs text-slate-800">• {item.label}</li>
                ))}
              </ul>
           </div>
           <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg">
              <h5 className="text-[10px] font-bold uppercase text-blue-700 mb-2">Major Projects</h5>
              <ul className="space-y-1">
                {data.items.filter(i => i.quadrant === 'Major Projects').slice(0,3).map((item, idx) => (
                   <li key={idx} className="text-xs text-slate-800">• {item.label}</li>
                ))}
              </ul>
           </div>
        </div>
        <p className="text-xs text-slate-500 px-1">
           <span className="font-bold text-slate-700">80/20 Insight:</span> {data.paretoSummary}
        </p>
     </div>
  );

  const renderWorkplan = (data: WorkplanItem[]) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-0 my-2 max-w-3xl w-full overflow-hidden">
       <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Icon name="CalendarClock" size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-600 uppercase">Workplan</span>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
             <thead className="text-slate-400 font-medium">
                <tr>
                   <th className="px-4 py-2 font-normal">Issue</th>
                   <th className="px-4 py-2 font-normal">Hypothesis</th>
                   <th className="px-4 py-2 font-normal">Timing</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {data.map((item, i) => (
                   <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{item.issue}</td>
                      <td className="px-4 py-2.5 text-slate-500 italic max-w-xs truncate">{item.hypothesis}</td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{item.timing}</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderSynthesis = (data: SynthesisResult) => (
     <div className="bg-indigo-600 rounded-2xl shadow-lg p-6 my-2 max-w-2xl w-full text-white">
        <div className="flex items-center gap-3 mb-4">
           <div className="bg-white/20 p-2 rounded-lg"><Icon name="Target" size={24} className="text-white" /></div>
           <h4 className="font-bold text-xl">Recommendation</h4>
        </div>
        <p className="text-indigo-50 mb-6 font-medium text-lg leading-relaxed">{data.recommendation.text}</p>
        <button 
          onClick={() => onComplete(reportData)}
          className="w-full bg-white text-indigo-600 px-4 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
        >
           View Full Report <Icon name="ArrowRight" size={16} />
        </button>
     </div>
  );

  // --- INITIAL START SCREEN ---
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[80vh] w-full px-4 animate-fade-in bg-slate-50">
         
         <div className="mb-8 text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">What can I help you solve?</h2>
         </div>

         <div className="w-full max-w-2xl">
            <div className="relative group">
               {/* Dark Input Bar */}
               <div className="relative flex items-center bg-zinc-800 rounded-full shadow-xl transition-all hover:ring-2 hover:ring-zinc-700/50">
                  
                  {/* Plus/Sparkle */}
                  <div className="pl-5 pr-3 text-zinc-400">
                     <Icon name="Sparkles" size={20} />
                  </div>

                  {/* Input */}
                  <input
                     type="text"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                           handleSend();
                        }
                     }}
                     placeholder="Ask anything..."
                     className="flex-grow bg-transparent border-none text-zinc-100 placeholder-zinc-500 focus:ring-0 text-lg py-4 h-14"
                     autoFocus
                  />

                  {/* Actions */}
                  <div className="flex items-center gap-3 pr-2">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors"
                        title="Upload context"
                     >
                        <Icon name="Paperclip" size={20} />
                     </button>
                     
                     <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`p-2 rounded-full transition-all flex items-center justify-center ${
                           input.trim() 
                              ? 'bg-white text-black hover:bg-zinc-200' 
                              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                        }`}
                     >
                        <Icon name="ArrowRight" size={20} />
                     </button>
                  </div>
               </div>
            </div>
         </div>

         <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".txt,.md,.json"
            onChange={handleFileUpload}
         />
      </div>
    );
  }

  // --- CHAT INTERFACE ---
  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto bg-white rounded-none sm:rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 sm:p-8 space-y-8 scroll-smooth bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}>
               
               {/* Bubble */}
               {msg.type === 'text' && (
                 <div className={`px-5 py-3.5 rounded-2xl max-w-lg shadow-sm text-sm leading-relaxed ${
                   msg.role === 'user' 
                     ? 'bg-slate-900 text-white rounded-br-sm' 
                     : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm'
                 }`}>
                   {msg.content}
                 </div>
               )}

               {/* Rich Content Components */}
               {msg.type === 'smart-analysis' && msg.data && renderSmartAnalysis(msg.data)}
               {msg.type === 'issue-tree' && msg.data && renderIssueTree(msg.data)}
               {msg.type === 'matrix' && msg.data && renderMatrix(msg.data)}
               {msg.type === 'workplan' && msg.data && renderWorkplan(msg.data)}
               {msg.type === 'synthesis' && msg.data && renderSynthesis(msg.data)}

               {/* Actions */}
               {msg.actions && (
                 <div className="mt-3 flex flex-wrap gap-2">
                   {msg.actions.map((action, idx) => (
                     <button
                       key={idx}
                       onClick={() => handleActionClick(action.value)}
                       className={`px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                         action.style === 'secondary' 
                           ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                           : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                       }`}
                     >
                       {action.label}
                     </button>
                   ))}
                 </div>
               )}
               
               {/* Metadata */}
               <span className="text-[10px] text-slate-300 mt-1.5 px-1 font-medium">
                 {msg.role === 'assistant' ? 'AI Consultant' : 'You'}
               </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-slate-200 shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area (Bottom) */}
      <div className="bg-white border-t border-slate-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all shadow-inner">
          
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors mb-0.5"
          >
             <Icon name="Paperclip" size={20} />
          </button>
          <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept=".txt,.md,.json"
             onChange={handleFileUpload}
          />

          <div className="flex-grow relative">
             <textarea
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSend();
                  }
               }}
               placeholder={
                  isRefining ? "Provide feedback to refine..." :
                  "Type your message..."
               }
               className="w-full bg-transparent border-none p-3 text-slate-800 placeholder-slate-400 focus:ring-0 resize-none max-h-[120px] min-h-[50px] leading-relaxed"
               rows={1}
             />
          </div>

          <button 
             onClick={handleSend}
             disabled={!input.trim() || isLoading}
             className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md mb-0.5"
          >
             <Icon name="ArrowRight" size={18} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-300 mt-3 font-medium">
           AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
};

export default ChatSession;