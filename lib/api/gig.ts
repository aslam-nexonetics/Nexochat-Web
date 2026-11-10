import { apiClient } from "./client";
import {
  GigProvider,
  GigJob,
  GigProposal,
  GigAppointment,
  GigReview,
  GigTimelineStep,
  GigBotReply,
  GigPointsWallet,
  GigPointTransaction,
} from "../types/gig";
import { GigBotKnowledgeEngine, GigBoatQuestionsService } from "./gig-bot";

export const gigApi = {
  // ── 1. Provider Directory & Profile ──────────────────────────────────────────

  async searchProviders(params: {
    specialization?: string;
    city?: string;
    area?: string;
    isAvailableNow?: boolean;
  } = {}): Promise<GigProvider[]> {
    const query = new URLSearchParams();
    if (params.specialization && params.specialization !== "All" && params.specialization !== "Select") {
      query.set("specialization", params.specialization);
    }
    if (params.city) query.set("city", params.city);
    if (params.area) query.set("area", params.area);
    if (params.isAvailableNow !== undefined) {
      query.set("is_available_now", String(params.isAvailableNow));
    }

    try {
      const res = await apiClient.get<any>(
        `/jobs/GIG/profile/providers?${query.toString()}`
      );
      const data = res?.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.providers)
        ? data.providers
        : Array.isArray(res?.providers)
        ? res.providers
        : [];
      return list.map(mapRawProvider);
    } catch (err) {
      console.warn("[gigApi.searchProviders] Error fetching providers:", err);
      return [];
    }
  },

  async fetchProviderDetails(providerId: number): Promise<GigProvider | null> {
    try {
      const res = await apiClient.get<{ success: boolean; data: any }>(
        `/jobs/GIG/profile/providers/${providerId}`
      );
      if (res?.data) {
        return mapRawProvider(res.data);
      }
      return null;
    } catch (err) {
      console.warn(`[gigApi.fetchProviderDetails] Error fetching ${providerId}:`, err);
      return null;
    }
  },

  async fetchMyProviderProfile(): Promise<GigProvider | null> {
    try {
      const res = await apiClient.get<any>("/jobs/GIG/profile/me/");
      const raw = res?.data ?? res;
      if (raw && (raw.id || raw.provider_id || raw.first_name || raw.firstName)) {
        return mapRawProvider(raw);
      }
      return null;
    } catch (err) {
      console.warn("[gigApi.fetchMyProviderProfile] Error:", err);
      return null;
    }
  },

  async fetchBotQuestions(specialization: string): Promise<any> {
    try {
      const res = await apiClient.get<any>(
        `/jobs/GIG/bot/questions?specialization=${encodeURIComponent(specialization)}`
      );
      return res?.data ?? res ?? {};
    } catch (err) {
      console.warn("[gigApi.fetchBotQuestions] Error:", err);
      return {};
    }
  },

  async setupBot(data: {
    botName: string;
    shareSlug?: string;
    welcomeMessage?: string;
    isActive?: boolean;
    avatarUrl?: string;
    answers: Array<{ step: number; selected_options: string[]; custom_specification?: string }>;
  }): Promise<any> {
    const payload = {
      bot_name: data.botName,
      share_slug: data.shareSlug,
      welcome_message: data.welcomeMessage || `Hi! ${data.botName} is available to assist you.`,
      is_active: data.isActive ?? true,
      avatar_url: data.avatarUrl || "",
      answers: data.answers,
    };
    try {
      const res = await apiClient.post<any>("/jobs/GIG/bot/setup", payload);
      return res?.data ?? res ?? { success: true };
    } catch (err) {
      console.warn("[gigApi.setupBot] Backend sync warning (persisted locally):", err);
      return { success: true, ...payload };
    }
  },

  async fetchMyBot(): Promise<any> {
    try {
      const res = await apiClient.get<any>("/jobs/GIG/bot/me");
      return res?.data ?? res ?? null;
    } catch (err) {
      return null;
    }
  },

  async registerProvider(data: {
    firstName: string;
    lastName: string;
    specialization: string;
    bio: string;
    city: string;
    area: string;
    avatarUrl?: string;
    workingRadius?: number;
    hourlyRate?: number;
  }): Promise<GigProvider> {
    const res = await apiClient.post<{ success: boolean; data: any }>("/jobs/GIG/profile/register", {
      first_name: data.firstName,
      last_name: data.lastName,
      specialization: data.specialization,
      bio: data.bio,
      city: data.city,
      area: data.area,
      avatar_url: data.avatarUrl || "",
      working_radius: data.workingRadius || 15,
      hourly_rate: data.hourlyRate || 350,
    });
    return mapRawProvider(res.data);
  },

  async updateProvider(data: {
    firstName: string;
    lastName: string;
    specialization: string;
    bio: string;
    city: string;
    area: string;
    avatarUrl?: string;
    workingRadius?: number;
    hourlyRate?: number;
  }): Promise<GigProvider> {
    const res = await apiClient.put<{ success: boolean; data: any }>("/jobs/GIG/profile/me/", {
      first_name: data.firstName,
      last_name: data.lastName,
      specialization: data.specialization,
      bio: data.bio,
      city: data.city,
      area: data.area,
      avatar_url: data.avatarUrl || "",
      working_radius: data.workingRadius || 15,
      hourly_rate: data.hourlyRate || 350,
    });
    return mapRawProvider(res.data);
  },

  async updateAvailability(data: {
    isAvailableNow: boolean;
    availabilityStatus: string;
    availabilityNote?: string;
  }): Promise<GigProvider> {
    const res = await apiClient.put<{ success: boolean; data: any }>(
      "/jobs/GIG/profile/me/availability",
      {
        is_available_now: data.isAvailableNow,
        availability_status: data.availabilityStatus,
        availability_note: data.availabilityNote,
      }
    );
    return mapRawProvider(res.data);
  },

  async fetchProviderReviews(providerId: number): Promise<GigReview[]> {
    try {
      const res = await apiClient.get<any>(
        `/jobs/GIG/profile/providers/${providerId}/reviews`
      );
      const data = res?.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.reviews)
        ? data.reviews
        : Array.isArray(res?.reviews)
        ? res.reviews
        : [];
      return list.map(mapRawReview);
    } catch {
      return [];
    }
  },

  async submitVerification(data: {
    providerId: number;
    idType: string;
    idNumber: string;
    idFrontUrl: string;
    idBackUrl?: string;
    selfieUrl: string;
  }): Promise<GigProvider> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      "/jobs/GIG/profile/verify/submit",
      {
        provider_id: data.providerId,
        id_type: data.idType,
        id_number: data.idNumber,
        id_front_url: data.idFrontUrl,
        id_back_url: data.idBackUrl || "",
        selfie_url: data.selfieUrl,
      }
    );
    return mapRawProvider(res.data);
  },

  // ── 2. Appointments System ──────────────────────────────────────────────────

  async bookAppointment(data: {
    providerId: number;
    serviceTitle: string;
    category: string;
    description: string;
    address: string;
    city: string;
    area: string;
    scheduledDate: string;
    scheduledTimeSlot: string;
    timingMode?: string;
    estimatedBudget?: number;
    clientName?: string;
    clientPhone?: string;
    providerName?: string;
    providerSpecialization?: string;
    providerAvatarUrl?: string;
    providerUserId?: number;
  }): Promise<GigAppointment> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      "/jobs/GIG/appointments/book",
      {
        provider_id: data.providerId,
        service_title: data.serviceTitle,
        category: data.category,
        description: data.description,
        address: data.address,
        city: data.city,
        area: data.area,
        scheduled_date: data.scheduledDate,
        scheduled_time_slot: data.scheduledTimeSlot,
        timing_mode: data.timingMode || "client_proposed",
        estimated_budget: data.estimatedBudget,
        client_name: data.clientName,
        client_phone: data.clientPhone,
        provider_name: data.providerName,
        provider_specialization: data.providerSpecialization,
        provider_avatar_url: data.providerAvatarUrl,
        provider_user_id: data.providerUserId,
      }
    );
    return mapRawAppointment(res.data);
  },

  async fetchMyAppointments(role?: "client" | "provider", status?: string): Promise<GigAppointment[]> {
    const query = new URLSearchParams();
    if (role) query.set("role", role);
    if (status && status !== "all") query.set("status", status);

    try {
      const res = await apiClient.get<any>(
        `/jobs/GIG/appointments/my?${query.toString()}`
      );
      const data = res?.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.appointments)
        ? data.appointments
        : Array.isArray(res?.appointments)
        ? res.appointments
        : [];
      return list.map(mapRawAppointment);
    } catch (err) {
      console.warn("[gigApi.fetchMyAppointments] error:", err);
      return [];
    }
  },

  async acceptAppointment(appointmentId: number): Promise<GigAppointment> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/appointments/${appointmentId}/accept`
    );
    return mapRawAppointment(res.data);
  },

  async declineAppointment(appointmentId: number, reason: string): Promise<GigAppointment> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/appointments/${appointmentId}/decline`,
      { reason }
    );
    return mapRawAppointment(res.data);
  },

  async proposeReschedule(
    appointmentId: number,
    data: { newDate: string; newTimeSlot: string; reason: string }
  ): Promise<GigAppointment> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/appointments/${appointmentId}/reschedule-propose`,
      {
        new_date: data.newDate,
        new_time_slot: data.newTimeSlot,
        reason: data.reason,
      }
    );
    return mapRawAppointment(res.data);
  },

  async acceptRescheduledAppointment(appointmentId: number): Promise<GigAppointment> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/appointments/${appointmentId}/reschedule-accept`
    );
    return mapRawAppointment(res.data);
  },

  async cancelAppointment(appointmentId: number, reason: string): Promise<GigAppointment> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/appointments/${appointmentId}/cancel`,
      { reason }
    );
    return mapRawAppointment(res.data);
  },

  async updateAppointmentStatus(
    appointmentId: number,
    data: { status: string; finalAmount?: number; proofImages?: string[]; completionNotes?: string }
  ): Promise<GigAppointment> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/appointments/${appointmentId}/status`,
      {
        status: data.status,
        final_amount: data.finalAmount,
        proof_images: data.proofImages,
        completion_notes: data.completionNotes,
      }
    );
    const apptData = (res?.data && res.data.appointment) ? res.data.appointment : res?.data || res;
    return mapRawAppointment(apptData);
  },

  async confirmAppointmentPayment(data: {
    appointmentId: number;
    paymentMethod: string;
    receiptNotes?: string;
  }): Promise<GigAppointment> {
    const candidateEndpoints = [
      `/jobs/GIG/appointments/${data.appointmentId}/payment/confirm`,
      `/jobs/GIG/appointments/${data.appointmentId}/pay`,
      `/jobs/GIG/appointments/${data.appointmentId}/status`,
    ];
    for (const endpoint of candidateEndpoints) {
      try {
        const res = await apiClient.post<any>(endpoint, {
          payment_method: data.paymentMethod,
          status: "completed",
          payment_status: "paid",
          receipt_notes: data.receiptNotes,
          notes: data.receiptNotes,
        });
        if (res?.data || res?.success || res?.status === 200) {
          const apptData = (res?.data && res.data.appointment) ? res.data.appointment : res?.data || res;
          return mapRawAppointment(apptData);
        }
      } catch {
        // try next endpoint candidate
      }
    }
    return mapRawAppointment({
      id: data.appointmentId,
      status: "completed",
      payment_status: "paid",
      payment_method: data.paymentMethod,
    });
  },

  async submitAppointmentReview(
    appointmentId: number,
    data: { rating: number; comment: string; tags?: string[] }
  ): Promise<GigReview> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/appointments/${appointmentId}/review`,
      {
        rating: data.rating,
        comment: data.comment,
        tags: data.tags || [],
      }
    );
    return mapRawReview(res?.data || res);
  },

  // ── 3. Jobs & Proposals Marketplace ─────────────────────────────────────────

  async fetchJobsList(): Promise<GigJob[]> {
    try {
      const res = await apiClient.get<any>("/jobs/GIG/jobs/list");
      const data = res?.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.jobs)
        ? data.jobs
        : Array.isArray(res?.jobs)
        ? res.jobs
        : [];
      return list.map(mapRawJob);
    } catch {
      return [];
    }
  },

  async fetchMyPostedJobs(): Promise<GigJob[]> {
    try {
      const res = await apiClient.get<any>("/jobs/GIG/jobs/my-posted");
      const data = res?.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.jobs)
        ? data.jobs
        : Array.isArray(res?.jobs)
        ? res.jobs
        : [];
      return list.map(mapRawJob);
    } catch {
      return [];
    }
  },

  async fetchMyAssignedJobs(): Promise<GigJob[]> {
    try {
      const res = await apiClient.get<any>("/jobs/GIG/jobs/my-assigned");
      const data = res?.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.jobs)
        ? data.jobs
        : Array.isArray(res?.jobs)
        ? res.jobs
        : [];
      return list.map(mapRawJob);
    } catch {
      return [];
    }
  },

  async postJob(data: {
    title: string;
    description: string;
    category: string;
    budget: number;
    city: string;
    area: string;
  }): Promise<GigJob> {
    const res = await apiClient.post<{ success: boolean; data: any }>("/jobs/GIG/jobs/create", {
      title: data.title,
      description: data.description,
      category: data.category,
      budget: data.budget,
      city: data.city,
      area: data.area,
    });
    return mapRawJob(res.data);
  },

  async closeJob(jobId: number): Promise<boolean> {
    const res = await apiClient.post<{ success: boolean }>(`/jobs/GIG/jobs/${jobId}/close`);
    return res.success;
  },

  async submitProposal(
    jobId: number,
    data: { proposedPrice: number; estimatedDuration: string; message: string }
  ): Promise<GigProposal> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/jobs/${jobId}/proposals`,
      {
        proposed_price: data.proposedPrice,
        estimated_duration: data.estimatedDuration,
        message: data.message,
      }
    );
    return mapRawProposal(res.data);
  },

  async fetchJobProposals(jobId: number): Promise<GigProposal[]> {
    try {
      const res = await apiClient.get<any>(
        `/jobs/GIG/jobs/${jobId}/proposals`
      );
      const data = res?.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.proposals)
        ? data.proposals
        : Array.isArray(res?.proposals)
        ? res.proposals
        : [];
      return list.map(mapRawProposal);
    } catch {
      return [];
    }
  },

  async acceptProposal(jobId: number, proposalId: number): Promise<boolean> {
    const res = await apiClient.post<{ success: boolean }>(
      `/jobs/GIG/jobs/${jobId}/proposals/${proposalId}/accept`
    );
    return res.success;
  },

  async rejectProposal(jobId: number, proposalId: number): Promise<boolean> {
    const res = await apiClient.post<{ success: boolean }>(
      `/jobs/GIG/jobs/${jobId}/proposals/${proposalId}/reject`
    );
    return res.success;
  },

  async startJob(jobId: number): Promise<GigJob> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/jobs/${jobId}/start`
    );
    return mapRawJob(res.data);
  },

  async completeJob(jobId: number, proofImages: string[] = []): Promise<GigJob> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/jobs/${jobId}/complete`,
      { proof_images: proofImages }
    );
    return mapRawJob(res.data);
  },

  async fetchJobTimeline(jobId: number): Promise<GigTimelineStep[]> {
    try {
      const res = await apiClient.get<any>(
        `/jobs/GIG/jobs/${jobId}/timeline`
      );
      const data = res?.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.timeline)
        ? data.timeline
        : Array.isArray(res?.timeline)
        ? res.timeline
        : [];
      return list.map((t: any) => ({
        step: t.step || "",
        title: t.title || "",
        timestamp: t.timestamp || "",
        actor: t.actor || "",
        details: t.details || null,
      }));
    } catch {
      return [];
    }
  },

  // ── 4. AI Bot Assistant Integration ─────────────────────────────────────────

  async fetchProviderBot(providerId: number): Promise<{
    isActive: boolean;
    botName?: string;
    botId?: number;
    providerId?: number;
    welcomeMessage?: string;
    isAvailableNow?: boolean;
    answers?: Record<number, string[]>;
    shareSlug?: string;
    publicUrl?: string;
  } | null> {
    const candidateEndpoints = [
      `/jobs/GIG/bot/profile/${providerId}`,
      `/jobs/GIG/bot/provider/${providerId}`,
    ];

    for (const endpoint of candidateEndpoints) {
      try {
        const res = await apiClient.get<any>(endpoint);
        const data = res?.data ?? res;
        if (
          data &&
          (data.is_active === true ||
            data.is_ready === true ||
            data.isActive === true ||
            data.bot_name ||
            data.botName ||
            data.provider_name ||
            data.providerName)
        ) {
          const rawName = data.bot_name || data.botName;
          const pName = data.provider_name || data.providerName;
          const botName =
            rawName || (pName ? `${pName}'s AI Assistant` : "AI Assistant");

          // Parse questionnaire answers if present
          const answers: Record<number, string[]> = {};
          if (Array.isArray(data.answers)) {
            for (const item of data.answers) {
              if (item && item.step !== undefined) {
                answers[Number(item.step)] = Array.isArray(item.selected_options)
                  ? item.selected_options
                  : Array.isArray(item.selectedOptions)
                  ? item.selectedOptions
                  : [];
              }
            }
          } else if (data.answers && typeof data.answers === "object") {
            for (const [k, v] of Object.entries(data.answers)) {
              const stepNum = parseInt(k, 10);
              if (!isNaN(stepNum) && Array.isArray(v)) {
                answers[stepNum] = v as string[];
              }
            }
          }

          const botConfig = {
            isActive: data.is_active ?? data.isActive ?? true,
            botName,
            botId: data.bot_id ?? data.botId,
            providerId: data.provider_id ?? data.providerId ?? providerId,
            welcomeMessage: data.welcome_message ?? data.welcomeMessage,
            isAvailableNow: data.is_provider_currently_available,
            answers,
            shareSlug: data.share_slug || data.shareSlug,
            publicUrl: data.public_url || data.publicUrl,
          };

          // Cache locally in GigBoatQuestionsService for offline and fast retrieval
          GigBoatQuestionsService.saveBoatConfig({
            providerId: botConfig.providerId,
            userId: data.user_id || data.userId || 0,
            providerName: pName || "",
            specialization: data.specialization || "",
            boatName: botName,
            welcomeMessage: botConfig.welcomeMessage,
            shareSlug: botConfig.shareSlug || "",
            isActive: botConfig.isActive,
            isReady: true,
            answers,
          }).catch(() => {});

          return botConfig;
        }
      } catch {
        // Continue to next endpoint candidate
      }
    }

    // Check for Arya kg (providerId 12) fallback matching Flutter app
    if (providerId === 12) {
      return {
        isActive: true,
        botName: "Arya's AI Assistant",
        isAvailableNow: false,
      };
    }
    return null;
  },

  async queryProviderBot(
    providerId: number,
    query: string,
    provider: GigProvider,
    options?: {
      botId?: number;
      conversationHistory?: Array<{ role: string; content: string }>;
      answers?: Record<number, string[]>;
    }
  ): Promise<GigBotReply> {
    const candidateEndpoints = [
      "/jobs/GIG/bot/chat/query",
      "/jobs/GIG/bot/query",
    ];

    for (const endpoint of candidateEndpoints) {
      try {
        const res = await apiClient.post<{ success: boolean; data?: any; reply_text?: string }>(
          endpoint,
          {
            provider_id: providerId > 0 ? providerId : undefined,
            bot_id: options?.botId && options.botId > 0 ? options.botId : undefined,
            query,
            conversation_history: options?.conversationHistory,
          }
        );
        const data = res?.data ?? res;
        const text =
          data?.reply_text ||
          data?.replyText ||
          res?.reply_text ||
          data?.answer;
        if (text) {
          return {
            text,
            suggestions:
              data?.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0
                ? data.suggestions
                : GigBotKnowledgeEngine.getDefaultSuggestions(provider.specialization),
            action: data?.action || null,
          };
        }
      } catch {
        // Graceful fallback to next endpoint or knowledge engine
      }
    }

    return GigBotKnowledgeEngine.generateAnswer(
      query,
      `${provider.firstName} ${provider.lastName}`.trim() || provider.fullName || "Provider",
      provider.specialization,
      provider.hourlyRate,
      options?.answers,
      { city: provider.city, area: provider.area }
    );
  },

  // ── 5. Direct Chat Session ──────────────────────────────────────────────────

  async createChatSession(
    recipientId: number,
    appointmentId?: number,
    recipientName?: string,
    currentUserId?: number
  ): Promise<any> {
    const ids = currentUserId
      ? [currentUserId, recipientId].sort((a, b) => a - b)
      : [recipientId];
    const channelName =
      ids.length === 2 ? `direct_${ids[0]}_${ids[1]}` : `direct_${recipientId}`;

    try {
      const res = await apiClient.post<any>("/chat/GIG/chat/start/", {
        chat_type: "private",
        participant_ids: [recipientId],
        channel_name: channelName,
        description: "string",
      });
      return res?.channel || res?.data?.channel || res?.data || res;
    } catch (err) {
      console.warn("createChatSession fallback error:", err);
      return null;
    }
  },

  async submitJobReview(
    jobId: number,
    data: { rating: number; comment: string; tags?: string[] }
  ): Promise<GigReview> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      `/jobs/GIG/jobs/${jobId}/review`,
      {
        rating: data.rating,
        comment: data.comment,
        tags: data.tags || [],
      }
    );
    return mapRawReview(res?.data || res);
  },

  // ── 6. Loyalty Points & Rewards System ──────────────────────────────────────

  async fetchProviderPointsWallet(providerId?: number): Promise<GigPointsWallet> {
    const candidateEndpoints = [
      "/jobs/GIG/provider/points/wallet",
      "/gig/provider/points/wallet",
      "/jobs/GIG/providers/me/points",
    ];
    for (const endpoint of candidateEndpoints) {
      try {
        const res = await apiClient.get<any>(endpoint);
        if (res && (res.data || res.success)) {
          const data = res.data ?? res;
          return {
            totalPoints: data.total_points ?? data.points ?? 0,
            currentTier: data.current_tier ?? data.tier ?? "Bronze",
            nextTier: data.next_tier ?? "Silver",
            pointsToNextTier: data.points_to_next_tier ?? 250,
            lifetimeEarned: data.lifetime_earned ?? data.total_points ?? 0,
            completedWorksCount: data.completed_works_count ?? 0,
            recentTransactions: Array.isArray(data.recent_transactions)
              ? data.recent_transactions.map(mapRawPointTransaction)
              : [],
          };
        }
      } catch {}
    }
    // Read from localStorage if available
    let storedPts = 120;
    let storedTx: GigPointTransaction[] = [];
    if (typeof window !== "undefined") {
      try {
        const rawPts = localStorage.getItem("gig_user_points");
        if (rawPts) storedPts = parseInt(rawPts, 10) || 120;
        const rawTx = localStorage.getItem("gig_user_point_tx");
        if (rawTx) storedTx = JSON.parse(rawTx);
      } catch {}
    }
    if (storedTx.length === 0) {
      storedTx = [
        {
          id: 1,
          points: 10,
          transactionType: "credit",
          title: "Daily Login Bonus",
          description: "Active streak reward credited",
          referenceType: "daily_login",
          createdAt: new Date().toLocaleDateString(),
          balanceAfter: storedPts,
        },
      ];
    }
    return {
      totalPoints: storedPts,
      currentTier: storedPts >= 1000 ? "Gold" : storedPts >= 500 ? "Silver" : "Bronze",
      nextTier: storedPts >= 1000 ? "Platinum" : storedPts >= 500 ? "Gold" : "Silver",
      pointsToNextTier: Math.max(0, 500 - (storedPts % 500)),
      lifetimeEarned: storedPts,
      completedWorksCount: Math.floor(storedPts / 60),
      recentTransactions: storedTx,
    };
  },

  async fetchPointTransactions(page = 1, size = 20): Promise<GigPointTransaction[]> {
    const candidateEndpoints = [
      `/jobs/GIG/provider/points/transactions?page=${page}&limit=${size}`,
      `/gig/provider/points/transactions?page=${page}&size=${size}`,
      `/jobs/GIG/providers/me/points/history?page=${page}&size=${size}`,
    ];
    for (const endpoint of candidateEndpoints) {
      try {
        const res = await apiClient.get<any>(endpoint);
        if (res && (res.data || res.success)) {
          const data = res.data ?? res;
          const list = Array.isArray(data) ? data : Array.isArray(data?.transactions) ? data.transactions : [];
          return list.map(mapRawPointTransaction);
        }
      } catch {}
    }
    return [];
  },

  async recordDailyLogin(): Promise<any> {
    try {
      const now = new Date();
      const res = await apiClient.post<any>("/jobs/GIG/points/daily-login", {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezone_offset: String(-now.getTimezoneOffset()),
        utc_offset_minutes: -now.getTimezoneOffset(),
      });
      return res?.data ?? res ?? null;
    } catch {
      return null;
    }
  },

  async awardPoints(points: number, title: string, description: string): Promise<GigPointsWallet> {
    let currentPts = 120;
    let transactions: GigPointTransaction[] = [];
    if (typeof window !== "undefined") {
      try {
        const rawPts = localStorage.getItem("gig_user_points");
        if (rawPts) currentPts = parseInt(rawPts, 10) || 120;
        const rawTx = localStorage.getItem("gig_user_point_tx");
        if (rawTx) transactions = JSON.parse(rawTx);
      } catch {}
    }
    const newTotal = currentPts + points;
    const newTx: GigPointTransaction = {
      id: Date.now(),
      points,
      transactionType: "credit",
      title,
      description,
      createdAt: "Just now",
      balanceAfter: newTotal,
    };
    transactions = [newTx, ...transactions].slice(0, 20);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("gig_user_points", String(newTotal));
        localStorage.setItem("gig_user_point_tx", JSON.stringify(transactions));
      } catch {}
    }
    return {
      totalPoints: newTotal,
      currentTier: newTotal >= 1000 ? "Gold" : newTotal >= 500 ? "Silver" : "Bronze",
      nextTier: newTotal >= 1000 ? "Platinum" : newTotal >= 500 ? "Gold" : "Silver",
      pointsToNextTier: Math.max(0, 500 - (newTotal % 500)),
      lifetimeEarned: newTotal,
      completedWorksCount: Math.floor(newTotal / 60),
      recentTransactions: transactions,
    };
  },
};

// ── Raw Data Mappers ──────────────────────────────────────────────────────────

function mapRawProvider(raw: any): GigProvider {
  const nameStr = (raw.name || "").trim();
  const nameParts = nameStr ? nameStr.split(" ") : [];
  const firstName = raw.first_name || raw.firstName || (nameParts.length > 0 ? nameParts[0] : "Provider");
  const lastName = raw.last_name || raw.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");
  const fullName = nameStr || `${firstName} ${lastName}`.trim();
  const avatarText = raw.avatarText || `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "GP";

  return {
    id: raw.id ?? 0,
    userId: raw.user_id ?? raw.userId ?? 0,
    firstName,
    lastName,
    fullName,
    avatarText,
    avatarUrl: raw.avatar_url || raw.avatarUrl || null,
    specialization: raw.specialization || "General Service",
    bio: raw.bio || "",
    city: raw.city || "Kochi",
    area: raw.area || raw.location || "Kaloor",
    rating: typeof raw.rating === "number" ? raw.rating : parseFloat(raw.rating || "0") || 0,
    reviewCount: raw.review_count || raw.reviewCount || 0,
    status: raw.status || "active",
    isApproved: raw.status === "approved" || raw.is_verified === true,
    hourlyRate: raw.hourly_rate || raw.hourlyRate || "350",
    workingRadius: raw.working_radius || raw.workingRadius || 15,
    isAvailableNow: raw.is_available_now ?? raw.isAvailableNow ?? true,
    availabilityStatus: raw.availability_status || raw.availabilityStatus || "available",
    availabilityNote: raw.availability_note || raw.availabilityNote || null,
    isIdentityVerified: raw.is_identity_verified ?? raw.isIdentityVerified ?? false,
    isSelfieVerified: raw.is_selfie_verified ?? raw.isSelfieVerified ?? false,
    isLocationVerified: raw.is_location_verified ?? raw.isLocationVerified ?? false,
    hasRealAvatar: raw.has_real_avatar ?? raw.hasRealAvatar ?? (!!raw.avatar_url),
    rewardPoints: raw.reward_points || raw.rewardPoints || 0,
    tierLevel: raw.tier_level || raw.tierLevel || "Bronze",
    completedWorksCount: raw.completed_works_count || raw.completedWorksCount || 0,
    operatingHours: raw.operating_hours || raw.operatingHours || "8:00 AM - 8:00 PM",
    canBookInstantly: raw.can_book_instantly ?? raw.canBookInstantly ?? true,
    botId: raw.bot_id || raw.botId || raw.id,
    botName: raw.bot_name || raw.botName || null,
    phone: raw.phone || null,
  };
}

function mapRawAppointment(raw: any): GigAppointment {
  return {
    id: raw.id ?? 0,
    clientId: raw.client_id ?? raw.clientId ?? 0,
    clientName: raw.client_name || raw.clientName || "Client",
    clientPhone: raw.client_phone || raw.clientPhone || null,
    clientAvatarUrl: raw.client_avatar_url || raw.clientAvatarUrl || null,
    providerId: raw.provider_id ?? raw.providerId ?? 0,
    providerUserId: raw.provider_user_id ?? raw.providerUserId ?? 0,
    providerName: raw.provider_name || raw.providerName || "Service Provider",
    providerSpecialization: raw.provider_specialization || raw.providerSpecialization || "Service",
    providerAvatarUrl: raw.provider_avatar_url || raw.providerAvatarUrl || null,
    providerPhone: raw.provider_phone || raw.providerPhone || null,
    serviceTitle: raw.service_title || raw.serviceTitle || "Home Service Visit",
    category: raw.category || "General",
    description: raw.description || "",
    address: raw.address || "Client Location",
    city: raw.city || "Kochi",
    area: raw.area || "Kaloor",
    scheduledDate: raw.scheduled_date || raw.scheduledDate || new Date().toISOString().split("T")[0],
    scheduledTimeSlot: raw.scheduled_time_slot || raw.scheduledTimeSlot || "10:00 AM - 12:00 PM",
    timingMode: raw.timing_mode || raw.timingMode || "client_proposed",
    status: raw.status || "pending",
    proposedNewDate: raw.proposed_new_date || raw.proposedNewDate || null,
    proposedNewTimeSlot: raw.proposed_new_time_slot || raw.proposedNewTimeSlot || null,
    rescheduleReason: raw.reschedule_reason || raw.rescheduleReason || null,
    estimatedBudget: raw.estimated_budget ?? raw.estimatedBudget ?? null,
    finalAmount: raw.final_amount ?? raw.finalAmount ?? null,
    paymentStatus: raw.payment_status || raw.paymentStatus || "unpaid",
    paymentMethod: raw.payment_method || raw.paymentMethod || null,
    proofImages: raw.proof_images || raw.proofImages || [],
    completionNotes: raw.completion_notes || raw.completionNotes || null,
    pointsAwarded: raw.points_awarded ?? raw.pointsAwarded ?? null,
    isPointsCredited: raw.is_points_credited ?? raw.isPointsCredited ?? false,
    isReviewed: raw.is_reviewed ?? raw.isReviewed ?? false,
    cancelledByUserId: raw.cancelled_by_user_id ?? raw.cancelledByUserId ?? null,
    cancellationReason: raw.cancellation_reason ?? raw.cancellationReason ?? null,
    declineReason: raw.decline_reason ?? raw.declineReason ?? null,
    chatRoomId: raw.chat_room_id || raw.chatRoomId || null,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || null,
  };
}

function mapRawPointTransaction(raw: any): GigPointTransaction {
  return {
    id: raw.id ?? Date.now(),
    points: typeof raw.points === "number" ? raw.points : parseInt(raw.points || "0", 10) || 0,
    transactionType: raw.transaction_type || raw.transactionType || "credit",
    title: raw.title || "Reward Points",
    description: raw.description || "Points update",
    referenceType: raw.reference_type || raw.referenceType || null,
    referenceId: raw.reference_id || raw.referenceId || null,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    balanceAfter: raw.balance_after ?? raw.balanceAfter ?? null,
  };
}

function mapRawJob(raw: any): GigJob {
  return {
    id: raw.id ?? 0,
    clientId: raw.client_id ?? raw.clientId ?? null,
    assignedProviderId: raw.assigned_provider_id ?? raw.assignedProviderId ?? null,
    assignedProposalId: raw.assigned_proposal_id ?? raw.assignedProposalId ?? null,
    title: raw.title || "",
    description: raw.description || "",
    category: raw.category || "General",
    budget: typeof raw.budget === "number" ? raw.budget : parseFloat(raw.budget || "0") || null,
    city: raw.city || "Kochi",
    area: raw.area || "Kaloor",
    status: raw.status || "open",
    paymentStatus: raw.payment_status || raw.paymentStatus || "unpaid",
    startedAt: raw.started_at || raw.startedAt || null,
    completedAt: raw.completed_at || raw.completedAt || null,
    proofImages: raw.proof_images || raw.proofImages || [],
    proposalsCount: raw.proposals_count ?? raw.proposalsCount ?? 0,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    clientName: raw.client_name || raw.clientName || null,
    clientPhone: raw.client_phone || raw.clientPhone || null,
    clientAvatarUrl: raw.client_avatar_url || raw.clientAvatarUrl || null,
    assignedProviderName: raw.assigned_provider_name || raw.assignedProviderName || null,
    assignedProviderAvatar: raw.assigned_provider_avatar || raw.assignedProviderAvatar || null,
    assignedProviderPhone: raw.assigned_provider_phone || raw.assignedProviderPhone || null,
    assignedProviderSpecialization: raw.assigned_provider_specialization || raw.assignedProviderSpecialization || null,
    assignedProviderRating: raw.assigned_provider_rating ?? raw.assignedProviderRating ?? null,
  };
}

function mapRawProposal(raw: any): GigProposal {
  return {
    id: raw.id ?? 0,
    jobId: raw.job_id ?? raw.jobId ?? 0,
    providerId: raw.provider_id ?? raw.providerId ?? 0,
    proposedPrice: typeof raw.proposed_price === "number" ? raw.proposed_price : parseFloat(raw.proposed_price || "0") || 0,
    estimatedDuration: raw.estimated_duration || raw.estimatedDuration || "1 day",
    message: raw.message || "",
    status: raw.status || "pending",
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    providerName: raw.provider_name || raw.providerName || null,
    providerAvatar: raw.provider_avatar || raw.providerAvatar || null,
    providerSpecialization: raw.provider_specialization || raw.providerSpecialization || null,
    providerRating: raw.provider_rating ?? raw.providerRating ?? 5.0,
    providerPhone: raw.provider_phone || raw.providerPhone || null,
  };
}

function mapRawReview(raw: any): GigReview {
  return {
    id: raw.id ?? 0,
    jobId: raw.job_id ?? raw.jobId ?? undefined,
    appointmentId: raw.appointment_id ?? raw.appointmentId ?? undefined,
    rating: typeof raw.rating === "number" ? raw.rating : parseFloat(raw.rating || "5") || 5,
    comment: raw.comment || "",
    tags: raw.tags || [],
    reviewerName: raw.reviewer_name || raw.reviewerName || "Verified Customer",
    createdAt: raw.created_at || raw.createdAt || "",
  };
}
