import { TILE_BAG } from './data.js';

export default class InputRule {
  constructor(level = 1) {
    this.maxLength = 14;
 
    // Pick a fixed letter in one of the first 4 slots using TILE_BAG weights
    this.fixedLetters = {};
    let fixedPos = this._randomInt(0, 3);
    if (Math.random() < Math.min(0.6, 0.2 + 0.05 * level)) {
      const weightedLetters = Object.entries(TILE_BAG).flatMap(
        ([letter, count]) => Array(count).fill(letter)
      );
      const fixedLetter = weightedLetters[this._randomInt(0, weightedLetters.length - 1)];
      this.fixedLetters[fixedPos] = fixedLetter;
    } else {
      fixedPos = -1;
    }

    this.minLength = fixedPos + 1;

    // Score modifiers format: { position: { type: 'multiplier'|'add'|'none', value: number } }
    this.scoreModifiers = {};

    const modifierPositions = new Set();
	const numModifiers = 2 + Math.floor(level / 8) + (Math.random() < (level % 8) / 8 ? 1 : 0);
    while (modifierPositions.size < Math.min(numModifiers, 6)) {
      const pos = this._randomInt(0, 6);
      if (pos !== fixedPos) modifierPositions.add(pos);
    }

	

    // Convert to array and shuffle
    const modArray = Array.from(modifierPositions);
    this._shuffle(modArray);

    // Assign one additive modifier
    const posAdd = modArray.pop();
    const addValue = posAdd * 2 + this._randomInt(2, 6);
    this.scoreModifiers[posAdd] = { type: 'add', value: addValue };

    // Assign remaining as multipliers
    for (const pos of modArray) {
      const multValue = this._randomInt(2, 4); // x2 to x4
      this.scoreModifiers[pos] = { type: 'multiplier', value: multValue };
    }
	
	for (let i = 7; i < this.maxLength; i++) {
        const av = Math.round(level / 8 * i + i + this._randomInt(2, 6));
		this.scoreModifiers[i] = { type: 'add', value: av };
    }
  }

  _randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  isValidLength(word) {
    return word.length >= this.minLength && word.length <= this.maxLength;
  }

  isFixedAt(index) {
    return this.fixedLetters.hasOwnProperty(index);
  }

  getFixedLetter(index) {
    return this.fixedLetters[index];
  }

  getScoreModifier(index) {
    return this.scoreModifiers[index] || { type: 'none', value: 0 };
  }
}
