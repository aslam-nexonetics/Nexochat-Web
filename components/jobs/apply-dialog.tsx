"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Job } from "@/lib/types/job";
import { jobsApi } from "@/lib/api/jobs";
import { toast } from "sonner";
import { FileText, Upload, CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface ApplyDialogProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplyDialog({ job, isOpen, onClose, onSuccess }: ApplyDialogProps) {
  const [coverLetter, setCoverLetter] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasResume, setHasResume] = React.useState(false);
  const [isCheckingResume, setIsCheckingResume] = React.useState(true);
  const [isUploadingResume, setIsUploadingResume] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setIsCheckingResume(true);
      jobsApi
        .getJobProfile()
        .then((profile) => {
          setHasResume(!!profile.resumeUrl);
        })
        .catch(() => {
          setHasResume(false);
        })
        .finally(() => {
          setIsCheckingResume(false);
        });
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Please upload a PDF document for your resume.");
      return;
    }

    try {
      setIsUploadingResume(true);
      toast.info("Uploading resume...");
      await jobsApi.uploadResume(file);
      setHasResume(true);
      toast.success("Resume uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload resume");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    try {
      setIsSubmitting(true);
      const res = await jobsApi.applyToJob(job.id, {
        coverLetter: coverLetter.trim() || undefined,
        collection: "techform",
      });

      if (res.success) {
        toast.success(`Application submitted for ${job.title}!`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Failed to submit application");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200 w-fit">
            <Sparkles className="h-3 w-3" />
            <span>Job Application</span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Apply to {job.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {job.company} • {job.location} ({job.jobType})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Resume Snapshot Section */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Candidate Resume
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isCheckingResume
                      ? "Verifying profile resume..."
                      : hasResume
                      ? "Profile resume attached"
                      : "No resume on file"}
                  </div>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf"
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingResume}
                  className="text-xs gap-1.5 h-8 border-slate-200"
                >
                  {isUploadingResume ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : hasResume ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Replace
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Upload PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Cover Letter Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cover Note / Pitch (Optional)
            </label>
            <textarea
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Highlight relevant skills, achievements, or reason for applying..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {!hasResume && !isCheckingResume && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
              <span>⚠️ A PDF resume is required by employers before submitting applications. Please click &ldquo;Upload PDF&rdquo; above.</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs border-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={isSubmitting}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Submitting Application...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
