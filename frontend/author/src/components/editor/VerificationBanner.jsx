import { motion, AnimatePresence } from "framer-motion";
import Badge from "../ui/Badge";
import { Icons } from "../../icons";

export default function VerificationBanner({
  currentStep,
  overallAssessment,
  verificationIssues = [],
}) {
  return (
    <>
      <AnimatePresence>
        {currentStep === "verified" && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-5 rounded-2xl bg-success/10 border border-success/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <Icons.checkCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-success">
                  Verification Passed &check;
                </h3>
                {overallAssessment && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {overallAssessment}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentStep === "issues" && verificationIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden"
          >
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border-b border-destructive/20">
              <Icons.exclamationCircle className="h-5 w-5 text-destructive" />
              <h3 className="text-sm font-semibold text-destructive">
                Issues Found ({verificationIssues.length})
              </h3>
            </div>
            <div className="divide-y divide-destructive/10">
              {verificationIssues.map((issue, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          issue.severity === "high"
                            ? "bg-destructive"
                            : issue.severity === "medium"
                            ? "bg-warning"
                            : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground capitalize">
                          {issue.category?.replace(/_/g, " ")}
                        </span>
                        <Badge
                          variant={
                            issue.severity === "high"
                              ? "danger"
                              : issue.severity === "medium"
                              ? "warning"
                              : "default"
                          }
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">
                        {issue.description}
                      </p>
                      {issue.suggestion && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                          <Icons.sparkles className="h-3 w-3 flex-shrink-0 mt-0.5 text-primary" />
                          {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {overallAssessment && (
              <div className="p-4 bg-destructive/5 border-t border-destructive/10">
                <p className="text-xs text-muted-foreground italic">
                  {overallAssessment}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}