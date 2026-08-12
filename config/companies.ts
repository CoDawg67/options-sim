// Seed list for the MLOps / ML Infrastructure niche. `ats_identifier` is the
// board token/subdomain (e.g. the {X} in boards.greenhouse.io/{X}), and is a
// best-effort guess based on the company's public careers page — ATS choice
// and board tokens change over time, and this sandbox's egress proxy blocks
// the ATS API domains directly, so **none of these have been live-verified**.
//
// Run `npm run validate:companies` after deploying (from an environment with
// real network access) to hit every endpoint and report which ones actually
// resolve. Prune or fix anything that fails — a 404 here is silently skipped
// by the importer, not fatal, but a wrong token means that company just never
// contributes jobs.

export interface SeedCompany {
  name: string;
  slug: string;
  website: string;
  atsType: "greenhouse" | "lever" | "ashby" | "workable" | "manual";
  atsIdentifier: string | null;
}

export const seedCompanies: SeedCompany[] = [
  { name: "Anthropic", slug: "anthropic", website: "https://anthropic.com", atsType: "greenhouse", atsIdentifier: "anthropic" },
  { name: "OpenAI", slug: "openai", website: "https://openai.com", atsType: "ashby", atsIdentifier: "openai" },
  { name: "Scale AI", slug: "scale-ai", website: "https://scale.com", atsType: "greenhouse", atsIdentifier: "scaleai" },
  { name: "Databricks", slug: "databricks", website: "https://databricks.com", atsType: "greenhouse", atsIdentifier: "databricks" },
  { name: "Hugging Face", slug: "hugging-face", website: "https://huggingface.co", atsType: "workable", atsIdentifier: "huggingface" },
  { name: "Anyscale", slug: "anyscale", website: "https://anyscale.com", atsType: "greenhouse", atsIdentifier: "anyscale" },
  { name: "Modal", slug: "modal", website: "https://modal.com", atsType: "ashby", atsIdentifier: "modal-labs" },
  { name: "Together AI", slug: "together-ai", website: "https://together.ai", atsType: "ashby", atsIdentifier: "together-ai" },
  { name: "Replicate", slug: "replicate", website: "https://replicate.com", atsType: "ashby", atsIdentifier: "replicate" },
  { name: "Pinecone", slug: "pinecone", website: "https://pinecone.io", atsType: "greenhouse", atsIdentifier: "pinecone" },
  { name: "Weaviate", slug: "weaviate", website: "https://weaviate.io", atsType: "greenhouse", atsIdentifier: "weaviate" },
  { name: "LangChain", slug: "langchain", website: "https://langchain.com", atsType: "ashby", atsIdentifier: "langchain" },
  { name: "Cohere", slug: "cohere", website: "https://cohere.com", atsType: "greenhouse", atsIdentifier: "cohere" },
  { name: "Mistral AI", slug: "mistral-ai", website: "https://mistral.ai", atsType: "lever", atsIdentifier: "mistral" },
  { name: "Perplexity", slug: "perplexity", website: "https://perplexity.ai", atsType: "greenhouse", atsIdentifier: "perplexityai" },
  { name: "Runway", slug: "runway", website: "https://runwayml.com", atsType: "greenhouse", atsIdentifier: "runwayml" },
  { name: "Stability AI", slug: "stability-ai", website: "https://stability.ai", atsType: "greenhouse", atsIdentifier: "stabilityai" },
  { name: "Character.AI", slug: "character-ai", website: "https://character.ai", atsType: "greenhouse", atsIdentifier: "characterai" },
  { name: "Cerebras", slug: "cerebras", website: "https://cerebras.net", atsType: "greenhouse", atsIdentifier: "cerebrassystems" },
  { name: "Groq", slug: "groq", website: "https://groq.com", atsType: "greenhouse", atsIdentifier: "groq" },
  { name: "SambaNova Systems", slug: "sambanova", website: "https://sambanova.ai", atsType: "greenhouse", atsIdentifier: "sambanovasystems" },
  { name: "Weights & Biases", slug: "weights-biases", website: "https://wandb.ai", atsType: "greenhouse", atsIdentifier: "wandb" },
  { name: "Arize AI", slug: "arize-ai", website: "https://arize.com", atsType: "greenhouse", atsIdentifier: "arizeai" },
  { name: "WhyLabs", slug: "whylabs", website: "https://whylabs.ai", atsType: "lever", atsIdentifier: "whylabs" },
  { name: "Fiddler AI", slug: "fiddler-ai", website: "https://fiddler.ai", atsType: "lever", atsIdentifier: "fiddlerlabs" },
  { name: "Comet ML", slug: "comet-ml", website: "https://comet.com", atsType: "lever", atsIdentifier: "cometml" },
  { name: "Neptune.ai", slug: "neptune-ai", website: "https://neptune.ai", atsType: "manual", atsIdentifier: null },
  { name: "ClearML", slug: "clearml", website: "https://clear.ml", atsType: "manual", atsIdentifier: null },
  { name: "Baseten", slug: "baseten", website: "https://baseten.co", atsType: "ashby", atsIdentifier: "baseten" },
  { name: "Fireworks AI", slug: "fireworks-ai", website: "https://fireworks.ai", atsType: "ashby", atsIdentifier: "fireworks-ai" },
  { name: "Predibase", slug: "predibase", website: "https://predibase.com", atsType: "greenhouse", atsIdentifier: "predibase" },
  { name: "Chalk", slug: "chalk", website: "https://chalk.ai", atsType: "ashby", atsIdentifier: "chalk" },
  { name: "Union.ai", slug: "union-ai", website: "https://union.ai", atsType: "ashby", atsIdentifier: "union-ai" },
  { name: "Tecton", slug: "tecton", website: "https://tecton.ai", atsType: "greenhouse", atsIdentifier: "tecton" },
];
