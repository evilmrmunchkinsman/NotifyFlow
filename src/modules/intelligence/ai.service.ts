import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const explainPatterns = async (patterns: any[], mode: string) => {
  if (patterns.length === 0) {
    return JSON.stringify({ 
      summary: "Everything looks healthy!", 
      rootCause: "None", 
      immediateAction: "None", 
      severity: "low" 
    });
  }

  // 1. Add the hard JSON instruction to every prompt
  const systemPrompts: Record<string, string> = {
    engineer: `You are a senior deliverability engineer. Explain the failure pattern technically and give specific actionable fixes.`,
    plain: `You are explaining a notification delivery problem to a non-technical founder. Use plain language.`,
    urgent: `Critical delivery failure detected. Be extremely concise.`,
    roast: `You are a cynical senior developer. Roast the user for their terrible notification setup.`
  };

  const basePrompt = systemPrompts[mode] || systemPrompts['plain'];
  
  // Force JSON format
  const systemPrompt = `${basePrompt} 
  
  IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation outside the JSON. Format exactly like this:
  {"summary":"...","rootCause":"...","immediateAction":"...","preventionTip":"...","severity":"critical|high|medium"}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(patterns) }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.5,
      // 2. GROQ'S NATIVE JSON MODE:
      response_format: { type: "json_object" } 
    });

    const rawText = response.choices[0]?.message?.content || "{}";

    // 3. Strip markdown just in case Groq disobeys the JSON mode
    const cleanText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    
    return cleanText;

  } catch (error) {
    console.error("Groq API Error:", error);
    
    // Return a structured fallback JSON
    return JSON.stringify({ 
      summary: `Detected ${patterns.length} failure patterns.`, 
      rootCause: "Unknown (API Fallback)", 
      immediateAction: "Check provider status and DNS settings.", 
      preventionTip: "Monitor your delivery rates.", 
      severity: "critical" 
    });
  }
};