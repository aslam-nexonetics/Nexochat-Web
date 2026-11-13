"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Briefcase,
  Wrench,
  Video,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  Users,
  Zap,
  Lock,
  Globe,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { toast } from "sonner";

export default function HomePage() {
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* ── Top Navigation ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-xs overflow-hidden">
              <img src="/icon-192.png" alt="NexoChat" className="h-full w-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                NexoChat
              </span>
              <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Cloud Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-1.5 shadow-xs"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 sm:py-28 bg-gradient-to-b from-white via-slate-50/50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-800 mb-8 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Production-Ready Next.js Enterprise Web Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
              Unified Multi-Tenant Workspace for Modern Teams
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Real-time channel messaging, Agora audio/video conferencing, TechForm recruitment ATS, and GIG services marketplace — engineered with sub-second performance.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login">
                <Button
                  size="lg"
                  className="h-11 px-7 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm gap-2"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="h-11 px-6 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold"
                onClick={() =>
                  toast.success("Design System Loaded", {
                    description: "All Radix UI primitives and pure-white Tailwind tokens are active.",
                  })
                }
              >
                Test Toast Alerts
              </Button>
            </div>

            {/* Quick interactive search input */}
            <div className="mt-10 max-w-md mx-auto">
              <SearchInput
                placeholder="Search across collections, channels, or jobs..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onClear={() => setSearchValue("")}
                shortcut="⌘K"
                className="bg-white border-slate-200 shadow-xs text-xs h-11 rounded-2xl"
              />
            </div>
          </div>
        </section>

        {/* ── Multi-Tenant Collections Showcase ───────────────────────────────── */}
        <section className="py-16 border-y border-slate-200/80 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Integrated Workspace Modules
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
                Powered dynamically by collection configurations, role permissions, and real-time backend synchronization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* TechForm Card */}
              <div className="p-6 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">
                      TechForm Jobs
                    </h3>
                    <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700 text-[10px] font-bold">
                      Hiring ATS
                    </Badge>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                    LinkedIn-style master-detail job search, resume uploads, candidate dossiers, recruiter ATS stages, and hiring pipelines.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">ATS Pipeline</span>
                  <Link href="/login" className="text-xs font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1">
                    <span>Enter</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* GIG Services Card */}
              <div className="p-6 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">
                      GIG Marketplace
                    </h3>
                    <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      Services
                    </Badge>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                    Verified on-demand technicians, interactive AI assistants, direct appointment scheduling, job bidding, and live work status.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">On-Demand Pros</span>
                  <Link href="/login" className="text-xs font-bold text-slate-900 hover:text-emerald-600 flex items-center gap-1">
                    <span>Enter</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Real-Time Chat Card */}
              <div className="p-6 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">
                      Real-Time Chat
                    </h3>
                    <Badge variant="outline" className="bg-sky-50 border-sky-200 text-sky-700 text-[10px] font-bold">
                      WebSockets
                    </Badge>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                    Direct 1-on-1 messaging, channels, Shalabam SSE feeds, typing presence, thread drawers, and file attachments.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Sub-second Sync</span>
                  <Link href="/login" className="text-xs font-bold text-slate-900 hover:text-sky-600 flex items-center gap-1">
                    <span>Enter</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Agora Calls & Meetings Card */}
              <div className="p-6 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Video className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">
                      Conferencing
                    </h3>
                    <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 text-[10px] font-bold">
                      Agora WebRTC
                    </Badge>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                    Agora RTC Web NG audio & video grid, floating call drawer, screen share, meeting links, and low-latency streaming.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">HD Calling</span>
                  <Link href="/login" className="text-xs font-bold text-slate-900 hover:text-amber-600 flex items-center gap-1">
                    <span>Enter</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Enterprise Standards & Architecture ────────────────────────────── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Enterprise Security & KYC
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Role-based access control, biometric verification, document verification, and signed JWT authentication.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Desktop-First Ergonomics
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Multi-pane layouts, keyboard navigation shortcuts, fluid responsiveness, and high-density SaaS views.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Real-Time Cloud State
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Dual WebSocket and SSE transport pipelines with TanStack Query caching and optimistic UI updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">NexoChat</span>
            <span className="text-slate-400">·</span>
            <span>Enterprise Multi-Tenant Workspace</span>
          </div>
          <p>© 2026 NexoChat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
