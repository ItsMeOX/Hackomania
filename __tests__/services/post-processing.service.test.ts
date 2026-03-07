jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    report: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    aiPostCategory: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock("@/lib/services/scraper.service", () => ({
  scrapeUrl: jest.fn(),
  ScrapeError: class ScrapeError extends Error {
    constructor(message: string, public url: string) {
      super(message);
      this.name = "ScrapeError";
    }
  },
}));

jest.mock("@/lib/services/search.service", () => ({
  searchForContext: jest.fn(),
  buildSearchQuery: jest.fn(),
}));

jest.mock("@/lib/services/ai-analysis.service", () => ({
  analyzePost: jest.fn(),
}));

import { processPost } from "@/lib/services/post-processing.service";
import { prisma } from "@/lib/prisma";
import { scrapeUrl, ScrapeError } from "@/lib/services/scraper.service";
import { searchForContext, buildSearchQuery } from "@/lib/services/search.service";
import { analyzePost } from "@/lib/services/ai-analysis.service";

const mockPostFindUnique = prisma.post.findUnique as jest.Mock;
const mockPostUpdate = prisma.post.update as jest.Mock;
const mockReportFindMany = prisma.report.findMany as jest.Mock;
const mockCategoryFindMany = prisma.category.findMany as jest.Mock;
const mockAiPostCategoryUpsert = prisma.aiPostCategory.upsert as jest.Mock;
const mockScrapeUrl = scrapeUrl as jest.Mock;
const mockSearchForContext = searchForContext as jest.Mock;
const mockBuildSearchQuery = buildSearchQuery as jest.Mock;
const mockAnalyzePost = analyzePost as jest.Mock;

const mockPost = {
  id: "post-uuid-1",
  sourceUrl: "https://example.com/article",
  normalizedUrl: "https://example.com/article",
  headline: null,
  thumbnailUrl: null,
  scrapedContent: null,
  scrapeStatus: "pending",
  reportCount: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const mockScrapeResult = {
  title: "Article Title",
  description: "Article description",
  content: "Full article content about a claim.",
  thumbnailUrl: "https://example.com/image.jpg",
};

const mockSearchResults = [
  {
    title: "Fact Check Result",
    url: "https://factcheck.org/article",
    content: "This claim has been debunked.",
    score: 0.9,
  },
];

const mockAnalysisResult = {
  aiSummary: "The claim is misleading based on available evidence.",
  aiCredibilityScore: 25,
  aiTransparencyNotes: "Cross-referenced with fact-checking sources.",
  categories: [{ slug: "health-medicine", confidence: 0.85 }],
};

const mockReports = [
  {
    headline: "Misleading claim",
    reportDescription: "This article contains false information.",
  },
];

const mockCategories = [
  { id: 1, slug: "health-medicine" },
  { id: 2, slug: "politics-government" },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation();
  jest.spyOn(console, "warn").mockImplementation();

  mockPostFindUnique.mockResolvedValue(mockPost);
  mockPostUpdate.mockResolvedValue(mockPost);
  mockScrapeUrl.mockResolvedValue(mockScrapeResult);
  mockBuildSearchQuery.mockReturnValue("fact check: Article Title");
  mockSearchForContext.mockResolvedValue(mockSearchResults);
  mockReportFindMany.mockResolvedValue(mockReports);
  mockCategoryFindMany.mockResolvedValue(mockCategories);
  mockAnalyzePost.mockResolvedValue(mockAnalysisResult);
  mockAiPostCategoryUpsert.mockResolvedValue({});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
  (console.warn as jest.Mock).mockRestore();
});

describe("processPost", () => {
  it("runs the full pipeline and sets scrapeStatus to completed", async () => {
    await processPost("post-uuid-1");

    const statusUpdates = mockPostUpdate.mock.calls.map(
      (call) => call[0].data.scrapeStatus
    );
    expect(statusUpdates).toContain("processing");
    expect(statusUpdates).toContain("completed");
  });

  it("scrapes the source URL", async () => {
    await processPost("post-uuid-1");

    expect(mockScrapeUrl).toHaveBeenCalledWith("https://example.com/article");
  });

  it("saves scraped content, thumbnail, and headline to the post", async () => {
    await processPost("post-uuid-1");

    expect(mockPostUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scrapedContent: mockScrapeResult.content,
          thumbnailUrl: mockScrapeResult.thumbnailUrl,
          headline: mockScrapeResult.title,
        }),
      })
    );
  });

  it("does not overwrite existing headline with scraped title", async () => {
    mockPostFindUnique.mockResolvedValue({
      ...mockPost,
      headline: "Existing Headline",
    });

    await processPost("post-uuid-1");

    const scrapeUpdateCall = mockPostUpdate.mock.calls.find(
      (call) => call[0].data.scrapedContent
    );
    expect(scrapeUpdateCall[0].data.headline).toBe("Existing Headline");
  });

  it("performs web search with constructed query", async () => {
    await processPost("post-uuid-1");

    expect(mockBuildSearchQuery).toHaveBeenCalled();
    expect(mockSearchForContext).toHaveBeenCalledWith("fact check: Article Title");
  });

  it("fetches all user reports for AI context", async () => {
    await processPost("post-uuid-1");

    expect(mockReportFindMany).toHaveBeenCalledWith({
      where: { postId: "post-uuid-1" },
      select: { headline: true, reportDescription: true },
    });
  });

  it("passes combined context to AI analysis", async () => {
    await processPost("post-uuid-1");

    expect(mockAnalyzePost).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceUrl: "https://example.com/article",
        scrapedContent: mockScrapeResult.content,
        searchResults: mockSearchResults,
        userReports: mockReports,
        categorySlugs: ["health-medicine", "politics-government"],
      })
    );
  });

  it("saves AI analysis results to the post", async () => {
    await processPost("post-uuid-1");

    expect(mockPostUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          aiSummary: mockAnalysisResult.aiSummary,
          aiCredibilityScore: mockAnalysisResult.aiCredibilityScore,
          aiTransparencyNotes: mockAnalysisResult.aiTransparencyNotes,
          scrapeStatus: "completed",
        }),
      })
    );
  });

  it("upserts AI post categories", async () => {
    mockCategoryFindMany
      .mockResolvedValueOnce(mockCategories)
      .mockResolvedValueOnce([{ id: 1, slug: "health-medicine" }]);

    await processPost("post-uuid-1");

    expect(mockAiPostCategoryUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          postId_categoryId: { postId: "post-uuid-1", categoryId: 1 },
        },
        update: { confidence: 0.85 },
        create: {
          postId: "post-uuid-1",
          categoryId: 1,
          confidence: 0.85,
        },
      })
    );
  });

  it("continues AI analysis even if scraping fails", async () => {
    mockScrapeUrl.mockRejectedValue(
      new ScrapeError("HTTP 403: Forbidden", "https://example.com/article")
    );

    await processPost("post-uuid-1");

    expect(mockAnalyzePost).toHaveBeenCalledWith(
      expect.objectContaining({ scrapedContent: null })
    );
    const statusUpdates = mockPostUpdate.mock.calls.map(
      (call) => call[0].data.scrapeStatus
    );
    expect(statusUpdates).toContain("completed");
  });

  it("continues AI analysis even if web search fails", async () => {
    mockSearchForContext.mockRejectedValue(new Error("Tavily API error"));

    await processPost("post-uuid-1");

    expect(mockAnalyzePost).toHaveBeenCalledWith(
      expect.objectContaining({ searchResults: [] })
    );
  });

  it("sets scrapeStatus to failed when AI analysis throws", async () => {
    mockAnalyzePost.mockRejectedValue(new Error("OpenAI rate limit"));

    await processPost("post-uuid-1");

    expect(mockPostUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { scrapeStatus: "failed" },
      })
    );
  });

  it("returns early if post is not found", async () => {
    mockPostFindUnique.mockResolvedValue(null);

    await processPost("nonexistent-id");

    expect(mockPostUpdate).not.toHaveBeenCalled();
    expect(mockScrapeUrl).not.toHaveBeenCalled();
  });

  it("sets scrapeStatus to processing before starting pipeline", async () => {
    await processPost("post-uuid-1");

    const firstUpdate = mockPostUpdate.mock.calls[0];
    expect(firstUpdate[0].data.scrapeStatus).toBe("processing");
  });
});
