import { Link } from 'react-router-dom';
import { Mermaid } from '../../components/mermaid/Mermaid';
import { docs, categories } from '../../config/docs';
import { FeatureCard } from '../../components/cards/FeatureCard';
import { StatCard } from '../../components/cards/StatCard';
import {
  HiOutlineBookOpen,
  HiOutlineCube,
  HiOutlineChip,
  HiOutlineDatabase,
  HiOutlineCode,
  HiOutlineServer,
  HiOutlineShieldCheck,
} from 'react-icons/hi';

const iconMap = {
  HiOutlineBookOpen,
  HiOutlineCube,
  HiOutlineChip,
  HiOutlineDatabase,
  HiOutlineCode,
  HiOutlineServer,
  HiOutlineShieldCheck,
};

const sectionColors = {
  architecture: 'indigo',
  ai: 'fuchsia',
  database: 'emerald',
  api: 'blue',
  infrastructure: 'amber',
  security: 'slate',
  development: 'indigo',
};

export function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight m-0">
              Lifebookz Documentation
            </h1>
          </div>
        </div>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
          Welcome to the Lifebookz engineering documentation. Learn about our architecture,
          AI features, data layer, APIs, and infrastructure powering the world's first
          digital library of human lives.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <StatCard
          label="Active Users"
          value="100K+"
          description="Growing monthly"
          trend={12}
        />
        <StatCard
          label="Stories"
          value="500K+"
          description="Published & moderated"
          trend={8}
        />
        <StatCard
          label="AI Embeddings"
          value="1.2M+"
          description="Stored in Qdrant"
          trend={15}
        />
        <StatCard
          label="API Latency"
          value="45ms"
          description="P95 response time"
          trend={-5}
        />
      </div>

      {/* Section Cards */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Documentation Sections</h2>
        <div className="feature-grid">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const catDocs = docs.filter((d) => d.category === category.id);
            return (
              <Link
                key={category.id}
                to={catDocs[0]?.route || '/'}
                className="group block p-5 bg-white rounded-xl border border-slate-200 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 bg-indigo-50 rounded-lg shrink-0">
                    {IconComponent && <IconComponent className="w-5 h-5 text-indigo-600" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {category.label}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {catDocs.length} {catDocs.length === 1 ? 'page' : 'pages'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">
                  {catDocs[0]?.description || ''}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Popular Topics</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.filter((d) => d.id !== 'home' && d.id !== 'home').slice(0, 9).map((doc) => (
            <Link
              key={doc.id}
              to={doc.route}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all text-sm text-slate-600 hover:text-indigo-600"
            >
              <doc.icon className="w-4 h-4 shrink-0 text-slate-400" />
              <span>{doc.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">System Architecture at a Glance</h2>
        <Mermaid
          chart={`graph TB
    subgraph Clients
        WEB[Web App]
        MOB[Mobile App]
    end

    subgraph CDN["CDN & Edge"]
        CF[CloudFront]
    end

    subgraph API["API Layer"]
        AG[API Gateway]
        WAF[AWS WAF]
    end

    subgraph AUTH["Auth"]
        COG[Cognito]
        JWT[JWT Tokens]
    end

    subgraph MICRO["Microservices"]
        US[User Service]
        SS[Story Service]
        RS[Recommendation Service]
        AS[AI Service]
        MS[Moderation Service]
    end

    subgraph QUEUE["Async Queue"]
        SQS[Amazon SQS]
    end

    subgraph WORKER["Background Workers"]
        EW[Embedding Worker]
        MW[Moderation Worker]
        NW[Notification Worker]
    end

    subgraph DB["Data Layer"]
        MDB[(MongoDB Atlas)]
        QDR[(Qdrant Vector DB)]
    end

    subgraph AI["AI Layer"]
        OR[OpenRouter]
        HF[HuggingFace]
        EMB[Embedding Model]
        LLM[LLM]
    end

    subgraph MEDIA["Media"]
        CL[Cloudinary]
    end

    WEB --> CF
    MOB --> CF
    CF --> AG
    AG --> WAF
    WAF --> AUTH
    WAF --> MICRO
    MICRO --> DB
    MICRO --> QUEUE
    QUEUE --> WORKER
    WORKER --> AI
    AI --> DB
    MICRO --> MEDIA
    MICRO --> AI`}
          caption="System architecture showing all major components and data flows"
        />
      </div>
    </div>
  );
}

export default Home;
