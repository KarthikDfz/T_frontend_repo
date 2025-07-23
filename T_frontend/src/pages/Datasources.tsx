import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Database, Plus, ServerIcon, FileSpreadsheet, Cloud, RefreshCw, Search, ArrowRight, ExternalLink, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { apiService, Datasource, Project } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DataSourceProps {
  title: string;
  description: string;
  icon: React.ElementType;
  fields: { name: string; label: string; type: string; placeholder: string }[];
  connectHandler: (data: Record<string, string>) => void;
}

const DataSourceForm: React.FC<DataSourceProps> = ({ title, description, icon: Icon, fields, connectHandler }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      connectHandler(formData);
      
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${title}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${title}. Please check your credentials.`,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/10 p-2 rounded-md">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {fields.map((field) => (
          <div key={field.name} className="grid gap-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(e, field.name)}
              required
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Switch id="saveCredentials" />
        <Label htmlFor="saveCredentials">Save credentials securely</Label>
      </div>

      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isConnecting}>
          {isConnecting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              Connect
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

interface DatasourceCardProps {
  datasource: Datasource;
}

const DatasourceCard: React.FC<DatasourceCardProps> = ({ datasource }) => {
  // Determine datasource type based on name or type field
  const getDatasourceType = (): string => {
    const name = datasource.name?.toLowerCase() || '';
    const type = datasource.type?.toLowerCase() || '';
    
    if (type.includes('azure') || name.includes('azure')) return 'azure';
    if (type.includes('sql') || name.includes('sql')) return 'sql';
    if (type.includes('excel') || name.includes('excel')) return 'excel';
    return 'database'; // default type
  };

  const datasourceType = getDatasourceType();
  
  return (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        {datasourceType === 'azure' && <Cloud className="h-5 w-5 text-blue-500" />}
        {datasourceType === 'sql' && <Database className="h-5 w-5 text-purple-500" />}
        {datasourceType === 'excel' && <FileSpreadsheet className="h-5 w-5 text-green-500" />}
        {datasourceType === 'database' && <Database className="h-5 w-5 text-amber-500" />}
        <div>
          <h4 className="font-medium">{datasource.name}</h4>
          <p className="text-xs text-muted-foreground">
            {datasource.updated_at ? `Updated: ${new Date(datasource.updated_at).toLocaleDateString()}` : 
             datasource.created_at ? `Created: ${new Date(datasource.created_at).toLocaleDateString()}` : 
             'No date information'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="font-normal text-xs">
          {datasource.id.substring(0, 8)}...
        </Badge>
        <Button variant="ghost" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const DataSourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [datasources, setDatasources] = useState<Datasource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const { toast } = useToast();
  const datasourcesContainerRef = useRef<HTMLDivElement>(null);

  // Get workbook and project context
  const [selectedWorkbook, setSelectedWorkbook] = useState<{id: string, name: string, projectId?: string} | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Get workbook information from URL parameters
    const workbookId = searchParams.get('workbookId');
    const workbookName = searchParams.get('workbookName');
    const projectId = searchParams.get('projectId');
    
    let workbookToUse = null;
    if (workbookId && workbookName) {
      workbookToUse = { 
        id: workbookId, 
        name: workbookName,
        projectId: projectId || undefined
      };
      
      // Store workbook selection for context
      localStorage.setItem('selectedWorkbook', JSON.stringify(workbookToUse));
      setSelectedWorkbook(workbookToUse);
      
      toast({
        title: "Workbook Selected",
        description: `Showing data sources for workbook: ${workbookName}`
      });
    }

    // Get selected project from localStorage as fallback
    const projectData = localStorage.getItem('selectedProject');
    if (projectData && !workbookToUse) {
      setSelectedProject(JSON.parse(projectData));
    }

    const fetchDatasources = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let datasourcesData: Datasource[] = [];
        
        if (workbookToUse) {
          // Fetch datasources for the selected workbook
          console.log(`Fetching datasources for workbook: ${workbookToUse.id}`);
          try {
            // Try to fetch workbook-specific datasources
            const response = await fetch(`http://localhost:8001/tableau/datafactztableau/workbooks/${workbookToUse.id}/datasources`);
            if (response.ok) {
              const data = await response.json();
              datasourcesData = data.datasources || [];
            } else {
              throw new Error('Workbook datasources endpoint not available');
            }
          } catch (error) {
            console.warn('Workbook-specific datasources not available, using project-level datasources');
            // Fallback to project-level datasources if workbook endpoint doesn't exist
            if (workbookToUse.projectId) {
              datasourcesData = await apiService.getDatasources(workbookToUse.projectId);
            } else {
              datasourcesData = await apiService.getDatasources();
            }
          }
        } else if (selectedProject) {
          // Fetch datasources for the selected project
          datasourcesData = await apiService.getDatasources(selectedProject.id);
        } else {
          // Fetch all datasources if no project is selected
          datasourcesData = await apiService.getDatasources();
        }
        
        setDatasources(datasourcesData);
        
        if (workbookToUse) {
          toast({
            title: "Data Sources Loaded",
            description: `Found ${datasourcesData.length} data source(s) for workbook: ${workbookToUse.name}`
          });
        }
      } catch (error) {
        console.error('Error fetching datasources:', error);
        setError('Failed to load datasources. Please check your connection and try again.');
        setDatasources([]);
        
        toast({
          title: "Error Loading Data Sources",
          description: "Could not load data sources. Using sample data for demonstration.",
          variant: "destructive"
        });
        
        // Create some mock datasources for demonstration
        const mockDatasources: Datasource[] = [
          {
            id: 'ds1',
            name: workbookToUse ? `${workbookToUse.name} - Sales Database` : 'Sales Database',
            type: 'sql',
            project_id: workbookToUse?.projectId || selectedProject?.id || 'unknown',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'ds2',
            name: workbookToUse ? `${workbookToUse.name} - Customer Data` : 'Customer Data',
            type: 'excel',
            project_id: workbookToUse?.projectId || selectedProject?.id || 'unknown',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setDatasources(mockDatasources);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatasources();
  }, [navigate, searchParams, selectedProject, toast]);

  // Filter datasources by search query
  const filteredDatasources = datasources.filter(ds => 
    ds.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (ds.description && ds.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      let datasourcesData: Datasource[] = [];
      
      if (selectedWorkbook) {
        // Fetch datasources for the selected workbook
        console.log(`Refreshing datasources for workbook: ${selectedWorkbook.id}`);
        try {
          // Try to fetch workbook-specific datasources
          const response = await fetch(`http://localhost:8001/tableau/datafactztableau/workbooks/${selectedWorkbook.id}/datasources`);
          if (response.ok) {
            const data = await response.json();
            datasourcesData = data.datasources || [];
          } else {
            throw new Error('Workbook datasources endpoint not available');
          }
        } catch (error) {
          console.warn('Workbook-specific datasources not available, using project-level datasources');
          // Fallback to project-level datasources if workbook endpoint doesn't exist
          if (selectedWorkbook.projectId) {
            datasourcesData = await apiService.getDatasources(selectedWorkbook.projectId);
          } else {
            datasourcesData = await apiService.getDatasources();
          }
        }
      } else if (selectedProject) {
        // Fetch datasources for the selected project
        datasourcesData = await apiService.getDatasources(selectedProject.id);
      } else {
        // Fetch all datasources if no project is selected
        datasourcesData = await apiService.getDatasources();
      }
      
      setDatasources(datasourcesData);
      setError(null);
      
      toast({
        title: "Data Sources Refreshed",
        description: `Successfully refreshed ${datasourcesData.length} data source(s)`
      });
    } catch (error) {
      console.error('Error refreshing datasources:', error);
      setError('Failed to refresh datasources. Please try again later.');
      
      toast({
        title: "Error Refreshing Data Sources",
        description: "Could not refresh data sources. Check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (source: string, data: Record<string, string>) => {
    console.log(`Connecting to ${source} with`, data);
  };

  const handleExportToPDF = async () => {
    if (!datasourcesContainerRef.current || filteredDatasources.length === 0) {
      toast({
        title: "Export failed",
        description: "No datasources to export or the content is not ready.",
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
      pdf.text("Tableau Data Sources Export", 40, 40);
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
      pdf.setFontSize(10);
      pdf.text(`Total Data Sources: ${filteredDatasources.length}`, 40, 75);
      pdf.text(`Filters Applied: ${searchQuery !== "" ? `Search: "${searchQuery}"` : "None"}`, 40, 90);
      
      // Capture the datasources container as an image
      const canvas = await html2canvas(datasourcesContainerRef.current, {
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
      pdf.save(`tableau-datasources-${timestamp}.pdf`);
      
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
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/projects">Projects</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/workbooks">Workbooks</Link>
        </Button>
        {selectedWorkbook && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground truncate max-w-xs">
              {selectedWorkbook.name}
            </span>
          </>
        )}
        {selectedProject && !selectedWorkbook && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground truncate max-w-xs">
              {selectedProject.name}
            </span>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-xs">
          Data Sources
        </span>
      </div>
      
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-bold mb-1">
          {selectedWorkbook 
            ? `${selectedWorkbook.name} Data Sources` 
            : selectedProject 
              ? `${selectedProject.name} Data Sources` 
              : 'All Data Sources'
          }
        </h1>
        <p className="text-muted-foreground mb-6">
          {selectedWorkbook 
            ? `Data sources used in the "${selectedWorkbook.name}" workbook`
            : 'Connect and manage your Tableau data sources for migration to Power BI'
          }
        </p>
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Tableau Data Sources
                </CardTitle>
                <CardDescription>
                  Your available data sources from Tableau
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sources..."
                    className="pl-9 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleExportToPDF}
                  disabled={isLoading || exporting || filteredDatasources.length === 0}
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
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-800 px-4 py-3 rounded-md mb-4 border border-red-200">
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-1">Try refreshing or check your API connection.</p>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4 py-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div>
                        <Skeleton className="h-5 w-40 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredDatasources.length > 0 ? (
              <ScrollArea className="h-[250px]" ref={datasourcesContainerRef}>
                {filteredDatasources.map((datasource) => (
                  <DatasourceCard
                    key={datasource.id}
                    datasource={datasource}
                  />
                ))}
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Database className="h-10 w-10 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No data sources matching "${searchQuery}" were found` 
                    : selectedProject 
                      ? `No data sources found in project "${selectedProject.name}"` 
                      : 'No data sources found in your Tableau instance'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Connection
            </CardTitle>
            <CardDescription>
              Configure new data sources for migration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sql">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="sql">SQL</TabsTrigger>
                <TabsTrigger value="excel">Excel</TabsTrigger>
                <TabsTrigger value="azure">Azure</TabsTrigger>
              </TabsList>
              <TabsContent value="sql">
                <DataSourceForm
                  title="SQL Server Connection"
                  description="Connect to your SQL Server database"
                  icon={ServerIcon}
                  fields={[
                    { name: 'server', label: 'Server', type: 'text', placeholder: 'e.g. localhost' },
                    { name: 'database', label: 'Database', type: 'text', placeholder: 'e.g. AdventureWorks' },
                    { name: 'username', label: 'Username', type: 'text', placeholder: 'e.g. sa' },
                    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
                  ]}
                  connectHandler={(data) => handleConnect('SQL', data)}
                />
              </TabsContent>
              <TabsContent value="excel">
                <DataSourceForm
                  title="Excel Connection"
                  description="Connect to your Excel files"
                  icon={FileSpreadsheet}
                  fields={[
                    { name: 'filepath', label: 'File Path', type: 'text', placeholder: 'C:/path/to/file.xlsx' },
                    { name: 'sheet', label: 'Sheet Name (optional)', type: 'text', placeholder: 'Sheet1' },
                  ]}
                  connectHandler={(data) => handleConnect('Excel', data)}
                />
              </TabsContent>
              <TabsContent value="azure">
                <DataSourceForm
                  title="Azure SQL Connection"
                  description="Connect to your Azure SQL database"
                  icon={Cloud}
                  fields={[
                    { name: 'server', label: 'Server', type: 'text', placeholder: 'e.g. myserver.database.windows.net' },
                    { name: 'database', label: 'Database', type: 'text', placeholder: 'e.g. AdventureWorks' },
                    { name: 'username', label: 'Username', type: 'text', placeholder: 'e.g. azureuser' },
                    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
                  ]}
                  connectHandler={(data) => handleConnect('Azure', data)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataSourcesPage;
