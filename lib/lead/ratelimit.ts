// Eenvoudige in-memory rate-limit per IP. Per serverinstantie; voldoende voor fase 1.
const buckets = new Map<string, number[]>();

export function rateLimited(key: string, max = 5, windowMs = 60 * 60 * 1000, now = Date.now()): boolean {
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  return false;
}
