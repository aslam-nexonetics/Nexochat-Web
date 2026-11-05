import {
  MessageSquare,
  Briefcase,
  Wrench,
  Building2,
  FileText,
  User,
  Headphones,
  LayoutGrid,
  Radio,
  FileCheck,
  Calendar,
  Layers,
  type LucideIcon,
} from "lucide-react";

export interface WorkspaceNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
}

export function getNavigationForCollection(
  collectionName: string,
  properties: string[]
): WorkspaceNavItem[] {
  const slug = collectionName.toLowerCase().trim();
  const lowerProps = properties.map((p) => p.toLowerCase());
  const items: WorkspaceNavItem[] = [];

  const addedIds = new Set<string>();

  const addItem = (item: WorkspaceNavItem) => {
    if (!addedIds.has(item.id)) {
      addedIds.add(item.id);
      items.push(item);
    }
  };

  // 1. Techform Collection
  if (slug.includes("techform")) {
    addItem({
      id: "jobs",
      label: "Job Board",
      href: `/workspace/${slug}/jobs`,
      icon: Briefcase,
      description: "Search and apply for jobs",
    });
    addItem({
      id: "applications",
      label: "My Applications",
      href: `/workspace/${slug}/applications`,
      icon: FileCheck,
      description: "Track your job submissions",
    });
    addItem({
      id: "recruiter",
      label: "Recruiter ATS",
      href: `/workspace/${slug}/recruiter`,
      icon: LayoutGrid,
      description: "Manage applicants and job postings",
    });
    addItem({
      id: "candidate-profile",
      label: "Candidate CV",
      href: `/workspace/${slug}/profile`,
      icon: FileText,
      description: "Resume, skills & experience",
    });
    addItem({
      id: "chat",
      label: "Recruitment Chat",
      href: `/workspace/${slug}/chat`,
      icon: MessageSquare,
      description: "Direct messaging with recruiters",
    });
    if (lowerProps.includes("guest")) {
      addItem({
        id: "support",
        label: "Candidate Helpdesk",
        href: `/workspace/${slug}/support`,
        icon: Headphones,
      });
    }
    return items;
  }

  // 2. GIG Collection
  if (slug.includes("gig")) {
    addItem({
      id: "gigs",
      label: "Service Providers",
      href: `/workspace/${slug}/gigs`,
      icon: Wrench,
      description: "Discover local verified professionals",
    });
    addItem({
      id: "gig-jobs",
      label: "Job Requests",
      href: `/workspace/${slug}/jobs`,
      icon: Briefcase,
      description: "Posted tasks & client requests",
    });
    addItem({
      id: "appointments",
      label: "Bookings Calendar",
      href: `/workspace/${slug}/appointments`,
      icon: Calendar,
      description: "Scheduled client appointments",
    });
    addItem({
      id: "verification",
      label: "KYC Verification",
      href: `/workspace/${slug}/verification`,
      icon: FileCheck,
      description: "Provider ID & badge verification",
    });
    addItem({
      id: "chat",
      label: "Provider Chat",
      href: `/workspace/${slug}/chat`,
      icon: MessageSquare,
      description: "Direct messaging with clients",
    });
    return items;
  }

  // 3. Shalabam Collection
  if (slug.includes("shalabam")) {
    addItem({
      id: "channels",
      label: "Channels & DMs",
      href: `/workspace/${slug}/chat`,
      icon: MessageSquare,
      badge: "SSE",
      description: "Enterprise Slack-style channels",
    });
    addItem({
      id: "profile",
      label: "Workspace Profile",
      href: `/workspace/${slug}/profile`,
      icon: User,
    });
    if (lowerProps.includes("guest")) {
      addItem({
        id: "support",
        label: "Guest Support Queue",
        href: `/workspace/${slug}/support`,
        icon: Headphones,
      });
    }
    return items;
  }

  // 4. Nexonetics / Standard Collection
  if (lowerProps.includes("nexo_feeds") || slug.includes("nexonetics")) {
    addItem({
      id: "feeds",
      label: "Company Feeds",
      href: `/workspace/${slug}/feeds`,
      icon: Radio,
      description: "Company announcements & updates",
    });
  }

  if (lowerProps.includes("company_profile")) {
    addItem({
      id: "company",
      label: "Company Profile",
      href: `/workspace/${slug}/company`,
      icon: Building2,
      description: "Organization details",
    });
  }

  // Core Chat
  if (lowerProps.includes("chat") || lowerProps.includes("nexo_chat")) {
    addItem({
      id: "chat",
      label: "Team Chat",
      href: `/workspace/${slug}/chat`,
      icon: MessageSquare,
      description: "1-on-1 and group conversations",
    });
  }

  // Support / Guest Helpdesk
  if (lowerProps.includes("guest")) {
    addItem({
      id: "support",
      label: "Guest Helpdesk",
      href: `/workspace/${slug}/support`,
      icon: Headphones,
      description: "Visitor live support queue",
    });
  }

  // Profile
  addItem({
    id: "profile",
    label: "My Profile",
    href: `/workspace/${slug}/profile`,
    icon: User,
  });

  return items;
}
