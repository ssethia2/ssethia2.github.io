/**
 * Lightweight in-browser part-of-speech tagger.
 *
 * Replaces the NLTK tagging step from the original project's Flask backend
 * (github.com/ssethia2/SyntaxTrees, src/backend/router.py) so full English
 * sentences can be parsed entirely client-side. Follows the same tag
 * conventions the backend mapped NLTK output to:
 *
 *   N (nouns, pronouns) · Adj (adjectives, possessives) · D (determiners)
 *   Adv (adverbs, modals) · P (prepositions, particles) · V (verbs)
 *
 * Lookup order: curated closed-class sets (preserving the conventions above),
 * then a ~10k-word corpus-derived lexicon (majority tag per word in the Brown
 * corpus, see lexicon.js), then inflection/suffix heuristics and context
 * rules. Not a statistical model — it handles simple declarative sentences
 * well and makes a best guess elsewhere.
 */

import { LEXICON } from './lexicon.js';

const DETERMINERS = new Set([
  'the', 'a', 'an', 'this', 'that', 'these', 'those', 'every', 'each',
  'some', 'any', 'no', 'all', 'both', 'either', 'neither', 'another',
  'such', 'what', 'which'
]);

// Possessive pronouns map to Adj (NLTK PRP$ -> Adj in the original backend)
const POSSESSIVES = new Set([
  'my', 'your', 'his', 'her', 'its', 'our', 'their'
]);

// Personal/indefinite pronouns map to N (NLTK PRP -> N)
const PRONOUNS = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'us', 'them',
  'mine', 'yours', 'hers', 'ours', 'theirs', 'someone', 'somebody',
  'something', 'anyone', 'anybody', 'anything', 'everyone', 'everybody',
  'everything', 'nobody', 'nothing', 'who', 'whom'
]);

// Prepositions and particles map to P (NLTK RP/TO -> P)
const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'by', 'for', 'with', 'from', 'to', 'of', 'over',
  'under', 'above', 'below', 'between', 'among', 'through', 'during',
  'before', 'after', 'into', 'onto', 'across', 'behind', 'beside',
  'besides', 'near', 'against', 'without', 'within', 'along', 'around',
  'beyond', 'beneath', 'toward', 'towards', 'upon', 'off', 'up', 'down',
  'out', 'inside', 'outside', 'past', 'since', 'until'
]);

// Modals map to Adv (NLTK MD -> Adv)
const MODALS = new Set([
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must'
]);

const COMMON_ADVERBS = new Set([
  'very', 'quite', 'really', 'rather', 'too', 'so', 'always', 'never',
  'often', 'sometimes', 'usually', 'rarely', 'seldom', 'soon', 'now',
  'then', 'here', 'there', 'today', 'tomorrow', 'yesterday', 'also',
  'just', 'still', 'almost', 'already', 'again', 'away', 'well', 'not'
]);

const COMMON_ADJECTIVES = new Set([
  'good', 'bad', 'big', 'small', 'large', 'little', 'long', 'short',
  'tall', 'old', 'young', 'new', 'quick', 'slow', 'happy', 'sad',
  'lazy', 'busy', 'bright', 'dark', 'light', 'heavy', 'hot', 'cold',
  'warm', 'cool', 'red', 'blue', 'green', 'brown', 'black', 'white',
  'yellow', 'orange', 'purple', 'pink', 'grey', 'gray', 'nice',
  'smart', 'clever', 'strong', 'weak', 'rich', 'poor',
  'dirty', 'loud', 'quiet', 'beautiful', 'ugly', 'fierce', 'gentle',
  'hungry', 'tired', 'angry', 'calm', 'wild', 'tame', 'free', 'whole',
  'main', 'only', 'same', 'other', 'next', 'last', 'first', 'second'
]);

// Auxiliaries and frequent verb lemmas; inflected forms are matched by
// stripping -s/-es/-ed/-ing (with e-restoration and undoubling) below.
const VERB_LEMMAS = new Set([
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'go', 'goes', 'went', 'gone', 'come', 'came', 'get', 'got', 'gotten',
  'make', 'made', 'take', 'took', 'taken', 'give', 'gave', 'given',
  'see', 'saw', 'seen', 'know', 'knew', 'known', 'think', 'thought',
  'say', 'said', 'tell', 'told', 'find', 'found', 'leave', 'left',
  'feel', 'felt', 'keep', 'kept', 'hold', 'held', 'bring', 'brought',
  'buy', 'bought', 'catch', 'caught', 'teach', 'taught', 'send', 'sent',
  'spend', 'spent', 'build', 'built', 'sit', 'sat', 'stand', 'stood',
  'run', 'ran', 'eat', 'ate', 'eaten', 'drink', 'drank', 'sleep', 'slept',
  'read', 'write', 'wrote', 'written', 'sing', 'sang', 'sung', 'speak',
  'spoke', 'swim', 'swam', 'fly', 'flew', 'drive', 'drove', 'ride', 'rode',
  'fall', 'fell', 'grow', 'grew', 'throw', 'threw', 'wear', 'wore',
  'break', 'broke', 'choose', 'chose', 'begin', 'began', 'win', 'won',
  'meet', 'met', 'pay', 'paid', 'hear', 'heard', 'lose', 'lost',
  'jump', 'walk', 'talk', 'play', 'work', 'look', 'want', 'need',
  'like', 'love', 'hate', 'help', 'call', 'ask', 'answer', 'open',
  'close', 'start', 'stop', 'move', 'turn', 'live', 'stay', 'wait',
  'watch', 'follow', 'show', 'learn', 'study', 'use', 'try', 'seem',
  'chase', 'bark', 'climb', 'cook', 'dance', 'laugh', 'cry', 'smile',
  'push', 'pull', 'kick', 'hit', 'carry', 'wash', 'clean', 'paint',
  'parse', 'tag', 'visit', 'enjoy', 'believe', 'remember', 'forget'
]);

/**
 * Check whether a word is (an inflection of) a known verb lemma.
 */
function isKnownVerb(word) {
  if (VERB_LEMMAS.has(word)) return true;

  const candidates = [];
  if (word.endsWith('ies')) candidates.push(word.slice(0, -3) + 'y');   // studies -> study
  if (word.endsWith('es')) candidates.push(word.slice(0, -2));          // watches -> watch
  if (word.endsWith('s')) candidates.push(word.slice(0, -1));           // runs -> run
  if (word.endsWith('ied')) candidates.push(word.slice(0, -3) + 'y');   // studied -> study
  if (word.endsWith('ed')) {
    candidates.push(word.slice(0, -2));                                 // jumped -> jump
    candidates.push(word.slice(0, -1));                                 // chased -> chase
    if (word.length > 4 && word[word.length - 3] === word[word.length - 4]) {
      candidates.push(word.slice(0, -3));                               // stopped -> stop
    }
  }
  if (word.endsWith('ing')) {
    candidates.push(word.slice(0, -3));                                 // jumping -> jump
    candidates.push(word.slice(0, -3) + 'e');                           // writing -> write
    if (word.length > 5 && word[word.length - 4] === word[word.length - 5]) {
      candidates.push(word.slice(0, -4));                               // running -> run
    }
  }

  return candidates.some(c => VERB_LEMMAS.has(c));
}

const ADJ_SUFFIXES = ['ous', 'ful', 'ive', 'able', 'ible', 'ish', 'less', 'ary', 'ic', 'ical', 'est'];
const NOUN_SUFFIXES = ['tion', 'sion', 'ness', 'ment', 'ity', 'ance', 'ence', 'ship', 'hood', 'ism', 'ist', 'ette', 'dom'];
const VERB_SUFFIXES = ['ize', 'ise', 'ify', 'ate'];

/**
 * Tag a single word lexically (no context). Returns null when unknown.
 */
function lexicalTag(word) {
  // Curated closed classes first, to preserve the original tag conventions
  if (DETERMINERS.has(word)) return 'D';
  if (POSSESSIVES.has(word)) return 'Adj';
  if (PRONOUNS.has(word)) return 'N';
  if (PREPOSITIONS.has(word)) return 'P';
  if (MODALS.has(word)) return 'Adv';

  // Curated open-class lists outrank the corpus: majority tags carry corpus
  // artifacts (e.g. "brown" is mostly the proper name Brown in Brown corpus)
  if (COMMON_ADVERBS.has(word)) return 'Adv';
  if (COMMON_ADJECTIVES.has(word)) return 'Adj';

  // Corpus-derived majority tag
  const corpusTag = LEXICON.get(word);
  if (corpusTag) return corpusTag;

  // Fallbacks for words outside the corpus
  if (isKnownVerb(word)) return 'V';

  if (word.endsWith('ly') && word.length > 3) return 'Adv';
  if (ADJ_SUFFIXES.some(s => word.endsWith(s))) return 'Adj';
  if (NOUN_SUFFIXES.some(s => word.endsWith(s))) return 'N';
  if (VERB_SUFFIXES.some(s => word.endsWith(s))) return 'V';

  return null;
}

/**
 * Tag a full English sentence.
 *
 * @param {string} sentence
 * @returns {Array<{word: string, tag: string}>}
 */
export function tagSentence(sentence) {
  const tokens = sentence
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const tags = tokens.map(lexicalTag);

  // Context pass
  for (let i = 0; i < tokens.length; i++) {
    const prev = i > 0 ? tags[i - 1] : null;

    // A determiner as the last word acts as a pronoun: "I want that" -> N
    if (tags[i] === 'D' && i === tokens.length - 1 && i > 0) {
      tags[i] = 'N';
    }

    // A verb form directly between a determiner/adjective and a noun is
    // being used attributively: "the running dog" -> Adj
    if (tags[i] === 'V' && (prev === 'D' || prev === 'Adj') &&
        (tokens[i].endsWith('ing') || tokens[i].endsWith('ed'))) {
      tags[i] = 'Adj';
    }

    // An adverb-tagged word between a determiner/adjective and a noun is
    // being used attributively: "the fast car" -> Adj
    if (tags[i] === 'Adv' && (prev === 'D' || prev === 'Adj') &&
        i + 1 < tokens.length && (tags[i + 1] === 'N' || tags[i + 1] === null)) {
      tags[i] = 'Adj';
    }

    // Unknown word ending in -s right after the subject noun is most
    // likely the verb: "the wug glorps"
    if (tags[i] === null && prev === 'N' &&
        tokens[i].endsWith('s') && !tokens[i].endsWith('ss') &&
        !tags.includes('V')) {
      tags[i] = 'V';
    }

    // Remaining unknowns default to N (open-class fallback)
    if (tags[i] === null) {
      tags[i] = 'N';
    }
  }

  // If no verb was found, retag the first defaulted-N token that follows
  // the subject — most simple sentences have the verb in second position.
  if (!tags.includes('V')) {
    for (let i = 1; i < tokens.length; i++) {
      if (tags[i] === 'N' && tags[i - 1] === 'N') {
        tags[i] = 'V';
        break;
      }
    }
  }

  return tokens.map((word, i) => ({ word, tag: tags[i] }));
}

/**
 * The set of tags the tree builder understands, for raw tag input mode.
 */
export const VALID_TAGS = ['D', 'N', 'V', 'Adj', 'Adv', 'P'];

/**
 * Parse raw space-separated POS tags (the original app's input format).
 * Returns null if any token is not a valid tag.
 */
export function parseTags(input) {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const normalized = tokens.map(t => {
    const match = VALID_TAGS.find(v => v.toLowerCase() === t.toLowerCase());
    return match || null;
  });

  if (normalized.some(t => t === null)) return null;
  return normalized.map(tag => ({ tag, word: null }));
}
