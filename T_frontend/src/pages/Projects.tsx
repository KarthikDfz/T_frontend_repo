import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Filter, FolderTree, Plus, Search, Loader2, Download } from 'lucide-react';
import { apiService, Project } from '@/services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workbooks, setWorkbooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const projectsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Remove siteName check and directly fetch data
        const projectsData = await apiService.getProjects();
        setProjects(projectsData);
        const workbooksData = await apiService.getAllWorkbooks();
        setWorkbooks(workbooksData);
        
        toast({
          title: "Projects loaded",
          description: `Successfully loaded ${projectsData.length} projects and ${workbooksData.length} workbooks from Tableau site`,
        });
      } catch (error) {
        console.error('Error fetching projects or workbooks:', error);
        setError('Failed to load projects or workbooks. Please check your connection and try again.');
        setProjects([]);
        setWorkbooks([]);
        toast({
          title: "Error loading projects or workbooks",
          description: "Could not retrieve projects or workbooks from the server. Please check authentication.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, toast]);

  const filteredProjects = searchTerm 
    ? projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : projects;

  const selectProject = (project: Project) => {
    // Store project name in localStorage for reference in workbooks page
    localStorage.setItem('selectedProjectName', project.name || 'Unknown Project');
    localStorage.setItem('selectedProjectId', project.id);
    
    // Navigate to the Workbooks page with project ID as URL parameter
    navigate(`/workbooks?projectId=${project.id}`);
    
    toast({
      title: "Project selected",
      description: `You've selected the "${project.name}" project. Loading related workbooks...`
    });
  };
  
  const handleExportToPDF = async () => {
    if (!projectsContainerRef.current || filteredProjects.length === 0) {
      toast({
        title: "Export failed",
        description: "No projects to export or the content is not ready.",
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
      
      // Set up PDF document
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4"
      });
      
      // Add title to PDF
      pdf.setFontSize(18);
      pdf.text("Tableau Projects Export", 40, 40);
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
      pdf.setFontSize(10);
      pdf.text(`Total Projects: ${filteredProjects.length}`, 40, 75);
      
      // Capture the projects container as an image
      const canvas = await html2canvas(projectsContainerRef.current, {
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
      pdf.addImage(imgData, 'PNG', 40, 90, pdfWidth, pdfHeight);
      
      // Save the PDF
      pdf.save(`tableau-projects-${timestamp}.pdf`);
      
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
    <div className="container px-4 mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/">Home</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-xs">
          Projects
        </span>
      </div>
      
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-bold mb-1">Projects</h1>
        <p className="text-muted-foreground mb-6">
          Select a project to start working with Tableau to Power BI migration
        </p>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />

          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button 
              size="sm" 
              className="gap-2"
              onClick={handleExportToPDF}
              disabled={isLoading || exporting || filteredProjects.length === 0}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export to PDF
            </Button>
          </div>
        </div>
        
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md mb-6 border border-red-200">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-1">Try refreshing the page or check your API connection.</p>
        </div>
      )}

      <div ref={projectsContainerRef}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="col-span-1">
                <Card>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const projectWorkbooks = workbooks?.filter(wb => wb.project_id === project.id);
              return (
                <Card key={project.id} className="col-span-1 border-transparent bg-card/60 backdrop-blur-md hover:bg-card/80 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge variant="outline" className="font-normal text-xs">
                        {project.id}
                      </Badge>
                    </div>
                    <CardDescription>
                      {project.parent_id ? (
                        <span>Parent Project ID: {project.parent_id}</span>
                      ) : (
                        <span>Root Project</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {project.description || 'No description available'}
                    </p>
                    {projectWorkbooks.length > 0 ? (
                      <div className="mt-2">
                        <div className="font-semibold mb-1">Workbooks:</div>
                        <ul className="list-disc list-inside text-sm">
                          {projectWorkbooks.map(wb => (
                            <li key={wb.id} className="mb-1">
                              <span className="font-medium">{wb.name}</span>
                              {wb.description && <span className="ml-2 text-muted-foreground">({wb.description})</span>}
                              {wb.webpage_url && (
                                <a href={wb.webpage_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">Open</a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-2">No workbooks in this project.</div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => selectProject(project)}>
                      View Workbooks
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderTree className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm ? 
                `No projects match your search for "${searchTerm}"` : 
                'No projects are available in this Tableau site. Check your connection or try a different site.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;