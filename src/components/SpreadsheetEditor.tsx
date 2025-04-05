import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { 
  useRoom, 
  useMyPresence, 
  useOthers, 
  useSelf,
  useStorage,
  useMutation,
  LiveblocksRoomProvider
} from "@/providers/LiveblocksProvider";
import { LiveList, LiveObject, LiveMap } from "@liveblocks/client";
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
  Clipboard
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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

// Mock data for initial sheets
const mockSheetData = {
  "1": {
    name: "Class 10B Grades",
    data: [
      ["Student", "Math", "Science", "English", "Average"],
      ["Emma Davis", "92", "88", "95", "91.7"],
      ["Jacob Smith", "84", "90", "82", "85.3"],
      ["Olivia Johnson", "78", "85", "90", "84.3"],
      ["Noah Williams", "95", "82", "79", "85.3"],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
    ],
    columns: 20,
    rows: 50,
  },
  "2": {
    name: "School Budget Q2",
    data: [
      ["Category", "January", "February", "March", "Total"],
      ["Salaries", "45000", "45000", "45000", "135000"],
      ["Supplies", "5200", "3800", "4100", "13100"],
      ["Utilities", "2800", "2600", "2900", "8300"],
      ["Maintenance", "1500", "3200", "1800", "6500"],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
    ],
    columns: 20,
    rows: 50,
  },
};

interface SpreadsheetEditorProps {
  sheetId: string;
}

const SpreadsheetEditorContent = ({ sheetId }: SpreadsheetEditorProps) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const room = useRoom();
  const others = useOthers();
  const [sheetName, setSheetName] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempSheetName, setTempSheetName] = useState("");
  const [data, setData] = useState<string[][]>([]);
  const [columns, setColumns] = useState(20);
  const [rows, setRows] = useState(50);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCells, setSelectedCells] = useState<{startRow: number, startCol: number, endRow: number, endCol: number} | null>(null);
  const [activeCellFormat, setActiveCellFormat] = useState<{
    bold: boolean;
    align: 'left' | 'center' | 'right';
  }>({
    bold: false,
    align: 'left'
  });
  const [cellFormats, setCellFormats] = useState<Record<string, { bold: boolean; align: string }>>({});
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize with mock data or from Liveblocks storage
  useEffect(() => {
    const initializeSheet = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, we would load data from Liveblocks or another storage
        if (mockSheetData[sheetId as keyof typeof mockSheetData]) {
          const sheet = mockSheetData[sheetId as keyof typeof mockSheetData];
          setSheetName(sheet.name);
          setTempSheetName(sheet.name);
          
          // Ensure data has enough rows and columns
          const initialData = sheet.data.slice();
          // Fill with empty rows if needed
          while (initialData.length < sheet.rows) {
            initialData.push(Array(sheet.columns).fill(""));
          }
          
          // Fill each row with empty cells if needed
          for (let i = 0; i < initialData.length; i++) {
            if (!initialData[i]) {
              initialData[i] = Array(sheet.columns).fill("");
            } else {
              while (initialData[i].length < sheet.columns) {
                initialData[i].push("");
              }
            }
          }
          
          setData(initialData);
          setColumns(sheet.columns);
          setRows(sheet.rows);
        } else if (sheetId.startsWith("new-")) {
          // New sheet
          setSheetName("Untitled Sheet");
          setTempSheetName("Untitled Sheet");
          
          // Create a larger initial grid
          const initialData = Array(50).fill(null).map(() => Array(20).fill(""));
          setData(initialData);
          setColumns(20);
          setRows(50);
        }
      } catch (error) {
        console.error("Error loading sheet:", error);
        toast({
          title: "Error",
          description: "Failed to load sheet data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSheet();
  }, [sheetId]);
  
  // Handle cell changes
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    if (!newData[rowIndex]) {
      newData[rowIndex] = Array(columns).fill("");
    }
    newData[rowIndex][colIndex] = value;
    setData(newData);
    
    // In a real app, we would update Liveblocks storage here
  };
  
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
    // In a real app, this would save to a database
    toast({
      title: "Saved!",
      description: "Your sheet has been saved.",
    });
  };
  
  // Handle export as CSV
  const handleExport = () => {
    try {
      const csvContent = data.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${sheetName}.csv`);
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
    const newData = [...data];
    newData.push(Array(columns).fill(""));
    setData(newData);
    setRows(rows + 1);
    
    toast({
      title: "Row added",
      description: "A new row has been added to the sheet.",
    });
  };
  
  // Add a new column
  const handleAddColumn = () => {
    const newData = data.map(row => {
      const newRow = [...row];
      newRow.push("");
      return newRow;
    });
    
    setData(newData);
    setColumns(columns + 1);
    
    toast({
      title: "Column added",
      description: "A new column has been added to the sheet.",
    });
  };
  
  // Start editing the sheet title
  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTempSheetName(sheetName);
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
      setSheetName(tempSheetName);
      setIsEditingTitle(false);
      
      toast({
        title: "Sheet renamed",
        description: `Sheet has been renamed to "${tempSheetName}".`,
      });
    } else {
      // Don't allow empty sheet names
      setTempSheetName(sheetName);
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
          newFormats[cellKey] = { ...currentFormat, align: value };
        }
      }
    }
    
    setCellFormats(newFormats);
    
    // Update active cell format state for toolbar
    const lastCellKey = `${selectedCells.endRow}-${selectedCells.endCol}`;
    const lastCellFormat = newFormats[lastCellKey] || { bold: false, align: 'left' };
    setActiveCellFormat({
      bold: type === 'bold' ? !activeCellFormat.bold : lastCellFormat.bold,
      align: type === 'align' ? value : lastCellFormat.align as 'left' | 'center' | 'right'
    });
  };
  
  // Get cell style based on its format
  const getCellStyle = (rowIndex: number, colIndex: number) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const format = cellFormats[cellKey] || { bold: false, align: 'left' };
    
    return {
      fontWeight: format.bold ? 'bold' : 'normal',
      textAlign: format.align
    };
  };
  
  // Copy selected cells to clipboard
  const handleCopy = () => {
    if (!selectedCells) return;
    
    const minRow = Math.min(selectedCells.startRow, selectedCells.endRow);
    const maxRow = Math.max(selectedCells.startRow, selectedCells.endRow);
    const minCol = Math.min(selectedCells.startCol, selectedCells.endCol);
    const maxCol = Math.max(selectedCells.startCol, selectedCells.endCol);
    
    let copyText = '';
    
    for (let r = minRow; r <= maxRow; r++) {
      const rowData = [];
      for (let c = minCol; c <= maxCol; c++) {
        rowData.push(data[r]?.[c] || '');
      }
      copyText += rowData.join('\t') + '\n';
    }
    
    navigator.clipboard.writeText(copyText).then(() => {
      toast({
        title: "Copied!",
        description: "Selected cells copied to clipboard.",
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    });
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSelectedCells(null);
    } else if (e.ctrlKey && e.key === 'c') {
      handleCopy();
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading sheet...</p>
        </div>
      </div>
    );
  }
  
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
        
        <div className="ml-auto flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm border-2 border-background">
              {user?.firstName ? user.firstName.charAt(0) : user?.username ? user.username.charAt(0) : "U"}
            </div>
            
            {/* Show online users from Liveblocks */}
            {others.map(user => {
              // Safely handle potentially undefined or non-string values
              const firstName = typeof user.info?.firstName === 'string' ? user.info.firstName : '';
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
        <Button size="sm" variant="outline" className="h-8" onClick={handleAddRow}>
          <Plus size={16} className="mr-1" /> Add Row
        </Button>
        <Button size="sm" variant="outline" className="h-8" onClick={handleAddColumn}>
          <Plus size={16} className="mr-1" /> Add Column
        </Button>
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
          <table className="w-full spreadsheet-grid">
            <thead className="sticky top-0 z-10 bg-secondary/50">
              <tr>
                <th className="spreadsheet-header w-10 bg-secondary/50 sticky left-0 z-20">#</th>
                {Array(columns).fill(null).map((_, colIndex) => (
                  <th key={colIndex} className="spreadsheet-header min-w-[100px]">
                    {getColumnLabel(colIndex)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array(rows).fill(null).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="spreadsheet-row-header sticky left-0 z-10 bg-secondary/50">{rowIndex + 1}</td>
                  {Array(columns).fill(null).map((_, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={`min-w-[100px] relative ${isCellSelected(rowIndex, colIndex) ? 'bg-primary/10 border-primary' : ''}`}
                      onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                      onMouseOver={() => handleCellMouseOver(rowIndex, colIndex)}
                      onMouseUp={handleCellMouseUp}
                    >
                      <input
                        type="text"
                        value={data[rowIndex]?.[colIndex] || ""}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className="spreadsheet-cell w-full bg-transparent outline-none"
                        style={getCellStyle(rowIndex, colIndex) as React.CSSProperties}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with RoomProvider
const SpreadsheetEditor = ({ sheetId }: SpreadsheetEditorProps) => {
  // Create a properly typed LiveMap instance with the expected structure
  const initialSheetsMap = new LiveMap<
    string, 
    LiveObject<{
      name: string;
      data: LiveList<LiveList<string>>;
      columns: number;
      rows: number;
    }>
  >();
  
  return (
    <LiveblocksRoomProvider
      id={`sheet-${sheetId}`}
      initialPresence={{
        firstName: "",
        lastName: "",
        cursor: null,
      }}
      initialStorage={{
        sheets: initialSheetsMap
      }}
    >
      <SpreadsheetEditorContent sheetId={sheetId} />
    </LiveblocksRoomProvider>
  );
};

export default SpreadsheetEditor;
