// Single source of truth for personal facts used across the site.
//
// Everything here is transcribed from Minh's own LinkedIn profile export
// (Downloads/Profile.pdf, exported 2026-08-06) or the career-relaunch repo.
// Nothing in this file is inferred or estimated - if a fact is not in one of
// those two sources it does not belong here.
//
// Items marked VERIFY need Minh to confirm before the site goes live.

export const profile = {
  name: "Minh Nguyen",
  fullName: "Minh Tuyen Nguyen",
  // LinkedIn headline, verbatim.
  headline: "Senior .NET/Cloud Engineer - Digital Banking & Payments",
  location: "Oakton, Virginia",
  email: "minh@nguyen365.com",
  linkedin: "https://www.linkedin.com/in/nguyen365/",
  github: "https://github.com/nguyen365-build",
  site: "https://nguyen365.com",
};

export type Role = {
  company: string;
  title: string;
  start: string;
  end: string;
  location: string;
  /** Present tense for the current role, past tense for prior ones. */
  points: string[];
  link?: { label: string; href: string };
};

export const roles: Role[] = [
  {
    company: "Congressional Federal Credit Union",
    title: "Senior Software Developer",
    start: "October 2023",
    end: "Present",
    location: "Oakton, VA",
    points: [
      "Shipped three SAML 2.0 SSO integrations in 2025, including TruStage and MeridianLink, converging on a single reusable integration pattern.",
      "Built Plaid ACH account verification with a compliance audit trail designed to answer an examiner's questions without a manual evidence hunt.",
      "Delivered digital wallet and card-issuance push provisioning through Fiserv.",
      "Overhauled CI/CD with GitHub Actions, Playwright, and TestRail, moving releases onto a feature-flag deployment pipeline.",
      "Technical lead over an external vendor engineering team (ClaySys).",
      "Currently leading a live core banking conversion off DataSafe onto Jack Henry Symitar.",
      "Tier 3 escalation support for the digital banking platform.",
    ],
  },
  {
    company: "Government of Saskatchewan",
    title: "Senior Programmer Analyst",
    start: "September 2016",
    end: "August 2023",
    location: "Regina, SK, Canada",
    points: [
      "Designed and built applications for the Ministry of Corrections, Policing and Public Safety, the Ministry of Social Services, the Ministry of Justice, and the Attorney General.",
      "Worked in .NET, Java, Angular, and AngularJS across systems with real statutory and privacy constraints.",
    ],
  },
  {
    company: "Government of Saskatchewan",
    title: "Programmer Analyst",
    start: "November 2012",
    end: "September 2016",
    location: "Regina, SK, Canada",
    points: [
      "Built websites, scheduled batch jobs, and Windows applications for the Ministry of Social Services and the Ministry of Finance.",
    ],
  },
  {
    company: "GasBuddy",
    title: "Mobile Application Developer",
    start: "November 2010",
    end: "November 2012",
    location: "Regina, SK, Canada",
    points: [
      "Developed the GasBuddy iOS application, a consumer app with millions of users.",
    ],
    link: {
      label: "App Store",
      href: "https://apps.apple.com/us/app/gasbuddy-find-pay-for-gas/id406719683",
    },
  },
  {
    company: "Twisted Pair Productions Ltd.",
    title: "Interactive Media Developer",
    start: "June 2010",
    end: "November 2010",
    location: "Regina, SK, Canada",
    points: ["Designed and built iOS and BlackBerry applications."],
  },
];

export type Certification = {
  name: string;
  issuer: string;
  /** Why a banking/payments hiring manager should care. Empty string hides the note. */
  relevance: string;
};

// Ordered by relevance to banking/payments engineering, not alphabetically
// (career-relaunch issue #17).
//
// VERIFY: the first two are carried over from the previous site and
// career-relaunch issue #17. They match Microsoft's official certification
// names (AZ-400 and SC-900) but are not in the LinkedIn export, which is
// itself known to be incomplete (career-relaunch issue #6). Confirm the exact
// titles before publishing.
export const certifications: Certification[] = [
  {
    name: "DevOps Engineer Expert",
    issuer: "Microsoft",
    relevance: "The CI/CD and release-safety work this site describes.",
  },
  {
    name: "Security, Compliance, and Identity Fundamentals",
    issuer: "Microsoft",
    relevance: "The identity and audit-trail side of regulated systems.",
  },
  {
    name: "Azure Fundamentals",
    issuer: "Microsoft",
    relevance: "",
  },
  {
    name: "Azure AI Fundamentals",
    issuer: "Microsoft",
    relevance: "",
  },
  {
    name: "GitHub Actions",
    issuer: "GitHub",
    relevance: "Used daily in the pipeline overhaul.",
  },
  {
    name: "Querying Data with Transact-SQL (Exam 761)",
    issuer: "Microsoft",
    relevance: "",
  },
];

export type Education = {
  school: string;
  credential: string;
  field: string;
  dates: string;
};

// Transcribed from the LinkedIn export. Note: career-relaunch issue #1 tracked
// a discrepancy between this and the old Google Sites copy, which listed the
// Athabasca degree as "June 2004-Current". The LinkedIn export is treated as
// authoritative here. VERIFY before publishing.
export const education: Education[] = [
  {
    school: "Athabasca University",
    credential: "Bachelor of Science (Post Diploma)",
    field: "Computer Science",
    dates: "June 2014",
  },
  {
    school: "Saskatchewan Polytechnic",
    credential: "Diploma of Computer Systems Technology",
    field: "Computer Science",
    dates: "August 2008 - June 2010",
  },
];

/** Systems and vendors worked with directly, grouped for scanning. */
export const stack = [
  {
    group: "Banking & payments",
    items: [
      "Jack Henry Symitar",
      "Fiserv",
      "Plaid",
      "ACH / NACHA",
      "MeridianLink",
      "TruStage",
      "Cenlar",
    ],
  },
  {
    group: "Identity & security",
    items: [
      "SAML 2.0",
      "SSO",
      "Fortanix",
      "GitHub Advanced Security",
      "Audit-trail design",
    ],
  },
  {
    group: "Platform",
    items: [".NET / C#", "Azure", "SQL Server", "Angular"],
  },
  {
    group: "Delivery",
    items: [
      "GitHub Actions",
      "Playwright",
      "TestRail",
      "Feature-flag deployments",
    ],
  },
];
