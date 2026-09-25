import test from "node:test";
import assert from "node:assert/strict";

import {
  createFakeAuthorProfiles,
  createFakeEngagement,
  createFakeLifebooks,
  createFakeMediaStore,
  createFakeTestimonials,
  createLogger,
  createPublisher,
} from "./fakes.js";

import { createLifebookService, canRead, sanitizeMediaList, visibleChapters } from "../src/services/lifebooks.js";
import { createEngagementService } from "../src/services/engagement.js";
import { createAuthorProfileService, isProfileComplete } from "../src/services/author-profile.js";
import { createTestimonialService } from "../src/services/testimonials.js";
import { createAccountEventHandlers } from "../src/consumers/account-events.js";

const AUTHOR = "65f1c0a2b3d4e5f6a7b8c9d0";
const OTHER_AUTHOR = "65f1c0a2b3d4e5f6a7b8c9d1";
const READER = "65f1c0a2b3d4e5f6a7b8c9d2";
const NEW_AUTHOR = "65f1c0a2b3d4e5f6a7b8c9d3";

function build({ profiles = [] } = {}) {
  const logger = createLogger();
  const publisher = createPublisher();
  const lifebooks = createFakeLifebooks();
  const authorProfiles = createFakeAuthorProfiles([
    {
      _id: AUTHOR,
      fullName: "Ada Author",
      profession: "writer",
      isProfileCompleted: true,
      verification: { status: "approved" },
      accountStatus: "active",
      stats: { followers: 0, following: 0, stories: 0, likes: 0 },
      ...profiles[0],
    },
    { _id: OTHER_AUTHOR, fullName: "Other Author", isProfileCompleted: true, verification: { status: "approved" }, accountStatus: "active" },
    { _id: READER, fullName: "Reader", verification: { status: "approved" }, accountStatus: "active" },
    {
      _id: NEW_AUTHOR,
      fullName: "New Author",
      profession: "—",
      isProfileCompleted: false,
      verification: { status: "pending" },
      accountStatus: "active",
    },
  ]);
  const engagement = createFakeEngagement();
  const mediaStore = createFakeMediaStore();
  const testimonials = createFakeTestimonials();
  const cfg = { feedPageSize: 12, maxChapters: 50, maxPublishFanout: 500 };

  return {
    logger,
    publisher,
    lifebooks,
    authorProfiles,
    engagement,
    mediaStore,
    testimonials,
    lifebookService: createLifebookService({ lifebooks, authorProfiles, engagement, mediaStore, publisher, logger, cfg }),
    engagementService: createEngagementService({ lifebooks, authorProfiles, engagement, publisher, logger }),
    authorProfileService: createAuthorProfileService({ authorProfiles, lifebooks, engagement, mediaStore, publisher, logger }),
    testimonialService: createTestimonialService({ testimonials, publisher, logger }),
    eventHandlers: createAccountEventHandlers({ authorProfiles, lifebooks, logger }),
  };
}

const authorClaims = { accountId: AUTHOR, role: "author" };
const readerClaims = { accountId: READER, role: "user" };

test("media sanitising keeps only R2 references and bounds the list", () => {
  const media = sanitizeMediaList([
    { url: "https://cdn.example/a.jpg", key: "stories/media/images/a.jpg", type: "image", caption: "A" },
    { url: "   " },
    { url: "https://cdn.example/b.mp4", type: "video" },
    { url: "https://cdn.example/c", type: "weird" },
  ]);

  assert.equal(media.length, 3);
  assert.equal(media[0].key, "stories/media/images/a.jpg");
  assert.equal(media[2].type, "image", "an unknown media type falls back to image");
});

test("visibility decides who may read a lifebook and which entries they see", () => {
  const lifebook = {
    author: AUTHOR,
    status: "published",
    visibility: "followers",
    chapters: [{ order: 0, title: "Childhood", stories: [{ visibility: "public" }, { visibility: "followers" }, { visibility: "private" }] }],
  };

  assert.equal(canRead({ lifebook, claims: { accountId: AUTHOR }, isFollowingAuthor: false }), true);
  assert.equal(canRead({ lifebook, claims: readerClaims, isFollowingAuthor: true }), true);
  assert.equal(canRead({ lifebook, claims: readerClaims, isFollowingAuthor: false }), false);
  assert.equal(canRead({ lifebook, claims: null }), false);

  const followerView = visibleChapters({ lifebook, isOwner: false, isFollower: true });
  const strangerView = visibleChapters({ lifebook, isOwner: false, isFollower: false });

  assert.equal(followerView[0].stories.length, 2);
  assert.equal(strangerView[0].stories.length, 1);
  assert.equal(visibleChapters({ lifebook, isOwner: true, isFollower: false })[0].stories.length, 3);
});

test("a lifebook can only be created by an author with a profile projection", async () => {
  const { lifebookService, publisher } = build();

  await assert.rejects(
    () => lifebookService.create({ accountId: "65f1c0a2b3d4e5f6a7b8c9ff", claims: readerClaims, input: { title: "Nope" } }),
    /Author profile not found/,
  );

  const created = await lifebookService.create({ accountId: AUTHOR, claims: authorClaims, input: { title: "My Life" } });

  assert.equal(created.title, "My Life");
  assert.equal(created.status, "draft");
  assert.equal(created.authorProfession, "writer");
  assert.equal(publisher.of("StoryCreated").length, 1);
});

test("chapters and story entries are added, re-slotted and removed", async () => {
  const { lifebookService, publisher } = build();
  const created = await lifebookService.create({ accountId: AUTHOR, claims: authorClaims, input: { title: "My Life" } });
  const storyId = String(created._id);

  const withChapters = await lifebookService.addChapter({ accountId: AUTHOR, claims: authorClaims, storyId, input: {} });
  assert.equal(withChapters.chapters.length, 1);
  assert.equal(withChapters.chapters[0].title, "Childhood", "the default chapter name comes from the life structure");

  const [chapter] = withChapters.chapters;
  const withEntry = await lifebookService.addEntry({
    accountId: AUTHOR,
    claims: authorClaims,
    storyId,
    chapterId: String(chapter._id),
    input: { title: "First memory", storyType: "memory", content: "I remember…", media: [{ url: "https://cdn.example/a.jpg" }] },
  });

  assert.equal(withEntry.chapters[0].stories.length, 1);
  assert.equal(withEntry.chapters[0].stories[0].storyType, "memory");
  assert.equal(withEntry.chapters[0].stories[0].status, "draft");

  const entryId = String(withEntry.chapters[0].stories[0]._id);
  const updated = await lifebookService.updateEntry({
    accountId: AUTHOR,
    claims: authorClaims,
    storyId,
    chapterId: String(chapter._id),
    entryId,
    input: { title: "Renamed memory" },
  });
  assert.equal(updated.chapters[0].stories[0].title, "Renamed memory");

  const deleted = await lifebookService.deleteEntry({
    accountId: AUTHOR,
    claims: authorClaims,
    storyId,
    chapterId: String(chapter._id),
    entryId,
  });
  assert.equal(deleted.chapters[0].stories.length, 0);
  assert.ok(publisher.of("StoryUpdated").length >= 3);
});

test("another author cannot touch someone else's lifebook", async () => {
  const { lifebookService } = build();
  const created = await lifebookService.create({ accountId: AUTHOR, claims: authorClaims, input: { title: "My Life" } });
  const storyId = String(created._id);

  await assert.rejects(
    () => lifebookService.update({ accountId: OTHER_AUTHOR, claims: { accountId: OTHER_AUTHOR, role: "author" }, storyId, input: { title: "Hijacked" } }),
    /Story not found/,
  );
  await assert.rejects(
    () =>
      lifebookService.addChapter({
        accountId: OTHER_AUTHOR,
        claims: { accountId: OTHER_AUTHOR, role: "author" },
        storyId,
        input: {},
      }),
    /Story not found/,
  );
});

test("publishing requires a completed profile and publishes entries plus followers", async () => {
  const incomplete = build({ profiles: [{ isProfileCompleted: false }] });
  const draft = await incomplete.lifebookService.create({ accountId: AUTHOR, claims: authorClaims, input: { title: "Draft" } });

  await assert.rejects(
    () => incomplete.lifebookService.publish({ accountId: AUTHOR, claims: authorClaims, storyId: String(draft._id), input: {} }),
    /complete your profile before publishing/,
  );

  const { lifebookService, publisher } = build();
  const created = await lifebookService.create({ accountId: AUTHOR, claims: authorClaims, input: { title: "Live" } });
  const storyId = String(created._id);
  const withChapter = await lifebookService.addChapter({ accountId: AUTHOR, claims: authorClaims, storyId, input: { title: "Career" } });
  await lifebookService.addEntry({
    accountId: AUTHOR,
    claims: authorClaims,
    storyId,
    chapterId: String(withChapter.chapters[0]._id),
    input: { title: "Promotion", content: "…" },
  });

  const published = await lifebookService.publish({ accountId: AUTHOR, claims: authorClaims, storyId, input: {} });

  assert.equal(published.status, "published");
  assert.ok(published.publishedAt);
  assert.equal(published.chapters[0].stories[0].status, "published");

  const events = publisher.of("StoryPublished");
  assert.equal(events.length, 1);
  assert.equal(events[0].data.authorId, AUTHOR);
  assert.equal(events[0].data.entries, 1);
});

test("detail hides private entries and reports the viewer's like state", async () => {
  const { lifebookService, engagement } = build();
  const created = await lifebookService.create({ accountId: AUTHOR, claims: authorClaims, input: { title: "Public Life", visibility: "public" } });
  const storyId = String(created._id);
  const withChapter = await lifebookService.addChapter({ accountId: AUTHOR, claims: authorClaims, storyId, input: { title: "Career" } });
  await lifebookService.addEntry({
    accountId: AUTHOR,
    claims: authorClaims,
    storyId,
    chapterId: String(withChapter.chapters[0]._id),
    input: { title: "Private note", visibility: "private" },
  });
  await lifebookService.publish({ accountId: AUTHOR, claims: authorClaims, storyId, input: {} });

  await engagement.createLike({ story: storyId, account: READER, accountModel: "User" });

  const asReader = await lifebookService.detail({ storyId, claims: readerClaims });
  const asAuthor = await lifebookService.detail({ storyId, claims: authorClaims });

  assert.equal(asReader.chapters[0].stories.length, 0, "a private entry is not returned to a stranger");
  assert.equal(asReader.likedByUser, true);
  assert.equal(asAuthor.chapters[0].stories.length, 1);
  assert.equal(asAuthor.isOwner, true);
});

test("likes keep the lifebook counter, the author counter and the events in step", async () => {
  const { lifebookService, engagementService, publisher, authorProfiles, lifebooks } = build();
  const created = await lifebookService.create({ accountId: AUTHOR, claims: authorClaims, input: { title: "Likeable" } });
  const storyId = String(created._id);
  await lifebookService.publish({ accountId: AUTHOR, claims: authorClaims, storyId, input: {} });

  const liked = await engagementService.toggleLike({ storyId, claims: readerClaims });
  assert.equal(liked.liked, true);
  assert.equal(authorProfiles.profiles.get(AUTHOR).stats.likes, 1);
  assert.equal(lifebooks.rows()[0].stats.likes, 1);

  const unliked = await engagementService.toggleLike({ storyId, claims: readerClaims });
  assert.equal(unliked.liked, false);
  assert.equal(authorProfiles.profiles.get(AUTHOR).stats.likes, 0);
  assert.equal(publisher.of("StoryLiked").length, 1);
  assert.equal(publisher.of("StoryUnliked").length, 1);
});

test("comments notify the story author and only its author can reply", async () => {
  const { lifebookService, engagementService, publisher } = build();
  const created = await lifebookService.create({ accountId: AUTHOR, claims: authorClaims, input: { title: "Chatty" } });
  const storyId = String(created._id);
  await lifebookService.publish({ accountId: AUTHOR, claims: authorClaims, storyId, input: {} });

  const comment = await engagementService.createComment({ storyId, claims: readerClaims, content: "Lovely story" });

  const events = publisher.of("CommentCreated");
  assert.equal(events.length, 1);
  assert.equal(events[0].data.authorId, AUTHOR, "the notification goes to the story's author");
  assert.equal(events[0].data.preview, "Lovely story");

  await assert.rejects(
    () => engagementService.replyToComment({ commentId: String(comment._id), claims: readerClaims, content: "hi" }),
    /Only the story's author can reply/,
  );

  const reply = await engagementService.replyToComment({ commentId: String(comment._id), claims: authorClaims, content: "Thank you!" });
  assert.equal(reply.content, "Thank you!");
  assert.equal(publisher.of("CommentReplyCreated").length, 1);

  await assert.rejects(
    () => engagementService.updateComment({ commentId: String(comment._id), claims: authorClaims, content: "no" }),
    /only edit your own comment/,
  );
});

test("following refuses self-follows and keeps both counters honest", async () => {
  const { engagementService, authorProfiles, publisher } = build();

  await assert.rejects(() => engagementService.follow({ authorId: READER, claims: readerClaims }), /cannot follow yourself/);

  await engagementService.follow({ authorId: AUTHOR, claims: readerClaims });
  await engagementService.follow({ authorId: OTHER_AUTHOR, claims: readerClaims });

  assert.equal(authorProfiles.profiles.get(AUTHOR).stats.followers, 1);
  assert.equal(authorProfiles.profiles.get(READER).stats.following, 2);
  assert.equal(publisher.of("FollowCreated").length, 2);

  await assert.rejects(() => engagementService.follow({ authorId: AUTHOR, claims: readerClaims }), /Already following/);

  await engagementService.unfollow({ authorId: AUTHOR, claims: readerClaims });
  assert.equal(authorProfiles.profiles.get(AUTHOR).stats.followers, 0);
  assert.equal(publisher.of("FollowRemoved").length, 1);
});

test("a completed author profile enters the review queue and propagates the profession", async () => {
  const { authorProfileService, authorProfiles, lifebooks, lifebookService, publisher } = build();
  const newAuthorClaims = { accountId: NEW_AUTHOR, role: "author" };

  const created = await lifebookService.create({ accountId: NEW_AUTHOR, claims: newAuthorClaims, input: { title: "Old book" } });
  assert.ok(created);

  const updated = await authorProfileService.update({
    accountId: NEW_AUTHOR,
    claims: newAuthorClaims,
    input: { profession: "Teacher", bio: "I teach", phone: "+91", dob: "1990-01-01", gender: "Female" },
  });

  assert.equal(updated.isProfileCompleted, true);
  assert.equal(isProfileComplete(updated), true);
  assert.equal(publisher.of("AuthorProfileSubmitted").length, 1, "the profile enters admin review once");

  const rows = lifebooks.rows();
  assert.equal(rows[0].authorProfession, "teacher", "the feed filter stays in step");
  assert.equal(authorProfiles.profiles.get(NEW_AUTHOR).profession, "Teacher");
});

test("lifebook slugs are generated from the title with a unique suffix", async () => {
  const { buildSlug } = await import("../src/models/lifebook.js");

  const slug = buildSlug("My Life: The Early Years!");

  assert.match(slug, /^my-life-the-early-years-[0-9a-f]{8}$/);
  assert.notEqual(buildSlug("Same title"), buildSlug("Same title"));
});

test("author media presigning is restricted to author kinds", async () => {
  const { authorProfileService } = build();

  const presigned = await authorProfileService.presignMedia({ accountId: AUTHOR, input: { kind: "authorCover", contentType: "image/jpeg" } });
  assert.ok(presigned.key.startsWith("authorCover/"));

  await assert.rejects(
    () => authorProfileService.presignMedia({ accountId: AUTHOR, input: { kind: "storyVideo", contentType: "video/mp4" } }),
    /can be presigned here/,
  );
});

test("testimonials are upserted per person and moderated by admins only", async () => {
  const { testimonialService, publisher } = build();

  const first = await testimonialService.create({ claims: readerClaims, message: "Great platform" });
  const second = await testimonialService.create({ claims: readerClaims, message: "Still great" });

  assert.equal(first._id, second._id, "one testimonial per person");
  assert.equal(second.message, "Still great");

  await assert.rejects(() => testimonialService.moderate({ id: first._id, status: "hidden", claims: readerClaims }), /Only an admin/);

  const moderated = await testimonialService.moderate({ id: first._id, status: "hidden", claims: { accountId: "adm", role: "admin" } });
  assert.equal(moderated.status, "hidden");
  assert.equal(publisher.of("TestimonialModerated").length, 1);
});

test("account events create and maintain the author projection", async () => {
  const { eventHandlers, authorProfiles } = build();

  await eventHandlers.AccountRegistered({
    eventId: "e-1",
    data: { accountId: "acc-new", role: "author", email: "new@example.com", username: "new.author", fullName: "New Author" },
  });

  assert.equal(authorProfiles.profiles.get("acc-new").fullName, "New Author");

  // Reader and expert accounts must not create author projections.
  await eventHandlers.AccountRegistered({ eventId: "e-2", data: { accountId: "acc-reader", role: "user" } });
  assert.equal(authorProfiles.profiles.has("acc-reader"), false);

  await eventHandlers.AccountVerificationDecided({ eventId: "e-3", data: { accountId: "acc-new", role: "author", decision: "approved" } });
  assert.equal(authorProfiles.profiles.get("acc-new").verification.status, "approved");

  await eventHandlers.AccountProfileUpdated({ eventId: "e-4", data: { accountId: "acc-new", role: "author", fullName: "Renamed Author" } });
  assert.equal(authorProfiles.profiles.get("acc-new").fullName, "Renamed Author");

  await eventHandlers.AccountStatusChanged({ eventId: "e-5", data: { accountId: "acc-new", role: "author", status: "suspended" } });
  assert.equal(authorProfiles.profiles.get("acc-new").accountStatus, "suspended");
});

test("publishing an event carries the follower fan-out list Notification needs", async () => {
  const { lifebookService, engagement, publisher } = build();

  const created = await lifebookService.create({
    accountId: AUTHOR,
    claims: { accountId: AUTHOR, role: "author" },
    input: { title: "Fan-out Life", visibility: "public" },
  });

  // Two followers of mixed account types, exactly as the monolith allowed.
  await engagement.createFollow({ followerId: READER, followerModel: "User", authorId: AUTHOR });
  await engagement.createFollow({ followerId: OTHER_AUTHOR, followerModel: "Author", authorId: AUTHOR });

  await lifebookService.publish({
    accountId: AUTHOR,
    claims: { accountId: AUTHOR, role: "author" },
    storyId: created.id,
    input: {},
  });

  const [event] = publisher.of("StoryPublished");

  assert.equal(event.data.visibility, "public");
  assert.equal(event.data.storySlug, created.slug);
  assert.deepEqual(
    event.data.followers.sort((a, b) => a.model.localeCompare(b.model)),
    [
      { accountId: OTHER_AUTHOR, model: "Author" },
      { accountId: READER, model: "User" },
    ],
  );
});

test("a private lifebook is published without a follower fan-out", async () => {
  const { lifebookService, engagement, publisher } = build();

  const created = await lifebookService.create({
    accountId: AUTHOR,
    claims: { accountId: AUTHOR, role: "author" },
    input: { title: "Private Life", visibility: "private" },
  });

  await engagement.createFollow({ followerId: READER, followerModel: "User", authorId: AUTHOR });

  await lifebookService.publish({
    accountId: AUTHOR,
    claims: { accountId: AUTHOR, role: "author" },
    storyId: created.id,
    input: {},
  });

  assert.deepEqual(publisher.of("StoryPublished")[0].data.followers, []);
});
