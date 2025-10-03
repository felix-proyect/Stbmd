import axios from 'axios';
import cheerio from 'cheerio';

// --- Primary Method: ttsave.app ---
const ttsaveHeaders = {
  'authority': 'ttsave.app',
  'accept': 'application/json, text/plain, */*',
  'origin': 'https://ttsave.app',
  'referer': 'https://ttsave.app/en',
  'user-agent': 'Postify/1.0.0',
};

async function ttsave_submit(url, referer) {
  const headers = { ...ttsaveHeaders, referer };
  const data = { query: url, language_id: '1' };
  return axios.post('https://ttsave.app/download', data, { headers });
}

function ttsave_parse($) {
  const dlink = {
    nowm: $('a.w-full.text-white.font-bold').first().attr('href'),
    wm: $('a.w-full.text-white.font-bold').eq(1).attr('href'),
    audio: $("a[type='audio']").attr('href'),
  };
  const slides = $("a[type='slide']")
    .map((i, el) => ({ url: $(el).attr('href') }))
    .get();
  const description = $("p.text-gray-600").text();
  const nickname = $("h2.font-extrabold").text();
  const username = $("a.font-extrabold.text-blue-400").text();

  return { dlink, slides, description, nickname, username };
}

async function downloadFromTtsave(url) {
  const response = await ttsave_submit(url, 'https://ttsave.app/en');
  const $ = cheerio.load(response.data);
  const result = ttsave_parse($);

  if (result.slides && result.slides.length > 0) {
    return { type: 'slide', ...result };
  }
  if (result.dlink && result.dlink.nowm) {
    return {
      type: 'video',
      ...result,
      videoUrl: result.dlink.nowm,
      audioUrl: result.dlink.audio,
    };
  }
  throw new Error("No downloadable content found via ttsave.");
}


// --- Fallback Method: tmate.cc ---
async function getTokenAndCookie() {
  const res = await axios.get('https://tmate.cc/id', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const cookie = res.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';
  const tokenMatch = res.data.match(/<input[^>]+name="token"[^>]+value="([^"]+)"/i);
  const token = tokenMatch?.[1];
  if (!token) throw new Error('Could not find token for tmate');
  return { token, cookie };
}

async function downloadFromTmate(url) {
  const { token, cookie } = await getTokenAndCookie();
  const params = new URLSearchParams();
  params.append('url', url);
  params.append('token', token);

  const res = await axios.post('https://tmate.cc/action', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://tmate.cc/id',
      'Origin': 'https://tmate.cc',
      'Cookie': cookie,
    },
  });

  const html = res.data?.data;
  if (!html) throw new Error('No data received from tmate');

  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const description = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || 'Sin título';

  const linksMatches = [...html.matchAll(/<a[^>]+href="(https:\/\/[^"]+)"[^>]*>\s*<span>\s*<span>([^<]*)<\/span><\/span><\/a>/gi)];
  const uniqueLinks = new Set();
  const links = linksMatches
    .map(([_, href, label]) => ({ href, label: label.trim() }))
    .filter(({ href }) => !href.includes('play.google.com') && !uniqueLinks.has(href) && uniqueLinks.add(href));

  const mp4Links = links.filter(v => /download without watermark/i.test(v.label));
  const mp3Link = links.find(v => /download mp3 audio/i.test(v.label));
  const imageMatches = [...html.matchAll(/<img[^>]+src="(https:\/\/tikcdn\.app\/a\/images\/[^"]+)"/gi)];
  const images = [...new Set(imageMatches.map(m => m[1]))];

  if (mp4Links.length > 0) {
    return { type: 'video', description, videoUrl: mp4Links[0].href, audioUrl: mp3Link?.href };
  }
  if (images.length > 0) {
    return { type: 'slide', description, slides: images.map(url => ({ url })), audioUrl: mp3Link?.href };
  }

  throw new Error('No downloadable content found via tmate.');
}

/**
 * Main exported function. Tries the primary method (ttsave) first,
 * then falls back to the secondary method (tmate) on failure.
 * @param {string} url The TikTok URL to download.
 * @returns {object} An object containing the download information.
 */
export async function downloadTikTok(url) {
  try {
    console.log("Attempting download with primary method (ttsave)...");
    const result = await downloadFromTtsave(url);
    return result;
  } catch (primaryError) {
    console.warn("Primary method failed:", primaryError.message);
    console.log("Falling back to secondary method (tmate)...");
    try {
      const result = await downloadFromTmate(url);
      return result;
    } catch (secondaryError) {
      console.error("Secondary method also failed:", secondaryError.message);
      throw new Error("Both download methods failed. Please check the URL and try again.");
    }
  }
}