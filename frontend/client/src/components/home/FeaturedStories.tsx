import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { StoryCard } from '../story/StoryCard';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Card } from '../ui/Card';
import { Icons } from '../../icons';
import { Link } from 'react-router-dom';

interface FeaturedStoriesProps {
  stories: Record<string, unknown>[];
  loading: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export function FeaturedStories({ stories, loading }: FeaturedStoriesProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  if (loading) {
    return (
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  if (!stories.length) return null;

  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
              Featured{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Stories
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Discover handpicked stories from our talented authors
            </p>
          </div>
          <Link to="/stories">
            <Button
              variant="outline"
              className="group border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-300"
            >
              View All Stories
              <Icons.book className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {/* Stories grid */}
        {stories.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {stories.map((story) => (
              <motion.div key={String(story._id ?? story.id)} variants={itemVariants}>
                <StoryCard story={story} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Card className="p-12 text-center">
            <Icons.book className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No featured stories yet. Check back soon!
            </p>
          </Card>
        )}
      </div>
    </section>
  );
}

export default FeaturedStories;
