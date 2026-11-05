export interface CompanyInfo {
  id?: number;
  ownerId?: number;
  name: string;
  description: string;
  industry: string;
  size: string;
  website: string;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  founded?: number | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary: string;
  description: string;
  requirements: string;
  skills: string[];
  postedDate: string;
  deadline: string;
  isRemote: boolean;
  isFeatured: boolean;
  companyLogo?: string | null;
  companyInfo: CompanyInfo;
  has_applied?: boolean;
  is_bookmarked?: boolean;
}

export interface JobFilter {
  searchQuery?: string;
  workplaceType?: "Remote" | "Hybrid" | "On-site" | "";
  isRemote?: boolean;
  isHybrid?: boolean;
  employmentType?: string;
  experienceLevel?: string;
  location?: string;
  salaryRange?: string;
  sortBy?: string;
}

export interface JobApplication {
  id: number;
  jobId: number;
  candidateId: number;
  resumeSnapshotUrl?: string | null;
  status: "Applied" | "Reviewing" | "Shortlisted" | "Interview" | "Offered" | "Rejected";
  coverLetter?: string | null;
  createdAt: string;
  updatedAt: string;
  jobTitle?: string | null;
  jobLocation?: string | null;
  employmentType?: string | null;
  companyName?: string | null;
  companyLogo?: string | null;
  profileSnapshot?: Record<string, unknown> | null;
}

export interface Experience {
  id?: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string;
}

export interface Education {
  id?: string;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string | null;
  grade?: string;
}

export interface Skill {
  id?: string;
  name: string;
  level?: "Beginner" | "Intermediate" | "Expert";
}

export interface Certificate {
  id?: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string | null;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Language {
  id?: string;
  name: string;
  proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
}

export interface JobProfile {
  id?: string;
  professionalSummary?: string;
  currentPosition?: string;
  desiredPosition?: string;
  isAvailableForWork: boolean;
  resumeUrl?: string | null;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  certificates: Certificate[];
  languages: Language[];
}
