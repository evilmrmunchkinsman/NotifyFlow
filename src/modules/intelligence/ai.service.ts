import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const explainPatterns = async (patterns: any[], mode: string) => {
  if (patterns.length === 0) {
    return "Everything looks healthy! No failure patterns detected.";
  }

  
  const systemPrompts: Record<string, string> = {
    engineer: `You are a senior deliverability engineer. Explain the failure pattern technically and give specific actionable fixes. Be direct.`,
    plain: `You are explaining a notification delivery problem to a non-technical founder. Use plain language, no jargon.`,
    urgent: `Critical delivery failure detected. Be extremely concise. State the problem in one sentence and the fix in one sentence.`,
    roast: `You are a cynical senior developer. Roast the user for their terrible notification setup, but still give them the actual fix.`
  };

  const systemPrompt = systemPrompts[mode] || systemPrompts['plain'] || "You are an AI assistant.";

  try {
   
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(patterns) }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content || "Failed to generate explanation.";

  } catch (error) {
    
    console.error("Groq API Error:", error);
    return `Fallback Explanation: Detected ${patterns.length} failure patterns. Please check your provider status and domain DNS settings.`;
  }
};