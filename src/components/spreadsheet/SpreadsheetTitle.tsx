import React from "react";
import { Edit } from "lucide-react";

interface SpreadsheetTitleProps {
  sheetName: string;
  isEditingTitle: boolean;
  tempSheetName: string;
  titleInputRef: React.RefObject<HTMLInputElement>;
  onTitleChange: (value: string) => void;
  onTitleSave: () => void;
  onTitleClick: () => void;
  onTitleBlur: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent) => void;
}

const SpreadsheetTitle: React.FC<SpreadsheetTitleProps> = ({
  sheetName,
  isEditingTitle,
  tempSheetName,
  titleInputRef,
  onTitleChange,
  onTitleSave,
  onTitleClick,
  onTitleBlur,
  onTitleKeyDown,
}) => {
  return (
    <div className="flex items-center gap-2">
      {isEditingTitle ? (
        <input
          ref={titleInputRef}
          value={tempSheetName}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          onKeyDown={onTitleKeyDown}
          className="text-xl font-semibold border-b focus:outline-none"
        />
      ) : (
        <h1
          className="text-xl font-semibold cursor-pointer hover:bg-muted px-2 py-1 rounded"
          onClick={onTitleClick}
        >
          {sheetName}
          <Edit className="inline-block ml-2 text-muted-foreground" size={16} />
        </h1>
      )}
    </div>
  );
};

export default SpreadsheetTitle;
