
import React, { CSSProperties } from "react";
import { isFormula } from "@/utils/formulaUtils";
import { TextAlign } from "../types/spreadsheet";

interface SpreadsheetGridProps {
  spreadsheetTableRef: React.RefObject<HTMLTableElement>;
  sheetColumns: number;
  sheetRows: number;
  sheetData: any[];
  displayedCellValues: Record<string, string>;
  cellFormats: Record<string, { bold: boolean; align: TextAlign }>;
  selectedCells: {startRow: number, startCol: number, endRow: number, endCol: number} | null;
  onCellMouseDown: (rowIndex: number, colIndex: number) => void;
  onCellMouseOver: (rowIndex: number, colIndex: number) => void;
  onCellMouseUp: () => void;
  updateCell: (rowIndex: number, colIndex: number, value: string) => void;
}

const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  spreadsheetTableRef,
  sheetColumns,
  sheetRows,
  sheetData,
  displayedCellValues,
  cellFormats,
  selectedCells,
  onCellMouseDown,
  onCellMouseOver,
  onCellMouseUp,
  updateCell,
}) => {
  // Generate column labels (A, B, C, etc.)
  const getColumnLabel = (index: number) => {
    let label = '';
    let n = index;
    
    do {
      const modulo = n % 26;
      label = String.fromCharCode(65 + modulo) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    
    return label;
  };

  // Check if a cell is in the selected range
  const isCellSelected = (rowIndex: number, colIndex: number) => {
    if (!selectedCells) return false;
    
    const minRow = Math.min(selectedCells.startRow, selectedCells.endRow);
    const maxRow = Math.max(selectedCells.startRow, selectedCells.endRow);
    const minCol = Math.min(selectedCells.startCol, selectedCells.endCol);
    const maxCol = Math.max(selectedCells.startCol, selectedCells.endCol);
    
    return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
  };

  // Get cell style based on its format
  const getCellStyle = (rowIndex: number, colIndex: number): CSSProperties => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const format = cellFormats[cellKey] || { bold: false, align: 'left' };
    
    return {
      fontWeight: format.bold ? 'bold' : 'normal',
      textAlign: format.align
    };
  };

  return (
    <div className="rounded-b-lg border overflow-auto h-[calc(100vh-220px)]">
      <div className="min-w-max">
        <table ref={spreadsheetTableRef} className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="w-16 bg-muted text-muted-foreground">#</th>
              {Array.from({ length: sheetColumns }, (_, i) => (
                <th key={i} className="w-16 bg-muted text-muted-foreground">
                  {getColumnLabel(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: sheetRows }, (_, rowIndex) => {
              const row = sheetData[rowIndex] || [];
              
              return (
                <tr key={rowIndex}>
                  <td className="w-16 bg-muted text-muted-foreground">{rowIndex + 1}</td>
                  {Array.from({ length: sheetColumns }, (_, colIndex) => {
                    const cellValue = row[colIndex] || "";
                    const displayValue = isFormula(cellValue)
                      ? displayedCellValues[`${rowIndex}-${colIndex}`] || ""
                      : cellValue;
                    
                    return (
                      <td 
                        key={colIndex} 
                        data-row={rowIndex} 
                        data-col={colIndex}
                        className={`border p-2 ${isCellSelected(rowIndex, colIndex) ? 'bg-accent' : ''}`}
                        style={getCellStyle(rowIndex, colIndex)}
                        onMouseDown={() => onCellMouseDown(rowIndex, colIndex)}
                        onMouseOver={() => onCellMouseOver(rowIndex, colIndex)}
                        onMouseUp={onCellMouseUp}
                      >
                        <input 
                          type="text" 
                          value={cellValue} 
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)} 
                          className="w-full h-full bg-transparent border-none outline-none"
                          placeholder={isFormula(cellValue) ? displayValue : ""}
                        />
                        {isFormula(cellValue) && (
                          <div className="absolute bg-background shadow-md rounded p-1 text-xs -mt-6 ml-1">
                            {displayValue}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpreadsheetGrid;
