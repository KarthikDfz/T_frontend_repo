import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Workbook as WorkbookType, Project as ApiProject, apiService } from '@/services/api';
import { Info, Calendar, User, Database, BarChart3, FileSpreadsheet, Search, CheckCircle2, AlertCircle, Loader2, ChevronRight, RefreshCw, X, Filter, ExternalLink, Tag, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const SpecsWorkbooksPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([{ id: 'all', name: 'All Projects' }]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectFilter, setShowProjectFilter] = useState<boolean>(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [selectedWorkbook, setSelectedWorkbook] = useState<Workbook | null>(null);
  const [workbookDetails, setWorkbookDetails] = useState<WorkbookDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [isLoadingWorkbooks, setIsLoadingWorkbooks] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const workbooksContainerRef = useRef<HTMLDivElement>(null);

  // Fetch projects (GraphQL or REST)
  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const apiProjects = await apiService.getProjects();
      const formattedProjects: Project[] = [
        { id: 'all', name: 'All Projects' },
        ...apiProjects.map((project: any) => ({
          id: project.id,
          name: project.name || `Project ${project.id}`
        }))
      ];
      setProjects(formattedProjects);
    } catch (error) {
      setProjects([{ id: 'all', name: 'All Projects' }]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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

  // Get selected project from localStorage
  useEffect(() => {
    const projectData = localStorage.getItem('selectedProject');
    if (projectData) {
      setSelectedProject(JSON.parse(projectData));
    }
  }, []);

  // Fetch workbook details
  const fetchWorkbookDetails = async (workbookId: string) => {
    try {
      setIsLoadingDetails(true);
      const details: any = await apiService.getWorkbookDetails(workbookId);
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

  // Fetch workbooks for the selected project
  useEffect(() => {
    const fetchWorkbooks = async () => {
      try {
        setIsLoadingWorkbooks(true);
        setError(null);
        let fetchedWorkbooks: WorkbookType[] = [];
        if (selectedProject) {
          fetchedWorkbooks = await apiService.getWorkbooks(selectedProject.id);
        } else {
          fetchedWorkbooks = await apiService.getWorkbooks();
        }
        const formattedWorkbooks: Workbook[] = fetchedWorkbooks.map((wb: WorkbookType, index: number) => {
          const workbookId = wb.id || wb.workbook_id || wb.luid || `fallback-${index}`;
          return {
            id: workbookId,
            name: wb.workbook_name || wb.name || 'Unnamed Workbook',
            description: wb.description || 'No description available',
            owner: wb.owner_id || 'Unknown Owner',
            lastModified: wb.updated_at?.split('T')[0] || 'Unknown date',
            size: wb.size ? `${((wb.size || 0) / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
            dashboardCount: 3, // Placeholder
            calculationCount: 5, // Placeholder
            projectId: wb.project_id || 'unknown'
          };
        });
        setWorkbooks(formattedWorkbooks);
        setSelectedWorkbook(null);
        setWorkbookDetails(null);
      } catch (error) {
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

  const handleWorkbookSelect = (workbook: Workbook) => {
    setSelectedWorkbook(workbook);
    fetchWorkbookDetails(workbook.id);
    localStorage.setItem('selectedWorkbook', JSON.stringify({
      id: workbook.id,
      name: workbook.name,
      description: workbook.description
    }));
    toast({
      title: "Workbook selected",
      description: `You've selected \"${workbook.name}\"`
    });
  };

  // Only allow navigation within Specs context
  const handleViewDashboards = (workbook: Workbook) => {
    if (!workbook.id || workbook.id === 'undefined') {
      toast({
        title: "Invalid Workbook",
        description: "This workbook doesn't have a valid ID. Please try refreshing the workbooks list.",
        variant: "destructive"
      });
      return;
    }
    const workbookInfo = {
      id: workbook.id,
      name: workbook.name,
      description: workbook.description,
      projectId: workbook.projectId
    };
    localStorage.setItem('selectedWorkbook', JSON.stringify(workbookInfo));
    navigate('/specs/dashboards');
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
            <Link to="/specs">Projects</Link>
          </Button>
          {selectedProject && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link to={`/specs/${selectedProject.id}/resources`}>
                  Project Resources ({selectedProject.name})
                </Link>
              </Button>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">Workbooks</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {selectedProject ? `${selectedProject.name} Workbooks` : 'All Workbooks'}
            </h1>
          </div>
        </div>

        {/* Project Filter and Refresh - above search bar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative" ref={filterRef}>
            <Button
              variant="outline"
              className="gap-2 min-w-[250px] justify-between"
              onClick={() => setShowProjectFilter(!showProjectFilter)}
              disabled={isLoadingProjects}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="truncate">
                  {isLoadingProjects ? 'Loading...' : (selectedProject ? selectedProject.name : 'All Projects')}
                </span>
              </div>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
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
                            className={`w-full justify-start text-left ${selectedProject && selectedProject.id === project.id ? 'bg-accent' : ''}`}
                            onClick={() => {
                              setSelectedProject(project.id === 'all' ? null : project);
                              setShowProjectFilter(false);
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate">{project.name}</span>
                              {selectedProject && selectedProject.id === project.id && (
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
          <Button
            size="icon"
            variant="outline"
            onClick={fetchProjects}
            disabled={isLoadingProjects}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingProjects ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mb-4">
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
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredWorkbooks.length} workbook(s) found
            {selectedProject && ` in ${selectedProject.name}`}
          </p>
          {error && (
            <div className="flex items-center gap-2 text-warning text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
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
                  {selectedProject
                    ? `Workbooks in ${selectedProject.name}`
                    : 'All available workbooks'}
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
                                View Dashboards
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
                              ? `No workbooks match \"${searchTerm}\"`
                              : selectedProject
                                ? `No workbooks in ${selectedProject.name}`
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

export default SpecsWorkbooksPage; 