import { Mermaid } from '../../components/mermaid/Mermaid';
import { Table } from '../../components/table/Table';
import { Callout } from '../../components/callouts/Callout';
import { StatCard } from '../../components/cards/StatCard';

export function Scalability() {
  return (
    <div>
      <h1>Scalability</h1>
      <p>
        Lifebookz is designed to scale from zero to millions of users without manual intervention.
        Our serverless architecture handles traffic spikes automatically while maintaining
        predictable performance and cost.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
        <StatCard label="Lambda Concurrency" value="10K+" description="Per region limit" />
        <StatCard label="API Gateway RPS" value="100K+" description="Per second" />
        <StatCard label="SQS Throughput" value="Unlimited" description="Auto-scaling" />
        <StatCard label="MongoDB Atlas" value="Auto-scale" description="Sharded clusters" />
      </div>

      <h2>Horizontal Scaling Strategy</h2>
      <Mermaid
        chart={`graph TB
    subgraph Users["Users"]
        U1[10 Users]
        U2[100 Users]
        U3[10,000 Users]
        U4[1,000,000 Users]
    end

    subgraph Scaling["AWS Auto Scaling"]
        LB[Lambda Concurrency\nAuto-scaling]
        AG[API Gateway\nAuto-throttling]
        SQS[SQS Queues\nUnlimited Throughput]
    end

    subgraph Storage["Storage Scaling"]
        MDB[MongoDB Atlas\nAuto-sharding]
        QDR[Qdrant\nHorizontal sharding]
        CF[CloudFront\nEdge caching]
    end

    U1 --> LB
    U2 --> LB
    U3 --> LB
    U4 --> LB
    
    LB --> AG
    AG --> SQS
    AG --> MDB
    SQS --> QDR
    AG --> CF`}
        caption="Horizontal scaling across all infrastructure layers"
      />

      <h2>Key Scaling Dimensions</h2>

      <h3>Lambda Concurrency</h3>
      <p>
        AWS Lambda automatically scales by creating new function instances as request volume increases.
        Each instance handles one request at a time. For critical paths (story creation, feed loading),
        we use <strong>provisioned concurrency</strong> to eliminate cold starts.
      </p>

      <Table
        headers={['Service', 'Concurrency Mode', 'Reserved Concurrency', 'Provisioned']}
        rows={[
          ['User Service', 'Burst', '500', '-'],
          ['Story Service', 'Burst', '1000', '100'],
          ['AI Enhancement', 'On-Demand', '200', '-'],
          ['Embedding Worker', 'On-Demand', '100', '-'],
          ['Moderation Worker', 'On-Demand', '50', '-'],
        ]}
      />

      <h3>Database Scaling</h3>

      <h4>MongoDB Atlas</h4>
      <p>
        We use MongoDB Atlas with auto-scaling storage and compute. The cluster automatically scales
        up during traffic spikes and scales down during quiet periods. Sharding is enabled for the
        stories collection, using <code>authorId</code> as the shard key.
      </p>

      <h4>Qdrant</h4>
      <p>
        Qdrant supports horizontal sharding by distributing vectors across multiple nodes.
        Collections are sharded by collection ID, and each shard handles a subset of the data.
        Replication factor of 3 ensures high availability.
      </p>

      <h3>API Gateway Throttling</h3>
      <p>
        API Gateway provides built-in throttling at the account, API, and route level. We configure:
      </p>
      <ul>
        <li><strong>Account limit:</strong> 10,000 RPS (can be increased via AWS support)</li>
        <li><strong>Route limit:</strong> 1,000 RPS per route (stories, search, recommendations)</li>
        <li><strong>Burst limit:</strong> 5,000 concurrent requests</li>
      </ul>

      <h2>Handling Traffic Spikes</h2>
      <Mermaid
        chart={`graph LR
    subgraph Normal["Normal Traffic"]
        N[100 RPS] --> S[Service]
        S --> DB[(MongoDB)]
    end

    subgraph Spike["Traffic Spike (10x)"]
        V[1000 RPS] --> AG[API Gateway\nThrottle to 500]
        AG --> L[Lambda\nProvisioned Concurrency]
        L --> M[(MongoDB\nAuto-scale)]
        L -->|Queue Overflow| Q[SQS Buffer]
    end

    subgraph Recovery["Recovery"]
        Q --> W[Worker Lambda\nProcess Backlog]
        W --> M
    end`}
        caption="Traffic spike handling with queue buffering"
      />

      <h2>Cost Scaling</h2>
      <Table
        headers={['Traffic Level', 'Lambda Cost', 'API Gateway Cost', 'MongoDB Cost', 'Total (est.)']}
        rows={[
          ['Development (10 req/s)', '$5/mo', '$3/mo', '$57/mo', '~$100/mo'],
          ['Launch (100 req/s)', '$50/mo', '$30/mo', '$190/mo', '~$350/mo'],
          ['Growth (1,000 req/s)', '$400/mo', '$250/mo', '$950/mo', '~$2,000/mo'],
          ['Scale (10,000 req/s)', '$3,500/mo', '$2,000/mo', '$4,500/mo', '~$15,000/mo'],
        ]}
      />

      <Callout type="tip" title="Progressive Scaling">
        Our architecture scales linearly with traffic. Costs grow proportionally, not exponentially.
        The serverless model means you never pay for idle capacity.
      </Callout>
    </div>
  );
}

export default Scalability;
