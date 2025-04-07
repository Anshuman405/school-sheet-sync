
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { 
  SignedIn, 
  SignedOut, 
  RedirectToSignIn, 
  useAuth,
  UserProfile,
  ClerkLoaded
} from "@clerk/clerk-react";
import { LiveblocksProvider, defaultInitialStorage } from "./providers/LiveblocksProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ClerkLoaded>
        <LiveblocksProvider roomId="default-room" initialStorage={defaultInitialStorage}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected routes - Note: No LiveblocksProvider here as it's handled in Dashboard component */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sheets/:id" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Account Settings */}
              <Route 
                path="/account/*" 
                element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
                        <div className="container flex h-16 items-center">
                          <div className="flex items-center gap-2">
                            <div className="bg-primary p-1.5 rounded">
                              <div className="h-5 w-5 rounded-sm bg-white"></div>
                            </div>
                            <span className="text-xl font-bold">SheetSync</span>
                          </div>
                        </div>
                      </header>
                      
                      <main className="flex py-6 justify-center">
                        <UserProfile 
                          appearance={{
                            elements: {
                              navbarMobileMenuButton: "hidden",
                            }
                          }}
                        />
                      </main>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              {/* Fallback route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </LiveblocksProvider>
      </ClerkLoaded>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
