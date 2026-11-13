import { apiClient } from "./client";
import {
  Job,
  JobFilter,
  JobApplication,
  JobProfile,
  CompanyInfo,
  Experience,
  Education,
  Skill,
  Certificate,
  Language,
} from "@/lib/types/job";

export interface JobsResponse {
  jobs: Job[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const jobsApi = {
  // 1. Fetch Job Listings
  async getJobs(params: {
    collection?: string;
    filter?: JobFilter;
    page?: number;
    limit?: number;
  }): Promise<JobsResponse> {
    const { collection = "techform", filter = {}, page = 1, limit = 20 } = params;

    const query = new URLSearchParams();
    query.set("collection", collection);
    query.set("page", String(page));
    query.set("limit", String(limit));

    if (filter.searchQuery) query.set("search", filter.searchQuery);
    if (filter.workplaceType) query.set("workplaceType", filter.workplaceType);
    if (filter.isRemote) query.set("workplaceType", "Remote");
    if (filter.isHybrid) query.set("workplaceType", "Hybrid");
    if (filter.employmentType) query.set("employmentType", filter.employmentType);
    if (filter.experienceLevel) query.set("experienceLevel", filter.experienceLevel);
    if (filter.location) query.set("location", filter.location);
    if (filter.salaryRange) query.set("salaryRange", filter.salaryRange);
    if (filter.sortBy) query.set("sortBy", filter.sortBy);

    const res = await apiClient.get<{ success: boolean; data: { jobs: Job[]; pagination?: any } }>(
      `/jobs/?${query.toString()}`
    );

    return {
      jobs: res.data?.jobs || [],
      pagination: res.data?.pagination,
    };
  },

  // 2. Fetch Single Job Details
  async getJobDetails(jobId: string, collection: string = "techform"): Promise<Job> {
    const res = await apiClient.get<{ success: boolean; data: Job }>(
      `/jobs/${jobId}?collection=${collection}`
    );
    return res.data;
  },

  // 3. Apply to Job
  async applyToJob(
    jobId: string,
    data: { coverLetter?: string; collection?: string } = {}
  ): Promise<{ success: boolean; message?: string }> {
    const { coverLetter, collection = "techform" } = data;
    const res = await apiClient.post<{ success: boolean; message?: string }>(
      `/jobs/${jobId}/apply?collection=${collection}`,
      {
        ...(coverLetter ? { cover_letter: coverLetter } : {}),
      }
    );
    return res;
  },

  // 4. Fetch My Job Applications
  async getMyApplications(params: {
    collection?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<JobApplication[]> {
    const { collection = "techform", page = 1, limit = 50 } = params;
    const res = await apiClient.get<any>(
      `/applications/me?collection=${collection}&page=${page}&limit=${limit}`
    );
    const rawList = res?.data?.applications || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    return rawList.map(mapRawApplication);
  },

  // 5. Fetch Job Applicants (Recruiter View)
  async getJobApplicants(
    jobId: string,
    params: { collection?: string; page?: number; limit?: number } = {}
  ): Promise<JobApplication[]> {
    const { collection = "techform", page = 1, limit = 50 } = params;
    const res = await apiClient.get<any>(
      `/jobs/${jobId}/applications?collection=${collection}&page=${page}&limit=${limit}`
    );
    const rawList = res?.data?.applicants || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    return rawList.map(mapRawApplication);
  },

  // 6. Update Application Status (Recruiter Action)
  async updateApplicationStatus(
    applicationId: string | number,
    status: string,
    collection: string = "techform"
  ): Promise<boolean> {
    const res = await apiClient.patch<{ success: boolean }>(
      `/applications/${applicationId}/status?collection=${collection}`,
      { status }
    );
    return res.success;
  },

  // 7. Bookmarking
  async bookmarkJob(jobId: string, collection: string = "techform"): Promise<void> {
    await apiClient.post(`/jobs/${jobId}/bookmark?collection=${collection}`);
  },

  async removeBookmark(jobId: string, collection: string = "techform"): Promise<void> {
    await apiClient.delete(`/jobs/${jobId}/bookmark?collection=${collection}`);
  },

  async getMyBookmarks(collection: string = "techform"): Promise<Job[]> {
    const res = await apiClient.get<{ success: boolean; data: { jobs: Job[] } }>(
      `/bookmarks?collection=${collection}`
    );
    return res.data?.jobs || [];
  },

  // 8. Companies
  async getCompanies(params: { myOnly?: boolean; collection?: string } = {}): Promise<CompanyInfo[]> {
    const { myOnly = false, collection = "techform" } = params;
    const res = await apiClient.get<{ success: boolean; data: CompanyInfo[] }>(
      `/jobs/companies/?collection=${collection}&myOnly=${myOnly}`
    );
    return res.data || [];
  },

  async getCompanyDetails(companyId: string | number, collection: string = "techform"): Promise<CompanyInfo> {
    const res = await apiClient.get<{ success: boolean; data: CompanyInfo }>(
      `/jobs/companies/${companyId}?collection=${collection}`
    );
    return res.data;
  },

  // 9. Create Job (Recruiter)
  async createJob(jobData: Partial<Job>, workspace?: string): Promise<Job> {
    const endpoint = workspace
      ? `/jobs/workspaces/${workspace}/jobs?collection=techform`
      : `/jobs/?collection=techform`;
    const res = await apiClient.post<{ success: boolean; data: Job }>(endpoint, jobData);
    return res.data;
  },

  // 10. Candidate Profile / CV
  async getJobProfile(): Promise<JobProfile> {
    const res = await apiClient.get<{ success: boolean; data: any }>("/job-profiles/me");
    const raw = res.data || {};
    return {
      id: raw.id?.toString(),
      professionalSummary: raw.professional_summary || raw.professionalSummary || "",
      currentPosition: raw.current_position || raw.currentPosition || "",
      desiredPosition: raw.desired_position || raw.desiredPosition || "",
      isAvailableForWork: raw.is_available_for_work ?? raw.isAvailableForWork ?? true,
      resumeUrl: raw.resume_url || raw.resumeUrl || null,
      experiences: (raw.experiences || []).map((e: any) => ({
        id: e.id?.toString(),
        title: e.position || e.title || "",
        company: e.company_name || e.company || "",
        location: e.location || "",
        startDate: e.start_date || e.startDate || "",
        endDate: e.end_date || e.endDate || null,
        isCurrent: e.is_current_job ?? e.is_current ?? e.isCurrent ?? false,
        description: e.description || "",
      })),
      educations: (raw.educations || []).map((e: any) => ({
        id: e.id?.toString(),
        school: e.institution_name || e.school || "",
        degree: e.degree || "",
        fieldOfStudy: e.field_of_study || e.fieldOfStudy || "",
        startDate: e.start_date || e.startDate || "",
        endDate: e.end_date || e.endDate || null,
        grade: e.grade || "",
      })),
      skills: (raw.skills || []).map((s: any) => ({
        id: s.id?.toString(),
        name: s.name,
        level: s.level || (s.proficiency_level >= 4 ? "Expert" : s.proficiency_level >= 2 ? "Intermediate" : "Beginner"),
      })),
      certificates: (raw.certificates || []).map((c: any) => ({
        id: c.id?.toString(),
        name: c.name,
        issuingOrganization: c.issuing_organization || c.issuingOrganization || "",
        issueDate: c.issue_date || c.issueDate || "",
        expirationDate: c.expiration_date || c.expirationDate || null,
        credentialId: c.credential_id || c.credentialId || "",
        credentialUrl: c.credential_url || c.credentialUrl || "",
      })),
      languages: (raw.languages || []).map((l: any) => ({
        id: l.id?.toString(),
        name: l.name,
        proficiency: l.proficiency_level || l.proficiency || "Fluent",
      })),
    };
  },

  async updateJobProfile(data: {
    professionalSummary?: string;
    currentPosition?: string;
    desiredPosition?: string;
    isAvailableForWork?: boolean;
  }): Promise<JobProfile> {
    const res = await apiClient.patch<{ success: boolean; data: any }>("/job-profiles/me", {
      professional_summary: data.professionalSummary,
      current_position: data.currentPosition,
      desired_position: data.desiredPosition,
      is_available_for_work: data.isAvailableForWork,
    });
    return res.data;
  },

  // 11. Experience items
  async addExperience(exp: {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string | null;
    isCurrent: boolean;
    description?: string;
  }): Promise<Experience> {
    const payload: any = {
      position: exp.title,
      company_name: exp.company,
      location: exp.location || "",
      start_date: exp.startDate,
      is_current_job: exp.isCurrent,
      description: exp.description || "",
      achievements: [],
    };
    if (!exp.isCurrent && exp.endDate) {
      payload.end_date = exp.endDate;
    }
    const res = await apiClient.post<{ success: boolean; data: any }>(
      "/job-profiles/me/experiences",
      payload
    );
    return res.data;
  },

  async updateExperience(
    id: string,
    exp: {
      title: string;
      company: string;
      location?: string;
      startDate: string;
      endDate?: string | null;
      isCurrent: boolean;
      description?: string;
    }
  ): Promise<Experience> {
    const payload: any = {
      position: exp.title,
      company_name: exp.company,
      location: exp.location || "",
      start_date: exp.startDate,
      is_current_job: exp.isCurrent,
      description: exp.description || "",
      achievements: [],
    };
    if (!exp.isCurrent && exp.endDate) {
      payload.end_date = exp.endDate;
    } else {
      payload.end_date = null;
    }
    const res = await apiClient.put<{ success: boolean; data: any }>(
      `/job-profiles/me/experiences/${id}`,
      payload
    );
    return res.data;
  },

  async deleteExperience(id: string): Promise<void> {
    await apiClient.delete(`/job-profiles/me/experiences/${id}`);
  },

  // 12. Education items
  async addEducation(edu: {
    school: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate?: string | null;
    grade?: string;
    description?: string;
  }): Promise<Education> {
    const payload: any = {
      institution_name: edu.school,
      degree: edu.degree,
      field_of_study: edu.fieldOfStudy || "",
      start_date: edu.startDate,
      is_currently_studying: !edu.endDate,
      grade: edu.grade || "",
      description: edu.description || "",
    };
    if (edu.endDate) {
      payload.end_date = edu.endDate;
    }
    const res = await apiClient.post<{ success: boolean; data: any }>(
      "/job-profiles/me/educations",
      payload
    );
    return res.data;
  },

  async updateEducation(
    id: string,
    edu: {
      school: string;
      degree: string;
      fieldOfStudy?: string;
      startDate: string;
      endDate?: string | null;
      grade?: string;
      description?: string;
    }
  ): Promise<Education> {
    const payload: any = {
      institution_name: edu.school,
      degree: edu.degree,
      field_of_study: edu.fieldOfStudy || "",
      start_date: edu.startDate,
      is_currently_studying: !edu.endDate,
      grade: edu.grade || "",
      description: edu.description || "",
    };
    if (edu.endDate) {
      payload.end_date = edu.endDate;
    } else {
      payload.end_date = null;
    }
    const res = await apiClient.put<{ success: boolean; data: any }>(
      `/job-profiles/me/educations/${id}`,
      payload
    );
    return res.data;
  },

  async deleteEducation(id: string): Promise<void> {
    await apiClient.delete(`/job-profiles/me/educations/${id}`);
  },

  // 13. Skill items
  async addSkill(skill: { name: string; category?: string; level?: string }): Promise<Skill[]> {
    const profLevel = skill.level === "Expert" ? 5 : skill.level === "Beginner" ? 1 : 3;
    const res = await apiClient.post<{ success: boolean; data: any }>(
      "/job-profiles/me/skills",
      {
        skills: [
          {
            name: skill.name,
            category: skill.category || "Technical",
            proficiency_level: profLevel,
          },
        ],
      }
    );
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map((s: any) => ({
      id: s.id?.toString(),
      name: s.name,
      level: s.level || (s.proficiency_level >= 4 ? "Expert" : s.proficiency_level >= 2 ? "Intermediate" : "Beginner"),
    }));
  },

  async deleteSkill(id: string): Promise<void> {
    await apiClient.delete(`/job-profiles/me/skills/${id}`);
  },

  // 14. Certificates
  async addCertificate(cert: {
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expirationDate?: string | null;
    credentialId?: string;
    credentialUrl?: string;
  }): Promise<Certificate> {
    const payload: any = {
      name: cert.name,
      issuing_organization: cert.issuingOrganization,
      issue_date: cert.issueDate,
      credential_id: cert.credentialId || "",
      credential_url: cert.credentialUrl || "",
    };
    if (cert.expirationDate) {
      payload.expiration_date = cert.expirationDate;
    }
    const res = await apiClient.post<{ success: boolean; data: any }>(
      "/job-profiles/me/certificates",
      payload
    );
    return res.data;
  },

  async updateCertificate(
    id: string,
    cert: {
      name: string;
      issuingOrganization: string;
      issueDate: string;
      expirationDate?: string | null;
      credentialId?: string;
      credentialUrl?: string;
    }
  ): Promise<Certificate> {
    const payload: any = {
      name: cert.name,
      issuing_organization: cert.issuingOrganization,
      issue_date: cert.issueDate,
      credential_id: cert.credentialId || "",
      credential_url: cert.credentialUrl || "",
    };
    if (cert.expirationDate) {
      payload.expiration_date = cert.expirationDate;
    } else {
      payload.expiration_date = null;
    }
    const res = await apiClient.put<{ success: boolean; data: any }>(
      `/job-profiles/me/certificates/${id}`,
      payload
    );
    return res.data;
  },

  async deleteCertificate(id: string): Promise<void> {
    await apiClient.delete(`/job-profiles/me/certificates/${id}`);
  },

  // 15. Languages
  async addLanguage(lang: { name: string; proficiency?: string }): Promise<Language> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      "/job-profiles/me/languages",
      {
        name: lang.name,
        proficiency_level: lang.proficiency || "Fluent",
      }
    );
    return res.data;
  },

  async deleteLanguage(id: string): Promise<void> {
    await apiClient.delete(`/job-profiles/me/languages/${id}`);
  },

  // 16. Resume Upload & Delete
  async uploadResume(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/proxy/job-profiles/me/resume", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.detail || "Failed to upload resume file");
    }

    const data = await res.json();
    return data?.data?.resumeUrl || data?.data?.resume_url || "";
  },

  async deleteResume(): Promise<void> {
    await apiClient.delete("/job-profiles/me/resume");
  },
};

function mapRawApplication(raw: any): JobApplication {
  if (!raw) {
    return {
      id: 0,
      jobId: 0,
      candidateId: 0,
      status: "Applied",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const job = raw.job || {};
  const rawId = raw.id ?? raw.application_id ?? raw.applicationId ?? 0;
  const rawJobId = raw.job_id ?? raw.jobId ?? job.id ?? 0;
  const rawCandidateId = raw.candidate_id ?? raw.candidateId ?? raw.user_id ?? raw.userId ?? 0;

  const jobTitle =
    job.title ||
    job.jobTitle ||
    raw.job_title ||
    raw.jobTitle ||
    (rawJobId ? `Position #${rawJobId}` : "Applied Position");

  const companyName =
    job.company ||
    job.company_name ||
    job.companyName ||
    raw.company_name ||
    raw.companyName ||
    "TechForm Partner";

  const jobLocation =
    job.location ||
    job.jobLocation ||
    raw.job_location ||
    raw.jobLocation ||
    null;

  const employmentType =
    job.jobType ||
    job.job_type ||
    job.employment_type ||
    job.employmentType ||
    raw.employment_type ||
    raw.employmentType ||
    null;

  const companyLogo =
    job.company_logo ||
    job.companyLogo ||
    raw.company_logo ||
    raw.companyLogo ||
    null;

  return {
    id: typeof rawId === "number" ? rawId : parseInt(rawId, 10) || 0,
    jobId: typeof rawJobId === "number" ? rawJobId : parseInt(rawJobId, 10) || 0,
    candidateId: typeof rawCandidateId === "number" ? rawCandidateId : parseInt(rawCandidateId, 10) || 0,
    resumeSnapshotUrl: raw.resume_snapshot_url ?? raw.resumeSnapshotUrl ?? raw.resume_url ?? raw.resumeUrl ?? null,
    status: raw.status || "Applied",
    coverLetter: raw.cover_letter ?? raw.coverLetter ?? null,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || raw.created_at || new Date().toISOString(),
    jobTitle,
    jobLocation,
    employmentType,
    companyName,
    companyLogo,
    profileSnapshot: raw.profile_snapshot ?? raw.profileSnapshot ?? null,
  };
}
