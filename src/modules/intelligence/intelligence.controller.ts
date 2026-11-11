import { Request, Response } from 'express';
import { detectPatterns } from './pattern.detector';
import { explainPatterns } from './ai.service';

export const analyzeWorkspace = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const mode = (req.query.mode as string) || 'plain';

    
    const patterns = await detectPatterns(workspaceId);
    
    
    const explanationString = await explainPatterns(patterns, mode);
const explanation = JSON.parse(explanationString); // Parse it into a real object
    
    return res.status(200).json({
      status: 'success',
      patternsFound: patterns.length,
      patterns: patterns,
      aiExplanation: explanation
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};