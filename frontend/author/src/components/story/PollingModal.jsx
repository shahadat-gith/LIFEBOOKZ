import { motion } from "framer-motion";
import Button from "../ui/Button";
import { Icons } from "../../icons";

import { VerificationIssue } from "../../types";


 pollStatus: "polling" | "success" | "failed";
 pollMessage;
 isEditMode;
 issues;
 onEditStory: () => void;
 onBackToDashboard: () => void;
}

export default function PollingModal({
 pollStatus,
 pollMessage,
 isEditMode,
 issues,
 onEditStory,
 onBackToDashboard,
}: PollingModalProps) {
 if (pollStatus === "polling") {
  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <motion.div
     initial={{ scale: 0.9, opacity: 0 }}
     animate={{ scale: 1, opacity: 1 }}
     className="max-w-lg mx-auto py-20 px-4 text-center"
    >
     <div className="mb-6">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
       <Icons.sparkles className="h-10 w-10 text-primary animate-pulse" />
      </div>
     </div>
     <h2 className="text-2xl font-bold mb-2">
      {isEditMode ? "Re-analyzing" : "Analyzing"} Your Story
     </h2>
     <p className="text-muted-foreground mb-6">{pollMessage}</p>
     <div className="flex justify-center gap-1.5">
      <div
       className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
       style={{ animationDelay: "0ms" }}
      />
      <div
       className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
       style={{ animationDelay: "150ms" }}
      />
      <div
       className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
       style={{ animationDelay: "300ms" }}
      />
     </div>
     <p className="text-xs text-muted-foreground mt-6">
      This should only take a few seconds...
     </p>
    </motion.div>
   </div>
  );
 }

 if (pollStatus === "success") {
  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <motion.div
     initial={{ scale: 0.9, opacity: 0 }}
     animate={{ scale: 1, opacity: 1 }}
     className="max-w-lg mx-auto py-20 px-4 text-center"
    >
     <div className="mb-6">
      <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
       <Icons.checkCircle className="h-10 w-10 text-success" />
      </div>
     </div>
     <h2 className="text-2xl font-bold mb-2">Story Published! 🎉</h2>
     <p className="text-muted-foreground mb-6">{pollMessage}</p>
     <div className="w-12 h-1 bg-success rounded-full mx-auto animate-pulse" />
    </motion.div>
   </div>
  );
 }

 // failed state
 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
   <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="max-w-lg mx-auto py-20 px-4 text-center"
   >
    <div className="mb-6">
     <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
      <Icons.exclamationCircle className="h-10 w-10 text-destructive" />
     </div>
    </div>
    <h2 className="text-2xl font-bold mb-2">Verification Issues Found</h2>
    <p className="text-muted-foreground mb-6">{pollMessage}</p>
    {issues.length > 0 && (
     <div className="text-left mb-6 space-y-3 max-h-60 overflow-y-auto">
      {issues.map((issue, i) => (
       <div
        key={i}
        className="p-4 rounded-xl bg-destructive/5 border border-destructive/20"
       >
        <p className="text-sm font-medium text-foreground">
         {issue.description}
        </p>
        {issue.suggestion && (
         <p className="text-xs text-muted-foreground mt-1">
          Suggestion: {issue.suggestion}
         </p>
        )}
       </div>
      ))}
     </div>
    )}
    <div className="flex gap-3 justify-center">
     <Button variant="outline" onClick={onBackToDashboard}>
      Back to Dashboard
     </Button>
     <Button onClick={onEditStory}>Edit Story</Button>
    </div>
   </motion.div>
  </div>
 );
}
