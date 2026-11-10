"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  Star,
  RefreshCw,
  User,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Filter,
  DollarSign,
  FileText,
  Sparkles,
  CreditCard,
  Truck,
  Check,
  X,
  Plus,
  Coins,
  Award,
  ChevronRight,
  Shield,
  Layers,
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
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { gigApi } from "@/lib/api/gig";
import { GigAppointment, GigPointsWallet, GigProvider } from "@/lib/types/gig";
import { toast } from "sonner";

const QUICK_SERVICE_CATEGORIES = [
  "Electrician",
  "Plumber",
  "AC Service",
  "Appliances",
  "Carpenter",
  "Cleaning",
  "Painter",
];

const TIME_SLOTS = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM",
  "5:00 PM - 7:00 PM",
];

export default function WorkspaceGigAppointmentsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = (params?.workspace as string) || "gig";

  const { user } = useAuthStore();
  const { selectCollectionByName } = useWorkspaceStore();

  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  const [role, setRole] = React.useState<"client" | "provider">("client");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [appointments, setAppointments] = React.useState<GigAppointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Loyalty Points Wallet state
  const [pointsWallet, setPointsWallet] = React.useState<GigPointsWallet | null>(null);
  const [showPointsModal, setShowPointsModal] = React.useState(false);

  // Book Visit Dialog
  const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);
  const [bookForm, setBookForm] = React.useState({
    category: "Electrician",
    serviceTitle: "Electrical Diagnostic & Repair Visit",
    description: "",
    address: "Flat 4B, Sky High Apts, Link Road",
    city: "Kochi",
    area: "Kaloor",
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    scheduledTimeSlot: "10:00 AM - 12:00 PM",
    estimatedBudget: 350,
    providerId: 12,
    providerName: "Arya kg",
    providerSpecialization: "Electrician",
  });
  const [isBookingSubmitting, setIsBookingSubmitting] = React.useState(false);

  // Reschedule Propose Dialog
  const [rescheduleAppt, setRescheduleAppt] = React.useState<GigAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = React.useState("10:00 AM - 12:00 PM");
  const [rescheduleReason, setRescheduleReason] = React.useState("");
  const [isSubmittingReschedule, setIsSubmittingReschedule] = React.useState(false);

  // Decline Dialog
  const [declineAppt, setDeclineAppt] = React.useState<GigAppointment | null>(null);
  const [declineReason, setDeclineReason] = React.useState("");
  const [isSubmittingDecline, setIsSubmittingDecline] = React.useState(false);

  // Cancel Dialog
  const [cancelAppt, setCancelAppt] = React.useState<GigAppointment | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = React.useState(false);

  // Complete & Bill Dialog
  const [completeAppt, setCompleteAppt] = React.useState<GigAppointment | null>(null);
  const [finalAmount, setFinalAmount] = React.useState("");
  const [completionNotes, setCompletionNotes] = React.useState("");
  const [isSubmittingComplete, setIsSubmittingComplete] = React.useState(false);

  // Payment Settlement Dialog
  const [paymentAppt, setPaymentAppt] = React.useState<GigAppointment | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<"cash" | "upi" | "card">("upi");
  const [receiptNotes, setReceiptNotes] = React.useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = React.useState(false);

  // Review Dialog
  const [reviewAppt, setReviewAppt] = React.useState<GigAppointment | null>(null);
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState("");
  const [reviewTags, setReviewTags] = React.useState<string[]>(["Punctual", "Clean Work"]);
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);

  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  // Load points wallet & daily login
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

    // Check daily login bonus
    const lastLoginCheck = typeof window !== "undefined" ? localStorage.getItem("gig_last_daily_login") : null;
    const todayStr = new Date().toISOString().split("T")[0];
    if (lastLoginCheck !== todayStr) {
      gigApi.recordDailyLogin().then((res) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("gig_last_daily_login", todayStr);
        }
        gigApi.awardPoints(10, "Daily Login Bonus", "Active streak login reward").then((w) => {
          setPointsWallet(w);
          toast.success("⭐ Daily Login Bonus: +10 Loyalty Points awarded!", {
            description: "Keep your daily streak going to unlock higher tiers.",
          });
        });
      });
    }
  }, [loadPointsWallet]);

  const loadAppointments = React.useCallback(
    async (showLoader = false) => {
      if (showLoader) setIsLoading(true);
      try {
        const data = await gigApi.fetchMyAppointments(role, statusFilter);
        setAppointments(data);
      } catch (err) {
        console.error("Failed to load appointments:", err);
      } finally {
        if (showLoader) setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [role, statusFilter]
  );

  React.useEffect(() => {
    loadAppointments(true);
  }, [loadAppointments]);

  // Real-time live polling (every 5 seconds, matching Flutter GigSyncService)
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadAppointments(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

  // ── Appointment Flow Actions ───────────────────────────────────────────────

  // 1. Accept appointment
  const handleAccept = async (id: number) => {
    // Optimistic UI update
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "confirmed" } : a))
    );
    toast.info("Confirming appointment schedule...");
    try {
      await gigApi.acceptAppointment(id);
      toast.success("Appointment accepted and confirmed!");
      await loadAppointments(false);
    } catch {
      toast.error("Failed to accept appointment");
      await loadAppointments(false);
    }
  };

  // 2. Start Work: En Route or In Progress
  const handleUpdateStatus = async (id: number, newStatus: "en_route" | "in_progress") => {
    const label = newStatus === "en_route" ? "Technician en-route" : "Work in progress";
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    toast.info(`Updating appointment status to ${label}...`);
    try {
      await gigApi.updateAppointmentStatus(id, { status: newStatus });
      toast.success(`Status updated: ${label}!`);
      await loadAppointments(false);
    } catch {
      toast.error("Failed to update status");
      await loadAppointments(false);
    }
  };

  // 3. Propose Reschedule
  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleAppt) return;
    setIsSubmittingReschedule(true);
    // Optimistic
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === rescheduleAppt.id
          ? {
              ...a,
              status: "rescheduled_by_provider",
              proposedNewDate: rescheduleDate,
              proposedNewTimeSlot: rescheduleTimeSlot,
              rescheduleReason,
            }
          : a
      )
    );
    try {
      await gigApi.proposeReschedule(rescheduleAppt.id, {
        newDate: rescheduleDate,
        newTimeSlot: rescheduleTimeSlot,
        reason: rescheduleReason,
      });
      toast.success("Reschedule proposal sent to client!");
      setRescheduleAppt(null);
      await loadAppointments(false);
    } catch {
      toast.error("Failed to propose reschedule");
      await loadAppointments(false);
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // 4. Accept Rescheduled Slot
  const handleAcceptRescheduled = async (id: number) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "confirmed" } : a))
    );
    toast.info("Accepting proposed new time slot...");
    try {
      await gigApi.acceptRescheduledAppointment(id);
      toast.success("New schedule confirmed!");
      await loadAppointments(false);
    } catch {
      toast.error("Failed to confirm reschedule");
      await loadAppointments(false);
    }
  };

  // 5. Decline Appointment
  const handleSubmitDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineAppt) return;
    setIsSubmittingDecline(true);
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === declineAppt.id
          ? { ...a, status: "declined", declineReason }
          : a
      )
    );
    try {
      await gigApi.declineAppointment(declineAppt.id, declineReason);
      toast.success("Appointment declined");
      setDeclineAppt(null);
      await loadAppointments(false);
    } catch {
      toast.error("Failed to decline appointment");
      await loadAppointments(false);
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  // 6. Cancel Appointment (Both client & provider)
  const handleSubmitCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelAppt) return;
    setIsSubmittingCancel(true);
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === cancelAppt.id
          ? { ...a, status: "cancelled", cancellationReason: cancelReason }
          : a
      )
    );
    try {
      await gigApi.cancelAppointment(cancelAppt.id, cancelReason);
      toast.success("Appointment cancelled successfully");
      setCancelAppt(null);
      await loadAppointments(false);
    } catch {
      toast.error("Failed to cancel appointment");
      await loadAppointments(false);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // 7. Complete Work & Bill
  const handleSubmitComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeAppt) return;
    setIsSubmittingComplete(true);
    const parsedAmount = finalAmount ? Number(finalAmount) : completeAppt.estimatedBudget || 350;

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === completeAppt.id
          ? {
              ...a,
              status: "completed",
              finalAmount: parsedAmount,
              completionNotes: completionNotes || undefined,
              paymentStatus: "unpaid",
              pointsAwarded: 60,
              isPointsCredited: true,
            }
          : a
      )
    );

    try {
      await gigApi.updateAppointmentStatus(completeAppt.id, {
        status: "completed",
        finalAmount: parsedAmount,
        completionNotes: completionNotes || undefined,
      });

      // Award points (+60)
      const updatedWallet = await gigApi.awardPoints(
        60,
        "Service Completed",
        `Work order #${completeAppt.id} successfully completed`
      );
      setPointsWallet(updatedWallet);

      toast.success("Service Completed! +60 Loyalty Points awarded to wallet! ⭐", {
        description: `Final bill of ₹${parsedAmount} generated for client payment settlement.`,
      });
      setCompleteAppt(null);
      await loadAppointments(false);
    } catch {
      toast.error("Failed to mark completed");
      await loadAppointments(false);
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  // 8. Payment Settlement
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAppt) return;
    setIsSubmittingPayment(true);

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === paymentAppt.id
          ? {
              ...a,
              paymentStatus: "paid",
              paymentMethod,
            }
          : a
      )
    );

    try {
      await gigApi.confirmAppointmentPayment({
        appointmentId: paymentAppt.id,
        paymentMethod,
        receiptNotes,
      });

      toast.success(`Payment Confirmed! Paid via ${paymentMethod.toUpperCase()}`, {
        description: `Receipt confirmed for ₹${paymentAppt.finalAmount || paymentAppt.estimatedBudget || 350}.`,
      });
      setPaymentAppt(null);
      await loadAppointments(false);
    } catch {
      toast.error("Failed to confirm payment");
      await loadAppointments(false);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // 9. Submit Rating & Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAppt) return;
    setIsSubmittingReview(true);

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === reviewAppt.id
          ? { ...a, isReviewed: true }
          : a
      )
    );

    try {
      await gigApi.submitAppointmentReview(reviewAppt.id, {
        rating: reviewRating,
        comment: reviewComment,
        tags: reviewTags,
      });

      // Award +25 points
      const updatedWallet = await gigApi.awardPoints(
        25,
        "Customer Review Bonus",
        `Reviewed service on booking #${reviewAppt.id}`
      );
      setPointsWallet(updatedWallet);

      toast.success("Review Submitted! +25 Loyalty Points credited! ⭐", {
        description: "Thank you for supporting verified neighborhood technicians.",
      });
      setReviewAppt(null);
      await loadAppointments(false);
    } catch {
      toast.error("Failed to submit review");
      await loadAppointments(false);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // 10. Book New Appointment
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookingSubmitting(true);
    toast.info("Sending appointment booking request...");
    try {
      const newAppt = await gigApi.bookAppointment({
        providerId: bookForm.providerId,
        serviceTitle: bookForm.serviceTitle,
        category: bookForm.category,
        description: bookForm.description,
        address: bookForm.address,
        city: bookForm.city,
        area: bookForm.area,
        scheduledDate: bookForm.scheduledDate,
        scheduledTimeSlot: bookForm.scheduledTimeSlot,
        estimatedBudget: Number(bookForm.estimatedBudget) || 350,
        providerName: bookForm.providerName,
        providerSpecialization: bookForm.providerSpecialization,
        clientName: user?.username || "You",
      });

      toast.success("Appointment Booked! Provider has been notified.", {
        description: `${bookForm.serviceTitle} on ${bookForm.scheduledDate} (${bookForm.scheduledTimeSlot})`,
      });
      setIsBookModalOpen(false);
      setAppointments((prev) => [newAppt, ...prev]);
      await loadAppointments(false);
    } catch (err) {
      toast.error("Failed to book appointment");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleOpenChat = (appt: GigAppointment) => {
    if (!user) {
      toast.error("Please log in to chat.");
      return;
    }

    const otherUserId = role === "client" ? appt.providerUserId : appt.clientId;
    const otherUserName =
      (role === "client" ? appt.providerName : appt.clientName) ||
      (role === "client" ? "Service Provider" : "Client");
    const specialization =
      appt.providerSpecialization || appt.category || appt.serviceTitle;
    const providerId = appt.providerId;

    if (!otherUserId) {
      toast.error("Participant details not found for this appointment.");
      return;
    }

    if (user.id === otherUserId) {
      toast.error("You cannot start a chat with yourself.");
      return;
    }

    const query = new URLSearchParams({
      otherUserId: String(otherUserId),
      otherUserName,
      appointmentId: String(appt.id),
      ...(providerId ? { providerId: String(providerId) } : {}),
      ...(specialization ? { specialization } : {}),
    });

    router.push(`/workspace/${workspaceSlug}/chat?${query.toString()}`);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Appointments Engine (Real-Time Sync)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Service Appointments Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Track schedules, counter-offers, technician en-route arrivals, work completion, digital billing, reviews, and loyalty rewards.
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

          {/* Role Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setRole("client")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                role === "client" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              My Bookings (Client)
            </button>
            <button
              onClick={() => setRole("provider")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                role === "provider" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Incoming Work (Provider)
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsRefreshing(true);
              loadAppointments(true);
              loadPointsWallet();
            }}
            disabled={isRefreshing}
            className="h-9 px-3 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsBookModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Book Visit</span>
          </Button>
        </div>
      </div>

      {/* ── Status Tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "all", label: "All Appointments" },
          { id: "pending", label: "Pending Confirmation" },
          { id: "confirmed", label: "Confirmed / Scheduled" },
          { id: "en_route", label: "En Route" },
          { id: "in_progress", label: "In Progress" },
          { id: "completed", label: "Completed" },
          { id: "declined", label: "Declined / Cancelled" },
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
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

      {/* ── Appointments List ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-medium">Synchronizing appointment ledger...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Appointments Recorded</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {role === "client"
              ? "You haven't scheduled any home service visits under this filter yet."
              : "No incoming client bookings matching this status right now."}
          </p>
          {role === "client" && (
            <Button
              size="sm"
              onClick={() => setIsBookModalOpen(true)}
              className="mt-4 h-8.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Book Service Visit Now
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const isPending = appt.status === "pending";
            const isConfirmed = appt.status === "confirmed" || appt.status === "accepted";
            const isRescheduled = appt.status === "rescheduled_by_provider";
            const isEnRoute = appt.status === "en_route";
            const isInProgress = appt.status === "in_progress";
            const isCompleted = appt.status === "completed";
            const isCancelled = appt.status === "cancelled" || appt.status === "declined";
            const isPaid = appt.paymentStatus === "paid";
            const isUnpaid = appt.paymentStatus === "unpaid" || !appt.paymentStatus;

            return (
              <div
                key={appt.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700">
                      {appt.category}
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isPending
                          ? "bg-amber-50 border-amber-200 text-amber-800"
                          : isConfirmed
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : isRescheduled
                          ? "bg-purple-50 border-purple-200 text-purple-800"
                          : isEnRoute
                          ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                          : isInProgress
                          ? "bg-sky-50 border-sky-200 text-sky-800"
                          : isCompleted
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}
                    >
                      {appt.status.toUpperCase().replace(/_/g, " ")}
                    </span>

                    {/* Payment Status Pill */}
                    {isCompleted && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPaid
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}
                      >
                        {isPaid ? `PAID (${appt.paymentMethod?.toUpperCase() || "DIGITAL"})` : "PAYMENT PENDING"}
                      </span>
                    )}

                    <span className="text-slate-400 text-xs">· Booking #{appt.id}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{appt.serviceTitle}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{appt.scheduledDate} ({appt.scheduledTimeSlot})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{appt.address}, {appt.area}, {appt.city}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        {role === "client" ? (
                          <>Provider: <strong>{appt.providerName}</strong> ({appt.providerSpecialization})</>
                        ) : (
                          <>Client: <strong>{appt.clientName}</strong></>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        {appt.finalAmount ? `Final Bill: ₹${appt.finalAmount}` : `Est. Diagnostic: ₹${appt.estimatedBudget || 350}`}
                      </span>
                    </div>
                  </div>

                  {appt.description && (
                    <p className="text-xs text-slate-500 pt-1 line-clamp-2 leading-relaxed">
                      {appt.description}
                    </p>
                  )}

                  {/* Reschedule Propose Notification */}
                  {isRescheduled && (
                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="h-3.5 w-3.5 text-purple-600" />
                        <span>Proposed Alternate Slot: {appt.proposedNewDate} at {appt.proposedNewTimeSlot}</span>
                      </div>
                      {appt.rescheduleReason && <p className="italic text-[11px] text-purple-700">&ldquo;{appt.rescheduleReason}&rdquo;</p>}
                    </div>
                  )}

                  {/* Completion Notes */}
                  {isCompleted && appt.completionNotes && (
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Work Summary:</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">{appt.completionNotes}</p>
                    </div>
                  )}

                  {/* Decline / Cancellation Reason */}
                  {isCancelled && (appt.cancellationReason || appt.declineReason) && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                      <span className="font-bold">Cancellation / Decline Reason:</span>
                      <p className="italic text-[11px] text-rose-700">
                        &ldquo;{appt.cancellationReason || appt.declineReason}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Actions Bar ──────────────────────────────────────────────── */}
                <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {/* Provider Actions */}
                  {role === "provider" && (
                    <>
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(appt.id)}
                            className="h-8.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Accept</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRescheduleAppt(appt);
                              setRescheduleDate(appt.scheduledDate);
                              setRescheduleTimeSlot(appt.scheduledTimeSlot);
                            }}
                            className="h-8.5 px-3 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                          >
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeclineAppt(appt)}
                            className="h-8.5 px-2.5 rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                      {isConfirmed && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(appt.id, "en_route")}
                            className="h-8.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-2xs"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            <span>On the Way</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(appt.id, "in_progress")}
                            className="h-8.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold gap-1 shadow-2xs"
                          >
                            <span>Start Work</span>
                          </Button>
                        </div>
                      )}

                      {isEnRoute && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(appt.id, "in_progress")}
                          className="h-8.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Arrived & Start Work</span>
                        </Button>
                      )}

                      {isInProgress && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setCompleteAppt(appt);
                            setFinalAmount(String(appt.estimatedBudget || 350));
                          }}
                          className="h-8.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Finalize & Bill Work</span>
                        </Button>
                      )}

                      {isCompleted && isUnpaid && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setPaymentAppt(appt);
                            setPaymentMethod("cash");
                          }}
                          className="h-8.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 shadow-2xs"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>Confirm Cash Received</span>
                        </Button>
                      )}
                    </>
                  )}

                  {/* Client Actions */}
                  {role === "client" && (
                    <>
                      {isRescheduled && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRescheduled(appt.id)}
                            className="h-8.5 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Accept New Schedule</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelAppt(appt)}
                            className="h-8.5 px-2.5 rounded-xl border-slate-200 text-rose-600 text-xs font-semibold"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      {(isPending || isConfirmed) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancelAppt(appt)}
                          className="h-8.5 px-3 rounded-xl border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-colors"
                        >
                          Cancel Booking
                        </Button>
                      )}

                      {isCompleted && isUnpaid && (
                        <Button
                          size="sm"
                          onClick={() => setPaymentAppt(appt)}
                          className="h-8.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-2xs"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Pay Bill (₹{appt.finalAmount || appt.estimatedBudget || 350})</span>
                        </Button>
                      )}

                      {isCompleted && !appt.isReviewed && (
                        <Button
                          size="sm"
                          onClick={() => setReviewAppt(appt)}
                          className="h-8.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold gap-1 shadow-2xs"
                        >
                          <Star className="h-3.5 w-3.5 fill-slate-950" />
                          <span>Rate & Review (+25 Pts)</span>
                        </Button>
                      )}

                      {isCompleted && appt.isReviewed && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          <span>Reviewed</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Universal Direct Chat Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenChat(appt)}
                    className="h-8.5 px-3 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold gap-1.5 shadow-2xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Direct Chat</span>
                  </Button>
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
                  pointsWallet.recentTransactions.map((tx, idx) => (
                    <div
                      key={`tx-${tx.id || idx}-${idx}`}
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
                <span>Complete service appointment</span>
                <span className="font-bold text-emerald-600">+60 Pts</span>
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

      {/* ── Book New Appointment Dialog ───────────────────────────────────── */}
      <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Book On-Demand Service Visit</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Choose your service category, preferred date and inspection slot
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBooking} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Category *</label>
              <select
                value={bookForm.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  setBookForm({
                    ...bookForm,
                    category: cat,
                    serviceTitle: `${cat} Diagnostic & Inspection Visit`,
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {QUICK_SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue / Service Title *</label>
              <input
                type="text"
                required
                value={bookForm.serviceTitle}
                onChange={(e) => setBookForm({ ...bookForm, serviceTitle: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={bookForm.scheduledDate}
                  onChange={(e) => setBookForm({ ...bookForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot *</label>
                <select
                  value={bookForm.scheduledTimeSlot}
                  onChange={(e) => setBookForm({ ...bookForm, scheduledTimeSlot: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Locality *</label>
                <input
                  type="text"
                  required
                  value={bookForm.area}
                  onChange={(e) => setBookForm({ ...bookForm, area: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Diagnostic Budget (₹)</label>
                <input
                  type="number"
                  required
                  value={bookForm.estimatedBudget}
                  onChange={(e) => setBookForm({ ...bookForm, estimatedBudget: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Landmark *</label>
              <input
                type="text"
                required
                value={bookForm.address}
                onChange={(e) => setBookForm({ ...bookForm, address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description of Issue</label>
              <textarea
                rows={2}
                placeholder="Mention specific faults, appliances involved, or special access instructions..."
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isBookingSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {isBookingSubmitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Confirm Booking Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Reschedule Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!rescheduleAppt} onOpenChange={(open) => !open && setRescheduleAppt(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Propose New Schedule</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pick an alternate date & slot for booking #{rescheduleAppt?.id}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReschedule} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Date *</label>
              <input
                type="date"
                required
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Time Slot *</label>
              <select
                value={rescheduleTimeSlot}
                onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Reschedule *</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Current site job ran longer, parts delay..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setRescheduleAppt(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingReschedule} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {isSubmittingReschedule && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Send Reschedule Proposal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Decline Dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!declineAppt} onOpenChange={(open) => !open && setDeclineAppt(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Decline Appointment</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide a brief explanation for declining booking #{declineAppt?.id}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitDecline} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Out of service area today, fully committed on emergency commercial contract..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeclineAppt(null)}>
                Keep Appointment
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingDecline} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                {isSubmittingDecline && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Decline Appointment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!cancelAppt} onOpenChange={(open) => !open && setCancelAppt(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Cancel Appointment</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Please let the provider know why this visit is being cancelled
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCancel} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Issue resolved on own, need to reschedule for next week..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCancelAppt(null)}>
                Keep Appointment
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingCancel} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                {isSubmittingCancel && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Complete & Bill Dialog ────────────────────────────────────────── */}
      <Dialog open={!!completeAppt} onOpenChange={(open) => !open && setCompleteAppt(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Complete & Bill Work</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Finalize work order #{completeAppt?.id} ({completeAppt?.serviceTitle})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitComplete} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Final Amount (₹) *</label>
              <input
                type="number"
                required
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Completion Notes / Work Done</label>
              <textarea
                rows={3}
                placeholder="e.g. Replaced 32A MCB switch, checked circuit continuity, and tested under load."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
              />
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0 fill-amber-500" />
              <span>Completing this job will award you <strong>+60 Loyalty Points</strong>!</span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCompleteAppt(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingComplete} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {isSubmittingComplete && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Confirm Completion (+60 Pts)
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Payment Settlement Dialog ─────────────────────────────────────── */}
      <Dialog open={!!paymentAppt} onOpenChange={(open) => !open && setPaymentAppt(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Settle Service Payment</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Confirm payment for booking #{paymentAppt?.id} · Total: ₹{paymentAppt?.finalAmount || paymentAppt?.estimatedBudget || 350}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Payment Method *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "upi", label: "UPI / QR", icon: Coins },
                  { id: "cash", label: "Cash on Site", icon: DollarSign },
                  { id: "card", label: "Card / Net", icon: CreditCard },
                ].map((m) => {
                  const IconComponent = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className="text-xs">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Notes / Reference ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. GPay UPI Ref #82739192 or Paid in cash"
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPaymentAppt(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingPayment} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {isSubmittingPayment && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Review Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!reviewAppt} onOpenChange={(open) => !open && setReviewAppt(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Review Service Experience</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Share your feedback for {reviewAppt?.providerName} ({reviewAppt?.serviceTitle})
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Highlights / Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {["Punctual", "Expert Diagnosis", "Clean Work", "Polite & Courteous", "Fair Pricing"].map((tag) => {
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Feedback *</label>
              <textarea
                required
                rows={3}
                placeholder="How was the craftsmanship, arrival punctuality, and overall communication?"
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
              <Button type="button" variant="outline" size="sm" onClick={() => setReviewAppt(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingReview} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                {isSubmittingReview && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Submit Review (+25 Pts)
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
