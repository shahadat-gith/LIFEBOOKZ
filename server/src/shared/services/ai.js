import { generateContent } from '../llm/response.js';

/**
 * Analyze story content for hate speech, legal issues, and policy violations.
 */
export async function analyzeStoryContent(content, title) {
  const system = `You are a content safety and legal compliance reviewer. Analyze the following story for:

1. **Hate Speech & Discrimination** - Racism, sexism, religious hatred, etc.
2. **Legal Complications** - Defamation, copyright infringement, illegal activities, privacy violations
3. **Harassment or Bullying** - Personal attacks, doxxing, targeted harassment
4. **Violence or Gore** - Excessive or gratuitous violence
5. **NSFW Content** - Explicit sexual content
6. **Spam or Misinformation** - False information, spam

Respond with JSON only:
{
  "isClean": true/false,
  "issues": [
    {
      "category": "hate_speech|legal|harassment|violence|nsfw|spam",
      "severity": "high|medium|low",
      "description": "Specific description of the issue found",
      "suggestion": "How the author should fix this"
    }
  ],
  "overallAssessment": "Brief summary of the analysis",
  "canProceed": true/false
}

If no issues found, return an empty issues array and isClean: true. Be thorough but fair.`;

  const prompt = `Title: ${title}\n\nContent: ${content}`;

  try {
    const msg = await generateContent({ system, prompt, json: true });
    const match = msg.match(/```(?:json)?\s*([\s\S]*?)```/) || [];
    return JSON.parse((match[1] || msg).trim());
  } catch {
    return {
      isClean: false,
      issues: [{ category: 'system', severity: 'medium', description: 'Analysis failed, please try again', suggestion: 'Resubmit the story for analysis' }],
      overallAssessment: 'Could not analyze content',
      canProceed: false,
    };
  }
}

/**
 * Correct grammar and spelling mistakes.
 */
export async function correctGrammar(content, title) {
  const system = `You are a professional editor. Correct grammar, spelling, and punctuation mistakes in the following story.

RULES:
- ONLY fix grammar, spelling, and punctuation errors
- Preserve the author's voice, style, and perspective
- Do NOT change any factual content, names, or dialogue
- Keep the markdown format intact
- Return the FULL corrected story, not just changes
- Do not wrap in code blocks
- Do not add any commentary outside the story`;

  const prompt = `# ${title}\n\n${content}`;

  return await generateContent({ system, prompt });
}

/**
 * Extract a concise summary of the story for embedding.
 */
export async function extractEmbeddingSummary(content, title) {
  const system = `Extract a concise summary (2-3 paragraphs) of this story's key themes, emotions, and narrative elements. Focus on what makes this story meaningful or recommendation-worthy. This summary will be used for semantic search to help users find relevant stories.

Include:
- Core theme and emotional arc
- Key insights or life lessons
- Genre/style indicators
- Memorable moments or turning points

Return ONLY the summary text, no commentary or markdown formatting. Keep it between 200-500 characters.`;

  const prompt = `Title: ${title}\n\nContent: ${content}`;

  try {
    const summary = await generateContent({ system, prompt });
    return summary.trim().slice(0, 1000);
  } catch {
    return `${title}. ${content.replace(/[#*_`~>\[\]()!-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 500)}`;
  }
}

/**
 * Enhance story content using AI.
 */
export async function enhanceStory(content, title) {
  const system = `You are an expert writing coach. Improve the following story in markdown format.

Focus on:
- Grammar and spelling
- Flow and readability
- Emotional impact
- Structure

RULES:
- Preserve the author's voice and perspective
- Do not change factual content
- Keep the markdown format
- Return the enhanced story in full, not just changes
- No commentary outside the markdown
- Do not wrap in code blocks`;

  const prompt = `# ${title}\n\n${content}`;

  return await generateContent({ system, prompt });
}


/**
 * Generate title suggestions.
 */
export async function generateTitleSuggestions(content) {
  const system = 'Suggest 5 compelling titles for this story. Return a JSON array of strings only.';

  try {
    const msg = await generateContent({ system, prompt: content, json: true });
    const match = msg.match(/```(?:json)?\s*([\s\S]*?)```/) || [];
    return JSON.parse((match[1] || msg).trim());
  } catch {
    return [];
  }
}
