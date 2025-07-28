import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ReactNode } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import CustomCalculationPage from "./pages/customcalculation";
import ProjectsPage from "./pages/Projects";
import DataSourcesPage from "./pages/Datasources";
import WorkbooksPage from "./pages/workbooks";
import DashboardsPage from "./pages/Dashboards";
import ViewsPage from "./pages/Views";
import MigrationHistoryPage from "./pages/Migrationhistory";
import SpecsPage from "./pages/Specs";
import SpecsProjectResources from "./pages/SpecsProjectResources";
import SpecsWorkbooksPage from "./pages/SpecsWorkbooks";
import SpecsDashboardsPage from "./pages/SpecsDashboards";
import SpecsViewsPage from "./pages/SpecsViews";
import SpecsCustomCalculationPage from "./pages/SpecsCustomCalculation";
import SpecsDatasourcesPage from "./pages/SpecsDatasources";

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
            
            {/* Protected routes with sidebar */}
            <Route path="/" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Index />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <ProjectsPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/customcalculation" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <CustomCalculationPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/datasources" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <DataSourcesPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/workbooks" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <WorkbooksPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboards" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <DashboardsPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/sheets" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <ViewsPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            {/* <Route path="/history" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <MigrationHistoryPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } /> */}
            <Route path="/specs" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <SpecsPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/specs/:projectId/resources" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <SpecsProjectResources />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/specs/workbooks" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <SpecsWorkbooksPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/specs/dashboards" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <SpecsDashboardsPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/specs/sheets" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <SpecsViewsPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/specs/customcalculation" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <SpecsCustomCalculationPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            <Route path="/specs/datasources" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <SpecsDatasourcesPage />
                </AuthenticatedLayout>
              </ProtectedRoute>
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
