import { motion } from "framer-motion";
import { Icons } from "../../icons";

export default function PublishingOverlay({ currentStep }) {
  if (
    currentStep !== "publishing" &&
    currentStep !== "published" &&
    currentStep !== "verifying"
  ) {
    return null;
  }

  const isSuccess = currentStep === "published";
  const isShield = currentStep === "verifying";
  const titleText = isSuccess
    ? "Story Published! 🎉"
    : isShield
    ? "Verifying Your Story"
    : "Submitting Your Story";
  const descText = isSuccess
    ? "Your life story has been published successfully."
    : isShield
    ? "Checking your account for personal record and content guidelines..."
    : "Please wait while we finalize your narrative...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-lg mx-auto py-20 px-4 text-center"
      >
        <div className="mb-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              isSuccess ? "bg-success/20" : "bg-primary/20"
            }`}
          >
            {isSuccess ? (
              <Icons.checkCircle className="h-10 w-10 text-success" />
            ) : isShield ? (
              <Icons.shieldCheck className="h-10 w-10 text-primary animate-pulse" />
            ) : (
              <Icons.sparkles className="h-10 w-10 text-primary animate-pulse" />
            )}
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">{titleText}</h2>
        <p className="text-muted-foreground mb-6">{descText}</p>
        {!isSuccess ? (
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
        ) : (
          <div className="w-12 h-1 bg-success rounded-full mx-auto animate-pulse" />
        )}
      </motion.div>
    </div>
  );
}