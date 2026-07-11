import { Mermaid } from '../../components/mermaid/Mermaid';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Callout } from '../../components/callouts/Callout';

export function EventDriven() {
  return (
    <div>
      <h1>Event-Driven Architecture</h1>
      <p>
        Asynchronous event processing is the backbone of Lifebookz. We use <strong>Amazon SQS</strong>
        as our sole message broker — no Redis, no BullMQ, no Kafka. This keeps the architecture simple,
        fully managed, and infinitely scalable.
      </p>

      <h2>Event Flow Overview</h2>
      <Mermaid
        chart={`graph TB
    subgraph Producers["Event Producers"]
        US[User Service]
        SS[Story Service]
        AS[AI Enhancement]
    end

    subgraph SQS["Amazon SQS Queues"]
        EQ[Embedding Queue]
        MQ[Moderation Queue]
        NQ[Notification Queue]
        DLQ[Dead Letter Queue]
    end

    subgraph Consumers["Event Consumers"]
        EW[Embedding Worker]
        MW[Moderation Worker]
        NW[Notification Worker]
    end

    subgraph DLQHandler["Dead Letter Handling"]
        DH[DLQ Processor]
        ALERT[Alert Team]
    end

    US -->|New User| NQ
    SS -->|Story Published| MQ
    MQ -->|Approved| EQ
    SS -->|New Story| NQ
    AS -->|Enhancement Complete| NQ

    EQ --> EW
    MQ --> MW
    NQ --> NW

    SQS -.->|Failed Messages| DLQ
    DLQ --> DH
    DH --> ALERT`}
        caption="Event flow through SQS queues with dead letter handling"
      />

      <h2>Queue Structure</h2>

      <div className="grid gap-4 my-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900">Embedding Queue</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">High Throughput</span>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            Receives events when a story passes moderation. The embedding worker consumes from this
            queue, generates vector embeddings, and stores them in Qdrant.
          </p>
          <div className="text-xs text-slate-400">
            <strong>Visibility Timeout:</strong> 300s | <strong>Max Receives:</strong> 3 | <strong>Batch Size:</strong> 10
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900">Moderation Queue</h3>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Low Latency</span>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            Receives newly published stories. The moderation worker reviews content for policy
            compliance using AI screening and, for edge cases, routes to human reviewers.
          </p>
          <div className="text-xs text-slate-400">
            <strong>Visibility Timeout:</strong> 600s | <strong>Max Receives:</strong> 3 | <strong>Batch Size:</strong> 5
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900">Notification Queue</h3>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">Best Effort</span>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            Receives events for push notifications, email digests, and in-app alerts. Multiple
            producers can enqueue notification events.
          </p>
          <div className="text-xs text-slate-400">
            <strong>Visibility Timeout:</strong> 120s | <strong>Max Receives:</strong> 3 | <strong>Batch Size:</strong> 10
          </div>
        </div>
      </div>

      <h2>Message Format</h2>
      <p>Every SQS message follows a standardized envelope format:</p>

      <CodeBlock language="json">
{`{
  "eventId": "evt_01H2XYZ...",
  "eventType": "story.published",
  "source": "story-service",
  "timestamp": "2025-06-15T10:30:00Z",
  "version": "1.0",
  "data": {
    "storyId": "story_01H2ABC...",
    "authorId": "user_01H2DEF...",
    "title": "My Journey Through...",
    "contentPreview": "string",
    "mediaIds": ["media_01H2GHI..."]
  }
}`}
      </CodeBlock>

      <h2>Dead Letter Handling</h2>
      <p>
        Each queue has a corresponding dead letter queue (DLQ). After 3 failed processing attempts,
        messages are moved to the DLQ. A scheduled Lambda processes the DLQ daily, categorizing failures as:
      </p>
      <ul>
        <li><strong>Retryable:</strong> Transient errors (throttling, timeouts) — re-enqueue with backoff</li>
        <li><strong>Non-retryable:</strong> Data format errors — log and alert the engineering team</li>
        <li><strong>Critical:</strong> Systemic failures — page the on-call engineer</li>
      </ul>

      <Callout type="info" title="Why SQS?">
        SQS provides exactly-once delivery in standard queues (at-least-once), automatic retries,
        dead letter support, and seamless integration with Lambda. No infrastructure to manage.
      </Callout>
    </div>
  );
}

export default EventDriven;
