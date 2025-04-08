import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  File, 
  Grid, 
  Users,
  Clock,
  Star,
  Trash2,
  Edit,
  ListFilter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import SpreadsheetEditor from "@/components/SpreadsheetEditor";
import { 
  useRoom, 
  useStorage, 
  useMutation, 
  LiveblocksProvider,
  defaultInitialStorage, 
  SheetData,
  LiveObject
} from "@/providers/LiveblocksProvider";

interface Sheet {
  id: string;
  name: string;
  updatedAt: string;
  starred?: boolean;
  shared?: boolean;
}

const DashboardContent = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { id: sheetId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sheetToRename, setSheetToRename] = useState<{ id: string, name: string } | null>(null);
  const [newSheetName, setNewSheetName] = useState("");
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);
  
  // Get sheets from Liveblocks storage
  const sheets = useStorage(root => {
    if (!root?.sheets) return undefined;
    return root.sheets;
  });
  
  // Create a new sheet
  const createNewSheet = useMutation(({ storage }) => {
    if (!storage) return null;
  
    const sheets = storage.get("sheets");
    if (!sheets) return null;
  
    const newId = `sheet-${Date.now()}`;
  
    // Create initial rows as a 2D array
    const initialData = Array.from({ length: 100 }, () =>
      Array(50).fill("")
    );
  
    // Create the sheet object with LiveObject
    const sheetObj = new LiveObject<SheetData>({
      name: "Untitled Sheet",
      data: initialData,
      columns: 50,
      rows: 100,
      updatedAt: new Date().toISOString(),
      starred: false,
      shared: false,
    });
  
    // Add the new sheet to the sheets map
    sheets.set(newId, sheetObj);
  
    return newId;
  }, []);
  
  // Rename a sheet
  const renameSheet = useMutation(({ storage }, sheetId: string, newName: string) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    const sheet = sheets.get(sheetId);
    
    if (sheet) {
      sheet.set("name", newName);
      sheet.set("updatedAt", new Date().toISOString());
    }
  }, []);
  
  // Delete a sheet
  const deleteSheet = useMutation(({ storage }, sheetId: string) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    sheets.delete(sheetId);
  }, []);
  
  // Toggle starred status
  const toggleStarred = useMutation(({ storage }, sheetId: string) => {
    if (!storage) return;
    
    const sheets = storage.get("sheets");
    if (!sheets) return;
    
    const sheet = sheets.get(sheetId);
    
    if (sheet) {
      const isStarred = sheet.get("starred") || false;
      sheet.set("starred", !isStarred);
      sheet.set("updatedAt", new Date().toISOString());
    }
  }, []);
  
  // Filter sheets based on search query and convert to array for rendering
  const filteredSheets: Sheet[] = sheets ? 
    Array.from(sheets.entries())
      .map(([id, sheetObj]) => {
        try {
          return {
            id,
            name: sheetObj.get("name"),
            updatedAt: sheetObj.get("updatedAt"),
            starred: sheetObj.get("starred") || false,
            shared: sheetObj.get("shared") || false
          };
        } catch (error) {
          console.error(`Error processing sheet ${id}:`, error);
          return {
            id,
            name: "Error Loading Sheet",
            updatedAt: new Date().toISOString(),
            starred: false,
            shared: false
          };
        }
      })
      .filter(sheet => sheet.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    : [];
  
  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const handleCreateNewSheet = () => {
    try {
      const newId = createNewSheet();
      if (newId) {
        navigate(`/sheets/${newId}`);
        
        toast({
          title: "New sheet created",
          description: "Your new spreadsheet is ready to edit.",
        });
      } else {
        throw new Error("Failed to create new sheet");
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast({
        title: "Error",
        description: "Failed to create a new sheet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteSheet = (id: string) => {
    deleteSheet(id);
    setSheetToDelete(null);
    
    toast({
      title: "Sheet deleted",
      description: "The sheet has been permanently deleted.",
    });
  };
  
  const handleRenameSheet = () => {
    if (!sheetToRename) return;
    
    if (newSheetName.trim() === "") {
      toast({
        title: "Error",
        description: "Sheet name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    renameSheet(sheetToRename.id, newSheetName);
    
    setSheetToRename(null);
    setNewSheetName("");
    
    toast({
      title: "Sheet renamed",
      description: "The sheet has been renamed successfully.",
    });
  };
  
  const handleToggleStarred = (id: string) => {
    toggleStarred(id);
  };
  
  const SheetItemActions = ({ sheet }: { sheet: Sheet }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            setSheetToRename({ id: sheet.id, name: sheet.name });
            setNewSheetName(sheet.name);
          }}
        >
          <Edit className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStarred(sheet.id);
          }}
        >
          <Star className={`h-4 w-4 mr-2 ${sheet.starred ? "text-yellow-400" : ""}`} />
          {sheet.starred ? "Unstar" : "Star"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            setSheetToDelete(sheet.id);
          }}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  
  // Update timestamps when leaving a sheet to return to dashboard
  useEffect(() => {
    return () => {
      if (sheetId && sheets && sheets.has(sheetId)) {
        try {
          const sheet = sheets.get(sheetId);
          if (sheet) {
            sheet.set("updatedAt", new Date().toISOString());
          }
        } catch (error) {
          console.error("Error updating sheet timestamp:", error);
        }
      }
    };
  }, [sheetId, sheets]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded">
                <div className="h-5 w-5 rounded-sm bg-white"></div>
              </div>
              <span className="text-xl font-bold">SheetSync</span>
            </div>
            
            {/* Only show search when not in a specific sheet */}
            {!sheetId && (
              <div className="relative max-w-md w-full lg:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search sheets..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Button onClick={handleCreateNewSheet} size="sm">
              <Plus className="mr-1 h-4 w-4" /> New Sheet
            </Button>
            
            {/* User dropdown from Clerk */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="font-medium">
                  {user?.firstName} {user?.lastName}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    // Sign out handled by Clerk's SignOutButton component
                    navigate("/");
                  }}
                  className="text-destructive"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-6">
        {sheetId ? (
          // Show spreadsheet editor when a sheet is selected
          <SpreadsheetEditor 
            sheetId={sheetId} 
            initialSheetName={filteredSheets.find(s => s.id === sheetId)?.name}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Your Sheets</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <ListFilter className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Grid
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="recent" className="space-y-6">
              <TabsList>
                <TabsTrigger value="recent">
                  <Clock className="mr-1 h-4 w-4" /> Recent
                </TabsTrigger>
                <TabsTrigger value="starred">
                  <Star className="mr-1 h-4 w-4" /> Starred
                </TabsTrigger>
                <TabsTrigger value="shared">
                  <Users className="mr-1 h-4 w-4" /> Shared
                </TabsTrigger>
              </TabsList>
              
              {viewMode === "list" ? (
                <>
                  <TabsContent value="recent" className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[400px]">Name</TableHead>
                          <TableHead>Last Modified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSheets.map((sheet) => (
                          <TableRow 
                            key={sheet.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/sheets/${sheet.id}`)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <File className="mr-2 h-4 w-4 text-muted-foreground" />
                                {sheet.name}
                                {sheet.starred && <Star className="ml-2 h-4 w-4 text-yellow-400" />}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(sheet.updatedAt)}</TableCell>
                            <TableCell className="text-right">
                              <SheetItemActions sheet={sheet} />
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredSheets.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No sheets found. Create a new sheet to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="starred" className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[400px]">Name</TableHead>
                          <TableHead>Last Modified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSheets
                          .filter(sheet => sheet.starred)
                          .map((sheet) => (
                            <TableRow 
                              key={sheet.id}
                              className="cursor-pointer"
                              onClick={() => navigate(`/sheets/${sheet.id}`)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <File className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {sheet.name}
                                  <Star className="ml-2 h-4 w-4 text-yellow-400" />
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(sheet.updatedAt)}</TableCell>
                              <TableCell className="text-right">
                                <SheetItemActions sheet={sheet} />
                              </TableCell>
                            </TableRow>
                          ))}
                        {filteredSheets.filter(sheet => sheet.starred).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No starred sheets. Star a sheet to add it to this list.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="shared" className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[400px]">Name</TableHead>
                          <TableHead>Last Modified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSheets
                          .filter(sheet => sheet.shared)
                          .map((sheet) => (
                            <TableRow 
                              key={sheet.id}
                              className="cursor-pointer"
                              onClick={() => navigate(`/sheets/${sheet.id}`)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <File className="mr-2 h-4 w-4 text-muted-foreground" />
                                  {sheet.name}
                                  {sheet.starred && <Star className="ml-2 h-4 w-4 text-yellow-400" />}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(sheet.updatedAt)}</TableCell>
                              <TableCell className="text-right">
                                <SheetItemActions sheet={sheet} />
                              </TableCell>
                            </TableRow>
                          ))}
                        {filteredSheets.filter(sheet => sheet.shared).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No shared sheets. Share a sheet with others to see it here.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </>
              ) : (
                // Grid view
                <>
                  <TabsContent value="recent" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSheets.map((sheet) => (
                        <Card 
                          key={sheet.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/sheets/${sheet.id}`)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center truncate">
                                <File className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{sheet.name}</span>
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleToggleStarred(sheet.id)}
                                >
                                  <Star className={`h-4 w-4 ${sheet.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                                </Button>
                              </div>
                            </CardTitle>
                            <CardDescription>
                              Last modified: {formatDate(sheet.updatedAt)}
                            </CardDescription>
                          </CardHeader>
                          <CardFooter className="pt-2 flex justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSheetToRename({ id: sheet.id, name: sheet.name });
                                setNewSheetName(sheet.name);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Rename
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSheetToDelete(sheet.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                      {filteredSheets.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                          No sheets found. Create a new sheet to get started.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="starred" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSheets
                        .filter(sheet => sheet.starred)
                        .map((sheet) => (
                          <Card 
                            key={sheet.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => navigate(`/sheets/${sheet.id}`)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center truncate">
                                  <File className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{sheet.name}</span>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleToggleStarred(sheet.id)}
                                  >
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  </Button>
                                </div>
                              </CardTitle>
                              <CardDescription>
                                Last modified: {formatDate(sheet.updatedAt)}
                              </CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-2 flex justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSheetToRename({ id: sheet.id, name: sheet.name });
                                  setNewSheetName(sheet.name);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Rename
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSheetToDelete(sheet.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      {filteredSheets.filter(sheet => sheet.starred).length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                          No starred sheets. Star a sheet to add it to this list.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="shared" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSheets
                        .filter(sheet => sheet.shared)
                        .map((sheet) => (
                          <Card 
                            key={sheet.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => navigate(`/sheets/${sheet.id}`)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center truncate">
                                  <File className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{sheet.name}</span>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleToggleStarred(sheet.id)}
                                  >
                                    <Star className={`h-4 w-4 ${sheet.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                                  </Button>
                                </div>
                              </CardTitle>
                              <CardDescription>
                                Last modified: {formatDate(sheet.updatedAt)}
                              </CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-2 flex justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSheetToRename({ id: sheet.id, name: sheet.name });
                                  setNewSheetName(sheet.name);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Rename
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSheetToDelete(sheet.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      {filteredSheets.filter(sheet => sheet.shared).length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                          No shared sheets. Share a sheet with others to see it here.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        )}
      </main>
      
      <footer className="border-t border-border py-4">
        <div className="container flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SheetSync. All rights reserved.
          </p>
        </div>
      </footer>
      
      {/* Rename sheet dialog */}
      <AlertDialog open={!!sheetToRename} onOpenChange={(open) => !open && setSheetToRename(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Sheet</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for your sheet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input 
            value={newSheetName} 
            onChange={(e) => setNewSheetName(e.target.value)}
            className="mt-2"
            placeholder="Sheet name"
            autoFocus
          />
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setSheetToRename(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRenameSheet}>Rename</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!sheetToDelete} onOpenChange={(open) => !open && setSheetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sheet</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sheet and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSheetToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => sheetToDelete && handleDeleteSheet(sheetToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useUser();
  const userId = user?.id || "anonymous";
  
  return (
    <LiveblocksProvider 
      roomId={`user-${userId}`}
      initialPresence={{
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        cursor: null
      }}
      initialStorage={defaultInitialStorage}
    >
      <DashboardContent />
    </LiveblocksProvider>
  );
};

export default Dashboard;
