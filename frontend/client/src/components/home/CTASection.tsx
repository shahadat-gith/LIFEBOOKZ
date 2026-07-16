import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Icons } from '../../icons';

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
          animate={{
            background: [
              'linear-gradient(135deg, #312e81, #581c87, #831843)',
              'linear-gradient(135deg, #581c87, #831843, #312e81)',
              'linear-gradient(135deg, #831843, #312e81, #581c87)',
              'linear-gradient(135deg, #312e81, #581c87, #831843)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Overlay pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl"
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-10 right-1/4 w-48 h-48 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl"
        animate={{
          y: [0, 20, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display text-white mb-6 leading-tight">
            Ready to Share Your{' '}
            <span className="bg-gradient-to-r from-amber-300 to-pink-300 bg-clip-text text-transparent">
              Story
            </span>
            ?
          </h2>
          <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join our vibrant community of authors and readers from across India.
            Your voice matters — start writing today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a href="http://localhost:5174/register" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-gray-900 font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 px-8 py-4 text-lg rounded-xl"
                >
                  <Icons.edit className="w-5 h-5 mr-2" />
                  Become an Author
                </Button>
              </a>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm px-8 py-4 text-lg rounded-xl transition-all duration-300"
                >
                  <Icons.book className="w-5 h-5 mr-2" />
                  Start Reading
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTASection;
