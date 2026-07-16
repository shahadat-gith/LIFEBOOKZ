import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import * as storyApi from "../api/stories";
import * as authorApi from "../api/auth";

import type { Story } from "../types";

import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card, { CardContent, CardTitle } from "../components/ui/Card";

import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";

import { Icons } from "../icons";

const STATUS_BADGE = {
  draft: { variant: "warning" as const, label: "Draft" },
  submitted: { variant: "info" as const, label: "Submitted" },
  processing: { variant: "info" as const, label: "Processing" },
  published: { variant: "success" as const, label: "Published" },
  rejected: { variant: "danger" as const, label: "Rejected" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { author, isLoading: authLoading } = useAuth();

  const [stories, setStories] = useState<Story[]>([]);
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
      submitted: stories.filter((s) => s.status === "submitted" || s.status === "processing").length,
    }),
    [stories]
  );

  const isApproved = author?.verification?.status === "approved";
  const isRejected = author?.verification?.status === "rejected";
  const isPending = !isApproved && !isRejected;

  if (authLoading || loading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (!author) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-10 px-4">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-6 rounded-3xl border bg-gradient-to-br from-card to-muted/30 p-8 md:flex-row md:items-center"
      >
        <div className="flex items-center gap-5">
          <Avatar
            src={author.avatar?.url}
            name={author.fullName}
            size="xl"
            className="ring-4 ring-primary/10"
          />
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {author.fullName}
              </span>
            </h1>
            <p className="mt-1 text-muted-foreground">{author.profession}</p>
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
                  You'll be able to write once approved
                </span>
              )}
              {isRejected && author.verification?.rejectionReason && (
                <span className="text-xs text-destructive">
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
              title={!isApproved ? "Waiting for approval" : undefined}
            >
              New Story
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="mt-1 text-sm text-muted-foreground">Total Stories</p>
          </CardContent>
        </Card>
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent>
            <p className="text-3xl font-bold text-success">{stats.published}</p>
            <p className="mt-1 text-sm text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent>
            <p className="text-3xl font-bold text-warning">{stats.drafts}</p>
            <p className="mt-1 text-sm text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-info/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent>
            <p className="text-3xl font-bold text-info">{stats.submitted}</p>
            <p className="mt-1 text-sm text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Stories List */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <CardTitle>My Stories</CardTitle>
            {stories.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {stories.length} total
              </span>
            )}
          </div>
          {stories.length === 0 ? (
            <EmptyState
              icon={<Icons.book className="h-12 w-12" />}
              title="No stories yet"
              description={isApproved ? "Start writing your first story and share it with the world." : "Your account is still pending approval. Once approved, you can start writing."}
              action={isApproved ? {
                label: "Write Your First Story",
                onClick: () => navigate("/stories/new"),
              } : undefined}
            />
          ) : (
            <div className="space-y-3">
              {stories.map((story) => {
                const badge = STATUS_BADGE[story.status] ?? {
                  label: story.status,
                  variant: "default",
                };
                const issues = story.verification?.issues ?? [];

                return (
                  <motion.div
                    key={story.id || story._id}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                    className="group flex items-center justify-between rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-md cursor-pointer"
                    onClick={() => navigate(`/stories/${story.id || story._id}/edit`)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="truncate text-lg font-semibold">
                          {story.title || "Untitled Story"}
                        </h3>
                        <Badge variant={badge.variant as "warning" | "info" | "success" | "danger" | "default"}>{badge.label}</Badge>
                        {issues.length > 0 && (
                          <Badge variant="danger">
                            {issues.length} issue{issues.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      {story.tags && story.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {story.tags.map((tag) => (
                            <Badge key={tag} variant="default">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="mt-3 text-sm text-muted-foreground">
                        Last updated{' '}
                        {new Date(story.updatedAt || story.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="ml-6 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/stories/${story.id || story._id}/edit`);
                        }}
                        icon={<Icons.edit className="h-4 w-4" />}
                      >
                        Edit
                      </Button>
                      {story.status === "published" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // View on client portal
                          }}
                          icon={<Icons.eye className="h-4 w-4" />}
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
