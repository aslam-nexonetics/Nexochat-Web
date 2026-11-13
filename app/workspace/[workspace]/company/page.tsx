"use client";

import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Users,
  Globe,
  Briefcase,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Mail,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyInfo, Job } from "@/lib/types/job";
import { jobsApi } from "@/lib/api/jobs";
import { ApplyDialog } from "@/components/jobs/apply-dialog";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WorkspaceCompanyProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceSlug = (params?.workspace as string) || "techform";

  const targetIdParam = searchParams.get("id");
  const targetNameParam = searchParams.get("name");

  const { activeCollection, collections, selectCollectionByName } = useWorkspaceStore();

  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  const [companies, setCompanies] = React.useState<CompanyInfo[]>([]);
  const [allJobs, setAllJobs] = React.useState<Job[]>([]);
  const [selectedCompany, setSelectedCompany] = React.useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [directorySearch, setDirectorySearch] = React.useState("");
  const [selectedIndustry, setSelectedIndustry] = React.useState("");
  const [applyingJob, setApplyingJob] = React.useState<Job | null>(null);

  const isTechform = workspaceSlug.toLowerCase().includes("techform");

  // Load companies & jobs
  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const jobsCollection = isTechform ? workspaceSlug : "techform";
        const [compList, jobsRes] = await Promise.all([
          jobsApi.getCompanies({ collection: jobsCollection }).catch(() => []),
          jobsApi.getJobs({ collection: jobsCollection, limit: 100 }).catch(() => ({ jobs: [] })),
        ]);

        if (!isMounted) return;

        setCompanies(compList);
        setAllJobs(jobsRes.jobs || []);

        // Resolve active company from query params or fallback
        if (targetIdParam) {
          const match = compList.find((c) => String(c.id) === String(targetIdParam));
          if (match) {
            setSelectedCompany(match);
          } else if (targetNameParam) {
            setSelectedCompany({
              id: parseInt(targetIdParam, 10) || undefined,
              name: targetNameParam,
              description: "Technology organization delivering scalable solutions and engineering excellence.",
              industry: "Information Technology",
              size: "50-200 Employees",
              website: "",
            });
          }
        } else if (targetNameParam) {
          const match = compList.find(
            (c) => c.name.toLowerCase().trim() === targetNameParam.toLowerCase().trim()
          );
          if (match) {
            setSelectedCompany(match);
          } else {
            setSelectedCompany({
              name: targetNameParam,
              description: "Technology organization delivering scalable solutions and engineering excellence.",
              industry: "Technology & Software",
              size: "50-200 Employees",
              website: "",
            });
          }
        } else {
          // If non-techform workspace (e.g. nexonetics), check for matching company in compList or create org profile
          const orgName =
            activeCollection?.collectionName ||
            workspaceSlug.charAt(0).toUpperCase() + workspaceSlug.slice(1);

          const matchOrg = compList.find(
            (c) =>
              c.name.toLowerCase().trim() === orgName.toLowerCase().trim() ||
              c.name.toLowerCase().trim() === workspaceSlug.toLowerCase().trim()
          );

          if (matchOrg) {
            setSelectedCompany(matchOrg);
          } else if (!isTechform) {
            setSelectedCompany({
              name: orgName,
              description:
                "We are an engineering-driven software venture delivering state-of-the-art mobile and cloud solutions. We craft scalable digital systems, empower tech talent, and partner with innovators to transform complex challenges into fluid user experiences.",
              industry: "Engineering & Technology",
              location: "Kaloor, Kochi",
              website: "nexonetics.com",
              size: "10-50 Employees",
            });
          } else if (compList.length > 0) {
            setSelectedCompany(compList[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load company profile data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [workspaceSlug, isTechform, activeCollection, targetIdParam, targetNameParam]);

  // Compute jobs for selected company
  const companyJobs = React.useMemo(() => {
    if (!selectedCompany) return [];
    return allJobs.filter((j) => {
      if (selectedCompany.id && j.companyInfo?.id === selectedCompany.id) return true;
      if (
        selectedCompany.name &&
        j.company.toLowerCase().trim() === selectedCompany.name.toLowerCase().trim()
      )
        return true;
      return false;
    });
  }, [selectedCompany, allJobs]);

  // Unique industries for directory filter
  const industries = React.useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set);
  }, [companies]);

  // Filtered companies for directory
  const filteredCompanies = React.useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        !directorySearch ||
        c.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
        c.description?.toLowerCase().includes(directorySearch.toLowerCase()) ||
        c.location?.toLowerCase().includes(directorySearch.toLowerCase());
      const matchIndustry = !selectedIndustry || c.industry === selectedIndustry;
      return matchSearch && matchIndustry;
    });
  }, [companies, directorySearch, selectedIndustry]);

  const handleSelectCompany = (comp: CompanyInfo) => {
    setSelectedCompany(comp);
    router.push(
      `/workspace/${workspaceSlug}/company?id=${comp.id || ""}&name=${encodeURIComponent(comp.name)}`
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading company profiles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* ── Top Bar: Back to Jobs & Directory Toggle ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {isTechform ? (
          <div className="flex items-center gap-2">
            <Link href={`/workspace/${workspaceSlug}/jobs`}>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8.5 gap-1.5 border-slate-200 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Job Listings</span>
              </Button>
            </Link>

            <Link href={`/workspace/${workspaceSlug}/applications`}>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8.5 gap-1.5 border-slate-200 cursor-pointer"
              >
                <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                <span>My Applications</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              <Building2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>{selectedCompany?.name || "Company Overview"}</span>
            </div>
          </div>
        )}

        {/* Company Quick Switcher Pills */}
        {companies.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Top Companies:
            </span>
            {companies.slice(0, 4).map((c) => {
              const isActive = selectedCompany?.name === c.name;
              return (
                <button
                  key={c.id || c.name}
                  onClick={() => handleSelectCompany(c)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors shrink-0 cursor-pointer",
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedCompany ? (
        /* ── Active Company Detailed View ───────────────────────────────── */
        <div className="space-y-6">
          {/* 1. Header Card with Banner & Identity */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            {/* Banner Background */}
            <div className="h-32 sm:h-44 w-full bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent" />
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-md text-[11px]">
                  {selectedCompany.industry || "Technology"}
                </Badge>
              </div>
            </div>

            {/* Profile Bar */}
            <div className="p-6 sm:p-8 pt-0 relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-12 sm:-mt-16 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  {/* Company Logo / Avatar */}
                  <div className="h-24 w-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center font-extrabold text-3xl text-indigo-700 overflow-hidden shrink-0">
                    {selectedCompany.logoUrl ? (
                      <img
                        src={selectedCompany.logoUrl}
                        alt={selectedCompany.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{selectedCompany.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Title & Badges */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {selectedCompany.name}
                      </h1>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold gap-1 py-0.5"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Verified Organization</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedCompany.industry || "Information Technology"} · Founded{" "}
                      {selectedCompany.founded || "2020"}
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/workspace/${workspaceSlug}/chat?otherUserName=${encodeURIComponent(
                      selectedCompany.name
                    )}`}
                  >
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 h-9 px-4 rounded-xl shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Contact Recruitment</span>
                    </Button>
                  </Link>

                  {selectedCompany.website && (
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-9 px-3 rounded-xl border-slate-200 cursor-pointer gap-1.5"
                      >
                        <Globe className="h-3.5 w-3.5 text-slate-500" />
                        <span>Website</span>
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {/* Meta Stats Bar */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Headquarters
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>{selectedCompany.location || "Kochi, Kerala, India"}</span>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Company Size
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 truncate">
                    <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>{selectedCompany.size || "50 - 200 Employees"}</span>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Active Openings
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>{companyJobs.length} Vacancies</span>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Recruitment Status
                  </span>
                  <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>Actively Hiring</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Main 2-Column Section: About vs Jobs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 1 Col: Company Overview & Details */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <span>About {selectedCompany.name}</span>
                </h2>
                <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {selectedCompany.description ||
                    "Engineering-driven technology enterprise developing advanced web, mobile, and cloud software. Focused on building scalable distributed architectures and empowering talent."}
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                  {selectedCompany.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <a
                        href={`mailto:${selectedCompany.email}`}
                        className="hover:text-indigo-600 truncate"
                      >
                        {selectedCompany.email}
                      </a>
                    </div>
                  )}

                  {selectedCompany.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{selectedCompany.phone}</span>
                    </div>
                  )}

                  {selectedCompany.website && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-indigo-600 truncate"
                      >
                        {selectedCompany.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right 2 Cols: Active Job Openings */}
            <div className="space-y-4 lg:col-span-2">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-indigo-600" />
                      <span>Open Opportunities at {selectedCompany.name}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Explore current openings and submit your application directly.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {companyJobs.length} Roles
                  </Badge>
                </div>

                {companyJobs.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                    <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      No current open positions
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      {selectedCompany.name} is not actively recruiting for public roles at this moment. You can check back soon or browse other tech companies.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {companyJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 truncate">
                              {job.title}
                            </h3>
                            {job.isRemote && (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                Remote
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {job.location}
                            </span>
                            <span>•</span>
                            <span>{job.jobType}</span>
                            <span>•</span>
                            <span>{job.experienceLevel}</span>
                            {job.salary && (
                              <>
                                <span>•</span>
                                <span className="font-bold text-slate-800">{job.salary}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/workspace/${workspaceSlug}/jobs?jobId=${job.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8.5 px-3 border-slate-200 cursor-pointer"
                            >
                              <span>View Role</span>
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>

                          {job.has_applied ? (
                            <Badge variant="success" className="h-8.5 px-3 text-xs gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Applied
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setApplyingJob(job)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8.5 px-3.5 font-semibold shadow-2xs cursor-pointer"
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── All Companies Directory View ─────────────────────────────────── */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200">
                <Sparkles className="h-3 w-3" />
                <span>Techform Hiring Network</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Partner Companies & Enterprises
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Discover engineering venture studios, tech companies, and product teams actively recruiting on Techform.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search company by name, description, location..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {industries.length > 0 && (
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="">All Industries</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompanies.map((c) => {
              const openCount = allJobs.filter(
                (j) => j.company.toLowerCase() === c.name.toLowerCase()
              ).length;

              return (
                <div
                  key={c.id || c.name}
                  onClick={() => handleSelectCompany(c)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-extrabold text-lg shadow-2xs group-hover:scale-105 transition-transform">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <Badge variant="outline" className="text-[10px] text-slate-500 font-medium">
                        {c.industry || "Technology"}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {c.description ||
                          "Engineering and software development company building scalable systems."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {c.location || "India"}
                    </span>
                    <span className="font-semibold text-indigo-600 text-xs">
                      {openCount} Openings →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Apply Dialog */}
      <ApplyDialog
        job={applyingJob}
        isOpen={!!applyingJob}
        onClose={() => setApplyingJob(null)}
        onSuccess={() => {
          if (applyingJob) {
            applyingJob.has_applied = true;
            setAllJobs([...allJobs]);
          }
        }}
      />
    </div>
  );
}
