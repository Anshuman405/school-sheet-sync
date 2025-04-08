import React from "react";

const SpreadsheetLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      {/* Title Section with Online Users */}
      <div className="flex items-center justify-between p-4 border-b bg-background shadow-sm">
        {children[0]} {/* Title */}
        {children[1]} {/* Online Users */}
      </div>

      {/* Toolbar Section */}
      <div className="p-3 border-b bg-muted/10">
        {children[2]} {/* Toolbar */}
      </div>

      {/* Main Content Section */}
      <div className="flex-grow overflow-hidden bg-muted/5">
        {children[3]} {/* Spreadsheet Grid */}
      </div>
    </div>
  );
};

export default SpreadsheetLayout;
