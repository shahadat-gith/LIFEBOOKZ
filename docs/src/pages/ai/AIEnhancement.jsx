import { Mermaid } from '../../components/mermaid/Mermaid';
import { Callout } from '../../components/callouts/Callout';
import { CodeBlock } from '../../components/code/CodeBlock';

export function AIEnhancement() {
  return (
    <div>
      <h1>AI Story Enhancement</h1>
      <p>
        Lifebookz uses AI to help authors improve their stories. The AI suggests improvements to
        grammar, flow, structure, and emotional storytelling. The author always has the final say —
        <strong>suggested changes are never applied automatically</strong>.
      </p>

      <Callout type="info" title="Human-in-the-Loop">
        AI enhances, humans decide. Every suggested change requires explicit author approval before
        being applied. This ensures the author's voice and intent are always preserved.
      </Callout>

      <h2>Enhancement Workflow</h2>
      <Mermaid
        chart={`sequenceDiagram
    participant A as Author
    participant UI as Editor UI
    participant API as Enhancement API
    participant LLM as OpenRouter LLM
    participant DB as MongoDB

    A->>UI: Write Story
    UI->>A: Real-time Content
    A->>UI: Click "Enhance"
    UI->>API: POST /enhance
    
    Note over API: Send story to LLM
    API->>LLM: Story Content + Prompt
    LLM-->>API: Suggestions JSON
    
    Note over API: Parse and structure
    API-->>UI: Suggestions Array
    
    UI->>A: Show Suggestions
    Note over UI,A: Side-by-side diff view
    
    A->>UI: Review & Select Changes
    A->>UI: Approve Selected
    UI->>API: Apply Approved Changes
    API->>DB: Update Story Content
    API-->>UI: Updated Story
    UI-->>A: Enhanced Story`}
        caption="AI enhancement workflow with author approval"
      />

      <h2>Enhancement Types</h2>

      <div className="grid sm:grid-cols-2 gap-4 my-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-2">Grammar & Spelling</h3>
          <p className="text-xs text-slate-600">Corrects grammatical errors, punctuation, and spelling mistakes while preserving the author's style.</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-2">Flow & Readability</h3>
          <p className="text-xs text-slate-600">Improves sentence structure, transitions between paragraphs, and overall narrative flow.</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-2">Emotional Impact</h3>
          <p className="text-xs text-slate-600">Enhances emotional storytelling by suggesting more vivid language, sensory details, and authentic emotional beats.</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-2">Structural Suggestions</h3>
          <p className="text-xs text-slate-600">Recommends structural improvements like adding a stronger opening hook, clearer pacing, or a more satisfying conclusion.</p>
        </div>
      </div>

      <h2>Prompt Engineering</h2>
      <p>
        The enhancement prompt is carefully designed to produce actionable, structured suggestions
        rather than generic feedback.
      </p>

      <CodeBlock language="markdown">
{`You are an expert writing coach specializing in personal narratives and life stories.

Analyze the following story and provide specific, actionable improvements.

Focus on:
1. GRAMMAR: Fix grammatical errors and awkward phrasing
2. FLOW: Improve sentence and paragraph transitions
3. EMOTION: Enhance emotional depth and authenticity
4. STRUCTURE: Suggest structural improvements

For each suggestion, provide:
- The original text snippet
- The improved version
- The category (grammar/flow/emotion/structure)
- A brief explanation of why the change improves the story

IMPORTANT RULES:
- Preserve the author's voice and perspective
- Do not change factual content
- Do not add fictional details
- Be respectful of sensitive topics
- Suggest changes, never rewrite entirely

Story:
{{STORY_CONTENT}}

Respond with a JSON array of suggestions.`}
      </CodeBlock>

      <h2>Response Format</h2>
      <CodeBlock language="json">
{`{
  "suggestions": [
    {
      "id": "sug_01H2XYZ",
      "category": "grammar",
      "originalSnippet": "He don't know nothing about...",
      "improvedSnippet": "He doesn't know anything about...",
      "explanation": "Corrected double negative and subject-verb agreement.",
      "startPosition": 145,
      "endPosition": 175,
      "severity": "high"
    },
    {
      "id": "sug_01H3ABC",
      "category": "emotion",
      "originalSnippet": "I was sad when I left.",
      "improvedSnippet": "A hollow ache settled in my chest as I walked away, knowing nothing would ever be the same.",
      "explanation": "Show, don't tell. This revision uses sensory details to convey the emotional weight of the moment.",
      "startPosition": 320,
      "endPosition": 345,
      "severity": "medium"
    }
  ],
  "summary": {
    "totalSuggestions": 8,
    "grammar": 3,
    "flow": 2,
    "emotion": 2,
    "structure": 1
  }
}`}
      </CodeBlock>

      <h2>Cost Management</h2>
      <p>
        Enhancement requests use the LLM via OpenRouter. To manage costs, we implement:
      </p>
      <ul>
        <li><strong>Token limits:</strong> Stories over 4,000 tokens are truncated; the author is notified</li>
        <li><strong>Rate limiting:</strong> Maximum 5 enhancements per story, 20 per hour per user</li>
        <li><strong>Model routing:</strong> Simple grammar fixes use a smaller, cheaper model; full enhancement uses GPT-4</li>
        <li><strong>Caching:</strong> Identical enhancement requests (unlikely but possible) are cached for 24 hours</li>
      </ul>

      <Callout type="tip" title="Author Ownership">
        Authors retain full ownership of their stories. AI suggestions are a tool, not a replacement.
        The story is 100% the author's work — AI just helps polish it.
      </Callout>
    </div>
  );
}

export default AIEnhancement;
