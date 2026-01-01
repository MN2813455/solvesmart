
export interface SmartAnalysis {
  isSpecific: boolean;
  isMeasurable: boolean;
  isActionable: boolean;
  isRelevant: boolean;
  isTimeBound: boolean;
  feedback: string;
  improvedStatement: string;
  potentialStakeholders: string[];
  recommendedApproach: string;
  challengerQuestions: string[];
  identifiedBiases: string[];
}

export type ProblemType = 'formulaic' | 'thematic';

export interface IssueNode {
  id: string;
  label: string;
  explanation?: string; // New field for context
  type: 'root' | 'category' | 'issue';
  children?: IssueNode[];
}

export interface IssueTreeResult {
  root: IssueNode;
  meceExplanation: string;
}

export interface MatrixItem {
  id: string;
  label: string;
  impact: 'High' | 'Low';
  effort: 'High' | 'Low';
  quadrant: 'Quick Wins' | 'Major Projects' | 'Fill Ins' | 'Thankless Tasks';
  reasoning: string;
  isParetoTop20: boolean;
}

export interface PrioritizationResult {
  items: MatrixItem[];
  paretoSummary: string;
}

export interface WorkplanItem {
  issue: string;
  hypothesis: string;
  analysis: string;
  source: string;
  timing: string;
}

export interface SynthesisResult {
  synthesis: string;
  recommendation: {
    text: string;
    actionableSteps: string[];
    stakeholders: string[];
    resources: string[];
  };
}

// Chat Specific Types
export type MessageType = 'text' | 'smart-analysis' | 'issue-tree' | 'matrix' | 'workplan' | 'synthesis';

export interface ChatAction {
  label: string;
  value: string;
  style?: 'primary' | 'secondary';
  tooltip?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  type: MessageType;
  content: string; // Fallback text
  data?: any; // Holds the structured result (SmartAnalysis, IssueTreeResult, etc.)
  actions?: ChatAction[]; // Interactive buttons
  timestamp: Date;
}

export interface FullReportData {
  originalProblem: string;
  smartAnalysis: SmartAnalysis | null;
  issueTree: IssueTreeResult | null;
  prioritization: PrioritizationResult | null;
  workplan: WorkplanItem[] | null;
  synthesis: SynthesisResult | null;
}

// UI Types
export interface StepDefinition {
  id: number;
  title: string;
  action: string;
  question: string;
  icon: string;
}

export enum TimeHorizon {
  MOMENT = 'The Moment',
  SHORT_TERM = 'Short Term',
  LONG_TERM = 'Long Term'
}

export interface ReflectionArea {
  title: string;
  question: string;
  icon: string;
}
