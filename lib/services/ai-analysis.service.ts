import OpenAI from "openai";
import type { SearchResult } from "@/lib/services/search.service";
import aiConfig from "@/lib/config/ai-analysis.config.json";

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
    model: aiConfig.model,
    response_format: { type: aiConfig.responseFormat as "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: aiConfig.temperature,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new AnalysisError("Empty response from OpenAI");
  }

  return parseAnalysisResponse(content);
}

function buildSystemPrompt(categorySlugs: string[]): string {
  const { role, responseSchema, guidelines } = aiConfig.systemPrompt;
  const guidelinesText = guidelines.map((g) => `- ${g}`).join("\n");

  return `${role}

${responseSchema}

Available category slugs: ${categorySlugs.join(", ")}

Guidelines:
${guidelinesText}`;
}

function buildUserPrompt(input: AnalysisInput): string {
  const sections: string[] = [];

  sections.push(`Source URL: ${input.sourceUrl}`);

  if (input.scrapedContent) {
    const trimmed = input.scrapedContent.slice(
      0,
      aiConfig.userPrompt.maxScrapedContentLength
    );
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
  if (isNaN(aiCredibilityScore))
    aiCredibilityScore = aiConfig.scoring.defaultOnParseFailure;
  aiCredibilityScore = Math.max(
    aiConfig.scoring.min,
    Math.min(aiConfig.scoring.max, aiCredibilityScore)
  );

  const categories: { slug: string; confidence: number }[] = [];
  if (Array.isArray(parsed.categories)) {
    for (const cat of parsed.categories) {
      if (
        cat?.slug &&
        typeof cat.confidence === "number" &&
        cat.confidence > aiConfig.categories.minConfidence
      ) {
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
