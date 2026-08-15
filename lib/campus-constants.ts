export const COLLEGE_DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Artificial Intelligence & Data Science (AI & DS)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Mechanical Engineering (MECH)',
  'Civil Engineering (CIVIL)',
  'Computer Science & Business Systems (CSBS)',
  'MBA (Management Studies)',
  'MCA (Computer Applications)',
  'Science & Humanities (S&H)',
  'Other / Interdisciplinary',
] as const;

export const COLLEGE_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year (Final Year)',
  'PG / Masters',
  'Faculty / Staff',
  'Alumni',
] as const;

export type CollegeDepartment = (typeof COLLEGE_DEPARTMENTS)[number];
export type CollegeYear = (typeof COLLEGE_YEARS)[number];
