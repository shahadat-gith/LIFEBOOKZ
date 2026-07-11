import { Mermaid } from '../../components/mermaid/Mermaid';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Callout } from '../../components/callouts/Callout';
import { Table } from '../../components/table/Table';

export function PromptArchitecture() {
  return (
    <div>
      <h1>Prompt Architecture</h1>
      <p>
        Effective prompt engineering is critical to our AI features. We use a <strong>structured prompt
        system</strong> with versioning, A/B testing, and monitoring to ensure consistent, high-quality
        AI outputs.
      </p>

      <h2>Prompt Management System</h2>
      <Mermaid
        chart={`graph TB
    subgraph Registry["Prompt Registry (MongoDB)"]
        PROMPTS[Prompt Templates]
        VERSIONS[Version History]
        CONFIGS[Model Configs]
    end

    subgraph PIPELINE["Prompt Pipeline"]
        TEMPLATE[Template Engine]
        FILL[Variable Substitution]
        FORMAT[Context Assembly]
        ROUTE[Model Router]
    end

    subgraph EXECUTION["AI Execution"]
        OR[OpenRouter API]
        CACHE[Response Cache]
        FALLBACK[Fallback Model]
    end

    subgraph MONITOR["Monitoring"]
        TRACE[Tracing & Logging]
        QUAL[Quality Scoring]
        COST[Cost Tracking]
        A_B[A/B Test Results]
    end

    PROMPTS --> TEMPLATE
    VERSIONS --> TEMPLATE
    CONFIGS --> ROUTE
    TEMPLATE --> FILL
    FILL --> FORMAT
    FORMAT --> ROUTE
    ROUTE --> OR
    OR --> CACHE
    CACHE --> FALLBACK
    OR --> MONITOR`}
        caption="Prompt management and execution pipeline"
      />

      <h2>Prompt Registry</h2>
      <p>
        All prompts are stored in a <strong>MongoDB collection</strong> as versioned templates. Each
        prompt has a unique ID, version number, and associated configuration (model, temperature,
        max tokens, etc.).
      </p>

      <CodeBlock language="typescript">
{`// Prompt registry schema (MongoDB)
interface PromptTemplate {
  _id: string;
  name: string;
  description: string;
  version: number;
  systemPrompt: string;
  userPromptTemplate: string;
  modelConfig: {
    provider: 'openai' | 'anthropic' | 'meta';
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  costConfig: {
    costPerPrompt: number;
    costPerCompletionToken: number;
  };
  metadata: {
    category: 'enhancement' | 'moderation' | 'embedding';
    active: boolean;
    abTestGroup?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}`}
      </CodeBlock>

      <h2>Prompt Categories</h2>

      <Table
        headers={['Category', 'Model', 'Avg Tokens', 'Cost/Request', 'Version']}
        rows={[
          ['Story Enhancement', 'gpt-4o', '2,500 input / 500 output', '$0.015', 'v3'],
          ['Quick Grammar Fix', 'claude-3-haiku', '800 input / 150 output', '$0.0005', 'v2'],
          ['Moderation Screening', 'gpt-4o-mini', '1,000 input / 50 output', '$0.0003', 'v5'],
          ['Title Suggestions', 'claude-3-haiku', '500 input / 30 output', '$0.00015', 'v1'],
          ['Content Summarization', 'gpt-4o-mini', '2,000 input / 200 output', '$0.0006', 'v2'],
        ]}
      />

      <h2>Template Engine</h2>
      <p>
        Prompts use a <strong>Handlebars-style template syntax</strong> with variables, conditionals,
        and partials. This allows us to reuse common prompt fragments (like tone instructions)
        across multiple prompts.
      </p>

      <CodeBlock language="markdown">
{`---
name: story-enhancement
version: 3
model: gpt-4o
temperature: 0.3
---

System: You are an expert writing coach specializing in personal narratives.

You are helping an author improve their life story on Lifebookz.

{{> tone_guidelines }}

User: Please enhance the following story:

{{story_content}}

Focus areas:
{{#if grammar}}1. Grammar and spelling{{/if}}
{{#if flow}}2. Flow and readability{{/if}}
{{#if emotion}}3. Emotional impact{{/if}}
{{#if structure}}4. Structure improvements{{/if}}

Respond with a JSON array of suggestions.`}
      </CodeBlock>

      <h2>Model Routing</h2>
      <p>
        We route requests to different models based on complexity, latency requirements, and cost:
      </p>
      <ul>
        <li><strong>Simple tasks</strong> (grammar fix, title suggestion) → Claude 3 Haiku (fast, cheap)</li>
        <li><strong>Complex tasks</strong> (full story enhancement) → GPT-4o (powerful, more expensive)</li>
        <li><strong>Batch processing</strong> (moderation, embeddings) → GPT-4o Mini (good balance)</li>
      </ul>

      <h2>A/B Testing</h2>
      <p>
        We continuously A/B test prompt variations to improve quality:
      </p>
      <ul>
        <li>Different prompt phrasings are assigned to experiment groups</li>
        <li>User feedback (accept/reject rate) is tracked per variant</li>
        <li>Statistical significance is computed before promoting a winning variant</li>
        <li>All variants are logged with model, timestamp, and response</li>
      </ul>

      <Callout type="tip" title="Cost Optimization">
        We cache identical prompt+input combinations for 24 hours. For story enhancement, this
        reduces costs by ~15% since authors often re-generate with the same story content.
      </Callout>
    </div>
  );
}

export default PromptArchitecture;
