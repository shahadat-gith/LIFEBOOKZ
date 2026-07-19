import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { Icons } from "../icons";

const fadeUp = {
 initial: { opacity: 0, y: 30 },
 animate: { opacity: 1, y: 0 },
};

const stagger = {
 animate: {
  transition: {
   staggerChildren: 0.1,
  },
 },
};

const features = [
 {
  icon: <Icons.edit className="h-6 w-6" />,
  title: "Rich Story Editor",
  desc: "Powerful rich text editor with formatting tools, headings, lists, and more to craft your perfect story.",
  gradient: "from-violet-500 to-purple-600",
 },
 {
  icon: <Icons.sparkles className="h-6 w-6" />,
  title: "Content Review",
  desc: "Get instant feedback on your stories with suggestions for improvement before publishing.",
  gradient: "from-amber-500 to-orange-600",
 },
 {
  icon: <Icons.book className="h-6 w-6" />,
  title: "Global Reach",
  desc: "Share your stories with readers worldwide. Build your audience and get discovered.",
  gradient: "from-emerald-500 to-teal-600",
 },
 {
  icon: <Icons.shieldCheck className="h-6 w-6" />,
  title: "Author Profile",
  desc: "Create a professional author profile with your bio, social links, and portfolio of published work.",
  gradient: "from-blue-500 to-indigo-600",
 },
];

const stats = [
 { value: "500+", label: "Active Authors" },
 { value: "10K+", label: "Published Stories" },
 { value: "50K+", label: "Monthly Readers" },
 { value: "95%", label: "Satisfaction Rate" },
];

const steps = [
 {
  step: "01",
  title: "Create Your Account",
  desc: "Sign up as an author and complete your profile. Tell us about yourself and your writing interests.",
 },
 {
  step: "02",
  title: "Write Your Story",
  desc: "Use our powerful rich text editor to craft your story. Add formatting, headings, and structure your content.",
 },
 {
  step: "03",
  title: "Content Review",
  desc: "Submit your story for review. Get feedback and suggestions to improve your work.",
 },
 {
  step: "04",
  title: "Publish & Share",
  desc: "Once approved, your story goes live! Reach readers around the world and build your audience.",
 },
];

export default function AuthorHomePage() {
 const { isAuthenticated } = useAuth();

 return (
  <div className="overflow-hidden">
   {/* ─── Hero ─── */}
   <section className="relative min-h-[90vh] flex items-center justify-center px-4 pt-20 pb-32">
    {/* Animated background */}
    <div className="absolute inset-0 -z-10">
     <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
     <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>

    <motion.div
     className="max-w-4xl mx-auto text-center"
     variants={stagger}
     initial="initial"
     animate="animate"
    >
     <motion.div
      variants={fadeUp}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8"
     >
      <Icons.sparkles className="h-4 w-4" />
      Welcome to LifeBookz Author Portal
     </motion.div>

     <motion.h1
      variants={fadeUp}
      className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
     >
      Share Your Stories
      <br />
      <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
       With the World
      </span>
     </motion.h1>

     <motion.p
      variants={fadeUp}
      className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
     >
      Join a community of passionate writers. Use our powerful editor,
      get expert feedback, and publish your stories to readers
      worldwide.
     </motion.p>

     <motion.div
      variants={fadeUp}
      className="flex flex-col sm:flex-row items-center justify-center gap-4"
     >
      {isAuthenticated ? (
       <Link to="/dashboard">
        <Button
         size="xl"
         className="text-base px-10 py-4 shadow-lg shadow-primary/25"
         icon={<Icons.home className="h-5 w-5" />}
        >
         Go to Dashboard
        </Button>
       </Link>
      ) : (
       <>
        <Link to="/register">
         <Button
          size="xl"
          className="text-base px-10 py-4 shadow-lg shadow-primary/25"
          icon={<Icons.userAdd className="h-5 w-5" />}
         >
          Become an Author
         </Button>
        </Link>
        <Link to="/login">
         <Button
          size="xl"
          variant="outline"
          className="text-base px-10 py-4"
          icon={<Icons.login className="h-5 w-5" />}
         >
          Sign In
         </Button>
        </Link>
       </>
      )}
     </motion.div>
    </motion.div>
   </section>

   {/* ─── Stats ─── */}
   <section className="relative py-20 px-4">
    <div className="max-w-6xl mx-auto">
     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
       <motion.div
        key={stat.label}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
        className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-muted/50 border border-border/50"
       >
        <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
         {stat.value}
        </p>
        <p className="text-sm text-muted-foreground">{stat.label}</p>
       </motion.div>
      ))}
     </div>
    </div>
   </section>

   {/* ─── Features ─── */}
   <section className="py-20 px-4 bg-muted/30">
    <div className="max-w-6xl mx-auto">
     <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-16"
     >
      <h2 className="text-3xl sm:text-4xl font-bold mb-4">
       Everything You Need
      </h2>
      <p className="text-muted-foreground max-w-xl mx-auto">
       Powerful tools and features designed to help you write, publish,
       and share your stories.
      </p>
     </motion.div>

     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((f, i) => (
       <motion.div
        key={f.title}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
        className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-300"
       >
        <div
         className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
         {f.icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
         {f.desc}
        </p>
       </motion.div>
      ))}
     </div>
    </div>
   </section>

   {/* ─── How It Works ─── */}
   <section className="py-20 px-4">
    <div className="max-w-4xl mx-auto">
     <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-16"
     >
      <h2 className="text-3xl sm:text-4xl font-bold mb-4">
       How It Works
      </h2>
      <p className="text-muted-foreground max-w-xl mx-auto">
       Get started in four simple steps and join our community of authors.
      </p>
     </motion.div>

     <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/30 to-transparent hidden md:block" />

      <div className="space-y-12">
       {steps.map((s, i) => (
        <motion.div
         key={s.step}
         initial={{ opacity: 0, x: -20 }}
         whileInView={{ opacity: 1, x: 0 }}
         viewport={{ once: true }}
         transition={{ delay: i * 0.15 }}
         className="relative pl-0 md:pl-24"
        >
         <div className="hidden md:flex absolute left-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent items-center justify-center text-white font-bold text-lg shadow-lg">
          {s.step}
         </div>
         <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-300">
          <div className="md:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm mb-3">
           {s.step}
          </div>
          <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
          <p className="text-muted-foreground">{s.desc}</p>
         </div>
        </motion.div>
       ))}
      </div>
     </div>
    </div>
   </section>

   {/* ─── CTA ─── */}
   <section className="py-24 px-4 relative">
    <div className="absolute inset-0 -z-10">
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
    </div>

    <motion.div
     initial={{ opacity: 0, scale: 0.95 }}
     whileInView={{ opacity: 1, scale: 1 }}
     viewport={{ once: true }}
     className="max-w-2xl mx-auto text-center"
    >
     <h2 className="text-3xl sm:text-4xl font-bold mb-6">
      Ready to Share Your Stories?
     </h2>
     <p className="text-lg text-muted-foreground mb-10">
      Join LifeBookz today and start your journey as an author. It's free
      to get started.
     </p>
     {isAuthenticated ? (
      <Link to="/stories/new">
       <Button
        size="xl"
        className="text-base px-10 py-4 shadow-xl shadow-primary/25 animate-pulse"
        icon={<Icons.documentAdd className="h-5 w-5" />}
       >
        Write Your First Story
       </Button>
      </Link>
     ) : (
      <Link to="/register">
       <Button
        size="xl"
        className="text-base px-10 py-4 shadow-xl shadow-primary/25"
        icon={<Icons.userAdd className="h-5 w-5" />}
       >
        Get Started Free
       </Button>
      </Link>
     )}
    </motion.div>
   </section>

   {/* ─── Footer ─── */}
   <footer className="border-t border-border py-12 px-4">
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
     <div className="flex items-center gap-2">
      <Icons.book className="h-5 w-5 text-primary" />
      <span className="font-semibold">LifeBookz</span>
      <span className="text-sm text-muted-foreground">Author Portal</span>
     </div>
     <p className="text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} LifeBookz. All rights reserved.
     </p>
    </div>
   </footer>
  </div>
 );
}
