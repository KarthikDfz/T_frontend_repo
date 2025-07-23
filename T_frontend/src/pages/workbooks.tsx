import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Workbook as WorkbookType } from '@/services/api';
import { 
  Info, 
  Calendar, 
  User, 
  Database,
  BarChart3,
  FileSpreadsheet,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  Download,
  Calculator
} from 'lucide-react';
import { apiService, Project as ApiProject } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Workbook {
  id: string;
  name: string;
  description: string;
  owner: string;
  lastModified: string;
  size: string;
  dashboardCount: number;
  calculationCount: number;
  projectId: string;
}

interface Project {
  id: string;
  name: string;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  sheets: number;
  calculations: number;
}

interface WorkbookDetailsProps {
  workbook: Workbook | null;
}

// Mock dashboards data
const mockDashboards: { [key: string]: Dashboard[] } = {
  '1': [
    {
      id: 'd1',
      name: 'Sales Overview',
      description: 'High-level sales metrics and KPIs',
      sheets: 3,
      calculations: 5
    },
    {
      id: 'd2',
      name: 'Regional Performance',
      description: 'Sales breakdown by geographic regions',
      sheets: 2,
      calculations: 4
    },
    {
      id: 'd3',
      name: 'Product Analysis',
      description: 'Product-wise sales and profitability',
      sheets: 4,
      calculations: 3
    }
  ],
  '2': [
    {
      id: 'd4',
      name: 'P&L Statement',
      description: 'Profit and loss analysis',
      sheets: 2,
      calculations: 4
    },
    {
      id: 'd5',
      name: 'Cash Flow',
      description: 'Cash flow projections and analysis',
      sheets: 3,
      calculations: 4
    }
  ],
  '3': [
    {
      id: 'd6',
      name: 'Customer Segmentation',
      description: 'Customer groups and behavior patterns',
      sheets: 3,
      calculations: 6
    },
    {
      id: 'd7',
      name: 'Churn Analysis',
      description: 'Customer retention and churn metrics',
      sheets: 2,
      calculations: 4
    },
    {
      id: 'd8',
      name: 'Lifetime Value',
      description: 'Customer lifetime value calculations',
      sheets: 2,
      calculations: 3
    },
    {
      id: 'd9',
      name: 'Acquisition Funnel',
      description: 'Customer acquisition process analysis',
      sheets: 1,
      calculations: 2
    }
  ],
  '4': [
    {
      id: 'd10',
      name: 'Stock Levels',
      description: 'Current inventory status',
      sheets: 2,
      calculations: 3
    },
    {
      id: 'd11',
      name: 'Supply Chain',
      description: 'Supplier performance and logistics',
      sheets: 3,
      calculations: 3
    }
  ]
};

export const WorkbookDetails: React.FC<WorkbookDetailsProps> = ({ workbook }) => {
  if (!workbook) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            Workbook Details
          </CardTitle>
          <CardDescription>
            Select a workbook to view its details and dashboards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No workbook selected</p>
            <p className="text-sm">Choose a workbook from the list to see its details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dashboards = mockDashboards[workbook.id] || [];

  return (
    <Card className="shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Workbook Details
        </CardTitle>
        <CardDescription>
          Overview and contents of the selected workbook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workbook Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {workbook.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {workbook.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Owner:</span>
              <span className="font-medium">{workbook.owner}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Modified:</span>
              <span className="font-medium">{workbook.lastModified}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{workbook.size}</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Dashboards:</span>
              <span className="font-medium">{workbook.dashboardCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {workbook.calculationCount} custom calculations
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Dashboards List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h4 className="font-medium">Dashboards ({dashboards.length})</h4>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-2">
                    <h5 className="font-medium text-foreground">
                      {dashboard.name}
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <Badge variant="outline" className="text-xs">
                        {dashboard.sheets} sheets
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {dashboard.calculations} calculations
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {dashboards.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No dashboards found in this workbook</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const WorkbooksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedWorkbook, setSelectedWorkbook] = useState<Workbook | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [projects, setProjects] = useState<Project[]>([{ id: 'all', name: 'All Projects' }]);
  const [isLoadingWorkbooks, setIsLoadingWorkbooks] = useState<boolean>(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const workbooksContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const apiProjects = await apiService.getProjects();
        
        // Transform API projects to our format and add "All Projects" option
        const formattedProjects: Project[] = [
          { id: 'all', name: 'All Projects' },
          ...apiProjects.map((project: ApiProject) => ({
            id: project.id,
            name: project.name || `Project ${project.id}`
          }))
        ];
        
        setProjects(formattedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        // Keep the "All Projects" option even on error
        setProjects([{ id: 'all', name: 'All Projects' }]);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);
  
  // Get project ID from URL if available
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    if (projectId) {
      setSelectedProject(projectId);
      
      // If we came from the projects page, use the stored project name
      const projectName = localStorage.getItem('selectedProjectName');
      if (projectName) {
        toast({
          title: "Project Selected",
          description: `Showing workbooks for project: ${projectName}`
        });
      }
    }
  }, [searchParams, toast]);

  // Fetch workbooks when selected project changes
  useEffect(() => {
    const fetchWorkbooks = async () => {
      try {
        setIsLoadingWorkbooks(true);
        setError(null);
        
        // If 'all' is selected, fetch all workbooks, otherwise filter by project
        const fetchedWorkbooks = selectedProject === 'all' 
          ? await apiService.getAllWorkbooks() 
          : await apiService.getWorkbooks(selectedProject);
          
        console.log('Fetched workbooks:', fetchedWorkbooks);
        
        // Log the first workbook to see the data structure
        if (fetchedWorkbooks.length > 0) {
          console.log('Sample workbook structure:', fetchedWorkbooks[0]);
        }
          
        // Transform the API response to match our workbook interface
        const formattedWorkbooks: Workbook[] = fetchedWorkbooks.map((wb: WorkbookType, index: number) => {
          // Try multiple fields for the ID
          const workbookId = wb.id || wb.workbook_id || wb.luid || `fallback-${index}`;
          
          if (!wb.id && !wb.workbook_id && !wb.luid) {
            console.warn('Workbook missing ID:', wb);
          }
          
          return {
            id: workbookId,
            name: wb.workbook_name || wb.name || 'Unnamed Workbook',
            description: wb.description || 'No description available',
            owner: wb.owner_id || 'Unknown Owner',
            lastModified: wb.updated_at?.split('T')[0] || 'Unknown date',
            size: wb.size ? `${((wb.size || 0) / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
            dashboardCount: 3, // This would come from a real API count of views
            calculationCount: 5, // This would need to be fetched separately
            projectId: wb.project_id || 'unknown'
          };
        });
        
        setWorkbooks(formattedWorkbooks);
        // Clear selected workbook when changing projects
        setSelectedWorkbook(null);
        
        // If this is the first successful fetch, show a success message
        if (isLoadingWorkbooks && !error) {
          toast({
            title: "Workbooks Loaded",
            description: `Successfully loaded ${formattedWorkbooks.length} workbooks from Tableau.`,
          });
        }
      } catch (error) {
        console.error('Error fetching workbooks:', error);
        setError('Failed to load workbooks. Using mock data instead.');
        
        // Create fallback mock data for demo purposes
        const mockWorkbooks: Workbook[] = [
          {
            id: '1',
            name: 'Sales Performance',
            description: 'Comprehensive analysis of sales performance across regions',
            owner: 'Sarah Johnson',
            lastModified: '2023-10-15',
            size: '4.2 MB',
            dashboardCount: 3,
            calculationCount: 12,
            projectId: selectedProject === 'all' ? 'p1' : selectedProject
          },
          {
            id: '2',
            name: 'Financial Statements',
            description: 'Monthly and quarterly financial reports',
            owner: 'Michael Chen',
            lastModified: '2023-10-10',
            size: '3.5 MB',
            dashboardCount: 2,
            calculationCount: 8,
            projectId: selectedProject === 'all' ? 'p2' : selectedProject
          },
          {
            id: '3',
            name: 'Customer Insights',
            description: 'Customer behavior and segmentation analysis',
            owner: 'Emma Rodriguez',
            lastModified: '2023-10-08',
            size: '5.1 MB',
            dashboardCount: 4,
            calculationCount: 15,
            projectId: selectedProject === 'all' ? 'p3' : selectedProject
          }
        ];
        
        // If a specific project is selected, only show mock workbooks for that project
        const filteredMocks = selectedProject === 'all' 
          ? mockWorkbooks 
          : mockWorkbooks.map(wb => ({ ...wb, projectId: selectedProject }));
          
        setWorkbooks(filteredMocks);
        
        toast({
          title: "API Error",
          description: "Could not load workbooks from server. Using sample data instead.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingWorkbooks(false);
      }
    };

    fetchWorkbooks();
  }, [selectedProject, toast]);

  // Filter workbooks based on search term
  const filteredWorkbooks = workbooks.filter(workbook => {
    return workbook.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           workbook.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    setSelectedWorkbook(null); // Clear selected workbook when changing project
    
    // Update URL
    if (value === 'all') {
      searchParams.delete('projectId');
    } else {
      searchParams.set('projectId', value);
    }
    setSearchParams(searchParams);
  };

  const handleWorkbookSelect = (workbook: Workbook) => {
    setSelectedWorkbook(workbook);
    
    // Store the selected workbook in localStorage for other components to access
    localStorage.setItem('selectedWorkbook', JSON.stringify({
      id: workbook.id,
      name: workbook.name,
      description: workbook.description
    }));
    
    toast({
      title: "Workbook selected",
      description: `You've selected "${workbook.name}"`
    });
  };

  const handleViewDashboards = (workbook: Workbook) => {
    console.log('Navigating to views with workbook:', workbook);
    
    // Validate workbook ID
    if (!workbook.id || workbook.id === 'undefined') {
      toast({
        title: "Invalid Workbook",
        description: "This workbook doesn't have a valid ID. Please try refreshing the workbooks list.",
        variant: "destructive"
      });
      return;
    }
    
    // Store the workbook info in localStorage as backup
    const workbookInfo = {
      id: workbook.id,
      name: workbook.name,
      description: workbook.description,
      projectId: workbook.projectId
    };
    
    localStorage.setItem('selectedWorkbook', JSON.stringify(workbookInfo));
    console.log('Stored workbook in localStorage:', workbookInfo);
    
    // Navigate to the sheets page with workbook information in URL parameters
    const url = `/sheets?workbookId=${encodeURIComponent(workbook.id)}&workbookName=${encodeURIComponent(workbook.name)}&projectId=${encodeURIComponent(workbook.projectId || '')}`;
    console.log('Navigating to Views page:', url);
    window.location.href = url;
  };

  const handleViewCalculations = (workbook: Workbook) => {
    console.log('Navigating to calculations with workbook:', workbook);
    
    // Validate workbook ID
    if (!workbook.id || workbook.id === 'undefined') {
      toast({
        title: "Invalid Workbook",
        description: "This workbook doesn't have a valid ID. Please try refreshing the workbooks list.",
        variant: "destructive"
      });
      return;
    }
    
    // Store the workbook info in localStorage
    const workbookInfo = {
      id: workbook.id,
      name: workbook.name,
      description: workbook.description,
      projectId: workbook.projectId
    };
    
    localStorage.setItem('selectedWorkbook', JSON.stringify(workbookInfo));
    console.log('Stored workbook in localStorage:', workbookInfo);
    
    // Navigate to the custom calculations page with workbook information
    const url = `/customcalculation?workbookId=${encodeURIComponent(workbook.id)}&workbookName=${encodeURIComponent(workbook.name)}&projectId=${encodeURIComponent(workbook.projectId || '')}`;
    console.log('Navigating to Custom Calculations page:', url);
    window.location.href = url;
  };

  const handleViewDataSources = (workbook: Workbook) => {
    // Store the workbook info in localStorage
    localStorage.setItem('selectedWorkbook', JSON.stringify({
      id: workbook.id,
      name: workbook.name,
      description: workbook.description,
      projectId: workbook.projectId
    }));
    
    // Navigate to the data sources page with workbook information
    window.location.href = `/datasources?workbookId=${workbook.id}&workbookName=${encodeURIComponent(workbook.name)}&projectId=${workbook.projectId}`;
  };
  
  const handleRefresh = () => {
    // Re-fetch workbooks for the current selected project
    setWorkbooks([]);
    setSelectedWorkbook(null);
    toast({
      title: "Refreshing data",
      description: "Fetching the latest workbooks..."
    });
    // The effect will trigger and reload the data
  };

  const getProjectName = (projectId: string) => {
    if (projectId === 'all') return 'All Projects';
    const project = projects.find(p => p.id === projectId);
    return project?.name || projectId;
  };

  const handleExportToPDF = async () => {
    if (!workbooksContainerRef.current || filteredWorkbooks.length === 0) {
      toast({
        title: "Export failed",
        description: "No workbooks to export or the content is not ready.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setExporting(true);
      
      toast({
        title: "Preparing PDF",
        description: "Generating your export, please wait...",
      });
      
      // Create a timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const projectName = getProjectName(selectedProject);
      
      // Set up PDF document
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4"
      });
      
      // Add title to PDF
      pdf.setFontSize(18);
      pdf.text("Tableau Workbooks Export", 40, 40);
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
      pdf.setFontSize(12);
      pdf.text(`Project: ${projectName}`, 40, 75);
      pdf.setFontSize(10);
      pdf.text(`Total Workbooks: ${filteredWorkbooks.length}`, 40, 90);
      
      // Capture the workbooks container as an image
      const canvas = await html2canvas(workbooksContainerRef.current, {
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
      pdf.save(`tableau-workbooks-${projectName.replace(/\s+/g, '-')}-${timestamp}.pdf`);
      
      toast({
        title: "Export complete",
        description: "Your PDF has been generated and downloaded successfully.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Button variant="link" className="p-0 h-auto" asChild>
            <Link to="/">Home</Link>
          </Button>
          <ChevronRight className="h-4 w-4" />
          <Button variant="link" className="p-0 h-auto" asChild>
            <Link to="/projects">Projects</Link>
          </Button>
          {selectedProject !== 'all' && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground truncate max-w-xs">
                {getProjectName(selectedProject)}
              </span>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground truncate max-w-xs">
            Workbooks
          </span>
        </div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">
              Tableau Workbooks
            </h1>
            <p className="text-muted-foreground text-lg">
              Browse and select workbooks for migration
            </p>
          </div>
          
          <Button 
            className="gap-2"
            onClick={handleExportToPDF}
            disabled={isLoadingWorkbooks || exporting || filteredWorkbooks.length === 0}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export to PDF
          </Button>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Project Selection and Filters */}
          <div className="lg:col-span-1">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Projects
                </CardTitle>
                <CardDescription>
                  Select a project to view related workbooks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select 
                    value={selectedProject} 
                    onValueChange={handleProjectChange}
                    disabled={isLoadingProjects}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoadingWorkbooks}
                    className="flex-shrink-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingWorkbooks ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search workbooks..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoadingWorkbooks}
                  />
                </div>
                
                <div className="px-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    {filteredWorkbooks.length} workbook(s) found
                  </p>
                  
                  {selectedProject !== 'all' && (
                    <div className="bg-muted/40 rounded-lg p-3 text-sm">
                      <p className="font-medium">
                        {getProjectName(selectedProject)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Showing workbooks from the selected project
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mt-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <p className="text-xs font-medium text-warning-foreground">
                          {error}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area - Split into Two Sections */}
          <div className="lg:col-span-2 space-y-6" ref={workbooksContainerRef}>
            {/* Workbooks List */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Workbooks
                </CardTitle>
                <CardDescription>
                  {selectedProject === 'all' 
                    ? 'All available workbooks' 
                    : `Workbooks in ${getProjectName(selectedProject)}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>

                {isLoadingWorkbooks ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Loading workbooks...
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {filteredWorkbooks.map((workbook) => (
                        <div
                          key={workbook.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm ${
                            selectedWorkbook?.id === workbook.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border'
                          }`}
                          onClick={() => handleWorkbookSelect(workbook)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground">{workbook.name}</h4>
                                {selectedWorkbook?.id === workbook.id && (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {workbook.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {workbook.owner}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {workbook.lastModified}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {workbook.dashboardCount} dashboard(s)
                                </Badge>
                                <Badge variant="outline">
                                  {workbook.calculationCount} calculation(s)
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Add navigation buttons */}
                          {selectedWorkbook?.id === workbook.id && (
                            <div className="mt-4 pt-3 border-t flex flex-wrap gap-2 justify-end">
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDashboards(workbook);
                                }}
                              >
                                <BarChart3 className="h-4 w-4" />
                                View Sheets
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewCalculations(workbook);
                                }}
                              >
                                <Calculator className="h-4 w-4" />
                                Custom Calculations
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDataSources(workbook);
                                }}
                              >
                                <Database className="h-4 w-4" />
                                Data Sources
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}

                      {filteredWorkbooks.length === 0 && !isLoadingWorkbooks && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No workbooks found</p>
                          <p className="text-sm">Try changing the project or search term</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Workbook Details */}
            <WorkbookDetails workbook={selectedWorkbook} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkbooksPage;