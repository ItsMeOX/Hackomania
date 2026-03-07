import type { ContentScraper, ScrapeResult } from "@/lib/services/scraper.service";
import { ScrapeError } from "@/lib/services/scraper.service";

const OEMBED_URL = "https://www.tiktok.com/oembed";

export class TikTokScraper implements ContentScraper {
  async scrape(url: string): Promise<ScrapeResult> {
    const oembedUrl = `${OEMBED_URL}?url=${encodeURIComponent(url)}`;

    let response: Response;
    try {
      response = await fetch(oembedUrl);
    } catch (error) {
      throw new ScrapeError(
        `TikTok oEmbed request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        url
      );
    }

    if (!response.ok) {
      throw new ScrapeError(
        `TikTok oEmbed HTTP ${response.status}: ${response.statusText}`,
        url
      );
    }

    const data = await response.json();

    return {
      title: data.title || null,
      description: data.author_name ? `TikTok by ${data.author_name}` : null,
      content: data.title || "",
      thumbnailUrl: data.thumbnail_url || null,
    };
  }
}
