import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import * as authorApi from "../utils/client";

import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card, { CardContent, CardTitle } from "../components/ui/Card";

import { getContentPreview } from "../utils/helpers";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";

import { Icons } from "../icons";

const STATUS_BADGE = {
  draft: { variant: "warning", label: "Draft" },
  submitted: { variant: "info", label: "Submitted" },
  processing: { variant: "info", label: "Processing" },
  verified: { variant: "success", label: "Ready to Publish" },
  published: { variant: "success", label: "Published" },
  rejected: { variant: "danger", label: "Rejected" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { author, isLoading: authLoading } = useAuth();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !author) {
      navigate("/login", { replace: true });
    }
  }, [author, authLoading, navigate]);

  useEffect(() => {
    if (!author) return;
    async function loadStories() {
      try {
        const data = await authorApi.getMyStories();
        setStories(data || []);
      } finally {
        setLoading(false);
      }
    }
    loadStories();
  }, [author]);

  const stats = useMemo(
    () => ({
      total: stories.length,
      published: stories.filter((s) => s.status === "published").length,
      drafts: stories.filter((s) => s.status === "draft").length,
      submitted: stories.filter(
        (s) =>
          s.status === "submitted" ||
          s.status === "processing" ||
          s.status === "verified",
      ).length,
    }),
    [stories],
  );

  const isApproved = author?.verification?.status === "approved";
  const isRejected = author?.verification?.status === "rejected";
  const isPending = !isApproved && !isRejected;

  if (authLoading || loading) {
    return <LoadingScreen message="Loading your author workspace..." />;
  }

  if (!author) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-10 px-4">
      {/* Author Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col justify-between gap-6 rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs md:flex-row md:items-center"
      >
        <div className="flex items-center gap-5">
          <Avatar
            src={author.avatar?.url}
            name={author.fullName}
            size="xl"
            className="ring-2 ring-border/80"
          />
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Welcome back, {author.fullName}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              {author.profession || "Author & Writer"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  isApproved ? "success" : isRejected ? "danger" : "warning"
                }
              >
                {isApproved
                  ? "Verified Author"
                  : isRejected
                    ? "Account Rejected"
                    : "Pending Approval"}
              </Badge>
              {isPending && (
                <span className="text-xs text-muted-foreground">
                  You&apos;ll be able to publish once reviewed
                </span>
              )}
              {isRejected && author.verification?.rejectionReason && (
                <span className="text-xs text-destructive font-medium">
                  Reason: {author.verification.rejectionReason}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <Link to={isApproved ? "/stories/new" : "#"}>
            <Button
              size="lg"
              icon={<Icons.plus className="h-4 w-4" />}
              disabled={!isApproved}
              className="w-full sm:w-auto"
            >
              New Story
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Overview Statistics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" className="border border-border/60 bg-card/60 shadow-xs">
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Stories
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-foreground">
              {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card padding="md" className="border border-border/60 bg-card/60 shadow-xs">
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Published
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-success">
              {stats.published}
            </p>
          </CardContent>
        </Card>

        <Card padding="md" className="border border-border/60 bg-card/60 shadow-xs">
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Drafts
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-warning">
              {stats.drafts}
            </p>
          </CardContent>
        </Card>

        <Card padding="md" className="border border-border/60 bg-card/60 shadow-xs">
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              In Review
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-info">
              {stats.submitted}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stories Listing */}
      <Card className="border border-border/60 bg-card shadow-xs">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
            <CardTitle className="font-display text-lg font-semibold tracking-tight">
              My Stories
            </CardTitle>
            {stories.length > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                {stories.length} {stories.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>

          {stories.length === 0 ? (
            <EmptyState
              icon={<Icons.book className="h-10 w-10 text-muted-foreground" />}
              title="No stories yet"
              description={
                isApproved
                  ? "Start writing your first story and share it with the world."
                  : "Your account is still pending approval. Once approved, you can start writing."
              }
              action={
                isApproved
                  ? {
                      label: "Compose First Story",
                      onClick: () => navigate("/stories/new"),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {stories.map((story) => {
                const badge = STATUS_BADGE[story.status] || {
                  label: story.status,
                  variant: "default",
                };
                const issues = story.verification?.issues || [];

                return (
                  <motion.div
                    key={story.id || story._id}
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.15 }}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border/60 bg-background/50 p-4 sm:p-5 transition-all hover:border-border hover:bg-card hover:shadow-xs cursor-pointer gap-4"
                    onClick={() =>
                      navigate(
                        `/stories/${story.id || story._id}/edit`,
                      )
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="truncate font-display text-base font-semibold text-foreground">
                          {story.title || getContentPreview(story.content)}
                        </h3>
                        <Badge variant={badge.variant}>
                          {badge.label}
                        </Badge>
                        {issues.length > 0 && (
                          <Badge variant="danger">
                            {issues.length} {issues.length > 1 ? "issues" : "issue"}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Last edited on{" "}
                        {new Date(
                          story.updatedAt || story.createdAt,
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 sm:opacity-0 transition-opacity group-hover:opacity-100 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/stories/${story.id || story._id}/edit`,
                          );
                        }}
                        icon={<Icons.edit className="h-3.5 w-3.5" />}
                      >
                        Edit
                      </Button>
                      {story.status === "published" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          icon={<Icons.eye className="h-3.5 w-3.5" />}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}