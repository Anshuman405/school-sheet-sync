// Basic formula evaluation for spreadsheets

/**
 * Check if a cell value starts with an equals sign (=)
 */
export const isFormula = (value: string): boolean => {
  return value.trim().startsWith('=');
};

/**
 * Parse a formula string to extract cell references like A1, B2, etc.
 */
export const extractCellRefs = (formula: string): string[] => {
  // Remove the equals sign
  const formulaContent = formula.trim().substring(1);
  
  // Regular expression to find cell references (e.g., A1, B2, AA12)
  const cellRefRegex = /([A-Z]+[0-9]+)/g;
  
  // Find all matches
  const matches = formulaContent.match(cellRefRegex) || [];
  
  return matches;
};

/**
 * Convert a column label (A, B, AA) to a column index (0, 1, 26)
 */
export const columnLabelToIndex = (label: string): number => {
  let result = 0;
  for (let i = 0; i < label.length; i++) {
    result = result * 26 + (label.charCodeAt(i) - 64);
  }
  return result - 1; // Convert to 0-based index
};

/**
 * Convert a cell reference (e.g., A1) to row and column indices
 */
export const cellRefToIndices = (cellRef: string): { row: number; col: number } => {
  const match = cellRef.match(/([A-Z]+)([0-9]+)/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${cellRef}`);
  }
  
  const colLabel = match[1];
  const rowLabel = match[2];
  
  const col = columnLabelToIndex(colLabel);
  const row = parseInt(rowLabel, 10) - 1; // Convert to 0-based index
  
  return { row, col };
};

// Dependency graph to track cell references
const dependencyGraph: Record<string, Set<string>> = {};

/**
 * Update the dependency graph for a cell formula.
 */
export const updateDependencies = (cellKey: string, formula: string) => {
  const refs = extractCellRefs(formula);
  dependencyGraph[cellKey] = new Set(refs);

  // Remove reverse dependencies for cells no longer referenced
  for (const key in dependencyGraph) {
    if (key !== cellKey) {
      dependencyGraph[key].delete(cellKey);
    }
  }
};

/**
 * Get all dependent cells for a given cell.
 */
export const getDependents = (cellKey: string): string[] => {
  const dependents = [];
  for (const key in dependencyGraph) {
    if (dependencyGraph[key].has(cellKey)) {
      dependents.push(key);
    }
  }
  return dependents;
};

/**
 * Evaluate a formula using the current sheet data and dependency graph.
 */
export const evaluateFormula = (
  formula: string,
  getData: (row: number, col: number) => string
): string => {
  try {
    if (!isFormula(formula)) {
      return formula;
    }

    // Remove the equals sign
    let expression = formula.trim().substring(1);

    // Find all cell references
    const cellRefs = extractCellRefs(formula);

    // Replace each cell reference with its value
    for (const ref of cellRefs) {
      const { row, col } = cellRefToIndices(ref);
      const cellValue = getData(row, col);

      // If the referenced cell is empty or not a number, replace with 0
      const replacementValue = cellValue === "" ? "0" : cellValue;

      // Replace the cell reference with the actual value
      const regex = new RegExp(`\\b${ref}\\b`, "g");
      expression = expression.replace(regex, replacementValue);
    }

    // Evaluate the expression safely
    const result = Function('"use strict";return (' + expression + ')')();
    return result.toString();
  } catch (error) {
    console.error("Error evaluating formula:", error);
    return "#ERROR";
  }
};
