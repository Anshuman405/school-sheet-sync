
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { 
  LiveblocksRoomProvider, 
  defaultInitialStorage 
} from "@/providers/LiveblocksProvider";
import SpreadsheetToolbar from "./spreadsheet/SpreadsheetToolbar";
import SpreadsheetGrid from "./spreadsheet/SpreadsheetGrid";
import OnlineUsers from "./spreadsheet/OnlineUsers";
import { useSpreadsheet } from "@/hooks/useSpreadsheet";

interface SpreadsheetEditorProps {
  sheetId: string;
  initialSheetName?: string;
}

const SpreadsheetEditorContent = ({ sheetId, initialSheetName }: SpreadsheetEditorProps) => {
  const {
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
    updateCell,
    handleAddRow,
    handleAddColumn,
    handleRemoveRow,
    handleRemoveColumn,
    handleTitleClick,
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
    goBack
  } = useSpreadsheet(sheetId, initialSheetName);
  
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
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <SpreadsheetToolbar
          sheetName={sheet.name}
          isEditingTitle={isEditingTitle}
          tempSheetName={tempSheetName}
          titleInputRef={titleInputRef}
          selectedCells={selectedCells}
          activeCellFormat={activeCellFormat}
          isCopying={isCopying}
          shareDialogOpen={shareDialogOpen}
          shareEmail={shareEmail}
          onTitleChange={setTempSheetName}
          onTitleSave={handleTitleClick}
          onTitleClick={handleTitleClick}
          onTitleBlur={handleTitleBlur}
          onTitleKeyDown={handleTitleKeyDown}
          onFormatBold={handleFormatBold}
          onFormatAlign={handleFormatAlign}
          onAddRow={handleAddRow}
          onAddColumn={handleAddColumn}
          onRemoveRow={handleRemoveRow}
          onRemoveColumn={handleRemoveColumn}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onSave={handleSave}
          onExport={handleExport}
          onShareOpen={setShareDialogOpen}
          onShareEmailChange={setShareEmail}
          onShare={handleShare}
        />
        
        <div className="ml-auto">
          <OnlineUsers />
        </div>
      </div>
      
      <SpreadsheetGrid
        spreadsheetTableRef={spreadsheetTableRef}
        sheetColumns={sheet.columns}
        sheetRows={sheet.rows}
        sheetData={sheet.data}
        displayedCellValues={displayedCellValues}
        cellFormats={cellFormats}
        selectedCells={selectedCells}
        onCellMouseDown={handleCellMouseDown}
        onCellMouseOver={handleCellMouseOver}
        onCellMouseUp={handleCellMouseUp}
        updateCell={updateCell}
      />
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
