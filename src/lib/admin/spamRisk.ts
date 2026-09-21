/**
 * Light-touch check for the things inbox providers score hardest against.
 *
 * Purely advisory: the composer shows these before a send so a throwaway
 * "Test!!! Test!!!" message never gets silently binned by iCloud or Gmail.
 */

const stripTags = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const wordCount = (text: string) => (text ? text.split(/\s+/).filter(Boolean).length : 0);

const isShouty = (text: string) => {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 12) return false;
  const caps = text.replace(/[^A-Z]/g, "").length;
  return caps / letters.length > 0.7;
};

const hasRepeatedWord = (text: string) => {
  const words = text.toLowerCase().match(/[a-z']{3,}/g) ?? [];
  return words.some((w, i) => i > 0 && words[i - 1] === w);
};

export function junkRiskSignals(subject: string, bodyHtml: string): string[] {
  const subj = subject.trim();
  const body = stripTags(bodyHtml);
  const signals: string[] = [];

  if (/!{2,}/.test(subj) || /!{2,}/.test(body)) {
    signals.push("Repeated exclamation marks — use one at most.");
  }
  if (isShouty(subj)) {
    signals.push("The subject is mostly capital letters.");
  }
  if (hasRepeatedWord(subj)) {
    signals.push("The subject repeats the same word.");
  }
  if (/\b(test|testing|test message)\b/i.test(subj) && wordCount(body) < 25) {
    signals.push("It reads like a test message with very little content.");
  }
  if (wordCount(body) < 15) {
    signals.push("The message is very short — a few real sentences land far better.");
  }
  if (subj.length < 10) {
    signals.push("The subject is very short.");
  }

  return signals;
}
