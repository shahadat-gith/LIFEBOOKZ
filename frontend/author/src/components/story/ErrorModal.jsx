import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "../../icons";


 message;
 onClose?: () => void;
}

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
 return (
  <AnimatePresence>
   {message && (
    <motion.div
     initial={{ opacity: 0, y: -10 }}
     animate={{ opacity: 1, y: 0 }}
     exit={{ opacity: 0 }}
     className="text-sm text-destructive flex items-center gap-1.5 p-3 rounded-lg bg-destructive/10"
    >
     <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
     <span className="flex-1">{message}</span>
     {onClose && (
      <button
       type="button"
       onClick={onClose}
       className="flex-shrink-0 p-0.5 rounded hover:bg-destructive/20 transition-colors"
      >
       <Icons.close className="h-3.5 w-3.5" />
      </button>
     )}
    </motion.div>
   )}
  </AnimatePresence>
 );
}
