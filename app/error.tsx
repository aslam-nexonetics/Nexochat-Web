"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4 border border-rose-100">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          An unexpected error occurred. Please try refreshing.
        </p>
        {error.message && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-700 overflow-x-auto text-left border border-slate-200">
            {error.message}
          </div>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => reset()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/workspace")}
            className="border-slate-200"
          >
            Go to Collections
          </Button>
        </div>
      </div>
    </div>
  );
}
