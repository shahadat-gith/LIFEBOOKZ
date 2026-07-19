import { motion } from "framer-motion";

export default function Loader({ text = "Loading Timeline...", fullScreen = true }) {
  return (
    <div
      className={`
        relative flex flex-col items-center justify-center select-none bg-background
        ${fullScreen ? "fixed inset-0 min-h-screen w-screen z-[100]" : "py-24 w-full"}
      `}
    >
      {fullScreen && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-gradient-to-tr from-primary/5 via-accent/5 to-transparent blur-3xl"
          />
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div
          animate={{ scale: [0.97, 1.03, 0.97] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border border-dashed border-primary/20 p-8"
          />
          <img src="/logo.png" alt="Lifebookz Logo" className="h-12 w-auto object-contain relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.03)]" />
          <motion.div
            animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/25 blur-xl -z-10"
          />
        </motion.div>
        <div className="relative h-[2px] w-24 overflow-hidden rounded-full bg-border/40 mt-2">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 font-semibold font-sans"
        >
          {text}
        </motion.p>
      </div>
    </div>
  );
}
