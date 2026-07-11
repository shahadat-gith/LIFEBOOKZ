import { Mermaid } from '../../components/mermaid/Mermaid';
import { Table } from '../../components/table/Table';
import { Badge } from '../../components/ui/Badge';
import { Callout } from '../../components/callouts/Callout';

export function FutureRoadmap() {
  return (
    <div>
      <h1>Future Roadmap</h1>
      <p>
        Our AI roadmap is driven by user feedback, technological advances, and our mission to
        preserve human stories. Here's what we're building next.
      </p>

      <h2>Development Timeline</h2>
      <Mermaid
        chart={`gantt
    title AI Features Roadmap 2025-2026
    dateFormat  YYYY-MM
    axisFormat  %b %Y

    section Q3 2025
    Multi-language Embeddings    :2025-07, 2025-09
    AI Audio Transcription       :2025-08, 2025-09

    section Q4 2025
    Image Recognition & Tagging  :2025-10, 2025-12
    Collaborative Filtering      :2025-10, 2025-11
    AI Time Capsule Generation   :2025-11, 2025-12

    section Q1 2026
    Emotional Sentiment Analysis :2026-01, 2026-03
    AI Story Video Trailers      :2026-01, 2026-03
    Multi-modal Search           :2026-02, 2026-03

    section Q2 2026
    AI Life Timeline Generation  :2026-04, 2026-06
    Predictive Content Curation  :2026-04, 2026-05
    Personal AI Storyteller      :2026-05, 2026-06`}
        caption="AI features roadmap through 2026"
      />

      <h2>Upcoming Features</h2>

      <h3>Q3 2025 <Badge variant="primary" className="ml-2">In Development</Badge></h3>

      <h4>Multi-language Embeddings</h4>
      <p>
        Extend embedding models to support stories written in 50+ languages. Use multilingual
        sentence transformers to enable cross-language semantic search and recommendations.
        A user reading in Spanish can discover stories written in Japanese.
      </p>

      <h4>AI Audio Transcription</h4>
      <p>
        Automatically transcribe uploaded audio stories using Whisper. Generate embeddings from
        transcriptions. Enable text search across audio content. Support for 99 languages.
      </p>

      <h3>Q4 2025 <Badge variant="warning" className="ml-2">Planned</Badge></h3>

      <h4>Image Recognition & Tagging</h4>
      <p>
        Auto-tag uploaded photos with CLIP embeddings. Generate image descriptions for accessibility.
        Enable visual similarity search — find stories with photos similar to a reference image.
      </p>

      <h4>Collaborative Filtering</h4>
      <p>
        Augment content-based recommendations with collaborative filtering. Users with similar
        reading patterns will surface stories that content-based filtering might miss.
      </p>

      <h4>AI Time Capsule Generation</h4>
      <p>
        Automatically generate time capsule summaries from a user's stories over a period.
        AI identifies key themes, milestones, and emotional arcs to create a narrative summary.
      </p>

      <h3>Q1 2026 <Badge variant="info" className="ml-2">Research</Badge></h3>

      <h4>Emotional Sentiment Analysis</h4>
      <p>
        Analyze emotional arcs within stories (joy, sadness, fear, anticipation). Enable users to
        search stories by emotional content. Surface stories with similar emotional journeys.
      </p>

      <h4>Multi-modal Search</h4>
      <p>
        Search across text, images, and audio with a single query. Use CLIP-style embeddings that
        project all modalities into a shared vector space. Find stories by describing what you
        want to see, hear, or read.
      </p>

      <h3>Q2 2026 <Badge variant="info" className="ml-2">Research</Badge></h3>

      <h4>Personal AI Storyteller</h4>
      <p>
        An AI companion that helps users craft their life story through guided conversation.
        The AI asks thoughtful questions, suggests narrative structures, and helps users discover
        the stories that matter most.
      </p>

      <h2>Technical Investments</h2>
      <Table
        headers={['Area', 'Current State', 'Target State', 'Timeline']}
        rows={[
          ['Model Serving', 'OpenRouter API', 'Self-hosted for popular models', 'Q1 2026'],
          ['Embedding Models', 'MiniLM-L6 (384d)', 'mxbai-embed-large (1024d)', 'Q3 2025'],
          ['Vector Database', 'Qdrant Cloud', 'Self-hosted Qdrant cluster', 'Q1 2026'],
          ['CI/CD for Prompts', 'Manual', 'Automated prompt evaluation pipeline', 'Q4 2025'],
          ['A/B Testing', 'Basic', 'Multi-variant with statistical engine', 'Q3 2025'],
        ]}
      />

      <Callout type="info" title="Community-Driven Roadmap">
        Our roadmap is shaped by user feedback. Join our GitHub Discussions to suggest features,
        vote on priorities, and track progress.
      </Callout>
    </div>
  );
}

export default FutureRoadmap;
