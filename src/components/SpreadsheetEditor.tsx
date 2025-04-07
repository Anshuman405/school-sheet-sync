
import { useEffect, useState, useRef, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { 
  useRoom, 
  useMyPresence, 
  useOthers, 
  useSelf,
  useStorage,
  useMutation,
  LiveblocksRoomProvider,
  Presence,
  Storage,
  SheetData,
  defaultInitialStorage
} from "@/providers/LiveblocksProvider";
import { LiveList, LiveObject } from "@liveblocks/client";
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Share2, 
  Settings,
  Plus,
  UserRound,
  ChevronDown,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Edit,
  PlusSquare,
  Scissors,
  Copy,
  Clipboard,
  MinusSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SpreadsheetEditorProps {
  sheetId: string;
  initialSheetName?: string;
}

type CellFormat = {
  bold: boolean;
  align: 'left' | 'center' | 'right';
};

type TextAlign = 'left' | 'center' | 'right';

const SpreadsheetEditorContent = ({ sheetId, initialSheetName }: SpreadsheetEditorProps) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const room = useRoom();
  const others = useOthers();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempSheetName, setTempSheetName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCells, setSelectedCells] = useState<{startRow: number, startCol: number, endRow: number, endCol: number} | null>(null);
  const [activeCellFormat, setActiveCellFormat] = useState<CellFormat>({
    bold: false,
    align: 'left'
  });
  const [cellFormats, setCellFormats] = useState<Record<string, CellFormat>>({});
  const [isCopying, setIsCopying] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const spreadsheetTableRef = useRef<HTMLTableElement>(null);
  
  // Get sheet data from Liveblocks storage
  const sheet = useStorage(root => root?.sheets?.get(sheetId));
  
  // Default values for new sheets
  const DEFAULT_COLUMNS = 50;
  const DEFAULT_ROWS = 100;
  
  // Initialize a new sheet or load existing one from Liveblocks
  const initializeSheet = useMutation(({ storage, setMyPresence }) => {
    const sheets = storage.get("sheets");
    
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
      const sheetObj = new LiveObject<SheetData>({
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
    const sheets = storage.get("sheets");
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
        }
      }
    }
  }, [sheetId]);
  
  // Update sheet name
  const updateSheetName = useMutation(({ storage }, newName: string) => {
    const sheets = storage.get("sheets");
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
    const sheets = storage.get("sheets");
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
      }
    }
  }, [sheetId]);
  
  // Remove a row
  const removeRow = useMutation(({ storage }, rowIndex: number) => {
    const sheets = storage.get("sheets");
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
      }
    }
  }, [sheetId]);
  
  // Add a new column
  const addColumn = useMutation(({ storage }, colIndex: number) => {
    const sheets = storage.get("sheets");
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
      }
    }
  }, [sheetId]);
  
  // Remove a column
  const removeColumn = useMutation(({ storage }, colIndex: number) => {
    const sheets = storage.get("sheets");
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
      }
    }
  }, [sheetId]);
  
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
        setIsLoading(false);
      } catch (error) {
        console.error("Error accessing sheet data:", error);
        setTempSheetName(initialSheetName || "Untitled Sheet");
        setIsLoading(false);
      }
    }
  }, [sheet, initializeSheet, initialSheetName]);
  
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
            const cell = row.get(j) || "";
            // Escape quotes and handle commas
            csvRow.push(`"${cell.replace(/"/g, '""')}"`);
          }
          csvRows.push(csvRow.join(","));
        }
      }
      
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${sheet.get("name") || "sheet"}.csv`);
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
      setTempSheetName(sheet.get("name") || "Untitled Sheet");
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
          setTempSheetName(sheet.get("name") || "Untitled Sheet");
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
        align: format.align as TextAlign
      });
    }
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
      align: type === 'align' ? value as TextAlign : lastCellFormat.align as TextAlign
    });
  };
  
  // Get cell style based on its format
  const getCellStyle = (rowIndex: number, colIndex: number): CSSProperties => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const format = cellFormats[cellKey] || { bold: false, align: 'left' };
    
    return {
      fontWeight: format.bold ? 'bold' : 'normal',
      textAlign: format.align as TextAlign
    };
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
            rowData.push(row.get(c) || '');
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
      const data = sheet.get("data");
      
      if (!data) {
        throw new Error("Sheet data is undefined");
      }
      
      pasteRows.forEach((rowText, rowOffset) => {
        const rowCells = rowText.split('\t');
        rowCells.forEach((cellValue, colOffset) => {
          const pasteRowIdx = targetRow + rowOffset;
          const pasteColIdx = targetCol + colOffset;
          
          if (pasteRowIdx < data.length) {
            const row = data.get(pasteRowIdx);
            if (row && pasteColIdx < row.length) {
              updateCell(pasteRowIdx, pasteColIdx, cellValue);
            }
          }
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
        
        try {
          const data = sheet.get("data");
          
          if (!data) {
            throw new Error("Sheet data is undefined");
          }
          
          for (let r = minRow; r <= maxRow; r++) {
            const row = data.get(r);
            if (row) {
              for (let c = minCol; c <= maxCol; c++) {
                if (c < row.length) {
                  updateCell(r, c, '');
                }
              }
            }
          }
          
          toast({
            title: "Cells cleared",
            description: "Selected cells have been cleared.",
          });
        } catch (error) {
          console.error("Error clearing cells:", error);
          toast({
            title: "Error",
            description: "Failed to clear cells.",
            variant: "destructive",
          });
        }
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
  
  if (isLoading || !sheet) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading sheet...</p>
        </div>
      </div>
    );
  }
  
  // Safely get sheet properties with fallbacks
  const sheetName = (() => {
    try {
      return sheet.get("name") || "Untitled Sheet";
    } catch (error) {
      console.error("Error accessing sheet name:", error);
      return "Untitled Sheet";
    }
  })();
  
  const sheetColumns = (() => {
    try {
      return sheet.get("columns") || DEFAULT_COLUMNS;
    } catch (error) {
      console.error("Error accessing sheet columns:", error);
      return DEFAULT_COLUMNS;
    }
  })();
  
  const sheetRows = (() => {
    try {
      return sheet.get("rows") || DEFAULT_ROWS;
    } catch (error) {
      console.error("Error accessing sheet rows:", error);
      return DEFAULT_ROWS;
    }
  })();
  
  const sheetData = (() => {
    try {
      return sheet.get("data");
    } catch (error) {
      console.error("Error accessing sheet data:", error);
      return null;
    }
  })();
  
  return (
    <div className="space-y-4" tabIndex={-1} onKeyDown={handleKeyDown}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <Input
              ref={titleInputRef}
              value={tempSheetName}
              onChange={(e) => setTempSheetName(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleSave();
                } else if (e.key === 'Escape') {
                  setTempSheetName(sheetName);
                  setIsEditingTitle(false);
                }
              }}
              className="w-60 h-8 font-semibold text-xl"
            />
          </div>
        ) : (
          <h1 
            className="text-xl font-semibold cursor-pointer hover:bg-muted px-2 py-1 rounded"
            onClick={handleTitleClick}
          >
            <span className="flex items-center gap-1">
              {sheetName}
              <Edit className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
            </span>
          </h1>
        )}
        
        <div className="ml-auto flex items-center gap-4">
          <div className="flex -space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm border-2 border-background">
              {user?.firstName ? user.firstName.charAt(0) : user?.username ? user.username.charAt(0) : "U"}
            </div>
            
            {/* Show online users from Liveblocks */}
            {others.map(user => {
              // Safely handle potentially undefined or non-string values
              const firstName = typeof user.presence.firstName === 'string' ? user.presence.firstName : '';
              return (
                <div 
                  key={user.connectionId} 
                  className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm border-2 border-background"
                >
                  {firstName ? firstName.charAt(0) : "U"}
                </div>
              );
            })}
          </div>
          <span className="text-sm text-muted-foreground ml-1">
            {others.length + 1} {others.length + 1 === 1 ? "editor" : "editors"}
          </span>
        </div>
      </div>
      
      <div className="p-3 border-b bg-muted/30 flex flex-wrap gap-2 rounded-t-lg border-t border-x">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <Plus size={16} className="mr-1" /> Add <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="start">
            <div className="flex flex-col">
              <Button variant="ghost" className="justify-start rounded-none h-9 px-3" onClick={handleAddRow}>
                <Plus size={14} className="mr-2" /> Add Row
              </Button>
              <Button variant="ghost" className="justify-start rounded-none h-9 px-3" onClick={handleAddColumn}>
                <Plus size={14} className="mr-2" /> Add Column
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <Trash2 size={16} className="mr-1" /> Remove <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="start">
            <div className="flex flex-col">
              <Button variant="ghost" className="justify-start rounded-none h-9 px-3" onClick={handleRemoveRow}>
                <MinusSquare size={14} className="mr-2" /> Remove Row
              </Button>
              <Button variant="ghost" className="justify-start rounded-none h-9 px-3" onClick={handleRemoveColumn}>
                <MinusSquare size={14} className="mr-2" /> Remove Column
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <Separator orientation="vertical" className="h-8" />
        
        <Button 
          size="sm" 
          variant={activeCellFormat.bold ? "default" : "outline"} 
          className="h-8 px-2 w-9"
          onClick={() => applyFormatting('bold', true)}
        >
          <Bold size={16} />
        </Button>
        <Button 
          size="sm" 
          variant={activeCellFormat.align === 'left' ? "default" : "outline"} 
          className="h-8 px-2 w-9"
          onClick={() => applyFormatting('align', 'left')}
        >
          <AlignLeft size={16} />
        </Button>
        <Button 
          size="sm" 
          variant={activeCellFormat.align === 'center' ? "default" : "outline"} 
          className="h-8 px-2 w-9"
          onClick={() => applyFormatting('align', 'center')}
        >
          <AlignCenter size={16} />
        </Button>
        <Button 
          size="sm" 
          variant={activeCellFormat.align === 'right' ? "default" : "outline"} 
          className="h-8 px-2 w-9"
          onClick={() => applyFormatting('align', 'right')}
        >
          <AlignRight size={16} />
        </Button>
        
        <Separator orientation="vertical" className="h-8" />
        
        {selectedCells && (
          <>
            <Button size="sm" variant="outline" className="h-8" onClick={handleCopy}>
              <Copy size={16} className="mr-1" /> Copy
            </Button>
            {isCopying && (
              <Button size="sm" variant="outline" className="h-8" onClick={handlePaste}>
                <Clipboard size={16} className="mr-1" /> Paste
              </Button>
            )}
          </>
        )}
        
        <div className="ml-auto">
          <Button size="sm" variant="outline" className="h-8 mr-2" onClick={handleSave}>
            <Save size={16} className="mr-1" /> Save
          </Button>
          <Button size="sm" variant="outline" className="h-8 mr-2" onClick={handleExport}>
            <Download size={16} className="mr-1" /> Export
          </Button>
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 mr-2">
                <Share2 size={16} className="mr-1" /> Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share this sheet</DialogTitle>
                <DialogDescription>
                  Enter an email address to invite someone to collaborate.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="email" className="mb-2 block">Email address</Label>
                <Input 
                  id="email" 
                  placeholder="colleague@school.edu" 
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleShare}>Share</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8">
                <Settings size={16} className="mr-1" /> 
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sheet Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleTitleClick}>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Format cells</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
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
              {sheetData && Array.from({ length: sheetRows }, (_, rowIndex) => {
                const row = sheetData.get(rowIndex);
                
                return (
                  <tr key={rowIndex}>
                    <td className="w-16 bg-muted text-muted-foreground">{rowIndex + 1}</td>
                    {Array.from({ length: sheetColumns }, (_, colIndex) => {
                      const cellValue = row ? (row.get(colIndex) || "") : "";
                      
                      return (
                        <td 
                          key={colIndex} 
                          data-row={rowIndex} 
                          data-col={colIndex}
                          className={`border p-2 ${isCellSelected(rowIndex, colIndex) ? 'bg-accent' : ''}`}
                          style={getCellStyle(rowIndex, colIndex)}
                          onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                          onMouseOver={() => handleCellMouseOver(rowIndex, colIndex)}
                          onMouseUp={handleCellMouseUp}
                        >
                          <input 
                            type="text" 
                            value={cellValue} 
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)} 
                            className="w-full h-full bg-transparent border-none outline-none"
                          />
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
    </div>
  );
};

export default function SpreadsheetEditor({ sheetId, initialSheetName }: SpreadsheetEditorProps) {
  const { user } = useUser();
  
  return (
    <LiveblocksRoomProvider 
      id={sheetId} 
      initialPresence={{
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        cursor: null
      }}
      initialStorage={defaultInitialStorage}
    >
      <SpreadsheetEditorContent sheetId={sheetId} initialSheetName={initialSheetName} />
    </LiveblocksRoomProvider>
  );
}
