"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  Building2,
  Briefcase,
  Clock,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Loader2,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Job, JobFilter } from "@/lib/types/job";
import { jobsApi } from "@/lib/api/jobs";
import { ApplyDialog } from "@/components/jobs/apply-dialog";
import { GigJobsMarketplaceView } from "@/components/gig/jobs-marketplace";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function JobsBrowserPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = (params?.workspace as string) || "techform";
  const urlJobId = searchParams.get("jobId");

  if (workspaceSlug.toLowerCase().includes("gig")) {
    return <GigJobsMarketplaceView />;
  }

  // State
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isApplyOpen, setIsApplyOpen] = React.useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false);
  const [onlySaved, setOnlySaved] = React.useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [workplaceType, setWorkplaceType] = React.useState<string>("");
  const [jobType, setJobType] = React.useState<string>("");
  const [experienceLevel, setExperienceLevel] = React.useState<string>("");

  const loadJobs = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const filter: JobFilter = {
        searchQuery: searchQuery || undefined,
        workplaceType: (workplaceType as any) || undefined,
        employmentType: jobType || undefined,
        experienceLevel: experienceLevel || undefined,
      };

      const res = await jobsApi.getJobs({
        collection: workspaceSlug,
        filter,
        page: 1,
        limit: 50,
      });

      setJobs(res.jobs);

      // Deep link to jobId if present in query param
      if (res.jobs.length > 0) {
        if (urlJobId) {
          const match = res.jobs.find(
            (j) => String(j.id) === String(urlJobId)
          );
          if (match) {
            setSelectedJob(match);
            setMobileDetailOpen(true);
          } else {
            setSelectedJob(res.jobs[0]);
          }
        } else if (!selectedJob) {
          setSelectedJob(res.jobs[0]);
        }
      }
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug, searchQuery, workplaceType, jobType, experienceLevel, selectedJob, urlJobId]);

  React.useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleToggleBookmark = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    try {
      if (job.is_bookmarked) {
        await jobsApi.removeBookmark(job.id, workspaceSlug);
        job.is_bookmarked = false;
        toast.info("Job removed from bookmarks");
      } else {
        await jobsApi.bookmarkJob(job.id, workspaceSlug);
        job.is_bookmarked = true;
        toast.success("Job bookmarked!");
      }
      setJobs([...jobs]);
      if (selectedJob?.id === job.id) {
        setSelectedJob({ ...job });
      }
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const displayedJobs = onlySaved ? jobs.filter((j) => j.is_bookmarked) : jobs;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      {/* 1. Top Filter & Search Bar */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by job title, company, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Workplace filter */}
            <select
              value={workplaceType}
              onChange={(e) => setWorkplaceType(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Workplace Types</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>

            {/* Employment Type */}
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>

            {/* Experience Level */}
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Experience</option>
              <option value="Entry-level">Entry-level</option>
              <option value="Mid-level">Mid-level</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
            </select>

            {/* Saved Toggle */}
            <Button
              variant={onlySaved ? "secondary" : "outline"}
              size="sm"
              onClick={() => setOnlySaved(!onlySaved)}
              className={cn(
                "text-xs h-8 gap-1.5 border-slate-200 cursor-pointer px-2.5",
                onlySaved && "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              )}
            >
              <Bookmark className={cn("h-3.5 w-3.5", onlySaved && "fill-amber-500 text-amber-500")} />
              <span>Saved</span>
            </Button>

            {/* Quick Link to My Applications */}
            <Link href={`/workspace/${workspaceSlug}/applications`}>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 border-slate-200 cursor-pointer px-2.5">
                <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span>My Applications</span>
              </Button>
            </Link>

            {/* Quick Link to Companies Directory */}
            <Link href={`/workspace/${workspaceSlug}/company`}>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 border-slate-200 cursor-pointer px-2.5">
                <Building2 className="h-3.5 w-3.5 text-slate-600" />
                <span>Companies</span>
              </Button>
            </Link>

            {(workplaceType || jobType || experienceLevel || searchQuery || onlySaved) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setWorkplaceType("");
                  setJobType("");
                  setExperienceLevel("");
                  setOnlySaved(false);
                }}
                className="text-xs h-8 text-rose-600 hover:text-rose-700 px-2 cursor-pointer"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main 2-Pane Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Job List */}
        <div
          className={cn(
            "w-full lg:w-[420px] xl:w-[460px] shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-y-auto",
            mobileDetailOpen ? "hidden lg:flex" : "flex"
          )}
        >
          <div className="p-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span className="font-semibold text-slate-700">
              {displayedJobs.length} {onlySaved ? "Saved Positions" : "Positions Available"}
            </span>
            <span className="text-[11px] text-slate-400">Sorted by Recent</span>
          </div>

          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs text-slate-500">Loading open positions...</p>
            </div>
          ) : displayedJobs.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                {onlySaved ? "No saved jobs" : "No matching jobs found"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {onlySaved
                  ? "You haven't bookmarked any job vacancies yet."
                  : "Try adjusting your search criteria or resetting filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                const companyInitial = job.company?.charAt(0).toUpperCase() || "C";

                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      setSelectedJob(job);
                      setMobileDetailOpen(true);
                    }}
                    className={cn(
                      "p-4 cursor-pointer transition-all relative border-l-4",
                      isSelected
                        ? "bg-indigo-50/60 border-l-indigo-600"
                        : "hover:bg-slate-50/80 border-l-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 truncate">
                        <Link
                          href={`/workspace/${workspaceSlug}/company?id=${job.companyInfo?.id || ""}&name=${encodeURIComponent(job.company)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200 transition-colors"
                          title="View Company"
                        >
                          {companyInitial}
                        </Link>
                        <div className="truncate">
                          <h3 className="font-bold text-xs text-slate-900 truncate">
                            {job.title}
                          </h3>
                          <Link
                            href={`/workspace/${workspaceSlug}/company?id=${job.companyInfo?.id || ""}&name=${encodeURIComponent(job.company)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium truncate mt-0.5 inline-block transition-colors"
                          >
                            {job.company}
                          </Link>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleToggleBookmark(e, job)}
                        className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-100 transition-colors shrink-0"
                        title={job.is_bookmarked ? "Bookmarked" : "Bookmark"}
                      >
                        {job.is_bookmarked ? (
                          <BookmarkCheck className="h-4 w-4 text-amber-500 fill-amber-500" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Metadata Badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600">
                        {job.jobType}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600">
                        {job.experienceLevel}
                      </span>
                      {job.isRemote && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          Remote
                        </span>
                      )}
                      {job.salary && (
                        <span className="ml-auto text-[11px] font-bold text-slate-900">
                          {job.salary}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Selected Job Details */}
        <div
          className={cn(
            "flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8",
            mobileDetailOpen ? "flex flex-col" : "hidden lg:flex flex-col"
          )}
        >
          {selectedJob ? (
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {/* Mobile Back Button */}
              <div className="lg:hidden mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileDetailOpen(false)}
                  className="text-xs gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Job Listings
                </Button>
              </div>

              {/* Main Job Banner Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Link
                      href={`/workspace/${workspaceSlug}/company?id=${selectedJob.companyInfo?.id || ""}&name=${encodeURIComponent(selectedJob.company)}`}
                      className="h-14 w-14 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl border border-indigo-100 shadow-xs transition-colors shrink-0"
                      title="View Company Profile"
                    >
                      {selectedJob.company?.charAt(0).toUpperCase() || "C"}
                    </Link>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        {selectedJob.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                        <Link
                          href={`/workspace/${workspaceSlug}/company?id=${selectedJob.companyInfo?.id || ""}&name=${encodeURIComponent(selectedJob.company)}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                        >
                          <span>{selectedJob.company}</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </Link>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {selectedJob.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          Posted {formatDate(selectedJob.postedDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleToggleBookmark(e, selectedJob)}
                      className="text-xs h-9 border-slate-200"
                    >
                      {selectedJob.is_bookmarked ? (
                        <BookmarkCheck className="h-4 w-4 text-amber-500 fill-amber-500 mr-1.5" />
                      ) : (
                        <Bookmark className="h-4 w-4 mr-1.5" />
                      )}
                      {selectedJob.is_bookmarked ? "Bookmarked" : "Bookmark"}
                    </Button>

                    {selectedJob.has_applied ? (
                      <Badge variant="success" className="h-9 px-3 text-xs gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Applied
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setIsApplyOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 font-semibold shadow-xs"
                      >
                        Apply Now
                      </Button>
                    )}
                  </div>
                </div>

                {/* Quick Attributes Grid */}
                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Salary</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {selectedJob.salary || "Competitive"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Job Type</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {selectedJob.jobType}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Experience</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {selectedJob.experienceLevel}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Deadline</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {formatDate(selectedJob.deadline)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Description Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Role Overview
                  </h2>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedJob.description || "No description provided for this job listing."}
                  </div>
                </div>

                {selectedJob.requirements && (
                  <div className="pt-4 border-t border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Key Requirements
                    </h2>
                    <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {selectedJob.requirements}
                    </div>
                  </div>
                )}

                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Required Skills & Competencies
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs px-2.5 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* About Company Card */}
              {selectedJob.companyInfo && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        About {selectedJob.companyInfo.name || selectedJob.company}
                      </h2>
                    </div>

                    <Link
                      href={`/workspace/${workspaceSlug}/company?id=${selectedJob.companyInfo.id || ""}&name=${encodeURIComponent(selectedJob.companyInfo.name || selectedJob.company)}`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 gap-1.5 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 font-semibold cursor-pointer"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        <span>View Company Profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedJob.companyInfo.description ||
                      "Leading organization leveraging innovative technologies to solve complex problems."}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Industry</span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedJob.companyInfo.industry || "Technology"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Company Size</span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedJob.companyInfo.size || "50-200 employees"}
                      </p>
                    </div>
                    {selectedJob.companyInfo.website && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Website</span>
                        <p className="mt-0.5">
                          <a
                            href={selectedJob.companyInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            Visit Site
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Briefcase className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-sm text-slate-800">
                Select a position from the left
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose an open vacancy to read full job specifications, company insights, and submit your application.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Apply Dialog */}
      <ApplyDialog
        job={selectedJob}
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={() => {
          if (selectedJob) {
            selectedJob.has_applied = true;
            setSelectedJob({ ...selectedJob });
          }
        }}
      />
    </div>
  );
}
