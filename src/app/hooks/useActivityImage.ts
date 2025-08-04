import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

interface UseActivityImageResult {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to dynamically fetch and cache activity images from external URLs
 */
export function useActivityImage(
  externalUrl: string | null | undefined,
): UseActivityImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadataMutation = api.activity.fetchSiteMetadata.useMutation();

  useEffect(() => {
    if (!externalUrl) {
      setImageUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check if we already have this image in localStorage (simple cache)
    const cacheKey = `activity-image-${externalUrl}`;
    const cachedImage = localStorage.getItem(cacheKey);

    if (cachedImage) {
      try {
        const cached = JSON.parse(cachedImage) as {
          imageUrl: string | null;
          timestamp: number;
        };
        // Cache for 24 hours
        const isExpired = Date.now() - cached.timestamp > 24 * 60 * 60 * 1000;

        if (!isExpired) {
          setImageUrl(cached.imageUrl);
          setIsLoading(false);
          setError(null);
          return;
        }
      } catch {
        // If parsing fails, remove the corrupted cache entry
        localStorage.removeItem(cacheKey);
      }
    }

    // Fetch metadata if not cached or expired
    setIsLoading(true);
    setError(null);

    fetchMetadataMutation.mutate(
      { url: externalUrl },
      {
        onSuccess: (result) => {
          const fetchedImageUrl = result.metadata?.image ?? null;
          setImageUrl(fetchedImageUrl);
          setIsLoading(false);

          // Cache the result
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                imageUrl: fetchedImageUrl,
                timestamp: Date.now(),
              }),
            );
          } catch (err) {
            // If localStorage is full, just continue without caching
            console.warn("Failed to cache image URL:", err);
          }
        },
        onError: (err) => {
          setError(err.message);
          setIsLoading(false);
          setImageUrl(null);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalUrl]); // fetchMetadataMutation intentionally omitted to prevent infinite loop

  return {
    imageUrl,
    isLoading,
    error,
  };
}
