import { logger } from '../logger';
import { recordKeyError, type ApifyKey } from './apifyKeys';

const ACTOR_ID = 'supreme_coder~linkedin-post';

export interface RawApifyPost {
  authorName?: string;
  authorProfileId?: string;
  authorHeadline?: string;
  author?: { occupation?: string };
  text?: string;
  url?: string;
  postedAtISO?: string;
  [key: string]: any;
}

export interface ApifyRunResult {
  posts: RawApifyPost[];
  error?: string;
  errorType?: string;
}

/**
 * Run the Apify LinkedIn-post actor synchronously and return raw posts.
 * Lifted from old VPS scraper.
 */
export async function runApifyScrape(
  urls: string[],
  limitPerSource: number,
  apifyKey: ApifyKey,
  timeoutSec = 180
): Promise<ApifyRunResult> {
  const input = { urls, limitPerSource, deepScrape: false, rawData: false };
  logger.info({ urls: urls.length, limitPerSource }, 'Apify: starting scrape');

  const url =
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items` +
    `?token=${apifyKey.key}&timeout=${timeoutSec}&memory=512`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    let errorType = 'unknown';
    try {
      const parsed = JSON.parse(txt);
      errorType = parsed?.error?.type || 'unknown';
    } catch {
      /* not JSON */
    }
    logger.error({ status: res.status, errorType, body: txt.substring(0, 300) }, 'Apify: run failed');

    if (errorType !== 'unknown') {
      await recordKeyError(apifyKey.id, errorType, txt.substring(0, 200)).catch(() => {});
    }

    return { posts: [], error: `Apify ${res.status}: ${txt.substring(0, 200)}`, errorType };
  }

  const items = (await res.json()) as RawApifyPost[];
  logger.info({ count: items.length }, 'Apify: got raw posts');
  return { posts: items };
}
