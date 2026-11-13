"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileCheck,
  Building2,
  Calendar,
  ExternalLink,
  Loader2,
  Briefcase,
  Clock,
  Sparkles,
  ChevronRight,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobApplication } from "@/lib/types/job";
import { jobsApi } from "@/lib/api/jobs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FilterStatus = "all" | "applied" | "reviewing" | "shortlisted" | "interview" | "offered" | "rejected";

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "applied":
      return (
        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200 font-semibold">
          Applied
        </Badge>
      );
    case "reviewing":
      return (
        <Badge variant="warning" className="text-xs bg-amber-50 text-amber-700 border-amber-200 font-semibold">
          Under Review
        </Badge>
      );
    case "shortlisted":
      return (
        <Badge variant="brand" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold">
          Shortlisted
        </Badge>
      );
    case "interview":
      return (
        <Badge variant="brand" className="text-xs bg-purple-50 text-purple-700 border-purple-200 font-semibold">
          Interview Scheduled
        </Badge>
      );
    case "offered":
      return (
        <Badge variant="success" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
          Offer Extended
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="text-xs bg-rose-50 text-rose-700 border-rose-200 font-semibold">
          Not Selected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs font-semibold">
          {status}
        </Badge>
      );
  }
}

export default function MyApplicationsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace as string) || "techform";

  const [applications, setApplications] = React.useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    setIsLoading(true);
    jobsApi
      .getMyApplications({ collection: workspaceSlug })
      .then((apps) => {
        setApplications(apps);
      })
      .catch(() => {
        toast.error("Failed to load your applications");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [workspaceSlug]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recently";
    }
  };

  // Status counts
  const counts = React.useMemo(() => {
    const res: Record<FilterStatus, number> = {
      all: applications.length,
      applied: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      offered: 0,
      rejected: 0,
    };
    applications.forEach((app) => {
      const s = app.status.toLowerCase() as FilterStatus;
      if (res[s] !== undefined) {
        res[s] += 1;
      }
    });
    return res;
  }, [applications]);

  // Filtered applications
  const filteredApps = React.useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (activeFilter !== "all" && app.status.toLowerCase() !== activeFilter) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (app.jobTitle || "").toLowerCase();
        const company = (app.companyName || "").toLowerCase();
        const cover = (app.coverLetter || "").toLowerCase();
        return title.includes(q) || company.includes(q) || cover.includes(q);
      }
      return true;
    });
  }, [applications, activeFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200">
            <Sparkles className="h-3 w-3" />
            <span>Application Tracking</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Job Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status updates, review interview timelines, and monitor recruiter decisions across Techform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/workspace/${workspaceSlug}/company`}>
            <Button size="sm" variant="outline" className="text-xs gap-1.5 border-slate-200 h-9">
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Companies</span>
            </Button>
          </Link>
          <Link href={`/workspace/${workspaceSlug}/jobs`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-9 shadow-2xs">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Explore Jobs</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(
              [
                { id: "all", label: "All" },
                { id: "applied", label: "Applied" },
                { id: "reviewing", label: "Under Review" },
                { id: "shortlisted", label: "Shortlisted" },
                { id: "interview", label: "Interview" },
                { id: "offered", label: "Offered" },
                { id: "rejected", label: "Not Selected" },
              ] as const
            ).map((tab) => {
              const count = counts[tab.id];
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                    isActive
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by role or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs text-slate-500 font-medium">Retrieving submitted applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl">
          <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-slate-800">
            No applications submitted yet
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
            You haven&apos;t applied to any job openings in this workspace yet. Check out the latest technical opportunities.
          </p>
          <Link href={`/workspace/${workspaceSlug}/jobs`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
              Browse Open Positions
            </Button>
          </Link>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-800">No applications found</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-3">
            No applications match your selected filter &ldquo;{activeFilter}&rdquo; or search query.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveFilter("all");
              setSearchQuery("");
            }}
            className="text-xs"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-50 text-indigo-700 border border-slate-200 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                  {app.companyLogo ? (
                    <img
                      src={app.companyLogo}
                      alt={app.companyName || "Company"}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  ) : (
                    <span>{app.companyName?.charAt(0).toUpperCase() || "C"}</span>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-slate-900">
                      {app.jobTitle || (app.jobId ? `Position #${app.jobId}` : "Applied Position")}
                    </h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {app.companyName || "TechForm Partner"}
                    </span>
                    {app.jobLocation && (
                      <>
                        <span>•</span>
                        <span>{app.jobLocation}</span>
                      </>
                    )}
                    {app.employmentType && (
                      <>
                        <span>•</span>
                        <span>{app.employmentType}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="h-3 w-3" />
                      Applied on {formatDate(app.createdAt)}
                    </span>
                  </div>
                  {app.coverLetter && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700 block mb-0.5">Cover Letter:</span>
                      <p className="line-clamp-2 italic leading-relaxed text-[11px]">
                        &ldquo;{app.coverLetter}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                {app.resumeSnapshotUrl && (
                  <a
                    href={app.resumeSnapshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8.5 border-slate-200">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <span>Resume Snapshot</span>
                    </Button>
                  </a>
                )}
                <Link href={`/workspace/${workspaceSlug}/jobs?jobId=${app.jobId}`}>
                  <Button
                    size="sm"
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold gap-1 h-8.5 cursor-pointer shadow-2xs"
                  >
                    <span>View Role</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
