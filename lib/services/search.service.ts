import { tavily } from "@tavily/core";

const MAX_RESULTS = 5;

export type SearchResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};

let client: ReturnType<typeof tavily> | null = null;

function getClient(): ReturnType<typeof tavily> {
  if (!client) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new SearchError("TAVILY_API_KEY environment variable is not set");
    }
    client = tavily({ apiKey });
  }
  return client;
}

export async function searchForContext(
  query: string
): Promise<SearchResult[]> {
  const tavilyClient = getClient();

  const response = await tavilyClient.search(query, {
    searchDepth: "basic",
    maxResults: MAX_RESULTS,
    topic: "news",
  });

  return response.results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score,
  }));
}

export function buildSearchQuery(
  headline: string | null,
  sourceUrl: string
): string {
  const base = headline || sourceUrl;
  return `fact check: ${base}`;
}

export class SearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchError";
  }
}
