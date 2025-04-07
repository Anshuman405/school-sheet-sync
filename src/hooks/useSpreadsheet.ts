import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useStorage, useMutation } from "@/providers/LiveblocksProvider";
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
    if (!root || !root.sheets) return undefined;
    return root.sheets[sheetId];
  });

  // Default values for new sheets
  const DEFAULT_COLUMNS = 50;
  const DEFAULT_ROWS = 100;

  // Initialize a new sheet or load existing one from Liveblocks
  const initializeSheet = useMutation(({ storage, setMyPresence }) => {
    if (!storage) return;
  
    const sheets = storage.get("sheets");
    if (!sheets) {
      console.error("Sheets map is not initialized in Liveblocks storage.");
      return;
    }
  
    if (!sheets.has(sheetId)) {
      // Create a new sheet if it doesn't exist
      const initialData = Array.from({ length: DEFAULT_ROWS }, () =>
        Array(DEFAULT_COLUMNS).fill("")
      );
  
      // Create the sheet object with name, data, columns, and rows
      const newSheet = {
        name: initialSheetName || "Untitled Sheet",
        data: initialData,
        columns: DEFAULT_COLUMNS,
        rows: DEFAULT_ROWS,
        updatedAt: new Date().toISOString(),
        starred: false,
        shared: false,
      };
  
      // Add the new sheet to the sheets map
      sheets.set(sheetId, newSheet);
    } else {
      // Update last accessed timestamp
      const existingSheet = sheets.get(sheetId);
      if (existingSheet) {
        existingSheet.updatedAt = new Date().toISOString();
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
    const sheet = sheets[sheetId];

    if (sheet) {
      const data = sheet.data;
      if (data[rowIndex]) {
        data[rowIndex][colIndex] = value;

        // Update timestamp
        sheet.updatedAt = new Date().toISOString();

        // Recalculate formulas
        recalculateAllFormulas();
      }
    }
  }, [sheetId]);

  // Add a new row
  const addRow = useMutation(({ storage }, rowIndex: number) => {
    if (!storage) return;

    const sheets = storage.get("sheets");
    const sheet = sheets[sheetId];

    if (sheet) {
      const newRow = Array(sheet.columns).fill("");
      sheet.data.splice(rowIndex + 1, 0, newRow);
      sheet.rows += 1;
      sheet.updatedAt = new Date().toISOString();
    }
  }, [sheetId]);

  // Add a new column
  const addColumn = useMutation(({ storage }, colIndex: number) => {
    if (!storage) return;

    const sheets = storage.get("sheets");
    const sheet = sheets[sheetId];

    if (sheet) {
      sheet.data.forEach((row) => row.splice(colIndex + 1, 0, ""));
      sheet.columns += 1;
      sheet.updatedAt = new Date().toISOString();
    }
  }, [sheetId]);

  // Remove a row
  const removeRow = useMutation(({ storage }, rowIndex: number) => {
    if (!storage) return;

    const sheets = storage.get("sheets");
    const sheet = sheets[sheetId];

    if (sheet) {
      sheet.data.splice(rowIndex, 1);
      sheet.rows -= 1;
      sheet.updatedAt = new Date().toISOString();
    }
  }, [sheetId]);

  // Remove a column
  const removeColumn = useMutation(({ storage }, colIndex: number) => {
    if (!storage) return;

    const sheets = storage.get("sheets");
    const sheet = sheets[sheetId];

    if (sheet) {
      sheet.data.forEach((row) => row.splice(colIndex, 1));
      sheet.columns -= 1;
      sheet.updatedAt = new Date().toISOString();
    }
  }, [sheetId]);

  // Recalculate all formulas in the sheet
  const recalculateAllFormulas = () => {
    if (!sheet) return;

    try {
      const newDisplayedValues: Record<string, string> = {};

      sheet.data.forEach((row, rowIndex) => {
        row.forEach((cellValue, colIndex) => {
          if (isFormula(cellValue)) {
            const result = evaluateFormula(cellValue, (r, c) => sheet.data[r]?.[c] || "");
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
      setTempSheetName(sheet.name || "Untitled Sheet");
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
    const rowIndex = sheet.rows;
    addRow(rowIndex);
  };

  // Add a new column
  const handleAddColumn = () => {
    if (!sheet) return;
    const colIndex = sheet.columns;
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
    for (let row = selectedCells.startRow; row <= selectedCells.endRow; row++) {
      const rowData = [];
      for (let col = selectedCells.startCol; col <= selectedCells.endCol; col++) {
        rowData.push(sheet.data[row]?.[col] || "");
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

      const newData = [...sheet.data];
      rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const targetRow = selectedCells.startRow + rowIndex;
          const targetCol = selectedCells.startCol + colIndex;
          if (newData[targetRow]) {
            newData[targetRow][targetCol] = cell;
          }
        });
      });

      updateCell(newData);
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

    const csvContent = sheet.data.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${sheet.name || "sheet"}.csv`);
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

    // Navigation
    goBack: () => navigate("/dashboard"),
  };
};