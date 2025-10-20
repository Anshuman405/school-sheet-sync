import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  Save,
  Download,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface DocumentEditorProps {
  docId: string;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ docId }) => {
  const [docTitle, setDocTitle] = useState("Untitled Document");
  const [content, setContent] = useState("");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  const handleFormat = (command: string) => {
    execCommand(command);
    
    // Update state for active styles
    setTimeout(() => {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
    }, 10);
  };

  const handleHeading = (level: number) => {
    execCommand('formatBlock', `<h${level}>`);
  };

  const handleAlign = (alignment: "left" | "center" | "right") => {
    const commands = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
    };
    execCommand(commands[alignment]);
    setTextAlign(alignment);
  };

  const handleSave = () => {
    const editorContent = document.getElementById('doc-editor-content')?.innerHTML || '';
    // In a real app, save to Liveblocks or backend
    toast({
      title: "Document saved",
      description: "Your document has been saved successfully.",
    });
  };

  const handleExport = () => {
    const editorContent = document.getElementById('doc-editor-content')?.innerHTML || '';
    const blob = new Blob([editorContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle}.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Document exported",
      description: "Your document has been exported as HTML.",
    });
  };

  return (
    <div className="doc-editor">
      {/* Toolbar */}
      <div className="doc-editor-toolbar">
        <div className="container py-3">
          {/* Document Title */}
          <div className="mb-3">
            <Input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="text-xl font-semibold border-none focus-visible:ring-0 px-0"
              placeholder="Untitled Document"
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => execCommand('undo')}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => execCommand('redo')}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Text Styles */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={isBold ? "default" : "ghost"}
                onClick={() => handleFormat('bold')}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={isItalic ? "default" : "ghost"}
                onClick={() => handleFormat('italic')}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={isUnderline ? "default" : "ghost"}
                onClick={() => handleFormat('underline')}
                title="Underline"
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Headings */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleHeading(1)}
                title="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleHeading(2)}
                title="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleHeading(3)}
                title="Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Alignment */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={textAlign === "left" ? "default" : "ghost"}
                onClick={() => handleAlign("left")}
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={textAlign === "center" ? "default" : "ghost"}
                onClick={() => handleAlign("center")}
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={textAlign === "right" ? "default" : "ghost"}
                onClick={() => handleAlign("right")}
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Lists */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => execCommand('insertUnorderedList')}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => execCommand('insertOrderedList')}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Other Formats */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => execCommand('formatBlock', '<blockquote>')}
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => execCommand('formatBlock', '<pre>')}
                title="Code Block"
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="container py-8">
        <div className="doc-editor-content">
          <div
            id="doc-editor-content"
            className="doc-editor-page"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
            style={{ minHeight: '11in' }}
          >
            <p>Start typing your document here...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
