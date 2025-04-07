import { useState, useRef, useEffect, CSSProperties } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { 
  useStorage, 
  useMutation, 
  LiveList, 
  LiveObject 
} from "@/providers/LiveblocksProvider";
import { toast } from "@/hooks/use-toast";
import { isFormula, evaluateFormula } from "@/utils/formulaUtils";
import { TextAlign } from "@/components/types/spreadsheet";

export const useSpreadsheet = (sheetId: string, initialSheetName?: string) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempSheetName, setTempSheetName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCells, setSelectedCells] = useState<{startRow: number, startCol: number, endRow: number, endCol: number} | null>(null);
  const [activeCellFormat, setActiveCellFormat] = useState<{
    bold: boolean;
    align: TextAlign;
  }>({
    bold: false,
    align: 'left'
  });
  const [cellFormats, setCellFormats] = useState<Record<string, {
    bold: boolean;
    align: TextAlign;
  }>>({});
  const [isCopying, setIsCopying] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [displayedCellValues, setDisplayedCellValues] = useState<Record<string, string>>({});
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const spreadsheetTableRef = useRef<HTMLTableElement>(null);
  
  // Get sheet data from Liveblocks storage
  const sheet = useStorage(root => {
    if (!root || !root.sheets) return undefined;
    return root.sheets.get(sheetId);
  });
  
  // Default values for new sheets
  const DEFAULT_COLUMNS = 50;
  const DEFAULT_ROWS = 100;
  
  // Initialize a new sheet or load existing one from Liveblocks
  const initializeSheet = useMutation(({ storage, setMyPresence }) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    if (!sheets.has(sheetId)) {
      // Create a new sheet if it doesn't exist
      const initialData = new LiveList<LiveList<string>>();
      
      // Create initial rows
      for (let i = 0; i < DEFAULT_ROWS; i++) {
        const row = new LiveList<string>();
        // Fill row with empty cells
        for (let j = 0; j < DEFAULT_COLUMNS; j++) {
          row.push("");
        }
        initialData.push(row);
      }
      
      // Create the sheet object with name, data, columns and rows
      const sheetObj = new LiveObject({
        name: initialSheetName || "Untitled Sheet",
        data: initialData,
        columns: DEFAULT_COLUMNS,
        rows: DEFAULT_ROWS,
        updatedAt: new Date().toISOString(),
        starred: false,
        shared: false
      });
      
      // Add the new sheet to the sheets map
      sheets.set(sheetId, sheetObj);
    } else {
      // Update last accessed timestamp
      const existingSheet = sheets.get(sheetId);
      if (existingSheet) {
        existingSheet.update({
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    // Set user presence
    setMyPresence({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      cursor: null,
    });
  }, [sheetId, initialSheetName, user]);
  
  // Handle cell changes
  const updateCell = useMutation(({ storage }, rowIndex: number, colIndex: number, value: string) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    const sheet = sheets.get(sheetId);
    
    if (sheet) {
      const data = sheet.get("data");
      if (data && data.length > rowIndex) {
        const row = data.get(rowIndex);
        if (row && row.length > colIndex) {
          row.set(colIndex, value);
          
          // Update timestamp
          sheet.update({
            updatedAt: new Date().toISOString()
          });
          
          // We need to recalculate any formulas that might depend on this cell
          recalculateAllFormulas();
        }
      }
    }
  }, [sheetId]);
  
  // Update sheet name
  const updateSheetName = useMutation(({ storage }, newName: string) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    const sheet = sheets.get(sheetId);
    
    if (sheet) {
      sheet.update({
        name: newName,
        updatedAt: new Date().toISOString()
      });
    }
  }, [sheetId]);
  
  // Add a new row
  const addRow = useMutation(({ storage }, rowIndex: number) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    const sheet = sheets.get(sheetId);
    
    if (sheet) {
      const data = sheet.get("data");
      const columns = sheet.get("columns");
      const rows = sheet.get("rows");
      
      if (data) {
        // Create a new empty row
        const newRow = new LiveList<string>();
        for (let i = 0; i < columns; i++) {
          newRow.push("");
        }
        
        // Insert the row at the specified index or at the end
        if (rowIndex >= 0 && rowIndex < data.length) {
          data.insert(rowIndex + 1, newRow);
        } else {
          data.push(newRow);
        }
        
        // Update row count and timestamp
        sheet.update({
          rows: rows + 1,
          updatedAt: new Date().toISOString()
        });
        
        // Recalculate formulas after adding a row
        recalculateAllFormulas();
      }
    }
  }, [sheetId]);
  
  // Remove a row
  const removeRow = useMutation(({ storage }, rowIndex: number) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    const sheet = sheets.get(sheetId);
    
    if (sheet) {
      const data = sheet.get("data");
      const rows = sheet.get("rows");
      
      if (data && rowIndex >= 0 && rowIndex < data.length) {
        data.delete(rowIndex);
        
        // Update row count and timestamp
        sheet.update({
          rows: rows - 1,
          updatedAt: new Date().toISOString()
        });
        
        // Recalculate formulas after removing a row
        recalculateAllFormulas();
      }
    }
  }, [sheetId]);
  
  // Add a new column
  const addColumn = useMutation(({ storage }, colIndex: number) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    const sheet = sheets.get(sheetId);
    
    if (sheet) {
      const data = sheet.get("data");
      const columns = sheet.get("columns");
      
      if (data) {
        // Add an empty cell to each row at the specified column index
        for (let i = 0; i < data.length; i++) {
          const row = data.get(i);
          if (row) {
            if (colIndex >= 0 && colIndex < row.length) {
              row.insert(colIndex + 1, "");
            } else {
              row.push("");
            }
          }
        }
        
        // Update column count and timestamp
        sheet.update({
          columns: columns + 1,
          updatedAt: new Date().toISOString()
        });
        
        // Recalculate formulas after adding a column
        recalculateAllFormulas();
      }
    }
  }, [sheetId]);
  
  // Remove a column
  const removeColumn = useMutation(({ storage }, colIndex: number) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    const sheet = sheets.get(sheetId);
    
    if (sheet) {
      const data = sheet.get("data");
      const columns = sheet.get("columns");
      
      if (data && colIndex >= 0 && colIndex < columns) {
        // Remove the cell at the specified column index from each row
        for (let i = 0; i < data.length; i++) {
          const row = data.get(i);
          if (row && colIndex < row.length) {
            row.delete(colIndex);
          }
        }
        
        // Update column count and timestamp
        sheet.update({
          columns: columns - 1,
          updatedAt: new Date().toISOString()
        });
        
        // Recalculate formulas after removing a column
        recalculateAllFormulas();
      }
    }
  }, [sheetId]);
  
  // Get cell value (safely)
  const getCellValue = (rowIndex: number, colIndex: number): string => {
    if (!sheet) return "";
    
    try {
      const data = sheet.get("data");
      if (!data || rowIndex >= data.length) return "";
      
      const row = data.get(rowIndex);
      if (!row || colIndex >= row.length) return "";
      
      return row.get(colIndex) || "";
    } catch (error) {
      console.error("Error getting cell value:", error);
      return "";
    }
  };
  
  // Recalculate all formulas in the sheet
  const recalculateAllFormulas = () => {
    if (!sheet) return;
    
    try {
      const data = sheet.get("data");
      const newDisplayedValues: Record<string, string> = {};
      
      if (!data) return;
      
      for (let r = 0; r < data.length; r++) {
        const row = data.get(r);
        if (!row) continue;
        
        for (let c = 0; c < row.length; c++) {
          const cellValue = row.get(c) || "";
          
          if (isFormula(cellValue)) {
            const result = evaluateFormula(cellValue, getCellValue);
            const cellKey = `${r}-${c}`;
            newDisplayedValues[cellKey] = result;
          }
        }
      }
      
      setDisplayedCellValues(newDisplayedValues);
    } catch (error) {
      console.error("Error recalculating formulas:", error);
    }
  };

  // Initialize sheet on first render
  useEffect(() => {
    setIsLoading(true);
    
    if (!sheet) {
      initializeSheet();
    }
    
    if (sheet) {
      try {
        const name = sheet.get("name");
        setTempSheetName(name);
        recalculateAllFormulas();
        setIsLoading(false);
      } catch (error) {
        console.error("Error accessing sheet data:", error);
        setTempSheetName(initialSheetName || "Untitled Sheet");
        setIsLoading(false);
      }
    }
  }, [sheet, initializeSheet, initialSheetName]);
  
  // Recalculate formulas whenever sheet data changes
  useEffect(() => {
    if (sheet) {
      recalculateAllFormulas();
    }
  }, [sheet]);

  // Handle share button click
  const handleShare = () => {
    if (!shareEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would send an invitation email
    toast({
      title: "Shared!",
      description: `Invitation sent to ${shareEmail}`,
    });
    
    setShareEmail("");
    setShareDialogOpen(false);
  };
  
  // Handle save button click
  const handleSave = () => {
    // Liveblocks already saves automatically, this is just for UX feedback
    toast({
      title: "Saved!",
      description: "Your sheet has been saved automatically.",
    });
  };
  
  // Handle export as CSV
  const handleExport = () => {
    if (!sheet) return;
    
    try {
      const data = sheet.get("data");
      const name = sheet.get("name");
      const csvRows: string[] = [];
      
      if (!data) {
        throw new Error("Sheet data is undefined");
      }
      
      // Convert data to CSV format
      for (let i = 0; i < data.length; i++) {
        const row = data.get(i);
        if (row) {
          const csvRow: string[] = [];
          for (let j = 0; j < row.length; j++) {
            const cellValue = row.get(j) || "";
            // Use displayed value for formulas
            const displayValue = isFormula(cellValue) 
              ? displayedCellValues[`${i}-${j}`] || cellValue 
              : cellValue;
            // Escape quotes and handle commas
            csvRow.push(`"${displayValue.replace(/"/g, '""')}"`);
          }
          csvRows.push(csvRow.join(","));
        }
      }
      
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${name || "sheet"}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exported!",
        description: "Your sheet has been exported as CSV.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export sheet.",
        variant: "destructive",
      });
    }
  };
  
  // Add a new row
  const handleAddRow = () => {
    if (!sheet) return;
    
    try {
      if (selectedCells) {
        // Insert a row after the last selected row
        const rowIndex = Math.max(selectedCells.startRow, selectedCells.endRow);
        addRow(rowIndex);
      } else {
        // Just add at the end
        const data = sheet.get("data");
        if (data) {
          addRow(data.length - 1);
        } else {
          addRow(0);
        }
      }
      
      toast({
        title: "Row added",
        description: "A new row has been added to the sheet.",
      });
    } catch (error) {
      console.error("Error adding row:", error);
      toast({
        title: "Error",
        description: "Failed to add row.",
        variant: "destructive",
      });
    }
  };
  
  // Remove a row
  const handleRemoveRow = () => {
    if (!selectedCells) {
      toast({
        title: "Selection required",
        description: "Please select a row to delete.",
        variant: "destructive",
      });
      return;
    }
    
    const rowIndex = Math.max(selectedCells.startRow, selectedCells.endRow);
    removeRow(rowIndex);
    setSelectedCells(null);
    
    toast({
      title: "Row removed",
      description: "The selected row has been removed.",
    });
  };
  
  // Add a new column
  const handleAddColumn = () => {
    if (!sheet) return;
    
    try {
      if (selectedCells) {
        // Insert a column after the last selected column
        const colIndex = Math.max(selectedCells.startCol, selectedCells.endCol);
        addColumn(colIndex);
      } else {
        // Just add at the end
        const columns = sheet.get("columns");
        if (columns !== undefined) {
          addColumn(columns - 1);
        } else {
          addColumn(0);
        }
      }
      
      toast({
        title: "Column added",
        description: "A new column has been added to the sheet.",
      });
    } catch (error) {
      console.error("Error adding column:", error);
      toast({
        title: "Error",
        description: "Failed to add column.",
        variant: "destructive",
      });
    }
  };
  
  // Remove a column
  const handleRemoveColumn = () => {
    if (!selectedCells) {
      toast({
        title: "Selection required",
        description: "Please select a column to delete.",
        variant: "destructive",
      });
      return;
    }
    
    const colIndex = Math.max(selectedCells.startCol, selectedCells.endCol);
    removeColumn(colIndex);
    setSelectedCells(null);
    
    toast({
      title: "Column removed",
      description: "The selected column has been removed.",
    });
  };
  
  // Start editing the sheet title
  const handleTitleClick = () => {
    if (!sheet) return;
    
    setIsEditingTitle(true);
    try {
      const name = sheet.get("name");
      setTempSheetName(name || "Untitled Sheet");
    } catch (error) {
      console.error("Error accessing sheet name:", error);
      setTempSheetName("Untitled Sheet");
    }
    
    // Focus the input after rendering
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 10);
  };
  
  // Save the new sheet title
  const handleTitleSave = () => {
    if (tempSheetName.trim()) {
      updateSheetName(tempSheetName);
      setIsEditingTitle(false);
      
      toast({
        title: "Sheet renamed",
        description: `Sheet has been renamed to "${tempSheetName}".`,
      });
    } else {
      // Don't allow empty sheet names
      if (sheet) {
        try {
          const name = sheet.get("name");
          setTempSheetName(name || "Untitled Sheet");
        } catch (error) {
          console.error("Error accessing sheet name:", error);
          setTempSheetName("Untitled Sheet");
        }
      }
      setIsEditingTitle(false);
      
      toast({
        title: "Error",
        description: "Sheet name cannot be empty.",
        variant: "destructive",
      });
    }
  };
  
  // Handle title input blur
  const handleTitleBlur = () => {
    handleTitleSave();
  };
  
  // Handle title input key down
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      if (sheet) {
        try {
          const name = sheet.get("name");
          setTempSheetName(name || "Untitled Sheet");
        } catch (error) {
          console.error("Error accessing sheet name:", error);
          setTempSheetName("Untitled Sheet");
        }
      }
      setIsEditingTitle(false);
    }
  };
  
  // Handle cell selection
  const handleCellMouseDown = (rowIndex: number, colIndex: number) => {
    setSelectedCells({
      startRow: rowIndex,
      startCol: colIndex,
      endRow: rowIndex,
      endCol: colIndex
    });
  };
  
  const handleCellMouseOver = (rowIndex: number, colIndex: number) => {
    if (selectedCells) {
      setSelectedCells({
        ...selectedCells,
        endRow: rowIndex,
        endCol: colIndex
      });
    }
  };
  
  const handleCellMouseUp = () => {
    // Keep the selection active, but stop tracking mouse movement
    if (selectedCells) {
      // Update the active cell format based on the last selected cell
      const cellKey = `${selectedCells.endRow}-${selectedCells.endCol}`;
      const format = cellFormats[cellKey] || { bold: false, align: 'left' };
      setActiveCellFormat({
        bold: format.bold,
        align: format.align
      });
    }
  };
  
  // Apply formatting to selected cells
  const applyFormatting = (type: 'bold' | 'align', value: any) => {
    if (!selectedCells) return;
    
    const minRow = Math.min(selectedCells.startRow, selectedCells.endRow);
    const maxRow = Math.max(selectedCells.startRow, selectedCells.endRow);
    const minCol = Math.min(selectedCells.startCol, selectedCells.endCol);
    const maxCol = Math.max(selectedCells.startCol, selectedCells.endCol);
    
    const newFormats = { ...cellFormats };
    
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cellKey = `${r}-${c}`;
        const currentFormat = newFormats[cellKey] || { bold: false, align: 'left' };
        
        if (type === 'bold') {
          newFormats[cellKey] = { ...currentFormat, bold: !currentFormat.bold };
        } else if (type === 'align') {
          newFormats[cellKey] = { ...currentFormat, align: value as TextAlign };
        }
      }
    }
    
    setCellFormats(newFormats);
    
    // Update active cell format state for toolbar
    const lastCellKey = `${selectedCells.endRow}-${selectedCells.endCol}`;
    const lastCellFormat = newFormats[lastCellKey] || { bold: false, align: 'left' };
    setActiveCellFormat({
      bold: type === 'bold' ? !activeCellFormat.bold : lastCellFormat.bold,
      align: type === 'align' ? value as TextAlign : lastCellFormat.align
    });
  };
  
  // Apply bold formatting
  const handleFormatBold = () => {
    applyFormatting('bold', true);
  };
  
  // Apply alignment formatting
  const handleFormatAlign = (align: TextAlign) => {
    applyFormatting('align', align);
  };
  
  // Copy selected cells to clipboard
  const handleCopy = () => {
    if (!selectedCells || !sheet) return;
    
    const minRow = Math.min(selectedCells.startRow, selectedCells.endRow);
    const maxRow = Math.max(selectedCells.startRow, selectedCells.endRow);
    const minCol = Math.min(selectedCells.startCol, selectedCells.endCol);
    const maxCol = Math.max(selectedCells.startCol, selectedCells.endCol);
    
    let copyText = '';
    try {
      const data = sheet.get("data");
      
      if (!data) {
        throw new Error("Sheet data is undefined");
      }
      
      for (let r = minRow; r <= maxRow; r++) {
        const rowData = [];
        const row = data.get(r);
        
        if (row) {
          for (let c = minCol; c <= maxCol; c++) {
            const cellValue = row.get(c) || '';
            // If it's a formula, copy the displayed value
            if (isFormula(cellValue)) {
              rowData.push(displayedCellValues[`${r}-${c}`] || cellValue);
            } else {
              rowData.push(cellValue);
            }
          }
          copyText += rowData.join('\t') + '\n';
        }
      }
      
      navigator.clipboard.writeText(copyText).then(() => {
        toast({
          title: "Copied!",
          description: "Selected cells copied to clipboard.",
        });
        setIsCopying(true); // Enable paste mode
      }).catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Error",
          description: "Failed to copy to clipboard.",
          variant: "destructive",
        });
      });
    } catch (error) {
      console.error("Error copying cells:", error);
      toast({
        title: "Error",
        description: "Failed to copy cells.",
        variant: "destructive",
      });
    }
  };
  
  // Paste from clipboard
  const handlePaste = async () => {
    if (!selectedCells || !sheet) return;
    
    try {
      const clipboardText = await navigator.clipboard.readText();
      const pasteRows = clipboardText.split('\n').filter(row => row.trim() !== '');
      
      if (pasteRows.length === 0) return;
      
      const targetRow = selectedCells.startRow;
      const targetCol = selectedCells.startCol;
      
      pasteRows.forEach((rowText, rowOffset) => {
        const rowCells = rowText.split('\t');
        rowCells.forEach((cellValue, colOffset) => {
          const pasteRowIdx = targetRow + rowOffset;
          const pasteColIdx = targetCol + colOffset;
          
          updateCell(pasteRowIdx, pasteColIdx, cellValue);
        });
      });
      
      setIsCopying(false);
      
      toast({
        title: "Pasted!",
        description: "Content pasted successfully.",
      });
    } catch (err) {
      console.error('Failed to paste: ', err);
      toast({
        title: "Error",
        description: "Failed to paste from clipboard.",
        variant: "destructive",
      });
    }
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSelectedCells(null);
      setIsCopying(false);
    } else if (e.ctrlKey && e.key === 'c') {
      handleCopy();
    } else if (e.ctrlKey && e.key === 'v') {
      handlePaste();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedCells && sheet) {
        const minRow = Math.min(selectedCells.startRow, selectedCells.endRow);
        const maxRow = Math.max(selectedCells.startRow, selectedCells.endRow);
        const minCol = Math.min(selectedCells.startCol, selectedCells.endCol);
        const maxCol = Math.max(selectedCells.startCol, selectedCells.endCol);
        
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            updateCell(r, c, '');
          }
        }
        
        toast({
          title: "Cells cleared",
          description: "Selected cells have been cleared.",
        });
      }
    }
  };
  
  // Scroll to make sure selection is visible
  useEffect(() => {
    if (selectedCells && spreadsheetTableRef.current) {
      const table = spreadsheetTableRef.current;
      const tableRect = table.getBoundingClientRect();
      
      // Try to find the selected cell
      const selectedCell = table.querySelector(`td[data-row="${selectedCells.endRow}"][data-col="${selectedCells.endCol}"]`);
      
      if (selectedCell) {
        const cellRect = selectedCell.getBoundingClientRect();
        
        // Check if cell is outside view
        if (cellRect.right > tableRect.right) {
          table.parentElement?.scrollBy({ left: cellRect.right - tableRect.right + 50, behavior: 'smooth' });
        } else if (cellRect.left < tableRect.left) {
          table.parentElement?.scrollBy({ left: cellRect.left - tableRect.left - 50, behavior: 'smooth' });
        }
        
        if (cellRect.bottom > tableRect.bottom) {
          table.parentElement?.scrollBy({ top: cellRect.bottom - tableRect.bottom + 50, behavior: 'smooth' });
        } else if (cellRect.top < tableRect.top) {
          table.parentElement?.scrollBy({ top: cellRect.top - tableRect.top - 50, behavior: 'smooth' });
        }
      }
    }
  }, [selectedCells]);

  // Extract sheet data safely
  const getSheetData = () => {
    if (!sheet) return {
      name: "Untitled Sheet",
      columns: DEFAULT_COLUMNS,
      rows: DEFAULT_ROWS,
      data: [] as any[]
    };
    
    try {
      return {
        name: sheet.get("name") || "Untitled Sheet",
        columns: sheet.get("columns") || DEFAULT_COLUMNS,
        rows: sheet.get("rows") || DEFAULT_ROWS, 
        data: sheet.get("data") || []
      };
    } catch (error) {
      console.error("Error accessing sheet properties:", error);
      return {
        name: "Untitled Sheet",
        columns: DEFAULT_COLUMNS,
        rows: DEFAULT_ROWS,
        data: [] as any[]
      };
    }
  };

  return {
    // State
    isLoading,
    sheet,
    selectedCells,
    activeCellFormat,
    cellFormats,
    isCopying,
    shareDialogOpen,
    shareEmail,
    displayedCellValues,
    isEditingTitle,
    tempSheetName,
    titleInputRef,
    spreadsheetTableRef,
    
    // Data
    sheetData: getSheetData(),
    
    // Actions
    updateCell,
    handleAddRow,
    handleAddColumn,
    handleRemoveRow,
    handleRemoveColumn,
    handleTitleClick,
    handleTitleSave,
    handleTitleBlur,
    handleTitleKeyDown,
    handleCellMouseDown,
    handleCellMouseOver,
    handleCellMouseUp,
    handleFormatBold, 
    handleFormatAlign,
    handleCopy,
    handlePaste,
    handleKeyDown,
    handleSave,
    handleExport,
    handleShare,
    setTempSheetName,
    setShareDialogOpen,
    setShareEmail,
    
    // Navigation
    goBack: () => navigate("/dashboard")
  };
};
