"use client";

import * as React from "react";
import { useParams } from "next/navigation";
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
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceStore } from "@/lib/store/workspace-store";

export default function WorkspaceCompanyProfilePage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace as string) || "nexonetics";

  const { activeCollection, collections, selectCollectionByName } = useWorkspaceStore();

  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  const currentCollection =
    activeCollection ||
    collections.find((c) => c.collectionName.toLowerCase().trim() === workspaceSlug.toLowerCase()) || {
      id: 0,
      collectionName: workspaceSlug.charAt(0).toUpperCase() + workspaceSlug.slice(1),
      properties: ["company_profile"],
    };

  const companyName = currentCollection.collectionName;
  const slug = companyName.toLowerCase().trim();

  // Positions matching Flutter CompanyProfileScreen
  const positions = [
    {
      title: "Senior Flutter Engineer",
      department: "Mobile Core Team",
      type: "Full-time",
      location: "Kochi, India · Hybrid",
      salary: "₹14 - 22 LPA",
      posted: "2 days ago",
    },
    {
      title: "Fullstack Next.js / TypeScript Architect",
      department: "Web Platform",
      type: "Full-time",
      location: "Remote / Hybrid",
      salary: "₹18 - 28 LPA",
      posted: "1 day ago",
    },
    {
      title: "DevOps & Cloud Infrastructure Lead",
      department: "Platform Engineering",
      type: "Full-time",
      location: "Kochi, India",
      salary: "₹16 - 25 LPA",
      posted: "4 days ago",
    },
    {
      title: "Principal UI/UX Product Designer",
      department: "Design Systems",
      type: "Full-time",
      location: "Hybrid",
      salary: "₹15 - 24 LPA",
      posted: "Just now",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* ── 1. Company Banner & Identity ─────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm shrink-0">
              {companyName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {companyName}
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold gap-1 py-0.5"
                >
                  <ShieldCheck className="h-3 w-3" />
                  <span>Verified Organization</span>
                </Badge>
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                Engineering-driven technology venture delivering state-of-the-art mobile and cloud platforms. We craft scalable digital systems, empower tech talent, and build enterprise-grade software.
              </p>

              {/* Meta details */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>Kochi, Kerala, India</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>50 - 200 Employees</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  <span>nexonetics.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <Link href={`/workspace/${slug}/chat`}>
              <Button size="sm" className="w-full h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-2xs">
                <span>Contact Team</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Two-Column Details (Overview + Stats) ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: About & Mission */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3 tracking-tight">
              About the Organization
            </h2>
            <div className="text-xs text-slate-600 leading-relaxed space-y-3">
              <p>
                {companyName} specializes in high-concurrency real-time communications, distributed architectures, mobile cross-platform systems, and modern SaaS products.
              </p>
              <p>
                Our engineering teams operate across product strategy, frontend systems, cloud-native services, and artificial intelligence to deliver exceptional software products.
              </p>
            </div>
          </div>

          {/* Active Job Openings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Open Positions at {companyName}
                </h2>
                <p className="text-xs text-slate-500">
                  Explore current opportunities and apply directly through the workspace.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-slate-700">
                {positions.length} Openings
              </Badge>
            </div>

            <div className="divide-y divide-slate-100">
              {positions.map((pos, idx) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer">
                      {pos.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-medium text-indigo-600">{pos.department}</span>
                      <span>·</span>
                      <span>{pos.location}</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700">{pos.salary}</span>
                    </div>
                  </div>

                  <Link href={`/workspace/techform/jobs`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50">
                      View Position
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Info Cards */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Organization Info
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Headquarters</span>
                <span className="font-semibold text-slate-800">Kaloor, Kochi, Kerala</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Enterprise Domain</span>
                <span className="font-semibold text-slate-800">Software & Cloud Services</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Supported Platforms</span>
                <span className="font-semibold text-slate-800">Web, iOS, Android, Cloud API</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Security Standard</span>
                <span className="font-semibold text-slate-800">Role-Based Access Control (RBAC)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
