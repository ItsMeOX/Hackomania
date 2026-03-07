import OpenAI from "openai";
import type { SearchResult } from "@/lib/services/search.service";

const MODEL = "gpt-4o-mini";

export type AnalysisInput = {
  sourceUrl: string;
  scrapedContent: string | null;
  searchResults: SearchResult[];
  userReports: { headline: string; reportDescription: string }[];
  categorySlugs: string[];
};

export type AnalysisResult = {
  aiSummary: string;
  aiCredibilityScore: number;
  aiTransparencyNotes: string;
  categories: { slug: string; confidence: number }[];
};

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function analyzePost(
  input: AnalysisInput
): Promise<AnalysisResult> {
  const openai = getClient();

  const systemPrompt = buildSystemPrompt(input.categorySlugs);
  const userPrompt = buildUserPrompt(input);

  const response = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new AnalysisError("Empty response from OpenAI");
  }

  return parseAnalysisResponse(content);
}

// TechDebt: Placeholder as of now (need to be in separate file in either json or yaml for prompt)
function buildSystemPrompt(categorySlugs: string[]): string {
  return `You are a fact-checking analyst. Analyze the provided content and produce a JSON response with these exact fields:

{
  "aiSummary": "A concise summary of the claim and its credibility (2-4 sentences)",
  "aiCredibilityScore": <number 0-100, where 0 = not credible at all, 100 = highly credible>,
  "aiTransparencyNotes": "Detailed explanation of how the score was determined, which sources were consulted, and key factors that influenced the assessment",
  "categories": [{"slug": "<category-slug>", "confidence": <0.0-1.0>}]
}

Available category slugs: ${categorySlugs.join(", ")}

Guidelines:
- Cross-reference the scraped content with web search results
- Consider the user reports as additional signal but verify independently
- Be specific in transparency notes about which sources agree or disagree
- Assign 1-3 categories maximum, only if confidence > 0.5
- If insufficient evidence exists, assign a mid-range score (40-60) and note the uncertainty`;
}

function buildUserPrompt(input: AnalysisInput): string {
  const sections: string[] = [];

  sections.push(`Source URL: ${input.sourceUrl}`);

  if (input.scrapedContent) {
    const trimmed = input.scrapedContent.slice(0, 4000);
    sections.push(`\nScraped Content:\n${trimmed}`);
  } else {
    sections.push("\nScraped Content: [Unable to scrape - content unavailable]");
  }

  if (input.searchResults.length > 0) {
    const searchSection = input.searchResults
      .map((r) => `- ${r.title} (${r.url}): ${r.content}`)
      .join("\n");
    sections.push(`\nWeb Search Results:\n${searchSection}`);
  } else {
    sections.push("\nWeb Search Results: [No results found]");
  }

  if (input.userReports.length > 0) {
    const reportsSection = input.userReports
      .map((r) => `- "${r.headline}": ${r.reportDescription}`)
      .join("\n");
    sections.push(`\nUser Reports (${input.userReports.length}):\n${reportsSection}`);
  }

  return sections.join("\n");
}

function parseAnalysisResponse(content: string): AnalysisResult {
  const parsed = JSON.parse(content);

  const aiSummary = String(parsed.aiSummary || "");
  const aiTransparencyNotes = String(parsed.aiTransparencyNotes || "");

  let aiCredibilityScore = Number(parsed.aiCredibilityScore);
  if (isNaN(aiCredibilityScore)) aiCredibilityScore = 50;
  aiCredibilityScore = Math.max(0, Math.min(100, aiCredibilityScore));

  const categories: { slug: string; confidence: number }[] = [];
  if (Array.isArray(parsed.categories)) {
    for (const cat of parsed.categories) {
      if (cat?.slug && typeof cat.confidence === "number" && cat.confidence > 0.5) {
        categories.push({
          slug: String(cat.slug),
          confidence: Math.max(0, Math.min(1, cat.confidence)),
        });
      }
    }
  }

  return { aiSummary, aiCredibilityScore, aiTransparencyNotes, categories };
}

export class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisError";
  }
}
