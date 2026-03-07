import { DefaultScraper } from "@/lib/services/scrapers/default.scraper";
import { TikTokScraper } from "@/lib/services/scrapers/tiktok.scraper";
import { XScraper } from "@/lib/services/scrapers/x.scraper";
import { FacebookScraper } from "@/lib/services/scrapers/facebook.scraper";
import { RedditScraper } from "@/lib/services/scrapers/reddit.scraper";
import { InstagramScraper } from "@/lib/services/scrapers/instagram.scraper";

export type ScrapeResult = {
  title: string | null;
  description: string | null;
  content: string;
  thumbnailUrl: string | null;
};

export interface ContentScraper {
  scrape(url: string): Promise<ScrapeResult>;
}

export function getScraperForUrl(url: string): ContentScraper {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes("tiktok.com")) return new TikTokScraper();
  if (hostname.includes("x.com") || hostname.includes("twitter.com"))
    return new XScraper();
  if (hostname.includes("facebook.com") || hostname.includes("fb.com"))
    return new FacebookScraper();
  if (hostname.includes("reddit.com")) return new RedditScraper();
  if (hostname.includes("instagram.com")) return new InstagramScraper();

  return new DefaultScraper();
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const scraper = getScraperForUrl(url);
  return scraper.scrape(url);
}

export class ScrapeError extends Error {
  constructor(
    message: string,
    public url: string
  ) {
    super(message);
    this.name = "ScrapeError";
  }
}
