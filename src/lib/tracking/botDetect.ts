/** Detects crawlers/automated browsers so they are not counted as visits. They are never blocked. */
const BOT_UA =
  /bot\b|bot\/|crawl|spider|slurp|scrap|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|facebookexternalhit|facebot|embedly|whatsapp|telegram|discord|skype|slack|bytespider|gptbot|chatgpt|oai-searchbot|claude|anthropic|perplexity|ccbot|amazonbot|applebot|yandex|baidu|duckduck|semrush|ahrefs|mj12|dotbot|petal|seznam|python|curl|wget|httpclient|okhttp|axios|node-fetch|go-http|java\//i;

export function isLikelyBot(ua: string, webdriver = false): boolean {
  if (webdriver) return true;
  if (!ua || ua.length < 20) return true;
  return BOT_UA.test(ua);
}
