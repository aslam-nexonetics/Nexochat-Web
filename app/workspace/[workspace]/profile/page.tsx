"use client";

import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Upload,
  FileText,
  Trash2,
  Plus,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  ExternalLink,
  Loader2,
  Check,
  X,
  ShieldCheck,
  Wrench,
  DollarSign,
  CreditCard,
  Award,
  Globe,
  Radio,
  Clock,
  Eye,
  EyeOff,
  Bot,
  MessageSquare,
  Send,
  Star,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Edit3,
  AlertTriangle,
  Phone,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { JobProfile, Experience, Education } from "@/lib/types/job";
import { jobsApi } from "@/lib/api/jobs";
import { memberProfileApi, MemberProfile } from "@/lib/api/member-profile";
import { gigApi } from "@/lib/api/gig";
import { GigProvider, GigBotConfig, GigBotReply, GigReview } from "@/lib/types/gig";
import {
  GigBoatQuestionsService,
  GigBoatQuestion,
  GigBotKnowledgeEngine,
} from "@/lib/api/gig-bot";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WorkspaceProfileDispatcherPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = ((params?.workspace as string) || "techform").toLowerCase().trim();
  const targetUserIdParam = searchParams.get("userId");
  const targetProviderIdParam = searchParams.get("providerId");
  const targetUserId = targetUserIdParam ? parseInt(targetUserIdParam, 10) : undefined;
  const targetProviderId = targetProviderIdParam ? parseInt(targetProviderIdParam, 10) : undefined;

  const { activeCollection, collections, selectCollectionByName } = useWorkspaceStore();

  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  // Dispatch appropriate profile screen matching Flutter home_page.dart:
  // 1. Techform -> Candidate CV / Job Profile
  if (workspaceSlug.includes("techform")) {
    return <TechformCandidateProfileView targetUserId={targetUserId} />;
  }

  // 2. GIG -> Provider Registration & KYC Profile or Provider Dossier
  if (workspaceSlug.includes("gig")) {
    return (
      <GigProviderProfileView
        targetProviderId={targetProviderId}
        targetUserId={targetUserId}
      />
    );
  }

  // 3. Nexonetics, Shalabam, and other collections -> Member Profile Dossier
  return (
    <CollectionMemberProfileView
      collectionName={workspaceSlug}
      targetUserId={targetUserId}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TECHFORM: Job Candidate Profile & CV View (Matching ResponsiveJobProfileScreen)
// ─────────────────────────────────────────────────────────────────────────────

function TechformCandidateProfileView({ targetUserId }: { targetUserId?: number }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const isViewingOther = Boolean(targetUserId && targetUserId !== user?.id);
  const [profile, setProfile] = React.useState<JobProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingSummary, setIsSavingSummary] = React.useState(false);
  const [isUploadingResume, setIsUploadingResume] = React.useState(false);
  const [isDeletingResume, setIsDeletingResume] = React.useState(false);

  // Form states for summary
  const [summary, setSummary] = React.useState("");
  const [currentPosition, setCurrentPosition] = React.useState("");
  const [desiredPosition, setDesiredPosition] = React.useState("");
  const [isAvailable, setIsAvailable] = React.useState(true);

  // Experience Dialogs & Form
  const [isExpOpen, setIsExpOpen] = React.useState(false);
  const [isEditExpOpen, setIsEditExpOpen] = React.useState(false);
  const [editingExpId, setEditingExpId] = React.useState<string | null>(null);
  const [expForm, setExpForm] = React.useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  // Education Dialogs & Form
  const [isEduOpen, setIsEduOpen] = React.useState(false);
  const [isEditEduOpen, setIsEditEduOpen] = React.useState(false);
  const [editingEduId, setEditingEduId] = React.useState<string | null>(null);
  const [eduForm, setEduForm] = React.useState({
    degree: "",
    fieldOfStudy: "",
    school: "",
    startDate: "",
    endDate: "",
    grade: "",
    isCurrent: false,
  });

  // Skills
  const [skillInput, setSkillInput] = React.useState("");
  const [skillLevel, setSkillLevel] = React.useState<"Beginner" | "Intermediate" | "Expert">("Intermediate");
  const [isAddingSkill, setIsAddingSkill] = React.useState(false);

  // Certificates Dialogs & Form
  const [isCertOpen, setIsCertOpen] = React.useState(false);
  const [isEditCertOpen, setIsEditCertOpen] = React.useState(false);
  const [editingCertId, setEditingCertId] = React.useState<string | null>(null);
  const [certForm, setCertForm] = React.useState({
    name: "",
    issuingOrganization: "",
    issueDate: "",
    expirationDate: "",
    doesNotExpire: false,
    credentialId: "",
    credentialUrl: "",
  });

  // Languages Dialog & Form
  const [isLangOpen, setIsLangOpen] = React.useState(false);
  const [langForm, setLangForm] = React.useState<{
    name: string;
    proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
  }>({
    name: "",
    proficiency: "Fluent",
  });

  const loadProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await jobsApi.getJobProfile();
      if (data) {
        setProfile(data);
        setSummary(data.professionalSummary || "");
        setCurrentPosition(data.currentPosition || "");
        setDesiredPosition(data.desiredPosition || "");
        setIsAvailable(data.isAvailableForWork ?? true);
      }
    } catch (err) {
      console.error("Failed to load candidate profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Summary Handler ──
  const handleSaveSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSummary(true);
    try {
      const updated = await jobsApi.updateJobProfile({
        professionalSummary: summary,
        currentPosition,
        desiredPosition,
        isAvailableForWork: isAvailable,
      });
      if (updated) {
        setProfile((prev) => (prev ? { ...prev, professionalSummary: summary, currentPosition, desiredPosition, isAvailableForWork: isAvailable } : null));
        toast.success("Profile headline & summary updated successfully!");
      }
    } catch {
      toast.error("Failed to update profile summary");
    } finally {
      setIsSavingSummary(false);
    }
  };

  // ── Resume Handlers ──
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF document for your resume.");
      return;
    }

    setIsUploadingResume(true);
    toast.info("Uploading PDF resume document...");
    try {
      const resumeUrl = await jobsApi.uploadResume(file);
      if (resumeUrl) {
        setProfile((prev) => (prev ? { ...prev, resumeUrl } : null));
        toast.success("Resume uploaded successfully!");
      }
      await loadProfile();
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload resume");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm("Are you sure you want to remove your attached resume document?")) return;
    setIsDeletingResume(true);
    try {
      await jobsApi.deleteResume();
      setProfile((prev) => (prev ? { ...prev, resumeUrl: null } : null));
      toast.success("Resume removed from profile");
    } catch {
      toast.error("Failed to delete resume");
    } finally {
      setIsDeletingResume(false);
    }
  };

  // ── Experience Handlers ──
  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.title || !expForm.company) {
      toast.error("Job title and company are required");
      return;
    }

    try {
      await jobsApi.addExperience({
        title: expForm.title,
        company: expForm.company,
        location: expForm.location,
        startDate: expForm.startDate,
        endDate: expForm.isCurrent ? undefined : expForm.endDate,
        isCurrent: expForm.isCurrent,
        description: expForm.description,
      });
      await loadProfile();
      setIsExpOpen(false);
      setExpForm({
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
      });
      toast.success("Experience record added!");
    } catch {
      toast.error("Failed to add experience");
    }
  };

  const handleOpenEditExperience = (exp: Experience) => {
    setEditingExpId(exp.id || null);
    setExpForm({
      title: exp.title,
      company: exp.company,
      location: exp.location || "",
      startDate: exp.startDate,
      endDate: exp.endDate || "",
      isCurrent: exp.isCurrent,
      description: exp.description || "",
    });
    setIsEditExpOpen(true);
  };

  const handleUpdateExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpId || !expForm.title || !expForm.company) {
      toast.error("Job title and company are required");
      return;
    }

    try {
      await jobsApi.updateExperience(editingExpId, {
        title: expForm.title,
        company: expForm.company,
        location: expForm.location,
        startDate: expForm.startDate,
        endDate: expForm.isCurrent ? undefined : expForm.endDate,
        isCurrent: expForm.isCurrent,
        description: expForm.description,
      });
      await loadProfile();
      setIsEditExpOpen(false);
      setEditingExpId(null);
      toast.success("Experience updated!");
    } catch {
      toast.error("Failed to update experience");
    }
  };

  const handleDeleteExperience = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this experience record?")) return;
    try {
      await jobsApi.deleteExperience(id);
      await loadProfile();
      toast.success("Experience removed");
    } catch {
      toast.error("Failed to delete experience");
    }
  };

  // ── Education Handlers ──
  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.degree || !eduForm.school) {
      toast.error("Degree and school are required");
      return;
    }

    try {
      await jobsApi.addEducation({
        degree: eduForm.degree,
        fieldOfStudy: eduForm.fieldOfStudy,
        school: eduForm.school,
        startDate: eduForm.startDate,
        endDate: eduForm.isCurrent ? undefined : eduForm.endDate,
        grade: eduForm.grade,
      });
      await loadProfile();
      setIsEduOpen(false);
      setEduForm({
        degree: "",
        fieldOfStudy: "",
        school: "",
        startDate: "",
        endDate: "",
        grade: "",
        isCurrent: false,
      });
      toast.success("Education record added!");
    } catch {
      toast.error("Failed to add education");
    }
  };

  const handleOpenEditEducation = (edu: Education) => {
    setEditingEduId(edu.id || null);
    setEduForm({
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy || "",
      school: edu.school,
      startDate: edu.startDate,
      endDate: edu.endDate || "",
      grade: edu.grade || "",
      isCurrent: !edu.endDate,
    });
    setIsEditEduOpen(true);
  };

  const handleUpdateEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEduId || !eduForm.degree || !eduForm.school) {
      toast.error("Degree and school are required");
      return;
    }

    try {
      await jobsApi.updateEducation(editingEduId, {
        degree: eduForm.degree,
        fieldOfStudy: eduForm.fieldOfStudy,
        school: eduForm.school,
        startDate: eduForm.startDate,
        endDate: eduForm.isCurrent ? undefined : eduForm.endDate,
        grade: eduForm.grade,
      });
      await loadProfile();
      setIsEditEduOpen(false);
      setEditingEduId(null);
      toast.success("Education updated!");
    } catch {
      toast.error("Failed to update education");
    }
  };

  const handleDeleteEducation = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this education record?")) return;
    try {
      await jobsApi.deleteEducation(id);
      await loadProfile();
      toast.success("Education removed");
    } catch {
      toast.error("Failed to delete education");
    }
  };

  // ── Skills Handlers ──
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = skillInput.trim();
    if (!name) return;

    const currentSkills = profile?.skills || [];
    if (currentSkills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Skill already exists in your profile");
      return;
    }

    setIsAddingSkill(true);
    try {
      await jobsApi.addSkill({ name, level: skillLevel });
      await loadProfile();
      setSkillInput("");
      toast.success("Skill added!");
    } catch {
      toast.error("Failed to add skill");
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId?: string) => {
    if (!skillId) return;
    try {
      await jobsApi.deleteSkill(skillId);
      await loadProfile();
      toast.success("Skill removed");
    } catch {
      toast.error("Failed to remove skill");
    }
  };

  // ── Certificates Handlers ──
  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.name || !certForm.issuingOrganization || !certForm.issueDate) {
      toast.error("Name, issuing organization, and issue date are required");
      return;
    }

    try {
      await jobsApi.addCertificate({
        name: certForm.name,
        issuingOrganization: certForm.issuingOrganization,
        issueDate: certForm.issueDate,
        expirationDate: certForm.doesNotExpire ? undefined : certForm.expirationDate || undefined,
        credentialId: certForm.credentialId,
        credentialUrl: certForm.credentialUrl,
      });
      await loadProfile();
      setIsCertOpen(false);
      setCertForm({
        name: "",
        issuingOrganization: "",
        issueDate: "",
        expirationDate: "",
        doesNotExpire: false,
        credentialId: "",
        credentialUrl: "",
      });
      toast.success("Certificate added!");
    } catch {
      toast.error("Failed to add certificate");
    }
  };

  const handleOpenEditCertificate = (cert: any) => {
    setEditingCertId(cert.id || null);
    setCertForm({
      name: cert.name,
      issuingOrganization: cert.issuingOrganization,
      issueDate: cert.issueDate,
      expirationDate: cert.expirationDate || "",
      doesNotExpire: !cert.expirationDate,
      credentialId: cert.credentialId || "",
      credentialUrl: cert.credentialUrl || "",
    });
    setIsEditCertOpen(true);
  };

  const handleUpdateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCertId || !certForm.name || !certForm.issuingOrganization || !certForm.issueDate) {
      toast.error("Name, issuing organization, and issue date are required");
      return;
    }

    try {
      await jobsApi.updateCertificate(editingCertId, {
        name: certForm.name,
        issuingOrganization: certForm.issuingOrganization,
        issueDate: certForm.issueDate,
        expirationDate: certForm.doesNotExpire ? undefined : certForm.expirationDate || undefined,
        credentialId: certForm.credentialId,
        credentialUrl: certForm.credentialUrl,
      });
      await loadProfile();
      setIsEditCertOpen(false);
      setEditingCertId(null);
      toast.success("Certificate updated!");
    } catch {
      toast.error("Failed to update certificate");
    }
  };

  const handleDeleteCertificate = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    try {
      await jobsApi.deleteCertificate(id);
      await loadProfile();
      toast.success("Certificate removed");
    } catch {
      toast.error("Failed to delete certificate");
    }
  };

  // ── Languages Handlers ──
  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!langForm.name.trim()) {
      toast.error("Language name is required");
      return;
    }

    const currentLangs = profile?.languages || [];
    if (currentLangs.some((l) => l.name.toLowerCase() === langForm.name.trim().toLowerCase())) {
      toast.error("Language already added");
      return;
    }

    try {
      await jobsApi.addLanguage({
        name: langForm.name.trim(),
        proficiency: langForm.proficiency,
      });
      await loadProfile();
      setIsLangOpen(false);
      setLangForm({ name: "", proficiency: "Fluent" });
      toast.success("Language added!");
    } catch {
      toast.error("Failed to add language");
    }
  };

  const handleDeleteLanguage = async (id?: string) => {
    if (!id) return;
    try {
      await jobsApi.deleteLanguage(id);
      await loadProfile();
      toast.success("Language removed");
    } catch {
      toast.error("Failed to delete language");
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading Candidate CV Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans">
      {/* ── Header Card ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
              {user?.fullName?.slice(0, 2).toUpperCase() || "CV"}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {user?.fullName || "Candidate Profile"}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    isAvailable
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold"
                      : "bg-slate-50 text-slate-600 border-slate-200 text-xs font-semibold"
                  }
                >
                  {isAvailable ? "Available for Hire" : "Not Looking"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {currentPosition || "Techform Registered Candidate"} · {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isViewingOther ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="h-9 px-3.5 rounded-xl border-slate-200 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </Button>
                <Button
                  onClick={() =>
                    router.push(
                      `/workspace/techform/chat?otherUserId=${targetUserId}`
                    )
                  }
                  className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Chat with Candidate</span>
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                  disabled={isUploadingResume}
                />
                <div className="h-9 px-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs">
                  {isUploadingResume ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                  )}
                  <span>{profile?.resumeUrl ? "Update PDF Resume" : "Upload PDF Resume"}</span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Resume Status Card */}
        {profile?.resumeUrl ? (
          <div className="mt-6 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Current Resume (PDF Document)</p>
                <p className="text-[11px] text-slate-500">
                  Visible to verified hiring managers & recruiters in Techform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-indigo-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>View PDF</span>
              </a>
              {!isViewingOther && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDeletingResume}
                  onClick={handleDeleteResume}
                  className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
                  title="Remove resume"
                >
                  {isDeletingResume ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">No Resume Uploaded</p>
                <p className="text-[11px] text-amber-700">
                  Upload your CV in PDF format to fast-track your 1-click applications.
                </p>
              </div>
            </div>
            {!isViewingOther && (
              <label className="cursor-pointer shrink-0">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                  disabled={isUploadingResume}
                />
                <Button
                  size="sm"
                  type="button"
                  disabled={isUploadingResume}
                  className="h-8 px-3 text-xs bg-amber-700 hover:bg-amber-800 text-white gap-1 pointer-events-none"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Now</span>
                </Button>
              </label>
            )}
          </div>
        )}
      </div>

      {/* ── Summary & Roles Form ────────────────────────────────────────── */}
      <form
        onSubmit={handleSaveSummary}
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Career Headline & Summary</h2>
            <p className="text-xs text-slate-500">Present your specialty, desired role, and bio</p>
          </div>
          {!isViewingOther && (
            <Button
              type="submit"
              size="sm"
              disabled={isSavingSummary}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1 shadow-2xs cursor-pointer"
            >
              {isSavingSummary ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              <span>Save Headline</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Role / Title
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={currentPosition}
              disabled={isViewingOther}
              onChange={(e) => setCurrentPosition(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-75"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Desired Position
            </label>
            <input
              type="text"
              placeholder="e.g. Lead Software Architect"
              value={desiredPosition}
              disabled={isViewingOther}
              onChange={(e) => setDesiredPosition(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-75"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Availability Status
            </label>
            <select
              value={isAvailable ? "available" : "not_looking"}
              disabled={isViewingOther}
              onChange={(e) => setIsAvailable(e.target.value === "available")}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-75"
            >
              <option value="available">Available for Work</option>
              <option value="not_looking">Not Looking / Employed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Professional Summary
          </label>
          <textarea
            rows={3}
            placeholder="Highlight your background, core technical proficiencies, and career goals..."
            value={summary}
            disabled={isViewingOther}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed disabled:opacity-75"
          />
        </div>
      </form>

      {/* ── Skills Chips ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Key Skills & Competencies</h2>
            <p className="text-xs text-slate-500">Technical languages, frameworks, and tools</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 my-4">
          {(profile?.skills || []).length === 0 ? (
            <p className="text-xs text-slate-400 italic">No skills listed yet.</p>
          ) : (
            (profile?.skills || []).map((skill) => (
              <span
                key={skill.id || skill.name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700"
              >
                <span>{skill.name}</span>
                {skill.level && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white border border-indigo-200 text-indigo-600 font-medium">
                    {skill.level}
                  </span>
                )}
                {!isViewingOther && skill.id && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {!isViewingOther && (
          <form onSubmit={handleAddSkill} className="flex flex-wrap items-center gap-2 max-w-lg pt-1">
            <input
              type="text"
              placeholder="Add skill (e.g. React, Go, Docker)..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              className="flex-1 min-w-[160px] px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
            <Button
              type="submit"
              size="sm"
              disabled={!skillInput.trim() || isAddingSkill}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              Add
            </Button>
          </form>
        )}
      </div>

      {/* ── Work Experience ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Work Experience</h2>
            <p className="text-xs text-slate-500">Professional career journey and accomplishments</p>
          </div>
          {!isViewingOther && (
            <Button
              size="sm"
              onClick={() => {
                setExpForm({
                  title: "",
                  company: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  isCurrent: false,
                  description: "",
                });
                setIsExpOpen(true);
              }}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Position</span>
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {(profile?.experiences || []).length === 0 ? (
            <p className="py-4 text-xs text-slate-400 italic">No work experience added yet.</p>
          ) : (
            (profile?.experiences || []).map((exp) => (
              <div key={exp.id || exp.title} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">{exp.title}</h3>
                  <p className="text-xs font-medium text-indigo-600">
                    {exp.company} {exp.location ? `· ${exp.location}` : ""}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate || "Present"}
                    </span>
                  </p>
                  {exp.description && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                </div>
                {!isViewingOther && exp.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditExperience(exp)}
                      className="text-slate-400 hover:text-indigo-600 p-1.5 transition-colors cursor-pointer"
                      title="Edit experience"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                      title="Delete experience"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Education ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Education</h2>
            <p className="text-xs text-slate-500">Degrees, academic institutions, and coursework</p>
          </div>
          {!isViewingOther && (
            <Button
              size="sm"
              onClick={() => {
                setEduForm({
                  degree: "",
                  fieldOfStudy: "",
                  school: "",
                  startDate: "",
                  endDate: "",
                  grade: "",
                  isCurrent: false,
                });
                setIsEduOpen(true);
              }}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Education</span>
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {(profile?.educations || []).length === 0 ? (
            <p className="py-4 text-xs text-slate-400 italic">No education records added yet.</p>
          ) : (
            (profile?.educations || []).map((edu) => (
              <div key={edu.id || edu.degree} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">
                    {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                  </h3>
                  <p className="text-xs font-medium text-slate-600">{edu.school}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {edu.startDate} – {edu.endDate || "Present"}
                    </span>
                    {edu.grade && <span className="ml-2 font-medium text-slate-500">· Grade: {edu.grade}</span>}
                  </p>
                </div>
                {!isViewingOther && edu.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditEducation(edu)}
                      className="text-slate-400 hover:text-indigo-600 p-1.5 transition-colors cursor-pointer"
                      title="Edit education"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                      title="Delete education"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Certificates & Licenses ─────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-indigo-600" />
              <span>Certificates & Licenses</span>
            </h2>
            <p className="text-xs text-slate-500">Verified technical accreditations and credentials</p>
          </div>
          {!isViewingOther && (
            <Button
              size="sm"
              onClick={() => {
                setCertForm({
                  name: "",
                  issuingOrganization: "",
                  issueDate: "",
                  expirationDate: "",
                  doesNotExpire: false,
                  credentialId: "",
                  credentialUrl: "",
                });
                setIsCertOpen(true);
              }}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Certificate</span>
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {(profile?.certificates || []).length === 0 ? (
            <p className="py-4 text-xs text-slate-400 italic">No certificates added yet.</p>
          ) : (
            (profile?.certificates || []).map((cert) => (
              <div key={cert.id || cert.name} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">{cert.name}</h3>
                  <p className="text-xs font-medium text-slate-700">{cert.issuingOrganization}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Issued {cert.issueDate} {cert.expirationDate ? `· Expires ${cert.expirationDate}` : "· Does not expire"}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    {cert.credentialId && (
                      <span className="text-slate-500 text-[11px]">
                        ID: <span className="font-mono text-slate-700">{cert.credentialId}</span>
                      </span>
                    )}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>Show Credential</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
                {!isViewingOther && cert.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditCertificate(cert)}
                      className="text-slate-400 hover:text-indigo-600 p-1.5 transition-colors cursor-pointer"
                      title="Edit certificate"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCertificate(cert.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                      title="Delete certificate"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Languages ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-indigo-600" />
              <span>Languages</span>
            </h2>
            <p className="text-xs text-slate-500">Spoken and written language proficiencies</p>
          </div>
          {!isViewingOther && (
            <Button
              size="sm"
              onClick={() => {
                setLangForm({ name: "", proficiency: "Fluent" });
                setIsLangOpen(true);
              }}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Language</span>
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {(profile?.languages || []).length === 0 ? (
            <p className="text-xs text-slate-400 italic">No languages listed yet.</p>
          ) : (
            (profile?.languages || []).map((lang) => (
              <div
                key={lang.id || lang.name}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
              >
                <span>{lang.name}</span>
                <Badge variant="outline" className="text-[10px] bg-white border-slate-200 font-medium text-slate-600">
                  {lang.proficiency}
                </Badge>
                {!isViewingOther && lang.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLanguage(lang.id)}
                    className="hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                    title="Remove language"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      {/* Add Experience Dialog */}
      <Dialog open={isExpOpen} onOpenChange={setIsExpOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add Work Experience</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExperience} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Frontend Engineer"
                value={expForm.title}
                onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company *</label>
              <input
                type="text"
                required
                placeholder="e.g. Google, Acme Inc."
                value={expForm.company}
                onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA or Remote"
                value={expForm.location}
                onChange={(e) => setExpForm({ ...expForm, location: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jan 2022"
                  value={expForm.startDate}
                  onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="text"
                  placeholder="e.g. Present"
                  value={expForm.endDate}
                  disabled={expForm.isCurrent}
                  onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isCurrentExp"
                checked={expForm.isCurrent}
                onChange={(e) => setExpForm({ ...expForm, isCurrent: e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="isCurrentExp" className="text-xs text-slate-700 font-medium cursor-pointer">
                I am currently working in this role
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Key responsibilities and technical achievements..."
                value={expForm.description}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsExpOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Add Experience
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Experience Dialog */}
      <Dialog open={isEditExpOpen} onOpenChange={setIsEditExpOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Work Experience</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateExperience} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={expForm.title}
                onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company *</label>
              <input
                type="text"
                required
                value={expForm.company}
                onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={expForm.location}
                onChange={(e) => setExpForm({ ...expForm, location: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="text"
                  required
                  value={expForm.startDate}
                  onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="text"
                  value={expForm.endDate}
                  disabled={expForm.isCurrent}
                  onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isCurrentExpEdit"
                checked={expForm.isCurrent}
                onChange={(e) => setExpForm({ ...expForm, isCurrent: e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="isCurrentExpEdit" className="text-xs text-slate-700 font-medium cursor-pointer">
                I am currently working in this role
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={expForm.description}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditExpOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Education Dialog */}
      <Dialog open={isEduOpen} onOpenChange={setIsEduOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add Education</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEducation} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Degree *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bachelor of Technology"
                value={eduForm.degree}
                onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Field of Study</label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Information Technology"
                value={eduForm.fieldOfStudy}
                onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institution / University *</label>
              <input
                type="text"
                required
                placeholder="e.g. Stanford University, Cochin University"
                value={eduForm.school}
                onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2018"
                  value={eduForm.startDate}
                  onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="text"
                  placeholder="e.g. 2022"
                  value={eduForm.endDate}
                  disabled={eduForm.isCurrent}
                  onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isCurrentEdu"
                checked={eduForm.isCurrent}
                onChange={(e) => setEduForm({ ...eduForm, isCurrent: e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="isCurrentEdu" className="text-xs text-slate-700 font-medium cursor-pointer">
                I am currently studying here
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / GPA (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 3.8 GPA or First Class"
                value={eduForm.grade}
                onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEduOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Add Education
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Education Dialog */}
      <Dialog open={isEditEduOpen} onOpenChange={setIsEditEduOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Education</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEducation} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Degree *</label>
              <input
                type="text"
                required
                value={eduForm.degree}
                onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Field of Study</label>
              <input
                type="text"
                value={eduForm.fieldOfStudy}
                onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institution / University *</label>
              <input
                type="text"
                required
                value={eduForm.school}
                onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="text"
                  required
                  value={eduForm.startDate}
                  onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="text"
                  value={eduForm.endDate}
                  disabled={eduForm.isCurrent}
                  onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isCurrentEduEdit"
                checked={eduForm.isCurrent}
                onChange={(e) => setEduForm({ ...eduForm, isCurrent: e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="isCurrentEduEdit" className="text-xs text-slate-700 font-medium cursor-pointer">
                I am currently studying here
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / GPA</label>
              <input
                type="text"
                value={eduForm.grade}
                onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditEduOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Certificate Dialog */}
      <Dialog open={isCertOpen} onOpenChange={setIsCertOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add Certificate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCertificate} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. AWS Certified Solutions Architect"
                value={certForm.name}
                onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issuing Organization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amazon Web Services"
                value={certForm.issuingOrganization}
                onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date *</label>
                <input
                  type="text"
                  required
                  placeholder="YYYY-MM or Jan 2023"
                  value={certForm.issueDate}
                  onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiration Date</label>
                <input
                  type="text"
                  placeholder="YYYY-MM"
                  value={certForm.expirationDate}
                  disabled={certForm.doesNotExpire}
                  onChange={(e) => setCertForm({ ...certForm, expirationDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="certDoesNotExpire"
                checked={certForm.doesNotExpire}
                onChange={(e) => setCertForm({ ...certForm, doesNotExpire: e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="certDoesNotExpire" className="text-xs text-slate-700 font-medium cursor-pointer">
                This credential does not expire
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credential ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. AWS-12345678"
                value={certForm.credentialId}
                onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credential URL (Optional)</label>
              <input
                type="url"
                placeholder="https://www.credly.com/badges/..."
                value={certForm.credentialUrl}
                onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCertOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Add Certificate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Certificate Dialog */}
      <Dialog open={isEditCertOpen} onOpenChange={setIsEditCertOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Certificate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCertificate} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Name *</label>
              <input
                type="text"
                required
                value={certForm.name}
                onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issuing Organization *</label>
              <input
                type="text"
                required
                value={certForm.issuingOrganization}
                onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date *</label>
                <input
                  type="text"
                  required
                  value={certForm.issueDate}
                  onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiration Date</label>
                <input
                  type="text"
                  value={certForm.expirationDate}
                  disabled={certForm.doesNotExpire}
                  onChange={(e) => setCertForm({ ...certForm, expirationDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="certDoesNotExpireEdit"
                checked={certForm.doesNotExpire}
                onChange={(e) => setCertForm({ ...certForm, doesNotExpire: e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="certDoesNotExpireEdit" className="text-xs text-slate-700 font-medium cursor-pointer">
                This credential does not expire
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credential ID (Optional)</label>
              <input
                type="text"
                value={certForm.credentialId}
                onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credential URL (Optional)</label>
              <input
                type="url"
                value={certForm.credentialUrl}
                onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditCertOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Language Dialog */}
      <Dialog open={isLangOpen} onOpenChange={setIsLangOpen}>
        <DialogContent className="sm:max-w-xs bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add Language</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLanguage} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Language Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. English, German, French"
                value={langForm.name}
                onChange={(e) => setLangForm({ ...langForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Proficiency Level</label>
              <select
                value={langForm.proficiency}
                onChange={(e) => setLangForm({ ...langForm, proficiency: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Basic">Basic (Elementary)</option>
                <option value="Conversational">Conversational (Intermediate)</option>
                <option value="Fluent">Fluent (Professional)</option>
                <option value="Native">Native or Bilingual</option>
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsLangOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Add Language
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. GIG: Provider Registration & KYC Profile View (Matching GigScreen.register)
// ─────────────────────────────────────────────────────────────────────────────

function GigProviderProfileView({
  targetProviderId,
  targetUserId,
}: {
  targetProviderId?: number;
  targetUserId?: number;
}) {
  const { user } = useAuthStore();
  const router = useRouter();
  const isViewingOther = Boolean(
    targetProviderId || (targetUserId && targetUserId !== user?.id)
  );

  // States for viewing another provider's profile dossier
  const [viewProvider, setViewProvider] = React.useState<GigProvider | null>(null);
  const [isLoadingViewProvider, setIsLoadingViewProvider] = React.useState(false);
  const [viewReviews, setViewReviews] = React.useState<GigReview[]>([]);
  const [isLoadingViewReviews, setIsLoadingViewReviews] = React.useState(false);

  // Booking modal for viewing another provider
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = React.useState(false);
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

  React.useEffect(() => {
    if (!isViewingOther) return;
    let isMounted = true;
    setIsLoadingViewProvider(true);

    const loadTargetProvider = async () => {
      try {
        if (targetProviderId) {
          const details = await gigApi.fetchProviderDetails(targetProviderId);
          if (isMounted && details) {
            setViewProvider(details);
            setBookingForm((prev) => ({
              ...prev,
              serviceTitle: `${details.specialization} Service`,
              category: details.specialization,
              estimatedBudget: Number(details.hourlyRate) || 350,
              city: details.city || "Kochi",
              area: details.area || "Kaloor",
            }));
            setIsLoadingViewReviews(true);
            const revs = await gigApi.fetchProviderReviews(targetProviderId);
            if (isMounted) {
              setViewReviews(revs);
              setIsLoadingViewReviews(false);
            }
            return;
          }
        }

        const list = await gigApi.searchProviders();
        const found = list.find((p: GigProvider) =>
          targetProviderId
            ? p.id === targetProviderId
            : targetUserId
            ? p.userId === targetUserId
            : false
        );
        if (isMounted && found) {
          setViewProvider(found);
          setBookingForm((prev) => ({
            ...prev,
            serviceTitle: `${found.specialization} Service`,
            category: found.specialization,
            estimatedBudget: Number(found.hourlyRate) || 350,
            city: found.city || "Kochi",
            area: found.area || "Kaloor",
          }));
          setIsLoadingViewReviews(true);
          const revs = await gigApi.fetchProviderReviews(found.id);
          if (isMounted) {
            setViewReviews(revs);
            setIsLoadingViewReviews(false);
          }
        }
      } catch (err) {
        console.error("Failed to load provider profile:", err);
      } finally {
        if (isMounted) setIsLoadingViewProvider(false);
      }
    };

    loadTargetProvider();
    return () => {
      isMounted = false;
    };
  }, [isViewingOther, targetProviderId, targetUserId]);

  const [provider, setProvider] = React.useState<GigProvider | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);

  // Form states
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [category, setCategory] = React.useState("Electrician");
  const [specializationOptions, setSpecializationOptions] = React.useState<string[]>([
    "Electrician",
    "Plumber",
    "AC Service",
    "AC Repair",
    "Appliance Repair",
    "Painter",
    "Carpenter",
    "House Cleaning",
    "Carpet Cleaner",
    "Car Washer",
  ]);
  const [customCategory, setCustomCategory] = React.useState("");
  const [city, setCity] = React.useState("Kochi");
  const [area, setArea] = React.useState("Kaloor");
  const [workingRadius, setWorkingRadius] = React.useState("15");
  const [hourlyRate, setHourlyRate] = React.useState("350");
  const [bio, setBio] = React.useState("");
  const [isAvailableNow, setIsAvailableNow] = React.useState(true);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = React.useState(false);

  // Fetch dynamic specialization suggestions from backend
  React.useEffect(() => {
    gigApi.getSpecializationSuggestions().then((items) => {
      if (items && items.length > 0) {
        setSpecializationOptions(items);
      }
    });
  }, []);

  // KYC Verification fields
  const [idType, setIdType] = React.useState("Aadhaar Card");
  const [idNumber, setIdNumber] = React.useState("");
  const [idFrontUrl, setIdFrontUrl] = React.useState("");
  const [selfieUrl, setSelfieUrl] = React.useState("");
  const [isSubmittingKyc, setIsSubmittingKyc] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Avatar / Profile photo state & handler
  const [avatarUrl, setAvatarUrl] = React.useState<string>("");
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadedUrl = await gigApi.uploadMediaFile(file);
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        toast.success("Profile photo uploaded!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload profile photo");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  // AI Boat / Assistant State
  const [botConfig, setBotConfig] = React.useState<GigBotConfig | null>(null);
  const [isLoadingBot, setIsLoadingBot] = React.useState(true);

  // 10-Step Bot Wizard Modal State
  const [isBotWizardOpen, setIsBotWizardOpen] = React.useState(false);
  const [wizardStep, setWizardStep] = React.useState(1);
  const [wizardQuestions, setWizardQuestions] = React.useState<GigBoatQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, string[]>>({});
  const [customNotes, setCustomNotes] = React.useState<Record<number, string>>({});
  const [customNoteInput, setCustomNoteInput] = React.useState("");
  const [isSavingBot, setIsSavingBot] = React.useState(false);

  // Interactive Bot Test Modal State
  const [isTestBotOpen, setIsTestBotOpen] = React.useState(false);
  const [testMessages, setTestMessages] = React.useState<Array<{ sender: "user" | "bot"; text: string }>>([]);
  const [testInput, setTestInput] = React.useState("");
  const [isTestThinking, setIsTestThinking] = React.useState(false);
  const testChatEndRef = React.useRef<HTMLDivElement>(null);

  const loadBotConfig = React.useCallback(async (prov: GigProvider) => {
    setIsLoadingBot(true);
    try {
      const pName = `${prov.firstName} ${prov.lastName}`.trim() || prov.fullName || "Provider";
      let cfg = await GigBoatQuestionsService.getBoatConfig(prov.id, {
        defaultSpecialization: prov.specialization,
        providerName: pName,
        userId: prov.userId,
      });

      if (!cfg) {
        const remote = await gigApi.fetchMyBot();
        if (remote && (remote.is_active || remote.bot_name)) {
          cfg = {
            providerId: prov.id,
            userId: prov.userId,
            providerName: pName,
            specialization: prov.specialization,
            boatName: remote.bot_name || `${prov.firstName}'s AI Assistant`,
            shareSlug: remote.share_slug || `provider-${prov.id}`,
            isActive: remote.is_active ?? true,
            isReady: true,
            createdAt: remote.created_at || new Date().toISOString(),
            answers: remote.answers || {},
          };
        }
      }

      setBotConfig(cfg);
    } catch (e) {
      console.warn("Failed to load bot config:", e);
    } finally {
      setIsLoadingBot(false);
    }
  }, []);

  const loadProviderProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await gigApi.fetchMyProviderProfile();
      if (data) {
        setProvider(data);
        setIsEditing(false); // Display View Mode when already saved!
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setAvatarUrl(data.avatarUrl || "");
        if (data.specialization) {
          setCategory(data.specialization);
          setCustomCategory("");
        }
        setCity(data.city);
        setArea(data.area);
        setWorkingRadius(String(data.workingRadius || 15));
        setHourlyRate(String(data.hourlyRate || 350));
        setBio(data.bio || "");
        setIsAvailableNow(data.isAvailableNow);
        loadBotConfig(data);
      } else {
        setProvider(null);
        setIsEditing(true); // Open registration mode if no profile exists
        const parts = (user?.fullName || "").split(" ");
        setFirstName(parts[0] || user?.username || "Contractor");
        setLastName(parts.slice(1).join(" ") || "Tech");
        setAvatarUrl("");
      }
    } catch (err) {
      console.error("Failed to load provider profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [loadBotConfig, user]);

  React.useEffect(() => {
    loadProviderProfile();
  }, [loadProviderProfile]);

  const handleToggleAvailability = async () => {
    setIsUpdatingAvailability(true);
    const nextState = !isAvailableNow;
    try {
      await gigApi.updateAvailability({
        isAvailableNow: nextState,
        availabilityStatus: nextState ? "available" : "busy",
        availabilityNote: nextState ? "Ready for on-demand dispatch" : "Busy on assigned contract",
      });
      setIsAvailableNow(nextState);
      if (provider) {
        setProvider({ ...provider, isAvailableNow: nextState });
      }
      toast.success(
        nextState
          ? "You are now marked Available for instant client bookings!"
          : "Status updated to Busy / Paused dispatch."
      );
    } catch {
      toast.error("Failed to update availability status");
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const effectiveSpecialization =
      (category === "Other" ? customCategory.trim() : category) || "Electrician";
    try {
      if (provider) {
        const updated = await gigApi.updateProvider({
          firstName,
          lastName,
          specialization: effectiveSpecialization,
          bio,
          city,
          area,
          avatarUrl: avatarUrl || undefined,
          workingRadius: Number(workingRadius) || 15,
          hourlyRate: Number(hourlyRate) || 350,
        });
        setProvider(updated);
        setIsEditing(false);
        toast.success("Provider profile updated successfully!");
      } else {
        const created = await gigApi.registerProvider({
          firstName,
          lastName,
          specialization: effectiveSpecialization,
          bio,
          city,
          area,
          avatarUrl: avatarUrl || undefined,
          workingRadius: Number(workingRadius) || 15,
          hourlyRate: Number(hourlyRate) || 350,
        });
        setProvider(created);
        setIsEditing(false);
        loadBotConfig(created);
        toast.success("Registered as certified GIG Provider!");
      }
    } catch {
      toast.error("Failed to save provider profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber.trim()) {
      toast.error("Please enter your Government ID number");
      return;
    }

    setIsSubmittingKyc(true);
    try {
      if (provider?.id) {
        await gigApi.submitVerification({
          providerId: provider.id,
          idType,
          idNumber,
          idFrontUrl: idFrontUrl || "https://api3.made2tech.com/mock-doc-front.png",
          selfieUrl: selfieUrl || "https://api3.made2tech.com/mock-selfie.png",
        });
        toast.success("KYC documents submitted for automated verification!");
        await loadProviderProfile();
      } else {
        toast.error("Please save your provider registration before submitting KYC");
      }
    } catch {
      toast.error("Failed to submit verification");
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  // Helper to normalize bot answers safely
  const normalizeBotAnswers = (raw: any): Record<number, string[]> => {
    const result: Record<number, string[]> = {};
    if (!raw) return result;

    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (!item) continue;
        const step = Number(item.step ?? item.question_id ?? item.id);
        if (!isNaN(step) && step > 0) {
          if (Array.isArray(item.selected_options)) {
            result[step] = item.selected_options.map(String);
          } else if (Array.isArray(item.options)) {
            result[step] = item.options.map(String);
          } else if (Array.isArray(item.answers)) {
            result[step] = item.answers.map(String);
          } else if (typeof item.answer === "string") {
            result[step] = [item.answer];
          } else if (typeof item.selected_option === "string") {
            result[step] = [item.selected_option];
          } else if (item.answer && typeof item.answer === "object") {
            result[step] = Object.values(item.answer).map(String);
          }
        }
      }
      return result;
    }

    if (typeof raw === "object") {
      for (const [key, val] of Object.entries(raw)) {
        const step = Number(key);
        if (isNaN(step) || step <= 0) continue;
        if (Array.isArray(val)) {
          result[step] = val.map((v) =>
            typeof v === "object" && v ? (v.title || v.name || JSON.stringify(v)) : String(v)
          );
        } else if (typeof val === "string") {
          result[step] = [val];
        } else if (val && typeof val === "object") {
          const vAny = val as any;
          if (Array.isArray(vAny.selected_options)) {
            result[step] = vAny.selected_options.map(String);
          } else if (Array.isArray(vAny.options)) {
            result[step] = vAny.options.map(String);
          } else if (typeof vAny.answer === "string") {
            result[step] = [vAny.answer];
          } else if (typeof vAny.text === "string") {
            result[step] = [vAny.text];
          } else {
            result[step] = Object.values(vAny).filter((x) => typeof x === "string") as string[];
          }
        }
      }
    }
    return result;
  };

  // Bot Wizard Handlers
  const handleOpenBotWizard = async () => {
    const spec =
      (category === "Other" ? customCategory.trim() : category) ||
      provider?.specialization ||
      "Electrician";
    const pName =
      `${firstName || provider?.firstName || ""} ${lastName || provider?.lastName || ""}`.trim() ||
      provider?.fullName ||
      "Provider";

    let questions = GigBoatQuestionsService.getQuestionsForSpecialization(spec, pName);

    try {
      const data = await gigApi.fetchBotQuestions(spec);
      const rawQuestions =
        data?.questions ||
        (Array.isArray(data) ? data : data?.data?.questions || data?.data);
      if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
        questions = rawQuestions.map((q: any, idx: number) => ({
          step: Number(q.step ?? idx + 1),
          specialization: q.specialization || spec,
          question: q.question || `Step ${idx + 1}`,
          subtitle: q.subtitle || "",
          isMultiSelect: q.is_multi_select ?? q.isMultiSelect ?? true,
          hasOtherSpecify: q.has_other_specify ?? q.hasOtherSpecify ?? true,
          options: (q.options || []).map((o: any, oIdx: number) => ({
            id: String(o.id ?? `opt_${idx}_${oIdx}`),
            title: typeof o === "string" ? o : o.title || o.name || "",
            subtitle: typeof o === "object" ? o.subtitle : undefined,
          })),
        }));
      }
    } catch (e) {
      console.warn("Could not fetch backend bot questions, using defaults:", e);
    }

    setWizardQuestions(questions);
    setWizardStep(1);

    const safeAnswers = normalizeBotAnswers(botConfig?.answers);
    const safeSpecs = botConfig?.customSpecifications || {};

    if (Object.keys(safeAnswers).length > 0) {
      setSelectedAnswers(safeAnswers);
      setCustomNotes(safeSpecs);
      setCustomNoteInput(safeSpecs[1] || "");
    } else {
      if (questions.length > 0 && questions[0].options.length > 0) {
        setSelectedAnswers({
          1: [questions[0].options[0].title, questions[0].options[1]?.title].filter(Boolean),
        });
      } else {
        setSelectedAnswers({});
      }
      setCustomNoteInput("");
    }
    setIsBotWizardOpen(true);
  };

  const currentWizardQuestion = wizardQuestions[wizardStep - 1] || wizardQuestions[0];

  const handleToggleWizardOption = (optionTitle: string) => {
    if (!currentWizardQuestion) return;
    const isMulti = currentWizardQuestion.isMultiSelect;
    const current = Array.isArray(selectedAnswers[wizardStep])
      ? selectedAnswers[wizardStep]
      : [];

    if (isMulti) {
      const updated = current.includes(optionTitle)
        ? current.filter((t) => t !== optionTitle)
        : [...current, optionTitle];
      setSelectedAnswers((prev) => ({ ...prev, [wizardStep]: updated }));
    } else {
      setSelectedAnswers((prev) => ({ ...prev, [wizardStep]: [optionTitle] }));
    }
  };

  const handleNextWizardStep = async () => {
    const current = Array.isArray(selectedAnswers[wizardStep])
      ? selectedAnswers[wizardStep]
      : [];
    if (current.length === 0 && !customNoteInput.trim()) {
      toast.error("Please select at least one option to continue.");
      return;
    }

    // Save custom note for current step if entered
    if (customNoteInput.trim()) {
      setCustomNotes((prev) => ({ ...prev, [wizardStep]: customNoteInput.trim() }));
    }

    if (wizardStep < wizardQuestions.length) {
      const nextStep = wizardStep + 1;
      setWizardStep(nextStep);
      setCustomNoteInput(customNotes[nextStep] || "");
    } else {
      // Completed all steps -> Save & Finish
      await handleFinishBotWizard();
    }
  };

  const handlePrevWizardStep = () => {
    if (wizardStep > 1) {
      const prevStep = wizardStep - 1;
      setWizardStep(prevStep);
      setCustomNoteInput(customNotes[prevStep] || "");
    }
  };

  const handleFinishBotWizard = async () => {
    setIsSavingBot(true);
    const pName =
      `${firstName || provider?.firstName || ""} ${lastName || provider?.lastName || ""}`.trim() ||
      provider?.fullName ||
      "Provider";
    const spec =
      (category === "Other" ? customCategory.trim() : category) ||
      provider?.specialization ||
      "Electrician";
    const pId = provider?.id || 12;

    const botName = `${firstName || provider?.firstName || "Provider"}'s ${spec} Assistant`;
    const cleanSlug = `${firstName || "provider"}-${spec}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const newConfig: GigBotConfig = {
      providerId: pId,
      userId: provider?.userId || user?.id,
      providerName: pName,
      specialization: spec,
      botName,
      boatName: botName,
      shareSlug: cleanSlug,
      welcomeMessage: `Hi! ${pName} is on a job site right now, but I can help you with services, rates, and booking an appointment directly.`,
      isActive: true,
      isReady: true,
      createdAt: new Date().toISOString(),
      answers: selectedAnswers,
      customSpecifications: customNotes,
    };

    // 1. Save locally
    await GigBoatQuestionsService.saveBoatConfig(newConfig);

    // 2. Sync to backend
    const answersPayload = wizardQuestions.map((q) => ({
      step: q.step,
      selected_options: Array.isArray(selectedAnswers[q.step]) ? selectedAnswers[q.step] : [],
      custom_specification: customNotes[q.step] || undefined,
    }));

    await gigApi.setupBot({
      botName,
      shareSlug: newConfig.shareSlug,
      welcomeMessage: newConfig.welcomeMessage,
      isActive: true,
      avatarUrl: provider?.avatarUrl || "",
      answers: answersPayload,
    });

    setBotConfig(newConfig);
    setIsSavingBot(false);
    setIsBotWizardOpen(false);
    toast.success(`🎉 ${botName} is now active and ready!`);
  };

  // Bot Test Handlers
  const handleOpenTestBot = () => {
    const pName =
      `${firstName || provider?.firstName || ""} ${lastName || provider?.lastName || ""}`.trim() ||
      provider?.fullName ||
      "Provider";
    const spec = category || provider?.specialization || "Electrician";
    const botName = botConfig?.botName || botConfig?.boatName || `${pName}'s AI Assistant`;

    const welcome = GigBotKnowledgeEngine.getWelcomeMessage(pName, spec, botName);
    setTestMessages([{ sender: "bot", text: welcome }]);
    setIsTestBotOpen(true);
  };

  const handleSendTestQuery = (queryText: string) => {
    if (!queryText.trim()) return;
    const query = queryText.trim();
    setTestInput("");
    setTestMessages((prev) => [...prev, { sender: "user", text: query }]);
    setIsTestThinking(true);

    const pName =
      `${firstName || provider?.firstName || ""} ${lastName || provider?.lastName || ""}`.trim() ||
      provider?.fullName ||
      "Provider";
    const spec = category || provider?.specialization || "Electrician";

    setTimeout(() => {
      const reply = GigBotKnowledgeEngine.generateAnswer(query, pName, spec, hourlyRate);
      setTestMessages((prev) => [...prev, { sender: "bot", text: reply.text }]);
      setIsTestThinking(false);
      testChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 450);
  };

  if (isViewingOther) {
    if (isLoadingViewProvider) {
      return (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-semibold">Loading provider profile...</p>
        </div>
      );
    }

    if (!viewProvider) {
      return (
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <User className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Provider Profile Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested service provider could not be retrieved from the GIG network.
          </p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        </div>
      );
    }

    const initials =
      viewProvider.avatarText ||
      `${viewProvider.firstName?.[0] || ""}${viewProvider.lastName?.[0] || ""}`.toUpperCase() ||
      "GP";

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md overflow-hidden">
                {viewProvider.avatarUrl ? (
                  <img
                    src={viewProvider.avatarUrl}
                    alt={viewProvider.fullName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {viewProvider.fullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 shadow-2xs">
                    <Wrench className="h-3 w-3 text-blue-600" />
                    <span>{viewProvider.specialization}</span>
                  </span>
                  {viewProvider.isIdentityVerified && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold gap-1"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>KYC Verified</span>
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{viewProvider.rating?.toFixed(1) || "5.0"}</span>
                    <span className="text-slate-400 font-normal">
                      ({viewProvider.reviewCount || viewReviews.length || 0} reviews)
                    </span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{viewProvider.city}, {viewProvider.area}</span>
                  </span>
                  <span>•</span>
                  <span className="font-bold text-slate-900">
                    ₹{viewProvider.hourlyRate}/hr
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="h-10 px-3.5 rounded-xl border-slate-200 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                onClick={() =>
                  router.push(
                    `/workspace/gig/chat?otherUserId=${viewProvider.userId}&otherUserName=${encodeURIComponent(
                      viewProvider.fullName || ""
                    )}&providerId=${viewProvider.id}&specialization=${encodeURIComponent(
                      viewProvider.specialization || "Service"
                    )}`
                  )
                }
                className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Message</span>
              </Button>
              <Button
                onClick={() => setIsBookingModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                <span>Book Appointment</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* About / Bio */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900">About Provider</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {viewProvider.bio ||
                  `${viewProvider.fullName} is an experienced ${viewProvider.specialization} professional based in ${viewProvider.city}. Specializing in on-demand service and guaranteed customer satisfaction.`}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Customer Reviews ({viewReviews.length})
                </h3>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{viewProvider.rating?.toFixed(1) || "5.0"} out of 5</span>
                </div>
              </div>

              {isLoadingViewReviews ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : viewReviews.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400 italic">
                  No public customer reviews recorded yet for this provider.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {viewReviews.map((rev) => (
                    <div key={rev.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          {rev.reviewerName || "Verified Client"}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3",
                                i < (rev.rating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {rev.comment || "Great service! Punctual and professional."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Verification & Badges Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">Trust & Verification</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">Identity Verified</span>
                    <span className="text-[11px] text-slate-500">Government ID vetted</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">Selfie Liveness</span>
                    <span className="text-[11px] text-slate-500">Facial biometric match</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                  <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">Location Radius</span>
                    <span className="text-[11px] text-slate-500">{viewProvider.workingRadius || 15} km service range</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Completed Jobs</span>
                <span className="font-bold text-slate-900">{viewProvider.completedWorksCount || 12}+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Dialog Modal */}
        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
          <DialogContent className="sm:max-w-md bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900">
                Book Appointment with {viewProvider.fullName}
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingBooking(true);
                try {
                  const appointment = await gigApi.bookAppointment({
                    providerId: viewProvider.id,
                    serviceTitle: bookingForm.serviceTitle || `${viewProvider.specialization} Work`,
                    category: viewProvider.specialization,
                    description: bookingForm.description || "Service request",
                    address: bookingForm.address,
                    city: viewProvider.city,
                    area: viewProvider.area,
                    scheduledDate: bookingForm.scheduledDate,
                    scheduledTimeSlot: bookingForm.scheduledTimeSlot,
                    estimatedBudget: Number(bookingForm.estimatedBudget),
                  });
                  if (appointment) {
                    toast.success("Appointment request submitted successfully!");
                    setIsBookingModalOpen(false);
                    router.push("/workspace/gig/appointments");
                  } else {
                    toast.error("Failed to submit appointment");
                  }
                } catch (err: any) {
                  toast.error(err?.message || "Failed to book appointment");
                } finally {
                  setIsSubmittingBooking(false);
                }
              }}
              className="space-y-3 pt-2"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Required</label>
                <input
                  type="text"
                  required
                  value={bookingForm.serviceTitle}
                  onChange={(e) => setBookingForm({ ...bookingForm, serviceTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  value={bookingForm.description}
                  onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                  placeholder="Explain what needs fixing or installation..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Address</label>
                <input
                  type="text"
                  required
                  placeholder="House / Apartment / Landmark"
                  value={bookingForm.address}
                  onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.scheduledDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={bookingForm.scheduledTimeSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, scheduledTimeSlot: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>09:00 AM - 11:00 AM</option>
                    <option>11:00 AM - 01:00 PM</option>
                    <option>02:00 PM - 04:00 PM</option>
                    <option>04:00 PM - 06:00 PM</option>
                  </select>
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingBooking}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 cursor-pointer"
                >
                  {isSubmittingBooking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Booking</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-xs font-semibold">Loading certified provider profile...</p>
      </div>
    );
  }

  const isVerified = provider?.isIdentityVerified ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* ── MODE 1: VIEW PROFILE MODE (When already saved & not editing) ──── */}
      {provider && !isEditing ? (
        <div className="space-y-6">
          {/* Hero Profile Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md overflow-hidden">
                  {provider.avatarUrl ? (
                    <img
                      src={provider.avatarUrl}
                      alt={provider.fullName || provider.firstName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {(provider.firstName?.[0] || "P").toUpperCase()}
                      {(provider.lastName?.[0] || "T").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {provider.firstName} {provider.lastName}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 shadow-2xs">
                      <Wrench className="h-3 w-3 text-blue-600" />
                      <span>{provider.specialization}</span>
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        isVerified
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold gap-1"
                          : "bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold gap-1"
                      }
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{isVerified ? "KYC Verified" : "Verification Pending"}</span>
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>
                      {provider.city}, {provider.area}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{provider.rating?.toFixed(1) || "5.0"}</span>
                      <span className="text-slate-400 font-normal">
                        ({provider.reviewCount || 12} reviews)
                      </span>
                    </span>
                    <span>·</span>
                    <span className="text-slate-600 font-medium">
                      {provider.completedWorksCount || 18} jobs completed
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                {/* Live Availability Toggle */}
                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  disabled={isUpdatingAvailability}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isAvailableNow
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isAvailableNow ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                  <span>{isAvailableNow ? "Available Now" : "Currently Busy"}</span>
                </button>

                {/* Edit Profile Button */}
                <Button
                  onClick={() => setIsEditing(true)}
                  className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit My Profile</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ── AI Assistant Card (Matching Flutter AiBoatProfileCard) ────────── */}
          {botConfig && botConfig.isReady ? (
            /* Screen 3 Ready Card */
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in-50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {botConfig.botName || botConfig.boatName}
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-extrabold"
                    >
                      Instant Answers Active
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Your AI Assistant is active 24/7 to answer rates, service details, and book client appointments when you are busy.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenTestBot}
                  className="h-8.5 px-3.5 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Test My Bot</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleOpenBotWizard}
                  className="h-8.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Assistant</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Screen 1 Promo Card */
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="h-7 w-7 text-indigo-300" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold mb-0.5">
                    <Sparkles className="h-3 w-3" />
                    <span>AI Assistant for GIG Providers</span>
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    Create Your 24/7 AI Service Assistant
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                    Set up an automated AI bot in 2 minutes to answer client inquiries, quote standard inspection fees, and schedule job bookings while you are on-site.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleOpenBotWizard}
                className="h-10 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold gap-1.5 shrink-0 shadow-sm cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Create AI Assistant</span>
              </Button>
            </div>
          )}

          {/* Verification Alert Banner */}
          <div
            className={`rounded-2xl p-4 border flex items-start gap-3.5 ${
              isVerified
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                : "bg-amber-50/70 border-amber-200 text-amber-900"
            }`}
          >
            <ShieldCheck
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                isVerified ? "text-emerald-600" : "text-amber-600"
              }`}
            />
            <div className="space-y-0.5 text-xs flex-1">
              <h4 className="font-bold">
                {isVerified ? "Identity & Trade Verified" : "Identity Verification Pending"}
              </h4>
              <p className={isVerified ? "text-emerald-800" : "text-amber-800"}>
                {isVerified
                  ? "Your government ID is certified. You have full access to high-value client bookings, direct calls, and priority search placement."
                  : "Submit your government ID to unlock the verified contractor badge, direct calls, and top placement in search results."}
              </p>
            </div>
            {!isVerified && (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Verify KYC
              </Button>
            )}
          </div>

          {/* About Service Provider Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span>About Service Provider</span>
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {provider.bio ||
                "No professional bio added yet. Click 'Edit My Profile' to describe your technical certifications, years of experience, and service guarantees."}
            </p>
          </div>

          {/* Trade & Coverage Configuration Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Wrench className="h-4 w-4 text-slate-500" />
              <span>Service Offerings & Coverage</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400">Primary Skill</p>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {provider.specialization}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400">Base Hourly Rate</p>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  ₹{provider.hourlyRate || 350}/hr
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400">Service Base Location</p>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {provider.city}, {provider.area}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400">Operational Radius</p>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {provider.workingRadius || 15} km coverage
                </p>
              </div>
            </div>
          </div>

          {/* Client Reviews Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                <span>Client Reviews & Ratings</span>
              </h2>
              <span className="text-xs font-bold text-slate-700">
                {provider.rating?.toFixed(1) || "5.0"} out of 5
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Naveen Thomas</span>
                  <div className="flex items-center text-amber-500">
                    {"★".repeat(5)}
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Arrived on time, identified the faulty MCB breaker immediately, and fixed the circuit within an hour. Excellent workmanship!
                </p>
              </div>

              <div className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Sneha Varma</span>
                  <div className="flex items-center text-amber-500">
                    {"★".repeat(5)}
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Clean installation of indoor lighting and inverter setup. Very polite and reasonable rates.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── MODE 2: EDIT / REGISTRATION FORM MODE ──────────────────────── */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-1 border border-slate-200">
                <Wrench className="h-3 w-3 text-emerald-600" />
                <span>{provider ? "Edit Certified Profile" : "New Provider Registration"}</span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {provider ? "Edit Provider Details" : "Register as Certified GIG Provider"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your trade skill specialization, coverage area, and rates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {provider && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-9 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>{provider ? "Save Changes" : "Save Profile"}</span>
              </Button>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSave}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6"
          >
            {/* ── Profile Photo Section ── */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Profile Photo
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="relative group shrink-0">
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-24 w-24 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-emerald-500 text-slate-700 flex items-center justify-center font-black text-2xl overflow-hidden cursor-pointer shadow-xs transition-all relative"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Provider photo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Camera className="h-7 w-7 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Add Photo</span>
                      </div>
                    )}

                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                        <Loader2 className="h-6 w-6 animate-spin text-white mb-1" />
                        <span className="text-[10px] font-semibold">Uploading...</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors cursor-pointer border-2 border-white"
                    title="Change profile photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <h3 className="text-xs font-bold text-slate-900">
                    Upload Your Profile Picture
                  </h3>
                  <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                    A professional photo increases client booking trust by over 40%. Supports JPG or PNG format up to 10MB.
                  </p>
                  <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="h-8 px-3 text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-white cursor-pointer shadow-2xs font-semibold gap-1.5"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      <span>{avatarUrl ? "Change Photo" : "Choose Image"}</span>
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAvatarUrl("")}
                        className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer font-semibold"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Trade & Coverage Configuration
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name / Trade Suffix *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Skill Specialization *
                </label>
                <select
                  value={
                    specializationOptions.includes(category)
                      ? category
                      : "Other"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setCategory("Other");
                      if (specializationOptions.includes(category)) {
                        setCustomCategory("");
                      }
                    } else {
                      setCategory(val);
                      setCustomCategory("");
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                >
                  {specializationOptions.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                  <option value="Other">Other / Custom Trade</option>
                </select>

                {(category === "Other" || !specializationOptions.includes(category)) && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Specify Custom Trade / Skill Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Masonry, Welding, Solar Technician"
                      value={category === "Other" ? customCategory : (customCategory || category)}
                      onChange={(e) => {
                        setCategory("Other");
                        setCustomCategory(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Area / Locality
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Radius (km)
                </label>
                <input
                  type="number"
                  value={workingRadius}
                  onChange={(e) => setWorkingRadius(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base Hourly Rate (₹/hr)
                </label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Provider Bio & Technical Expertise
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Highlight your field experience, equipment, certifications, and emergency availability..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none leading-relaxed"
              />
            </div>
          </form>

          {/* KYC Form */}
          <form
            onSubmit={handleSubmitKyc}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Government Identity Verification (KYC)
                </h2>
                <p className="text-xs text-slate-400">
                  Required for the verified badge, client trust ranking, and direct payment settlements.
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  isVerified
                    ? "text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-xs font-semibold text-amber-700 bg-amber-50 border-amber-200"
                }
              >
                {isVerified ? "Status: Verified" : "Status: Pending Submission"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identity Document Type *
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Identification Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5432 1098 7654"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingKyc}
                className="h-8.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {isSubmittingKyc && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Submit Verification Documents</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── 10-STEP AI BOT CREATION WIZARD MODAL (Matching CreateAiBoatScreen) ── */}
      <Dialog open={isBotWizardOpen} onOpenChange={setIsBotWizardOpen}>
        <DialogContent className="sm:max-w-xl bg-white border border-slate-200 p-6 rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mb-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <Bot className="h-3.5 w-3.5 text-emerald-600" />
                <span>AI Assistant Wizard</span>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Step {wizardStep} of {wizardQuestions.length || 10}
              </span>
            </div>
            <DialogTitle className="text-lg font-extrabold text-slate-900 tracking-tight">
              {currentWizardQuestion?.question || "Configure AI Assistant"}
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1">
              {currentWizardQuestion?.subtitle ||
                "Select options to train your automated assistant."}
            </p>
            {/* Step progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(wizardStep / (wizardQuestions.length || 10)) * 100}%`,
                }}
              />
            </div>
          </DialogHeader>

          {/* Question Options */}
          <div className="py-4 space-y-2.5">
            {(currentWizardQuestion?.options || []).map((opt) => {
              const currentList = Array.isArray(selectedAnswers[wizardStep])
                ? selectedAnswers[wizardStep]
                : [];
              const isSelected = currentList.includes(opt.title);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleToggleWizardOption(opt.title)}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50/70 border-emerald-300 text-slate-900 font-bold shadow-2xs"
                      : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <span>{opt.title}</span>
                  <div
                    className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}

            {/* Optional "Other (Please specify)" option */}
            {currentWizardQuestion?.hasOtherSpecify && (
              <button
                type="button"
                onClick={() => handleToggleWizardOption("Other")}
                className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  (Array.isArray(selectedAnswers[wizardStep]) ? selectedAnswers[wizardStep] : []).includes("Other")
                    ? "bg-emerald-50/70 border-emerald-300 text-slate-900 font-bold shadow-2xs"
                    : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                }`}
              >
                <span>Other (Please specify)</span>
                <div
                  className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 ${
                    (Array.isArray(selectedAnswers[wizardStep]) ? selectedAnswers[wizardStep] : []).includes("Other")
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {(Array.isArray(selectedAnswers[wizardStep]) ? selectedAnswers[wizardStep] : []).includes("Other") && (
                    <Check className="h-3 w-3 stroke-[3]" />
                  )}
                </div>
              </button>
            )}

            {/* Optional Custom Note for this step */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Additional details / custom instructions for this step (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Free inspection for repeat customers..."
                value={customNoteInput}
                onChange={(e) => setCustomNoteInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevWizardStep}
              disabled={wizardStep === 1}
              className="h-9 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleNextWizardStep}
              disabled={isSavingBot}
              className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
            >
              {isSavingBot ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : wizardStep === wizardQuestions.length ? (
                <>
                  <span>Save & Activate Bot</span>
                  <Check className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── INTERACTIVE BOT TEST MODAL ────────────────────────────────────── */}
      <Dialog open={isTestBotOpen} onOpenChange={setIsTestBotOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-slate-200 p-6 rounded-3xl shadow-xl flex flex-col h-[560px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-slate-900 tracking-tight">
                  {botConfig?.botName || botConfig?.boatName || "AI Assistant Test"}
                </DialogTitle>
                <p className="text-xs text-slate-500">
                  Simulate client inquiries to test your bot&apos;s instant answers
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Quick Prompt Suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {[
              "What are your inspection charges?",
              "Do you provide emergency service?",
              "Can I book an appointment?",
              "What warranty do you offer?",
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSendTestQuery(prompt)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto my-3 p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
            {testMessages.map((msg, idx) => {
              const isMe = msg.sender === "user";
              return (
                <div
                  key={idx}
                  className={`flex gap-2 max-w-[85%] ${
                    isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isMe ? "bg-slate-900 text-white" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isMe ? "You" : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs whitespace-pre-line ${
                      isMe
                        ? "bg-slate-900 text-white rounded-tr-xs"
                        : "bg-white border border-slate-200 text-slate-900 rounded-tl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {isTestThinking && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Assistant is typing...</span>
              </div>
            )}
            <div ref={testChatEndRef} />
          </div>

          {/* Test Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendTestQuery(testInput);
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              placeholder="Type a test question..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <Button
              type="submit"
              disabled={!testInput.trim() || isTestThinking}
              className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MEMBER PROFILE: Standard Collection Profile (Matching ResponsiveProfileScreen)
// ─────────────────────────────────────────────────────────────────────────────

function CollectionMemberProfileView({
  collectionName,
  targetUserId,
}: {
  collectionName: string;
  targetUserId?: number;
}) {
  const { user } = useAuthStore();
  const router = useRouter();
  const isViewingOther = Boolean(targetUserId && targetUserId !== user?.id);

  const [profile, setProfile] = React.useState<MemberProfile | null>(null);
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(true);
  const [isActive, setIsActive] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const url = await memberProfileApi.uploadAvatar(collectionName, profile?.id || 0, file);
      if (url) {
        setProfile((prev) => (prev ? { ...prev, avatarUrl: url } : null));
        toast.success("Profile photo updated!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    if (isViewingOther && targetUserId) {
      memberProfileApi
        .getUserProfile(collectionName, targetUserId)
        .then((data) => {
          if (isMounted && data) {
            setProfile(data);
            setDisplayName(data.displayName);
            setBio(data.bio);
            setIsPublic(data.isPublic === "true");
            setIsActive(data.isActive === "true");
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      memberProfileApi
        .getMyProfile(collectionName, user || undefined)
        .then((data) => {
          if (isMounted && data) {
            setProfile(data);
            setDisplayName(data.displayName);
            setBio(data.bio);
            setIsPublic(data.isPublic === "true");
            setIsActive(data.isActive === "true");
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [collectionName, user, isViewingOther, targetUserId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    setIsSaving(true);
    const success = await memberProfileApi.updateProfile(collectionName, profile?.id || 0, {
      displayName,
      bio,
      isPublic,
      isActive,
    });
    setIsSaving(false);

    if (success) {
      toast.success(`${collectionName} member profile saved successfully!`);
    } else {
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading {collectionName} profile...</p>
      </div>
    );
  }

  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "NX";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      {/* ── 1. Profile Header ────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => {
                  if (!isViewingOther) avatarInputRef.current?.click();
                }}
                className={cn(
                  "h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-2xl border border-indigo-200 shrink-0 overflow-hidden relative",
                  !isViewingOther && "cursor-pointer"
                )}
              >
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  initials
                )}

                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}

                {!isViewingOther && !isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              {!isViewingOther && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors cursor-pointer border-2 border-white"
                  title="Change avatar"
                >
                  <Camera className="h-3 w-3" />
                </button>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {displayName || (isViewingOther ? "Member Profile" : user?.fullName || "Member Profile")}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold"
                      : "bg-slate-50 text-slate-600 border-slate-200 text-xs font-semibold"
                  }
                >
                  {isActive ? "Active Member" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {profile?.username ? `@${profile.username} · ` : ""}Member in {collectionName}
              </p>
            </div>
          </div>

          {isViewingOther ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="h-9 px-3 rounded-xl border-slate-200 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
              <Button
                onClick={() =>
                  router.push(
                    `/workspace/${collectionName}/chat?otherUserId=${targetUserId}&otherUserName=${encodeURIComponent(
                      displayName || "Member"
                    )}`
                  )
                }
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Chat</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-2xs shrink-0 cursor-pointer"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Save Profile</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. Member Dossier / Settings Form ─────────────────────────────── */}
      {isViewingOther ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Member Bio</h2>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
            {bio || "No bio has been added by this member yet."}
          </div>
          <div className="pt-2 text-xs text-slate-500">
            Registered member in {collectionName} collection workspace.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Dossier Details</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bio / Role Description</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share what you work on in this collection..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* Visibility Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Public Profile in {collectionName}</span>
                <span className="text-[11px] text-slate-400">
                  Allow other team members in this workspace to view your dossier and start chats.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isPublic ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
