import { Mermaid } from '../../components/mermaid/Mermaid';
import { FeatureCard } from '../../components/cards/FeatureCard';
import { Callout } from '../../components/callouts/Callout';
import { getDocsByCategory } from '../../config/docs';

const subPages = getDocsByCategory('database');

export function DatabaseOverview() {
  return (
    <div>
      <h1>Database Overview</h1>
      <p>
        Lifebookz uses a <strong>polyglot persistence</strong> strategy. Different data types are
        stored in the database best suited for their access patterns: <strong>MongoDB Atlas</strong>
        for primary application data and <strong>Qdrant</strong> for vector embeddings.
      </p>

      <h2>Data Architecture</h2>
      <Mermaid
        chart={`graph TB
    subgraph MongoDB["MongoDB Atlas - Primary Database"]
        USERS[Users Collection]
        STORIES[Stories Collection]
        MEDIA[Media Collection]
        COMMENTS[Comments Collection]
        COMMUNITIES[Communities Collection]
        PROMPTS[Prompt Templates]
        ANALYTICS[Analytics Events]
    end

    subgraph Qdrant["Qdrant - Vector Database"]
        UE[User Embeddings\n384-dim vectors]
        SE[Story Embeddings\n384-dim vectors]
        ME[Media Embeddings\n512-dim vectors]
    end

    subgraph Cloudinary["Cloudinary - Media Storage"]
        PHOTOS[Photos]
        VIDEOS[Videos]
        AUDIO[Audio Files]
    end

    subgraph Access["Access Patterns"]
        CRUD[CRUD Operations]
        SEARCH[Semantic Search]
        REC[Recommendations]
        AGG[Analytics Aggregation]
    end

    CRUD --> MongoDB
    AGG --> MongoDB
    SEARCH --> Qdrant
    REC --> Qdrant
    MongoDB --> Cloudinary`}
        caption="Polyglot persistence architecture"
      />

      <h2>Database Responsibilities</h2>

      <div className="grid gap-6 my-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">MongoDB Atlas</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Primary operational database. Stores all application data: users, stories, communities,
            comments, prompt templates, and analytics events.
          </p>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>✅ Schema flexibility for evolving story formats</li>
            <li>✅ Powerful aggregation pipeline for analytics</li>
            <li>✅ Atlas Search for fallback keyword queries</li>
            <li>✅ Automatic sharding for horizontal scaling</li>
            <li>✅ Multi-region replication for disaster recovery</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Qdrant</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Vector database for embeddings. Powers semantic search, recommendations, and similarity
            matching for users, stories, and media.
          </p>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>✅ Approximate Nearest Neighbor (ANN) search</li>
            <li>✅ Cosine similarity with payload filtering</li>
            <li>✅ Horizontal sharding for scale</li>
            <li>✅ Built-in vector quantization (scalar & product)</li>
            <li>✅ HNSW index for sub-10ms queries</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Cloudinary</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            Media storage and transformation. Handles all user-uploaded photos, videos, and audio
            files with automatic optimization and CDN delivery.
          </p>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>✅ Automatic image optimization (WebP, AVIF)</li>
            <li>✅ Video transcoding and streaming</li>
            <li>✅ Audio format conversion</li>
            <li>✅ Content moderation API integration</li>
            <li>✅ Built-in CDN with global edge network</li>
          </ul>
        </div>
      </div>

      <h2>Data Flow Patterns</h2>
      <p>
        The data flow differs based on the operation type. Here are the main patterns:
      </p>
      <ul>
        <li><strong>Write path:</strong> API Lambda → MongoDB (primary) → SQS (async) → Worker → Qdrant</li>
        <li><strong>Read path:</strong> API Lambda → MongoDB (primary data) + Qdrant (embeddings)</li>
        <li><strong>Search path:</strong> API → Embedding → Qdrant (story IDs) → MongoDB (full content)</li>
        <li><strong>Recommendation path:</strong> API → Qdrant (user & story vectors) → Rank → Response</li>
      </ul>

      <h2>Database Pages</h2>
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

export default DatabaseOverview;
