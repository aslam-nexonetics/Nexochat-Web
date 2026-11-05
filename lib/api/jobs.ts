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
    const res = await apiClient.get<{
      success: boolean;
      data: { applications: JobApplication[] };
    }>(`/applications/me?collection=${collection}&page=${page}&limit=${limit}`);
    return res.data?.applications || [];
  },

  // 5. Fetch Job Applicants (Recruiter View)
  async getJobApplicants(
    jobId: string,
    params: { collection?: string; page?: number; limit?: number } = {}
  ): Promise<JobApplication[]> {
    const { collection = "techform", page = 1, limit = 50 } = params;
    const res = await apiClient.get<{
      success: boolean;
      data: { applicants: JobApplication[] };
    }>(`/jobs/${jobId}/applications?collection=${collection}&page=${page}&limit=${limit}`);
    return res.data?.applicants || [];
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

  // 8. Create Job (Recruiter)
  async createJob(jobData: Partial<Job>, workspace?: string): Promise<Job> {
    const endpoint = workspace
      ? `/jobs/workspaces/${workspace}/jobs?collection=techform`
      : `/jobs/?collection=techform`;
    const res = await apiClient.post<{ success: boolean; data: Job }>(endpoint, jobData);
    return res.data;
  },

  // 9. Candidate Profile / CV
  async getJobProfile(): Promise<JobProfile> {
    const res = await apiClient.get<{ success: boolean; data: any }>("/job-profiles/me");
    const raw = res.data || {};
    return {
      id: raw.id,
      professionalSummary: raw.professional_summary || raw.professionalSummary || "",
      currentPosition: raw.current_position || raw.currentPosition || "",
      desiredPosition: raw.desired_position || raw.desiredPosition || "",
      isAvailableForWork: raw.is_available_for_work ?? raw.isAvailableForWork ?? true,
      resumeUrl: raw.resume_url || raw.resumeUrl || null,
      experiences: (raw.experiences || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        company: e.company,
        location: e.location,
        startDate: e.start_date || e.startDate,
        endDate: e.end_date || e.endDate,
        isCurrent: e.is_current ?? e.isCurrent ?? false,
        description: e.description,
      })),
      educations: (raw.educations || []).map((e: any) => ({
        id: e.id,
        school: e.school,
        degree: e.degree,
        fieldOfStudy: e.field_of_study || e.fieldOfStudy,
        startDate: e.start_date || e.startDate,
        endDate: e.end_date || e.endDate,
        grade: e.grade,
      })),
      skills: (raw.skills || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        level: s.level || "Intermediate",
      })),
      certificates: (raw.certificates || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        issuingOrganization: c.issuing_organization || c.issuingOrganization,
        issueDate: c.issue_date || c.issueDate,
        expirationDate: c.expiration_date || c.expirationDate,
        credentialId: c.credential_id || c.credentialId,
        credentialUrl: c.credential_url || c.credentialUrl,
      })),
      languages: (raw.languages || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        proficiency: l.proficiency || "Fluent",
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

  // 10. Experience & Education items
  async addExperience(exp: Omit<Experience, "id">): Promise<Experience> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      "/job-profiles/me/experiences",
      {
        title: exp.title,
        company: exp.company,
        location: exp.location,
        start_date: exp.startDate,
        end_date: exp.endDate,
        is_current: exp.isCurrent,
        description: exp.description,
      }
    );
    return res.data;
  },

  async deleteExperience(id: string): Promise<void> {
    await apiClient.delete(`/job-profiles/me/experiences/${id}`);
  },

  async addEducation(edu: Omit<Education, "id">): Promise<Education> {
    const res = await apiClient.post<{ success: boolean; data: any }>(
      "/job-profiles/me/educations",
      {
        school: edu.school,
        degree: edu.degree,
        field_of_study: edu.fieldOfStudy,
        start_date: edu.startDate,
        end_date: edu.endDate,
        grade: edu.grade,
      }
    );
    return res.data;
  },

  async deleteEducation(id: string): Promise<void> {
    await apiClient.delete(`/job-profiles/me/educations/${id}`);
  },

  async addSkill(skill: { name: string; level?: string }): Promise<Skill[]> {
    const res = await apiClient.post<{ success: boolean; data: any[] }>(
      "/job-profiles/me/skills",
      {
        skills: [{ name: skill.name, level: skill.level || "Intermediate" }],
      }
    );
    return (res.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      level: s.level,
    }));
  },

  async deleteSkill(id: string): Promise<void> {
    await apiClient.delete(`/job-profiles/me/skills/${id}`);
  },

  // 11. Resume Upload
  async uploadResume(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/proxy/job-profiles/me/resume", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to upload resume file");
    }

    const data = await res.json();
    return data?.data?.resumeUrl || data?.data?.resume_url || "";
  },

  async deleteResume(): Promise<void> {
    await apiClient.delete("/job-profiles/me/resume");
  },
};
