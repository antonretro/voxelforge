import { RECIPE_BOOK } from '../data/recipeBook.js';

function cloneResult(result) {
  return { ...result };
}

function gridToIds(gridItems) {
  return gridItems.map((item) => item?.id ?? null);
}

function normalizePatternGrid(patternRows) {
  const rows = patternRows.map((row) => row.split(''));
  let minRow = rows.length;
  let maxRow = -1;
  let minCol = rows[0]?.length ?? 0;
  let maxCol = -1;

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] === ' ') continue;
      minRow = Math.min(minRow, r);
      maxRow = Math.max(maxRow, r);
      minCol = Math.min(minCol, c);
      maxCol = Math.max(maxCol, c);
    }
  }

  if (maxRow === -1) return [''];
  const output = [];
  for (let r = minRow; r <= maxRow; r++) {
    output.push(rows[r].slice(minCol, maxCol + 1).join(''));
  }
  return output;
}

function normalizeIdGrid(ids) {
  // Use 3x3 as base for normalization
  const rows = [ids.slice(0, 3), ids.slice(3, 6), ids.slice(6, 9)];

  let minRow = 3;
  let maxRow = -1;
  let minCol = 3;
  let maxCol = -1;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!rows[r][c]) continue;
      minRow = Math.min(minRow, r);
      maxRow = Math.max(maxRow, r);
      minCol = Math.min(minCol, c);
      maxCol = Math.max(maxCol, c);
    }
  }
  if (maxRow === -1) return [[]];

  const output = [];
  for (let r = minRow; r <= maxRow; r++) {
    output.push(rows[r].slice(minCol, maxCol + 1));
  }
  return output;
}

function mirrorRows(rows) {
  return rows.map((row) => row.split('').reverse().join(''));
}

function countIds(ids) {
  const counts = new Map();
  for (const id of ids) {
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function mapsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const [key, value] of a.entries()) {
    if ((b.get(key) ?? 0) !== value) return false;
  }
  return true;
}

export class CraftingSystem {
  constructor(recipeBook = RECIPE_BOOK) {
    this.recipes = recipeBook.map((recipe) => this.compileRecipe(recipe));
  }

  compileRecipe(recipe) {
    if (recipe.type === 'shapeless') {
      const idCounts = countIds(recipe.ingredients);
      return {
        ...recipe,
        ingredientCounts: idCounts,
      };
    }

    const normalized = normalizePatternGrid(recipe.pattern);
    return {
      ...recipe,
      normalizedPattern: normalized,
      mirroredPattern: mirrorRows(normalized),
    };
  }

  match(craftingGrid) {
    // Ensure we have a 9-element array (3x3)
    let fullGrid = craftingGrid;
    if (craftingGrid.length === 4) {
        // Map 2x2 to 3x3
        fullGrid = new Array(9).fill(null);
        fullGrid[0] = craftingGrid[0];
        fullGrid[1] = craftingGrid[1];
        fullGrid[3] = craftingGrid[2];
        fullGrid[4] = craftingGrid[3];
    }

    const ids = gridToIds(fullGrid);
    const normalizedGrid = normalizeIdGrid(ids);

    for (const recipe of this.recipes) {
      if (recipe.type === 'shapeless') {
        const gridCounts = countIds(ids);
        if (!mapsEqual(gridCounts, recipe.ingredientCounts)) continue;
        return {
          recipeId: recipe.id,
          recipeName: recipe.name,
          result: cloneResult(recipe.result),
        };
      }

      const matchedNormal = this.matchesShaped(
        normalizedGrid,
        recipe.normalizedPattern,
        recipe.key
      );
      const matchedMirror =
        !matchedNormal &&
        this.matchesShaped(normalizedGrid, recipe.mirroredPattern, recipe.key);
      if (!matchedNormal && !matchedMirror) continue;

      return {
        recipeId: recipe.id,
        recipeName: recipe.name,
        result: cloneResult(recipe.result),
      };
    }

    return null;
  }

  matchesShaped(normalizedGrid, patternRows, keyMap) {
    if (normalizedGrid.length !== patternRows.length) return false;
    if ((normalizedGrid[0]?.length ?? 0) !== (patternRows[0]?.length ?? 0))
      return false;

    for (let r = 0; r < patternRows.length; r++) {
      for (let c = 0; c < patternRows[r].length; c++) {
        const symbol = patternRows[r][c];
        const gridId = normalizedGrid[r][c] ?? null;
        if (symbol === ' ') {
          if (gridId !== null) return false;
          continue;
        }
        const requiredId = keyMap[symbol] ?? null;
        if (!requiredId || gridId !== requiredId) return false;
      }
    }
    return true;
  }
}
