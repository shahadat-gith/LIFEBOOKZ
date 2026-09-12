import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { adminApi } from "../utils/client";
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/common/EmptyState";
import { Icons } from "../icons";
import toast from "react-hot-toast";

const CATEGORY_LABELS = {
  education: "Education",
  relationship: "Relationship",
  career: "Career & Job",
  business: "Business",
  growth: "Personal Growth",
  health: "Health & Wellness",
};

export default function ExpertsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pendingExperts, setPendingExperts] = useState([]);
  const [approvedExperts, setApprovedExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeSection, setActiveSection] = useState("pending");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  async function loadData() {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        adminApi.getPendingExperts(),
        adminApi.getApprovedExperts(),
      ]);
      setPendingExperts(pendingRes.data.data || []);
      setApprovedExperts(approvedRes.data.data || []);
    } catch {
      toast.error("Failed to load experts data");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(expertId) {
    setActionLoading(expertId);
    try {
      await adminApi.approveExpert(expertId);
      toast.success("Expert approved successfully!");
      setPendingExperts((prev) => prev.filter((e) => e._id !== expertId));
      const res = await adminApi.getApprovedExperts();
      setApprovedExperts(res.data.data || []);
    } catch {
      toast.error("Failed to approve expert");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(expertId) {
    if (!rejectReason?.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setActionLoading(expertId);
    try {
      await adminApi.rejectExpert(expertId, rejectReason.trim());
      toast.success("Expert rejected");
      setPendingExperts((prev) => prev.filter((e) => e._id !== expertId));
      setRejectModal(null);
      setRejectReason("");
    } catch {
      toast.error("Failed to reject expert");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" label="Loading experts..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Icons.faUserGraduate className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Experts</h1>
            <p className="text-sm text-muted-foreground">
              Review expert applications and manage verified experts
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card padding="md" className="border-l-4 border-l-warning">
          <p className="text-2xl font-bold text-warning">
            {pendingExperts.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Pending Review</p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-success">
          <p className="text-2xl font-bold text-success">
            {approvedExperts.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Approved</p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-info">
          <p className="text-2xl font-bold text-info">
            {approvedExperts.reduce((sum, e) => sum + (e.sessions || 0), 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Sessions Booked</p>
        </Card>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeSection === "pending" ? "primary" : "outline"}
          size="sm"
          onClick={() => setActiveSection("pending")}
          icon={<Icons.clock className="h-4 w-4" />}
        >
          Pending ({pendingExperts.length})
        </Button>
        <Button
          variant={activeSection === "approved" ? "primary" : "outline"}
          size="sm"
          onClick={() => setActiveSection("approved")}
          icon={<Icons.checkCircle className="h-4 w-4" />}
        >
          Approved ({approvedExperts.length})
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === "pending" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Pending Applications</CardTitle>
                <CardDescription>Experts waiting for approval</CardDescription>
              </CardHeader>
              {pendingExperts.length === 0 ? (
                <div className="px-5 pb-5">
                  <EmptyState
                    icon={<Icons.userCheck className="h-12 w-12" />}
                    title="No pending applications"
                    description="All caught up! No experts awaiting approval."
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingExperts.map((expert, idx) => (
                    <motion.div
                      key={expert._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent flex-shrink-0 overflow-hidden">
                              {expert.avatar?.url ? (
                                <img
                                  src={expert.avatar.url}
                                  alt=""
                                  className="rounded-full w-full h-full object-cover"
                                />
                              ) : (
                                <Icons.faUserGraduate className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {expert.fullName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{expert.email}</span>
                                {expert.expertise && (
                                  <>
                                    <span>•</span>
                                    <span>{expert.expertise}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Badge variant="warning" className="ml-auto">
                              Pending
                            </Badge>
                          </div>

                          {expert.qualification && (
                            <p className="text-xs text-muted-foreground mt-2 ml-11">
                              🎓 {expert.qualification}
                            </p>
                          )}

                          {expert.bio && (
                            <p className="text-sm text-muted-foreground/70 mt-2 line-clamp-2 ml-11">
                              {expert.bio}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-2 ml-11">
                            {(expert.categories || []).map((cat) => (
                              <span
                                key={cat}
                                className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md"
                              >
                                {CATEGORY_LABELS[cat] || cat}
                              </span>
                            ))}
                            {expert.experience > 0 && (
                              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                {expert.experience} yrs exp
                              </span>
                            )}
                            {expert.price > 0 && (
                              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                ${expert.price}/session
                              </span>
                            )}
                            {expert.phone && (
                              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                📞 {expert.phone}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground mt-2 ml-11">
                            <Icons.clock className="h-3 w-3 inline mr-1" />
                            Applied{" "}
                            {new Date(expert.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            loading={actionLoading === expert._id}
                            onClick={() => handleApprove(expert._id)}
                            icon={<Icons.check className="h-4 w-4" />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectModal(expert._id)}
                            icon={<Icons.close className="h-4 w-4" />}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeSection === "approved" && (
          <motion.div
            key="approved"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Approved Experts</CardTitle>
                <CardDescription>
                  {approvedExperts.length} verified experts
                </CardDescription>
              </CardHeader>
              {approvedExperts.length === 0 ? (
                <div className="px-5 pb-5">
                  <EmptyState
                    icon={<Icons.userCheck className="h-12 w-12" />}
                    title="No approved experts"
                    description="Approve some experts to see them here."
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {approvedExperts.map((expert, idx) => (
                    <motion.div
                      key={expert._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-sm font-bold text-success flex-shrink-0 overflow-hidden">
                          {expert.avatar?.url ? (
                            <img
                              src={expert.avatar.url}
                              alt=""
                              className="rounded-full w-full h-full object-cover"
                            />
                          ) : (
                            <Icons.faUserGraduate className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {expert.fullName}
                            </p>
                            <Badge variant="success">Approved</Badge>
                            {expert.rating > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {expert.rating.toFixed(1)} ★
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {expert.expertise}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {(expert.categories || []).map((cat) => (
                              <span
                                key={cat}
                                className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md"
                              >
                                {CATEGORY_LABELS[cat] || cat}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {expert.sessions || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            sessions
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setRejectModal(null);
                setRejectReason("");
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Icons.ban className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Reject Application
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Provide a reason for rejection
                  </p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this application is being rejected..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all min-h-[120px] resize-y mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectModal(null);
                    setRejectReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  loading={actionLoading === rejectModal}
                  onClick={() => handleReject(rejectModal)}
                  disabled={!rejectReason.trim()}
                >
                  Confirm Reject
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
