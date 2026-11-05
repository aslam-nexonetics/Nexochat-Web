import {
  Briefcase,
  Wrench,
  MessageSquare,
  Building2,
  User,
  Radio,
  FileCheck,
  LayoutGrid,
  Headphones,
  Layers,
  Calendar,
  LucideIcon,
} from "lucide-react";
import { Collection } from "@/lib/types/collection";

export interface TabItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export function getCollectionIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  if (lower.includes("techform") || lower.includes("job")) return Briefcase;
  if (lower.includes("gig")) return Wrench;
  if (lower.includes("shalabam")) return MessageSquare;
  if (lower.includes("nexonetics")) return Building2;
  return Layers;
}

export function getCollectionColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("techform")) return "text-indigo-600 bg-indigo-50 border-indigo-100";
  if (lower.includes("gig")) return "text-emerald-600 bg-emerald-50 border-emerald-100";
  if (lower.includes("shalabam")) return "text-sky-600 bg-sky-50 border-sky-100";
  if (lower.includes("nexonetics")) return "text-indigo-600 bg-indigo-50 border-indigo-100";
  return "text-indigo-600 bg-indigo-50 border-indigo-100";
}

export function getCollectionTabs(collection: {
  collectionName: string;
  properties?: string[];
}): TabItem[] {
  const slug = collection.collectionName.toLowerCase().trim();
  const lowerProps = (collection.properties || []).map((p) => p.toLowerCase());
  const tabs: TabItem[] = [];

  // 1. Techform tabs
  if (slug.includes("techform")) {
    tabs.push({ id: "jobs", label: "Job Board", href: `/workspace/${slug}/jobs`, icon: Briefcase });
    tabs.push({ id: "applications", label: "My Applications", href: `/workspace/${slug}/applications`, icon: FileCheck });
    tabs.push({ id: "recruiter", label: "Recruiter ATS", href: `/workspace/${slug}/recruiter`, icon: LayoutGrid });
    tabs.push({ id: "profile", label: "Candidate CV", href: `/workspace/${slug}/profile`, icon: User });
    if (lowerProps.includes("chat")) {
      tabs.push({ id: "chat", label: "Chat", href: `/workspace/${slug}/chat`, icon: MessageSquare });
    }
    if (lowerProps.includes("guest")) {
      tabs.push({ id: "support", label: "Helpdesk", href: `/workspace/${slug}/support`, icon: Headphones });
    }
    return tabs;
  }

  // 2. GIG tabs
  if (slug.includes("gig")) {
    tabs.push({ id: "gigs", label: "Services & Pros", href: `/workspace/${slug}/gigs`, icon: Wrench });
    tabs.push({ id: "appointments", label: "Appointments", href: `/workspace/${slug}/appointments`, icon: Calendar });
    tabs.push({ id: "jobs", label: "Tasks & Bids", href: `/workspace/${slug}/jobs`, icon: Briefcase });
    tabs.push({ id: "chat", label: "Live Chat", href: `/workspace/${slug}/chat`, icon: MessageSquare });
    tabs.push({ id: "profile", label: "Provider KYC", href: `/workspace/${slug}/profile`, icon: User });
    return tabs;
  }

  // 3. Shalabam tabs
  if (slug.includes("shalabam")) {
    tabs.push({ id: "chat", label: "Channels & DMs", href: `/workspace/${slug}/chat`, icon: MessageSquare });
    tabs.push({ id: "profile", label: "Profile", href: `/workspace/${slug}/profile`, icon: User });
    if (lowerProps.includes("guest")) {
      tabs.push({ id: "support", label: "Support", href: `/workspace/${slug}/support`, icon: Headphones });
    }
    return tabs;
  }

  // 4. Nexonetics / General collections
  if (lowerProps.includes("company_profile") || slug.includes("nexonetics")) {
    tabs.push({ id: "company", label: "Company Profile", href: `/workspace/${slug}/company`, icon: Building2 });
  }
  if (lowerProps.includes("nexo_feeds")) {
    tabs.push({ id: "feeds", label: "Company Feeds", href: `/workspace/${slug}/feeds`, icon: Radio });
  }
  if (lowerProps.includes("chat")) {
    tabs.push({ id: "chat", label: "Team Chat", href: `/workspace/${slug}/chat`, icon: MessageSquare });
  }
  tabs.push({ id: "profile", label: "Profile", href: `/workspace/${slug}/profile`, icon: User });
  if (lowerProps.includes("guest")) {
    tabs.push({ id: "support", label: "Guest Helpdesk", href: `/workspace/${slug}/support`, icon: Headphones });
  }

  return tabs;
}

export function getFirstPropertyRoute(collection: {
  collectionName: string;
  properties?: string[];
}): string {
  const tabs = getCollectionTabs(collection);
  if (tabs.length > 0) {
    return tabs[0].href;
  }
  const slug = collection.collectionName.toLowerCase().trim();
  return `/workspace/${slug}/profile`;
}
