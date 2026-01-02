
import { GoogleGenAI, Type } from "@google/genai";
import { SmartAnalysis, IssueTreeResult, PrioritizationResult, ProblemType, WorkplanItem, SynthesisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Pro for high-stakes reasoning, Flash for initial definition
const MODEL_PRO = "gemini-3-pro-preview";
const MODEL_FLASH = "gemini-3-flash-preview";

const CONSULTANT_PERSONA = "You are a top-tier Strategic Partner. Your signature style is the Minto Pyramid Principle: Answer First. You prioritize clarity over complexity. Every time you use technical terms (like NPV, ROI, churn, etc.), you MUST provide a plain-English definition within the explanation.";

/**
 * Generic retry wrapper for production-grade reliability
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (retries > 0) {
      console.warn(`API call failed, retrying... (${retries} left)`);
      await new Promise(r => setTimeout(r, 1000));
      return callWithRetry(fn, retries - 1);
    }
    throw e;
  }
}

export const analyzeProblemStatement = async (problemText: string, context: string): Promise<SmartAnalysis> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Analyze the objective. Ensure it is precise. If it lacks a timeframe or metric, suggest one.
    Lead with an 'Answer-First' refined statement.
    Context: ${context || 'General strategic context'}
  `;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Analyze: "${problemText}"`,
      config: {
        systemInstruction,
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
          required: ["isSpecific", "isMeasurable", "isActionable", "isRelevant", "isTimeBound", "feedback", "improvedStatement", "challengerQuestions"]
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generateIssueTree = async (problemStatement: string, problemType: ProblemType): Promise<IssueTreeResult> => {
  const instructionContext = problemType === 'formulaic' 
    ? "Numerical drivers. Break down the equation. Explain every term clearly."
    : "Strategic themes. Create distinct conceptual pillars. Define the 'so-what' for each.";

  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Deconstruct the challenge using a MECE Logic Pyramid. 
    Every node MUST include an 'explanation' field that defines the concept and its impact.
    Format: Root -> Categories -> Specific Issues.
    ${instructionContext}
  `;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: `Structure: "${problemStatement}"`,
      config: {
        systemInstruction,
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
                type: { type: Type.STRING },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      type: { type: Type.STRING },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            type: { type: Type.STRING }
                          },
                          required: ['id', 'label', 'explanation']
                        }
                      }
                    },
                    required: ['id', 'label', 'explanation', 'children']
                  }
                }
              },
              required: ['id', 'label', 'explanation', 'children']
            },
            meceExplanation: { type: Type.STRING }
          },
          required: ['root', 'meceExplanation']
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generatePrioritization = async (issues: string[]): Promise<PrioritizationResult> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Apply Pareto's 80/20 rule. Identify the high-impact/low-effort 'Quick Wins'.
    Provide a concise Pareto summary justifying the selection.
  `;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: `Prioritize: ${JSON.stringify(issues)}`,
      config: {
        systemInstruction,
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
                  quadrant: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  isParetoTop20: { type: Type.BOOLEAN }
                },
                required: ['id', 'label', 'quadrant', 'reasoning', 'isParetoTop20']
              }
            },
            paretoSummary: { type: Type.STRING }
          },
          required: ['items', 'paretoSummary']
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generateWorkplan = async (issues: string[]): Promise<WorkplanItem[]> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    Create a hypothesis-driven workplan. For each item, clearly state the hypothesis we are testing.
  `;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Workplan for: ${JSON.stringify(issues)}`,
      config: {
        systemInstruction,
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
            required: ['issue', 'hypothesis', 'analysis', 'timing']
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generateSynthesis = async (problem: string, context: string): Promise<SynthesisResult> => {
  const systemInstruction = `
    ${CONSULTANT_PERSONA}
    SYNTHESIZE THE ANSWER FIRST. Provide one clear, actionable recommendation.
    Be decisive.
  `;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: `Synthesize: "${problem}". Context: ${context}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synthesis: { type: Type.STRING },
            recommendation: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                stakeholders: { type: Type.ARRAY, items: { type: Type.STRING } },
                resources: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['text', 'actionableSteps', 'stakeholders', 'resources']
            }
          },
          required: ['synthesis', 'recommendation']
        }
      }
    });
    return JSON.parse(response.text);
  });
};
