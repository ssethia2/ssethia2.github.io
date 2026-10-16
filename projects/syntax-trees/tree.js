/**
 * X-Bar Theory syntax tree construction.
 *
 * JavaScript port of the original C++ implementation
 * (github.com/ssethia2/SyntaxTrees, src/cpp/tree_gen.cpp), which accepted a
 * sequence of part-of-speech tags (D, N, V, Adj, Adv, P) and built a binary
 * tree of XP -> X' -> X projections.
 *
 * Differences from the C++ original:
 *  - Each head node can carry the surface word it projects from, so trees
 *    built from full sentences show the words at the leaves.
 *  - The null determiner for bare subjects is inserted at the FRONT of the
 *    tag sequence (the C++ version appended it at the end).
 *  - Phrases already claimed as a complement/adjunct are not attached a
 *    second time elsewhere (e.g. a DP inside a PP is no longer also taken
 *    as the verb's direct object).
 *  - Bare NP objects (no determiner) attach to V' so they aren't dropped.
 */

export class TreeNode {
  constructor(label, left = null, right = null) {
    this.label = label;
    this.left = left;
    this.right = right;
    this.word = null;    // Surface word, set on head nodes only
    this.claimed = false; // Whether this phrase is already attached in the tree
  }
}

/**
 * Create the X-bar skeleton for a single tag: XP -> X' -> X
 */
function createPhrase(tag, word) {
  const head = new TreeNode(tag);
  head.word = word || null;
  const bar = new TreeNode(tag + "'", head);
  return new TreeNode(tag + 'P', bar);
}

/**
 * Build the syntax tree for a sequence of tagged items.
 *
 * @param {Array<{tag: string, word?: string}>} tagged
 * @returns {TreeNode|null} root of the tree (S), or null for empty input
 */
export function createTree(tagged) {
  if (!tagged || tagged.length === 0) {
    return null;
  }

  // Merge consecutive nouns into a single compound head ("soccer player",
  // "apple pie") — compounding happens at the N⁰ level in X-bar theory
  const items = [];
  for (const item of tagged) {
    const prev = items[items.length - 1];
    if (prev && prev.tag === 'N' && item.tag === 'N') {
      prev.word = [prev.word, item.word].filter(Boolean).join(' ') || null;
    } else {
      items.push({ ...item });
    }
  }

  // Bare subjects (pronouns, bare plurals) get a phonologically null D
  if (items[0].tag !== 'D') {
    items.unshift({ tag: 'D', word: '∅' });
  }

  const phrases = items.map(({ tag, word }) => createPhrase(tag, word));
  return buildTree(phrases);
}

/**
 * Combine the phrase subtrees into a single tree, left to right.
 */
function buildTree(phrases) {
  for (let i = 0; i < phrases.length; i++) {
    switch (phrases[i].label) {
      case 'DP':   dPhrase(phrases, i); break;
      case 'NP':   nPhrase(phrases, i); break;
      case 'VP':   vPhrase(phrases, i); break;
      case 'AdjP': adjPhrase(phrases, i); break;
      case 'PP':   pPhrase(phrases, i); break;
    }
  }

  return cPhrase(phrases);
}

/**
 * Attach a phrase into the tree and mark it as claimed.
 */
function claim(phrase) {
  phrase.claimed = true;
  return phrase;
}

/**
 * DPs take the next NP as a complement (sister to the head).
 */
function dPhrase(phrases, i) {
  for (let j = i; j < phrases.length; j++) {
    if (phrases[j].label === 'NP') {
      phrases[i].left.right = claim(phrases[j]);
      return;
    }
  }
}

/**
 * NPs take AdjPs (and PPs, when the NP is in subject position) between the
 * previous DP and the next VP as adjuncts, each on its own bar level.
 */
function nPhrase(phrases, i) {
  // Whether there is no VP after this NP (i.e. the NP is the object)
  let isAfterVp = true;
  for (let k = i; k < phrases.length; k++) {
    if (phrases[k].label === 'VP') {
      isAfterVp = false;
      break;
    }
  }

  // The NP's window reaches back to the previous DP
  let start = i;
  while (start > 0 && phrases[start].label !== 'DP') {
    start--;
  }
  start++;

  // Post-nominal adjuncts up to the next VP (PPs only on subject NPs),
  // nearest to the noun first, each on its own bar level to the right
  for (let j = i + 1; j < phrases.length && phrases[j].label !== 'VP'; j++) {
    if (phrases[j].claimed) {
      continue;
    }
    if ((!isAfterVp && phrases[j].label === 'PP') || phrases[j].label === 'AdjP') {
      phrases[i].left = new TreeNode("N'", phrases[i].left, claim(phrases[j]));
    }
  }

  // Pre-nominal AdjP adjuncts, nearest to the noun innermost so that
  // surface word order is preserved ("quick brown fox")
  for (let j = i - 1; j >= start; j--) {
    if (phrases[j].label === 'AdjP' && !phrases[j].claimed) {
      phrases[i].left = new TreeNode("N'", claim(phrases[j]), phrases[i].left);
    }
  }
}

/**
 * VPs take the phrases following the verb (direct object DP/NP, AdvPs, PPs)
 * as adjuncts/complements, plus an immediately preceding AdvP as the topmost
 * adjunct. A DP/NP that belongs to a following PP is left for the PP.
 */
function vPhrase(phrases, i) {
  let objectAdded = false;
  let pendingPpComplements = 0; // PPs awaiting their DP/NP complement
  let pendingNpComplements = 0; // DPs awaiting their NP complement

  for (let j = i + 1; j < phrases.length; j++) {
    if (phrases[j].claimed) {
      continue;
    }
    const label = phrases[j].label;

    if (label === 'PP') {
      phrases[i].left = new TreeNode("V'", phrases[i].left, claim(phrases[j]));
      pendingPpComplements++;
    } else if (label === 'DP') {
      if (pendingPpComplements > 0) {
        pendingPpComplements--; // Belongs to the preceding preposition
      } else if (!objectAdded) {
        phrases[i].left = new TreeNode("V'", phrases[i].left, claim(phrases[j]));
        objectAdded = true;
      }
      pendingNpComplements++; // Either way this DP takes the next NP
    } else if (label === 'NP') {
      if (pendingNpComplements > 0) {
        pendingNpComplements--; // Belongs to the preceding determiner
      } else if (pendingPpComplements > 0) {
        pendingPpComplements--; // Belongs to the preceding preposition
      } else if (!objectAdded) {
        phrases[i].left = new TreeNode("V'", phrases[i].left, claim(phrases[j]));
        objectAdded = true;
      }
    } else if (label === 'AdvP') {
      phrases[i].left = new TreeNode("V'", phrases[i].left, claim(phrases[j]));
    }
  }

  // An adverb immediately preceding the verb is the topmost adjunct
  if (i > 0 && phrases[i - 1].label === 'AdvP' && !phrases[i - 1].claimed) {
    phrases[i].left = new TreeNode("V'", claim(phrases[i - 1]), phrases[i].left);
  }
}

/**
 * PPs take the immediately following DP or NP as a complement.
 */
function pPhrase(phrases, i) {
  for (let j = i + 1; j < phrases.length; j++) {
    if (phrases[j].label === 'DP' || phrases[j].label === 'NP') {
      phrases[i].left = new TreeNode("P'", phrases[i].left, claim(phrases[j]));
      return; // PPs take only one complement
    }
  }
}

/**
 * AdjPs take preceding AdvPs (back to the nearest DP) as specifiers/adjuncts.
 */
function adjPhrase(phrases, i) {
  let j = i;
  while (j > 0 && phrases[j].label !== 'DP') {
    j--;
    if (phrases[j].label === 'AdvP' && !phrases[j].claimed) {
      if (phrases[i].left.right) {
        phrases[i].left = new TreeNode("Adj'", claim(phrases[j]), phrases[i].left);
      } else {
        phrases[i].left.right = phrases[i].left.left;
        phrases[i].left.left = claim(phrases[j]);
      }
    }
  }
}

/**
 * Root the tree at S, with the subject DP on the left and the VP on the right.
 */
function cPhrase(phrases) {
  const root = new TreeNode('S');

  if (phrases[0].label === 'DP') {
    root.left = phrases[0];
  }

  for (const phrase of phrases) {
    if (phrase.label === 'VP') {
      root.right = phrase;
      break;
    }
  }

  return root;
}
