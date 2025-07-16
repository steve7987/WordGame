// tileRules.js
import { LETTER_SCORES } from './data.js';

export class TileAnswerRule {
  constructor({ lockedLetters = {}, multipliers = {} } = {}) {
    this.lockedLetters = lockedLetters; // e.g. { 1: 'P' } means 2nd letter must be 'P'
    this.multipliers = multipliers;     // e.g. { 0: 3 } means 1st letter gets x3 score
  }

  isValid(inputLetters) {
    for (const [pos, char] of Object.entries(this.lockedLetters)) {
      if (inputLetters[parseInt(pos)] !== char) return false;
    }
    return true;
  }

  score(letters) {
    return letters.reduce((sum, l, i) => {
      const multiplier = this.multipliers[i] || 1;
      return sum + multiplier * (LETTER_SCORES[l] || 0);
    }, 0);
  }
}
