import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronRight, BarChart3, Filter, Search, RefreshCw, Plus, MoreHorizontal, FolderTree, Clock, Eye, Maximize, Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { apiService } from '../services/api';

interface Dashboard {
  id: string;
  name: string;
  workbook: string;
  owner: string;
  createdAt: string;
  views?: number;
  lastViewed?: string;
  status?: 'active' | 'draft' | 'archived';
  sheets?: number;
  // Added embedded URL for Tableau visualization
  embedUrl?: string;
  content_url?: string;
  workbook_id?: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

interface WorkbookInfo {
  id: string;
  name: string;
  description?: string;
}

// Sample mock dashboard data with embed URLs - will be used as fallback
const mockDashboards: Dashboard[] = [
  {
    id: '1',
    name: 'Executive Summary',
    workbook: 'Sales Overview',
    owner: 'John Doe',
    createdAt: '2024-10-05',
    views: 124,
    lastViewed: '1 day ago',
    status: 'active',
    sheets: 5,
    embedUrl: 'https://public.tableau.com/views/SuperstoreSales_16973128123580/ExecutiveSummary'
  },
  {
    id: '2',
    name: 'Revenue Trends',
    workbook: 'Finance Tracker',
    owner: 'Jane Smith',
    createdAt: '2024-11-22',
    views: 87,
    lastViewed: '3 days ago',
    status: 'active',
    sheets: 3,
    embedUrl: 'https://public.tableau.com/views/SuperstoreSales_16973128123580/ProfitAnalysis'
  },
  {
    id: '3',
    name: 'Customer Engagement',
    workbook: 'Customer Behavior',
    owner: 'Karthik R',
    createdAt: '2025-01-10',
    views: 45,
    lastViewed: '1 week ago',
    status: 'draft',
    sheets: 7,
    embedUrl: 'https://public.tableau.com/views/SuperstoreSales_16973128123580/CustomerAnalysis'
  },
  {
    id: '4',
    name: 'Market Analysis',
    workbook: 'Regional Performance',
    owner: 'John Doe',
    createdAt: '2024-09-18',
    views: 220,
    lastViewed: '2 days ago',
    status: 'active',
    sheets: 4,
    embedUrl: 'https://public.tableau.com/views/SuperstoreSales_16973128123580/RegionalInsights'
  },
  {
    id: '5',
    name: 'Campaign Dashboard',
    workbook: 'Marketing Campaigns',
    owner: 'Sarah Johnson',
    createdAt: '2024-10-15',
    views: 32,
    lastViewed: '2 weeks ago',
    status: 'archived',
    sheets: 6,
    embedUrl: 'https://public.tableau.com/views/SuperstoreSales_16973128123580/Overview'
  }
];

// Tableau Embed Component
const TableauEmbed: React.FC<{ dashboard: Dashboard }> = ({ dashboard }) => {
  const vizRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Clean up any previous viz
    if (vizRef.current) {
      vizRef.current.innerHTML = '';
    }

    setIsLoading(true);
    setError(null);

    // First try to use the content_url from the API, fallback to embedUrl
    let vizUrl = '';
    
    if (dashboard.content_url) {
      // This is from the actual API
      vizUrl = `https://10ax.online.tableau.com/t/datafactztableau/views/${dashboard.content_url}`;
    } else if (dashboard.embedUrl) {
      // This is from mock data
      vizUrl = dashboard.embedUrl;
    } else {
      setError("No embed URL provided for this dashboard");
      setIsLoading(false);
      toast({
        title: "Dashboard Error",
        description: "No embed URL available for this dashboard.",
        variant: "destructive"
      });
      return;
    }

    // Format the URL correctly for the Tableau API
    if (!vizUrl.includes('?:embed=y')) {
      vizUrl = `${vizUrl}?:embed=y&:showVizHome=no&:toolbar=yes`;
    }

    console.log("Attempting to load tableau viz from URL:", vizUrl);

    // Load the Tableau API script
    const loadTableauAPI = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.tableau) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://public.tableau.com/javascripts/api/tableau-2.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(new Error("Failed to load Tableau API"));
        document.body.appendChild(script);
      });
    };

    // Initialize the visualization
    const initializeViz = () => {
      if (!vizRef.current || !window.tableau) {
        setError("Failed to initialize visualization");
        setIsLoading(false);
        return;
      }

      try {
        const options = {
          hideTabs: false,
          hideToolbar: false,
          width: '100%',
          height: '600px',
          onFirstInteractive: function() {
            setIsLoading(false);
            toast({
              title: "Dashboard Loaded",
              description: `${dashboard.name} dashboard has been loaded successfully.`,
            });
          }
        };

        // Create a new viz object
        new window.tableau.Viz(vizRef.current, vizUrl, options);
      } catch (err) {
        console.error("Error initializing Tableau viz:", err);
        setError(`Failed to initialize the dashboard: ${err}`);
        setIsLoading(false);
        toast({
          title: "Dashboard Error",
          description: "Failed to load Tableau dashboard. Check console for details.",
          variant: "destructive"
        });
      }
    };

    // Use a timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      loadTableauAPI()
        .then(initializeViz)
        .catch((err) => {
          console.error("Error loading Tableau API:", err);
          setError(`Failed to load Tableau API: ${err}`);
          setIsLoading(false);
          toast({
            title: "API Loading Error",
            description: "Failed to load Tableau visualization API.",
            variant: "destructive"
          });
        });
    }, 500);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      // Dispose any active viz when component unmounts
      if (window.tableau && window.tableau.VizManager) {
        const vizs = window.tableau.VizManager.getVizs();
        vizs.forEach(viz => viz.dispose());
      }
    };
  }, [dashboard, toast]);

  if (error) {
    return (
      <Card className="border border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Dashboard</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboards">Back to All Dashboards</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full min-h-[600px] overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center justify-between">
          <span>{dashboard.name}</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Workbook: {dashboard.workbook}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading visualization...</p>
            </div>
          </div>
        )}
        <div 
          ref={vizRef} 
          className="w-full h-[600px]"
          data-testid="tableau-visualization"
        />
      </CardContent>
    </Card>
  );
};

// Dashboard Card Component
const DashboardCard: React.FC<{ 
  dashboard: Dashboard; 
  onClick: () => void;
  isSelected: boolean;
}> = ({ dashboard, onClick, isSelected }) => {
  // Format the date
  const formattedDate = new Date(dashboard.createdAt).toLocaleDateString();
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:border-primary/50 ${
        isSelected ? 'border-2 border-primary ring-2 ring-primary/20' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="truncate max-w-[200px]">{dashboard.name}</span>
          </CardTitle>
          {dashboard.status && (
            <Badge variant={
              dashboard.status === 'active' ? 'default' : 
              dashboard.status === 'draft' ? 'secondary' : 
              'outline'
            }>
              {dashboard.status}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          {dashboard.workbook}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 pt-0">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <FolderTree className="h-3 w-3" />
            <span>Workbook: {dashboard.workbook}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Created: {formattedDate}</span>
          </div>
          {dashboard.views && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>Views: {dashboard.views}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex justify-between items-center w-full text-xs">
          <span className="text-muted-foreground">{dashboard.owner}</span>
          {dashboard.lastViewed && (
            <span className="text-muted-foreground">Last viewed: {dashboard.lastViewed}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

// Main Dashboards Page Component
const DashboardsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);
  const [selectedWorkbook, setSelectedWorkbook] = useState<WorkbookInfo | null>(null);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [exporting, setExporting] = useState(false);
  const dashboardsContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setApiError(null);

      // Get selected project from localStorage
      const projectData = localStorage.getItem('selectedProject');
      if (projectData) {
        try {
          const project = JSON.parse(projectData);
          setSelectedProject(project);
        } catch (e) {
          console.error("Error parsing project data:", e);
        }
      }

      // Check URL for workbook info
      let workbookId = searchParams.get('workbookId');
      let workbookName = searchParams.get('workbookName');

      // If workbookId is 'undefined' or null, check localStorage
      if (!workbookId || workbookId === 'undefined') {
        const workbookData = localStorage.getItem('selectedWorkbook');
        if (workbookData) {
          try {
            const workbook = JSON.parse(workbookData);
            workbookId = workbook.id;
            workbookName = workbook.name;
          } catch (e) {
            console.error("Error parsing workbook data from localStorage:", e);
          }
        }
      }

      if (workbookId && workbookId !== 'undefined' && workbookName) {
        setSelectedWorkbook({
          id: workbookId,
          name: workbookName
        });

        // Fetch dashboards (views) for this workbook from API
        await fetchDashboards(workbookId);
      } else {
        setApiError('No valid workbook selected. Please choose a workbook first.');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [searchParams, location]);

  const fetchDashboards = async (workbookId: string) => {
    if (!workbookId || workbookId === 'undefined') {
      setApiError('Invalid workbook ID. Please select a workbook again.');
      setIsLoading(false);
      return;
    }

    try {
      // Get the current site name for authentication
      const siteName = localStorage.getItem('tableau_site_name');
      if (!siteName) {
        setApiError('No Tableau site is selected. Please authenticate first.');
        setIsLoading(false);
        return;
      }

      // Get views from the workbook (views include dashboards in Tableau)
      const views = await apiService.getWorkbookViews(workbookId);

      if (views && views.length > 0) {
        // Transform the views into our dashboard format
        const transformedDashboards: Dashboard[] = views.map(view => ({
          id: view.id,
          name: view.name,
          workbook: selectedWorkbook?.name || 'Unknown Workbook',
          workbook_id: workbookId,
          owner: view.owner_id || 'Tableau User',
          createdAt: view.created_at?.split('T')[0] || 'Unknown date',
          views: Math.floor(Math.random() * 100) + 1, // Not provided by API, using mock
          lastViewed: `${Math.floor(Math.random() * 14) + 1} days ago`, // Not provided by API, using mock
          status: 'active' as 'active' | 'draft' | 'archived',
          sheets: 1, // Each view is one sheet
          content_url: view.content_url,
          embedUrl: undefined // Will use content_url for embedding
        }));

        setDashboards(transformedDashboards);
        setSelectedDashboard(null);

        toast({
          title: "Dashboards Loaded",
          description: `Successfully loaded ${transformedDashboards.length} dashboards from workbook.`,
        });
      } else {
        setDashboards([]);
        setApiError('No dashboards found in this workbook.');

        toast({
          title: "No Dashboards Found",
          description: "The selected workbook does not contain any dashboards.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      setApiError('Failed to load dashboards from Tableau API.');

      setDashboards([]);

      toast({
        title: "API Error",
        description: "Could not load dashboards from Tableau. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // First filter by selected workbook if available, then by search query
  const filteredDashboards = dashboards.filter(db => 
    db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    db.workbook.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (db.owner && db.owner.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDashboardSelect = (dashboard: Dashboard) => {
    console.log("Selected dashboard:", dashboard);
    setSelectedDashboard(dashboard);
    
    // Store complete dashboard information in localStorage
    const dashboardInfo = {
      id: dashboard.id,
      name: dashboard.name,
      workbook: dashboard.workbook,
      workbook_id: dashboard.workbook_id
    };
    
    console.log("Storing dashboard info:", dashboardInfo);
    localStorage.setItem('selectedDashboard', JSON.stringify(dashboardInfo));
    
    toast({
      title: "Dashboard Selected",
      description: `Displaying ${dashboard.name} from ${dashboard.workbook}`,
    });
  };

  const handleViewCalculations = () => {
    if (selectedDashboard) {
      console.log("Navigating to custom calculations for:", selectedDashboard);
      
      // Make sure we pass all necessary information
      const params = new URLSearchParams();
      params.set('dashboardId', selectedDashboard.id);
      params.set('dashboardName', selectedDashboard.name);
      
      if (selectedDashboard.workbook) {
        params.set('workbookName', selectedDashboard.workbook);
      }
      
      if (selectedDashboard.workbook_id) {
        params.set('workbookId', selectedDashboard.workbook_id);
      }
      
      const url = `/customcalculation?${params.toString()}`;
      console.log("Navigation URL:", url);
      
      navigate(url);
    } else {
      toast({
        title: "No Dashboard Selected",
        description: "Please select a dashboard first to view its calculations.",
        variant: "destructive"
      });
    }
  };
  
  const handleExportToPDF = async () => {
    if (!dashboardsContainerRef.current || filteredDashboards.length === 0) {
      toast({
        title: "Export Failed",
        description: "No dashboards to export or the content is not ready.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setExporting(true);
      
      toast({
        title: "Preparing PDF",
        description: "Generating your dashboards report...",
      });
      
      // Create a timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const workbookName = selectedWorkbook?.name || "All Workbooks";
      
      // Set up PDF document
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4"
      });
      
      // Add title to PDF
      pdf.setFontSize(18);
      pdf.text("Tableau Dashboards Report", 40, 40);
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
      pdf.text(`Workbook: ${workbookName}`, 40, 75);
      pdf.setFontSize(10);
      pdf.text(`Total Dashboards: ${filteredDashboards.length}`, 40, 90);
      
      // Capture the dashboards container
      const canvas = await html2canvas(dashboardsContainerRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit in PDF
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 80; // margins
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 40, 105, pdfWidth, pdfHeight);
      
      // Save the PDF
      pdf.save(`tableau-dashboards-${workbookName.replace(/\s+/g, '-')}-${timestamp}.pdf`);
      
      toast({
        title: "Export Complete",
        description: "Your PDF has been generated and downloaded successfully.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container px-4 mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/">Home</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/projects">Projects</Link>
        </Button>
        {selectedProject && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground truncate max-w-xs">
              {selectedProject.name}
            </span>
          </>
        )}
        {selectedWorkbook && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link to="/workbooks">Workbooks</Link>
            </Button>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground truncate max-w-xs">
              {selectedWorkbook.name}
            </span>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-xs">
          Dashboards
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left column - Dashboard list */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dashboards</CardTitle>
              <Badge variant="outline" className="ml-2">
                {filteredDashboards.length}
              </Badge>
            </div>
            <CardDescription>
              {selectedWorkbook ? 
                `Dashboards in ${selectedWorkbook.name}` : 
                'All available dashboards'
              }
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search dashboards..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading dashboards...</p>
              </div>
            ) : filteredDashboards.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8">
                <p className="text-sm text-muted-foreground mb-2">No dashboards found</p>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="p-4 grid grid-cols-1 gap-4" ref={dashboardsContainerRef}>
                  {filteredDashboards.map(dashboard => (
                    <DashboardCard 
                      key={dashboard.id}
                      dashboard={dashboard}
                      onClick={() => handleDashboardSelect(dashboard)}
                      isSelected={selectedDashboard?.id === dashboard.id}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => fetchDashboards(selectedWorkbook?.id || '')}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}/>
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleExportToPDF}
              disabled={exporting || filteredDashboards.length === 0}
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Export List
            </Button>
          </CardFooter>
        </Card>

        {/* Right column - Selected dashboard visualization */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
          {selectedDashboard ? (
            <>
              <TableauEmbed dashboard={selectedDashboard} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleViewCalculations}>
                  View Custom Calculations
                </Button>
              </div>
            </>
          ) : (
            <Card className="w-full h-full flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-xl font-medium">No Dashboard Selected</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select a dashboard from the list to view its visualization and details.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardsPage;

// Type definitions for Tableau API
declare global {
  interface Window {
    tableau: {
      Viz: new (
        container: HTMLElement, 
        url: string, 
        options: {
          hideTabs?: boolean;
          hideToolbar?: boolean;
          width?: string;
          height?: string;
          onFirstInteractive?: () => void;
        }
      ) => any;
      VizManager: {
        getVizs: () => {dispose: () => void}[];
      };
    };
  }
}