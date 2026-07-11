import { Mermaid } from '../../components/mermaid/Mermaid';
import { Callout } from '../../components/callouts/Callout';
import { CodeBlock } from '../../components/code/CodeBlock';

export function UserEmbeddings() {
  return (
    <div>
      <h1>User Preference Embeddings</h1>
      <p>
        During registration, Lifebookz collects detailed user preferences. These preferences are
        transformed into vector embeddings and stored in Qdrant for personalized recommendations.
      </p>

      <h2>Data Collection</h2>
      <p>The following user attributes are collected during the onboarding flow:</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900 text-sm mb-1">Interests</h4>
          <p className="text-xs text-slate-500">Topics the user wants to read and write about</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900 text-sm mb-1">Profession</h4>
          <p className="text-xs text-slate-500">Current or past professional experience</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900 text-sm mb-1">Education</h4>
          <p className="text-xs text-slate-500">Educational background and fields of study</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900 text-sm mb-1">Skills</h4>
          <p className="text-xs text-slate-500">Technical and soft skills</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900 text-sm mb-1">Goals</h4>
          <p className="text-xs text-slate-500">Personal and professional aspirations</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900 text-sm mb-1">Languages</h4>
          <p className="text-xs text-slate-500">Languages spoken and preferred content language</p>
        </div>
      </div>

      <h2>Embedding Pipeline</h2>
      <Mermaid
        chart={`sequenceDiagram
    participant U as User
    participant REG as Registration
    participant API as User API
    participant EMB as Embedding Service
    participant QDR as Qdrant
    participant SQS as SQS

    U->>REG: Submit Preferences
    REG->>API: POST /users
    API->>EMB: Generate Embedding
    EMB->>EMB: Encode Preferences\nvia HuggingFace Model
    EMB->>QDR: Store Embedding
    QDR-->>EMB: Confirmed
    EMB-->>API: Embedding ID
    API-->>REG: User Created
    REG-->>U: Welcome & Feed
    
    Note over API,SQS: Async: Publish to\nNotification Queue
    
    API->>SQS: New User Event`}
        caption="User embedding generation during registration"
      />

      <h2>Embedding Model</h2>
      <p>
        We use <strong>HuggingFace sentence-transformers</strong> (specifically <code>all-MiniLM-L6-v2</code>)
        for text embedding generation. This model produces 384-dimensional vectors and is optimized for
        semantic similarity tasks.
      </p>

      <CodeBlock language="python">
{`from sentence_transformers import SentenceTransformer
import numpy as np

# Load the embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

def create_user_embedding(preferences: dict) -> list:
    """Generate user embedding from preferences."""
    
    # Construct a rich text representation of user preferences
    text_representation = f"""
    Interests: {', '.join(preferences['interests'])}
    Profession: {preferences['profession']}
    Education: {', '.join(preferences['education'])}
    Skills: {', '.join(preferences['skills'])}
    Goals: {', '.join(preferences['goals'])}
    Languages: {', '.join(preferences['languages'])}
    """
    
    # Generate embedding vector
    embedding = model.encode(text_representation)
    
    # Normalize for cosine similarity
    embedding = embedding / np.linalg.norm(embedding)
    
    return embedding.tolist()`}
      </CodeBlock>

      <h2>Qdrant Collection Schema</h2>
      <CodeBlock language="typescript">
{`// Qdrant collection configuration for user embeddings
const userCollectionConfig = {
  collectionName: 'user_embeddings',
  vectors: {
    size: 384,
    distance: 'Cosine',  // Cosine similarity
  },
  payloadSchema: {
    userId: { type: 'keyword' },
    interests: { type: 'keyword', indexed: true },
    profession: { type: 'keyword' },
    languages: { type: 'keyword' },
    createdAt: { type: 'datetime' },
  },
  optimizationConfig: {
    indexingThreshold: 50000,
  },
};

// Store user embedding
await qdrantClient.upsert('user_embeddings', {
  wait: true,
  points: [{
    id: nanoid(),
    vector: embedding,
    payload: {
      userId: user.id,
      interests: user.interests,
      profession: user.profession,
      languages: user.languages,
      createdAt: new Date().toISOString(),
    },
  }],
});`}
      </CodeBlock>

      <h2>Use Cases</h2>
      <ul>
        <li><strong>Personalized Feed:</strong> Show stories similar to the user's interests</li>
        <li><strong>Community Suggestions:</strong> Recommend communities with similar interest profiles</li>
        <li><strong>Mentor Matching:</strong> Connect users with mentors who have relevant experience</li>
        <li><strong>Content Discovery:</strong> Surface stories that match the user's goals and background</li>
      </ul>

      <Callout type="tip" title="Privacy">
        User embeddings are stored separately from PII. At no point are raw preferences exposed to
        other users. Recommendation vectors cannot be reverse-engineered to reveal personal information.
      </Callout>
    </div>
  );
}

export default UserEmbeddings;
