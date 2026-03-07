import { prisma } from "@/lib/prisma";
import { scrapeUrl, ScrapeError } from "@/lib/services/scraper.service";
import {
  searchForContext,
  buildSearchQuery,
} from "@/lib/services/search.service";
import { analyzePost } from "@/lib/services/ai-analysis.service";

export async function processPost(postId: string): Promise<void> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    console.error(`processPost: post ${postId} not found`);
    return;
  }

  await prisma.post.update({
    where: { id: postId },
    data: { scrapeStatus: "processing" },
  });

  try {
    let scrapedContent: string | null = null;
    let thumbnailUrl: string | null = post.thumbnailUrl;
    let headline: string | null = post.headline;

    try {
      const scrapeResult = await scrapeUrl(post.sourceUrl);
      scrapedContent = scrapeResult.content;
      thumbnailUrl = scrapeResult.thumbnailUrl || thumbnailUrl;
      headline = headline || scrapeResult.title;

      await prisma.post.update({
        where: { id: postId },
        data: {
          scrapedContent: scrapeResult.content,
          thumbnailUrl,
          headline,
        },
      });
    } catch (error) {
      if (error instanceof ScrapeError) {
        console.warn(`Scraping failed for ${post.sourceUrl}: ${error.message}`);
      } else {
        console.warn(`Scraping failed for ${post.sourceUrl}:`, error);
      }
    }

    const searchQuery = buildSearchQuery(headline, post.sourceUrl);
    let searchResults: Awaited<ReturnType<typeof searchForContext>> = [];
    try {
      searchResults = await searchForContext(searchQuery);
    } catch (error) {
      console.warn(`Web search failed for post ${postId}:`, error);
    }

    const reports = await prisma.report.findMany({
      where: { postId },
      select: { headline: true, reportDescription: true },
    });

    const categories = await prisma.category.findMany({
      select: { slug: true },
    });
    const categorySlugs = categories.map((c) => c.slug);

    const analysis = await analyzePost({
      sourceUrl: post.sourceUrl,
      scrapedContent,
      searchResults,
      userReports: reports,
      categorySlugs,
    });

    await prisma.post.update({
      where: { id: postId },
      data: {
        aiSummary: analysis.aiSummary,
        aiCredibilityScore: analysis.aiCredibilityScore,
        aiTransparencyNotes: analysis.aiTransparencyNotes,
        scrapeStatus: "completed",
      },
    });

    if (analysis.categories.length > 0) {
      const categoryMap = await prisma.category.findMany({
        where: { slug: { in: analysis.categories.map((c) => c.slug) } },
        select: { id: true, slug: true },
      });
      const slugToId = new Map(categoryMap.map((c) => [c.slug, c.id]));

      for (const cat of analysis.categories) {
        const categoryId = slugToId.get(cat.slug);
        if (!categoryId) continue;

        await prisma.aiPostCategory.upsert({
          where: {
            postId_categoryId: { postId, categoryId },
          },
          update: { confidence: cat.confidence },
          create: {
            postId,
            categoryId,
            confidence: cat.confidence,
          },
        });
      }
    }
  } catch (error) {
    console.error(`processPost failed for ${postId}:`, error);
    await prisma.post.update({
      where: { id: postId },
      data: { scrapeStatus: "failed" },
    });
  }
}
