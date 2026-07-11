import { Mermaid } from '../../components/mermaid/Mermaid';
import { Callout } from '../../components/callouts/Callout';
import { FeatureCard } from '../../components/cards/FeatureCard';
import { getDocsByCategory } from '../../config/docs';

const subPages = getDocsByCategory('ai');

export function AIOverview() {
  return (
    <div>
      <h1>AI Features Overview</h1>
      <p>
        AI is not a feature — it's the <strong>foundation</strong> of the Lifebookz platform. From
        personalized recommendations to intelligent story enhancement, every aspect of the platform
        is augmented by machine learning and large language models.
      </p>

      <Callout type="info" title="AI-First Philosophy">
        We believe AI should enhance human connection, not replace it. Every AI-generated suggestion
        requires human approval. Stories are written by people — AI helps make them better.
      </Callout>

      <h2>AI System Architecture</h2>
      <Mermaid
        chart={`graph TB
    subgraph Input["Data Sources"]
        UP[User Preferences]
        ST[Stories]
        MD[Media Metadata]
    end

    subgraph Processing["AI Processing Pipeline"]
        EMB[Embedding Generation]
        LLM[LLM Enhancement]
        MOD[AI Moderation]
        REC[Recommendation Engine]
    end

    subgraph Storage["Vector Storage"]
        QDR[(Qdrant Vector DB)]
    end

    subgraph Models["AI Models"]
        HF[HuggingFace\nSentence Transformers]
        OR[OpenRouter\nLLM Access]
        CL[CLIP\nImage Embeddings]
    end

    subgraph Output["AI Features"]
        PS[Personalized Search]
        RECO[Recommendations]
        ENH[Story Enhancement]
        COM[Community Matching]
        MEN[Mentor Matching]
    end

    Input --> Processing
    Processing --> Storage
    Processing --> Models
    Models --> Processing
    Storage --> Output`}
        caption="AI system architecture showing data flow through the AI pipeline"
      />

      <h2>Core AI Capabilities</h2>

      <div className="grid sm:grid-cols-2 gap-4 my-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-2">User Embeddings</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            During registration, user preferences (interests, profession, education, skills, goals,
            languages, location) are collected and embedded. These vectors power recommendations,
            community suggestions, and mentor matching.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-2">Story Embeddings</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Published stories are asynchronously embedded through a pipeline: moderation approval
            triggers an SQS event, a background worker generates embeddings, and stores them in Qdrant.
            Stories are never embedded during API requests.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-2">Semantic Search</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Instead of keyword search, we use embeddings. Queries are embedded using the same model,
            and Qdrant returns the top-K most semantically similar stories. This finds relevant content
            even when query terms don't match exactly.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-2">AI Story Enhancement</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Authors receive AI-powered suggestions for improving grammar, flow, structure, and emotional
            storytelling. The author always has final approval — suggested changes are never applied
            automatically.
          </p>
        </div>
      </div>

      <h2>Model Strategy</h2>
      <p>
        We use a <strong>multi-model strategy</strong> to balance cost, quality, and latency:
      </p>
      <ul>
        <li><strong>Embeddings:</strong> HuggingFace sentence-transformers for text, CLIP for images</li>
        <li><strong>Story Enhancement:</strong> OpenRouter API providing access to GPT-4, Claude, and others</li>
        <li><strong>Moderation:</strong> Fine-tuned classifier for policy compliance</li>
        <li><strong>Recommendations:</strong> Cosine similarity over Qdrant vectors</li>
      </ul>

      <h2>AI Feature Pages</h2>
      <div className="feature-grid my-6">
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

export default AIOverview;
