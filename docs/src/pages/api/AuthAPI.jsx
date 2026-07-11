import { CodeBlock } from '../../components/code/CodeBlock';
import { Table } from '../../components/table/Table';
import { Badge, MethodBadge } from '../../components/ui/Badge';
import { Callout } from '../../components/callouts/Callout';

export function AuthAPI() {
  return (
    <div>
      <h1>Authentication API</h1>
      <p>
        Authentication is handled by <strong>Amazon Cognito</strong>. The API manages user registration,
        login, token refresh, and account management.
      </p>

      <h2>Endpoints</h2>

      <h3>Register</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/auth/register</code>
      </div>
      <p>Create a new user account with initial preferences for embedding generation.</p>

      <CodeBlock language="json">
{`// Request
{
  "email": "user@example.com",
  "password": "SecureP@ss1",
  "username": "johndoe",
  "displayName": "John Doe",
  "preferences": {
    "interests": ["storytelling", "technology", "travel"],
    "profession": "software-engineer",
    "education": ["computer-science"],
    "skills": ["python", "writing"],
    "goals": ["share-my-story", "learn-from-others"],
    "languages": ["en", "es"],
    "location": {
      "country": "US",
      "city": "San Francisco"
    }
  }
}

// Response (201 Created)
{
  "userId": "user_01H2ABC...",
  "email": "user@example.com",
  "token": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 86400
  }
}`}
      </CodeBlock>

      <h3>Login</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/auth/login</code>
      </div>
      <p>Authenticate with email and password. Returns JWT tokens.</p>

      <CodeBlock language="json">
{`// Request
{
  "email": "user@example.com",
  "password": "SecureP@ss1"
}

// Response (200 OK)
{
  "token": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 86400
  },
  "user": {
    "id": "user_01H2ABC...",
    "username": "johndoe",
    "displayName": "John Doe"
  }
}`}
      </CodeBlock>

      <h3>Refresh Token</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/auth/refresh</code>
      </div>
      <p>Exchange a refresh token for a new access token.</p>

      <CodeBlock language="json">
{`// Request
{
  "refreshToken": "eyJ..."
}

// Response (200 OK)
{
  "accessToken": "eyJ...",
  "expiresIn": 86400
}`}
      </CodeBlock>

      <h3>Logout</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/auth/logout</code>
      </div>
      <p>Invalidate the current session.</p>

      <h3>Forgot Password</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/auth/forgot-password</code>
      </div>
      <p>Send password reset email.</p>

      <h3>Reset Password</h3>
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-slate-700">/v1/auth/reset-password</code>
      </div>
      <p>Reset password using confirmation code from email.</p>

      <h2>JWT Token Structure</h2>
      <CodeBlock language="json">
{`{
  "sub": "user_01H2ABC...",
  "email": "user@example.com",
  "username": "johndoe",
  "role": "user",
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxx",
  "aud": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  "iat": 1680000000,
  "exp": 1680086400
}`}
      </CodeBlock>

      <h2>Error Codes</h2>
      <Table
        headers={['Status', 'Code', 'Description']}
        rows={[
          ['400', 'INVALID_CREDENTIALS', 'Email or password is incorrect'],
          ['400', 'EMAIL_EXISTS', 'An account with this email already exists'],
          ['400', 'USERNAME_EXISTS', 'This username is already taken'],
          ['400', 'WEAK_PASSWORD', 'Password does not meet security requirements'],
          ['400', 'INVALID_REFRESH_TOKEN', 'Refresh token is expired or invalid'],
          ['429', 'RATE_LIMITED', 'Too many authentication attempts. Try again later.'],
        ]}
      />

      <Callout type="warning" title="Security Note">
        Never share or expose JWT tokens. Access tokens expire in 24 hours. Use refresh tokens
        (30-day expiry) with secure storage (httpOnly cookies on web, Keychain on mobile).
      </Callout>
    </div>
  );
}

export default AuthAPI;
