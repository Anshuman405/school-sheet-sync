import React from "react";
import { useSpreadsheet } from "@/hooks/useSpreadsheet";
import SpreadsheetToolbar from "./spreadsheet/SpreadsheetToolbar";
import SpreadsheetGrid from "./spreadsheet/SpreadsheetGrid";
import OnlineUsers from "./spreadsheet/OnlineUsers";
import SpreadsheetLayout from "./spreadsheet/SpreadsheetLayout";
import SpreadsheetTitle from "./spreadsheet/SpreadsheetTitle";

const SpreadsheetEditor: React.FC<{ sheetId: string }> = ({ sheetId }) => {
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
    updateCell,
    formulaInput,
    handleFormulaChange,
    handleFormulaSubmit,
  } = useSpreadsheet(sheetId);

  if (isLoading || !sheet) {
    return <div>Loading...</div>;
  }

  return (
    <SpreadsheetLayout>
      <SpreadsheetTitle
        sheetName={sheet.name}
        isEditingTitle={isEditingTitle}
        tempSheetName={tempSheetName}
        titleInputRef={titleInputRef}
        onTitleChange={setTempSheetName}
        onTitleSave={handleTitleBlur}
        onTitleClick={handleTitleClick}
        onTitleBlur={handleTitleBlur}
        onTitleKeyDown={handleTitleKeyDown}
      />
      <OnlineUsers />
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
        onTitleSave={handleTitleBlur}
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
        formulaInput={formulaInput}
        onFormulaChange={handleFormulaChange}
        onFormulaSubmit={handleFormulaSubmit}
      />
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
        onFormulaSubmit={handleFormulaSubmit}
      />
    </SpreadsheetLayout>
  );
};

export default SpreadsheetEditor;
