const mockCreate = jest.fn();

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }));
});

import { analyzePost, AnalysisError } from "@/lib/services/ai-analysis.service";
import type { AnalysisInput } from "@/lib/services/ai-analysis.service";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.OPENAI_API_KEY = "test-openai-key";
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
});

const validInput: AnalysisInput = {
  sourceUrl: "https://example.com/article",
  scrapedContent: "Article claims that vaccines are harmful to children.",
  searchResults: [
    {
      title: "CDC Vaccine Safety",
      url: "https://cdc.gov/vaccines",
      content: "Vaccines are safe and effective according to CDC data.",
      score: 0.95,
    },
  ],
  userReports: [
    {
      headline: "Misleading vaccine claim",
      reportDescription: "This article makes false claims about vaccines.",
    },
  ],
  categorySlugs: ["health-medicine", "social-media-viral"],
};

const validAiResponse = {
  aiSummary: "The article makes unsubstantiated claims about vaccine safety that contradict CDC data.",
  aiCredibilityScore: 15,
  aiTransparencyNotes: "Cross-referenced with CDC data and WHO reports. The claims lack scientific evidence.",
  categories: [
    { slug: "health-medicine", confidence: 0.92 },
    { slug: "social-media-viral", confidence: 0.65 },
  ],
};

function mockOpenAiResponse(content: object | string) {
  mockCreate.mockResolvedValue({
    choices: [
      {
        message: {
          content: typeof content === "string" ? content : JSON.stringify(content),
        },
      },
    ],
  });
}

describe("analyzePost", () => {
  it("returns parsed analysis with summary, score, notes, and categories", async () => {
    mockOpenAiResponse(validAiResponse);

    const result = await analyzePost(validInput);

    expect(result.aiSummary).toBe(validAiResponse.aiSummary);
    expect(result.aiCredibilityScore).toBe(15);
    expect(result.aiTransparencyNotes).toBe(validAiResponse.aiTransparencyNotes);
    expect(result.categories).toHaveLength(2);
    expect(result.categories[0].slug).toBe("health-medicine");
  });

  it("calls OpenAI with json_object response format", async () => {
    mockOpenAiResponse(validAiResponse);

    await analyzePost(validInput);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.3,
      })
    );
  });

  it("includes source URL in the user prompt", async () => {
    mockOpenAiResponse(validAiResponse);

    await analyzePost(validInput);

    const messages = mockCreate.mock.calls[0][0].messages;
    const userMessage = messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("https://example.com/article");
  });

  it("includes scraped content in the user prompt", async () => {
    mockOpenAiResponse(validAiResponse);

    await analyzePost(validInput);

    const messages = mockCreate.mock.calls[0][0].messages;
    const userMessage = messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("vaccines are harmful");
  });

  it("includes search results in the user prompt", async () => {
    mockOpenAiResponse(validAiResponse);

    await analyzePost(validInput);

    const messages = mockCreate.mock.calls[0][0].messages;
    const userMessage = messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("CDC Vaccine Safety");
  });

  it("includes user reports in the user prompt", async () => {
    mockOpenAiResponse(validAiResponse);

    await analyzePost(validInput);

    const messages = mockCreate.mock.calls[0][0].messages;
    const userMessage = messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("Misleading vaccine claim");
  });

  it("includes category slugs in the system prompt", async () => {
    mockOpenAiResponse(validAiResponse);

    await analyzePost(validInput);

    const messages = mockCreate.mock.calls[0][0].messages;
    const systemMessage = messages.find((m: { role: string }) => m.role === "system");
    expect(systemMessage.content).toContain("health-medicine");
    expect(systemMessage.content).toContain("social-media-viral");
  });

  it("handles null scraped content gracefully", async () => {
    mockOpenAiResponse(validAiResponse);

    await analyzePost({ ...validInput, scrapedContent: null });

    const messages = mockCreate.mock.calls[0][0].messages;
    const userMessage = messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("content unavailable");
  });

  it("handles empty search results gracefully", async () => {
    mockOpenAiResponse(validAiResponse);

    await analyzePost({ ...validInput, searchResults: [] });

    const messages = mockCreate.mock.calls[0][0].messages;
    const userMessage = messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("No results found");
  });

  it("clamps credibility score to 0-100 range", async () => {
    mockOpenAiResponse({ ...validAiResponse, aiCredibilityScore: 150 });

    const result = await analyzePost(validInput);

    expect(result.aiCredibilityScore).toBe(100);
  });

  it("defaults credibility score to 50 for non-numeric values", async () => {
    mockOpenAiResponse({ ...validAiResponse, aiCredibilityScore: "unknown" });

    const result = await analyzePost(validInput);

    expect(result.aiCredibilityScore).toBe(50);
  });

  it("filters out categories with confidence <= 0.5", async () => {
    mockOpenAiResponse({
      ...validAiResponse,
      categories: [
        { slug: "health-medicine", confidence: 0.9 },
        { slug: "entertainment", confidence: 0.3 },
      ],
    });

    const result = await analyzePost(validInput);

    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].slug).toBe("health-medicine");
  });

  it("handles missing categories array gracefully", async () => {
    mockOpenAiResponse({ ...validAiResponse, categories: undefined });

    const result = await analyzePost(validInput);

    expect(result.categories).toEqual([]);
  });

  it("throws AnalysisError for empty OpenAI response", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    await expect(analyzePost(validInput)).rejects.toThrow(AnalysisError);
    await expect(analyzePost(validInput)).rejects.toMatchObject({
      message: "Empty response from OpenAI",
    });
  });

  it("throws for invalid JSON in OpenAI response", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "not valid json{{{" } }],
    });

    await expect(analyzePost(validInput)).rejects.toThrow();
  });

  it("propagates OpenAI API errors", async () => {
    mockCreate.mockRejectedValue(new Error("Rate limit exceeded"));

    await expect(analyzePost(validInput)).rejects.toThrow("Rate limit exceeded");
  });
});

describe("AnalysisError", () => {
  it("has correct name and message", () => {
    const error = new AnalysisError("test error");
    expect(error.name).toBe("AnalysisError");
    expect(error.message).toBe("test error");
    expect(error).toBeInstanceOf(Error);
  });
});
