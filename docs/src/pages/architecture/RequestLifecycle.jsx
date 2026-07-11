import { Mermaid } from '../../components/mermaid/Mermaid';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';

export function RequestLifecycle() {
  return (
    <div>
      <h1>Request Lifecycle</h1>
      <p>
        Understanding how a request flows through the system is essential for debugging, performance
        optimization, and security auditing. Here's the complete lifecycle of a typical API request.
      </p>

      <h2>Request Flow Diagram</h2>
      <Mermaid
        chart={`sequenceDiagram
    participant C as Client
    participant CF as CloudFront
    participant WAF as AWS WAF
    participant AG as API Gateway
    participant AUTH as Auth Lambda
    participant SVC as Service Lambda
    participant DB as MongoDB
    participant SQS as SQS Queue
    participant WKR as Worker Lambda
    participant QDR as Qdrant

    C->>CF: HTTPS Request
    CF->>WAF: Forward Request
    WAF->>AG: Allow/Block
    
    Note over AG: Request Validation
    
    AG->>AUTH: Validate Token
    AUTH-->>AG: Token Claims
    
    AG->>SVC: Invoke Lambda
    Note over SVC: Cold Start?\nInit SDK Clients
    
    SVC->>DB: Query/Write
    DB-->>SVC: Result
    
    alt Async Operation
        SVC->>SQS: Enqueue Event
        SQS-->>SVC: Ack
        SVC-->>AG: 202 Accepted
        AG-->>C: Response
        
        WKR->>SQS: Poll Messages
        WKR->>QDR: Process & Store
    else Sync Operation
        SVC-->>AG: 200 OK
        AG-->>C: Response
    end`}
        caption="Complete request lifecycle from client to response"
      />

      <h2>Lifecycle Phases</h2>

      <h3>1. Edge & Security</h3>
      <p>
        Requests first hit <strong>CloudFront</strong>, our CDN. Static assets are served directly from
        the edge. API requests are forwarded through <strong>AWS WAF</strong> for rate limiting, IP filtering,
        and SQL injection/XSS protection before reaching API Gateway.
      </p>

      <h3>2. API Gateway</h3>
      <p>
        API Gateway handles request validation, throttling, and routing. It authenticates requests using
        Cognito/JWT tokens via a custom Lambda authorizer. Validated requests are forwarded to the
        appropriate service Lambda.
      </p>

      <CodeBlock language="typescript">
{`// Lambda Authorizer example
export const handler = async (event: APIGatewayAuthorizerEvent) => {
  const token = event.headers?.Authorization?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const decoded = await verifyToken(token, process.env.JWT_SECRET!);
    return generatePolicy(decoded.sub, 'Allow', event.methodArn, {
      userId: decoded.sub,
      role: decoded.role,
    });
  } catch {
    throw new Error('Unauthorized');
  }
};`}
      </CodeBlock>

      <h3>3. Service Lambda</h3>
      <p>
        The service Lambda processes the request. Cold starts are mitigated with provisioned concurrency
        for critical paths. The Lambda initializes SDK clients once (outside the handler) and reuses them
        across invocations.
      </p>

      <CodeBlock language="typescript">
{`// Optimized Lambda handler
import { MongoClient } from 'mongodb';

// Clients initialized outside handler (reused across invocations)
const client = new MongoClient(process.env.MONGODB_URI!);
let db: Db;

export const handler = async (event: APIGatewayProxyEvent) => {
  // Lazy connect - only if not already connected
  if (!db) {
    await client.connect();
    db = client.db('lifebookz');
  }

  const collection = db.collection('stories');
  const result = await collection.findOne({
    _id: new ObjectId(event.pathParameters?.storyId),
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result),
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  };
};`}
      </CodeBlock>

      <h3>4. Data Access</h3>
      <p>
        Synchronous operations read/write directly to MongoDB. Asynchronous operations (embedding,
        moderation) enqueue events to SQS and return immediately with a 202 Accepted response.
      </p>

      <h3>5. Response</h3>
      <p>
        The Lambda returns a response to API Gateway, which formats it and sends it back to the client.
        Response headers include caching directives, CORS headers, and request tracing IDs.
      </p>

      <h2>Performance Characteristics</h2>
      <Table
        headers={['Phase', 'P50 Latency', 'P95 Latency', 'P99 Latency']}
        rows={[
          ['CloudFront + WAF', '5ms', '15ms', '50ms'],
          ['API Gateway', '3ms', '8ms', '20ms'],
          ['Auth (Lambda)', '10ms', '30ms', '100ms'],
          ['Service Lambda (warm)', '15ms', '50ms', '150ms'],
          ['Service Lambda (cold)', '500ms', '1500ms', '3000ms'],
          ['MongoDB Query', '5ms', '20ms', '80ms'],
          ['Total (typical)', '~45ms', '~120ms', '~400ms'],
        ]}
      />
    </div>
  );
}

export default RequestLifecycle;
