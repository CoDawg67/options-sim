// Seed list for the MLOps / ML Infrastructure niche. `ats_identifier` is the
// board token/subdomain (e.g. the {X} in boards.greenhouse.io/{X}).
//
// Live-verified via curl against the real endpoints (this sandbox's Node
// fetch() is blocked by a dev-only network allowlist, but curl isn't — see
// the build conversation). 11 of the original 34 guesses resolved; the rest
// are marked `manual`/null rather than left pointing at a wrong token that
// would just silently contribute zero jobs. `hugging-face` hit Workable's
// rate limit (429) rather than a clean pass/fail, so it's held back too —
// worth retrying by hand rather than trusting either guess.
//
// Run `npm run validate:companies` to re-check (works fine once deployed to
// Vercel, where there's no such allowlist).

export interface SeedCompany {
  name: string;
  slug: string;
  website: string;
  atsType: "greenhouse" | "lever" | "ashby" | "workable" | "manual";
  atsIdentifier: string | null;
}

export const seedCompanies: SeedCompany[] = [
  // ── Verified working ──────────────────────────────────────────────
  { name: "Anthropic", slug: "anthropic", website: "https://anthropic.com", atsType: "greenhouse", atsIdentifier: "anthropic" },
  { name: "OpenAI", slug: "openai", website: "https://openai.com", atsType: "ashby", atsIdentifier: "openai" },
  { name: "Scale AI", slug: "scale-ai", website: "https://scale.com", atsType: "greenhouse", atsIdentifier: "scaleai" },
  { name: "Databricks", slug: "databricks", website: "https://databricks.com", atsType: "greenhouse", atsIdentifier: "databricks" },
  { name: "LangChain", slug: "langchain", website: "https://langchain.com", atsType: "ashby", atsIdentifier: "langchain" },
  { name: "Mistral AI", slug: "mistral-ai", website: "https://mistral.ai", atsType: "lever", atsIdentifier: "mistral" },
  { name: "Stability AI", slug: "stability-ai", website: "https://stability.ai", atsType: "greenhouse", atsIdentifier: "stabilityai" },
  { name: "SambaNova Systems", slug: "sambanova", website: "https://sambanova.ai", atsType: "greenhouse", atsIdentifier: "sambanovasystems" },
  { name: "Arize AI", slug: "arize-ai", website: "https://arize.com", atsType: "greenhouse", atsIdentifier: "arizeai" },
  { name: "Baseten", slug: "baseten", website: "https://baseten.co", atsType: "ashby", atsIdentifier: "baseten" },
  { name: "Chalk", slug: "chalk", website: "https://chalk.ai", atsType: "ashby", atsIdentifier: "chalk" },

  // ── Rate-limited during validation, not confirmed either way ───────
  { name: "Hugging Face", slug: "hugging-face", website: "https://huggingface.co", atsType: "manual", atsIdentifier: null }, // was workable/"huggingface" — 429, retry by hand

  // ── Guessed token was wrong (404) — needs real research ─────────────
  { name: "Anyscale", slug: "anyscale", website: "https://anyscale.com", atsType: "manual", atsIdentifier: null },
  { name: "Modal", slug: "modal", website: "https://modal.com", atsType: "manual", atsIdentifier: null },
  { name: "Together AI", slug: "together-ai", website: "https://together.ai", atsType: "manual", atsIdentifier: null },
  { name: "Replicate", slug: "replicate", website: "https://replicate.com", atsType: "manual", atsIdentifier: null },
  { name: "Pinecone", slug: "pinecone", website: "https://pinecone.io", atsType: "manual", atsIdentifier: null },
  { name: "Weaviate", slug: "weaviate", website: "https://weaviate.io", atsType: "manual", atsIdentifier: null },
  { name: "Cohere", slug: "cohere", website: "https://cohere.com", atsType: "manual", atsIdentifier: null },
  { name: "Perplexity", slug: "perplexity", website: "https://perplexity.ai", atsType: "manual", atsIdentifier: null },
  { name: "Runway", slug: "runway", website: "https://runwayml.com", atsType: "manual", atsIdentifier: null },
  { name: "Character.AI", slug: "character-ai", website: "https://character.ai", atsType: "manual", atsIdentifier: null },
  { name: "Cerebras", slug: "cerebras", website: "https://cerebras.net", atsType: "manual", atsIdentifier: null },
  { name: "Groq", slug: "groq", website: "https://groq.com", atsType: "manual", atsIdentifier: null },
  { name: "Weights & Biases", slug: "weights-biases", website: "https://wandb.ai", atsType: "manual", atsIdentifier: null },
  { name: "WhyLabs", slug: "whylabs", website: "https://whylabs.ai", atsType: "manual", atsIdentifier: null },
  { name: "Fiddler AI", slug: "fiddler-ai", website: "https://fiddler.ai", atsType: "manual", atsIdentifier: null },
  { name: "Comet ML", slug: "comet-ml", website: "https://comet.com", atsType: "manual", atsIdentifier: null },
  { name: "Fireworks AI", slug: "fireworks-ai", website: "https://fireworks.ai", atsType: "manual", atsIdentifier: null },
  { name: "Predibase", slug: "predibase", website: "https://predibase.com", atsType: "manual", atsIdentifier: null },
  { name: "Union.ai", slug: "union-ai", website: "https://union.ai", atsType: "manual", atsIdentifier: null },
  { name: "Tecton", slug: "tecton", website: "https://tecton.ai", atsType: "manual", atsIdentifier: null },

  // ── Already unresearched at seed time ────────────────────────────────
  { name: "Neptune.ai", slug: "neptune-ai", website: "https://neptune.ai", atsType: "manual", atsIdentifier: null },
  { name: "ClearML", slug: "clearml", website: "https://clear.ml", atsType: "manual", atsIdentifier: null },
];
