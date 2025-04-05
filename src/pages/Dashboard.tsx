
import { useState } from "react";
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
  Star
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
import { Separator } from "@/components/ui/separator";
import SpreadsheetEditor from "@/components/SpreadsheetEditor";

// Mock data for sheets
const mockSheets = [
  { id: "1", name: "Class 10B Grades", updatedAt: "2023-04-01T10:30:00Z", shared: true, starred: true },
  { id: "2", name: "School Budget Q2", updatedAt: "2023-03-28T14:15:00Z", shared: true, starred: false },
  { id: "3", name: "Student Attendance Log", updatedAt: "2023-03-25T09:45:00Z", shared: false, starred: true },
  { id: "4", name: "Teacher Schedule", updatedAt: "2023-03-20T11:20:00Z", shared: true, starred: false },
  { id: "5", name: "Curriculum Planning", updatedAt: "2023-03-15T13:10:00Z", shared: false, starred: false },
];

const Dashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { id: sheetId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter sheets based on search query
  const filteredSheets = mockSheets.filter(sheet => 
    sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
  
  const createNewSheet = () => {
    // In a real app, this would create a new sheet in the database
    // and redirect to it with the new ID
    navigate(`/sheets/new-${Date.now()}`);
  };
  
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
            <Button onClick={createNewSheet} size="sm">
              <Plus className="mr-1 h-4 w-4" /> New Sheet
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-6">
        {sheetId ? (
          // Show spreadsheet editor when a sheet is selected
          <SpreadsheetEditor sheetId={sheetId} />
        ) : (
          // Show dashboard with sheets list
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Your Sheets</h1>
              <Button variant="outline" size="sm">
                <Grid className="mr-1 h-4 w-4" /> View Options
              </Button>
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
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
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
    </div>
  );
};

export default Dashboard;
