import { Mermaid } from '../../components/mermaid/Mermaid';
import { Table } from '../../components/table/Table';
import { Callout } from '../../components/callouts/Callout';
import { StatCard } from '../../components/cards/StatCard';

export function CostOptimization() {
  return (
    <div>
      <h1>Cost Optimization</h1>
      <p>
        AI inference costs can grow exponentially with user adoption. Lifebookz employs multiple
        strategies to keep AI costs <strong>predictable and sustainable</strong> while maintaining
        quality.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
        <StatCard label="Monthly AI Cost" value="$12,450" description="Current spend" trend={-8} />
        <StatCard label="Cost/Enhancement" value="$0.015" description="GPT-4o per request" />
        <StatCard label="Cache Hit Rate" value="18%" description="Response caching" />
        <StatCard label="Model Cost/Token" value="85%" description="Saved via model routing" />
      </div>

      <h2>Cost Optimization Strategies</h2>

      <Mermaid
        chart={`graph TB
    subgraph Strategies["Cost Optimization Strategies"]
        MR[Model Routing]
        CACHE[Response Caching]
        BATCH[Batch Processing]
        THROTTLE[Rate Limiting]
        QUANT[Quantization]
    end

    subgraph Impact["Cost Impact"]
        MR_I[40% Reduction]
        CACHE_I[15% Reduction]
        BATCH_I[10% Reduction]
        THROTTLE_I[20% Reduction]
        QUANT_I[5% Reduction]
    end

    subgraph Total["Total Savings"]
        TOTAL[~65% vs Unoptimized]
    end

    MR --> MR_I
    CACHE --> CACHE_I
    BATCH --> BATCH_I
    THROTTLE --> THROTTLE_I
    QUANT --> QUANT_I
    MR_I --> TOTAL
    CACHE_I --> TOTAL
    BATCH_I --> TOTAL
    THROTTLE_I --> TOTAL
    QUANT_I --> TOTAL`}
        caption="Cost optimization strategies and their impact"
      />

      <h2>1. Model Routing</h2>
      <p>
        Not all tasks need GPT-4. We route requests to the most cost-effective model that meets
        quality requirements:
      </p>
      <Table
        headers={['Task', 'Primary Model', 'Fallback Model', 'Cost Difference']}
        rows={[
          ['Grammar Fix', 'Claude 3 Haiku ($0.0005)', 'GPT-4o ($0.015)', '30x cheaper'],
          ['Story Enhancement', 'GPT-4o ($0.015)', 'Claude 3 Sonnet ($0.009)', '1.7x cheaper'],
          ['Moderation', 'GPT-4o Mini ($0.0003)', 'GPT-4o ($0.015)', '50x cheaper'],
          ['Title Generation', 'Claude 3 Haiku ($0.00015)', 'GPT-4o ($0.008)', '53x cheaper'],
        ]}
      />

      <h2>2. Response Caching</h2>
      <p>
        We cache AI responses at multiple levels:
      </p>
      <ul>
        <li><strong>Exact match caching:</strong> Same prompt + input = cached response (TTL: 24h)</li>
        <li><strong>Semantic deduplication:</strong> Similar stories get near-identical suggestions; we detect and reuse</li>
        <li><strong>Batch-aware caching:</strong> Multiple stories from the same author batched into a single enhancement call</li>
      </ul>

      <h2>3. Batch Processing</h2>
      <p>
        For embedding generation, we batch multiple stories into a single model call. This increases
        throughput by 10x while reducing per-story cost by 40%.
      </p>

      <CodeBlock language="python">
{`# Batch embedding generation
def batch_embed_stories(stories: list[dict], batch_size: int = 32):
    """Generate embeddings for multiple stories in a batch."""
    all_embeddings = []
    
    for i in range(0, len(stories), batch_size):
        batch = stories[i:i + batch_size]
        
        # Prepare batch texts
        texts = [
            f"{story['title']}\\n{story['content'][:5000]}"
            for story in batch
        ]
        
        # Single model call for the entire batch
        embeddings = model.encode(texts)
        
        all_embeddings.extend(embeddings)
    
    return all_embeddings`}
      </CodeBlock>

      <h2>4. Rate Limiting & Quotas</h2>
      <p>
        To prevent runaway costs from abusive patterns:
      </p>
      <ul>
        <li><strong>Per-user:</strong> 5 enhancements/hour, 20/day</li>
        <li><strong>Per-story:</strong> Maximum 10 enhancement requests</li>
        <li><strong>Global:</strong> Exponential backoff on repeated requests to same content</li>
        <li><strong>Anomaly detection:</strong> Sudden spike in usage triggers automatic throttling</li>
      </ul>

      <h2>5. Model Quantization</h2>
      <p>
        For self-hosted embedding models, we use <strong>quantized versions</strong> (int8 vs float32),
        reducing memory footprint by 4x and inference cost by 3x with negligible quality loss.
      </p>

      <h2>Monthly Budget Allocation</h2>
      <Mermaid
        chart={`pie title AI Cost Breakdown
    "Story Enhancement" : 40
    "Embedding Generation" : 25
    "Moderation" : 15
    "Semantic Search" : 10
    "Recommendations" : 10`}
        caption="Current AI cost allocation by feature"
      />

      <Callout type="tip" title="Monitoring">
        All AI costs are tracked per-user, per-feature, and per-model in our observability dashboard.
        Alerts trigger when costs exceed 120% of the budgeted amount.
      </Callout>
    </div>
  );
}

export default CostOptimization;
