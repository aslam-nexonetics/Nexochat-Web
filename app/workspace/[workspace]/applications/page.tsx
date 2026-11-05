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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobApplication } from "@/lib/types/job";
import { jobsApi } from "@/lib/api/jobs";
import { toast } from "sonner";

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "applied":
      return <Badge variant="outline" className="text-xs">Applied</Badge>;
    case "reviewing":
      return <Badge variant="warning" className="text-xs">Under Review</Badge>;
    case "shortlisted":
      return <Badge variant="brand" className="text-xs">Shortlisted</Badge>;
    case "interview":
      return <Badge variant="brand" className="text-xs">Interview Scheduled</Badge>;
    case "offered":
      return <Badge variant="success" className="text-xs">Offer Extended</Badge>;
    case "rejected":
      return <Badge variant="destructive" className="text-xs">Not Selected</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export default function MyApplicationsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace as string) || "techform";

  const [applications, setApplications] = React.useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

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

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200">
            <Sparkles className="h-3 w-3" />
            <span>Application Tracking</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Job Applications
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track status updates, review interview timelines, and monitor recruiter responses.
          </p>
        </div>

        <Link href={`/workspace/${workspaceSlug}/jobs`}>
          <Button size="sm" variant="outline" className="text-xs gap-1.5 border-slate-200">
            <Briefcase className="h-3.5 w-3.5" />
            Explore More Jobs
          </Button>
        </Link>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs text-slate-500">Retrieving submitted applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl">
          <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-slate-800">
            No applications submitted yet
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
            You haven&apos;t applied to any job openings in this workspace yet.
          </p>
          <Link href={`/workspace/${workspaceSlug}/jobs`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
              Browse Open Positions
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200 shrink-0">
                  {app.companyName?.charAt(0).toUpperCase() || "C"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">
                      {app.jobTitle || `Position #${app.jobId}`}
                    </h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {app.companyName || "TechForm Partner"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Applied on {formatDate(app.createdAt)}
                    </span>
                  </div>
                  {app.coverLetter && (
                    <p className="mt-2 text-xs text-slate-600 italic line-clamp-1">
                      &ldquo;{app.coverLetter}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {app.resumeSnapshotUrl && (
                  <a
                    href={app.resumeSnapshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 border-slate-200">
                      <FileText className="h-3.5 w-3.5" />
                      View Resume
                    </Button>
                  </a>
                )}
                <Link href={`/workspace/${workspaceSlug}/jobs`}>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
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
