import { GRID_SIZE } from './data.js';

let gridContainer = null;
let tileElements = [];

export function initGrid() {
  gridContainer = document.getElementById('grid');
  gridContainer.innerHTML = '';
  tileElements = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const div = document.createElement('div');
    div.className = 'tile';
    div.dataset.index = i;
    gridContainer.appendChild(div);
    tileElements.push(div);
  }
}

/**
 * Shared helper to render tile content into a DOM element.
 * Adds letter and point value.
 * @param {object} tile - Tile object with letter and points
 * @param {HTMLElement} el - The element to render into
 * @param {string} format - 'grid' or 'rack' (optional)
 */
export function renderTileContent(tile, container, context = 'grid', modifierLabel = '') {
  container.innerHTML = '';

  const letterDiv = document.createElement('div');
  letterDiv.className = 'tile-letter';
  letterDiv.textContent = tile.letter;
  container.appendChild(letterDiv);

  const pointsDiv = document.createElement('div');
  pointsDiv.className = 'tile-points';
  //console.log(tile.basePoints + ', ' + tile.points);
  if (tile.basePoints !== undefined && tile.points > tile.basePoints) {
	  //console.log('points');
	  pointsDiv.classList.add('points-buffed');
	}
  pointsDiv.textContent = tile.points;
  container.appendChild(pointsDiv);

  if (modifierLabel) {
    const modDiv = document.createElement('div');
    modDiv.className = 'tile-modifier';
    modDiv.textContent = modifierLabel;
    container.appendChild(modDiv);
  }
  
  
}


export function renderGrid(gridTiles, selectedIdsByRack, playedTileIds = [], newTileIds = [], activeRackIndex = 0) {
  for (let i = 0; i < tileElements.length; i++) {
    const el = tileElements[i];
    const tile = gridTiles[i];

    el.className = 'tile'; // Reset
    el.dataset.index = i;
    el.textContent = '';

    if (tile) {
      el.style.visibility = 'visible';
      el.dataset.id = tile.id;
      renderTileContent(tile, el, 'grid');

      // Determine which rack (if any) the tile belongs to
      selectedIdsByRack.forEach((ids, rackIndex) => {
        if (ids.includes(tile.id)) {
          el.classList.add(`rack-${rackIndex}`);
          if (rackIndex === activeRackIndex) {
            el.classList.add('rack-active');
          } else {
            el.classList.add('rack-inactive');
          }
        }
      });

      if (playedTileIds.includes(tile.id)) el.classList.add('played');
      if (newTileIds.includes(tile.id)) el.classList.add('new');
    } else {
      el.textContent = '';
      el.style.visibility = 'hidden';
      delete el.dataset.id;
    }
  }
}


export function renderInputRack(gridTiles, selectedIds, rule, rackElement, colorClass, isActive = false) {
  rackElement.innerHTML = '';

  if (!rule) rule = { minLength: 2, maxLength: 7, fixedLetters: {} };

  const minLength = rule.minLength;
  const maxLength = rule.maxLength;
  const lettersCount = selectedIds.length + Object.keys(rule.fixedLetters).length;
  const totalBoxes = Math.max(lettersCount, Math.min(Math.max(7, lettersCount + 1), maxLength));
  let letterIndex = 0;

  for (let i = 0; i < totalBoxes; i++) {
    const div = document.createElement('div');
    div.className = `input-tile ${colorClass}`;
    if (!isActive) div.classList.add('inactive');

    const modifier = rule.getScoreModifier?.(i);
    let modifierLabel = '';
    if (modifier?.type === 'multiplier') {
      modifierLabel = `x${modifier.value}`;
    } else if (modifier?.type === 'add') {
      modifierLabel = `+${modifier.value}`;
    }

    if (rule.fixedLetters && rule.fixedLetters[i]) {
      const fixedLetter = rule.fixedLetters[i];
      renderTileContent({ letter: fixedLetter, points: 0 }, div, 'rack', modifierLabel);
      div.classList.add('fixed');
    } else if (letterIndex < selectedIds.length) {
      const tile = gridTiles.find(t => t && t.id === selectedIds[letterIndex]);
      if (tile) {
        renderTileContent(tile, div, 'rack', modifierLabel);
        div.classList.add('filled');
      }
      letterIndex++;
    } else {
      div.textContent = '';
      if (modifierLabel) {
        const modDiv = document.createElement('div');
        modDiv.className = 'tile-modifier';
        modDiv.textContent = modifierLabel;
        div.appendChild(modDiv);
      }
    }

    if (i >= minLength && i < maxLength && i >= letterIndex + Object.keys(rule.fixedLetters).length) {
      div.classList.add('optional');
    }

    rackElement.appendChild(div);
  }
}

