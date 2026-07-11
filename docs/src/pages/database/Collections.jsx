import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';
import { Callout } from '../../components/callouts/Callout';

export function Collections() {
  return (
    <div>
      <h1>Collections & Schema</h1>
      <p>
        This page documents the MongoDB collection schemas used across the Lifebookz platform.
        All schemas are defined using <strong>Mongoose-like</strong> patterns with JSON Schema
        validation enforced at the database level.
      </p>

      <h2>Users Collection</h2>
      <CodeBlock language="typescript">
{`// users collection schema
interface User {
  _id: ObjectId;
  email: string;                // Unique, indexed
  username: string;             // Unique, indexed
  passwordHash: string;         // bcrypt
  displayName: string;
  bio?: string;
  avatar?: string;              // Cloudinary URL
  
  // Preferences (used for embeddings)
  preferences: {
    interests: string[];         // ["storytelling", "technology", ...]
    profession?: string;
    education?: string[];
    skills?: string[];
    goals?: string[];
    languages: string[];         // ["en", "es", ...]
    location?: {
      country?: string;
      city?: string;
    };
  };

  // Metadata
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;

  // Embedding reference
  embeddingId?: string;         // Qdrant point ID
}`}
      </CodeBlock>

      <h2>Stories Collection</h2>
      <CodeBlock language="typescript">
{`// stories collection schema
interface Story {
  _id: ObjectId;
  authorId: ObjectId;           // Ref: users
  title: string;
  content: string;
  contentExcerpt: string;       // First 200 chars for preview

  // Categorization
  category: 'life-story' | 'diary' | 'time-capsule' | 'letter' | 'lesson';
  tags: string[];
  language: string;             // ISO 639-1

  // Media attachments
  media: Array<{
    type: 'photo' | 'video' | 'audio';
    url: string;                // Cloudinary URL
    publicId: string;           // Cloudinary public ID
    caption?: string;
    width?: number;
    height?: number;
    duration?: number;          // Video/audio duration in seconds
  }>;

  // Moderation
  moderationStatus: 'pending' | 'approved' | 'rejected';
  moderationNote?: string;
  moderatedBy?: ObjectId;       // Ref: users (moderator)
  moderatedAt?: Date;

  // AI Enhancement
  enhancementHistory: Array<{
    suggestionId: string;
    appliedSuggestion: string;
    originalSnippet: string;
    improvedSnippet: string;
    category: 'grammar' | 'flow' | 'emotion' | 'structure';
    appliedAt: Date;
  }>;

  // Metrics
  viewCount: number;
  likeCount: number;
  commentCount: number;

  // Embedding
  embeddingId?: string;         // Qdrant point ID

  // Timestamps
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}`}
      </CodeBlock>

      <h2>Comments Collection</h2>
      <CodeBlock language="typescript">
{`// comments collection schema
interface Comment {
  _id: ObjectId;
  storyId: ObjectId;            // Ref: stories (indexed)
  authorId: ObjectId;           // Ref: users
  parentId?: ObjectId;          // Ref: comments (nested replies)
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}`}
      </CodeBlock>

      <h2>Communities Collection</h2>
      <CodeBlock language="typescript">
{`// communities collection schema
interface Community {
  _id: ObjectId;
  name: string;
  slug: string;                 // Unique, URL-friendly
  description: string;
  avatar?: string;
  banner?: string;
  category: string;
  tags: string[];
  
  // Membership
  members: Array<{
    userId: ObjectId;           // Ref: users (indexed)
    role: 'member' | 'moderator' | 'admin';
    joinedAt: Date;
  }>;
  memberCount: number;

  // Embedding reference
  embeddingId?: string;

  createdAt: Date;
  updatedAt: Date;
}`}
      </CodeBlock>

      <h2>Database Validation</h2>
      <p>
        We use <strong>MongoDB JSON Schema validation</strong> to enforce data integrity at the
        database level:
      </p>

      <CodeBlock language="json">
{`{
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      "required": ["title", "content", "authorId", "language"],
      "properties": {
        "title": {
          "bsonType": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "content": {
          "bsonType": "string",
          "minLength": 1,
          "maxLength": 100000
        },
        "language": {
          "enum": ["en", "es", "fr", "de", "ja", "zh", "pt", "ar", "hi"]
        },
        "moderationStatus": {
          "enum": ["pending", "approved", "rejected"]
        }
      }
    }
  }
}`}
      </CodeBlock>

      <h2>Collection Statistics</h2>
      <Table
        headers={['Collection', 'Document Count', 'Avg Document Size', 'Total Size']}
        rows={[
          ['users', '~100K', '2KB', '200MB'],
          ['stories', '~500K', '25KB', '12.5GB'],
          ['comments', '~2M', '500B', '1GB'],
          ['communities', '~5K', '10KB', '50MB'],
          ['prompts', '~50', '4KB', '200KB'],
          ['analytics_events', '~50M', '200B', '10GB'],
        ]}
      />

      <Callout type="tip" title="Schema Evolution">
        We practice backward-compatible schema changes. New fields are always optional with defaults.
        Deprecated fields are kept for 90 days after migration before removal.
      </Callout>
    </div>
  );
}

export default Collections;
