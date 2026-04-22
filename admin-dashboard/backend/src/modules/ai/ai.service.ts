import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY is not set in environment variables');
    }
  }

  async generatePersonalizedQuestions(
    resumeText: string,
    role: string,
    jobTitle: string,
    experienceLevel: string = 'Fresher',
  ): Promise<string[]> {
    if (!this.genAI) {
      this.logger.error('Gemini AI not initialized. Missing API Key.');
      return [];
    }

    const modelsToTry = [
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview',
      'gemini-3-pro-preview',
      'gemini-3.1-pro-preview',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-pro',
    ];

    const prompt = `
You are a Lead Technical Interviewer with 10+ years of experience at a Tier-1 Tech Giant (Scale/FAANG). 

Your goal is NOT just to generate questions, but to be an ADAPTIVE AGENT that performs a high-stakes clinical evaluation of a candidate's actual engineering depth. 

-----------------------------------
🧠 STEP 1: DEEP CANDIDATE SCAN (INTERNAL)
-----------------------------------
Analyze this profile with a critical eye:

Candidate Resume:
${resumeText.substring(0, 4000)}

Preferred Role: ${role}
Selected Job: ${jobTitle}
Experience Level: ${experienceLevel}

Identify:
- Primary stack + "Comfort Zone"
- Potential "Hard Limits" (where their experience likely ends)
- Skill Gaps (e.g., they use Frontend but lack Backend/Performance knowledge)
- Most complex project mentioned (The target for "Stress Testing")

-----------------------------------
🎯 STEP 2: AGENTIC INTERVIEW STRATEGY
-----------------------------------
Structure the questions to simulate a high-pressure, professional interview:

1. WARM-UP (1 Q): High-level project walkthrough to build rapport.
2. PROJECT SPRINT (3 Qs): Ask at least one specific question about EACH major project mentioned. 
   - CRITICAL: Do NOT ignore the "Face Recognition AI" or complex Python projects.
3. DEPTH TRAPS (2 Qs): Questions designed to find the candidate's limit.
   - Example: "You used Local Storage—what happens when the browser quota is hit?"
   - Example: "How do you handle false positives in your AI model logic?"
4. PRESSURE TEST (2 Qs): High-stakes scenario questions. 
   - Example: "Your API is failing during a viral marketing peak—how do you triage?"
5. STRETCH / SYSTEM THINKING (1 Q): Ask them to think beyond their current skills (e.g., how they would convert their project into a production-grade full-stack system).
6. BEHAVIORAL TECH (1 Q): How they handle technical disagreements or complex debugging.

-----------------------------------
⚙️ STEP 3: QUESTION DESIGN RULES
-----------------------------------
Each question MUST:
- Be Conversational: Use natural interviewer language ("I noticed you...", "Imagine we...", "Why did you choose...")
- Be Specific: No generic "What is X" questions. Tie everything to their Resume data.
- Avoid Definitions: Test thinking, logic, and tradeoffs, NOT memorization.
- Difficulty Calibration: Adjust for ${experienceLevel}. If Professional, ask about System Design and Optimization.

-----------------------------------
🚫 STRICT RULES
-----------------------------------
- DO NOT mention "based on your resume" or "I see that you...". Be subtle.
- DO NOT generate answers.
- DO NOT ask vague or purely theoretical questions.

-----------------------------------
📤 OUTPUT FORMAT (STRICT)
-----------------------------------
Return ONLY a JSON array of EXACTLY 10 questions:

["Question 1", "Question 2", ..., "Question 10"]
`;

    let lastError: Error | null = null;
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        this.logger.log(`Attempting expert question generation with model: ${modelName}`);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        this.logger.log(`Successfully generated questions using ${modelName}`);

        // Robust JSON extraction
        try {
          const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const jsonMatch = cleanedText.match(/\[.*\]/s);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          return JSON.parse(cleanedText);
        } catch (parseError) {
          this.logger.error(`Failed to parse Gemini response: ${text}`);
          return [];
        }
      } catch (error) {
        this.logger.warn(`Model ${modelName} failed for questions: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    this.logger.error(`All models failed for questions. Last error: ${lastError?.message}`);
    return [];
  }

  async summarizeResume(resumeText: string): Promise<string> {
    if (!this.genAI) return 'AI Summary currently unavailable.';

    const modelsToTry = [
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview',
      'gemini-3-pro-preview',
      'gemini-3.1-pro-preview',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-pro',
    ];

    const prompt = `
Summarize this candidate's professional profile into a single, punchy paragraph (max 100 words).
Focus on:
1. Years of experience and current seniority.
2. Core technical stack (languages, frameworks).
3. Most impressive project or achievement.
4. Primary engineering "superpower" (e.g., performance optimization, UI/UX depth, or backend scalability).

Resume Text:
${resumeText.substring(0, 5000)}
`;

    let lastError: Error | null = null;
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        this.logger.log(`Attempting resume summarization with model: ${modelName}`);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text().trim();
        this.logger.log(`Successfully summarized resume using ${modelName}`);
        return summary;
      } catch (error) {
        this.logger.warn(`Model ${modelName} failed for summary: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    this.logger.error(`All models failed for summary. Last error: ${lastError?.message}`);
    if (lastError) {
      this.logger.debug(`Raw error stack: ${lastError.stack}`);
    }
    return 'Failed to generate summary.';
  }
}
