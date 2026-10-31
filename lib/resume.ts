export type Experience = {
  role: string;
  company: string;
  dates: string;
  details: string;
};

export type Education = {
  degree: string;
  school: string;
  dates: string;
};

export type Resume = {
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string;
};

function isStringRecord(value: unknown, keys: string[]): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    keys.every((key) => typeof (value as Record<string, unknown>)[key] === "string")
  );
}

export function isResumeData(value: unknown): value is Resume {
  if (typeof value !== "object" || value === null) return false;

  const resume = value as Record<string, unknown>;
  const textFields = ["name", "role", "email", "phone", "location", "website", "summary", "skills"];
  return (
    isStringRecord(resume, textFields) &&
    Array.isArray(resume.experience) &&
    resume.experience.every((item) => isStringRecord(item, ["role", "company", "dates", "details"])) &&
    Array.isArray(resume.education) &&
    resume.education.every((item) => isStringRecord(item, ["degree", "school", "dates"]))
  );
}
