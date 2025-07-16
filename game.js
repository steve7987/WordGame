import { TILE_BAG, createTile, GRID_SIZE } from './data.js';
import { renderGrid, renderInputRack, initGrid } from './ui.js';
import { setupInputHandlers } from './input.js';
import InputRule from './InputRule.js';
import { loadWords } from './wordLoader.js';


const state = {
  tilePool: [],
  gridTiles: new Array(GRID_SIZE * GRID_SIZE).fill(null),
  inputRacks: [
    { selectedTileIds: [], rule: new InputRule(1), inputCursor: 0, canRefresh: false },
    { selectedTileIds: [], rule: new InputRule(1), inputCursor: 0, canRefresh: false }
  ],
  activeRackIndex: 0,
  usedTiles: [],
  nextId: 0,
  totalScore: 0,
  playsRemaining: 8,
  currentLevel: 1,
  nextLevelThreshold: 60,
  lastWord: '',
  lastScore: null,
  gameOver: false,
  bestWord: '',
  bestWordScore: 0
};

function initTilePool() {
  state.tilePool = [];
  for (const [letter, count] of Object.entries(TILE_BAG)) {  
    for (let i = 0; i < count; i++) {
      const tileObj = createTile(letter);
      tileObj.basePoints = tileObj.points;
      state.tilePool.push(tileObj);
    }
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function refillBagFromUsedTiles() {
  if (state.usedTiles.length === 0) return false;
  shuffle(state.usedTiles);
  state.tilePool.push(...state.usedTiles);
  state.usedTiles = [];
  return true;
}

function drawRandomTile() {
  if (state.tilePool.length === 0) {
    const refilled = refillBagFromUsedTiles();
    if (!refilled) return null;
  }
  const idx = Math.floor(Math.random() * state.tilePool.length);
  return state.tilePool.splice(idx, 1)[0];
}

function fillGrid() {
  for (let i = 0; i < state.gridTiles.length; i++) {
    if (!state.gridTiles[i]) {
      const tile = drawRandomTile();
      if (!tile) break;
      state.gridTiles[i] = { id: state.nextId++, ...tile };
    }
  }
}

function renderAll(playedIds = [], newIds = []) {
  const selectedIdsByRack = state.inputRacks.map(r => r.selectedTileIds);

  renderGrid(
    state.gridTiles,
    selectedIdsByRack,
    playedIds,
    newIds,
    state.activeRackIndex
  );

	

  state.inputRacks.forEach((rack, index) => {
    const rackElement = document.getElementById(`inputRack${index === 0 ? '' : index}`);
    renderInputRack(
      state.gridTiles,
      rack.selectedTileIds,
      rack.rule,
      rackElement,
      rack.colorClass,
      index === state.activeRackIndex
    );

    const buttonId = `refreshRack${index}`;
    let btn = document.getElementById(buttonId);

    if (rack.canRefresh) {
      if (!btn) {
        btn = document.createElement('button');
        btn.id = buttonId;
        btn.textContent = '↺';
        btn.onclick = () => refreshRack(index);
        rackElement.appendChild(btn);
      }
    } else if (btn) {
      btn.remove();
    }
  });

  const resultEl = document.getElementById('result');
  if (state.gameOver) {
    resultEl.textContent = `Game Over! You achieved level ${state.currentLevel} `;
	if (state.bestWord)
  {
	  const wordEl = document.getElementById('lastWord');
	  wordEl.textContent =  `Best word: "${state.bestWord}" (${state.bestWordScore ?? 'invalid'})`;
  }
  } else {
    const nextNeeded = state.nextLevelThreshold;
    //const last = state.lastWord ? ` | Last: "${state.lastWord}" (${state.lastScore ?? 'invalid'})` : '';
    resultEl.textContent = `Score: ${state.totalScore} / ${nextNeeded}  | Level: ${state.currentLevel} | Plays Left: ${state.playsRemaining}`;
		if (state.lastWord)
	  {
		  const wordEl = document.getElementById('lastWord');
		  wordEl.textContent =  `Last: "${state.lastWord}" (${state.lastScore ?? 'invalid'})`;
	  }
	}
	 
	
}

function refreshRack(index) {
  const rack = state.inputRacks[index];
  rack.selectedTileIds = [];
  rack.rule = new InputRule(state.currentLevel);
  rack.inputCursor = nextFreeSlotIndex(-1, 1, rack.rule);
  rack.canRefresh = false;
  renderAll();
}

function getAllSelectedIds() {
  return [...state.inputRacks[0].selectedTileIds, ...state.inputRacks[1].selectedTileIds];
}

function clearInput() {
  for (const rack of state.inputRacks) {
    rack.selectedTileIds = [];
    rack.inputCursor = nextFreeSlotIndex(-1, 1, rack.rule);
  }
  renderAll();
}

function nextFreeSlotIndex(start, direction, rule) {
  const limit = direction > 0 ? rule.maxLength : -1;
  let i = start;
  while (i !== limit) {
    i += direction;
    if (!rule.fixedLetters[i]) return i;
  }
  return start;
}

function getSubmittedWord(gridTiles, selectedIds, rule) {
  const word = [];
  let selectedIndex = 0;

  for (let i = 0; i < rule.maxLength; i++) {
    if (rule.fixedLetters[i]) {
      word.push(rule.fixedLetters[i]);
    } else if (selectedIndex < selectedIds.length) {
      const id = selectedIds[selectedIndex];
      const tile = gridTiles.find(t => t && t.id === id);
      word.push(tile?.letter || '');
      selectedIndex++;
    } else {
      word.push('');
    }
  }

  return word.join('');
}

async function submitWord() {
  if (state.gameOver) return;

  const rack = state.inputRacks[state.activeRackIndex];
  if (rack.selectedTileIds.length === 0) return;

  const word = getSubmittedWord(state.gridTiles, rack.selectedTileIds, rack.rule);
  state.lastWord = word;

  if (!isValidWord(word, rack.rule)) {
    state.lastScore = null;
    renderAll();
    return;
  }

  if (state.playsRemaining < 0) {
    state.gameOver = true;
    renderAll();
    return;
  }

  const wordTiles = rack.selectedTileIds.map(id =>
    state.gridTiles.find(t => t && t.id === id)
  );
  const score = getWordScore(wordTiles, rack.rule);
  state.lastScore = score;
  state.totalScore += score;

  if (score > state.bestWordScore)
  {
	  state.bestWordScore = score;
	  state.bestWord = word;
  }

  if (state.totalScore >= state.nextLevelThreshold) {
    state.currentLevel++;
    state.playsRemaining += 4;
	state.totalScore = 0;
    const nextThreshold = Math.ceil(state.nextLevelThreshold * 1.2 / 20) * 20;
    state.nextLevelThreshold = nextThreshold;
  }
  
  state.playsRemaining--;
  if (state.playsRemaining < 0) {
    state.gameOver = true;
    renderAll();
    return;
  }

  const playedIds = [...rack.selectedTileIds];

  const unplayedTiles = state.gridTiles.filter(t => t && !playedIds.includes(t.id));

  const numBonuses = 1 + Math.floor(state.currentLevel / 8) + (Math.random() < (state.currentLevel % 8) / 8 ? 1 : 0);
  console.log(numBonuses);
  const bonusTileIds = [];
  for (let i = 0; i < numBonuses && unplayedTiles.length > 0; i++) {
    const idx = Math.floor(Math.random() * unplayedTiles.length);
    const chosen = unplayedTiles.splice(idx, 1)[0];
    bonusTileIds.push(chosen.id);

    const isMultiplier = Math.random() < 0.5;
    if (isMultiplier) {
      const multiplier = 2 + Math.floor(Math.random() * 2); // x2 or x3
      chosen.points *= multiplier;
      chosen.bonusLabel = `x${multiplier}!`;
    } else {
      const bonus = 3 + Math.floor(Math.random() * 6); // +3 to +8
      chosen.points += bonus;
      chosen.bonusLabel = `+${bonus}`;
    }
  }

  for (let i = 0; i < state.gridTiles.length; i++) {
    const tile = state.gridTiles[i];
    if (tile && playedIds.includes(tile.id)) {
      state.usedTiles.push(tile);
      state.gridTiles[i] = null;
    }
  }

  rack.selectedTileIds = [];
  const otherRackIndex = 1 - state.activeRackIndex;
  state.inputRacks[otherRackIndex].canRefresh = true;

  renderAll(playedIds, []);

  await new Promise(r => setTimeout(r, 420));

  const newTileIds = [];
  for (let i = 0; i < state.gridTiles.length; i++) {
    if (!state.gridTiles[i]) {
      const tile = drawRandomTile();
      if (tile) {
        const tileWithId = { id: state.nextId++, ...tile };
        state.gridTiles[i] = tileWithId;
        newTileIds.push(tileWithId.id);
      }
    }
  }

  rack.rule = new InputRule(state.currentLevel);
  rack.inputCursor = nextFreeSlotIndex(-1, 1, rack.rule);

  renderAll([], newTileIds);

  for (const id of bonusTileIds) {
    const tileEl = document.querySelector(`.tile[data-id='${id}']`);
    const label = state.gridTiles.find(t => t?.id === id)?.bonusLabel;
    if (tileEl && label) {
      tileEl.classList.add('wiggle');

      const popup = document.createElement('div');
      popup.className = 'tile-popup';
      popup.textContent = label;
      tileEl.appendChild(popup);

      setTimeout(() => {
        tileEl.classList.remove('wiggle');
        popup.remove();
      }, 1000);
    }
  }
}

function getWordScore(wordTiles, rule) {
  let total = 0;
  let tileIndex = 0;

  for (let pos = 0; tileIndex < wordTiles.length && pos < rule.maxLength; pos++) {
    if (rule.isFixedAt(pos)) continue;

    const tile = wordTiles[tileIndex];
    const basePoints = tile?.points || 0;
    const modifier = rule.getScoreModifier(pos);

    if (modifier.type === 'multiplier') {
      total += basePoints * modifier.value;
    } else if (modifier.type === 'add') {
      total += basePoints + modifier.value;
    } else {
      total += basePoints;
    }

    tileIndex++;
  }

  return total;
}

function isValidWord(word, rule) {
  const lowerWord = word.toLowerCase();
  const lengthValid = lowerWord.length >= rule.minLength && lowerWord.length <= rule.maxLength;
  return lengthValid && VALID_WORDS.has(lowerWord);
}


function shuffleGrid() {
  const tileElements = Array.from(document.querySelectorAll('.tile'));
  const positionsBefore = tileElements.map(el => el.getBoundingClientRect());

  const nonEmptyTiles = state.gridTiles.filter(Boolean);
  shuffle(nonEmptyTiles);
  let i = 0;
  for (let j = 0; j < state.gridTiles.length; j++) {
    if (state.gridTiles[j]) {
      state.gridTiles[j] = nonEmptyTiles[i++];
    }
  }

  renderAll();

  requestAnimationFrame(() => {
    const updatedTileElements = Array.from(document.querySelectorAll('.tile'));
    const positionsAfter = updatedTileElements.map(el => el.getBoundingClientRect());

    updatedTileElements.forEach((el, index) => {
      const dx = positionsBefore[index].left - positionsAfter[index].left;
      const dy = positionsBefore[index].top - positionsAfter[index].top;

      if (dx !== 0 || dy !== 0) {
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.classList.add('animate-move');
        el.getBoundingClientRect();
        el.style.transform = '';
      }
    });

    setTimeout(() => {
      updatedTileElements.forEach(el => el.classList.remove('animate-move'));
    }, 400);
  });
}

function addTileToInput(tile) {
  const rack = state.inputRacks[state.activeRackIndex];
  const rule = rack.rule;

  while (rule.fixedLetters[rack.inputCursor]) {
    rack.inputCursor = nextFreeSlotIndex(rack.inputCursor, 1, rule);
  }

  rack.selectedTileIds[rack.inputCursor] = tile.id;
  rack.inputCursor = nextFreeSlotIndex(rack.inputCursor, 1, rule);
  renderAll();
}

function removeLastTile() {
  const rack = state.inputRacks[state.activeRackIndex];
  if (rack.selectedTileIds.length > 0) {
    rack.selectedTileIds.pop();
    renderAll();
  }
}

document.getElementById('shuffleBtn').onclick = shuffleGrid;
document.getElementById('submitBtn').onclick = submitWord;
document.getElementById('clearBtn').onclick = clearInput;

let VALID_WORDS = new Set();

(async function initGame() {
  VALID_WORDS = await loadWords();
  // continue with initTilePool(), fillGrid(), etc.\
  initTilePool();
	initGrid();
	fillGrid();
	renderAll();
	setupInputHandlers(state, renderAll, submitWord, addTileToInput, removeLastTile);
})();


