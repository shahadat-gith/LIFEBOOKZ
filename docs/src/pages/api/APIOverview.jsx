import { Mermaid } from '../../components/mermaid/Mermaid';
import { FeatureCard } from '../../components/cards/FeatureCard';
import { Table } from '../../components/table/Table';
import { getDocsByCategory } from '../../config/docs';
import { Callout } from '../../components/callouts/Callout';
import { CodeBlock } from '../../components/code/CodeBlock';

const subPages = getDocsByCategory('api');

export function APIOverview() {
  return (
    <div>
      <h1>API Overview</h1>
      <p>
        Lifebookz exposes a <strong>RESTful API</strong> through Amazon API Gateway. All endpoints
        are versioned, authenticated, and documented with OpenAPI 3.0 specifications.
      </p>

      <h2>API Architecture</h2>
      <Mermaid
        chart={`graph TB
    subgraph Clients["API Clients"]
        WEB[Web App]
        MOB[Mobile App]
        THIRD[Third Party]
    end

    subgraph Gateway["API Gateway"]
        REST[REST API v1]
        WS[WebSocket API]
        AUTH[Cognito Authorizer]
        THR[Throttling\n1000 RPS]
    end

    subgraph Services["Service Endpoints"]
        US[/users/*]
        SS[/stories/*]
        RS[/recommendations/*]
        AS[/ai/enhance]
        MS[/moderation/*]
        ADM[/admin/*]
    end

    subgraph Common["Common Middleware"]
        CORS[CORS Headers]
        LOG[Request Logging]
        VALID[Request Validation]
        TRACE[X-Ray Tracing]
    end

    WEB --> REST
    MOB --> REST
    THIRD --> REST
    MOB --> WS
    REST --> AUTH
    REST --> THR
    REST --> CORS
    CORS --> LOG
    LOG --> VALID
    VALID --> TRACE
    TRACE --> Services`}
        caption="API Gateway architecture with middleware stack"
      />

      <h2>Base URL</h2>
      <CodeBlock language="bash">
{`Production:  https://api.lifebookz.com/v1
Staging:      https://api.staging.lifebookz.com/v1
Development:  http://localhost:3000/v1`}
      </CodeBlock>

      <h2>Authentication</h2>
      <p>
        All API requests (except public endpoints) require a <strong>JWT token</strong> in the
        <code>Authorization</code> header. Tokens are issued by Amazon Cognito and expire after
        24 hours. Refresh tokens are valid for 30 days.
      </p>

      <CodeBlock language="bash">
{`# Request with authentication
curl -H "Authorization: Bearer <jwt_token>" \\
     -H "Content-Type: application/json" \\
     https://api.lifebookz.com/v1/users/me`}
      </CodeBlock>

      <h2>API Standards</h2>
      <Table
        headers={['Standard', 'Value', 'Description']}
        rows={[
          ['Protocol', 'HTTPS', 'TLS 1.3 only'],
          ['Base URL', '/v1', 'Versioned API'],
          ['Format', 'JSON', 'application/json'],
          ['Auth', 'Bearer JWT', 'Cognito-issued tokens'],
          ['Pagination', 'Cursor-based', 'next_cursor in response'],
          ['Rate Limit', '1,000 req/min', 'Per API key'],
          ['Idempotency', 'Idempotency-Key header', 'Retry-safe mutations'],
          ['Errors', 'RFC 7807', 'Problem Details format'],
        ]}
      />

      <h2>Error Format</h2>
      <p>
        All errors follow the <strong>RFC 7807 Problem Details</strong> specification:
      </p>

      <CodeBlock language="json">
{`{
  "type": "https://api.lifebookz.com/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "The request body contains invalid fields.",
  "instance": "/v1/stories",
  "errors": [
    {
      "field": "title",
      "message": "Title must be between 1 and 200 characters",
      "code": "INVALID_LENGTH"
    }
  ],
  "requestId": "req_01H2XYZ..."
}`}
      </CodeBlock>

      <h2>Pagination</h2>
      <p>
        List endpoints use <strong>cursor-based pagination</strong> for consistent results:
      </p>

      <CodeBlock language="bash">
{`# First page
GET /v1/stories?limit=20

# Subsequent pages (use next_cursor from previous response)
GET /v1/stories?limit=20&cursor=eyJpZCI6IjEyMyJ9`}
      </CodeBlock>

      <h2>Rate Limiting</h2>
      <p>
        Rate limits are enforced per API key and per user. Headers are returned with every response:
      </p>
      <ul>
        <li><code>X-RateLimit-Limit</code> — Maximum requests per window</li>
        <li><code>X-RateLimit-Remaining</code> — Remaining requests in current window</li>
        <li><code>X-RateLimit-Reset</code> — Unix timestamp when the window resets</li>
      </ul>

      <h2>API Endpoints</h2>
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

export default APIOverview;
