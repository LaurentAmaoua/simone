import { parse } from "node-html-parser";

export interface SiteMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
}

export interface MetadataFetchResult {
  success: boolean;
  metadata?: SiteMetadata;
  error?: string;
}

/**
 * Fetches metadata from a given URL including Open Graph, Twitter card, and basic HTML metadata
 */
export async function fetchSiteMetadata(
  url: string,
): Promise<MetadataFetchResult> {
  try {
    // Validate URL
    const validUrl = new URL(url);

    // Fetch the HTML content
    const response = await fetch(validUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MetadataBot/1.0; +https://example.com/bot)",
      },
      // Don't follow too many redirects
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Get content type and ensure it's HTML
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return {
        success: false,
        error: "URL does not return HTML content",
      };
    }

    const html = await response.text();
    const root = parse(html);

    const metadata: SiteMetadata = {};

    // Extract Open Graph metadata (highest priority)
    metadata.title =
      root
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content") ??
      root
        .querySelector('meta[name="twitter:title"]')
        ?.getAttribute("content") ??
      root.querySelector("title")?.text?.trim();

    metadata.description =
      root
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content") ??
      root
        .querySelector('meta[name="twitter:description"]')
        ?.getAttribute("content") ??
      root.querySelector('meta[name="description"]')?.getAttribute("content");

    // Extract image with fallback hierarchy
    const ogImage = root
      .querySelector('meta[property="og:image"]')
      ?.getAttribute("content");
    const twitterImage = root
      .querySelector('meta[name="twitter:image"]')
      ?.getAttribute("content");
    const twitterImageSrc = root
      .querySelector('meta[name="twitter:image:src"]')
      ?.getAttribute("content");

    let imageUrl = ogImage ?? twitterImage ?? twitterImageSrc;

    // If no social media image found, try to find a logo or prominent image
    if (!imageUrl) {
      const logo = root
        .querySelector('link[rel*="icon"]')
        ?.getAttribute("href");
      if (logo) {
        imageUrl = logo;
      }
    }

    // Convert relative URLs to absolute URLs
    if (imageUrl) {
      try {
        metadata.image = new URL(imageUrl, validUrl.origin).toString();
      } catch {
        // If URL parsing fails, use original if it's already absolute
        if (imageUrl.startsWith("http")) {
          metadata.image = imageUrl;
        }
      }
    }

    metadata.url =
      root.querySelector('meta[property="og:url"]')?.getAttribute("content") ??
      validUrl.toString();

    metadata.siteName =
      root
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute("content") ??
      root
        .querySelector('meta[name="application-name"]')
        ?.getAttribute("content");

    return {
      success: true,
      metadata,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validates if a URL points to a valid image
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageBot/1.0)",
      },
    });

    if (!response.ok) return false;

    const contentType = response.headers.get("content-type") ?? "";
    return contentType.startsWith("image/");
  } catch {
    return false;
  }
}
