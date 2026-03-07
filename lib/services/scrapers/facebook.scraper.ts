import * as cheerio from "cheerio";
import type { ContentScraper, ScrapeResult } from "@/lib/services/scraper.service";
import { ScrapeError } from "@/lib/services/scraper.service";

const OEMBED_URL = "https://www.facebook.com/plugins/post/oembed.json";

export class FacebookScraper implements ContentScraper {
  async scrape(url: string): Promise<ScrapeResult> {
    const oembedUrl = `${OEMBED_URL}?url=${encodeURIComponent(url)}`;

    let response: Response;
    try {
      response = await fetch(oembedUrl);
    } catch (error) {
      throw new ScrapeError(
        `Facebook oEmbed request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        url
      );
    }

    if (!response.ok) {
      throw new ScrapeError(
        `Facebook oEmbed HTTP ${response.status}: ${response.statusText}`,
        url
      );
    }

    const data = await response.json();
    const authorName: string = data.author_name || "Unknown";

    let content = "";
    if (data.html) {
      const $ = cheerio.load(data.html);
      content = $.text().replace(/\s+/g, " ").trim();
    }

    return {
      title: authorName ? `Facebook post by ${authorName}` : null,
      description: data.author_name ? `Post by ${authorName} on Facebook` : null,
      content,
      thumbnailUrl: null,
    };
  }
}
