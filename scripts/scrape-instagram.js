/**
 * Instagram Per-Account Post ID Scraper (v3)
 *
 * 1. Gets the list of accounts you follow from Instagram directly
 * 2. Visits each profile and grabs up to 10 recent post IDs
 * 3. Skips posts already in the previous scrape (deduplication)
 * 4. Groups output by school (UBC/SFU/other) using accounts.json as lookup
 *
 * Config:  data/accounts.json  (school grouping lookup — optional)
 * Output:  data/scraped_posts.json
 *
 * Run: npm run scrape:instagram
 */
require('dotenv').config();

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { randomInt } = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── Config ───────────────────────────────────────────────────────────────────
const USER_DATA_DIR = path.resolve(
  process.env.IG_USER_DATA_DIR || './.user_data/instagram'
);
const HEADLESS = process.env.IG_HEADLESS === 'true';
const MAX_POSTS_PER_ACCOUNT = parseInt(process.env.IG_MAX_POSTS, 10) || 10;
const DETAILS_PER_ACCOUNT = parseInt(process.env.IG_DETAILS_PER_ACCOUNT, 10) || 2;

const ACCOUNTS_PATH = path.resolve(__dirname, '..', 'data', 'accounts.json');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'data', 'scraped_posts.json');
const IMAGE_DIR = path.resolve(__dirname, '..', 'data', 'images');

const CHROME_PATH =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download an image from a URL and save it locally.
 * Returns the local file path on success, or null on failure.
 */
function downloadImage(url, shortcode) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    try {
      if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
      const filePath = path.join(IMAGE_DIR, `${shortcode}.jpg`);
      const proto = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(filePath);
      proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(filePath);
          return resolve(downloadImage(res.headers.location, shortcode));
        }
        if (res.statusCode !== 200) {
          file.close();
          try { fs.unlinkSync(filePath); } catch { /* ignore */ }
          return resolve(null);
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(filePath); });
        file.on('error', () => { try { fs.unlinkSync(filePath); } catch { /* ignore */ } resolve(null); });
      }).on('error', () => { try { fs.unlinkSync(filePath); } catch { /* ignore */ } resolve(null); });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Load the school-grouping lookup from accounts.json.
 * Returns a Map<username, school>.
 */
function loadSchoolLookup() {
  const lookup = new Map();
  if (!fs.existsSync(ACCOUNTS_PATH)) {
    console.log('  (No accounts.json found — all accounts will be grouped as "other")');
    return lookup;
  }
  const data = JSON.parse(fs.readFileSync(ACCOUNTS_PATH, 'utf-8'));
  for (const [school, usernames] of Object.entries(data)) {
    for (const u of usernames) {
      lookup.set(u.toLowerCase(), school.toLowerCase());
    }
  }
  return lookup;
}

/**
 * Load previously scraped data. Returns a Set of all known post IDs per account.
 * Map<username, Set<postId>>
 */
function loadExistingPosts() {
  const existing = new Map();
  if (!fs.existsSync(OUTPUT_PATH)) return existing;

  try {
    const data = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    if (data.schools) {
      for (const schoolData of Object.values(data.schools)) {
        for (const [username, acctData] of Object.entries(schoolData)) {
          if (acctData.post_ids && acctData.post_ids.length > 0) {
            existing.set(username, new Set(acctData.post_ids));
          }
        }
      }
    }
  } catch {
    console.log('  (Could not parse existing scraped_posts.json — starting fresh)');
  }
  return existing;
}

// ── Login ────────────────────────────────────────────────────────────────────

async function isOnFeed(page) {
  return page.evaluate(() => {
    const url = window.location.href;
    const onMainPage =
      url.includes('instagram.com') &&
      !url.includes('/accounts/login') &&
      !url.includes('/challenge');
    const hasContent =
      !!document.querySelector('article') ||
      !!document.querySelector('svg[aria-label="Home"]') ||
      !!document.querySelector('a[href="/direct/inbox/"]');
    return onMainPage && hasContent;
  });
}

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

async function ensureLoggedIn(page) {
  console.log('Navigating to Instagram…');
  await page.goto('https://www.instagram.com/', {
    waitUntil: 'networkidle2',
    timeout: 30_000,
  });

  await sleep(3000);

  if (await isOnFeed(page)) {
    console.log('Already logged in!');
    return;
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  LOGIN REQUIRED                                        ║');
  console.log('║  Please log in manually in the browser window.         ║');
  console.log('║  The script will continue once the feed loads.         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const start = Date.now();
  while (Date.now() - start < LOGIN_TIMEOUT_MS) {
    await sleep(5000);
    try {
      if (await isOnFeed(page)) {
        console.log('Login detected!');
        return;
      }
    } catch { /* navigating */ }
  }
  throw new Error('Timed out waiting for login.');
}

// ── Get Following List ───────────────────────────────────────────────────────

async function getFollowingList(page) {
  const username = process.env.IG_USERNAME;
  if (!username) {
    throw new Error('IG_USERNAME not set in .env — needed to find your Following list.');
  }

  console.log(`\nFetching Following list for @${username}…`);

  // Go directly to the profile page
  await page.goto(`https://www.instagram.com/${username}/`, {
    waitUntil: 'networkidle2',
    timeout: 20_000,
  });
  await sleep(2000);

  // Click the "following" link — look for the href that contains /<username>/following
  const followingClicked = await page.evaluate((u) => {
    // Try exact following href first
    const exactLink = document.querySelector(`a[href="/${u}/following/"]`);
    if (exactLink) { exactLink.click(); return true; }

    // Fallback: any link with /following in the href
    const links = document.querySelectorAll('a[href*="/following"]');
    for (const link of links) {
      link.click();
      return true;
    }

    // Last resort: find by text
    const allLinks = document.querySelectorAll('a');
    for (const link of allLinks) {
      const text = (link.innerText || '').toLowerCase();
      if (text.includes('following') && !text.includes('followers')) {
        link.click();
        return true;
      }
    }
    return false;
  }, username);

  if (!followingClicked) {
    throw new Error('Could not find the "Following" link on your profile page.');
  }

  await sleep(3000);

  // Scroll the following modal/dialog to load all accounts
  console.log('Scrolling through Following list…');

  const followingUsernames = new Set();
  let staleCount = 0;
  const MAX_STALE = 8; // Instagram loads in chunks, give it more tries

  for (let i = 0; i < 200; i++) { // safety limit
    const newNames = await page.evaluate(() => {
      const names = [];
      const dialog = document.querySelector('div[role="dialog"]') || document;
      const links = dialog.querySelectorAll('a[href^="/"]');
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const match = href.match(/^\/([A-Za-z0-9._]+)\/$/);
        if (match) {
          const name = match[1].toLowerCase();
          const skip = ['explore', 'reels', 'direct', 'accounts', 'p', 'stories', 'reel'];
          if (!skip.includes(name)) {
            names.push(name);
          }
        }
      }
      return names;
    });

    const prevSize = followingUsernames.size;
    for (const name of newNames) {
      followingUsernames.add(name);
    }

    if (followingUsernames.size > prevSize) {
      staleCount = 0;
      if (i % 5 === 0) {
        console.log(`  … ${followingUsernames.size} accounts found so far`);
      }
    } else {
      staleCount++;
      if (staleCount >= MAX_STALE) break;
    }

    // Scroll the dialog — find the actual scrollable container
    await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return;

      // Find all divs inside the dialog and pick the one that's scrollable
      const divs = dialog.querySelectorAll('div');
      let scrollTarget = null;
      let maxHeight = 0;

      for (const div of divs) {
        // A scrollable container has scrollHeight > clientHeight
        if (div.scrollHeight > div.clientHeight && div.clientHeight > 100) {
          // Among multiple scrollable divs, pick the one with the largest scrollHeight
          if (div.scrollHeight > maxHeight) {
            maxHeight = div.scrollHeight;
            scrollTarget = div;
          }
        }
      }

      if (scrollTarget) {
        scrollTarget.scrollTop = scrollTarget.scrollHeight;
      }
    });
    await sleep(1000);
  }

  // Close the dialog
  await page.keyboard.press('Escape');
  await sleep(500);

  console.log(`Found ${followingUsernames.size} accounts in Following list.`);
  return [...followingUsernames];
}

// ── Per-Profile Scraping ─────────────────────────────────────────────────────

async function scrapeProfile(page, username, existingPostIds) {
  const profileUrl = `https://www.instagram.com/${username}/`;
  await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 20_000 });
  await sleep(2500);

  // Check if profile exists
  const notFound = await page.evaluate(() => {
    const body = document.body.innerText || '';
    return body.includes("Sorry, this page isn't available") ||
           body.includes("This page isn't available");
  });
  if (notFound) return { status: 'not_found', post_ids: [] };

  // Check if private
  const isPrivate = await page.evaluate(() => {
    const body = document.body.innerText || '';
    return body.includes('This account is private') ||
           body.includes('This Account is Private');
  });
  if (isPrivate) return { status: 'private', post_ids: [] };

  // Extract post IDs
  const allPostIds = await page.evaluate((maxPosts) => {
    const ids = [];
    const seen = new Set();

    // Strategy 1: find links
    const links = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
    for (const link of links) {
      if (ids.length >= maxPosts) break;
      const href = link.getAttribute('href') || '';
      const match = href.match(/^\/(p|reel)\/([^/]+)/);
      if (match && !seen.has(match[2])) {
        seen.add(match[2]);
        ids.push(match[2]);
      }
    }

    // Strategy 2: HTML regex fallback
    if (ids.length === 0) {
      const html = document.documentElement.outerHTML;
      const pattern = /\/(p|reel)\/([A-Za-z0-9_-]+)/g;
      for (const m of html.matchAll(pattern)) {
        if (ids.length >= maxPosts) break;
        if (!seen.has(m[2])) {
          seen.add(m[2]);
          ids.push(m[2]);
        }
      }
    }

    return ids;
  }, MAX_POSTS_PER_ACCOUNT);

  // Deduplication: stop at the first post we've already seen
  const newPostIds = [];
  for (const id of allPostIds) {
    if (existingPostIds.has(id)) {
      // We've already scraped this post — everything after is also old
      break;
    }
    newPostIds.push(id);
  }

  const skipped = allPostIds.length - newPostIds.length;
  return {
    status: skipped > 0 ? 'partial' : 'ok',
    post_ids: newPostIds,
    skipped,
    total_found: allPostIds.length,
  };
}

// ── Post Detail Scraping ─────────────────────────────────────────────────────

/**
 * Visit a single post/reel page and extract the caption + first image.
 * Retries up to `maxRetries` times on failure.
 */
async function scrapePostDetails(page, shortcode, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // /p/ works for both posts and reels (Instagram redirects as needed)
      const postUrl = `https://www.instagram.com/p/${shortcode}/`;
      await page.goto(postUrl, { waitUntil: 'networkidle2', timeout: 25_000 });
      await sleep(2000 + randomInt(500, 1500));

      // ── Extract caption ────────────────────────────────────────────────
      const caption = await page.evaluate(() => {
        // Strategy 1: og:description meta (most reliable)
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) {
          const content = ogDesc.getAttribute('content') || '';
          // IG og:description format: "N Likes, N Comments - @user: \"caption\""
          const quoteMatch = content.match(/["\u201c](.+)["\u201d]\s*$/);
          if (quoteMatch) return quoteMatch[1];
          const colonMatch = content.match(/:\s*["\u201c](.+)["\u201d]/);
          if (colonMatch) return colonMatch[1];
          return content;
        }

        // Strategy 2: og:title meta
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
          const content = ogTitle.getAttribute('content') || '';
          if (content.length > 10) return content;
        }

        // Strategy 3: caption in the DOM (article > h1 or long spans)
        const article = document.querySelector('article');
        if (article) {
          const h1 = article.querySelector('h1');
          if (h1 && h1.textContent.trim().length > 0) return h1.textContent.trim();
          const spans = article.querySelectorAll('span');
          for (const span of spans) {
            const text = span.textContent.trim();
            if (text.length > 30) return text;
          }
        }

        // Strategy 4: description meta
        const descMeta = document.querySelector('meta[name="description"]');
        if (descMeta) return descMeta.getAttribute('content') || '';

        return '';
      });

      // ── Extract first image URL ────────────────────────────────────────
      const imageUrl = await page.evaluate(() => {
        // Strategy 1: first responsive image in the article
        const article = document.querySelector('article');
        if (article) {
          const imgs = article.querySelectorAll('img[src]');
          for (const img of imgs) {
            const src = img.getAttribute('src') || '';
            const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width') || '0', 10);
            const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height') || '0', 10);
            // Skip tiny avatars and icons (usually 32x32 to 50x50)
            if (src.startsWith('http') && ((w === 0 && h === 0) || (w > 150 && h > 150))) return src;
          }
        }

        // Strategy 2: any large image on the page not in header
        const allImgs = document.querySelectorAll('img[src^="http"]');
        for (const img of allImgs) {
          const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width') || '0', 10);
          if ((w === 0 || w > 250) && !img.closest('header')) return img.getAttribute('src');
        }

        // Strategy 3: og:image meta tag (fallback)
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) {
          const url = ogImage.getAttribute('content') || '';
          if (url.startsWith('http')) return url;
        }

        return '';
      });

      // Download the image locally
      let imagePath = null;
      if (imageUrl) {
        imagePath = await downloadImage(imageUrl, shortcode);
      }

      return {
        caption: caption || '',
        image_url: imageUrl || '',
        image_local_path: imagePath
          ? path.relative(path.resolve(__dirname, '..'), imagePath)
          : null,
      };
    } catch (err) {
      console.log(`      \u26A0 Attempt ${attempt}/${maxRetries} failed for ${shortcode}: ${err.message}`);
      if (attempt < maxRetries) {
        await sleep(randomInt(3000, 6000));
      }
    }
  }

  // All retries exhausted
  return { caption: '', image_url: '', image_local_path: null };
}

// ── Main ─────────────────────────────────────────────────────────────────────

let stopRequested = false;
process.on('SIGINT', () => {
  console.log('\n\n[!] Interrupt caught. Stopping after current profile finishes...');
  stopRequested = true;
});
process.on('SIGTERM', () => {
  console.log('\n\n[!] Terminate caught. Stopping after current profile finishes...');
  stopRequested = true;
});

function saveOutput(output) {
  let total_accounts = 0;
  let total_posts = 0;
  for (const schoolData of Object.values(output.schools)) {
    total_accounts += Object.keys(schoolData).length;
    total_posts += Object.values(schoolData).reduce((s, a) => s + (a.post_count || 0), 0);
  }
  output.total_accounts = total_accounts;
  output.total_posts = total_posts;
  
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
}

async function main() {
  const schoolLookup = loadSchoolLookup();
  const existingPosts = loadExistingPosts();
  console.log(`Loaded school lookup: ${schoolLookup.size} accounts mapped`);
  console.log(`Loaded existing data: ${existingPosts.size} accounts with scraped posts`);

  console.log(`\nLaunching Chrome (headless: ${HEADLESS})\u2026`);

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    userDataDir: USER_DATA_DIR,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Ensure image directory exists
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  // Initialize output with existing data to prevent overwriting
  let output;
  try {
    output = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    output.scraped_at = new Date().toISOString();
  } catch {
    output = {
      scraped_at: new Date().toISOString(),
      schools: {},
      total_accounts: 0,
      total_posts: 0,
      skipped_posts: 0,
    };
  }

  // --- MIGRATION: Move top-level post_details into deeply nested structure ---
  if (output.post_details && Object.keys(output.post_details).length > 0) {
    for (const [school, accounts] of Object.entries(output.schools)) {
      for (const [username, acctData] of Object.entries(accounts)) {
        if (!acctData.posts) acctData.posts = {};
        if (acctData.post_ids) {
          for (const shortcode of acctData.post_ids) {
            if (output.post_details[shortcode]) {
              acctData.posts[shortcode] = output.post_details[shortcode];
            }
          }
        }
      }
    }
    delete output.post_details; // Remove the old top-level property
  }
  
  if (output.post_details) delete output.post_details;

  try {
    await ensureLoggedIn(page);

    // Step 1: Get the following list from Instagram
    const followingList = await getFollowingList(page);

    // Step 2: Scrape each profile
    console.log(`\nScraping ${followingList.length} accounts…\n`);

    for (let i = 0; i < followingList.length; i++) {
      const username = followingList[i];
      const school = schoolLookup.get(username.toLowerCase()) || 'other';
      const existingIds = existingPosts.get(username) || new Set();

      console.log(`[${i + 1}/${followingList.length}] @${username} (${school})`);

      try {
        const result = await scrapeProfile(page, username, existingIds);

        if (result.status === 'not_found') {
          console.log(`    ✗ Profile not found`);
        } else if (result.status === 'private') {
          console.log(`    🔒 Private account`);
        } else if (result.status === 'partial') {
          console.log(`    ✓ ${result.post_ids.length} new post(s) (skipped ${result.skipped} existing)`);
        } else {
          console.log(`    ✓ ${result.post_ids.length} post(s) scraped`);
        }

        // Merge new + existing post IDs for this account
        const mergedPostIds = [...result.post_ids, ...(existingIds)];
        // Deduplicate while preserving order
        const uniquePostIds = [...new Set(mergedPostIds)];

        // Add to output grouped by school
        const existingNestedPosts = output.schools[school]?.[username]?.posts || {};

        if (!output.schools[school]) output.schools[school] = {};
        output.schools[school][username] = {
          post_ids: uniquePostIds,
          posts: existingNestedPosts,
          post_count: uniquePostIds.length,
          status: result.status,
        };
        output.skipped_posts += result.skipped || 0;

        // ── Post detail scraping (UBC only, first N posts) ────────────
        if (school === 'ubc' && uniquePostIds.length > 0) {
          const shortcodesToScrape = uniquePostIds.slice(0, DETAILS_PER_ACCOUNT);
          console.log(`    \uD83D\uDCDD Fetching details for ${shortcodesToScrape.length} post(s)\u2026`);
          for (const sc of shortcodesToScrape) {
            if (output.schools[school][username].posts[sc]) continue;
            await sleep(randomInt(2000, 4000));
            const details = await scrapePostDetails(page, sc);
            output.schools[school][username].posts[sc] = details;
            const preview = details.caption
              ? details.caption.substring(0, 60).replace(/\n/g, ' ') + '\u2026'
              : '(no caption)';
            const imgStatus = details.image_local_path ? '\uD83D\uDDBC' : '\u26A0\uFE0F no img';
            console.log(`      \u2713 ${sc}: ${imgStatus} ${preview}`);
          }
        }
      } catch (err) {
        console.log(`    ✗ Error: ${err.message}`);
        // Preserve existing data on error
        const school2 = schoolLookup.get(username.toLowerCase()) || 'other';
        const existingNestedPosts = output.schools[school2]?.[username]?.posts || {};

        if (!output.schools[school2]) output.schools[school2] = {};
        output.schools[school2][username] = {
          post_ids: [...(existingIds)],
          posts: existingNestedPosts,
          post_count: existingIds.size,
          status: 'error',
        };
      }

      saveOutput(output); // Iterative save

      if (stopRequested) {
        console.log('\n[!] Stopping gracefully as requested...');
        break;
      }

      // Rate limit: 2-4 seconds between profiles
      if (i < followingList.length - 1) {
        await sleep(randomInt(2000, 4000));
      }
    }
  } catch (err) {
    console.error('Scraper error:', err.message);
    process.exitCode = 1;
  }

  // Save final output
  saveOutput(output);
  console.log(`\nOutput written to ${OUTPUT_PATH}`);

  // Summary
  console.log('\n══════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('══════════════════════════════════════');
  for (const [school, schoolData] of Object.entries(output.schools)) {
    const accts = Object.keys(schoolData).length;
    const posts = Object.values(schoolData).reduce((s, a) => s + a.post_count, 0);
    console.log(`  ${school.toUpperCase()}: ${accts} accounts, ${posts} posts`);
  }
  console.log(`  TOTAL: ${output.total_accounts} accounts, ${output.total_posts} posts`);
  if (output.skipped_posts > 0) {
    console.log(`  SKIPPED: ${output.skipped_posts} already-scraped posts`);
  }
  console.log('');

  try { await page.close(); } catch { /* already closed */ }
  try { await browser.close(); } catch { /* already closed */ }
}

main();
