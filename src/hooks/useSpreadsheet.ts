
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { 
  useStorage, 
  useMutation, 
  LiveObject,
  SheetData
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
  const [selectedCells, setSelectedCells] = useState<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null>(null);
  const [activeCellFormat, setActiveCellFormat] = useState<{
    bold: boolean;
    align: TextAlign;
  }>({
    bold: false,
    align: "left",
  });
  const [cellFormats, setCellFormats] = useState<Record<string, { bold: boolean; align: TextAlign }>>({});
  const [isCopying, setIsCopying] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [displayedCellValues, setDisplayedCellValues] = useState<Record<string, string>>({});

  const titleInputRef = useRef<HTMLInputElement>(null);
  const spreadsheetTableRef = useRef<HTMLTableElement>(null);

  // Get sheet data from Liveblocks storage
  const sheet = useStorage((root) => {
    if (!root?.sheets) return undefined;
    const sheetObject = root.sheets.get(sheetId);
    return sheetObject ? sheetObject : undefined;
  });

  // Initialize a new sheet or load existing one from Liveblocks
  const initializeSheet = useMutation(({ storage, setMyPresence }) => {
    if (!storage) {
      console.error("Storage is not loaded yet.");
      return;
    }

    const sheets = storage.get("sheets");
    if (!sheets) {
      console.error("Sheets map is not initialized in Liveblocks storage.");
      return;
    }

    if (!sheets.has(sheetId)) {
      // Create a new sheet if it doesn't exist
      const initialData = Array.from({ length: 100 }, () =>
        Array(50).fill("")
      );

      const newSheet = new LiveObject<SheetData>({
        name: initialSheetName || "Untitled Sheet",
        data: initialData,
        columns: 50,
        rows: 100,
        updatedAt: new Date().toISOString(),
        starred: false,
        shared: false,
      });

      sheets.set(sheetId, newSheet);
    } else {
      // Update last accessed timestamp
      const existingSheet = sheets.get(sheetId);
      if (existingSheet) {
        existingSheet.set("updatedAt", new Date().toISOString());
      }
    }

    // Set user presence
    setMyPresence({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      cursor: null,
    });
  }, [sheetId, initialSheetName, user]);

  // Rename sheet
  const renameSheet = useMutation(({ storage }, sheetId: string, newName: string) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    const sheetObj = sheets.get(sheetId);
    
    if (sheetObj) {
      sheetObj.set("name", newName);
      sheetObj.set("updatedAt", new Date().toISOString());
    }
  }, []);

  // Handle cell changes
  const updateCell = useMutation(({ storage }, rowIndex: number, colIndex: number, value: string) => {
    if (!storage) return;

    const sheets = storage.get("sheets");
    if (!sheets) return;

    const sheetObj = sheets.get(sheetId);

    if (sheetObj) {
      const currentData = [...sheetObj.get("data")];
      
      if (currentData[rowIndex]) {
        const newRowData = [...currentData[rowIndex]];
        newRowData[colIndex] = value;
        currentData[rowIndex] = newRowData;
        
        sheetObj.set("data", currentData);
        sheetObj.set("updatedAt", new Date().toISOString());
      }
    }
  }, [sheetId]);

  // Add a new row
  const addRow = useMutation(({ storage }, rowIndex: number) => {
    if (!storage) return;

    const sheets = storage.get("sheets");
    if (!sheets) return;

    const sheetObj = sheets.get(sheetId);

    if (sheetObj) {
      const currentData = [...sheetObj.get("data")];
      const currentColumns = sheetObj.get("columns");
      
      const newRow = Array(currentColumns).fill("");
      const newData = [...currentData];
      newData.splice(rowIndex + 1, 0, newRow);
      
      sheetObj.set("data", newData);
      sheetObj.set("rows", sheetObj.get("rows") + 1);
      sheetObj.set("updatedAt", new Date().toISOString());
    }
  }, [sheetId]);

  // Add a new column
  const addColumn = useMutation(({ storage }, colIndex: number) => {
    if (!storage) return;

    const sheets = storage.get("sheets");
    if (!sheets) return;

    const sheetObj = sheets.get(sheetId);

    if (sheetObj) {
      const currentData = [...sheetObj.get("data")];
      const newData = currentData.map(row => {
        const newRow = [...row];
        newRow.splice(colIndex + 1, 0, "");
        return newRow;
      });
      
      sheetObj.set("data", newData);
      sheetObj.set("columns", sheetObj.get("columns") + 1);
      sheetObj.set("updatedAt", new Date().toISOString());
    }
  }, [sheetId]);

  // Remove a row
  const removeRow = useMutation(({ storage }, rowIndex: number) => {
    if (!storage) return;

    const sheets = storage.get("sheets");
    if (!sheets) return;

    const sheetObj = sheets.get(sheetId);

    if (sheetObj) {
      const currentData = [...sheetObj.get("data")];
      const newData = [...currentData];
      newData.splice(rowIndex, 1);
      
      sheetObj.set("data", newData);
      sheetObj.set("rows", sheetObj.get("rows") - 1);
      sheetObj.set("updatedAt", new Date().toISOString());
    }
  }, [sheetId]);

  // Remove a column
  const removeColumn = useMutation(({ storage }, colIndex: number) => {
    if (!storage) return;

    const sheets = storage.get("sheets");
    if (!sheets) return;

    const sheetObj = sheets.get(sheetId);

    if (sheetObj) {
      const currentData = [...sheetObj.get("data")];
      const newData = currentData.map(row => {
        const newRow = [...row];
        newRow.splice(colIndex, 1);
        return newRow;
      });
      
      sheetObj.set("data", newData);
      sheetObj.set("columns", sheetObj.get("columns") - 1);
      sheetObj.set("updatedAt", new Date().toISOString());
    }
  }, [sheetId]);

  // Recalculate all formulas in the sheet
  const recalculateAllFormulas = () => {
    if (!sheet) return;

    try {
      const newDisplayedValues: Record<string, string> = {};
      const data = sheet.get("data");

      data.forEach((row: string[], rowIndex: number) => {
        row.forEach((cellValue: string, colIndex: number) => {
          if (isFormula(cellValue)) {
            const result = evaluateFormula(cellValue, (r, c) => data[r]?.[c] || "");
            newDisplayedValues[`${rowIndex}-${colIndex}`] = result;
          }
        });
      });

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
      setTempSheetName(sheet.get("name") || "Untitled Sheet");
      recalculateAllFormulas();
      setIsLoading(false);
    }
  }, [sheet, initializeSheet]);

  // Recalculate formulas whenever sheet data changes
  useEffect(() => {
    if (sheet) {
      recalculateAllFormulas();
    }
  }, [sheet]);

  // Add a new row
  const handleAddRow = () => {
    if (!sheet) return;
    const rowIndex = sheet.get("rows") - 1;
    addRow(rowIndex);
  };

  // Add a new column
  const handleAddColumn = () => {
    if (!sheet) return;
    const colIndex = sheet.get("columns") - 1;
    addColumn(colIndex);
  };

  // Remove a row
  const handleRemoveRow = () => {
    if (!sheet || !selectedCells) return;
    const rowIndex = Math.max(selectedCells.startRow, selectedCells.endRow);
    removeRow(rowIndex);
  };

  // Remove a column
  const handleRemoveColumn = () => {
    if (!sheet || !selectedCells) return;
    const colIndex = Math.max(selectedCells.startCol, selectedCells.endCol);
    removeColumn(colIndex);
  };

  // Handle title click (start editing)
  const handleTitleClick = () => {
    setIsEditingTitle(true);
    titleInputRef.current?.focus();
  };

  // Handle title blur (save title)
  const handleTitleBlur = () => {
    if (!sheet) return;
    renameSheet(sheetId, tempSheetName);
    setIsEditingTitle(false);
  };

  // Handle title key down (save on Enter)
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    }
  };

  // Handle bold formatting
  const handleFormatBold = () => {
    if (!selectedCells) return;
    const newFormats = { ...cellFormats };
    for (let row = selectedCells.startRow; row <= selectedCells.endRow; row++) {
      for (let col = selectedCells.startCol; col <= selectedCells.endCol; col++) {
        const cellKey = `${row}-${col}`;
        newFormats[cellKey] = {
          ...newFormats[cellKey],
          bold: !newFormats[cellKey]?.bold,
        };
      }
    }
    setCellFormats(newFormats);
  };

  // Handle text alignment
  const handleFormatAlign = (align: TextAlign) => {
    if (!selectedCells) return;
    const newFormats = { ...cellFormats };
    for (let row = selectedCells.startRow; row <= selectedCells.endRow; row++) {
      for (let col = selectedCells.startCol; col <= selectedCells.endCol; col++) {
        const cellKey = `${row}-${col}`;
        newFormats[cellKey] = {
          ...newFormats[cellKey],
          align,
        };
      }
    }
    setCellFormats(newFormats);
  };

  // Handle copying selected cells
  const handleCopy = () => {
    if (!selectedCells || !sheet) return;

    const copiedData = [];
    const data = sheet.get("data");
    
    for (let row = selectedCells.startRow; row <= selectedCells.endRow; row++) {
      const rowData = [];
      for (let col = selectedCells.startCol; col <= selectedCells.endCol; col++) {
        rowData.push(data[row]?.[col] || "");
      }
      copiedData.push(rowData);
    }

    navigator.clipboard.writeText(
      copiedData.map((row) => row.join("\t")).join("\n")
    );
    toast({ title: "Copied to clipboard", description: "Selected cells have been copied." });
  };

  // Handle pasting data into selected cells
  const handlePaste = async () => {
    if (!selectedCells || !sheet) return;

    try {
      const clipboardData = await navigator.clipboard.readText();
      const rows = clipboardData.split("\n").map((row) => row.split("\t"));

      const currentData = [...sheet.get("data")];
      rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const targetRow = selectedCells.startRow + rowIndex;
          const targetCol = selectedCells.startCol + colIndex;
          if (currentData[targetRow]) {
            if (!currentData[targetRow]) {
              currentData[targetRow] = [...currentData[targetRow]];
            }
            currentData[targetRow][targetCol] = cell;
          }
        });
      });

      // Update the cell data in storage
      useMutation(({ storage }) => {
        if (!storage) return;
        const sheets = storage.get("sheets");
        if (!sheets) return;
        const sheetObj = sheets.get(sheetId);
        if (sheetObj) {
          sheetObj.set("data", currentData);
          sheetObj.set("updatedAt", new Date().toISOString());
        }
      })();
      
      toast({ title: "Pasted from clipboard", description: "Data has been pasted into the sheet." });
    } catch (error) {
      console.error("Error pasting data:", error);
      toast({ title: "Error", description: "Failed to paste data.", variant: "destructive" });
    }
  };

  // Handle saving the sheet
  const handleSave = () => {
    if (!sheet) return;
    toast({ title: "Saved", description: "Your sheet has been saved." });
  };

  // Handle exporting the sheet as CSV
  const handleExport = () => {
    if (!sheet) return;

    const data = sheet.get("data");
    const csvContent = data.map((row: string[]) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${sheet.get("name") || "sheet"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Exported", description: "Your sheet has been exported as a CSV file." });
  };

  // Handle sharing the sheet
  const handleShare = () => {
    if (!shareEmail) {
      toast({ title: "Error", description: "Please enter an email to share the sheet.", variant: "destructive" });
      return;
    }

    // Simulate sharing logic
    toast({ title: "Shared", description: `Sheet shared with ${shareEmail}.` });
    setShareDialogOpen(false);
  };

  // Handle mouse down on a cell
  const handleCellMouseDown = (row: number, col: number) => {
    setSelectedCells({
      startRow: row,
      startCol: col,
      endRow: row,
      endCol: col,
    });
  };

  // Handle mouse over a cell (for selection)
  const handleCellMouseOver = (row: number, col: number) => {
    if (selectedCells) {
      setSelectedCells({
        ...selectedCells,
        endRow: row,
        endCol: col,
      });
    }
  };

  // Handle mouse up on a cell (end selection)
  const handleCellMouseUp = () => {
    // Finalize the selection
    if (selectedCells) {
      console.log("Selected cells:", selectedCells);
    }
  };

  // Handle key down events (e.g., for navigation or editing)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCells) return;

    const { startRow, startCol, endRow, endCol } = selectedCells;

    switch (e.key) {
      case "ArrowUp":
        setSelectedCells({
          startRow: Math.max(startRow - 1, 0),
          startCol,
          endRow: Math.max(endRow - 1, 0),
          endCol,
        });
        break;
      case "ArrowDown":
        setSelectedCells({
          startRow: startRow + 1,
          startCol,
          endRow: endRow + 1,
          endCol,
        });
        break;
      case "ArrowLeft":
        setSelectedCells({
          startRow,
          startCol: Math.max(startCol - 1, 0),
          endRow,
          endCol: Math.max(endCol - 1, 0),
        });
        break;
      case "ArrowRight":
        setSelectedCells({
          startRow,
          startCol: startCol + 1,
          endRow,
          endCol: endCol + 1,
        });
        break;
      case "Enter":
        // Start editing the selected cell
        console.log("Start editing cell:", startRow, startCol);
        break;
      default:
        break;
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

    // Actions
    updateCell,
    handleAddRow,
    handleAddColumn,
    handleRemoveRow,
    handleRemoveColumn,
    handleTitleClick,
    handleTitleBlur,
    handleTitleKeyDown,
    handleFormatBold,
    handleFormatAlign,
    handleCopy,
    handlePaste,
    handleSave,
    handleExport,
    handleShare,
    setTempSheetName,
    setShareDialogOpen,
    setShareEmail,
    handleCellMouseDown,
    handleCellMouseOver,
    handleCellMouseUp,
    handleKeyDown,

    // Navigation
    goBack: () => navigate("/dashboard"),
  };
};
