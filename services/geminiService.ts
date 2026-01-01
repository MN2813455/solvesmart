
import { GoogleGenAI, Type } from "@google/genai";
import { SmartAnalysis, IssueTreeResult, PrioritizationResult, ProblemType, WorkplanItem, SynthesisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-3-flash-preview";

const CONSULTANT_PERSONA = "You are a direct, clear-thinking strategic advisor. Your goal is to simplify complexity. You always use the Minto Pyramid Principle: start with the most important answer first, then support it with clear, non-overlapping logical pillars. Avoid academic jargon. Speak like a senior partner explaining a clear path to a client.";

export const analyzeProblemStatement = async (problemText: string, context: string): Promise<SmartAnalysis> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Review the user's challenge and refine it into a clear, professional objective.
    
    1. Evaluate if it's Specific, Measurable, and Time-bound.
    2. Rewrite it to be an 'Answer-First' objective statement.
    3. Identify who needs to be involved.
    4. Ask 3 direct questions that cut to the heart of the challenge.
    
    Context: ${context || 'General business context'}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze this challenge: "${problemText}"`,
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
    console.error("Analysis Failed:", error);
    throw error;
  }
};

export const generateIssueTree = async (problemStatement: string, problemType: ProblemType): Promise<IssueTreeResult> => {
  let instructionContext = "";
  
  if (problemType === 'formulaic') {
    instructionContext = `
      This is a data-driven or numerical problem. Use a 'Drivers' approach. 
      Root: The core result (e.g., Profit).
      Level 1: The major drivers (e.g., Revenue vs. Costs).
      Level 2: The specific components.
      IMPORTANT: For every node, provide a brief 'explanation' field (1 sentence) that explains WHY this factor matters or what it means in plain English (e.g., explain NPV if you use it).
    `;
  } else {
    instructionContext = `
      This is a strategic or organizational problem. Use a 'Thematic' approach.
      Root: The core strategic goal.
      Level 1: The 3-4 key pillars of success.
      Level 2: The specific sub-themes for each pillar.
      IMPORTANT: For every node, provide a brief 'explanation' field (1 sentence) that explains the strategic significance of this pillar.
    `;
  }

  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Create a 'Logic Pyramid' for this problem. 
    ${instructionContext}
    Ensure the breakdown is clear and covers the entire scope without repeating ideas.
    The response must be in Minto Pyramid style (Top-Down).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Break down this challenge: "${problemStatement}"`,
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
                explanation: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['root'] },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ['category'] },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['issue'] },
                          },
                          required: ['id', 'label', 'type', 'explanation']
                        }
                      }
                    },
                    required: ['id', 'label', 'type', 'children', 'explanation']
                  }
                }
              },
              required: ['id', 'label', 'type', 'children', 'explanation']
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
    throw new Error("No logic tree generated");
  } catch (error) {
    console.error("Logic Tree Failed:", error);
    throw error;
  }
};

export const generatePrioritization = async (issues: string[]): Promise<PrioritizationResult> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Identify the 20% of these issues that will deliver 80% of the value.
    Sort them into:
    - High Impact, Easy to Do (Quick Wins)
    - High Impact, Hard to Do (Strategic Moves)
    - Low Impact (Backlog)
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Prioritize these items: ${JSON.stringify(issues)}`,
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
    console.error("Prioritization Failed:", error);
    throw error;
  }
};

export const generateWorkplan = async (issues: string[]): Promise<WorkplanItem[]> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Create a clear action plan. 
    For each item, provide:
    1. A clear goal (Hypothesis).
    2. What we need to check (Analysis).
    3. Where the info is (Source).
    4. When it happens (Timing).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Plan the next steps for: ${JSON.stringify(issues)}`,
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
    console.error("Workplan Failed:", error);
    throw error;
  }
};

export const generateSynthesis = async (problem: string, context: string): Promise<SynthesisResult> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Lead with the Answer. 
    Provide a clear, integrated recommendation first.
    Then list the specific steps, who is involved, and what's needed.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Challenge: ${problem}. Context: ${context}. Give me the final recommendation.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synthesis: { type: Type.STRING, description: "The integrated summary insight." },
            recommendation: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The core recommendation statement." },
                actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                stakeholders: { type: Type.ARRAY, items: { xType: Type.STRING }, description: "Who needs to buy in." },
                resources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Budget or tech needed." }
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
    console.error("Synthesis Failed:", error);
    throw error;
  }
};
