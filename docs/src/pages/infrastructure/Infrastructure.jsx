import { Mermaid } from '../../components/mermaid/Mermaid';
import { Table } from '../../components/table/Table';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Callout } from '../../components/callouts/Callout';

export function Infrastructure() {
  return (
    <div>
      <h1>Infrastructure</h1>
      <p>
        Lifebookz runs entirely on <strong>AWS</strong> using a serverless-first approach.
        All infrastructure is defined as code using AWS SAM and Terraform.
      </p>

      <h2>Infrastructure Overview</h2>
      <Mermaid
        chart={`graph TB
    subgraph Edge["Edge Layer"]
        CF[CloudFront CDN]
        WAF[AWS WAF]
        R53[Route53 DNS]
    end

    subgraph Compute["Compute Layer"]
        AG[API Gateway]
        L1[Lambda Functions\n(10+ services)]
        STEP[Step Functions]
    end

    subgraph Async["Async Layer"]
        SQS[Amazon SQS]
        EVT[EventBridge]
        SCH[EventBridge Scheduler]
    end

    subgraph Storage["Storage Layer"]
        MDB[MongoDB Atlas]
        S3[S3 Buckets]
        CL[Cloudinary]
    end

    subgraph AI["AI Layer"]
        OR[OpenRouter API]
        HF[HuggingFace API]
    end

    subgraph Auth["Auth Layer"]
        COG[Amazon Cognito]
        SEC[AWS Secrets Manager]
        KMS[AWS KMS]
    end

    subgraph Observability["Observability"]
        CW[CloudWatch Logs]
        XR[AWS X-Ray]
        AL[CloudWatch Alarms]
        DB[AWS Distro for OpenTelemetry]
    end

    Internet --> R53
    R53 --> CF
    CF --> WAF
    WAF --> AG
    AG --> L1
    AG --> COG
    L1 --> MDB
    L1 --> S3
    L1 --> SQS
    L1 --> OR
    L1 --> CL
    SQS --> L1
    EVT --> L1
    SCH --> L1
    
    L1 --> CW
    L1 --> XR
    XR --> AL`}
        caption="Complete AWS infrastructure stack"
      />

      <h2>Infrastructure Stack</h2>
      <Table
        headers={['Layer', 'Service', 'Purpose', 'Configuration']}
        rows={[
          ['Edge', 'CloudFront', 'CDN, SSL termination, caching', 'Price Class 200, WAF ACL'],
          ['Edge', 'Route53', 'DNS management', 'Alias records, health checks'],
          ['Edge', 'AWS WAF', 'Web application firewall', 'Rate limiting, SQLi/XSS protection'],
          ['Compute', 'API Gateway', 'REST API endpoint', 'Regional, TLS 1.3, throttling'],
          ['Compute', 'Lambda', 'Serverless compute', 'Node.js 20, Python 3.12, 512-1024MB'],
          ['Compute', 'Step Functions', 'Orchestration', 'Standard workflows'],
          ['Async', 'SQS', 'Message queuing', 'Standard queues, DLQ enabled'],
          ['Auth', 'Cognito', 'User authentication', 'User pool, hosted UI'],
          ['Storage', 'S3', 'File storage', 'Server-side encryption, lifecycle policies'],
          ['Storage', 'MongoDB Atlas', 'Primary database', 'M50, 3-shard, multi-region'],
          ['Storage', 'Cloudinary', 'Media management', 'Automated optimization, CDN'],
          ['Observability', 'CloudWatch', 'Logs and metrics', '14-day retention, structured logging'],
          ['Observability', 'X-Ray', 'Distributed tracing', 'Sampling rate 10%'],
        ]}
      />

      <h2>Networking</h2>
      <Mermaid
        chart={`graph TB
    subgraph VPC["VPC (10.0.0.0/16)"]
        subgraph Public["Public Subnets"]
            NAT[NAT Gateway]
            LB[Application LB]
        end
        subgraph Private["Private Subnets"]
            LAMBDA[Lambda Functions\n(VPC-enabled)]
        end
        subgraph Data["Data Subnets"]
            MONGODB[MongoDB Atlas\nPrivateLink]
            QDRANT[Qdrant Cloud\nPrivateLink]
            S3_VPC[S3 VPC Endpoint]
        end
    end

    subgraph External["External Services"]
        AG[API Gateway\n(Public)]
        MDB_ATLAS[MongoDB Atlas]
        QDR_CLOUD[Qdrant Cloud]
    end

    AG --> LAMBDA
    LAMBDA --> MONGODB
    LAMBDA --> QDRANT
    LAMBDA --> S3_VPC
    MONGODB --> MDB_ATLAS
    QDRANT --> QDR_CLOUD`}
        caption="VPC network architecture with PrivateLink connections"
      />

      <h2>Deployment Pipeline</h2>
      <p>
        All infrastructure changes go through our CI/CD pipeline:
      </p>
      <ol>
        <li><strong>Pull Request:</strong> Infrastructure changes are reviewed alongside code changes</li>
        <li><strong>Plan:</strong> SAM/Terraform plan is generated and reviewed</li>
        <li><strong>Apply (Staging):</strong> Changes are applied to the staging environment</li>
        <li><strong>Integration Tests:</strong> Automated tests verify the deployment</li>
        <li><strong>Manual Approval:</strong> Production deployment requires team lead approval</li>
        <li><strong>Apply (Production):</strong> Changes are applied with canary deployments</li>
      </ol>

      <h2>Cost Breakdown (Monthly)</h2>
      <Table
        headers={['Service', 'Development', 'Staging', 'Production']}
        rows={[
          ['Lambda', '$5', '$25', '$3,500'],
          ['API Gateway', '$3', '$10', '$2,000'],
          ['SQS', '$1', '$2', '$150'],
          ['Cognito', '$0', '$0', '$500'],
          ['CloudFront + WAF', '$0', '$0', '$800'],
          ['MongoDB Atlas', '$57', '$190', '$4,500'],
          ['Qdrant Cloud', '$25', '$75', '$1,200'],
          ['Cloudinary', '$0', '$89', '$500'],
          ['Total', '~$100', '~$400', '~$13,150'],
        ]}
      />

      <Callout type="tip" title="Reserved Capacity">
        For predictable workloads (MongoDB, Qdrant), we use reserved instances at a ~30% discount
        over on-demand pricing. Lambda provisioned concurrency covers the top 20% of traffic.
      </Callout>
    </div>
  );
}

export default Infrastructure;
