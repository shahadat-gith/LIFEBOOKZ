import {
  HiOutlineCube,
  HiOutlineChip,
  HiOutlineDatabase,
  HiOutlineCode,
  HiOutlineServer,
  HiOutlineShieldCheck,
  HiOutlineBookOpen,
  HiOutlineCloud,
} from 'react-icons/hi';
import { SiQdrant, SiMongodb, SiCloudinary, SiHuggingface } from 'react-icons/si';
import { SiServerless } from 'react-icons/si';

export const categories = [
  { id: 'architecture', label: 'Architecture', icon: HiOutlineCube },
  { id: 'ai', label: 'AI Features', icon: HiOutlineChip },
  { id: 'database', label: 'Database', icon: HiOutlineDatabase },
  { id: 'api', label: 'API Reference', icon: HiOutlineCode },
  { id: 'infrastructure', label: 'Infrastructure', icon: HiOutlineServer },
  { id: 'security', label: 'Security', icon: HiOutlineShieldCheck },
  { id: 'development', label: 'Development', icon: HiOutlineBookOpen },
];

export const docs = [
  // Home
  {
    id: 'home',
    title: 'Home',
    description: 'Welcome to Lifebookz documentation — the world\'s first digital library of human lives.',
    route: '/',
    category: null,
    icon: HiOutlineBookOpen,
    hero: true,
  },

  // Architecture
  {
    id: 'architecture',
    title: 'Architecture Overview',
    description: 'Understand the high-level system architecture of the Lifebookz platform.',
    route: '/architecture',
    category: 'architecture',
    icon: HiOutlineCube,
  },
  {
    id: 'backend-services',
    title: 'Backend Services',
    description: 'Explore the microservice architecture powering Lifebookz.',
    route: '/architecture/backend-services',
    category: 'architecture',
    icon: HiOutlineCube,
  },
  {
    id: 'deployment',
    title: 'Deployment Architecture',
    description: 'Learn about our serverless deployment strategy and CI/CD pipeline.',
    route: '/architecture/deployment',
    category: 'architecture',
    icon: SiServerless,
  },
  {
    id: 'event-driven',
    title: 'Event-Driven Architecture',
    description: 'How asynchronous events power the Lifebookz platform using SQS.',
    route: '/architecture/event-driven',
    category: 'architecture',
    icon: HiOutlineCloud,
  },
  {
    id: 'request-lifecycle',
    title: 'Request Lifecycle',
    description: 'Trace a request from API Gateway through Lambda to the database.',
    route: '/architecture/request-lifecycle',
    category: 'architecture',
    icon: HiOutlineServer,
  },
  {
    id: 'scalability',
    title: 'Scalability',
    description: 'How Lifebookz scales to millions of users with a serverless architecture.',
    route: '/architecture/scalability',
    category: 'architecture',
    icon: HiOutlineCube,
  },

  // AI
  {
    id: 'ai-overview',
    title: 'AI Overview',
    description: 'How artificial intelligence is deeply integrated into every aspect of Lifebookz.',
    route: '/ai',
    category: 'ai',
    icon: HiOutlineChip,
  },
  {
    id: 'user-embeddings',
    title: 'User Preference Embeddings',
    description: 'How user preferences are collected, embedded, and stored in Qdrant.',
    route: '/ai/user-embeddings',
    category: 'ai',
    icon: SiQdrant,
  },
  {
    id: 'story-embeddings',
    title: 'Story Embeddings',
    description: 'How published stories are asynchronously embedded for semantic search.',
    route: '/ai/story-embeddings',
    category: 'ai',
    icon: SiQdrant,
  },
  {
    id: 'recommendation-engine',
    title: 'Recommendation Engine',
    description: 'Personalized content recommendations using vector similarity search.',
    route: '/ai/recommendation-engine',
    category: 'ai',
    icon: HiOutlineChip,
  },
  {
    id: 'semantic-search',
    title: 'Semantic Search',
    description: 'Search stories by meaning, not just keywords, using embeddings.',
    route: '/ai/semantic-search',
    category: 'ai',
    icon: HiOutlineChip,
  },
  {
    id: 'ai-enhancement',
    title: 'AI Story Enhancement',
    description: 'AI-powered writing assistance that improves grammar, flow, and emotional impact.',
    route: '/ai/enhancement',
    category: 'ai',
    icon: HiOutlineChip,
  },
  {
    id: 'workers',
    title: 'Background Workers',
    description: 'Serverless workers that process async tasks like embedding generation.',
    route: '/ai/workers',
    category: 'ai',
    icon: SiServerless,
  },
  {
    id: 'prompt-architecture',
    title: 'Prompt Architecture',
    description: 'How we design and manage prompts for AI features across the platform.',
    route: '/ai/prompt-architecture',
    category: 'ai',
    icon: HiOutlineChip,
  },
  {
    id: 'cost-optimization',
    title: 'Cost Optimization',
    description: 'Strategies for optimizing AI inference costs while maintaining quality.',
    route: '/ai/cost-optimization',
    category: 'ai',
    icon: HiOutlineChip,
  },
  {
    id: 'future-roadmap',
    title: 'Future Roadmap',
    description: 'Upcoming AI features and improvements planned for Lifebookz.',
    route: '/ai/future-roadmap',
    category: 'ai',
    icon: HiOutlineChip,
  },

  // Database
  {
    id: 'database-overview',
    title: 'Database Overview',
    description: 'Overview of the data layer powering Lifebookz.',
    route: '/database',
    category: 'database',
    icon: HiOutlineDatabase,
  },
  {
    id: 'mongodb',
    title: 'MongoDB Atlas',
    description: 'Primary database for storing user data, stories, and application state.',
    route: '/database/mongodb',
    category: 'database',
    icon: SiMongodb,
  },
  {
    id: 'qdrant',
    title: 'Qdrant Vector Database',
    description: 'Vector database for storing and querying embeddings.',
    route: '/database/qdrant',
    category: 'database',
    icon: SiQdrant,
  },
  {
    id: 'collections',
    title: 'Collections & Schema',
    description: 'MongoDB collections, document schemas, and data models.',
    route: '/database/collections',
    category: 'database',
    icon: HiOutlineDatabase,
  },
  {
    id: 'indexes',
    title: 'Indexes & Performance',
    description: 'Database indexes, query optimization, and performance tuning.',
    route: '/database/indexes',
    category: 'database',
    icon: HiOutlineDatabase,
  },

  // API
  {
    id: 'api-overview',
    title: 'API Overview',
    description: 'RESTful API reference for the Lifebookz platform.',
    route: '/api',
    category: 'api',
    icon: HiOutlineCode,
  },
  {
    id: 'auth-api',
    title: 'Authentication API',
    description: 'Authentication endpoints for user registration and login.',
    route: '/api/auth',
    category: 'api',
    icon: HiOutlineCode,
  },
  {
    id: 'user-api',
    title: 'User API',
    description: 'User profile management and preference endpoints.',
    route: '/api/user',
    category: 'api',
    icon: HiOutlineCode,
  },
  {
    id: 'story-api',
    title: 'Story API',
    description: 'CRUD operations for life stories, diaries, and time capsules.',
    route: '/api/story',
    category: 'api',
    icon: HiOutlineCode,
  },
  {
    id: 'search-api',
    title: 'Search API',
    description: 'Semantic search and recommendation endpoints.',
    route: '/api/search',
    category: 'api',
    icon: HiOutlineCode,
  },
  {
    id: 'admin-api',
    title: 'Admin API',
    description: 'Admin endpoints for moderation, analytics, and platform management.',
    route: '/api/admin',
    category: 'api',
    icon: HiOutlineCode,
  },

  // Infrastructure
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    description: 'Cloud infrastructure, networking, and resource management.',
    route: '/infrastructure',
    category: 'infrastructure',
    icon: HiOutlineServer,
  },

  // Security
  {
    id: 'security',
    title: 'Security',
    description: 'Security practices, encryption, authentication, and compliance.',
    route: '/security',
    category: 'security',
    icon: HiOutlineShieldCheck,
  },

  // Development
  {
    id: 'development',
    title: 'Development Guide',
    description: 'Getting started guide for contributing to the Lifebookz platform.',
    route: '/development',
    category: 'development',
    icon: HiOutlineBookOpen,
  },
];

export const getDocByRoute = (route) => docs.find((doc) => doc.route === route);

export const getDocsByCategory = (categoryId) =>
  docs.filter((doc) => doc.category === categoryId);

export const getAdjacentDocs = (currentRoute) => {
  const visibleDocs = docs.filter((doc) => doc.id !== 'home');
  const currentIndex = visibleDocs.findIndex((doc) => doc.route === currentRoute);
  return {
    prev: currentIndex > 0 ? visibleDocs[currentIndex - 1] : null,
    next: currentIndex < visibleDocs.length - 1 ? visibleDocs[currentIndex + 1] : null,
  };
};

export const getBreadcrumbs = (route) => {
  const doc = getDocByRoute(route);
  if (!doc || doc.hero) return [];
  const crumbs = [{ label: 'Home', route: '/' }];
  if (doc.category) {
    const category = categories.find((c) => c.id === doc.category);
    if (category) {
      const firstDocInCategory = docs.find((d) => d.category === doc.category);
      crumbs.push({ label: category.label, route: firstDocInCategory?.route || '/' });
    }
  }
  if (doc.id !== 'home') {
    crumbs.push({ label: doc.title, route: doc.route });
  }
  return crumbs;
};

export default docs;
