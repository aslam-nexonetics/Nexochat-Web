"use client";

import * as React from "react";
import { useParams } from "next/navigation";
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
import { GigProvider, GigBotConfig, GigBotReply } from "@/lib/types/gig";
import {
  GigBoatQuestionsService,
  GigBoatQuestion,
  GigBotKnowledgeEngine,
} from "@/lib/api/gig-bot";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";

export default function WorkspaceProfileDispatcherPage() {
  const params = useParams();
  const workspaceSlug = ((params?.workspace as string) || "techform").toLowerCase().trim();

  const { activeCollection, collections, selectCollectionByName } = useWorkspaceStore();

  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  // Dispatch appropriate profile screen matching Flutter home_page.dart:
  // 1. Techform -> Candidate CV / Job Profile
  if (workspaceSlug.includes("techform")) {
    return <TechformCandidateProfileView />;
  }

  // 2. GIG -> Provider Registration & KYC Profile
  if (workspaceSlug.includes("gig")) {
    return <GigProviderProfileView />;
  }

  // 3. Nexonetics, Shalabam, and other collections -> Member Profile Dossier
  return <CollectionMemberProfileView collectionName={workspaceSlug} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TECHFORM: Job Candidate Profile & CV View (Matching ResponsiveJobProfileScreen)
// ─────────────────────────────────────────────────────────────────────────────

function TechformCandidateProfileView() {
  const { user } = useAuthStore();
  const [profile, setProfile] = React.useState<JobProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingSummary, setIsSavingSummary] = React.useState(false);
  const [isUploadingResume, setIsUploadingResume] = React.useState(false);

  // Form states for summary
  const [summary, setSummary] = React.useState("");
  const [currentPosition, setCurrentPosition] = React.useState("");
  const [desiredPosition, setDesiredPosition] = React.useState("");
  const [isAvailable, setIsAvailable] = React.useState(true);

  // Dialogs
  const [isExpOpen, setIsExpOpen] = React.useState(false);
  const [isEduOpen, setIsEduOpen] = React.useState(false);
  const [skillInput, setSkillInput] = React.useState("");
  const [isAddingSkill, setIsAddingSkill] = React.useState(false);

  // New experience form
  const [newExp, setNewExp] = React.useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  // New education form
  const [newEdu, setNewEdu] = React.useState({
    degree: "",
    fieldOfStudy: "",
    school: "",
    startDate: "",
    endDate: "",
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
        setProfile(updated);
        toast.success("Profile headline & summary updated successfully!");
      }
    } catch (err) {
      toast.error("Failed to update profile summary");
    } finally {
      setIsSavingSummary(false);
    }
  };

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
    } catch (err) {
      toast.error("Failed to upload resume");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.title || !newExp.company) {
      toast.error("Job title and company are required");
      return;
    }

    try {
      await jobsApi.addExperience({
        title: newExp.title,
        company: newExp.company,
        location: newExp.location,
        startDate: newExp.startDate,
        endDate: newExp.isCurrent ? undefined : newExp.endDate,
        isCurrent: newExp.isCurrent,
        description: newExp.description,
      });
      await loadProfile();
      setIsExpOpen(false);
      setNewExp({
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
      });
      toast.success("Experience record added!");
    } catch (err) {
      toast.error("Failed to add experience");
    }
  };

  const handleDeleteExperience = async (id?: string) => {
    if (!id) return;
    try {
      await jobsApi.deleteExperience(id);
      await loadProfile();
      toast.success("Experience removed");
    } catch (err) {
      toast.error("Failed to delete experience");
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEdu.degree || !newEdu.school) {
      toast.error("Degree and school are required");
      return;
    }

    try {
      await jobsApi.addEducation({
        degree: newEdu.degree,
        fieldOfStudy: newEdu.fieldOfStudy,
        school: newEdu.school,
        startDate: newEdu.startDate,
        endDate: newEdu.endDate,
      });
      await loadProfile();
      setIsEduOpen(false);
      setNewEdu({
        degree: "",
        fieldOfStudy: "",
        school: "",
        startDate: "",
        endDate: "",
      });
      toast.success("Education record added!");
    } catch (err) {
      toast.error("Failed to add education");
    }
  };

  const handleDeleteEducation = async (id?: string) => {
    if (!id) return;
    try {
      await jobsApi.deleteEducation(id);
      await loadProfile();
      toast.success("Education removed");
    } catch (err) {
      toast.error("Failed to delete education");
    }
  };

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
      await jobsApi.addSkill({ name, level: "Intermediate" });
      await loadProfile();
      setSkillInput("");
      toast.success("Skill added!");
    } catch (err) {
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
    } catch (err) {
      toast.error("Failed to remove skill");
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading Candidate CV...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
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
                <span>Upload PDF Resume</span>
              </div>
            </label>
          </div>
        </div>

        {/* Resume Status Notice */}
        {profile?.resumeUrl && (
          <div className="mt-6 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>Resume PDF file attached to your recruitment dossier</span>
            </div>
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 shrink-0"
            >
              <span>View Resume</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* ── Summary & Roles Form ────────────────────────────────────────── */}
      <form
        onSubmit={handleSaveSummary}
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Career Summary</h2>
          <Button
            type="submit"
            size="sm"
            disabled={isSavingSummary}
            className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1 shadow-2xs"
          >
            {isSavingSummary ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            <span>Save Summary</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Role / Title
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={currentPosition}
              onChange={(e) => setCurrentPosition(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
              onChange={(e) => setDesiredPosition(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
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
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed"
          />
        </div>
      </form>

      {/* ── Skills Chips ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-2 tracking-tight">Key Skills</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {(profile?.skills || []).map((skill) => (
            <span
              key={skill.id || skill.name}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700"
            >
              <span>{skill.name}</span>
              {skill.id && (
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>

        <form onSubmit={handleAddSkill} className="flex items-center gap-2 max-w-sm">
          <input
            type="text"
            placeholder="Add skill (e.g. React, Docker)..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!skillInput.trim() || isAddingSkill}
            className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
          >
            Add
          </Button>
        </form>
      </div>

      {/* ── Work Experience ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Work Experience</h2>
          <Button
            size="sm"
            onClick={() => setIsExpOpen(true)}
            className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Position</span>
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {(profile?.experiences || []).length === 0 ? (
            <p className="py-4 text-xs text-slate-400 italic">No work experience added yet.</p>
          ) : (
            (profile?.experiences || []).map((exp) => (
              <div key={exp.id || exp.title} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{exp.title}</h3>
                  <p className="text-xs font-medium text-indigo-600">{exp.company} {exp.location ? `· ${exp.location}` : ""}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate || "Present"}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{exp.description}</p>
                  )}
                </div>
                {exp.id && (
                  <button
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Education ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Education</h2>
          <Button
            size="sm"
            onClick={() => setIsEduOpen(true)}
            className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Education</span>
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {(profile?.educations || []).length === 0 ? (
            <p className="py-4 text-xs text-slate-400 italic">No education records added yet.</p>
          ) : (
            (profile?.educations || []).map((edu) => (
              <div key={edu.id || edu.degree} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                  </h3>
                  <p className="text-xs font-medium text-slate-600">{edu.school}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {edu.startDate} - {edu.endDate || "Present"}
                  </p>
                </div>
                {edu.id && (
                  <button
                    onClick={() => handleDeleteEducation(edu.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Experience Dialog */}
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
                value={newExp.title}
                onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company *</label>
              <input
                type="text"
                required
                value={newExp.company}
                onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="text"
                  placeholder="e.g. Jan 2022"
                  value={newExp.startDate}
                  onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="text"
                  placeholder="e.g. Present"
                  value={newExp.endDate}
                  disabled={newExp.isCurrent}
                  onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
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

      {/* Education Dialog */}
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
                value={newEdu.degree}
                onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institution / School *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cochin University"
                value={newEdu.school}
                onChange={(e) => setNewEdu({ ...newEdu, school: e.target.value })}
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GIG: Provider Registration & KYC Profile View (Matching GigScreen.register)
// ─────────────────────────────────────────────────────────────────────────────

function GigProviderProfileView() {
  const { user } = useAuthStore();
  const [provider, setProvider] = React.useState<GigProvider | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);

  // Form states
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [category, setCategory] = React.useState("Electrician");
  const [city, setCity] = React.useState("Kochi");
  const [area, setArea] = React.useState("Kaloor");
  const [workingRadius, setWorkingRadius] = React.useState("15");
  const [hourlyRate, setHourlyRate] = React.useState("350");
  const [bio, setBio] = React.useState("");
  const [isAvailableNow, setIsAvailableNow] = React.useState(true);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = React.useState(false);

  // KYC Verification fields
  const [idType, setIdType] = React.useState("Aadhaar Card");
  const [idNumber, setIdNumber] = React.useState("");
  const [idFrontUrl, setIdFrontUrl] = React.useState("");
  const [selfieUrl, setSelfieUrl] = React.useState("");
  const [isSubmittingKyc, setIsSubmittingKyc] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

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
        setCategory(data.specialization);
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
    try {
      if (provider) {
        const updated = await gigApi.updateProvider({
          firstName,
          lastName,
          specialization: category,
          bio,
          city,
          area,
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
          specialization: category,
          bio,
          city,
          area,
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

  // Bot Wizard Handlers
  const handleOpenBotWizard = () => {
    const spec = category || provider?.specialization || "Electrician";
    const pName =
      `${firstName || provider?.firstName || ""} ${lastName || provider?.lastName || ""}`.trim() ||
      provider?.fullName ||
      "Provider";
    const questions = GigBoatQuestionsService.getQuestionsForSpecialization(spec, pName);
    setWizardQuestions(questions);
    setWizardStep(1);

    if (botConfig?.answers) {
      setSelectedAnswers(botConfig.answers);
      setCustomNotes(botConfig.customSpecifications || {});
      setCustomNoteInput(botConfig.customSpecifications?.[1] || "");
    } else {
      if (questions.length > 0 && questions[0].options.length > 0) {
        setSelectedAnswers({
          1: [questions[0].options[0].title, questions[0].options[1]?.title].filter(Boolean),
        });
      }
      setCustomNoteInput("");
    }
    setIsBotWizardOpen(true);
  };

  const currentWizardQuestion = wizardQuestions[wizardStep - 1] || wizardQuestions[0];

  const handleToggleWizardOption = (optionTitle: string) => {
    if (!currentWizardQuestion) return;
    const isMulti = currentWizardQuestion.isMultiSelect;
    const current = selectedAnswers[wizardStep] || [];

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
    const current = selectedAnswers[wizardStep] || [];
    if (current.length === 0) {
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
    const spec = category || provider?.specialization || "Electrician";
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
      selected_options: selectedAnswers[q.step] || [],
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
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Trade & Coverage Configuration
            </h2>

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
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                >
                  <option value="Electrician">Electrician & Wiring</option>
                  <option value="Plumber">Plumbing & Sanitary</option>
                  <option value="AC Service">AC Service & Maintenance</option>
                  <option value="Carpentry">Carpentry & Woodwork</option>
                  <option value="Appliances">Home Appliance Repair</option>
                  <option value="Cleaning">Deep Cleaning Services</option>
                </select>
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
              const isSelected = (selectedAnswers[wizardStep] || []).includes(opt.title);
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

function CollectionMemberProfileView({ collectionName }: { collectionName: string }) {
  const { user } = useAuthStore();
  const [profile, setProfile] = React.useState<MemberProfile | null>(null);
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(true);
  const [isActive, setIsActive] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

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

    return () => {
      isMounted = false;
    };
  }, [collectionName, user]);

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
            <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-2xl border border-indigo-200 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {displayName || user?.fullName || "Member Profile"}
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
                @{user?.username} · Member in {collectionName}
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-2xs shrink-0"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            <span>Save Profile</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Member Settings Form ──────────────────────────────────────── */}
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
    </div>
  );
}
