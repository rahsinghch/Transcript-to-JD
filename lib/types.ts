export interface JobLocation {
  type: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  city?: string;
  country?: string;
}

export interface JobDescription {
  jobTitle: string;
  company?: string;
  department?: string;
  location: JobLocation;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  aboutRole: string;
  keyResponsibilities: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  compensationRange?: string;
  benefits: string[];
  interviewProcess: string[];
  reportingTo?: string;
  teamSize?: string;
  startDate?: string;
}

export interface GenerateJDResponse {
  jd: JobDescription;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export interface GenerateJDError {
  error: string;
}
