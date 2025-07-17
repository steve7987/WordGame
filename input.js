export function setupInputHandlers(state, render, submitCallback, addTileToInput, removeLastTile) {
  // Create and insert the hidden mobile input field
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'text';
  hiddenInput.id = 'mobileKeyboardInput';
  hiddenInput.autocomplete = 'off';
  hiddenInput.autocorrect = 'off';
  hiddenInput.autocapitalize = 'off';
  hiddenInput.spellcheck = false;
  hiddenInput.style.position = 'absolute';
  hiddenInput.style.left = '-9999px';
  hiddenInput.style.opacity = '0';
  hiddenInput.style.pointerEvents = 'none';
  document.body.appendChild(hiddenInput);

  // Keyboard input handling
  document.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();
    const rack = state.inputRacks[state.activeRackIndex];
    const fixedCount = Object.keys(rack.rule.fixedLetters || {}).length;
    const maxLetters = rack.rule.maxLength - fixedCount;

    if (/^[A-Z]$/.test(key)) {
      if (rack.selectedTileIds.length >= maxLetters) {
        return; // Already at max
      }

      const available = state.gridTiles.filter(
        t => t && !getAllSelectedIds().includes(t.id)
      );
      const match = available.find(t => t.letter === key);
      if (match) {
        rack.selectedTileIds.push(match.id);
        render();
      }
    } else if (e.key === 'Backspace') {
      removeLastTile();
      render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (submitCallback) {
        submitCallback();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      state.activeRackIndex = (state.activeRackIndex + 1) % state.inputRacks.length;
      render();
    }
  });

  // Tile click handler
  document.getElementById('grid').addEventListener('click', (e) => {
    const tileDiv = e.target.closest('.tile');
    if (!tileDiv || !tileDiv.dataset.id) return;

    const tileId = parseInt(tileDiv.dataset.id, 10);
    const tile = state.gridTiles.find(t => t && t.id === tileId);

    if (!tile || getAllSelectedIds().includes(tileId)) return;

    const rack = state.inputRacks[state.activeRackIndex];
    const fixedCount = Object.keys(rack.rule.fixedLetters || {}).length;
    const maxLetters = rack.rule.maxLength - fixedCount;

    if (rack.selectedTileIds.length >= maxLetters) return;

    rack.selectedTileIds.push(tileId);
    render();
  });

  // Rack click handlers
  const rack0 = document.getElementById('inputRack');
  const rack1 = document.getElementById('inputRack1');

  if (rack0) {
    rack0.addEventListener('click', () => {
      if (state.activeRackIndex !== 0) {
        state.activeRackIndex = 0;
        render();
      }
    });
  }

  if (rack1) {
    rack1.addEventListener('click', () => {
      if (state.activeRackIndex !== 1) {
        state.activeRackIndex = 1;
        render();
      }
    });
  }

  // Backspace button handler
  const backspaceButton = document.getElementById('backspaceBtn');
  if (backspaceButton) {
    backspaceButton.addEventListener('click', () => {
      removeLastTile();
      render();
    });
  }

  function getAllSelectedIds() {
    return [...state.inputRacks[0].selectedTileIds, ...state.inputRacks[1].selectedTileIds];
  }
}
