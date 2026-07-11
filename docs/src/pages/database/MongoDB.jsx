import { Mermaid } from '../../components/mermaid/Mermaid';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Callout } from '../../components/callouts/Callout';
import { Table } from '../../components/table/Table';

export function MongoDB() {
  return (
    <div>
      <h1>MongoDB Atlas</h1>
      <p>
        MongoDB Atlas serves as our <strong>primary operational database</strong>. It stores all
        application data including users, stories, communities, comments, and analytics events.
        We use the M50 cluster tier with automated sharding and multi-region replication.
      </p>

      <h2>Cluster Configuration</h2>
      <Table
        headers={['Configuration', 'Value', 'Notes']}
        rows={[
          ['Cluster Tier', 'M50', 'Auto-scaling enabled'],
          ['Storage', '2TB NVMe', 'Auto-scaling up to 4TB'],
          ['Region', 'us-east-1 (primary)', 'Multi-region: eu-west-1, ap-southeast-1'],
          ['Replication', '3-node replica set', 'Per shard'],
          ['Shards', '3 (auto-balanced)', 'Shard key: authorId (hashed)'],
          ['Backup', 'Continuous', 'PITR with 7-day window'],
          ['Encryption', 'At-rest (AES-256)', 'In-transit (TLS 1.3)'],
        ]}
      />

      <h2>Connection Architecture</h2>
      <Mermaid
        chart={`graph TB
    subgraph Lambda["Lambda Functions"]
        US[User Service]
        SS[Story Service]
        RS[Recommendation Service]
    end

    subgraph Atlas["MongoDB Atlas"]
        subgraph Primary["Primary Region - us-east-1"]
            P1[(Primary\nRead/Write)]
            S1[(Secondary\nRead)]
            S2[(Secondary\nRead)]
        end
        subgraph EU["Replica - eu-west-1"]
            EU1[(Secondary)]
        end
        subgraph APAC["Replica - ap-southeast-1"]
            AP1[(Secondary)]
        end
    end

    subgraph Connection["Connection Pool"]
        CP[Connection Pool\nmin: 5, max: 50]
        RT[Read Preference\nSecondary Preferred]
    end

    US --> CP
    SS --> CP
    RS --> CP
    CP --> RT
    RT --> P1
    RT --> S1
    RT --> S2`}
        caption="MongoDB Atlas connection architecture with multi-region replicas"
      />

      <h2>Connection Management</h2>
      <p>
        Lambda functions manage MongoDB connections carefully to avoid exhausting connection limits:
      </p>
      <ul>
        <li><strong>Client reuse:</strong> MongoClient is initialized once outside the handler function</li>
        <li><strong>Lazy connect:</strong> Connection is established only on first invocation (not during cold start init)</li>
        <li><strong>Connection pool:</strong> min 5, max 50 connections per Lambda instance</li>
        <li><strong>Read preference:</strong> Secondary preferred for read-heavy workloads</li>
        <li><strong>Write concern:</strong> Majority (w: 'majority') for critical data</li>
      </ul>

      <CodeBlock language="typescript">
{`// MongoDB connection management in Lambda
import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  // Reuse cached connection across invocations
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI!, {
    maxPoolSize: 50,
    minPoolSize: 5,
    maxIdleTimeMS: 120000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    retryWrites: true,
    w: 'majority',
    readPreference: 'secondaryPreferred',
    readConcern: { level: 'majority' },
  });

  await client.connect();
  const db = client.db('lifebookz');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}`}
      </CodeBlock>

      <h2>Index Strategy</h2>
      <p>
        We maintain the following key indexes across our collections:
      </p>

      <Table
        headers={['Collection', 'Index', 'Type', 'Purpose']}
        rows={[
          ['users', 'email_1', 'Unique', 'Fast user lookup by email'],
          ['users', 'username_1', 'Unique', 'Profile URL resolution'],
          ['stories', 'authorId_1_publishedAt_-1', 'Compound', "Author's story feed"],
          ['stories', 'title_text_content_text', 'Text', 'Fallback keyword search'],
          ['stories', 'category_1_language_1', 'Compound', 'Category browsing'],
          ['stories', 'publishedAt_-1', 'Single', 'Recent stories feed'],
          ['stories', 'tags_1', 'Multikey', 'Tag-based filtering'],
          ['comments', 'storyId_1_createdAt_-1', 'Compound', 'Story comments'],
          ['communities', 'members.userId_1', 'Multikey', 'Member lookup'],
        ]}
      />

      <h2>Migration Strategy</h2>
      <p>
        Database migrations are run as part of the deployment pipeline, before Lambda function updates:
      </p>
      <ul>
        <li><strong>Forward-only:</strong> Each migration is idempotent and can be run multiple times</li>
        <li><strong>Versioned:</strong> Migrations are numbered and tracked in a <code>migrations</code> collection</li>
        <li><strong>Rollback:</strong> Older Lambda versions handle both old and new schema shapes</li>
        <li><strong>Testing:</strong> Migrations are first applied to staging, then to production after verification</li>
      </ul>

      <Callout type="tip" title="Connection Pool Monitoring">
        Monitor the <code>currentPoolSize</code> metric in CloudWatch. A steady increase may indicate
        a connection leak. Our alert threshold is 80% of the max pool size.
      </Callout>
    </div>
  );
}

export default MongoDB;
