import { GoogleGenAI, Type } from '@google/genai';

/**
 * Initializes the Google Gemini AI Client.
 * Automatically loads the GEMINI_API_KEY from environment secrets.
 */
let aiInstance: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey === '') {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please add it via Settings > Secrets or the env variable.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

/**
 * AI Tool 1: Symptom Triage Analyzer
 * Analyzes patient symptoms and returns structured triage indicators
 */
export async function triageSymptoms(symptoms: string) {
  const client = getAiClient();
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze the following patient symptoms and provide safety triage assessment:
      
  Symptoms: "${symptoms}"`,
      config: {
        systemInstruction: 'You are a professional medical triage chatbot. Provide a clear, objective analysis of the symptoms. Classify severity (Low, Medium, High, Emergency), give the level of care recommendation (Home care, Clinic Visit, ER Urgent), list 3 potential questions a doctor might ask, and provide direct safety advice. Do NOT provide official diagnosis or write prescriptions.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING, description: "Low, Medium, High, or Emergency" },
            levelOfCare: { type: Type.STRING, description: "Home care, Scheduled Clinic Visit, Urgent Care, or ER immediately" },
            analysis: { type: Type.STRING, description: "A detailed summary of potential causes and considerations" },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 questions for a clinician to ask the patient"
            },
            precautionaryAdvice: { type: Type.STRING, description: "Immediate safety advice or warning signs" }
          },
          required: ['severity', 'levelOfCare', 'analysis', 'suggestedQuestions', 'precautionaryAdvice']
        }
      }
    });
  
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error: any) {
    console.error("AI Error:", error.message || error);
    return {
      severity: "Unknown",
      levelOfCare: "Clinic Visit",
      analysis: "AI service temporarily unavailable due to high demand. Please use clinical judgment.",
      suggestedQuestions: [],
      precautionaryAdvice: "Please proceed with standard clinical triage."
    };
  }
}

/**
 * AI Tool 2: Pathology Lab Biomarkers Interpreter
 * Evaluates blood parameters, references ranges, and alerts of severe risks.
 */
export async function interpretLabResults(testName: string, results: any[]) {
  const client = getAiClient();
  const resultsStr = results.map(r => `${r.parameter}: ${r.value} ${r.unit} (Abnormal: ${r.isAbnormal ? 'YES' : 'NO'})`).join('\n');
  
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze these medical lab report biomarkers for "${testName}":
      
  Results:\n${resultsStr}`,
      config: {
        systemInstruction: 'You are a certified clinical pathologist. Interpret the provided laboratory biomarkers. Explain the significance of any abnormal parameters in friendly but professional terms. Provide potential differential diagnostics indicators for the physician, clinical context notes, and clear advisory warnings.'
      }
    });
  
    return response.text || 'Evaluation completed.';
  } catch (error: any) {
    console.error("AI Error:", error.message || error);
    return 'AI service is temporarily unavailable. Please review lab results manually.';
  }
}

/**
 * AI Tool 3: Pharmacological Drug-Drug Interaction Warning Engine
 * Scans a list of medication names for potential adverse reactions.
 */
export async function scanDrugInteractions(medicines: string[]) {
  const client = getAiClient();
  const medList = medicines.join(', ');

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze these co-prescribed medications for active drug-drug interactions: [${medList}]`,
      config: {
        systemInstruction: 'You are an advanced clinical pharmacologist. Evaluate the list of medications for potential safety risks, contraindications, or drug-to-drug interactions. Give a direct warning summary, safety rating (Safe, Caution, Contraindicated), list of critical risks, and pharmacist monitoring recommendations. Keep the analysis concise, clear, and action-oriented.'
      }
    });
  
    return response.text || 'No adverse interactions detected.';
  } catch (error: any) {
    console.error("AI Error:", error.message || error);
    return 'AI service is temporarily unavailable. Please use standard drug interaction checkers.';
  }
}

/**
 * AI Tool 4: SOAP Scribe Consultation Scribe
 * Converts raw clinic encounter descriptions into formal clinical SOAP charts.
 */
export async function generateSoapNote(encounterNotes: string) {
  const client = getAiClient();

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Synthesize the following physician consultation notes into a standardized SOAP format:\n\n"${encounterNotes}"`,
      config: {
        systemInstruction: 'You are an expert medical scribe. Transcribe and structure the physician clinic notes into the standard medical SOAP chart: S (Subjective complaints, history), O (Objective vitals, physical findings), A (Clinical Assessment, differential diagnostics), and P (Treatment Plan, medication, follow-ups). Maintain a highly professional, clinical tone.'
      }
    });
  
    return response.text || '';
  } catch (error: any) {
    console.error("AI Error:", error.message || error);
    return 'AI scribe service is temporarily unavailable. Please document notes manually.';
  }
}

/**
 * AI Tool 5: General Clinical Knowledge Q&A
 * Assists clinical staff with diagnostic queries and research assistance.
 */
export async function clinicalAssistantQa(query: string, patientContext?: string) {
  const ai = getAiClient();
  const contextMsg = patientContext ? `\nPatient clinical context:\n${patientContext}` : '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Clinical Query: ${query}${contextMsg}`
    });
    
    return response.text || '';
  } catch (error: any) {
    console.error("AI Error:", error.message || error);
    const errMsg = error.message || 'Unknown server/AI error';
    return `The AI assistant is temporarily unavailable. This is typically caused by a missing or invalid GEMINI_API_KEY environment variable. Diagnostic: ${errMsg}. Please verify your GEMINI_API_KEY configuration on the hosted server and redeploy.`;
  }
}

/**
 * AI Tool 6: Intelligent Clinical Recommendation System
 * Provides multi-faceted diagnostic and treatment assistance for doctors.
 */
export async function getClinicalRecommendations(prompt: string, context: string) {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Clinical Prompt: ${prompt}\n\nPatient Clinical Context:\n${context}`,
      config: {
        systemInstruction: `You are an expert AI Clinical Decision Support System. Your role is to provide evidence-based clinical SUGGESTIONS to assist a licensed physician. You must NOT provide a final diagnosis.
        
        Provide detailed recommendations for: Differential diagnosis, disease explanation, treatment plans, medications, lab tests, imaging, risk assessment, drug interactions, allergy warnings, and lifestyle/nutrition advice.
        
        You MUST respond in structured JSON format with these exact fields:
        - recommendations: A string containing the primary suggestions.
        - confidenceScore: A number between 0 and 100.
        - explanation: A detailed explanation of the logic.
        - clinicalReasoning: The underlying medical pathophysiology or logic.
        - supportingRationale: Peer-reviewed references or standard of care guidelines (e.g., AHA, NICE).
        - possibleRisks: Any potential complications or side effects for the physician to monitor.
        - alternatives: Other options for the physician to consider.
        
        CRITICAL: All outputs are for Decision Support only. The attending physician is solely responsible for final clinical decisions and must review all suggestions.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            clinicalReasoning: { type: Type.STRING },
            supportingRationale: { type: Type.STRING },
            possibleRisks: { type: Type.STRING },
            alternatives: { type: Type.STRING }
          },
          required: ['recommendations', 'confidenceScore', 'explanation', 'clinicalReasoning']
        }
      }
    });
  
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error: any) {
    console.error("AI Error:", error.message || error);
    const errMsg = error.message || 'Unknown server/AI error';
    return {
      recommendations: `The AI service is temporarily unavailable. This is typically caused by a missing or invalid GEMINI_API_KEY environment variable. Diagnostic: ${errMsg}`,
      confidenceScore: 0,
      explanation: `Service unavailable: ${errMsg}`,
      clinicalReasoning: "Please verify your GEMINI_API_KEY configuration on the hosted server and redeploy.",
      supportingRationale: "N/A",
      possibleRisks: "N/A",
      alternatives: "N/A"
    };
  }
}

/**
 * AI Tool 7: Intelligent Laboratory Assistant
 * Provides expert interpretation of laboratory results and support laboratory professionals.
 */
export async function labAssistantAnalysis(query: string, resultContext: string) {
  const client = getAiClient();

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Laboratory Query: ${query}\n\nClinical/Result Context:\n${resultContext}`,
      config: {
        systemInstruction: `You are an expert AI Laboratory Consultant. Your role is to provide expert interpretation of lab results, explain clinical significance, and suggest workflow optimizations for lab professionals.
        
        You MUST respond in structured JSON format with these exact fields:
        - response: Detailed clinical interpretation and explanation of significance.
        - confidenceScore: A number between 0 and 100.
        - rationale: Supporting clinical rationale and reference to medical guidelines.
        - alternatives: Alternative interpretations or recommended follow-up tests.
        
        CRITICAL: AI recommendations are intended to support laboratory analysis and must always be verified by qualified laboratory professionals.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            rationale: { type: Type.STRING },
            alternatives: { type: Type.STRING }
          },
          required: ['response', 'confidenceScore', 'rationale', 'alternatives']
        }
      }
    });
  
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error: any) {
    console.error("AI Error:", error.message || error);
    const errMsg = error.message || 'Unknown server/AI error';
    return {
      response: `The AI service is temporarily unavailable. This is typically caused by a missing or invalid GEMINI_API_KEY environment variable. Diagnostic: ${errMsg}`,
      confidenceScore: 0,
      rationale: "Please verify your GEMINI_API_KEY configuration on the hosted server and redeploy.",
      alternatives: "N/A"
    };
  }
}

/**
 * AI Tool 8: Intelligent Pharmacy Assistant
 * Provides pharmacological analysis, drug interaction detection, and safety guidance.
 */
export async function pharmacyAssistantAnalysis(query: string, context: string) {
  const client = getAiClient();

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Pharmacy Query: ${query}\n\nClinical/Medication Context:\n${context}`,
      config: {
        systemInstruction: `You are an expert AI Pharmacological Consultant. Your role is to provide expert drug interaction analysis, contraindication detection, dosage guidance, and safety recommendations to assist licensed pharmacists.
        
        Provide analysis for: Drug-drug interactions, drug-food interactions, allergy warnings, duplicate therapies, contraindications, dosage violations, and alternative recommendations.
        
        You MUST respond in structured JSON format with these exact fields:
        - response: Primary safety assessment and interaction summary.
        - confidenceScore: A number between 0 and 100.
        - rationale: Detailed clinical reasoning and pharmacological logic.
        - safetyWarnings: Specific alerts regarding critical risks or contraindications.
        - alternatives: Alternative medication or generic suggestions if applicable.
        
        CRITICAL: AI recommendations are intended to support pharmacy practice and must always be reviewed by a licensed pharmacist before implementation.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            rationale: { type: Type.STRING },
            safetyWarnings: { type: Type.STRING },
            alternatives: { type: Type.STRING }
          },
          required: ['response', 'confidenceScore', 'rationale', 'safetyWarnings']
        }
      }
    });
  
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error: any) {
    console.error("AI Error:", error.message || error);
    const errMsg = error.message || 'Unknown server/AI error';
    return {
      response: `The AI service is temporarily unavailable. This is typically caused by a missing or invalid GEMINI_API_KEY environment variable. Diagnostic: ${errMsg}`,
      confidenceScore: 0,
      rationale: "Please verify your GEMINI_API_KEY configuration on the hosted server and redeploy.",
      safetyWarnings: "N/A",
      alternatives: "N/A"
    };
  }
}
