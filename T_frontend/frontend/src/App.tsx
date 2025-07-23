import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";

// Shared components
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";

// Shared pages
import Login from "./pages/shared/Login";
import NotFound from "./pages/NotFound";
import Home from "./pages/shared/Home";

// Tableau pages
import TableauDashboard from "./pages/tableau/Dashboard";
import TableauProjects from "./pages/tableau/Projects";
import TableauWorkbooks from "./pages/tableau/Workbooks";
import TableauDatasources from "./pages/tableau/Datasources";
import TableauViews from "./pages/tableau/Views";
import TableauCalculations from "./pages/tableau/Calculations";
import TableauMigrations from "./pages/tableau/Migrations";

// MicroStrategy pages
import MstrDashboard from "./pages/mstr/Dashboard";
import MstrProjects from "./pages/mstr/Projects";
import MstrReports from "./pages/mstr/Reports";
import MstrDossiers from "./pages/mstr/Dossiers";
import MstrCubes from "./pages/mstr/Cubes";
import MstrMetrics from "./pages/mstr/Metrics";
import MstrAttributes from "./pages/mstr/Attributes";
import MstrAnalysis from "./pages/mstr/Analysis";

const queryClient = new QueryClient();

// Type definition for children props
interface ChildrenProps {
  children: ReactNode;
}

// Protected route component
const ProtectedRoute = ({ children }: ChildrenProps) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Tableau specific route (redirects to login if not authenticated or if authenticated as MicroStrategy)
const TableauRoute = ({ children }: ChildrenProps) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const projectType = localStorage.getItem('projectType');
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (projectType !== 'tableau') {
    return <Navigate to="/login" state={{ from: location, message: "You need to login to Tableau" }} replace />;
  }
  
  return <>{children}</>;
};

// MicroStrategy specific route
const MstrRoute = ({ children }: ChildrenProps) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const projectType = localStorage.getItem('projectType');
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (projectType !== 'microstrategy') {
    return <Navigate to="/login" state={{ from: location, message: "You need to login to MicroStrategy" }} replace />;
  }
  
  return <>{children}</>;
};

// Layout for authenticated pages with sidebar
const AuthenticatedLayout = ({ children }: ChildrenProps) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <TopHeader />
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-muted/20">
          {children}
        </main>
      </div>
    </div>
  </SidebarProvider>
);

// Public layout without sidebar
const PublicLayout = ({ children }: ChildrenProps) => (
  <div className="min-h-screen">
    {children}
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <PublicLayout>
                <Login />
              </PublicLayout>
            } />
            
            {/* Home route (redirects based on auth state) */}
            <Route path="/" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Home />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            
            {/* Tableau routes */}
            <Route path="/tableau/dashboard" element={
              <TableauRoute>
                <AuthenticatedLayout>
                  <TableauDashboard />
                </AuthenticatedLayout>
              </TableauRoute>
            } />
            <Route path="/tableau/projects" element={
              <TableauRoute>
                <AuthenticatedLayout>
                  <TableauProjects />
                </AuthenticatedLayout>
              </TableauRoute>
            } />
            <Route path="/tableau/workbooks" element={
              <TableauRoute>
                <AuthenticatedLayout>
                  <TableauWorkbooks />
                </AuthenticatedLayout>
              </TableauRoute>
            } />
            <Route path="/tableau/datasources" element={
              <TableauRoute>
                <AuthenticatedLayout>
                  <TableauDatasources />
                </AuthenticatedLayout>
              </TableauRoute>
            } />
            <Route path="/tableau/views" element={
              <TableauRoute>
                <AuthenticatedLayout>
                  <TableauViews />
                </AuthenticatedLayout>
              </TableauRoute>
            } />
            <Route path="/tableau/calculations" element={
              <TableauRoute>
                <AuthenticatedLayout>
                  <TableauCalculations />
                </AuthenticatedLayout>
              </TableauRoute>
            } />
            <Route path="/tableau/migrations" element={
              <TableauRoute>
                <AuthenticatedLayout>
                  <TableauMigrations />
                </AuthenticatedLayout>
              </TableauRoute>
            } />
            
            {/* MicroStrategy routes */}
            <Route path="/mstr/dashboard" element={
              <MstrRoute>
                <AuthenticatedLayout>
                  <MstrDashboard />
                </AuthenticatedLayout>
              </MstrRoute>
            } />
            <Route path="/mstr/projects" element={
              <MstrRoute>
                <AuthenticatedLayout>
                  <MstrProjects />
                </AuthenticatedLayout>
              </MstrRoute>
            } />
            <Route path="/mstr/reports" element={
              <MstrRoute>
                <AuthenticatedLayout>
                  <MstrReports />
                </AuthenticatedLayout>
              </MstrRoute>
            } />
            <Route path="/mstr/dossiers" element={
              <MstrRoute>
                <AuthenticatedLayout>
                  <MstrDossiers />
                </AuthenticatedLayout>
              </MstrRoute>
            } />
            <Route path="/mstr/cubes" element={
              <MstrRoute>
                <AuthenticatedLayout>
                  <MstrCubes />
                </AuthenticatedLayout>
              </MstrRoute>
            } />
            <Route path="/mstr/metrics" element={
              <MstrRoute>
                <AuthenticatedLayout>
                  <MstrMetrics />
                </AuthenticatedLayout>
              </MstrRoute>
            } />
            <Route path="/mstr/attributes" element={
              <MstrRoute>
                <AuthenticatedLayout>
                  <MstrAttributes />
                </AuthenticatedLayout>
              </MstrRoute>
            } />
            <Route path="/mstr/analysis" element={
              <MstrRoute>
                <AuthenticatedLayout>
                  <MstrAnalysis />
                </AuthenticatedLayout>
              </MstrRoute>
            } />

            {/* Catch-all route */}
            <Route path="*" element={
              <PublicLayout>
                <NotFound />
              </PublicLayout>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App; 