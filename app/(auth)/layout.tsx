import * as React from "react";
import Link from "next/link";
import { MessageSquare, Briefcase, Video, Wrench, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans">
      {/* Left Brand Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-slate-200 bg-white p-12 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-sm group-hover:border-indigo-500 transition-colors overflow-hidden">
              <img src="/icon-192.png" alt="NexoChat" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">
                NexoChat
              </span>
              <span className="block text-xs text-slate-500 font-medium">
                Cloud Enterprise Workspace
              </span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg space-y-8 my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50/80 text-xs font-semibold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Enterprise Multi-Tenant Super Platform</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            One platform. Every workspace. Infinite collaboration.
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed">
            Switch effortlessly between specialized workspaces: TechForm recruitment, on-demand GIG marketplace, instant Agora WebRTC meetings, and real-time messaging.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Real-Time Messaging
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  WebSockets & SSE Channels
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Video Calling
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Agora WebRTC & PIP
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  TechForm Jobs
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Recruiter ATS & CVs
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  GIG Marketplace
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Proposals & Bookings
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Enterprise-grade security • Dual-Token JWT with httpOnly protection</span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-sm overflow-hidden">
                <img src="/icon-192.png" alt="NexoChat" className="h-full w-full object-contain" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">
                NexoChat
              </span>
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
