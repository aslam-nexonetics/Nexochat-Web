"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Radio,
  Plus,
  Heart,
  MessageSquare,
  Share2,
  Send,
  Loader2,
  Sparkles,
  Quote,
  Megaphone,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { feedsApi, FeedPost, FeedComment } from "@/lib/api/feeds";
import { toast } from "sonner";

export default function WorkspaceFeedsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace as string) || "nexonetics";

  const { user } = useAuthStore();
  const { activeCollection, collections, selectCollectionByName } = useWorkspaceStore();

  const [posts, setPosts] = React.useState<FeedPost[]>([]);
  const [category, setCategory] = React.useState("all");
  const [isLoading, setIsLoading] = React.useState(true);

  // Comments state per post
  const [openComments, setOpenComments] = React.useState<Record<number, boolean>>({});
  const [commentsMap, setCommentsMap] = React.useState<Record<number, FeedComment[]>>({});
  const [loadingComments, setLoadingComments] = React.useState<Record<number, boolean>>({});
  const [commentInputs, setCommentInputs] = React.useState<Record<number, string>>({});

  // Create Post Dialog
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [postType, setPostType] = React.useState<"announcement" | "quote" | "image">("announcement");
  const [postTitle, setPostTitle] = React.useState("");
  const [postContent, setPostContent] = React.useState("");
  const [postImageUrl, setPostImageUrl] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  const currentCollection =
    activeCollection ||
    collections.find((c) => c.collectionName.toLowerCase().trim() === workspaceSlug.toLowerCase()) || {
      id: 0,
      collectionName: workspaceSlug.charAt(0).toUpperCase() + workspaceSlug.slice(1),
      properties: ["nexo_feeds"],
    };

  const collectionName = currentCollection.collectionName;

  // 1. Fetch posts
  const loadPosts = React.useCallback(async () => {
    if (!collectionName) return;
    setIsLoading(true);
    try {
      const fetched = await feedsApi.getPosts(collectionName, category);
      setPosts(fetched);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [collectionName, category]);

  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 2. Like toggle
  const handleToggleLike = async (postId: number) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.isLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    await feedsApi.toggleLike(collectionName, postId);
  };

  // 3. Toggle Comments
  const handleToggleComments = async (postId: number) => {
    const isCurrentlyOpen = openComments[postId];
    setOpenComments((prev) => ({ ...prev, [postId]: !isCurrentlyOpen }));

    if (!isCurrentlyOpen && !commentsMap[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      const fetchedComments = await feedsApi.getComments(collectionName, postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: fetchedComments }));
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // 4. Add Comment
  const handleAddComment = async (postId: number) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    toast.info("Posting comment...");

    const newComment = await feedsApi.addComment(collectionName, postId, text);
    if (newComment) {
      toast.success("Comment added!");
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
      );
    } else {
      toast.error("Failed to post comment");
    }
  };

  // 5. Submit New Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      toast.error("Please enter content for the post");
      return;
    }

    setIsSubmitting(true);
    const newPost = await feedsApi.createPost(collectionName, {
      type: postType,
      title: postTitle.trim() || undefined,
      content: postContent.trim(),
      imageUrl: postImageUrl.trim() || undefined,
    });
    setIsSubmitting(false);

    if (newPost) {
      toast.success("Post published to company feed!");
      setIsCreateOpen(false);
      setPostTitle("");
      setPostContent("");
      setPostImageUrl("");
      setPosts((prev) => [newPost, ...prev]);
    } else {
      toast.error("Failed to create post. Please try again.");
    }
  };

  const categories = [
    { id: "all", label: "All Updates", icon: Radio },
    { id: "announcement", label: "Announcements", icon: Megaphone },
    { id: "quote", label: "Milestones", icon: Quote },
    { id: "image", label: "Media & Culture", icon: ImageIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* ── Header & Action Bar ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200">
            <Radio className="h-3 w-3" />
            <span>Company Stream</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {collectionName} Feeds
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal announcements, project milestones, team recognitions, and company discussions.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-2xs shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Post</span>
        </Button>
      </div>

      {/* ── Category Filter Pills ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => {
          const Icon = c.icon;
          const isSelected = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                isSelected
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Posts Stream ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-xs font-medium text-slate-600">Loading {collectionName} posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl p-8">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Radio className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">No posts in this category</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Be the first to share an update or milestone with the {collectionName} team.
          </p>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Post
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isCommentsOpen = openComments[post.id] ?? false;
            const comments = commentsMap[post.id] || [];
            const isCommentsLoading = loadingComments[post.id] ?? false;

            return (
              <article
                key={post.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Author Info & Type Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                      {post.author.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900">
                          {post.author.fullName}
                        </h4>
                        <span className="text-[10px] text-slate-400">@{post.author.username}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(post.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        ·{" "}
                        {new Date(post.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="capitalize text-[10px] font-semibold text-slate-600 border-slate-200 bg-slate-50"
                  >
                    {post.type}
                  </Badge>
                </div>

                {/* Title & Content */}
                {post.title && (
                  <h3 className="font-extrabold text-base text-slate-900 mb-2 tracking-tight">
                    {post.title}
                  </h3>
                )}
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Optional Image */}
                {post.imageUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 max-h-96">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt={post.title || "Post attachment"}
                      className="w-full object-cover"
                    />
                  </div>
                )}

                {/* Action Buttons: Like, Comment, Share */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                        post.isLiked ? "text-rose-600" : "hover:text-rose-600 text-slate-600"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${post.isLiked ? "fill-rose-600 text-rose-600" : ""}`}
                      />
                      <span>{post.likesCount}</span>
                    </button>

                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1.5 font-semibold hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.commentsCount} comments</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Post link copied to clipboard");
                    }}
                    className="flex items-center gap-1 text-[11px] hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </button>
                </div>

                {/* ── Collapsible Comments Section ───────────────────────────── */}
                {isCommentsOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    {/* Comments list */}
                    {isCommentsLoading ? (
                      <div className="py-4 text-center">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600 mx-auto mb-1" />
                        <span className="text-[11px] text-slate-400">Loading comments...</span>
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        No comments yet. Be the first to reply!
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5"
                          >
                            <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {c.author.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-bold text-xs text-slate-900">
                                  {c.author.fullName}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(c.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700">{c.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ── CREATE NEW POST MODAL ────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1.5 border border-indigo-200 w-fit">
              <Sparkles className="h-3 w-3" />
              <span>Share an Update</span>
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Create Post in {collectionName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Post will be broadcast across {collectionName}&apos;s company feed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePost} className="space-y-4 pt-2">
            {/* Post Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Post Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "announcement", label: "Announcement", icon: Megaphone },
                  { id: "quote", label: "Milestone", icon: Quote },
                  { id: "image", label: "Media", icon: ImageIcon },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSel = postType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPostType(t.id as any)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSel
                          ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Headline / Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Q4 Platform Release v2.4"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Content <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Share details, recognition, or updates with the team..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            {/* Optional Image URL */}
            {postType === "image" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs h-9 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!postContent.trim() || isSubmitting}
                className="text-xs h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-2xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <span>Publish Post</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
