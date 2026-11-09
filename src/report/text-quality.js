const splitSentences = (text) =>
  String(text || '')
    .split(/(?<=[。！？])/)
    .map((x) => x.trim())
    .filter(Boolean);

const signature = (text) => String(text || '').replace(/[\s，。；：、！？（）()]/g, '');

export function enforceTextUniqueness(report) {
  const seen = new Set();
  const clean = (text) => {
    const kept = [];
    for (const sentence of splitSentences(text)) {
      const key = signature(sentence);
      if (key.length >= 12 && seen.has(key)) continue;
      if (key.length >= 12) seen.add(key);
      kept.push(sentence);
    }
    return kept.join('');
  };
  for (const page of report.pages || []) {
    if (page.overview) {
      page.overview.conclusion = clean(page.overview.conclusion);
      page.overview.paragraphs = (page.overview.paragraphs || []).map(clean).filter(Boolean);
    }
    for (const card of page.cards || []) {
      card.conclusion = clean(card.conclusion);
      card.paragraphs = (card.paragraphs || []).map(clean).filter(Boolean);
      for (const key of ['before', 'after', 'under', 'balanced', 'over', 'practice'])
        if (card[key]) card[key] = clean(card[key]);
    }
  }
  return report;
}

export function auditTextQuality(report) {
  const strings = [];
  const visit = (value, path = '') => {
    if (
      typeof value === 'string' &&
      !path.includes('.table.') &&
      !path.includes('.basis') &&
      !path.includes('.meta')
    )
      strings.push(value);
    else if (Array.isArray(value)) value.forEach((x, i) => visit(x, `${path}.${i}`));
    else if (value && typeof value === 'object')
      Object.entries(value).forEach(([k, v]) => visit(v, `${path}.${k}`));
  };
  visit(report);
  const sentences = strings
    .flatMap(splitSentences)
    .map(signature)
    .filter((x) => x.length >= 12);
  const counts = new Map();
  sentences.forEach((x) => counts.set(x, (counts.get(x) || 0) + 1));
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
  const longPhraseCounts = new Map();
  for (const sentence of sentences)
    for (let i = 0; i <= sentence.length - 12; i++) {
      const phrase = sentence.slice(i, i + 12);
      if (/\d/.test(phrase)) continue;
      longPhraseCounts.set(phrase, (longPhraseCounts.get(phrase) || 0) + 1);
    }
  const repeatedPhrases = [...longPhraseCounts.entries()].filter(([, count]) => count > 2);
  const adjacentOpenings = [];
  for (const page of report.pages || []) {
    const blocks = [
      page.overview?.conclusion,
      ...(page.overview?.paragraphs || []),
      ...(page.cards || []).flatMap((card) => [card.conclusion, ...(card.paragraphs || [])]),
    ].filter(Boolean);
    for (let i = 1; i < blocks.length; i++) {
      const left = signature(blocks[i - 1]).slice(0, 10);
      const right = signature(blocks[i]).slice(0, 10);
      if (left.length >= 8 && left === right) adjacentOpenings.push([page.name, left]);
    }
  }
  return {
    sentenceCount: sentences.length,
    duplicateSentenceCount: duplicates.length,
    repeatedLongPhraseCount: repeatedPhrases.length,
    adjacentOpeningCount: adjacentOpenings.length,
    duplicateSentences: duplicates.slice(0, 20),
    repeatedLongPhrases: repeatedPhrases.slice(0, 20),
    adjacentOpenings: adjacentOpenings.slice(0, 20),
  };
}
