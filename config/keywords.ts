// Rule-based job filtering — no AI. Edit these lists to tune what gets imported.
// A job is accepted if its title matches at least one entry in `titleInclude`
// (case-insensitive substring) and none in `titleExclude`.

export const titleInclude = [
  "mlops",
  "ml ops",
  "ml platform",
  "machine learning platform",
  "ml infrastructure",
  "machine learning infrastructure",
  "ml infra",
  "ai infrastructure",
  "ai platform engineer",
  "model infrastructure",
  "model serving",
  "ml systems engineer",
  "applied ml infrastructure",
];

export const titleExclude = [
  "intern",
  "internship",
  "sales",
  "marketing",
  "recruiter",
  "recruiting",
  "customer success",
  "solutions architect", // usually pre-sales, not eng
  "manager, sales",
  // "AI Infrastructure" / "ML Infrastructure" also shows up in non-engineering
  // titles (supply chain, finance, ops) that build out the physical/vendor
  // side of AI infra, not the software. Caught live in the first real import.
  "supply chain",
  "program manager",
  "demand planning",
  "capacity planning",
  "procurement",
];

// Keywords used to classify remote_type when the feed doesn't say explicitly.
export const remoteKeywords = ["remote", "work from home", "wfh", "distributed team"];
export const hybridKeywords = ["hybrid"];
export const onsiteKeywords = ["on-site", "onsite", "in office", "in-office"];

// role slug -> matching keywords, used to build /[role]-jobs pages
export const roleSlugs: Record<string, string[]> = {
  "mlops-engineer": ["mlops", "ml ops"],
  "ml-platform-engineer": ["ml platform", "machine learning platform"],
  "ml-infrastructure-engineer": ["ml infrastructure", "machine learning infrastructure", "ml infra"],
};
