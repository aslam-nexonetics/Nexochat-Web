import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-5 border border-indigo-100">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          The workspace, room, or page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/workspace">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <ArrowLeft className="h-4 w-4" />
              Return to All Collections
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
