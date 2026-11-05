"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  User,
  Star,
  RefreshCw,
  Send,
  Loader2,
  Layers,
  ChevronRight,
  Sparkles,
  Shield,
  Check,
  CreditCard,
  FileCheck,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store/auth-store";
import { gigApi } from "@/lib/api/gig";
import { GigJob, GigProposal, GigTimelineStep, GigPointsWallet } from "@/lib/types/gig";
import { toast } from "sonner";

type JobTab = "allOpen" | "myPosted" | "myAssigned" | "myProposals";

export function GigJobsMarketplaceView() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = (params?.workspace as string) || "gig";
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = React.useState<JobTab>("allOpen");
  const [jobs, setJobs] = React.useState<GigJob[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Loyalty Points Wallet state
  const [pointsWallet, setPointsWallet] = React.useState<GigPointsWallet | null>(null);
  const [showPointsModal, setShowPointsModal] = React.useState(false);

  // Post Job Dialog
  const [isPostOpen, setIsPostOpen] = React.useState(false);
  const [postForm, setPostForm] = React.useState({
    title: "",
    category: "Electrician",
    description: "",
    city: "Kochi",
    area: "Kaloor",
    budget: 500,
  });
  const [isPosting, setIsPosting] = React.useState(false);

  // Bid / Proposal Dialog (Provider bidding on client's job)
  const [biddingJob, setBiddingJob] = React.useState<GigJob | null>(null);
  const [proposedPrice, setProposedPrice] = React.useState("");
  const [estimatedDuration, setEstimatedDuration] = React.useState("Same day (2-4 hrs)");
  const [proposalPitch, setProposalPitch] = React.useState("");
  const [isSubmittingBid, setIsSubmittingBid] = React.useState(false);

  // Complete Task Dialog
  const [completingJob, setCompletingJob] = React.useState<GigJob | null>(null);
  const [completionNotes, setCompletionNotes] = React.useState("");
  const [isSubmittingComplete, setIsSubmittingComplete] = React.useState(false);

  // Rate & Review Job Dialog
  const [reviewingJob, setReviewingJob] = React.useState<GigJob | null>(null);
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState("");
  const [reviewTags, setReviewTags] = React.useState<string[]>(["High Quality", "Efficient"]);
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);

  // View Proposals Dialog (Client inspecting bids on their posted job)
  const [inspectJob, setInspectJob] = React.useState<GigJob | null>(null);
  const [proposals, setProposals] = React.useState<GigProposal[]>([]);
  const [timeline, setTimeline] = React.useState<GigTimelineStep[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = React.useState(false);

  // Load points wallet
  const loadPointsWallet = React.useCallback(async () => {
    try {
      const wallet = await gigApi.fetchProviderPointsWallet();
      setPointsWallet(wallet);
    } catch (err) {
      console.warn("Failed to load points wallet:", err);
    }
  }, []);

  React.useEffect(() => {
    loadPointsWallet();
  }, [loadPointsWallet]);

  const loadJobs = React.useCallback(
    async (showLoader = false) => {
      if (showLoader) setIsLoading(true);
      try {
        let data: GigJob[] = [];
        if (activeTab === "allOpen") {
          data = await gigApi.fetchJobsList();
        } else if (activeTab === "myPosted") {
          data = await gigApi.fetchMyPostedJobs();
        } else if (activeTab === "myAssigned") {
          data = await gigApi.fetchMyAssignedJobs();
        } else {
          // myProposals
          data = await gigApi.fetchJobsList();
        }
        setJobs(data || []);
      } catch (err) {
        console.error("Failed to load marketplace jobs:", err);
        setJobs([]);
      } finally {
        if (showLoader) setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeTab]
  );

  React.useEffect(() => {
    loadJobs(true);
  }, [loadJobs]);

  // Real-time sync polling (5 seconds)
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadJobs(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadJobs]);

  // Handle Post Job
  const handlePostJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title || !postForm.description) return;

    setIsPosting(true);
    toast.info("Publishing task to GIG marketplace...");

    try {
      const created = await gigApi.postJob({
        title: postForm.title,
        category: postForm.category,
        description: postForm.description,
        city: postForm.city,
        area: postForm.area,
        budget: Number(postForm.budget) || 500,
      });

      if (created) {
        toast.success("Job request posted! Verified providers will submit bids shortly.");
        setIsPostOpen(false);
        setPostForm({
          title: "",
          category: "Electrician",
          description: "",
          city: "Kochi",
          area: "Kaloor",
          budget: 500,
        });
        setActiveTab("myPosted");
        await loadJobs(true);
      }
    } catch {
      toast.error("Failed to post job request");
    } finally {
      setIsPosting(false);
    }
  };

  // Open Bid Modal
  const handleOpenBidModal = (job: GigJob) => {
    setBiddingJob(job);
    setProposedPrice(String(job.budget || 500));
    setEstimatedDuration("Same day (2-4 hrs)");
    setProposalPitch("Certified technician ready to inspect and execute on site with workmanship guarantee.");
  };

  // Submit Bid
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingJob) return;

    setIsSubmittingBid(true);
    toast.info("Submitting quotation proposal...");

    try {
      const res = await gigApi.submitProposal(biddingJob.id, {
        proposedPrice: Number(proposedPrice) || biddingJob.budget || 500,
        estimatedDuration,
        message: proposalPitch,
      });

      if (res) {
        toast.success("Your bid proposal was delivered to the client!");
        setBiddingJob(null);
        await loadJobs(false);
      }
    } catch {
      toast.error("Failed to submit proposal");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // Open Proposals & Details Inspector
  const handleInspectJob = async (job: GigJob) => {
    setInspectJob(job);
    setIsLoadingProposals(true);
    try {
      const [fetchedProposals, fetchedTimeline] = await Promise.all([
        gigApi.fetchJobProposals(job.id),
        gigApi.fetchJobTimeline(job.id),
      ]);

      setProposals(fetchedProposals || []);
      setTimeline(
        fetchedTimeline && fetchedTimeline.length > 0
          ? fetchedTimeline
          : [
              { step: "POSTED", title: "Task Published", timestamp: job.createdAt || "Recent", actor: "Client" },
              { step: "PROPOSALS", title: "Receiving Bids", timestamp: "Active", actor: "Verified Providers" },
            ]
      );
    } catch {
      setProposals([]);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  // Accept Proposal
  const handleAcceptProposal = async (jobId: number, proposalId: number) => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "assigned" } : j))
    );
    toast.info("Accepting quotation & assigning provider...");
    try {
      await gigApi.acceptProposal(jobId, proposalId);
      toast.success("Proposal accepted! Provider assigned to task.");
      setInspectJob(null);
      await loadJobs(false);
    } catch {
      toast.error("Failed to accept proposal");
      await loadJobs(false);
    }
  };

  // Reject Proposal
  const handleRejectProposal = async (jobId: number, proposalId: number) => {
    setProposals((prev) => prev.filter((p) => p.id !== proposalId));
    toast.info("Declining proposal...");
    try {
      await gigApi.rejectProposal(jobId, proposalId);
      toast.success("Proposal declined");
    } catch {
      toast.error("Failed to reject proposal");
    }
  };

  // Start Job Execution
  const handleStartJob = async (jobId: number) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "in_progress" } : j))
    );
    toast.info("Starting execution on task...");
    try {
      await gigApi.startJob(jobId);
      toast.success("Task execution started! Status is now in progress.");
      await loadJobs(false);
    } catch {
      toast.error("Failed to start job");
      await loadJobs(false);
    }
  };

  // Complete Job Execution & Submit Proof
  const handleSubmitComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingJob) return;
    setIsSubmittingComplete(true);

    setJobs((prev) =>
      prev.map((j) => (j.id === completingJob.id ? { ...j, status: "completed" } : j))
    );

    try {
      await gigApi.completeJob(completingJob.id, []);

      // Award +75 points to provider
      const updatedWallet = await gigApi.awardPoints(
        75,
        "Job Completed",
        `Task #${completingJob.id} (${completingJob.title}) executed & completed`
      );
      setPointsWallet(updatedWallet);

      toast.success("Job successfully completed! +75 Loyalty Points credited! ⭐", {
        description: "Client notified for payment settlement and review.",
      });
      setCompletingJob(null);
      await loadJobs(false);
    } catch {
      toast.error("Failed to complete job");
      await loadJobs(false);
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  // Submit Review for Job
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingJob) return;
    setIsSubmittingReview(true);

    setJobs((prev) =>
      prev.map((j) => (j.id === reviewingJob.id ? { ...j, isReviewed: true } : j))
    );

    try {
      await gigApi.submitJobReview(reviewingJob.id, {
        rating: reviewRating,
        comment: reviewComment,
        tags: reviewTags,
      });

      // Award +25 points
      const updatedWallet = await gigApi.awardPoints(
        25,
        "Client Review Bonus",
        `Rated provider on task #${reviewingJob.id}`
      );
      setPointsWallet(updatedWallet);

      toast.success("Review Submitted! +25 Loyalty Points credited! ⭐", {
        description: "Your feedback helps verified neighborhood providers.",
      });
      setReviewingJob(null);
      await loadJobs(false);
    } catch {
      toast.error("Failed to submit review");
      await loadJobs(false);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const totalPoints = pointsWallet?.totalPoints ?? 120;
  const currentTier = pointsWallet?.currentTier ?? "Bronze";
  const nextTier = pointsWallet?.nextTier ?? "Silver";
  const pointsToNext = pointsWallet?.pointsToNextTier ?? 380;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold mb-3">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>On-Demand Task Bidding Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Jobs, Requests & Bids Marketplace
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Post home repair requests to receive competitive quotations from local technicians, or submit bids on client job postings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Loyalty Points Pill (Clickable) */}
          <button
            onClick={() => setShowPointsModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 transition-all cursor-pointer shadow-2xs group"
            title="Open Loyalty Wallet"
          >
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Loyalty Wallet</span>
              <span className="text-xs font-black text-amber-950">{totalPoints} Pts · {currentTier}</span>
            </div>
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsRefreshing(true);
              loadJobs(true);
              loadPointsWallet();
            }}
            disabled={isRefreshing}
            className="h-9 px-3 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>Sync</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsPostOpen(true)}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Post a Task Request</span>
          </Button>
        </div>
      </div>

      {/* ── Marketplace Tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "allOpen", label: "Open Marketplace Tasks" },
          { id: "myPosted", label: "My Posted Requests" },
          { id: "myAssigned", label: "My Assigned Execution" },
          { id: "myProposals", label: "My Submitted Bids" },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as JobTab)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tasks Grid ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-medium">Querying marketplace task listings...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Task Requests Under This Tab</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === "myPosted"
              ? "You haven't posted any service tasks yet. Click 'Post a Task Request' to receive instant bids."
              : activeTab === "myAssigned"
              ? "No assigned tasks under execution right now."
              : "No open tasks currently listed. Check back shortly or post a new request."}
          </p>
          <Button
            size="sm"
            onClick={() => setIsPostOpen(true)}
            className="mt-4 h-8.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
          >
            Post a Task Now
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => {
            const isOpen = job.status === "open";
            const isAssigned = job.status === "assigned";
            const isInProgress = job.status === "in_progress";
            const isCompleted = job.status === "completed";

            return (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
                      {job.category}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isOpen
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : isAssigned
                          ? "bg-sky-50 border-sky-200 text-sky-800"
                          : isInProgress
                          ? "bg-amber-50 border-amber-200 text-amber-800"
                          : "bg-purple-50 border-purple-200 text-purple-800"
                      }`}
                    >
                      {job.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Title & Budget */}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {job.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 mt-1">
                    <DollarSign className="h-3.5 w-3.5 -mr-1" />
                    <span>Budget: ₹{job.budget || "Negotiable"}</span>
                  </div>

                  {/* Location & Time */}
                  <div className="flex items-center gap-3 text-slate-400 text-[11px] font-medium mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{job.area}, {job.city}</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{job.createdAt || "Today"}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-slate-500">
                    {job.proposalsCount || 0} Bids Received
                  </div>

                  <div className="flex items-center gap-2">
                    {/* If Client looking at their posted job */}
                    {activeTab === "myPosted" ? (
                      <div className="flex items-center gap-2">
                        {isCompleted && !job.isReviewed && (
                          <Button
                            size="sm"
                            onClick={() => setReviewingJob(job)}
                            className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold gap-1 shadow-2xs"
                          >
                            <Star className="h-3 w-3 fill-slate-950" />
                            <span>Rate Provider (+25 Pts)</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleInspectJob(job)}
                          className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1 shadow-2xs"
                        >
                          <span>View Bids ({job.proposalsCount || 0})</span>
                        </Button>
                      </div>
                    ) : activeTab === "myAssigned" ? (
                      isInProgress ? (
                        <Button
                          size="sm"
                          onClick={() => setCompletingJob(job)}
                          className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Complete & Submit (+75 Pts)</span>
                        </Button>
                      ) : isAssigned ? (
                        <Button
                          size="sm"
                          onClick={() => handleStartJob(job.id)}
                          className="h-8 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
                        >
                          Start Execution
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600">Completed</span>
                      )
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInspectJob(job)}
                          className="h-8 px-2.5 rounded-xl border-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Details
                        </Button>
                        {isOpen && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenBidModal(job)}
                            className="h-8 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1 shadow-2xs"
                          >
                            <Send className="h-3 w-3" />
                            <span>Submit Bid</span>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Loyalty Points Wallet Modal ─────────────────────────────────────── */}
      <Dialog open={showPointsModal} onOpenChange={setShowPointsModal}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Sparkles className="h-5 w-5 fill-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">Loyalty Rewards Wallet</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Earn points by completing appointments, tasks & daily login
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            {/* Total Points & Tier Card */}
            <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-teal-200">Total Reward Points</span>
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold border border-white/20">
                  <Shield className="h-3 w-3 text-amber-300 fill-amber-300" />
                  <span>{currentTier} Tier</span>
                </div>
              </div>

              <div className="text-4xl font-black tracking-tight text-white mb-3">
                {totalPoints}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-amber-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalPoints % 500) / 5)}%` }}
                />
              </div>

              <p className="text-[11px] text-teal-100 font-medium">
                {pointsToNext} points to unlock {nextTier} Tier perks & search ranking boost
              </p>
            </div>

            {/* Recent Points Earnings */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">Recent Points History</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {pointsWallet?.recentTransactions && pointsWallet.recentTransactions.length > 0 ? (
                  pointsWallet.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{tx.title}</p>
                          <p className="text-[11px] text-slate-500">{tx.description}</p>
                        </div>
                      </div>
                      <span className="font-black text-emerald-600 text-xs">+{tx.points} Pts</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No points transactions recorded yet.</p>
                )}
              </div>
            </div>

            {/* How to earn more points */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Ways to earn:</span>
              <div className="flex items-center justify-between text-[11px]">
                <span>Daily login streak</span>
                <span className="font-bold text-emerald-600">+10 Pts</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Complete job execution</span>
                <span className="font-bold text-emerald-600">+75 Pts</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Submit technician review</span>
                <span className="font-bold text-emerald-600">+25 Pts</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button size="sm" onClick={() => setShowPointsModal(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold">
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 1. Post a Task Modal ──────────────────────────────────────────── */}
      <Dialog open={isPostOpen} onOpenChange={setIsPostOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-slate-200 p-6 rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              <span>Post a Service Task Request</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Publish your repair problem to the marketplace to receive bids from certified professionals.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePostJobSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Master bathroom water heater leaking, needs gasket replacement"
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={postForm.category}
                  onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumbing</option>
                  <option value="AC Service">AC & HVAC</option>
                  <option value="Cleaning">Deep Cleaning</option>
                  <option value="Carpenter">Carpentry</option>
                  <option value="Appliances">Appliances</option>
                  <option value="Painter">Painting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Budget (₹) *</label>
                <input
                  type="number"
                  required
                  value={postForm.budget}
                  onChange={(e) => setPostForm({ ...postForm, budget: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={postForm.city}
                  onChange={(e) => setPostForm({ ...postForm, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Area / Locality</label>
                <input
                  type="text"
                  required
                  value={postForm.area}
                  onChange={(e) => setPostForm({ ...postForm, area: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Task Description *</label>
              <textarea
                required
                rows={4}
                placeholder="Explain the breakdown symptoms, access instructions, and when technician is needed..."
                value={postForm.description}
                onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPostOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPosting} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1">
                {isPosting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Publish Request</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 2. Submit Bid / Proposal Modal ────────────────────────────────── */}
      <Dialog open={!!biddingJob} onOpenChange={(open) => !open && setBiddingJob(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Submit Bid Proposal</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Quotation for: <strong className="text-slate-800">{biddingJob?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBid} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quoted Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration / Arrival *</label>
                <input
                  type="text"
                  required
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Proposal Pitch & Toolkit *</label>
              <textarea
                required
                rows={3}
                placeholder="Explain your approach, diagnosis technique, and warranty on workmanship..."
                value={proposalPitch}
                onChange={(e) => setProposalPitch(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setBiddingJob(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingBid} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1">
                {isSubmittingBid && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Send Quotation</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 3. Complete Task Modal ────────────────────────────────────────── */}
      <Dialog open={!!completingJob} onOpenChange={(open) => !open && setCompletingJob(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Complete Task Execution</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Submit completion summary for <strong className="text-slate-800">{completingJob?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitComplete} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Summary / Notes *</label>
              <textarea
                required
                rows={3}
                placeholder="Mention completed repair steps, replaced parts, testing conducted..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
              />
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0 fill-amber-500" />
              <span>Completing this task will award you <strong>+75 Loyalty Points</strong>!</span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCompletingJob(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingComplete} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1">
                {isSubmittingComplete && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Mark Completed (+75 Pts)</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 4. Rate & Review Job Modal ────────────────────────────────────── */}
      <Dialog open={!!reviewingJob} onOpenChange={(open) => !open && setReviewingJob(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Review Task Service</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Rate provider for <strong className="text-slate-800">{reviewingJob?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= reviewRating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-100 text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {["High Quality", "Efficient", "Polite", "Reasonable Cost", "Accurate Diagnosis"].map((tag) => {
                  const hasTag = reviewTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setReviewTags((prev) =>
                          hasTag ? prev.filter((t) => t !== tag) : [...prev, tag]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        hasTag
                          ? "bg-amber-100 border-amber-300 text-amber-900"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {hasTag && <Check className="h-3 w-3 inline mr-1" />}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback *</label>
              <textarea
                required
                rows={3}
                placeholder="Share your experience regarding workmanship, timeline and communication..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
              />
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0 fill-amber-500" />
              <span>Reviewing will award you <strong>+25 Loyalty Points</strong>!</span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setReviewingJob(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingReview} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1">
                {isSubmittingReview && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Submit Review (+25 Pts)</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 5. Inspect Job Details & Received Bids Modal ───────────────────── */}
      <Dialog open={!!inspectJob} onOpenChange={(open) => !open && setInspectJob(null)}>
        <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 p-6 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
          {inspectJob && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700">
                    {inspectJob.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                    {inspectJob.status.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900">{inspectJob.title}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Posted in {inspectJob.area}, {inspectJob.city} · Budget ₹{inspectJob.budget}
                </p>
              </div>

              {/* Description */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs leading-relaxed text-slate-700">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  Task Requirements
                </h4>
                <p>{inspectJob.description}</p>
              </div>

              {/* Progress Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Execution Timeline
                </h4>
                <div className="flex items-center gap-3 overflow-x-auto py-2">
                  {timeline.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 shrink-0 text-xs">
                      <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{step.title}</span>
                        <span className="block text-[10px] text-slate-400">{step.timestamp}</span>
                      </div>
                      {idx < timeline.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300 ml-2" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Received Bids */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Received Bids from Providers</span>
                  <span className="text-slate-400 font-normal">({proposals.length})</span>
                </h4>

                {isLoadingProposals ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-indigo-600" />
                    <span>Loading received proposals...</span>
                  </div>
                ) : proposals.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                    No proposals submitted yet by providers.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposals.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 text-xs shadow-2xs space-y-2 hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{prop.providerName || "Verified Provider"}</span>
                            <p className="text-[11px] text-slate-500">
                              {prop.providerSpecialization || "Technician"} · ★ {prop.providerRating?.toFixed(1) || "5.0"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-emerald-700">₹{prop.proposedPrice}</span>
                            <span className="block text-[10px] text-slate-400">{prop.estimatedDuration}</span>
                          </div>
                        </div>

                        <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {prop.message}
                        </p>

                        {activeTab === "myPosted" && prop.status === "pending" && (
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectProposal(inspectJob.id, prop.id)}
                              className="h-7.5 px-2.5 rounded-lg border-slate-200 text-slate-600 text-xs font-semibold"
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptProposal(inspectJob.id, prop.id)}
                              className="h-7.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Accept & Hire</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
