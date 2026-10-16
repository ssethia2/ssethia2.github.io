"""Regenerates lexicon.js from the Brown corpus.

Takes every word that appears at least MIN_FREQ times in the Brown corpus,
maps its NLTK universal tag to this project's tag scheme, and keeps the
majority tag per word.

Usage:
    pip install nltk
    python3 generate_lexicon.py
"""

import re
from collections import Counter, defaultdict

import nltk

MIN_FREQ = 8

# Universal tagset -> the project's tag scheme (same conventions as the
# original Flask backend: pronouns -> N, particles -> P, numbers attributive)
TAG_MAP = {
    'DET': 'D', 'NOUN': 'N', 'VERB': 'V', 'ADJ': 'Adj',
    'ADV': 'Adv', 'ADP': 'P', 'PRT': 'P', 'PRON': 'N', 'NUM': 'Adj',
}

HEADER = """\
/**
 * Corpus-derived lexicon: ~10k most frequent English words from the Brown
 * corpus (via NLTK's universal tagset), each mapped to its majority tag in
 * this project's scheme. Generated offline from nltk.corpus.brown.
 *
 * D (determiners) · N (nouns, pronouns) · V (verbs) · Adj (adjectives,
 * numbers) · Adv (adverbs) · P (prepositions, particles)
 */
"""

FOOTER = """\
export const LEXICON = new Map();
for (const [tag, words] of Object.entries(WORDS_BY_TAG)) {
  for (const word of words.split(' ')) {
    LEXICON.set(word, tag);
  }
}
"""


def main():
    nltk.download('brown', quiet=True)
    nltk.download('universal_tagset', quiet=True)
    from nltk.corpus import brown

    word_tags = defaultdict(Counter)
    for word, tag in brown.tagged_words(tagset='universal'):
        if tag not in TAG_MAP:
            continue
        w = word.lower()
        if not re.fullmatch(r"[a-z][a-z'-]*", w):
            continue
        word_tags[w][TAG_MAP[tag]] += 1

    by_tag = defaultdict(list)
    for w, counts in word_tags.items():
        if sum(counts.values()) >= MIN_FREQ:
            by_tag[counts.most_common(1)[0][0]].append(w)

    lines = [HEADER, 'const WORDS_BY_TAG = {']
    for tag in ('D', 'N', 'V', 'Adj', 'Adv', 'P'):
        lines.append(f'  {tag}: "{" ".join(sorted(by_tag[tag]))}",')
    lines.append('};')
    lines.append('')
    lines.append(FOOTER)

    with open('lexicon.js', 'w') as f:
        f.write('\n'.join(lines))

    print('wrote lexicon.js |', {t: len(by_tag[t]) for t in by_tag})


if __name__ == '__main__':
    main()
