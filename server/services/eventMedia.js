const fs = require('fs');
const path = require('path');

const SCRAPED_POSTS_PATH = path.resolve(__dirname, '..', '..', 'data', 'scraped_posts.json');

let cachedMtimeMs = -1;
let cachedLookup = new Map();

function toCleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function extractInstagramPostId(instagramUrl) {
  const value = toCleanString(instagramUrl);
  if (!value) return '';

  const match = value.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/i);
  return match ? match[1] : '';
}

function loadLookup() {
  try {
    const stat = fs.statSync(SCRAPED_POSTS_PATH);
    if (stat.mtimeMs === cachedMtimeMs) {
      return cachedLookup;
    }

    const raw = fs.readFileSync(SCRAPED_POSTS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const lookup = new Map();

    for (const schoolData of Object.values(parsed.schools || {})) {
      for (const accountData of Object.values(schoolData || {})) {
        for (const [postId, postData] of Object.entries(accountData.posts || {})) {
          lookup.set(postId, {
            image_url: toCleanString(postData.image_url),
            image_local_path: toCleanString(postData.image_local_path),
          });
        }
      }
    }

    cachedMtimeMs = stat.mtimeMs;
    cachedLookup = lookup;
    return cachedLookup;
  } catch {
    cachedMtimeMs = -1;
    cachedLookup = new Map();
    return cachedLookup;
  }
}

function getEventMedia(event) {
  const existingImageUrl = toCleanString(event?.image_url);
  const existingLocalPath = toCleanString(event?.image_local_path);

  if (existingImageUrl || existingLocalPath) {
    return {
      image_url: existingImageUrl,
      image_local_path: existingLocalPath,
    };
  }

  const postId = extractInstagramPostId(event?.instagram_url);
  if (!postId) {
    return {
      image_url: '',
      image_local_path: '',
    };
  }

  const media = loadLookup().get(postId);
  if (!media) {
    return {
      image_url: '',
      image_local_path: '',
    };
  }

  return {
    image_url: toCleanString(media.image_url),
    image_local_path: toCleanString(media.image_local_path),
  };
}

module.exports = {
  getEventMedia,
};
