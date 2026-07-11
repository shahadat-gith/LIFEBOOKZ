import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Home } from './pages/home/Home';

// Architecture
import { Architecture } from './pages/architecture/Architecture';
import { BackendServices } from './pages/architecture/BackendServices';
import { DeploymentArchitecture } from './pages/architecture/DeploymentArchitecture';
import { EventDriven } from './pages/architecture/EventDriven';
import { RequestLifecycle } from './pages/architecture/RequestLifecycle';
import { Scalability } from './pages/architecture/Scalability';

// AI
import { AIOverview } from './pages/ai/AIOverview';
import { UserEmbeddings } from './pages/ai/UserEmbeddings';
import { StoryEmbeddings } from './pages/ai/StoryEmbeddings';
import { RecommendationEngine } from './pages/ai/RecommendationEngine';
import { SemanticSearch } from './pages/ai/SemanticSearch';
import { AIEnhancement } from './pages/ai/AIEnhancement';
import { Workers } from './pages/ai/Workers';
import { PromptArchitecture } from './pages/ai/PromptArchitecture';
import { CostOptimization } from './pages/ai/CostOptimization';
import { FutureRoadmap } from './pages/ai/FutureRoadmap';

// Database
import { DatabaseOverview } from './pages/database/DatabaseOverview';
import { MongoDB } from './pages/database/MongoDB';
import { Qdrant } from './pages/database/Qdrant';
import { Collections } from './pages/database/Collections';
import { Indexes } from './pages/database/Indexes';

// API
import { APIOverview } from './pages/api/APIOverview';
import { AuthAPI } from './pages/api/AuthAPI';
import { UserAPI } from './pages/api/UserAPI';
import { StoryAPI } from './pages/api/StoryAPI';
import { SearchAPI } from './pages/api/SearchAPI';
import { AdminAPI } from './pages/api/AdminAPI';

// Other
import { Infrastructure } from './pages/infrastructure/Infrastructure';
import { Security } from './pages/security/Security';
import { DevelopmentGuide } from './pages/development/DevelopmentGuide';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />

        {/* Architecture */}
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/architecture/backend-services" element={<BackendServices />} />
        <Route path="/architecture/deployment" element={<DeploymentArchitecture />} />
        <Route path="/architecture/event-driven" element={<EventDriven />} />
        <Route path="/architecture/request-lifecycle" element={<RequestLifecycle />} />
        <Route path="/architecture/scalability" element={<Scalability />} />

        {/* AI */}
        <Route path="/ai" element={<AIOverview />} />
        <Route path="/ai/user-embeddings" element={<UserEmbeddings />} />
        <Route path="/ai/story-embeddings" element={<StoryEmbeddings />} />
        <Route path="/ai/recommendation-engine" element={<RecommendationEngine />} />
        <Route path="/ai/semantic-search" element={<SemanticSearch />} />
        <Route path="/ai/enhancement" element={<AIEnhancement />} />
        <Route path="/ai/workers" element={<Workers />} />
        <Route path="/ai/prompt-architecture" element={<PromptArchitecture />} />
        <Route path="/ai/cost-optimization" element={<CostOptimization />} />
        <Route path="/ai/future-roadmap" element={<FutureRoadmap />} />

        {/* Database */}
        <Route path="/database" element={<DatabaseOverview />} />
        <Route path="/database/mongodb" element={<MongoDB />} />
        <Route path="/database/qdrant" element={<Qdrant />} />
        <Route path="/database/collections" element={<Collections />} />
        <Route path="/database/indexes" element={<Indexes />} />

        {/* API */}
        <Route path="/api" element={<APIOverview />} />
        <Route path="/api/auth" element={<AuthAPI />} />
        <Route path="/api/user" element={<UserAPI />} />
        <Route path="/api/story" element={<StoryAPI />} />
        <Route path="/api/search" element={<SearchAPI />} />
        <Route path="/api/admin" element={<AdminAPI />} />

        {/* Other */}
        <Route path="/infrastructure" element={<Infrastructure />} />
        <Route path="/security" element={<Security />} />
        <Route path="/development" element={<DevelopmentGuide />} />
      </Route>
    </Routes>
  );
}
