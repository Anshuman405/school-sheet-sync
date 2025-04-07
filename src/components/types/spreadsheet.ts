
// Define common types used in spreadsheet components

export type TextAlign = 'left' | 'center' | 'right';

export interface CellFormat {
  bold: boolean;
  align: TextAlign;
}

export interface CellSelection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface SheetData {
  name: string;
  columns: number;
  rows: number;
  data: any[];
}
