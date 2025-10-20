import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FormulaBarProps {
  selectedCellValue: string;
  selectedCellDisplay: string;
  selectedCell: { row: number; col: number } | null;
  onFormulaSubmit: (formula: string) => void;
  onCancel: () => void;
}

const FormulaBar: React.FC<FormulaBarProps> = ({
  selectedCellValue,
  selectedCellDisplay,
  selectedCell,
  onFormulaSubmit,
  onCancel,
}) => {
  const [formula, setFormula] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setFormula(selectedCellValue || "");
    }
  }, [selectedCellValue, isEditing]);

  const handleSubmit = () => {
    onFormulaSubmit(formula);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormula(selectedCellValue || "");
    setIsEditing(false);
    onCancel();
  };

  const getCellLabel = () => {
    if (!selectedCell) return "";
    const col = String.fromCharCode(65 + selectedCell.col);
    const row = selectedCell.row + 1;
    return `${col}${row}`;
  };

  const commonFormulas = [
    { label: "SUM", example: "=SUM(A1:A10)", description: "Sum of values" },
    { label: "AVERAGE", example: "=AVERAGE(A1:A10)", description: "Average of values" },
    { label: "COUNT", example: "=COUNT(A1:A10)", description: "Count values" },
    { label: "IF", example: "=IF(A1>10,'Yes','No')", description: "Conditional" },
    { label: "VLOOKUP", example: "=VLOOKUP(A1,A:B,2,FALSE)", description: "Vertical lookup" },
  ];

  return (
    <div className="formula-bar">
      {/* Cell Reference */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs px-2 py-1">
          {getCellLabel() || "Select a cell"}
        </Badge>
      </div>

      {/* Formula Input */}
      <div className="flex-1 flex items-center gap-2">
        <Input
          value={formula}
          onChange={(e) => {
            setFormula(e.target.value);
            setIsEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            } else if (e.key === "Escape") {
              handleCancel();
            }
          }}
          onFocus={() => setIsEditing(true)}
          placeholder="Enter value or formula (e.g., =A1+B2)"
          className="formula-bar-input"
        />
        
        {isEditing && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSubmit}
              className="h-7 w-7 p-0"
              title="Apply (Enter)"
            >
              <Check className="h-4 w-4 text-success" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7 w-7 p-0"
              title="Cancel (Esc)"
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {/* Formula Helper */}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2">
            <Calculator className="h-4 w-4" />
            Functions
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Common Formulas</h4>
            <div className="space-y-2">
              {commonFormulas.map((f) => (
                <button
                  key={f.label}
                  onClick={() => {
                    setFormula(f.example);
                    setIsEditing(true);
                  }}
                  className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="font-mono text-xs text-primary">{f.example}</div>
                  <div className="text-xs text-muted-foreground">{f.description}</div>
                </button>
              ))}
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p>Tips:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Start formulas with =</li>
                <li>Reference cells: A1, B2, etc.</li>
                <li>Use +, -, *, / for calculations</li>
              </ul>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Display Value (for formulas) */}
      {selectedCellValue && selectedCellValue.startsWith('=') && (
        <Badge variant="secondary" className="text-xs">
          Result: {selectedCellDisplay || "Error"}
        </Badge>
      )}
    </div>
  );
};

export default FormulaBar;
