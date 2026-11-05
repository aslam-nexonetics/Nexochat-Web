"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Briefcase,
  Users,
  Plus,
  Search,
  ExternalLink,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Building2,
  MapPin,
  Calendar,
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
import { Job, JobApplication } from "@/lib/types/job";
import { jobsApi } from "@/lib/api/jobs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  "Applied",
  "Reviewing",
  "Shortlisted",
  "Interview",
  "Offered",
  "Rejected",
];

export default function RecruiterDashboardPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace as string) || "techform";

  // Data state
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [applicants, setApplicants] = React.useState<JobApplication[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = React.useState(true);
  const [isLoadingApplicants, setIsLoadingApplicants] = React.useState(false);
  const [updatingAppId, setUpdatingAppId] = React.useState<number | null>(null);

  // Post Job Dialog
  const [isPostJobOpen, setIsPostJobOpen] = React.useState(false);
  const [isSubmittingJob, setIsSubmittingJob] = React.useState(false);
  const [newJob, setNewJob] = React.useState({
    title: "",
    company: "",
    location: "",
    jobType: "Full-time",
    experienceLevel: "Mid-level",
    workplaceType: "On-site",
    salary: "$50,000 - $70,000",
    description: "",
    requirements: "",
    skills: "",
    deadlineDays: 30,
  });

  const loadJobs = React.useCallback(async () => {
    try {
      setIsLoadingJobs(true);
      const res = await jobsApi.getJobs({ collection: workspaceSlug, limit: 50 });
      setJobs(res.jobs);
      if (res.jobs.length > 0 && !selectedJob) {
        setSelectedJob(res.jobs[0]);
      }
    } catch {
      toast.error("Failed to load recruiter jobs");
    } finally {
      setIsLoadingJobs(false);
    }
  }, [workspaceSlug, selectedJob]);

  React.useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Load applicants whenever selected job changes
  React.useEffect(() => {
    if (selectedJob?.id) {
      setIsLoadingApplicants(true);
      jobsApi
        .getJobApplicants(selectedJob.id, { collection: workspaceSlug })
        .then((apps) => {
          setApplicants(apps);
        })
        .catch(() => {
          setApplicants([]);
        })
        .finally(() => {
          setIsLoadingApplicants(false);
        });
    }
  }, [selectedJob, workspaceSlug]);

  const handleStatusChange = async (appId: number, newStatus: string) => {
    try {
      setUpdatingAppId(appId);
      const success = await jobsApi.updateApplicationStatus(appId, newStatus, workspaceSlug);
      if (success) {
        toast.success(`Candidate status updated to ${newStatus}`);
        setApplicants((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus as any } : a))
        );
      } else {
        toast.error("Failed to update candidate status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company || !newJob.location) {
      toast.error("Please fill in all required job fields");
      return;
    }

    try {
      setIsSubmittingJob(true);
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + Number(newJob.deadlineDays));

      const created = await jobsApi.createJob(
        {
          title: newJob.title,
          company: newJob.company,
          location: newJob.location,
          jobType: newJob.jobType,
          experienceLevel: newJob.experienceLevel,
          isRemote: newJob.workplaceType === "Remote",
          salary: newJob.salary,
          description: newJob.description,
          requirements: newJob.requirements,
          skills: newJob.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          deadline: deadline.toISOString(),
        },
        workspaceSlug
      );

      toast.success("Job posted successfully!");
      setIsPostJobOpen(false);
      setJobs([created, ...jobs]);
      setSelectedJob(created);
    } catch (err: any) {
      toast.error(err.message || "Failed to post job");
    } finally {
      setIsSubmittingJob(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top ATS Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200">
            <Sparkles className="h-3 w-3" />
            <span>Talent Acquisition ATS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Recruiter ATS Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review candidate rosters, stage candidate interviews, and publish new openings.
          </p>
        </div>

        <Button
          onClick={() => setIsPostJobOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-xs h-9 font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          Post New Opening
        </Button>
      </div>

      {/* 2-Column Split: Active Vacancies vs Applicant Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Openings List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-[650px] overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900">
              Active Vacancies ({jobs.length})
            </h2>
            <span className="text-[11px] text-slate-400">Click to inspect</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {isLoadingJobs ? (
              <div className="p-8 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading vacancies...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No vacancies created yet.
              </div>
            ) : (
              jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={cn(
                      "p-3.5 rounded-xl border cursor-pointer transition-all",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-xs text-slate-900 truncate">
                        {job.title}
                      </h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {job.jobType}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{job.company}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{job.location}</span>
                      <span className="font-semibold text-slate-700">
                        {job.salary || "Competitive"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Applicant Pipeline Roster */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-[650px] overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Applicant Roster: {selectedJob ? selectedJob.title : "Select Vacancy"}
              </h2>
              <p className="text-[11px] text-slate-400">
                {applicants.length} candidates applied
              </p>
            </div>
            {selectedJob && (
              <Badge variant="brand" className="text-xs">
                Active ATS Stage
              </Badge>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {isLoadingApplicants ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                <p className="text-xs text-slate-400">Retrieving applicant pipeline...</p>
              </div>
            ) : applicants.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-slate-800">
                  No applicants yet for this position
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  When candidates submit their profiles and resumes, they will appear in this pipeline for evaluation.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          Candidate #{applicant.candidateId}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          • Applied on {new Date(applicant.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {applicant.coverLetter && (
                        <p className="text-xs text-slate-600 mt-1 italic max-w-md">
                          &ldquo;{applicant.coverLetter}&rdquo;
                        </p>
                      )}

                      {applicant.resumeSnapshotUrl && (
                        <div className="mt-2">
                          <a
                            href={applicant.resumeSnapshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Download Candidate Resume PDF</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Stage Selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-slate-400">Stage:</span>
                      <select
                        value={applicant.status}
                        onChange={(e) => handleStatusChange(applicant.id, e.target.value)}
                        disabled={updatingAppId === applicant.id}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post New Job Dialog */}
      <Dialog open={isPostJobOpen} onOpenChange={setIsPostJobOpen}>
        <DialogContent className="sm:max-w-xl bg-white border border-slate-200 p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateJob}>
            <DialogHeader>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200 w-fit">
                <Sparkles className="h-3 w-3" />
                <span>Job Creator</span>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Post New Job Vacancy
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Publish an opportunity to the {workspaceSlug} talent network.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Architect"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nexonetics Corp"
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New York, NY"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Workplace Type
                  </label>
                  <select
                    value={newJob.workplaceType}
                    onChange={(e) => setNewJob({ ...newJob, workplaceType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Job Type
                  </label>
                  <select
                    value={newJob.jobType}
                    onChange={(e) => setNewJob({ ...newJob, jobType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $90,000 - $120,000"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={newJob.experienceLevel}
                    onChange={(e) => setNewJob({ ...newJob, experienceLevel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Entry-level">Entry-level</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="React, Next.js, TypeScript, Tailwind CSS"
                  value={newJob.skills}
                  onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Job Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the daily responsibilities and mission of this role..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Requirements & Qualifications
                </label>
                <textarea
                  rows={3}
                  placeholder="List prerequisite degrees, years of experience, or portfolio links..."
                  value={newJob.requirements}
                  onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPostJobOpen(false)}
                disabled={isSubmittingJob}
                className="text-xs border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingJob}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                {isSubmittingJob ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Opening"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
