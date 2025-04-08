import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  ChevronDown,
  Calculator,
  Copy,
  Clipboard,
  Trash2,
  MinusSquare,
  Save,
  Download,
  Share2,
  Settings,
  Edit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { TextAlign } from "../types/spreadsheet";

interface SpreadsheetToolbarProps {
  sheetName: string;
  isEditingTitle: boolean;
  tempSheetName: string;
  titleInputRef: React.RefObject<HTMLInputElement>;
  selectedCells: {startRow: number, startCol: number, endRow: number, endCol: number} | null;
  activeCellFormat: {
    bold: boolean;
    align: TextAlign;
  };
  isCopying: boolean;
  shareDialogOpen: boolean;
  shareEmail: string;
  formulaInput: string;
  onTitleChange: (value: string) => void;
  onTitleSave: () => void;
  onTitleClick: () => void;
  onTitleBlur: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent) => void;
  onFormatBold: () => void;
  onFormatAlign: (align: TextAlign) => void;
  onAddRow: () => void;
  onAddColumn: () => void;
  onRemoveRow: () => void;
  onRemoveColumn: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSave: () => void;
  onExport: () => void;
  onShareOpen: (open: boolean) => void;
  onShareEmailChange: (value: string) => void;
  onShare: () => void;
  onFormulaChange: (value: string) => void;
  onFormulaSubmit: () => void;
}

const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
  sheetName,
  isEditingTitle,
  tempSheetName,
  titleInputRef,
  selectedCells,
  activeCellFormat,
  isCopying,
  shareDialogOpen,
  shareEmail,
  formulaInput,
  onTitleChange,
  onTitleSave,
  onTitleClick,
  onTitleBlur,
  onTitleKeyDown,
  onFormatBold,
  onFormatAlign,
  onAddRow,
  onAddColumn,
  onRemoveRow,
  onRemoveColumn,
  onCopy,
  onPaste,
  onSave,
  onExport,
  onShareOpen,
  onShareEmailChange,
  onShare,
  onFormulaChange,
  onFormulaSubmit,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Formula Input */}
      <div className="flex items-center gap-2">
        <Input
          value={formulaInput}
          onChange={(e) => onFormulaChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onFormulaSubmit()}
          placeholder="Enter formula (e.g., =A1+B2)"
          className="w-64"
        />
        <Button size="sm" variant="outline" onClick={onFormulaSubmit}>
          Apply
        </Button>
      </div>

      {/* Formatting Section */}
      <div className="flex items-center gap-2 border-l pl-4">
        <span className="text-sm font-medium text-muted-foreground">Formatting:</span>
        <Button size="sm" variant={activeCellFormat.bold ? "default" : "outline"} onClick={onFormatBold}>
          <Bold size={16} /> Bold
        </Button>
        <Button size="sm" variant={activeCellFormat.align === "left" ? "default" : "outline"} onClick={() => onFormatAlign("left")}>
          <AlignLeft size={16} /> Left
        </Button>
        <Button size="sm" variant={activeCellFormat.align === "center" ? "default" : "outline"} onClick={() => onFormatAlign("center")}>
          <AlignCenter size={16} /> Center
        </Button>
        <Button size="sm" variant={activeCellFormat.align === "right" ? "default" : "outline"} onClick={() => onFormatAlign("right")}>
          <AlignRight size={16} /> Right
        </Button>
      </div>

      {/* Row/Column Management */}
      <div className="flex items-center gap-2 border-l pl-4">
        <span className="text-sm font-medium text-muted-foreground">Rows/Columns:</span>
        <Button size="sm" variant="outline" onClick={onAddRow}>
          Add Row
        </Button>
        <Button size="sm" variant="outline" onClick={onAddColumn}>
          Add Column
        </Button>
        <Button size="sm" variant="outline" onClick={onRemoveRow}>
          Remove Row
        </Button>
        <Button size="sm" variant="outline" onClick={onRemoveColumn}>
          Remove Column
        </Button>
      </div>

      {/* File Actions */}
      <div className="flex items-center gap-2 border-l pl-4 ml-auto">
        <span className="text-sm font-medium text-muted-foreground">File:</span>
        <Button size="sm" variant="outline" onClick={onSave}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onExport}>
          Export
        </Button>
        <Dialog open={shareDialogOpen} onOpenChange={onShareOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              Share
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share this sheet</DialogTitle>
              <DialogDescription>Enter an email address to invite someone to collaborate.</DialogDescription>
            </DialogHeader>
            <Input
              value={shareEmail}
              onChange={(e) => onShareEmailChange(e.target.value)}
              placeholder="Email address"
            />
            <DialogFooter>
              <Button onClick={onShare}>Share</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SpreadsheetToolbar;
