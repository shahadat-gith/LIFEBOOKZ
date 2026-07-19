import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { StoryCard } from '../story/StoryCard';
import { Button } from '../ui/Button';
import { Icons } from '../../icons';
import { Link } from 'react-router-dom';

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

export function TrendingStories({ stories, loading }) {
 const sectionRef = useRef(null);
 const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

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
       Trending{' '}
       <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Stories
       </span>
      </h2>
      <p className="text-muted-foreground text-lg">
       {loading
        ? "Loading trending stories..."
        : !stories || stories.length === 0
        ? "No trending stories yet."
        : `Most popular stories from our community.`}
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
    {!loading && stories && stories.length > 0 ? (
     <motion.div
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
     >
      {stories.slice(0, 3).map((story) => (
       <motion.div key={String(story._id ?? story.id)} variants={itemVariants}>
        <StoryCard story={story} />
       </motion.div>
      ))}
     </motion.div>
    ) : !loading ? (
     <div className="text-center py-16">
      <Icons.book className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
      <p className="text-muted-foreground/60 text-sm">No stories yet. Be the first!</p>
     </div>
    ) : (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {[1, 2, 3].map((n) => (
       <div key={n} className="h-64 rounded-xl bg-muted/40 animate-pulse" />
      ))}
     </div>
    )}
   </div>
  </section>
 );
}

export default TrendingStories;
