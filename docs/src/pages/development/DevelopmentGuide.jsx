import { Mermaid } from '../../components/mermaid/Mermaid';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Callout } from '../../components/callouts/Callout';
import { Table } from '../../components/table/Table';

export function DevelopmentGuide() {
  return (
    <div>
      <h1>Development Guide</h1>
      <p>
        Welcome to the Lifebookz engineering team. This guide will help you set up your local
        development environment, understand our workflows, and start contributing.
      </p>

      <h2>Prerequisites</h2>
      <Table
        headers={['Tool', 'Version', 'Installation']}
        rows={[
          ['Node.js', '20.x LTS', 'nvm install 20'],
          ['npm', '10.x', 'Comes with Node.js'],
          ['AWS CLI', 'Latest', 'https://aws.amazon.com/cli/'],
          ['AWS SAM CLI', 'Latest', 'https://aws.amazon.com/serverless/sam/'],
          ['Docker', 'Latest', 'https://docs.docker.com/get-docker/'],
          ['MongoDB', '7.0+', 'Local or Docker: mongod'],
          ['Qdrant', 'Latest', 'Docker: qdrant/qdrant'],
        ]}
      />

      <h2>Local Development Setup</h2>

      <CodeBlock language="bash">
{`# 1. Clone the repository
git clone https://github.com/lifebookz/lifebookz.git
cd lifebookz

# 2. Install dependencies
npm install

# 3. Start local infrastructure (Docker)
docker compose up -d

# 4. Start SAM local API
sam local start-api --template template.yaml

# 5. Run the development server
npm run dev`}
      </CodeBlock>

      <h2>Project Structure</h2>
      <CodeBlock language="bash">
{`lifebookz/
├── services/              # Microservice Lambda functions
│   ├── user/             # User Service
│   ├── story/            # Story Service
│   ├── recommendation/   # Recommendation Service
│   ├── ai-enhancement/   # AI Enhancement Service
│   └── moderation/       # Moderation Service
├── workers/              # Background worker Lambdas
│   ├── embedding/        # Embedding Worker
│   ├── notification/     # Notification Worker
│   └── moderation/       # Moderation Worker
├── lib/                  # Shared libraries
├── infra/                # Infrastructure as Code
│   ├── sam/             # SAM templates
│   └── terraform/       # Terraform configs
├── docs/                 # Documentation website (this project)
├── scripts/              # Build and deployment scripts
└── tests/                # Integration and E2E tests`}
      </CodeBlock>

      <h2>Development Workflow</h2>
      <Mermaid
        chart={`graph LR
    subgraph Local["Local Development"]
        CODE[Write Code]
        TEST[Run Tests]
        LINT[Lint & Type Check]
    end

    subgraph PR["Pull Request"]
        COMMIT[Commit & Push]
        CI[CI Pipeline]
        REVIEW[Code Review]
    end

    subgraph Deploy["Deployment"]
        MERGE[Merge to Main]
        STAGING[Deploy to Staging]
        APPROVE[Approval]
        PROD[Deploy to Production]
    end

    CODE --> TEST
    TEST --> LINT
    LINT --> COMMIT
    COMMIT --> CI
    CI --> REVIEW
    REVIEW --> MERGE
    MERGE --> STAGING
    STAGING --> APPROVE
    APPROVE --> PROD`}
        caption="Development workflow from local to production"
      />

      <h2>Code Standards</h2>

      <h3>TypeScript</h3>
      <ul>
        <li>Strict mode enabled in all services</li>
        <li>No `any` types (use `unknown` when type is truly unknown)</li>
        <li>Interfaces prefixed with `I` for data shapes</li>
        <li>Types for function parameters and return values</li>
      </ul>

      <h3>Testing</h3>
      <Table
        headers={['Test Type', 'Framework', 'Coverage Target', 'Location']}
        rows={[
          ['Unit Tests', 'Jest + Vitest', '> 90%', 'co-located with source'],
          ['Integration Tests', 'Jest', '> 80%', 'tests/integration/'],
          ['E2E Tests', 'Playwright', 'Critical paths', 'tests/e2e/'],
          ['Contract Tests', 'Pact', 'All providers', 'tests/contract/'],
        ]}
      />

      <CodeBlock language="typescript">
{`// Example unit test
import { describe, it, expect } from 'vitest';
import { generateUserEmbedding } from './embeddings';

describe('generateUserEmbedding', () => {
  const mockPreferences = {
    interests: ['technology', 'writing'],
    profession: 'software-engineer',
    skills: ['typescript', 'python'],
  };

  it('should generate a 384-dimensional vector', async () => {
    const embedding = await generateUserEmbedding(mockPreferences);
    expect(embedding).toHaveLength(384);
  });

  it('should produce normalized vectors', async () => {
    const embedding = await generateUserEmbedding(mockPreferences);
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    expect(magnitude).toBeCloseTo(1.0, 2);
  });

  it('should handle empty preferences gracefully', async () => {
    const embedding = await generateUserEmbedding({});
    expect(embedding).toBeDefined();
    expect(embedding).toHaveLength(384);
  });
});`}
      </CodeBlock>

      <h2>Environment Variables</h2>
      <p>
        Copy <code>.env.example</code> to <code>.env.local</code> and fill in the values:
      </p>
      <CodeBlock language="bash">
{`# Environment Variables

# MongoDB
MONGODB_URI=mongodb://localhost:27017/lifebookz

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# OpenRouter (AI)
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h`}
      </CodeBlock>

      <h2>Running Tests</h2>
      <CodeBlock language="bash">
{`# Run all tests
npm test

# Run unit tests with watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run linting
npm run lint

# Type check
npm run typecheck`}
      </CodeBlock>

      <h2>Commit Conventions</h2>
      <p>
        We follow <a href="https://www.conventionalcommits.org/">Conventional Commits</a>:
      </p>
      <ul>
        <li><code>feat:</code> A new feature</li>
        <li><code>fix:</code> A bug fix</li>
        <li><code>docs:</code> Documentation changes</li>
        <li><code>refactor:</code> Code refactoring</li>
        <li><code>test:</code> Adding or updating tests</li>
        <li><code>chore:</code> Build process or tooling changes</li>
      </ul>

      <Callout type="tip" title="First Time?">
        Check out our <code>good-first-issue</code> labels on GitHub for beginner-friendly tasks.
        Reach out on Slack (#engineering) if you need help getting started!
      </Callout>
    </div>
  );
}

export default DevelopmentGuide;
