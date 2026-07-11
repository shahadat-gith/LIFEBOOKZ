import { Mermaid } from '../../components/mermaid/Mermaid';
import { Table } from '../../components/table/Table';
import { CodeBlock } from '../../components/code/CodeBlock';
import { Callout } from '../../components/callouts/Callout';

export function Security() {
  return (
    <div>
      <h1>Security</h1>
      <p>
        Security is foundational to Lifebookz. We protect user data at every layer — in transit,
        at rest, and during processing. Our security model follows <strong>defense in depth</strong>
        principles.
      </p>

      <h2>Security Architecture</h2>
      <Mermaid
        chart={`graph TB
    subgraph EdgeSecurity["Edge Security"]
        WAF[AWS WAF\nSQLi, XSS, Rate Limiting]
        DDoS[AWS Shield\nDDoS Protection]
        TLS[TLS 1.3\nEnd-to-end Encryption]
    end

    subgraph AuthSecurity["Authentication & Authorization"]
        COG[Amazon Cognito\nUser Pool]
        JWT[JWT Tokens\nRS256 Signed]
        MFA[Multi-Factor Auth\nTOTP]
        RBAC[Role-Based Access\nuser/moderator/admin]
    end

    subgraph DataSecurity["Data Security"]
        ENC[Encryption at Rest\nAES-256]
        KMS[AWS KMS\nKey Management]
        SEC[Secrets Manager\nAPI Keys & Credentials]
        BACKUP[Encrypted Backups\nPITR]
    end

    subgraph AppSecurity["Application Security"]
        VALID[Input Validation\nJSON Schema]
        SANITIZE[Output Sanitization\nXSS Prevention]
        RATE[Rate Limiting\nPer User & Per Key]
        CORS[CORS Policy\nRestricted Origins]
    end

    subgraph Compliance["Compliance"]
        GDPR[GDPR Compliance]
        CCPA[CCPA Compliance]
        AUDIT[Audit Logging]
    end

    EdgeSecurity --> AuthSecurity
    AuthSecurity --> AppSecurity
    AppSecurity --> DataSecurity
    DataSecurity --> Compliance`}
        caption="Defense-in-depth security architecture"
      />

      <h2>Encryption</h2>

      <h3>In Transit</h3>
      <ul>
        <li><strong>TLS 1.3:</strong> All API traffic encrypted with TLS 1.3. TLS 1.2 is disabled.</li>
        <li><strong>HSTS:</strong> Strict-Transport-Security header with 2-year max-age</li>
        <li><strong>Certificate:</strong> AWS Certificate Manager with auto-renewal</li>
        <li><strong>mTLS:</strong> Mutual TLS for inter-service communication in VPC</li>
      </ul>

      <h3>At Rest</h3>
      <ul>
        <li><strong>MongoDB:</strong> AES-256 encryption with AWS KMS integration</li>
        <li><strong>S3:</strong> Server-side encryption with S3-Managed Keys (SSE-S3)</li>
        <li><strong>Secrets:</strong> AWS Secrets Manager with automatic rotation</li>
        <li><strong>Backups:</strong> Encrypted with the same KMS keys</li>
      </ul>

      <h2>Authentication & Authorization</h2>

      <CodeBlock language="typescript">
{`// JWT verification middleware
async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    const decoded = await jwt.verify(token, getPublicKey(), {
      algorithms: ['RS256'],
      issuer: 'https://cognito-idp.' + region + '.amazonaws.com/' + poolId,
      maxAge: '24h',
    });
    return decoded;
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
}

// Authorization check
function requireRole(...roles: string[]) {
  return (handler: LambdaHandler) => async (event: APIGatewayEvent) => {
    const userRole = event.requestContext.authorizer?.claims?.['custom:role'];
    if (!roles.includes(userRole)) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          type: 'https://api.lifebookz.com/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'You do not have permission to access this resource.',
        }),
      };
    }
    return handler(event);
  };
}`}
      </CodeBlock>

      <h2>Security Headers</h2>
      <p>
        All responses include the following security headers:
      </p>
      <Table
        headers={['Header', 'Value', 'Purpose']}
        rows={[
          ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains', 'Enforce HTTPS'],
          ['Content-Security-Policy', "default-src 'self'", 'Prevent XSS'],
          ['X-Content-Type-Options', 'nosniff', 'Prevent MIME sniffing'],
          ['X-Frame-Options', 'DENY', 'Prevent clickjacking'],
          ['Referrer-Policy', 'strict-origin-when-cross-origin', 'Referrer control'],
          ['Permissions-Policy', 'geolocation=(), microphone=()', 'Feature control'],
          ['Cache-Control', 'no-store', 'Sensitive endpoints'],
        ]}
      />

      <h2>Compliance</h2>

      <h3>GDPR</h3>
      <ul>
        <li><strong>Right to access:</strong> Users can export all their data</li>
        <li><strong>Right to erasure:</strong> Account deletion removes all personal data within 30 days</li>
        <li><strong>Data portability:</strong> JSON export of all user-generated content</li>
        <li><strong>Consent:</strong> Granular consent management for data processing</li>
      </ul>

      <h3>CCPA</h3>
      <ul>
        <li><strong>Opt-out:</strong> Users can opt out of data collection for AI training</li>
        <li><strong>Disclosure:</strong> Clear disclosure of what data is collected and why</li>
        <li><strong>Deletion:</strong> Right to delete personal information</li>
      </ul>

      <h2>Incident Response</h2>
      <p>
        Security incidents follow a documented response plan:
      </p>
      <ol>
        <li><strong>Detection:</strong> Automated alerts for suspicious activity (unusual API patterns, impossible travel, etc.)</li>
        <li><strong>Triage:</strong> On-call engineer assesses severity within 15 minutes</li>
        <li><strong>Containment:</strong> Affected resources are isolated (revoke tokens, disable API keys, block IPs)</li>
        <li><strong>Eradication:</strong> Root cause is identified and fixed</li>
        <li><strong>Recovery:</strong> Services are restored from clean backups</li>
        <li><strong>Post-mortem:</strong> Incident is documented and preventive measures are implemented</li>
      </ol>

      <Callout type="info" title="Responsible Disclosure">
        Found a security vulnerability? Email <strong>security@lifebookz.com</strong>.
        We follow a 90-day disclosure timeline and offer a bug bounty program.
      </Callout>
    </div>
  );
}

export default Security;
