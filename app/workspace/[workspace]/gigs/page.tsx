"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Wrench,
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Phone,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Loader2,
  Bot,
  Send,
  User,
  Zap,
  Check,
  Crosshair,
  SlidersHorizontal,
  ChevronDown,
  Award,
  AlertCircle,
  X,
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
import { GigProvider, GigBotReply, GigReview } from "@/lib/types/gig";
import { GigBotKnowledgeEngine } from "@/lib/api/gig-bot";
import { toast } from "sonner";

// 6 Core Categories exactly as in Flutter GigHomeScreen._categories
const CATEGORIES = [
  {
    id: "Electrician",
    name: "Electrician",
    icon: Zap,
    bg: "bg-rose-50 border-rose-100",
    color: "text-rose-600",
    description: "Wiring, circuit boards, inverters & emergency repair",
  },
  {
    id: "Plumber",
    name: "Plumber",
    icon: Wrench,
    bg: "bg-sky-50 border-sky-100",
    color: "text-sky-600",
    description: "Pipes, leakage detection, sanitaryware & pumps",
  },
  {
    id: "AC Service",
    name: "AC Service",
    icon: Sparkles,
    bg: "bg-cyan-50 border-cyan-100",
    color: "text-cyan-600",
    description: "HVAC cooling tuneup, gas refilling & compressor fix",
  },
  {
    id: "Cleaning",
    name: "Cleaning",
    icon: CheckCircle2,
    bg: "bg-emerald-50 border-emerald-100",
    color: "text-emerald-600",
    description: "Full home sanitization, kitchen & bathroom deep clean",
  },
  {
    id: "Carpenter",
    name: "Carpenter",
    icon: Wrench,
    bg: "bg-amber-50 border-amber-100",
    color: "text-amber-600",
    description: "Furniture repair, modular woodwork & lock installation",
  },
  {
    id: "Appliances",
    name: "Appliances",
    icon: Clock,
    bg: "bg-indigo-50 border-indigo-100",
    color: "text-indigo-600",
    description: "Washing machine, refrigerator & microwave repair",
  },
];

const FILTER_CHIPS = [
  "All",
  "Electrician",
  "Plumber",
  "AC Service",
  "Cleaning",
  "Carpenter",
  "Appliances",
];

export default function WorkspaceGigsPage() {
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

  // Navigation flow: Screen 1 = categories, Screen 2 = results
  const [currentScreen, setCurrentScreen] = React.useState<"categories" | "results">("categories");

  // Providers fetched strictly from backend (NO dummy seed data)
  const [providers, setProviders] = React.useState<GigProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = React.useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("Kochi");
  const [selectedLocation, setSelectedLocation] = React.useState("Kaloor");
  const [filterAvailableNow, setFilterAvailableNow] = React.useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = React.useState(false);

  // Location Selector Dialog
  const [isLocationDialogOpen, setIsLocationDialogOpen] = React.useState(false);
  const [tempCity, setTempCity] = React.useState("Kochi");
  const [tempArea, setTempArea] = React.useState("Kaloor");

  // Detail Modal
  const [detailProvider, setDetailProvider] = React.useState<GigProvider | null>(null);
  const [providerReviews, setProviderReviews] = React.useState<GigReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = React.useState(false);


  // Booking Modal State
  const [bookingProvider, setBookingProvider] = React.useState<GigProvider | null>(null);
  const [bookingForm, setBookingForm] = React.useState({
    serviceTitle: "",
    category: "",
    description: "",
    address: "",
    city: "Kochi",
    area: "Kaloor",
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTimeSlot: "10:00 AM - 12:00 PM",
    estimatedBudget: 350,
  });
  const [isSubmittingBooking, setIsSubmittingBooking] = React.useState(false);

  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  // Load providers strictly from backend
  const loadProviders = React.useCallback(
    async (specialization?: string, overrideArea?: string) => {
      setIsLoadingProviders(true);
      try {
        const cat =
          specialization !== undefined
            ? specialization === "All"
              ? undefined
              : specialization
            : selectedCategory === "All"
            ? undefined
            : selectedCategory;
        const areaToQuery = overrideArea !== undefined ? overrideArea : selectedLocation;
        const data = await gigApi.searchProviders({
          specialization: cat,
          city: selectedCity,
          area: areaToQuery || undefined,
          isAvailableNow: filterAvailableNow ? true : undefined,
        });
        setProviders(data || []);
      } catch (err) {
        console.error("Failed to fetch service providers:", err);
        setProviders([]);
      } finally {
        setIsLoadingProviders(false);
      }
    },
    [selectedCategory, selectedCity, selectedLocation, filterAvailableNow]
  );

  // Initial load on mount or location changes
  React.useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Handle Category Click from Screen 1 (Categories)
  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentScreen("results");
    loadProviders(catName);
  };

  // Handle "Browse All" / "View All"
  const handleBrowseAll = () => {
    setSelectedCategory("All");
    setSelectedLocation("");
    setCurrentScreen("results");
    loadProviders("All", "");
  };

  // Search Submission
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentScreen("results");
    loadProviders(selectedCategory === "All" ? undefined : selectedCategory);
  };

  // Location Detection
  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setSelectedCity("Kochi");
          setSelectedLocation("Kaloor");
          setIsDetectingLocation(false);
          toast.success("Location set to Kochi, Kaloor");
          loadProviders();
        },
        () => {
          setSelectedCity("Kochi");
          setSelectedLocation("Kaloor");
          setIsDetectingLocation(false);
          toast.info("Using default region: Kochi, Kaloor");
          loadProviders();
        },
        { timeout: 5000 }
      );
    } else {
      setIsDetectingLocation(false);
      toast.info("Geolocation not supported by browser. Using Kochi, Kaloor");
    }
  };

  // Save manual location
  const handleSaveLocation = () => {
    setSelectedCity(tempCity.trim() || "Kochi");
    setSelectedLocation(tempArea.trim() || "Kaloor");
    setIsLocationDialogOpen(false);
    toast.success(`Location updated to ${tempArea}, ${tempCity}`);
  };

  // ── DIRECT CHAT INITIATION ──────────────────────────────────────────────
  const handleInitiateChat = (pro: GigProvider) => {
    if (!user) {
      toast.error("Please log in to chat with providers.");
      return;
    }

    if (user.id === pro.userId) {
      toast.error("You cannot start a chat with yourself.");
      return;
    }

    const providerDisplayName = pro.fullName || `${pro.firstName} ${pro.lastName}`.trim() || "Service Provider";

    router.push(
      `/workspace/${workspaceSlug}/chat?otherUserId=${pro.userId}&otherUserName=${encodeURIComponent(
        providerDisplayName
      )}&providerId=${pro.id}&isAvailableNow=${pro.isAvailableNow}&specialization=${encodeURIComponent(pro.specialization)}`
    );
  };


  // Open Provider Detail Dossier
  const handleOpenDetail = async (provider: GigProvider) => {
    setDetailProvider(provider);
    setIsLoadingReviews(true);
    try {
      const reviews = await gigApi.fetchProviderReviews(provider.id);
      setProviderReviews(reviews || []);
    } catch {
      setProviderReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Open Booking Modal
  const handleOpenBooking = (provider: GigProvider) => {
    setBookingProvider(provider);
    setBookingForm({
      serviceTitle: `${provider.specialization} Home Visit`,
      category: provider.specialization,
      description: `Diagnostic checkup and repair service by ${provider.fullName || provider.firstName}.`,
      address: "Home Address, Cochin",
      city: provider.city || "Kochi",
      area: provider.area || "Kaloor",
      scheduledDate: new Date().toISOString().split("T")[0],
      scheduledTimeSlot: "10:00 AM - 12:00 PM",
      estimatedBudget: typeof provider.hourlyRate === "number" ? provider.hourlyRate : 350,
    });
  };

  // Submit Appointment
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingProvider) return;

    setIsSubmittingBooking(true);
    toast.info(`Booking appointment with ${bookingProvider.firstName}...`);

    try {
      const created = await gigApi.bookAppointment({
        providerId: bookingProvider.id,
        serviceTitle: bookingForm.serviceTitle,
        category: bookingForm.category,
        description: bookingForm.description,
        address: bookingForm.address,
        city: bookingForm.city,
        area: bookingForm.area,
        scheduledDate: bookingForm.scheduledDate,
        scheduledTimeSlot: bookingForm.scheduledTimeSlot,
        estimatedBudget: Number(bookingForm.estimatedBudget) || 350,
        clientName: user?.fullName || user?.username || "Client",
        clientPhone: user?.phone || "+91 99999 99999",
        providerName: bookingProvider.fullName || `${bookingProvider.firstName} ${bookingProvider.lastName}`,
        providerSpecialization: bookingProvider.specialization,
        providerUserId: bookingProvider.userId,
      });

      if (created) {
        toast.success("Appointment request placed successfully!");
        setBookingProvider(null);
        router.push(`/workspace/${workspaceSlug}/appointments`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to book appointment. Please try again.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Filtered providers on screen 2
  const displayedProviders = React.useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const q = searchQuery.toLowerCase();
    return providers.filter(
      (p) =>
        (p.fullName && p.fullName.toLowerCase().includes(q)) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.specialization.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.bio && p.bio.toLowerCase().includes(q))
    );
  }, [providers, searchQuery]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SCREEN 1: CATEGORY BROWSER & LANDING                                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentScreen === "categories" && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          {/* 1. Top Location & Bookings Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  Current Location
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTempCity(selectedCity);
                    setTempArea(selectedLocation);
                    setIsLocationDialogOpen(true);
                  }}
                  className="group flex items-center gap-1.5 text-slate-900 hover:text-emerald-700 font-extrabold text-sm sm:text-base cursor-pointer"
                >
                  <span>
                    {selectedLocation}, {selectedCity}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="h-9 px-3.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold gap-1.5"
              >
                {isDetectingLocation ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                ) : (
                  <Crosshair className="h-3.5 w-3.5 text-emerald-600" />
                )}
                <span>Detect</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/workspace/${workspaceSlug}/appointments`)}
                className="h-9 px-3.5 rounded-xl border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold gap-1.5 shadow-2xs"
                title="View Loyalty Wallet & Rewards"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                <span>Rewards</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/workspace/${workspaceSlug}/appointments`)}
                className="h-9 px-3.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                <span>My Appointments</span>
              </Button>
            </div>
          </div>

          {/* 2. Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4.5 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search electrician, plumber, AC service, cleaning..."
                className="w-full h-13 pl-12 pr-28 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all shadow-xs"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs"
              >
                Search
              </Button>
            </div>
          </form>

          {/* 3. Express Direct Connect Promo Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-md">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5" />
                <span>Direct Connect · On-Demand Workforce</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                Find nearby trusted pros & connect directly
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Browse verified local service professionals in {selectedCity}. Directly chat, book diagnostic visits, or request instant quotes with zero middleman markups.
              </p>
              <div className="pt-2">
                <Button
                  onClick={handleBrowseAll}
                  className="h-10 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs gap-2 shadow-xs"
                >
                  <span>Browse All Professionals</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 4. Most Used Services Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Most Used Services
                </h3>
                <p className="text-xs text-slate-500">
                  Select a category to view verified technicians in {selectedLocation}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBrowseAll}
                className="text-emerald-700 hover:text-emerald-800 text-xs font-extrabold"
              >
                View All →
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.name)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 group cursor-pointer"
                  >
                    <div
                      className={`h-12 w-12 rounded-2xl ${cat.bg} border flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {cat.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Top Rated Pros Nearby (Preview from Real Backend Data) */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Top Rated Pros Nearby
                </h3>
              </div>
              {providers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBrowseAll}
                  className="text-emerald-700 hover:text-emerald-800 text-xs font-extrabold"
                >
                  View All ({providers.length}) →
                </Button>
              )}
            </div>

            {isLoadingProviders ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                <p className="text-xs font-medium">Querying local service professionals...</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Wrench className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  No providers found in {selectedLocation}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try switching area, or search across the entire city of {selectedCity}.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedLocation("");
                    loadProviders();
                  }}
                  className="h-8 rounded-xl text-xs font-bold"
                >
                  Search Across {selectedCity}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.slice(0, 3).map((pro) => (
                  <ProviderCard
                    key={pro.id}
                    provider={pro}
                    onChat={() => handleInitiateChat(pro)}
                    onBook={() => handleOpenBooking(pro)}
                    onDetail={() => handleOpenDetail(pro)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SCREEN 2: AVAILABLE PROVIDERS LISTING (SEARCH RESULTS)                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentScreen === "results" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* 1. Header with Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentScreen("categories")}
                className="h-10 w-10 p-0 rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-100 shrink-0"
                title="Back to Categories"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Available Providers</span>
                  <Badge variant="outline" className="text-[11px] font-bold border-slate-200 text-slate-600">
                    {displayedProviders.length} Found
                  </Badge>
                </h2>
                <p className="text-xs text-slate-500">
                  Showing service professionals in {selectedLocation || "All Areas"}, {selectedCity}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempCity(selectedCity);
                  setTempArea(selectedLocation);
                  setIsLocationDialogOpen(true);
                }}
                className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <span>Change Location</span>
              </Button>
            </div>
          </div>

          {/* 2. Filter Pills & Controls */}
          <div className="space-y-3">
            {/* Category horizontal pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
              {FILTER_CHIPS.map((chip) => {
                const isSelected =
                  (selectedCategory.toLowerCase() === chip.toLowerCase()) ||
                  (!selectedCategory && chip === "All");
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      const next = chip === "All" ? "All" : chip;
                      setSelectedCategory(next);
                      loadProviders(next === "All" ? undefined : next);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            {/* Search Input & Available Now Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name, skill, or area..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterAvailableNow(!filterAvailableNow)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    filterAvailableNow
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      filterAvailableNow ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    }`}
                  />
                  <span>Available Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Providers List / Grid */}
          {isLoadingProviders ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Loading verified service providers...</p>
            </div>
          ) : displayedProviders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No providers found in {selectedLocation || selectedCity}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing the &ldquo;Available Now&rdquo; filter, selecting &ldquo;All&rdquo; categories, or broadening your search location.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                    setFilterAvailableNow(false);
                    setSelectedLocation("");
                    loadProviders("All", "");
                  }}
                  className="h-8.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                >
                  Reset Filters & Search All
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedProviders.map((pro) => (
                <ProviderCard
                  key={pro.id}
                  provider={pro}
                  onChat={() => handleInitiateChat(pro)}
                  onBook={() => handleOpenBooking(pro)}
                  onDetail={() => handleOpenDetail(pro)}
                />
              ))}
            </div>
          )}
        </div>
      )}


      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. DIRECT APPOINTMENT BOOKING MODAL                                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!bookingProvider} onOpenChange={(open) => !open && setBookingProvider(null)}>
        <DialogContent className="sm:max-w-lg bg-white border border-slate-200 p-6 rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              Schedule Service Appointment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Request a confirmed time slot with {bookingProvider?.fullName || bookingProvider?.firstName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBooking} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Service Title</label>
              <input
                type="text"
                required
                value={bookingForm.serviceTitle}
                onChange={(e) => setBookingForm({ ...bookingForm, serviceTitle: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={bookingForm.scheduledDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, scheduledDate: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Preferred Slot</label>
                <select
                  value={bookingForm.scheduledTimeSlot}
                  onChange={(e) => setBookingForm({ ...bookingForm, scheduledTimeSlot: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 bg-white"
                >
                  <option value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</option>
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                  <option value="1:00 PM - 3:00 PM">1:00 PM - 3:00 PM</option>
                  <option value="3:00 PM - 5:00 PM">3:00 PM - 5:00 PM</option>
                  <option value="5:00 PM - 7:00 PM">5:00 PM - 7:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Problem Description</label>
              <textarea
                rows={2}
                required
                value={bookingForm.description}
                onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Service Address</label>
              <input
                type="text"
                required
                value={bookingForm.address}
                onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={bookingForm.city}
                  onChange={(e) => setBookingForm({ ...bookingForm, city: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Area / Locality</label>
                <input
                  type="text"
                  required
                  value={bookingForm.area}
                  onChange={(e) => setBookingForm({ ...bookingForm, area: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBookingProvider(null)}
                className="h-9 rounded-xl border-slate-200 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingBooking}
                className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs"
              >
                {isSubmittingBooking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirm Appointment Request</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. PROVIDER DOSSIER & REVIEWS MODAL                                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!detailProvider} onOpenChange={(open) => !open && setDetailProvider(null)}>
        <DialogContent className="sm:max-w-xl bg-white border border-slate-200 p-6 rounded-3xl shadow-xl max-h-[85vh] overflow-y-auto space-y-4">
          {detailProvider && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-base shadow-xs">
                    {detailProvider.avatarText || `${detailProvider.firstName[0] || ""}${detailProvider.lastName[0] || ""}`}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>{detailProvider.fullName || `${detailProvider.firstName} ${detailProvider.lastName}`}</span>
                      {(detailProvider.isIdentityVerified || detailProvider.isApproved) && (
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {detailProvider.specialization} · {detailProvider.area}, {detailProvider.city}
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-50 border-amber-200 text-amber-800 text-[11px] font-extrabold">
                  {detailProvider.tierLevel} Tier
                </Badge>
              </div>

              {/* Bio */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                {detailProvider.bio || "Certified service professional ready for on-demand home visits."}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Rating</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {detailProvider.rating > 0 ? detailProvider.rating.toFixed(1) : "New"} ★
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Completed</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {detailProvider.completedWorksCount} jobs
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Reward Pts</p>
                  <p className="text-sm font-black text-amber-700 mt-0.5">
                    {detailProvider.rewardPoints} pts
                  </p>
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">Verification Badges</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Check
                      className={`h-4 w-4 ${
                        detailProvider.isIdentityVerified ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>Government ID</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Check
                      className={`h-4 w-4 ${
                        detailProvider.isSelfieVerified ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>Live Biometric Selfie</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Check
                      className={`h-4 w-4 ${
                        detailProvider.isLocationVerified ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>Geofence Validated</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Check
                      className={`h-4 w-4 ${
                        detailProvider.isApproved ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>Background Approved</span>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">Client Reviews</h4>
                {isLoadingReviews ? (
                  <p className="text-xs text-slate-400">Loading verified reviews...</p>
                ) : providerReviews.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No public reviews submitted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {providerReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{rev.reviewerName || "Client"}</span>
                          <span className="text-amber-500 font-bold">{rev.rating} ★</span>
                        </div>
                        <p className="text-slate-600">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const p = detailProvider;
                    setDetailProvider(null);
                    handleInitiateChat(p);
                  }}
                  className="h-9 px-4 rounded-xl border-slate-200 text-slate-700 text-xs font-bold gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Chat</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const p = detailProvider;
                    setDetailProvider(null);
                    handleOpenBooking(p);
                  }}
                  className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Book Visit</span>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. LOCATION SELECTOR DIALOG                                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              Select Your Location
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Filter available service professionals by your neighborhood.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                value={tempCity}
                onChange={(e) => setTempCity(e.target.value)}
                placeholder="e.g. Kochi"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Area / Locality</label>
              <input
                type="text"
                value={tempArea}
                onChange={(e) => setTempArea(e.target.value)}
                placeholder="e.g. Kaloor, Edappally, Aluva"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLocationDialogOpen(false)}
              className="h-9 rounded-xl border-slate-200 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveLocation}
              className="h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
            >
              Apply Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── REUSABLE MODERN PROVIDER CARD (NO "Chat AI Bot" button on card!) ──────────
function ProviderCard({
  provider,
  onChat,
  onBook,
  onDetail,
}: {
  provider: GigProvider;
  onChat: () => void;
  onBook: () => void;
  onDetail: () => void;
}) {
  const initials =
    provider.avatarText ||
    `${provider.firstName[0] || ""}${provider.lastName[0] || ""}`.toUpperCase() ||
    "GP";
  const displayName = provider.fullName || `${provider.firstName} ${provider.lastName}`.trim();

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Card Header: Avatar & Info */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-xs">
                {initials}
              </div>
              {provider.isAvailableNow && (
                <span
                  className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-600/30"
                  title="Available to connect"
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {displayName}
                </h3>
                {(provider.isIdentityVerified || provider.isApproved) && (
                  <span title="Verified Provider">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500">
                {provider.specialization} · {provider.area}, {provider.city}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
            {provider.tierLevel}
          </span>
        </div>

        {/* Rating & Rate Pill */}
        <div className="flex items-center gap-3 py-2 border-y border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-800 font-bold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{provider.rating > 0 ? provider.rating.toFixed(1) : "New"}</span>
            {provider.reviewCount > 0 && (
              <span className="text-slate-400 font-normal">({provider.reviewCount})</span>
            )}
          </div>
          <span className="text-slate-300">·</span>
          <div className="text-slate-800 font-bold">
            ₹{provider.hourlyRate} <span className="text-slate-400 font-normal">/ hr</span>
          </div>
          {provider.rewardPoints > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <div className="text-amber-700 font-bold flex items-center gap-1">
                <Award className="h-3 w-3" />
                <span>{provider.rewardPoints} pts</span>
              </div>
            </>
          )}
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
          {provider.bio || "Certified service professional ready for on-demand home visits and repairs."}
        </p>
      </div>

      {/* Card Actions: Book Visit + Chat (NO AI Bot button here!) */}
      <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onChat}
            className="h-8.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <MessageSquare className="h-3.5 w-3.5 text-slate-600" />
            <span>Chat</span>
          </Button>

          <Button
            size="sm"
            onClick={onBook}
            className="h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Book Visit</span>
          </Button>
        </div>

        <button
          type="button"
          onClick={onDetail}
          className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-slate-800 py-1 transition-colors cursor-pointer"
        >
          View Profile & Dossier →
        </button>
      </div>
    </div>
  );
}
