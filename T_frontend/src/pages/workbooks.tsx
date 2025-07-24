import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Workbook as WorkbookType, Project as ApiProject } from '@/services/api';
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
  Calculator,
  X,
  Filter,
  ExternalLink,
  Tag,
  FolderOpen
} from 'lucide-react';
import { apiService } from '@/services/api';
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

interface WorkbookDetails {
  id: string;
  name: string;
  description: string | null;
  content_url: string;
  show_tabs: boolean;
  size: number;
  created_at: string;
  updated_at: string;
  project_id: string;
  project_name: string;
  owner_id: string;
  webpage_url: string;
  tags: string[];
}

interface Project {
  id: string;
  name: string;
}

const WorkbooksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedWorkbook, setSelectedWorkbook] = useState<Workbook | null>(null);
  const [workbookDetails, setWorkbookDetails] = useState<WorkbookDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [projects, setProjects] = useState<Project[]>([{ id: 'all', name: 'All Projects' }]);
  const [isLoadingWorkbooks, setIsLoadingWorkbooks] = useState<boolean>(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [showProjectFilter, setShowProjectFilter] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const workbooksContainerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Click outside handler for filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowProjectFilter(false);
      }
    };

    if (showProjectFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProjectFilter]);
  
  // Fetch projects
  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      console.log('Fetching projects...');
      const apiProjects = await apiService.getProjects();
      console.log('Raw API projects response:', apiProjects);
      
      // Handle the response - it should already be an array of projects
      if (Array.isArray(apiProjects) && apiProjects.length > 0) {
        // Transform API projects to our format and add "All Projects" option
        const formattedProjects: Project[] = [
          { id: 'all', name: 'All Projects' },
          ...apiProjects.map((project: ApiProject) => ({
            id: project.id,
            name: project.name || `Project ${project.id}`
          }))
        ];
        
        console.log('Formatted projects:', formattedProjects);
        setProjects(formattedProjects);
      } else {
        console.log('No projects returned from API or invalid format');
        // Set default projects list with just "All Projects"
        setProjects([{ id: 'all', name: 'All Projects' }]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Keep the "All Projects" option even on error
      setProjects([{ id: 'all', name: 'All Projects' }]);
      toast({
        title: "Error loading projects",
        description: "Could not fetch projects from server. Showing all workbooks.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Fetch workbook details
  const fetchWorkbookDetails = async (workbookId: string) => {
    try {
      setIsLoadingDetails(true);
      console.log('Fetching workbook details for:', workbookId);
      
      const details: any = await apiService.getWorkbookDetails(workbookId);
      console.log('Fetched workbook details:', details);
      
      // Convert API response to WorkbookDetails format
      const workbookDetails: WorkbookDetails = {
        id: details.id || workbookId,
        name: details.name || details.workbook_name || 'Unnamed Workbook',
        description: details.description || null,
        content_url: details.content_url || '',
        show_tabs: details.show_tabs !== undefined ? details.show_tabs : false,
        size: details.size || 0,
        created_at: details.created_at || new Date().toISOString(),
        updated_at: details.updated_at || new Date().toISOString(),
        project_id: details.project_id || '',
        project_name: details.project_name || 'Unknown Project',
        owner_id: details.owner_id || '',
        webpage_url: details.webpage_url || '',
        tags: Array.isArray(details.tags) ? details.tags : []
      };
      
      setWorkbookDetails(workbookDetails);
    } catch (error) {
      console.error('Error fetching workbook details:', error);
      toast({
        title: "Error loading workbook details",
        description: "Could not fetch workbook details from server",
        variant: "destructive"
      });
      setWorkbookDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Initial fetch of projects
  useEffect(() => {
    console.log('Component mounted, fetching projects...');
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
        
        console.log('Fetching workbooks for project:', selectedProject);
        
        // If 'all' is selected, fetch all workbooks, otherwise filter by project
        const fetchedWorkbooks = selectedProject === 'all' 
          ? await apiService.getWorkbooks() 
          : await apiService.getWorkbooks(selectedProject);
          
        console.log('Fetched workbooks:', fetchedWorkbooks);
        
        // Transform the API response to match our workbook interface
        const formattedWorkbooks: Workbook[] = fetchedWorkbooks.map((wb: WorkbookType, index: number) => {
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
        setWorkbookDetails(null);
        
        // If this is the first successful fetch, show a success message
        if (isLoadingWorkbooks && !error && formattedWorkbooks.length > 0) {
          toast({
            title: "Workbooks Loaded",
            description: `Successfully loaded ${formattedWorkbooks.length} workbooks.`,
          });
        }
      } catch (error) {
        console.error('Error fetching workbooks:', error);
        setError('Failed to load workbooks from Tableau server.');
        setWorkbooks([]);
        
        toast({
          title: "API Error",
          description: "Could not load workbooks from server.",
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

  const handleProjectSelect = (projectId: string) => {
    console.log('Selected project:', projectId);
    setSelectedProject(projectId);
    setShowProjectFilter(false);
    
    // Update URL
    if (projectId === 'all') {
      searchParams.delete('projectId');
    } else {
      searchParams.set('projectId', projectId);
    }
    setSearchParams(searchParams);
    
    // Clear workbook selection when changing projects
    setSelectedWorkbook(null);
    setWorkbookDetails(null);
  };

  const handleWorkbookSelect = (workbook: Workbook) => {
    setSelectedWorkbook(workbook);
    
    // Fetch detailed workbook information
    fetchWorkbookDetails(workbook.id);
    
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
  
  const handleRefresh = async () => {
    // Re-fetch projects and workbooks
    setWorkbooks([]);
    setSelectedWorkbook(null);
    setWorkbookDetails(null);
    toast({
      title: "Refreshing data",
      description: "Fetching the latest projects and workbooks..."
    });
    
    // Refresh projects first
    await fetchProjects();
    // The workbooks will be refreshed automatically via the useEffect
  };

  const getProjectName = (projectId: string) => {
    if (projectId === 'all') return 'All Projects';
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
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
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">Workbooks</span>
        </div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tableau Workbooks
            </h1>
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

        {/* Filters and Search Bar */}
        <div className="space-y-4">
          {/* Project Filter Panel */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={filterRef}>
              <Button
                variant="outline"
                className="gap-2 min-w-[250px] justify-between"
                onClick={() => {
                  console.log('Filter button clicked, current state:', showProjectFilter);
                  console.log('Projects available:', projects);
                  setShowProjectFilter(!showProjectFilter);
                }}
                disabled={isLoadingProjects}
              >
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="truncate">
                    {isLoadingProjects ? 'Loading...' : getProjectName(selectedProject)}
                  </span>
                </div>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
              
              {/* Project Filter Dropdown */}
              {showProjectFilter && !isLoadingProjects && (
                <div className="absolute top-full mt-2 left-0 w-full min-w-[300px] bg-background border rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <h4 className="text-sm font-medium mb-2 px-2">Select Project</h4>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-1">
                        {projects.length > 0 ? (
                          projects.map((project) => (
                            <Button
                              key={project.id}
                              variant="ghost"
                              className={`w-full justify-start text-left ${
                                selectedProject === project.id ? 'bg-accent' : ''
                              }`}
                              onClick={() => handleProjectSelect(project.id)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="truncate">{project.name}</span>
                                {selectedProject === project.id && (
                                  <CheckCircle2 className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                                )}
                              </div>
                            </Button>
                          ))
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No projects available
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filter */}
            {selectedProject !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleProjectSelect('all')}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filter
              </Button>
            )}

            {/* Refresh Button */}
            <Button
              size="icon"
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoadingWorkbooks || isLoadingProjects}
            >
              <RefreshCw className={`h-4 w-4 ${(isLoadingWorkbooks || isLoadingProjects) ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search workbooks..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoadingWorkbooks}
            />
          </div>
          
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredWorkbooks.length} workbook(s) found
              {selectedProject !== 'all' && ` in ${getProjectName(selectedProject)}`}
            </p>
            
            {error && (
              <div className="flex items-center gap-2 text-warning text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Content - Equal sized columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workbooks List */}
          <div ref={workbooksContainerRef}>
            <Card className="shadow-md h-full">
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
                  <ScrollArea className="h-[600px] pr-4">
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
                            <div className="space-y-2 flex-1">
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
                                <Badge variant="secondary">
                                  {workbook.size}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Add navigation buttons */}
                          {selectedWorkbook?.id === workbook.id && (
                            <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
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
                        <div className="text-center py-16 text-muted-foreground">
                          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No workbooks found</p>
                          <p className="text-sm mt-2">
                            {searchTerm 
                              ? `No workbooks match "${searchTerm}"`
                              : selectedProject !== 'all'
                                ? `No workbooks in ${getProjectName(selectedProject)}`
                                : 'No workbooks available'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Workbook Details - Same size as workbooks */}
          <div>
            <Card className="shadow-md h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Workbook Details
                </CardTitle>
                <CardDescription>
                  {selectedWorkbook ? 'Selected workbook information' : 'Select a workbook to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Loading workbook details...
                    </p>
                  </div>
                ) : selectedWorkbook && workbookDetails ? (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {workbookDetails.name}
                        </h3>
                      </div>

                      <Separator />

                      {/* Basic Information */}
                      <div>
                        <h4 className="font-medium text-sm mb-3">Basic Information</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Owner ID:</span>
                            <span className="font-medium text-xs">{workbookDetails.owner_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Created:</span>
                            <span className="font-medium">{formatDate(workbookDetails.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Updated:</span>
                            <span className="font-medium">{formatDate(workbookDetails.updated_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Size:</span>
                            <span className="font-medium">{workbookDetails.size} MB</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Project Information */}
                      <div>
                        <h4 className="font-medium text-sm mb-3">Project Information</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Project:</span>
                            <span className="font-medium">{workbookDetails.project_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Project ID:</span>
                            <span className="font-medium text-xs">{workbookDetails.project_id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Technical Details */}
                      {workbookDetails.webpage_url && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-sm mb-3">Technical Details</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex items-start gap-2">
                                <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                  <span className="text-muted-foreground">Tableau URL:</span>
                                  <a 
                                    href={workbookDetails.webpage_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block text-xs text-primary hover:underline break-all mt-1"
                                  >
                                    {workbookDetails.webpage_url}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Tags */}
                      {workbookDetails.tags && workbookDetails.tags.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-sm mb-3">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {workbookDetails.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="gap-1">
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No workbook selected</p>
                    <p className="text-sm mt-2">Choose a workbook from the list to see its details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkbooksPage;
