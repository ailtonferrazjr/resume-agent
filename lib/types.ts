export interface ParsedResume {
  name: string;
  contact: ContactInfo;
  summary: string | null;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
}

export interface ContactInfo {
  email: string;
  linkedin: { text: string; url: string };
  phone: string;
  location: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  location: string;
  dateRange: string;
  bullets: BulletPoint[];
  stack: string | null;
}

export interface BulletPoint {
  segments: TextSegment[];
}

export interface TextSegment {
  text: string;
  bold: boolean;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  dateRange: string;
  subBullets: string[];
}

export interface SkillEntry {
  label: string;
  value: string;
}

export interface ParsedCoverLetter {
  name: string;
  contact: ContactInfo;
  company: string;
  role: string;
  date: string;
  recipient: string;
  recipientCompany?: string;
  paragraphs: BulletPoint[];
  closing: string;
}
