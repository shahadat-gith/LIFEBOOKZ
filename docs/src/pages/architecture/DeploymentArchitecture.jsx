import { Mermaid } from '../../components/mermaid/Mermaid';
import { Callout } from '../../components/callouts/Callout';
import { CodeBlock } from '../../components/code/CodeBlock';

export function DeploymentArchitecture() {
  return (
    <div>
      <h1>Deployment Architecture</h1>
      <p>
        Lifebookz uses a <strong>fully serverless deployment strategy</strong> with infrastructure-as-code,
        automated CI/CD pipelines, and environment parity across development, staging, and production.
      </p>

      <h2>CI/CD Pipeline</h2>
      <Mermaid
        chart={`graph LR
    DEV[Developer Push] --> GH[GitHub]
    GH -->|Webhook| GA[GitHub Actions]
    
    subgraph CI["CI Pipeline"]
        LINT[Lint & Type Check]
        TEST[Unit Tests]
        BUILD[Build Artifacts]
    end
    
    subgraph CD["CD Pipeline"]
        DEPLOY[Deploy to AWS]
        MIGRATE[Database Migrations]
        SM[Deploy SAM Stacks]
    end
    
    GA --> CI
    CI --> CD
    CD --> STG[Staging]
    CD --> PRD[Production]
    
    STG -->|Integration Tests| APPROVE{Approval Gate}
    APPROVE -->|Manual Approval| PRD`}
        caption="CI/CD pipeline with staging verification and manual production approval"
      />

      <h2>Deployment Components</h2>

      <h3>AWS SAM (Serverless Application Model)</h3>
      <p>
        All serverless resources are defined using AWS SAM templates. This includes Lambda functions,
        API Gateway endpoints, SQS queues, DynamoDB tables, and IAM roles. Infrastructure is versioned
        alongside application code.
      </p>

      <CodeBlock language="yaml">
{`# template.yaml - SAM infrastructure definition
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: nodejs20.x
    MemorySize: 512
    Timeout: 30
    Tracing: Active
    Environment:
      Variables:
        MONGODB_URI: !Ref MongoURI
        QDRANT_URL: !Ref QdrantURL

Resources:
  StoryFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: services/story/
      Handler: index.handler
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /stories
            Method: ANY

  EmbeddingQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: embedding-queue
      VisibilityTimeout: 300
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt EmbeddingDLQ.Arn
        maxReceiveCount: 3`}
      </CodeBlock>

      <h3>Environment Strategy</h3>
      <div className="grid sm:grid-cols-3 gap-4 my-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900 text-sm mb-1">Development</h4>
          <p className="text-xs text-slate-500">Local SAM CLI, hot reloading, local MongoDB, local Qdrant via Docker</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900 text-sm mb-1">Staging</h4>
          <p className="text-xs text-slate-500">Full AWS deployment, reduced resources, test data, integration tests</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-900 text-sm mb-1">Production</h4>
          <p className="text-xs text-slate-500">Full scale, multi-AZ, reserved concurrency, CloudFront + WAF</p>
        </div>
      </div>

      <h2>Infrastructure as Code</h2>
      <p>
        We use <strong>AWS SAM</strong> for serverless resources and <strong>Terraform</strong> for
        infrastructure that spans across AWS services (VPC, Route53, CloudFront, WAF, etc.).
        All infrastructure changes go through the same code review process.
      </p>

      <Callout type="warning" title="Deployment Order">
        Always deploy database migrations before updating Lambda function code. Migration failures
        should roll back before the new function code is deployed.
      </Callout>
    </div>
  );
}

export default DeploymentArchitecture;
