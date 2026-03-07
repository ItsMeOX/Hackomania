import * as cheerio from "cheerio";
import type { ContentScraper, ScrapeResult } from "@/lib/services/scraper.service";
import { ScrapeError } from "@/lib/services/scraper.service";

const SCRAPE_TIMEOUT_MS = 10_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; HackomaniaBot/1.0; +https://hackomania.example.com)";
const MAX_CONTENT_LENGTH = 10_000;

export class DefaultScraper implements ContentScraper {
  async scrape(url: string): Promise<ScrapeResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
        redirect: "follow",
      });
    } catch (error) {
      throw new ScrapeError(
        `Failed to fetch URL: ${error instanceof Error ? error.message : "Unknown error"}`,
        url
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new ScrapeError(
        `HTTP ${response.status}: ${response.statusText}`,
        url
      );
    }

    const html = await response.text();
    return this.extractContent(html);
  }

  private extractContent(html: string): ScrapeResult {
    const $ = cheerio.load(html);

    $("script, style, nav, footer, header, iframe, noscript").remove();

    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").text().trim() ||
      null;

    const description =
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      null;

    const thumbnailUrl =
      $("meta[property='og:image']").attr("content") || null;

    const content = $("article, main, [role='main']")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const fallbackContent =
      content || $("body").text().replace(/\s+/g, " ").trim();

    return {
      title,
      description,
      content: fallbackContent.slice(0, MAX_CONTENT_LENGTH),
      thumbnailUrl,
    };
  }
}
