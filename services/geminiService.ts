import { GoogleGenAI, Type } from "@google/genai";
import { SmartAnalysis, IssueTreeResult, PrioritizationResult, ProblemType, WorkplanItem, SynthesisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

const CONSULTANT_PERSONA = "You are a world-class strategic problem solver. Your goal is to guide the user to the core of their issue using hypothesis-led methodologies (MECE, 80/20). Be concise, professional, and focus on impact.";

export const analyzeProblemStatement = async (problemText: string, context: string): Promise<SmartAnalysis> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Analyze the user's problem statement.
    
    1. Check against SMART criteria (Specific, Measurable, Actionable, Relevant, Time-bound).
    2. Refine the statement to be rigorous.
    3. Identify biases (Confirmation, Groupthink, etc.).
    4. Generate specific CHALLENGER questions to test the user's thinking.
    
    Context: ${context || 'General business context'}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze this problem statement: "${problemText}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSpecific: { type: Type.BOOLEAN },
            isMeasurable: { type: Type.BOOLEAN },
            isActionable: { type: Type.BOOLEAN },
            isRelevant: { type: Type.BOOLEAN },
            isTimeBound: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING },
            improvedStatement: { type: Type.STRING },
            potentialStakeholders: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedApproach: { type: Type.STRING },
            challengerQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            identifiedBiases: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: [
            "isSpecific", "isMeasurable", "isActionable", "isRelevant", "isTimeBound", 
            "feedback", "improvedStatement", "potentialStakeholders", "recommendedApproach",
            "challengerQuestions", "identifiedBiases"
          ]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SmartAnalysis;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const generateIssueTree = async (problemStatement: string, problemType: ProblemType): Promise<IssueTreeResult> => {
  let instructionContext = "";
  
  if (problemType === 'structured') {
    instructionContext = `
      The user identifies this as a "Structured" problem. Use a FORMULAIC or LOGICAL breakdown (e.g., Profit = Revenue - Cost, or Process Steps).
    `;
  } else {
    instructionContext = `
      The user identifies this as a "Complex/Nebulous" problem. Break this down into KEY DRIVERS, THEMATIC COMPONENTS, or STAKEHOLDER GROUPS.
    `;
  }

  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Create a Mutually Exclusive, Collectively Exhaustive (MECE) Issue Tree.
    ${instructionContext}
    Break the problem down into exactly 2 levels of depth.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Create an issue tree for: "${problemStatement}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            root: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['root'] },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ['category'] },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['issue'] },
                          },
                          required: ['id', 'label', 'type']
                        }
                      }
                    },
                    required: ['id', 'label', 'type', 'children']
                  }
                }
              },
              required: ['id', 'label', 'type', 'children']
            },
            meceExplanation: { type: Type.STRING }
          },
          required: ['root', 'meceExplanation']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as IssueTreeResult;
    }
    throw new Error("No issue tree generated");
  } catch (error) {
    console.error("Gemini Issue Tree Failed:", error);
    throw error;
  }
};

export const generatePrioritization = async (issues: string[]): Promise<PrioritizationResult> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    1. Apply the 80/20 Principle (Pareto): Identify the ~20% of issues that likely drive 80% of the impact.
    2. Map all issues to Impact vs. Feasibility.
    
    Quadrants:
    - Quick Wins: High Impact, High Feasibility.
    - Major Projects: High Impact, Low Feasibility.
    - Fill Ins: Low Impact, High Feasibility.
    - Thankless Tasks: Low Impact, Low Feasibility.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Prioritize these issues: ${JSON.stringify(issues)}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ['High', 'Low'] },
                  effort: { type: Type.STRING, enum: ['High', 'Low'] },
                  quadrant: { type: Type.STRING, enum: ['Quick Wins', 'Major Projects', 'Fill Ins', 'Thankless Tasks'] },
                  reasoning: { type: Type.STRING },
                  isParetoTop20: { type: Type.BOOLEAN }
                },
                required: ['id', 'label', 'impact', 'effort', 'quadrant', 'reasoning', 'isParetoTop20']
              }
            },
            paretoSummary: { type: Type.STRING }
          },
          required: ['items', 'paretoSummary']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PrioritizationResult;
    }
    throw new Error("No prioritization generated");
  } catch (error) {
    console.error("Gemini Prioritization Failed:", error);
    throw error;
  }
};

export const generateWorkplan = async (issues: string[]): Promise<WorkplanItem[]> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Create a Hypothesis-Led Workplan for the provided high-priority issues.
    For each issue:
    1. Formulate a specific Hypothesis (what are we trying to prove/disprove?).
    2. Define the Analysis required (Qualitative or Quantitative).
    3. Identify the Data Source.
    4. Estimate Timing (e.g., "Day 1-2", "Week 1").
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Create workplan for these prioritized issues: ${JSON.stringify(issues)}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              issue: { type: Type.STRING },
              hypothesis: { type: Type.STRING },
              analysis: { type: Type.STRING },
              source: { type: Type.STRING },
              timing: { type: Type.STRING },
            },
            required: ['issue', 'hypothesis', 'analysis', 'source', 'timing']
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as WorkplanItem[];
    }
    throw new Error("No workplan generated");
  } catch (error) {
    console.error("Gemini Workplan Failed:", error);
    throw error;
  }
};

export const generateSynthesis = async (problem: string, context: string): Promise<SynthesisResult> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Based on the problem statement and context, generate a Synthesis and Recommendation.
    
    1. SYNTHESIS ("The So What"): An integrated insight derived from the analysis.
    2. RECOMMENDATION ("What to do"):
       - Must be ACTIONABLE.
       - Include specific steps.
       - Identify STAKEHOLDERS for buy-in.
       - Identify required RESOURCES.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Problem: ${problem}. Context: ${context}. Generate synthesis and recommendation.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synthesis: { type: Type.STRING, description: "The integrated 'So What' insight." },
            recommendation: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The core recommendation statement." },
                actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                stakeholders: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Who to get buy-in from." },
                resources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Budget, people, or tech needed." }
              },
              required: ['text', 'actionableSteps', 'stakeholders', 'resources']
            }
          },
          required: ['synthesis', 'recommendation']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SynthesisResult;
    }
    throw new Error("No synthesis generated");
  } catch (error) {
    console.error("Gemini Synthesis Failed:", error);
    throw error;
  }
};