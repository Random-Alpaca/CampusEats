/**
 * Instagram Auto-Follow Script
 *
 * Reads a list of usernames from tools/follow-accounts/accounts_to_follow.txt,
 * searches for each on Instagram, navigates to their profile,
 * and clicks Follow.
 *
 * Run: npm run follow:instagram
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

// ── Config ───────────────────────────────────────────────────────────────────
const USER_DATA_DIR = path.resolve(
  process.env.IG_USER_DATA_DIR || path.resolve(__dirname, '..', '..', '.user_data', 'instagram')
);
const HEADLESS = process.env.IG_HEADLESS === 'true';

const CHROME_PATH =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const ACCOUNTS_FILE = path.resolve(__dirname, 'accounts_to_follow.txt');

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadUsernames() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    throw new Error(`Accounts file not found: ${ACCOUNTS_FILE}\nCreate it with one username per line.`);
  }
  const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
  return raw
    .split('\n')
    .map((line) => line.trim().replace(/^@/, ''))  // strip @ if present
    .filter((line) => line && !line.startsWith('#')); // skip empty/comments
}

// ── Login check ──────────────────────────────────────────────────────────────

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
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const timeout = 5 * 60 * 1000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
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

// ── Follow logic ─────────────────────────────────────────────────────────────

async function followUser(page, username) {
  const profileUrl = `https://www.instagram.com/${username}/`;
  console.log(`\n  → Navigating to ${profileUrl}`);

  await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 20_000 });
  await sleep(2000);

  // Check if profile exists
  const notFound = await page.evaluate(() => {
    const body = document.body.innerText || '';
    return body.includes("Sorry, this page isn't available") ||
           body.includes("This page isn't available");
  });
  if (notFound) {
    console.log(`    ✗ Profile not found: @${username}`);
    return 'not_found';
  }

  // Robust button finder — Instagram nests text in multiple spans
  // This function finds all clickable elements and extracts their clean text
  const followState = await page.evaluate(() => {
    function getCleanText(el) {
      // Get only direct visible text, ignoring hidden elements
      return (el.innerText || el.textContent || '').trim();
    }

    // Collect all buttons and div[role="button"] in the profile header area
    const header = document.querySelector('header') || document;
    const candidates = [
      ...header.querySelectorAll('button'),
      ...header.querySelectorAll('div[role="button"]'),
    ];

    for (const el of candidates) {
      const text = getCleanText(el);
      // Exact matches to avoid false positives
      if (text === 'Following') return 'already_following';
      if (text === 'Requested') return 'requested';
    }
    for (const el of candidates) {
      const text = getCleanText(el);
      // "Follow" but not "Following" or "Unfollow" or "Follow Back"
      if (text === 'Follow') return 'not_following';
      if (text === 'Follow Back') return 'not_following';
    }
    return 'unknown';
  });

  if (followState === 'already_following') {
    console.log(`    ✓ Already following @${username}`);
    return 'already_following';
  }

  if (followState === 'requested') {
    console.log(`    ◷ Already requested @${username}`);
    return 'requested';
  }

  if (followState === 'unknown') {
    // Debug: log what buttons we see
    const debugTexts = await page.evaluate(() => {
      const header = document.querySelector('header') || document;
      const els = [
        ...header.querySelectorAll('button'),
        ...header.querySelectorAll('div[role="button"]'),
      ];
      return els.map((el) => (el.innerText || el.textContent || '').trim()).filter(Boolean);
    });
    console.log(`    ? Could not find Follow button for @${username}`);
    console.log(`      Buttons found: [${debugTexts.map(t => `"${t}"`).join(', ')}]`);
    return 'unknown';
  }

  // Click the Follow button
  const clicked = await page.evaluate(() => {
    function getCleanText(el) {
      return (el.innerText || el.textContent || '').trim();
    }
    const header = document.querySelector('header') || document;
    const candidates = [
      ...header.querySelectorAll('button'),
      ...header.querySelectorAll('div[role="button"]'),
    ];
    for (const el of candidates) {
      const text = getCleanText(el);
      if (text === 'Follow' || text === 'Follow Back') {
        el.click();
        return true;
      }
    }
    return false;
  });

  if (!clicked) {
    console.log(`    ✗ Failed to click Follow for @${username}`);
    return 'failed';
  }

  // Wait and verify
  await sleep(2500);

  const newState = await page.evaluate(() => {
    function getCleanText(el) {
      return (el.innerText || el.textContent || '').trim();
    }
    const header = document.querySelector('header') || document;
    const candidates = [
      ...header.querySelectorAll('button'),
      ...header.querySelectorAll('div[role="button"]'),
    ];
    for (const el of candidates) {
      const text = getCleanText(el);
      if (text === 'Following') return 'followed';
      if (text === 'Requested') return 'requested';
    }
    return 'unknown';
  });

  if (newState === 'followed') {
    console.log(`    ✓ Followed @${username}`);
    return 'followed';
  } else if (newState === 'requested') {
    console.log(`    ◷ Follow requested for @${username} (private account)`);
    return 'requested';
  } else {
    console.log(`    ~ Follow click sent for @${username} (could not verify)`);
    return 'click_sent';
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const usernames = loadUsernames();
  if (usernames.length === 0) {
    console.log(`No usernames found in ${ACCOUNTS_FILE}`);
    console.log('Add one username per line (no @ symbol).');
    return;
  }

  console.log(`Loaded ${usernames.length} account(s) to follow:`);
  usernames.forEach((u) => console.log(`  • ${u}`));

  console.log(`\nLaunching Chrome (headless: ${HEADLESS})…`);

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    userDataDir: USER_DATA_DIR,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results = {};

  try {
    await ensureLoggedIn(page);

    console.log(`\nFollowing ${usernames.length} account(s)…`);

    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      console.log(`\n[${i + 1}/${usernames.length}] @${username}`);

      try {
        results[username] = await followUser(page, username);
      } catch (err) {
        console.log(`    ✗ Error: ${err.message}`);
        results[username] = 'error';
      }

      // Delay between follows to avoid rate limiting
      if (i < usernames.length - 1) {
        const delay = 3000 + Math.random() * 3000; // 3-6s
        await sleep(delay);
      }
    }
  } catch (err) {
    console.error('Script error:', err.message);
    process.exitCode = 1;
  }

  // Print summary
  console.log('\n══════════════════════════════════════');
  console.log('  RESULTS');
  console.log('══════════════════════════════════════');
  for (const [user, result] of Object.entries(results)) {
    const icon = result === 'followed' ? '✓' :
                 result === 'already_following' ? '✓' :
                 result === 'requested' ? '◷' : '✗';
    console.log(`  ${icon}  @${user} → ${result}`);
  }
  console.log('');

  // Clean up
  try { await page.close(); } catch { /* already closed */ }
  try { await browser.close(); } catch { /* already closed */ }
}

main();
