export interface GigReview {
  id: number;
  jobId?: number;
  appointmentId?: number;
  rating: number;
  comment: string;
  tags?: string[];
  reviewerName?: string;
  reviewerAvatar?: string;
  createdAt?: string;
}

export interface GigProvider {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  specialization: string;
  bio?: string | null;
  city: string;
  area: string;
  rating: number;
  reviewCount: number;
  status: string;
  reviews?: GigReview[];
  latitude?: number | null;
  longitude?: number | null;
  workingRadius?: number | null;
  hourlyRate?: string | number | null;

  // Instant Availability fields
  isAvailableNow: boolean;
  availabilityStatus: "available" | "busy" | "offline" | string;
  availabilityNote?: string | null;

  // Verification details
  selfieUrl?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  idFrontUrl?: string | null;
  idBackUrl?: string | null;
  isIdentityVerified: boolean;
  isSelfieVerified: boolean;
  isLocationVerified: boolean;
  hasRealAvatar: boolean;

  // Point System & Loyalty Tier
  rewardPoints: number;
  tierLevel: string; // 'Bronze', 'Silver', 'Gold', 'Platinum'
  completedWorksCount: number;

  // Appointment & Bot Metadata
  operatingHours?: string | null;
  completedAppointmentsCount?: number | null;
  responseTimeMinutes?: number | null;
  canBookInstantly: boolean;
  botId?: number | null;
  botName?: string | null;
  phone?: string | null;
  fullName?: string;
  avatarText?: string;
  isApproved?: boolean;
}

export interface GigTimelineStep {
  step: "POSTED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "REVIEWED" | string;
  title: string;
  timestamp: string;
  actor: string;
  details?: string | null;
}

export interface GigProposal {
  id: number;
  jobId: number;
  providerId: number;
  proposedPrice: number;
  estimatedDuration: string;
  message: string;
  status: "pending" | "accepted" | "rejected" | string;
  createdAt?: string;
  providerName?: string | null;
  providerAvatar?: string | null;
  providerSpecialization?: string | null;
  providerRating?: number | null;
  providerPhone?: string | null;
}

export interface GigJob {
  id: number;
  clientId?: number | null;
  assignedProviderId?: number | null;
  assignedProposalId?: number | null;
  title: string;
  description: string;
  category: string;
  budget?: number | null;
  city: string;
  area: string;
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled" | "closed" | string;
  paymentStatus: "unpaid" | "pending_confirmation" | "paid" | string;
  startedAt?: string | null;
  completedAt?: string | null;
  proofImages?: string[];
  proposalsCount?: number | null;
  createdAt?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  clientAvatarUrl?: string | null;
  assignedProviderName?: string | null;
  assignedProviderAvatar?: string | null;
  assignedProviderPhone?: string | null;
  assignedProviderSpecialization?: string | null;
  assignedProviderRating?: number | null;
  isReviewed?: boolean;
  timeline?: GigTimelineStep[];
}

export interface GigAppointment {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone?: string | null;
  clientAvatarUrl?: string | null;
  providerId: number;
  providerUserId: number;
  providerName: string;
  providerSpecialization: string;
  providerAvatarUrl?: string | null;
  providerPhone?: string | null;
  serviceTitle: string;
  category: string;
  description: string;
  address: string;
  city: string;
  area: string;
  latitude?: number | null;
  longitude?: number | null;
  scheduledDate: string;
  scheduledTimeSlot: string;
  timingMode: "client_proposed" | "instant" | string;
  status:
    | "pending"
    | "confirmed"
    | "accepted"
    | "rescheduled_by_provider"
    | "en_route"
    | "in_progress"
    | "completed"
    | "declined"
    | "cancelled"
    | string;
  proposedNewDate?: string | null;
  proposedNewTimeSlot?: string | null;
  rescheduleReason?: string | null;
  estimatedBudget?: number | null;
  finalAmount?: number | null;
  paymentStatus: "unpaid" | "pending_confirmation" | "paid" | string;
  paymentMethod?: string | null;
  proofImages?: string[];
  completionNotes?: string | null;
  cancelledByUserId?: number | null;
  cancellationReason?: string | null;
  declineReason?: string | null;
  chatRoomId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  pointsAwarded?: number | null;
  isPointsCredited?: boolean;
  isReviewed?: boolean;
}

export interface GigBotConfig {
  botId?: number;
  providerId: number;
  userId?: number;
  providerName?: string;
  specialization?: string;
  botName: string;
  boatName?: string;
  welcomeMessage?: string;
  isActive: boolean;
  isReady?: boolean;
  shareSlug?: string;
  avatarUrl?: string;
  createdAt?: string;
  answers?: Record<number, string[]> | any;
  customSpecifications?: Record<number, string>;
}

export interface GigBotReply {
  text: string;
  suggestions: string[];
  action?: "book_appointment" | "view_rates" | "emergency_visit" | string | null;
}

export interface GigPointTransaction {
  id: number;
  points: number;
  transactionType: "credit" | "debit" | string;
  title: string;
  description: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
  balanceAfter?: number | null;
}

export interface GigPointsWallet {
  totalPoints: number;
  currentTier: string;
  nextTier: string;
  pointsToNextTier: number;
  lifetimeEarned: number;
  completedWorksCount: number;
  recentTransactions: GigPointTransaction[];
}
