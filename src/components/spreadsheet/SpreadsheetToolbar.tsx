
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
}) => {
  return (
    <>
      {isEditingTitle ? (
        <div className="flex items-center gap-2">
          <Input
            ref={titleInputRef}
            value={tempSheetName}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={onTitleKeyDown}
            className="w-60 h-8 font-semibold text-xl"
          />
        </div>
      ) : (
        <h1 
          className="text-xl font-semibold cursor-pointer hover:bg-muted px-2 py-1 rounded"
          onClick={onTitleClick}
        >
          <span className="flex items-center gap-1">
            {sheetName}
            <Edit className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
          </span>
        </h1>
      )}
    
      <div className="p-3 border-b bg-muted/30 flex flex-wrap gap-2 rounded-t-lg border-t border-x">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <Plus size={16} className="mr-1" /> Add <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="start">
            <div className="flex flex-col">
              <Button variant="ghost" className="justify-start rounded-none h-9 px-3" onClick={onAddRow}>
                <Plus size={14} className="mr-2" /> Add Row
              </Button>
              <Button variant="ghost" className="justify-start rounded-none h-9 px-3" onClick={onAddColumn}>
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
              <Button variant="ghost" className="justify-start rounded-none h-9 px-3" onClick={onRemoveRow}>
                <MinusSquare size={14} className="mr-2" /> Remove Row
              </Button>
              <Button variant="ghost" className="justify-start rounded-none h-9 px-3" onClick={onRemoveColumn}>
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
          onClick={onFormatBold}
        >
          <Bold size={16} />
        </Button>
        <Button 
          size="sm" 
          variant={activeCellFormat.align === 'left' ? "default" : "outline"} 
          className="h-8 px-2 w-9"
          onClick={() => onFormatAlign('left')}
        >
          <AlignLeft size={16} />
        </Button>
        <Button 
          size="sm" 
          variant={activeCellFormat.align === 'center' ? "default" : "outline"} 
          className="h-8 px-2 w-9"
          onClick={() => onFormatAlign('center')}
        >
          <AlignCenter size={16} />
        </Button>
        <Button 
          size="sm" 
          variant={activeCellFormat.align === 'right' ? "default" : "outline"} 
          className="h-8 px-2 w-9"
          onClick={() => onFormatAlign('right')}
        >
          <AlignRight size={16} />
        </Button>
        
        <Separator orientation="vertical" className="h-8" />
        
        <div className="flex items-center">
          <Calculator size={16} className="mr-1 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Formulas: Start with = (e.g., =A1+B2)</span>
        </div>
        
        <Separator orientation="vertical" className="h-8" />
        
        {selectedCells && (
          <>
            <Button size="sm" variant="outline" className="h-8" onClick={onCopy}>
              <Copy size={16} className="mr-1" /> Copy
            </Button>
            {isCopying && (
              <Button size="sm" variant="outline" className="h-8" onClick={onPaste}>
                <Clipboard size={16} className="mr-1" /> Paste
              </Button>
            )}
          </>
        )}
        
        <div className="ml-auto">
          <Button size="sm" variant="outline" className="h-8 mr-2" onClick={onSave}>
            <Save size={16} className="mr-1" /> Save
          </Button>
          <Button size="sm" variant="outline" className="h-8 mr-2" onClick={onExport}>
            <Download size={16} className="mr-1" /> Export
          </Button>
          <Dialog open={shareDialogOpen} onOpenChange={onShareOpen}>
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
                  onChange={(e) => onShareEmailChange(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => onShareOpen(false)}>Cancel</Button>
                <Button onClick={onShare}>Share</Button>
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
              <DropdownMenuItem onClick={onTitleClick}>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Format cells</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
};

export default SpreadsheetToolbar;
