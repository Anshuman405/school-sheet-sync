
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  UserRound, 
  Plus, 
  Save, 
  Download, 
  Share2, 
  Settings
} from "lucide-react";

export default function SpreadsheetDemo() {
  const columns = 10;
  const rows = 8;
  
  // Initialize spreadsheet data
  const [data, setData] = useState<string[][]>(
    Array(rows).fill(null).map(() => Array(columns).fill(""))
  );
  
  // Initial row with example data
  useEffect(() => {
    const initialData = [...data];
    initialData[0][0] = "Student";
    initialData[0][1] = "Math";
    initialData[0][2] = "Science";
    initialData[0][3] = "English";
    initialData[0][4] = "Average";
    
    initialData[1][0] = "Emma Davis";
    initialData[1][1] = "92";
    initialData[1][2] = "88";
    initialData[1][3] = "95";
    initialData[1][4] = "91.7";
    
    initialData[2][0] = "Jacob Smith";
    initialData[2][1] = "84";
    initialData[2][2] = "90";
    initialData[2][3] = "82";
    initialData[2][4] = "85.3";
    
    setData(initialData);
  }, []);
  
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };
  
  // Generate column letters (A, B, C, etc.)
  const getColumnLabel = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden max-w-5xl mx-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Class 10B Grades</h3>
          <span className="text-sm bg-accent/50 text-accent-foreground px-2 py-1 rounded">Shared</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm border-2 border-background">
              <UserRound size={14} />
            </div>
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm border-2 border-background">
              ED
            </div>
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm border-2 border-background">
              JS
            </div>
          </div>
          <span className="text-sm text-muted-foreground ml-1">3 editors</span>
        </div>
      </div>
      
      <div className="p-3 border-b bg-muted/30 flex gap-2">
        <Button size="sm" variant="outline" className="h-8">
          <Plus size={16} className="mr-1" /> Add
        </Button>
        <Button size="sm" variant="outline" className="h-8">
          <Save size={16} className="mr-1" /> Save
        </Button>
        <Button size="sm" variant="outline" className="h-8">
          <Download size={16} className="mr-1" /> Export
        </Button>
        <Button size="sm" variant="outline" className="h-8">
          <Share2 size={16} className="mr-1" /> Share
        </Button>
        <div className="ml-auto">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Settings size={16} />
          </Button>
        </div>
      </div>
      
      <div className="overflow-auto max-h-[400px]">
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
                      value={data[rowIndex][colIndex]}
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
}
