import { useEffect, useState } from "react";
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
  ChevronDown
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
    ],
    columns: 10,
    rows: 8,
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
    ],
    columns: 10,
    rows: 8,
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
  const [data, setData] = useState<string[][]>([]);
  const [columns, setColumns] = useState(10);
  const [rows, setRows] = useState(8);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize with mock data or from Liveblocks storage
  useEffect(() => {
    const initializeSheet = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, we would load data from Liveblocks or another storage
        if (mockSheetData[sheetId as keyof typeof mockSheetData]) {
          const sheet = mockSheetData[sheetId as keyof typeof mockSheetData];
          setSheetName(sheet.name);
          setData(sheet.data);
          setColumns(sheet.columns);
          setRows(sheet.rows);
        } else if (sheetId.startsWith("new-")) {
          // New sheet
          setSheetName("Untitled Sheet");
          setData(Array(8).fill(null).map(() => Array(10).fill("")));
          setColumns(10);
          setRows(8);
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
    newData[rowIndex][colIndex] = value;
    setData(newData);
    
    // In a real app, we would update Liveblocks storage here
  };
  
  // Generate column labels (A, B, C, etc.)
  const getColumnLabel = (index: number) => {
    return String.fromCharCode(65 + index);
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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">{sheetName}</h1>
        
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
      
      <div className="p-3 border-b bg-muted/30 flex gap-2 rounded-t-lg border-t border-x">
        <Button size="sm" variant="outline" className="h-8">
          <Plus size={16} className="mr-1" /> Add
        </Button>
        <Button size="sm" variant="outline" className="h-8" onClick={handleSave}>
          <Save size={16} className="mr-1" /> Save
        </Button>
        <Button size="sm" variant="outline" className="h-8" onClick={handleExport}>
          <Download size={16} className="mr-1" /> Export
        </Button>
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
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
        <div className="ml-auto">
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
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Format cells</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="rounded-b-lg border overflow-auto max-h-[calc(100vh-220px)]">
        <table className="w-full spreadsheet-grid">
          <thead>
            <tr>
              <th className="spreadsheet-header w-10 bg-secondary/50">#</th>
              {Array(columns).fill(null).map((_, colIndex) => (
                <th key={colIndex} className="spreadsheet-header">
                  {getColumnLabel(colIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array(rows).fill(null).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="spreadsheet-row-header">{rowIndex + 1}</td>
                {Array(columns).fill(null).map((_, colIndex) => (
                  <td key={colIndex} className="min-w-[100px]">
                    <input
                      type="text"
                      value={data[rowIndex]?.[colIndex] || ""}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="spreadsheet-cell w-full bg-transparent"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Wrap the component with RoomProvider
const SpreadsheetEditor = ({ sheetId }: SpreadsheetEditorProps) => {
  return (
    <LiveblocksRoomProvider
      id={`sheet-${sheetId}`}
      initialPresence={{
        firstName: "",
        lastName: "",
        cursor: null,
      }}
      initialStorage={{
        sheets: new LiveMap()
      }}
    >
      <SpreadsheetEditorContent sheetId={sheetId} />
    </LiveblocksRoomProvider>
  );
};

export default SpreadsheetEditor;
