import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Database, ServerIcon, FileSpreadsheet, Cloud, RefreshCw, Search, ExternalLink, Download, Loader2, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Connection {
  connection_id: string;
  datasource_id: string;
  datasource_name: string;
  connection_type: string;
  username: string;
  server_address: string;
  database_name: string | null;
  connection_credentials: string;
}

interface WorkbookDatasource {
  workbook_name: string;
  workbook_id: string;
  project_name: string;
  created_at: string;
  updated_at: string;
  connections: Connection[];
}

const ConnectionCard: React.FC<{ connection: Connection }> = ({ connection }) => {
  // Determine connection type icon and color
  const getConnectionIcon = () => {
    const type = connection.connection_type?.toLowerCase() || '';
    
    if (type.includes('sql')) return <Database className="h-5 w-5 text-purple-500" />;
    if (type.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (type.includes('cloud') || type.includes('online')) return <Cloud className="h-5 w-5 text-blue-500" />;
    return <ServerIcon className="h-5 w-5 text-amber-500" />;
  };
  
  return (
    <div className="flex items-start gap-3 py-4 border-b last:border-b-0">
      {getConnectionIcon()}
      <div className="flex-1">
        <ul className="space-y-2 text-sm">
          <li>
            <span className="font-semibold">Datasource Name:</span>{' '}
            <code className="bg-muted px-2 py-0.5 rounded text-xs">
              {connection.datasource_name || 'Unnamed Datasource'}
            </code>
          </li>
          <li>
            <span className="font-semibold">Connection Type:</span>{' '}
            <code className="bg-muted px-2 py-0.5 rounded text-xs">
              {connection.connection_type}
            </code>
            {connection.connection_type?.toLowerCase().includes('azure') && ' (Azure SQL Database)'}
          </li>
          {connection.username && (
            <li>
              <span className="font-semibold">Username:</span>{' '}
              <code className="bg-muted px-2 py-0.5 rounded text-xs">
                {connection.username}
              </code>
            </li>
          )}
          <li>
            <span className="font-semibold">Server Address:</span>{' '}
            <code className="bg-muted px-2 py-0.5 rounded text-xs">
              {connection.server_address}
            </code>
          </li>
          <li>
            <span className="font-semibold">Database Name:</span>{' '}
            <code className="bg-muted px-2 py-0.5 rounded text-xs">
              {connection.database_name || 'null'}
            </code>
          </li>
          <li>
            <span className="font-semibold">Connection Credentials:</span>{' '}
            <code className="bg-muted px-2 py-0.5 rounded text-xs">
              {connection.connection_credentials}
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
};

const DataSourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [workbookDatasources, setWorkbookDatasources] = useState<WorkbookDatasource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState<boolean>(false);
  const { toast } = useToast();
  const datasourcesContainerRef = useRef<HTMLDivElement>(null);

  // Get workbook information
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
    
    if (workbookId && workbookName) {
      const workbook = { 
        id: workbookId, 
        name: decodeURIComponent(workbookName),
        projectId: projectId || undefined
      };
      
      setSelectedWorkbook(workbook);
      
      // Fetch workbook datasources
      fetchWorkbookDatasources(workbookId);
    } else {
      // Try to get from localStorage
      const storedWorkbook = localStorage.getItem('selectedWorkbook');
      if (storedWorkbook) {
        const workbook = JSON.parse(storedWorkbook);
        setSelectedWorkbook(workbook);
        if (workbook.id) {
          fetchWorkbookDatasources(workbook.id);
        }
      } else {
        setError('No workbook selected. Please select a workbook first.');
        setIsLoading(false);
      }
    }
  }, [navigate, searchParams]);

  const fetchWorkbookDatasources = async (workbookId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Fetching datasources for workbook: ${workbookId}`);
      const datasourcesData = await apiService.getWorkbookDatasources(workbookId);
      
      setWorkbookDatasources(datasourcesData);
      
      // Calculate total connections
      const totalConnections = datasourcesData.reduce((acc, ds) => acc + (ds.connections?.length || 0), 0);
      
      toast({
        title: "Data Sources Loaded",
        description: `Found ${totalConnections} connection(s) for workbook: ${selectedWorkbook?.name || workbookId}`
      });
    } catch (error) {
      console.error('Error fetching workbook datasources:', error);
      setError('Failed to load data sources. Please check your connection and try again.');
      setWorkbookDatasources([]);
      
      toast({
        title: "Error Loading Data Sources",
        description: "Could not load data sources from the server.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedWorkbook?.id) {
      fetchWorkbookDatasources(selectedWorkbook.id);
    }
  };

  // Filter connections based on search query
  const getFilteredConnections = () => {
    if (!searchQuery) return workbookDatasources;
    
    return workbookDatasources.map(wd => ({
      ...wd,
      connections: wd.connections.filter(conn => 
        conn.datasource_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.connection_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.server_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.database_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(wd => wd.connections.length > 0);
  };

  const filteredData = getFilteredConnections();

  const handleExportToPDF = async () => {
    if (!datasourcesContainerRef.current || filteredData.length === 0) {
      toast({
        title: "Export failed",
        description: "No data sources to export or the content is not ready.",
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
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4"
      });
      
      // Add title to PDF
      pdf.setFontSize(18);
      pdf.text("Tableau Data Sources Export", 40, 40);
      pdf.setFontSize(12);
      pdf.text(`Workbook: ${selectedWorkbook?.name || 'Unknown'}`, 40, 60);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 40, 75);
      
      // Capture content
      const canvas = await html2canvas(datasourcesContainerRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 80;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 40, 95, pdfWidth, pdfHeight);
      pdf.save(`tableau-datasources-${selectedWorkbook?.name.replace(/\s+/g, '-')}-${timestamp}.pdf`);
      
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container px-4 mx-auto animate-fade-in">
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
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">
          Data Sources
        </span>
      </div>
      
      {/* Header */}
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-bold mb-1">
          {selectedWorkbook ? `${selectedWorkbook.name} Data Sources` : 'Data Sources'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {selectedWorkbook 
            ? `Data sources and connections used in the "${selectedWorkbook.name}" workbook`
            : 'Manage your Tableau data sources for migration to Power BI'
          }
        </p>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Tableau Data Sources
              </CardTitle>
              <CardDescription>
                Data connections from your Tableau workbook
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search connections..."
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
                disabled={isLoading || exporting || filteredData.length === 0}
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
              {selectedWorkbook && (
                <p className="text-sm mt-1">Try refreshing or check your connection.</p>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4 py-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : filteredData.length > 0 ? (
            <div ref={datasourcesContainerRef}>
              {filteredData.map((workbookDs, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  {workbookDatasources.length > 1 && (
                    <div className="mb-4 pb-2 border-b">
                      <h3 className="font-medium">{workbookDs.workbook_name}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created: {formatDate(workbookDs.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Updated: {formatDate(workbookDs.updated_at)}
                        </span>
                        <span>
                          Project: {workbookDs.project_name}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <ScrollArea className="h-[400px]">
                    {workbookDs.connections.length > 0 ? (
                      workbookDs.connections.map((connection) => (
                        <ConnectionCard
                          key={connection.connection_id}
                          connection={connection}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No connections found in this workbook
                      </div>
                    )}
                  </ScrollArea>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `No data sources matching "${searchQuery}" were found` 
                  : selectedWorkbook 
                    ? `No data sources found in workbook "${selectedWorkbook.name}"` 
                    : 'No workbook selected. Please select a workbook to view its data sources.'}
              </p>
              {!selectedWorkbook && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/workbooks')}
                >
                  Go to Workbooks
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSourcesPage;