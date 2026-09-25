/**
 * LifeBookz domain event registry.
 *
 * Every event that a service is allowed to publish is declared here with the
 * service that owns it and its current schema version. Publishing an
 * undeclared type is a programming error: it keeps the event catalogue honest
 * (no invented events) and makes versioning explicit — a breaking payload
 * change bumps `version` instead of silently breaking consumers.
 *
 * `$service` means "the source of whichever service publishes this event";
 * it is used by the cross-cutting operational events (`RequestFailed`).
 */
export const DYNAMIC_SOURCE = "$service";

export const SERVICE_SOURCES = {
  auth: "lifebookz.auth",
  story: "lifebookz.story",
  consultation: "lifebookz.consultation",
  notification: "lifebookz.notification",
  system: "lifebookz.system",
  emailWorker: "lifebookz.email-worker",
  analyticsWorker: "lifebookz.analytics-worker",
};

/** @type {Record<string, {source: string, version: number, analytics: boolean, description: string}>} */
export const EVENT_TYPES = {
  // --------------------------------------------------------------- auth
  AccountRegistered: {
    source: SERVICE_SOURCES.auth,
    version: 1,
    analytics: true,
    description: "A reader, author or expert account was created.",
  },
  AccountProfileUpdated: {
    source: SERVICE_SOURCES.auth,
    version: 1,
    analytics: false,
    description: "Identity fields (name, avatar, username) changed. Feeds read-model projections.",
  },
  AccountVerificationDecided: {
    source: SERVICE_SOURCES.auth,
    version: 1,
    analytics: true,
    description: "An author/expert application was approved or rejected.",
  },
  AccountStatusChanged: {
    source: SERVICE_SOURCES.auth,
    version: 1,
    analytics: false,
    description: "Account status moved between active/suspended/deleted.",
  },
  PasswordResetCompleted: {
    source: SERVICE_SOURCES.auth,
    version: 1,
    analytics: true,
    description: "A password reset finished successfully.",
  },
  SessionRevoked: {
    source: SERVICE_SOURCES.auth,
    version: 1,
    analytics: false,
    description: "Refresh tokens were revoked (logout / password change).",
  },
  PrivilegedLoginRecorded: {
    source: SERVICE_SOURCES.auth,
    version: 1,
    analytics: true,
    description: "Admin or developer signed in (audit trail).",
  },
  OtpRequested: {
    // Carries the one-time code so Notification can build the email job.
    // Deliberately analytics:false — the code must never reach S3/Athena.
    source: SERVICE_SOURCES.auth,
    version: 1,
    analytics: false,
    description: "A password-reset OTP has to be emailed to the account owner.",
  },

  // -------------------------------------------------------------- story
  AuthorProfileSubmitted: {
    source: SERVICE_SOURCES.story,
    version: 1,
    analytics: true,
    description: "An author completed the profile required for publishing (enters admin review).",
  },
  AuthorProfileUpdated: {
    source: SERVICE_SOURCES.story,
    version: 1,
    analytics: false,
    description: "Author-facing profile fields (profession, bio, address, social links) changed.",
  },
  StoryCreated: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "A lifebook draft was created." },
  StoryUpdated: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "A lifebook was edited." },
  StoryPublished: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "A lifebook was published." },
  StoryUnpublished: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "A lifebook went back to draft." },
  StoryDeleted: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "A lifebook was deleted." },
  StoryLiked: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "An account liked a lifebook." },
  StoryUnliked: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "An account removed a like." },
  CommentCreated: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "A comment was written on a lifebook." },
  CommentUpdated: { source: SERVICE_SOURCES.story, version: 1, analytics: false, description: "A comment was edited." },
  CommentDeleted: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "A comment was deleted." },
  CommentLiked: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "An account liked a comment." },
  CommentReplyCreated: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "The story author replied to a comment." },
  FollowCreated: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "An account started following an author." },
  FollowRemoved: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "An account unfollowed an author." },
  TestimonialCreated: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "An account left (or updated) a testimonial." },
  TestimonialModerated: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "An admin hid or re-approved a testimonial." },
  TestimonialDeleted: { source: SERVICE_SOURCES.story, version: 1, analytics: true, description: "A testimonial was deleted." },

  // ------------------------------------------------------- consultation
  ExpertProfileSubmitted: {
    source: SERVICE_SOURCES.consultation,
    version: 1,
    analytics: true,
    description: "An expert completed the professional profile (enters admin review).",
  },
  ExpertProfileUpdated: {
    source: SERVICE_SOURCES.consultation,
    version: 1,
    analytics: false,
    description: "Expert professional details (expertise, categories, price) changed.",
  },
  ConsultationBooked: { source: SERVICE_SOURCES.consultation, version: 1, analytics: true, description: "A consultation booking was created." },
  ConsultationCancelled: { source: SERVICE_SOURCES.consultation, version: 1, analytics: true, description: "A booking was cancelled by the client." },
  ConsultationStatusChanged: {
    source: SERVICE_SOURCES.consultation,
    version: 1,
    analytics: true,
    description: "An expert moved a booking between confirmed/completed/cancelled.",
  },

  // ------------------------------------------------------- notification
  NotificationCreated: { source: SERVICE_SOURCES.notification, version: 1, analytics: true, description: "An in-app notification was stored." },
  EmailQueued: { source: SERVICE_SOURCES.notification, version: 1, analytics: true, description: "An email job was queued for the email worker." },

  // ------------------------------------------------------------- system
  AdminActionRecorded: { source: SERVICE_SOURCES.system, version: 1, analytics: true, description: "An admin performed a privileged action (audit trail)." },
  RequestFailed: {
    source: DYNAMIC_SOURCE,
    version: 1,
    analytics: false,
    description: "A request finished with 4xx/5xx — the developer portal's log store.",
  },

  // ------------------------------------------------------------- workers
  EmailDelivered: { source: SERVICE_SOURCES.emailWorker, version: 1, analytics: true, description: "SES accepted an email." },
  EmailFailed: { source: SERVICE_SOURCES.emailWorker, version: 1, analytics: true, description: "Email delivery failed permanently for this attempt." },
  AnalyticsBatchWritten: { source: SERVICE_SOURCES.analyticsWorker, version: 1, analytics: false, description: "Analytics batch stored in S3." },
};

/** Analytics only ever receives these detail types (allow-list, not `lifebookz.*`). */
export const ANALYTICS_EVENT_TYPES = Object.entries(EVENT_TYPES)
  .filter(([, definition]) => definition.analytics)
  .map(([type]) => type);

export function eventDefinition(type) {
  const definition = EVENT_TYPES[type];

  if (!definition) {
    throw new Error(
      `Unknown event type "${type}". Declare it in shared/events/src/registry.js before publishing.`,
    );
  }

  return definition;
}

export function isKnownEventType(type) {
  return Boolean(EVENT_TYPES[type]);
}
