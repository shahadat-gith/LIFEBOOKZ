import { Mermaid } from '../../components/mermaid/Mermaid';
import { Callout } from '../../components/callouts/Callout';
import { FeatureCard } from '../../components/cards/FeatureCard';
import { getDocsByCategory } from '../../config/docs';
import { HiOutlineCube, HiOutlineServer, HiOutlineLightningBolt, HiOutlineRefresh } from 'react-icons/hi';

const subPages = getDocsByCategory('architecture');

export function Architecture() {
  return (
    <div>
      <h1>Architecture Overview</h1>
      <p className="lead">
        Lifebookz is built on a <strong>serverless-first, event-driven microservice architecture</strong> designed for
        scale, resilience, and cost efficiency. Every component is independently deployable and auto-scaling.
      </p>

      <Callout type="info" title="Design Principles">
        Our architecture prioritizes asynchronous processing, separation of concerns, and fault isolation.
        No single service failure can cascade to the entire system.
      </Callout>

      <h2>High-Level Architecture</h2>
      <p>
        The platform is organized into distinct layers: clients, edge/API, microservices, background workers,
        data storage, AI inference, and media management. Each layer communicates through well-defined interfaces.
      </p>

      <Mermaid
        chart={`graph TB
    subgraph Clients["Client Layer"]
        WEB[Web App - React]
        MOB[Mobile - React Native]
        API[External API Clients]
    end

    subgraph Edge["Edge & API Layer"]
        CF[CloudFront CDN]
        WAF[AWS WAF]
        AG[API Gateway]
    end

    subgraph Services["Service Layer"]
        US[User Service]
        SS[Story Service]
        RS[Recommendation Service]
        AS[AI Enhancement Service]
        MS[Moderation Service]
    end

    subgraph Async["Async Layer"]
        SQS[Amazon SQS]
    end

    subgraph Workers["Worker Layer"]
        EW[Embedding Worker]
        NW[Notification Worker]
        MW[Moderation Worker]
    end

    subgraph Storage["Storage Layer"]
        MDB[(MongoDB Atlas)]
        QDR[(Qdrant)]
        CL[Cloudinary Media]
    end

    subgraph AI["AI Layer"]
        EMB[Embedding Models]
        LLM[LLMs - OpenRouter]
    end

    Clients --> CF
    CF --> WAF
    WAF --> AG
    AG --> Services
    Services --> Storage
    Services --> Async
    Async --> Workers
    Workers --> AI
    Workers --> Storage
    Services --> AI`}
        caption="High-level system architecture showing all major components and data flows"
      />

      <h2>Key Architectural Decisions</h2>

      <div className="grid gap-6 my-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-indigo-50 rounded-lg shrink-0">
              <HiOutlineServer className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Serverless First</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                All compute runs on AWS Lambda. No EC2 instances to manage. Auto-scaling from zero
                to thousands of concurrent requests. Pay only for what you use.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-fuchsia-50 rounded-lg shrink-0">
              <HiOutlineRefresh className="w-5 h-5 text-fuchsia-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Event-Driven Communication</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Services communicate asynchronously through Amazon SQS. No tight coupling. No Redis.
                No BullMQ. Events are persisted in queues with built-in retry and dead-letter handling.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-emerald-50 rounded-lg shrink-0">
              <HiOutlineLightningBolt className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">AI-First Data Pipeline</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Content is never embedded during API requests. Stories flow through an async pipeline:
                moderation → SQS → embedding worker → Qdrant. This ensures consistent performance
                and cost control.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2>Sections in this Chapter</h2>
      <div className="grid sm:grid-cols-2 gap-3 my-6">
        {subPages.map((doc) => (
          <FeatureCard
            key={doc.id}
            title={doc.title}
            description={doc.description}
            icon={doc.icon}
            route={doc.route}
          />
        ))}
      </div>
    </div>
  );
}

export default Architecture;
