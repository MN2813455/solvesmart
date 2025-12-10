import React, { useState } from 'react';
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
  IssueNode, 
  ProblemType, 
  WorkplanItem, 
  SynthesisResult 
} from '../types';
import Icon from './Icon';

type Step = 'define' | 'structure' | 'prioritize' | 'plan';
type PlanTab = 'workplan' | 'analysis' | 'recommendation';

const ProblemAssistant: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('define');
  
  // Define State
  const [problem, setProblem] = useState('');
  const [context, setContext] = useState('');
  const [analysis, setAnalysis] = useState<SmartAnalysis | null>(null);
  
  // Structure State
  const [issueTree, setIssueTree] = useState<IssueTreeResult | null>(null);
  const [problemType, setProblemType] = useState<ProblemType>('structured');
  
  // Prioritize State
  const [prioritization, setPrioritization] = useState<PrioritizationResult | null>(null);

  // Plan & Solve State
  const [planTab, setPlanTab] = useState<PlanTab>('workplan');
  const [workplan, setWorkplan] = useState<WorkplanItem[] | null>(null);
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Handlers ---

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setIssueTree(null);
    setPrioritization(null);
    setWorkplan(null);
    setSynthesis(null);

    try {
      const result = await analyzeProblemStatement(problem, context);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to analyze the problem. Please ensure your API key is configured correctly.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTree = async () => {
    if (!analysis) return;
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateIssueTree(analysis.improvedStatement, problemType);
      setIssueTree(result);
      setCurrentStep('structure');
    } catch (err) {
      setError("Failed to generate Issue Tree.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritize = async () => {
    if (!issueTree) return;
    setLoading(true);
    setError(null);

    try {
      const issues: string[] = [];
      const traverse = (node: IssueNode) => {
        if (node.children && node.children.length > 0) {
          node.children.forEach(traverse);
        } else if (node.type === 'issue') {
          issues.push(node.label);
        }
      };
      traverse(issueTree.root);

      if (issues.length === 0) {
        setError("No issues found in the tree to prioritize.");
        setLoading(false);
        return;
      }

      const result = await generatePrioritization(issues);
      setPrioritization(result);
      setCurrentStep('prioritize');
    } catch (err) {
      setError("Failed to generate prioritization matrix.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanAndSolve = async () => {
    if (!prioritization) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Generate Workplan for Top Priority Items
      const priorityIssues = prioritization.items
        .filter(i => i.isParetoTop20 || i.quadrant === 'Quick Wins' || i.quadrant === 'Major Projects')
        .map(i => i.label)
        .slice(0, 5); // Limit to top 5 for demo speed
      
      const workplanResult = await generateWorkplan(priorityIssues);
      setWorkplan(workplanResult);

      // 2. Generate Synthesis/Recommendation (Hypothetical)
      const synthesisResult = await generateSynthesis(analysis?.improvedStatement || problem, context);
      setSynthesis(synthesisResult);

      setCurrentStep('plan');
    } catch (err) {
      setError("Failed to generate workplan and recommendations.");
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers ---

  const renderRecursiveTree = (node: IssueNode, depth = 0) => {
    const isRoot = depth === 0;
    return (
      <div key={node.id} className={`${!isRoot ? 'ml-6 border-l-2 border-slate-200 pl-6 relative' : ''} mt-4`}>
        {!isRoot && (
           <div className="absolute top-4 -left-[2px] w-6 h-0.5 bg-slate-200"></div>
        )}
        <div className={`p-3 rounded-lg border shadow-sm inline-block min-w-[200px] ${
          node.type === 'root' ? 'bg-indigo-600 text-white border-indigo-600' :
          node.type === 'category' ? 'bg-indigo-50 border-indigo-100 text-indigo-900' :
          'bg-white border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            {node.type === 'root' && <Icon name="Target" size={16} />}
            {node.type === 'category' && <Icon name="Layers" size={16} />}
            {node.type === 'issue' && <Icon name="FileText" size={16} />}
            <span className="font-medium text-sm">{node.label}</span>
          </div>
        </div>
        {node.children && node.children.map(child => renderRecursiveTree(child, depth + 1))}
      </div>
    );
  };

  const renderMatrix = () => {
    if (!prioritization) return null;

    const quadrants = {
      'Quick Wins': { bg: 'bg-emerald-50', border: 'border-emerald-100', title: 'text-emerald-700', items: [] as any[] },
      'Major Projects': { bg: 'bg-blue-50', border: 'border-blue-100', title: 'text-blue-700', items: [] as any[] },
      'Fill Ins': { bg: 'bg-slate-50', border: 'border-slate-100', title: 'text-slate-600', items: [] as any[] },
      'Thankless Tasks': { bg: 'bg-rose-50', border: 'border-rose-100', title: 'text-rose-700', items: [] as any[] },
    };

    prioritization.items.forEach(item => {
      if (quadrants[item.quadrant as keyof typeof quadrants]) {
        quadrants[item.quadrant as keyof typeof quadrants].items.push(item);
      }
    });

    return (
      <div className="grid grid-cols-2 gap-4 h-[500px]">
        {Object.entries(quadrants).map(([key, data]) => (
          <div key={key} className={`p-4 rounded-xl border ${data.border} ${data.bg} relative overflow-y-auto`}>
            <h5 className={`font-bold text-sm uppercase mb-3 flex items-center justify-between ${data.title}`}>
              <span>{key}</span>
            </h5>
            <div className="space-y-2">
              {data.items.map(item => renderMatrixCard(item))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMatrixCard = (item: any) => (
    <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 group relative">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-800">{item.label}</span>
        {item.isParetoTop20 && (
          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
            80/20
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1">{item.reasoning}</p>
    </div>
  );

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900">Problem Lab</h2>
        <p className="mt-2 text-slate-500">
          Define, Structure, Prioritize, and Plan your solution with expert guidance.
        </p>
      </div>

      {/* Stepper Navigation */}
      <div className="flex items-center justify-center mb-10 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {[
            { id: 'define', label: 'Define' }, 
            { id: 'structure', label: 'Structure' }, 
            { id: 'prioritize', label: 'Prioritize' },
            { id: 'plan', label: 'Plan & Solve' }
          ].map((step, idx, arr) => (
            <button 
              key={step.id}
              onClick={() => {
                 if (step.id === 'define') setCurrentStep('define');
                 if (step.id === 'structure' && issueTree) setCurrentStep('structure');
                 if (step.id === 'prioritize' && prioritization) setCurrentStep('prioritize');
                 if (step.id === 'plan' && synthesis) setCurrentStep('plan');
              }}
              disabled={
                (step.id === 'structure' && !issueTree) ||
                (step.id === 'prioritize' && !prioritization) ||
                (step.id === 'plan' && !synthesis)
              }
              className={`flex items-center gap-2 px-6 py-3 border-y border-l last:border-r last:rounded-r-lg first:rounded-l-lg transition-all 
                ${currentStep === step.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'} 
                ${((step.id === 'structure' && !issueTree) || (step.id === 'prioritize' && !prioritization) || (step.id === 'plan' && !synthesis)) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === step.id ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</div>
              <span className="font-medium">{step.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm min-h-[600px] relative">
        
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-50 rounded-3xl flex flex-col items-center justify-center backdrop-blur-sm">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
             <p className="text-indigo-600 font-medium animate-pulse">
               Processing...
             </p>
          </div>
        )}

        {/* STEP 1: DEFINE */}
        {currentStep === 'define' && (
           <div className="grid lg:grid-cols-2 gap-12 h-full">
              <div className="space-y-6">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Step 1: Define the Problem</h3>
                    <p className="text-sm text-slate-500">Draft your initial thoughts. We'll refine them.</p>
                 </div>
                 <form onSubmit={handleAnalyze} className="space-y-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Problem Statement</label>
                       <textarea
                          value={problem}
                          onChange={(e) => setProblem(e.target.value)}
                          className="w-full h-32 p-4 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm resize-none"
                          placeholder="e.g., We need to increase sales immediately because revenue is down."
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Context</label>
                       <input
                          type="text"
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                          placeholder="e.g., Retail clothing company, Q4"
                       />
                    </div>
                    <button
                       type="submit"
                       disabled={loading || !problem.trim()}
                       className="w-full py-3 px-6 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                       <Icon name="Brain" className="w-5 h-5" /> Analyze
                    </button>
                 </form>
                 {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-full overflow-y-auto">
                 {!analysis ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                       <Icon name="Target" size={48} className="mb-4 text-slate-200" />
                       <p>Analysis will appear here.</p>
                    </div>
                 ) : (
                    <div className="space-y-6 animate-fade-in">
                       <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                          <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Improved Hypothesis</h4>
                          <p className="text-indigo-900 font-medium text-lg">"{analysis.improvedStatement}"</p>
                       </div>
                       
                       <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                          <div className="flex items-center gap-2 mb-2">
                             <Icon name="Zap" className="text-amber-600" size={16} />
                             <h4 className="text-amber-800 font-bold text-sm">Challenger Session (Debiasing)</h4>
                          </div>
                          <ul className="space-y-1">
                             {analysis.challengerQuestions?.map((q, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-slate-700">
                                   <span className="text-amber-500">•</span> {q}
                                </li>
                             ))}
                          </ul>
                       </div>

                       <div>
                         <label className="block text-sm font-medium text-slate-700 mb-2">Problem Complexity</label>
                         <div className="grid grid-cols-2 gap-3 mb-4">
                           <button
                             onClick={() => setProblemType('structured')}
                             className={`p-3 rounded-lg border text-sm text-left transition-all ${problemType === 'structured' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                           >
                             <div className="font-bold mb-1">Structured</div>
                             <div className={`text-xs ${problemType === 'structured' ? 'text-indigo-200' : 'text-slate-400'}`}>e.g. Profit (Formulaic)</div>
                           </button>
                           <button
                             onClick={() => setProblemType('nebulous')}
                             className={`p-3 rounded-lg border text-sm text-left transition-all ${problemType === 'nebulous' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                           >
                             <div className="font-bold mb-1">Nebulous</div>
                             <div className={`text-xs ${problemType === 'nebulous' ? 'text-indigo-200' : 'text-slate-400'}`}>e.g. Culture (Thematic)</div>
                           </button>
                         </div>

                         <button 
                            onClick={handleGenerateTree}
                            className="w-full py-3 border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                         >
                            Proceed to Structure <Icon name="ArrowRight" size={16} />
                         </button>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* STEP 2: STRUCTURE */}
        {currentStep === 'structure' && issueTree && (
           <div className="h-full flex flex-col">
              <div className="flex justify-between items-end mb-6">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900">Step 2: Structure the Problem</h3>
                    <p className="text-sm text-slate-500">Break it down using an Issue Tree.</p>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200 text-xs font-bold">
                    <Icon name="CheckCircle2" size={14} />
                    MECE Check Passed
                 </div>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-inner flex-grow overflow-x-auto">
                 <div className="min-w-[600px]">
                    {renderRecursiveTree(issueTree.root)}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logic Check (MECE)</h4>
                   <p className="text-sm text-slate-600">{issueTree.meceExplanation}</p>
                </div>
                
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                   <div className="mr-4">
                     <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Iterate</h4>
                     <p className="text-sm text-indigo-900">
                       Is this structure useful? If not, try regenerating it.
                     </p>
                   </div>
                   <button 
                     onClick={handleGenerateTree}
                     className="text-xs font-bold text-indigo-600 bg-white px-3 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 whitespace-nowrap"
                   >
                     Regenerate Tree
                   </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                 <button 
                    onClick={handlePrioritize}
                    className="py-3 px-8 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2"
                 >
                    Next: Prioritize Issues <Icon name="ArrowRight" size={16} />
                 </button>
              </div>
           </div>
        )}

        {/* STEP 3: PRIORITIZE */}
        {currentStep === 'prioritize' && prioritization && (
           <div className="h-full flex flex-col">
              <div className="mb-6 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900">Step 3: Prioritize Analysis</h3>
                    <p className="text-sm text-slate-500">
                       Use the 80/20 Principle to focus on the "Vital Few".
                    </p>
                 </div>
                 <button 
                    onClick={handlePlanAndSolve}
                    className="py-2 px-6 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
                 >
                    Next: Plan & Solve <Icon name="ArrowRight" size={16} />
                 </button>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2">
                    {renderMatrix()}
                 </div>
                 
                 <div className="space-y-4">
                    <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
                       <div className="flex items-center gap-2 mb-3">
                          <Icon name="Lightbulb" className="text-amber-600" size={20} />
                          <h4 className="text-amber-900 font-bold">80/20 Analysis</h4>
                       </div>
                       <p className="text-sm text-amber-800 leading-relaxed">
                          {prioritization.paretoSummary}
                       </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                       <h4 className="font-bold text-slate-900 mb-3">Top Priority (Vital 20%)</h4>
                       <ul className="space-y-2">
                          {prioritization.items.filter(i => i.isParetoTop20).map((item, idx) => (
                             <li key={idx} className="flex items-start gap-2">
                                <Icon name="CheckCircle2" className="text-indigo-600 w-4 h-4 mt-0.5" />
                                <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                             </li>
                          ))}
                       </ul>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* STEP 4: PLAN & SOLVE */}
        {currentStep === 'plan' && synthesis && (
          <div className="h-full flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Step 4: Plan, Analyze, Recommend</h3>
              <p className="text-sm text-slate-500">Develop a workplan and drive to a recommendation.</p>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              <button
                onClick={() => setPlanTab('workplan')}
                className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${planTab === 'workplan' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                1. Workplan
              </button>
              <button
                onClick={() => setPlanTab('analysis')}
                className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${planTab === 'analysis' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                2. Analysis Check
              </button>
              <button
                onClick={() => setPlanTab('recommendation')}
                className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${planTab === 'recommendation' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                3. Synthesis & Recommendation
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto pr-2">
              
              {planTab === 'workplan' && workplan && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 mb-4">
                    <strong className="block mb-1">Hypothesis-Led Approach</strong>
                    Focus on proving or disproving specific hypotheses rather than just "gathering data".
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-slate-600">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Issue</th>
                          <th className="px-4 py-3">Hypothesis</th>
                          <th className="px-4 py-3">Analysis</th>
                          <th className="px-4 py-3">Timing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workplan.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">{item.issue}</td>
                            <td className="px-4 py-3 italic text-slate-500">"{item.hypothesis}"</td>
                            <td className="px-4 py-3">{item.analysis}</td>
                            <td className="px-4 py-3">{item.timing}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {planTab === 'analysis' && (
                <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                       <Icon name="Search" className="text-indigo-500" />
                       Sanity Check: Forest vs. Trees
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <Icon name="AlertCircle" className="text-amber-500 flex-shrink-0" size={20} />
                        <div>
                           <p className="font-bold text-slate-800 text-sm">Accuracy vs. Precision</p>
                           <p className="text-xs text-slate-500">Are you getting lost in the 3rd decimal place (Precision) instead of ensuring the answer is directionally correct (Accuracy)?</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <Icon name="Clock" className="text-blue-500 flex-shrink-0" size={20} />
                        <div>
                           <p className="font-bold text-slate-800 text-sm">The "So What" Test</p>
                           <p className="text-xs text-slate-500">Stop every week and ask: "How does this analysis help us solve the core problem?"</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {planTab === 'recommendation' && synthesis && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Synthesis */}
                  <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Synthesis ("The So What")</h4>
                    <p className="text-slate-800 text-lg font-serif leading-relaxed">
                      {synthesis.synthesis}
                    </p>
                  </div>

                  {/* Recommendation */}
                  <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Icon name="Target" size={100} className="text-indigo-600" />
                    </div>
                    
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <Icon name="FileText" size={14} /> Recommendation
                    </h4>
                    
                    <p className="text-xl font-bold text-indigo-900 mb-6">
                      {synthesis.recommendation.text}
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-white/60 p-4 rounded-lg">
                        <h5 className="font-bold text-indigo-800 text-sm mb-2">Actionable Steps</h5>
                        <ul className="text-sm text-indigo-900 space-y-1">
                          {synthesis.recommendation.actionableSteps.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                      </div>
                      <div className="bg-white/60 p-4 rounded-lg">
                        <h5 className="font-bold text-indigo-800 text-sm mb-2">Stakeholders (Buy-in)</h5>
                        <ul className="text-sm text-indigo-900 space-y-1">
                          {synthesis.recommendation.stakeholders.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                      </div>
                      <div className="bg-white/60 p-4 rounded-lg">
                        <h5 className="font-bold text-indigo-800 text-sm mb-2">Required Resources</h5>
                        <ul className="text-sm text-indigo-900 space-y-1">
                          {synthesis.recommendation.resources.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Tip Card */}
                  <div className="flex items-start gap-4 p-4 bg-teal-50 border border-teal-100 rounded-lg">
                    <Icon name="Lightbulb" className="text-teal-600 flex-shrink-0" />
                    <p className="text-sm text-teal-800">
                      <strong>Consultant Tip:</strong> Carve out specific time for developing recommendations. Don't just stop at the analysis. The value comes from the buy-in and the implementation plan, not just the spreadsheet.
                    </p>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemAssistant;