import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, FileText, Filter, Search, RefreshCw, Plus, MoreHorizontal, FolderTree, PanelTop, Layers, Loader2, AlertCircle, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { apiService, Workbook, View, getSiteName } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ViewCardProps {
  view: View;
}

const ViewCard: React.FC<ViewCardProps> = ({ view }) => {
  // Determine view type based on content_url or name
  const getViewType = (): string => {
    const name = view.name?.toLowerCase() || '';
    if (name.includes('dashboard')) return 'dashboard';
    if (name.includes('map')) return 'map';
    if (name.includes('table')) return 'table';
    return 'chart'; // default type
  };

  const viewType = getViewType();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dashboard': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'map': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'table': return 'text-green-600 bg-green-50 border-green-200';
      case 'chart': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg border ${getTypeColor(viewType)}`}>
              {viewType === 'chart' && <PanelTop className="h-4 w-4" />}
              {viewType === 'table' && <Layers className="h-4 w-4" />}
              {viewType === 'map' && <FileText className="h-4 w-4" />}
              {viewType === 'dashboard' && <PanelTop className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors truncate">
                {view.name}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                View ID: {view.id.substring(0, 12)}...
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={`text-xs ${getTypeColor(viewType)} border-current`}>
            {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="w-full aspect-video bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg flex items-center justify-center border border-muted relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5"></div>
          <div className="text-center relative z-10">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              {viewType === 'chart' && <PanelTop className="h-6 w-6 text-primary" />}
              {viewType === 'table' && <Layers className="h-6 w-6 text-primary" />}
              {viewType === 'map' && <FileText className="h-6 w-6 text-primary" />}
              {viewType === 'dashboard' && <PanelTop className="h-6 w-6 text-primary" />}
            </div>
            <p className="text-sm font-medium text-muted-foreground">Tableau View</p>
            {view.content_url && (
              <p className="text-xs text-muted-foreground mt-1 opacity-75 truncate max-w-[200px] mx-auto">
                {view.content_url}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary transition-colors">
          <FileText className="h-3 w-3 mr-1" />
          View Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="group-hover:bg-primary/5 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              <PanelTop className="h-4 w-4 mr-2" />
              Open in Tableau
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Download className="h-4 w-4 mr-2" />
              Export View
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <RefreshCw className="h-4 w-4 mr-2" />
              Migrate to Power BI
            </DropdownMenuItem>
            <Separator />
            <DropdownMenuItem className="text-destructive cursor-pointer">
              <AlertCircle className="h-4 w-4 mr-2" />
              Report Issue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

const ViewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [views, setViews] = useState<View[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkbook, setSelectedWorkbook] = useState<Workbook | null>(null);
  const { toast } = useToast();

  // Debug function to log current state
  const logCurrentState = () => {
    console.log('=== Current Views Page State ===');
    console.log('views:', views);
    console.log('views.length:', views.length);
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    console.log('selectedWorkbook:', selectedWorkbook);
    console.log('searchQuery:', searchQuery);
    console.log('================================');
  };

  // Force clear all data function
  const forceClearData = () => {
    console.log('Force clearing all views data...');
    setViews([]);
    setError(null);
    setSearchQuery('');
    setIsLoading(false);
    
    // Clear any localStorage data that might be cached
    try {
      localStorage.removeItem('cachedViews');
      localStorage.removeItem('viewsCache');
      localStorage.removeItem('lastViewsData');
    } catch (e) {
      console.log('No cached views data to clear');
    }
    
    logCurrentState();
  };

  // Log state changes for debugging
  React.useEffect(() => {
    console.log('Views state changed:', views.length, 'views');
    if (views.length > 0) {
      console.log('Current views:', views.map(v => ({ id: v.id, name: v.name })));
    }
  }, [views]);

  React.useEffect(() => {
    console.log('Error state changed:', error);
  }, [error]);

  React.useEffect(() => {
    console.log('Loading state changed:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Clear any existing data immediately when component mounts or params change
    setViews([]);
    setError(null);
    setIsLoading(true);

    // Get workbook information from URL params if available
    const workbookId = searchParams.get('workbookId');
    const workbookName = searchParams.get('workbookName');
    const projectId = searchParams.get('projectId');
    
    console.log('Views page initialized with params:', { workbookId, workbookName, projectId });
    
    // Determine which workbook to use
    let workbookToUse = null;
    if (workbookId && workbookName) {
      workbookToUse = { 
        id: workbookId, 
        name: decodeURIComponent(workbookName),
        projectId: projectId || undefined
      };
      setSelectedWorkbook(workbookToUse);
      
      // Store in localStorage for persistence
      localStorage.setItem('selectedWorkbook', JSON.stringify(workbookToUse));
      
      console.log('Workbook from URL:', workbookToUse);
    } else {
      // Get selected workbook from localStorage if not in URL
      const workbookData = localStorage.getItem('selectedWorkbook');
      if (workbookData) {
        try {
          workbookToUse = JSON.parse(workbookData);
          setSelectedWorkbook(workbookToUse);
          console.log('Workbook from localStorage:', workbookToUse);
        } catch (e) {
          console.error('Error parsing workbook data:', e);
          setSelectedWorkbook(null);
        }
      } else {
        setSelectedWorkbook(null);
      }
    }
    
    const fetchViews = async () => {
      console.log('Starting fetchViews for workbook:', workbookToUse);
      
      try {
        // Immediately clear existing views to prevent stale data
        setViews([]);
        setError(null);
        
        // Check if we have a site name for authentication
        const siteName = getSiteName();
        if (!siteName) {
          console.log('No site name found, setting auth error');
          setError('No Tableau site is selected. Please authenticate first.');
          setViews([]); // Ensure views are empty
          setIsLoading(false);
          return;
        }
        
        let viewsData: View[] = [];
        
        if (workbookToUse && workbookToUse.id) {
          console.log(`Fetching views for workbook ${workbookToUse.id}: ${workbookToUse.name}`);
          
          // Fetch views for the selected workbook
          viewsData = await apiService.getWorkbookViews(workbookToUse.id);
          console.log('API Response - Fetched views for workbook:', viewsData);
          console.log('Number of views received:', viewsData.length);
          
          // Show appropriate toast message
          if (viewsData.length > 0) {
            toast({
              title: "Views Loaded",
              description: `Successfully loaded ${viewsData.length} views from workbook: ${workbookToUse.name}`
            });
          } else {
            console.log('No views found for workbook');
            toast({
              title: "No Views Found",
              description: `The workbook "${workbookToUse.name}" doesn't contain any published views.`,
              variant: "default"
            });
          }
        } else {
          console.log('No workbook selected, fetching all views');
          // Fetch all views if no workbook is selected
          viewsData = await apiService.getAllViews();
          console.log('API Response - Fetched all views:', viewsData);
          
          // If we get data, show success, otherwise we'll fall into the catch block
          if (viewsData && viewsData.length > 0) {
            toast({
              title: "Views Loaded",
              description: `Successfully loaded ${viewsData.length} views from all workbooks`
            });
          }
        }
        
        // Explicitly set the views (even if empty array)
        console.log('Setting views state to:', viewsData);
        setViews(viewsData);
        setError(null); // Clear any previous errors
        
      } catch (error) {
        console.error('Error fetching views:', error);
        
        // Explicitly clear views and set error
        setViews([]); // Ensure no stale views are shown
        setError('Failed to load views from Tableau server. Please check your connection and try again.');
        
        console.log('API fetch failed, views state cleared, error state set');
        
        toast({
          title: "Connection Error",
          description: "Could not connect to Tableau server. Please check your connection and authentication.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        console.log('fetchViews completed, isLoading set to false');
      }
    };

    fetchViews();
  }, [navigate, searchParams, toast]);

  // Filter views by search query
  const filteredViews = views.filter(view => 
    view.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    console.log('handleRefresh called for workbook:', selectedWorkbook);
    
    // Immediately clear existing data
    setViews([]);
    setError(null);
    setIsLoading(true);
    
    try {
      let viewsData: View[] = [];
      
      if (selectedWorkbook && selectedWorkbook.id) {
        console.log(`Refreshing views for workbook ${selectedWorkbook.id}: ${selectedWorkbook.name}`);
        
        // Fetch views for the selected workbook
        viewsData = await apiService.getWorkbookViews(selectedWorkbook.id);
        console.log('Refresh API Response - Fetched views for workbook:', viewsData);
        console.log('Number of views received on refresh:', viewsData.length);
        
        if (viewsData.length > 0) {
          toast({
            title: "Views Refreshed",
            description: `Successfully loaded ${viewsData.length} views from Tableau`
          });
        } else {
          console.log('No views found on refresh');
          toast({
            title: "No Views Found",
            description: `The workbook "${selectedWorkbook.name}" doesn't contain any published views.`,
            variant: "default"
          });
        }
      } else {
        console.log('No workbook selected, refreshing all views');
        // Fetch all views if no workbook is selected
        viewsData = await apiService.getAllViews();
        console.log('Refresh API Response - Fetched all views:', viewsData);
        
        if (viewsData.length > 0) {
          toast({
            title: "Views Refreshed",
            description: `Successfully loaded ${viewsData.length} views from Tableau`
          });
        }
      }
      
      // Explicitly set the views state
      console.log('Setting refreshed views state to:', viewsData);
      setViews(viewsData);
      setError(null);
      
    } catch (error) {
      console.error('Error refreshing views:', error);
      
      // Explicitly clear views and set error
      setViews([]); // Ensure no stale views persist
      setError('Failed to refresh views from Tableau server. Please check your connection and try again.');
      
      console.log('Refresh failed, views state cleared, error state set');
      
      toast({
        title: "Connection Error",
        description: "Could not refresh views from Tableau server. Check your connection and authentication.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log('handleRefresh completed, isLoading set to false');
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
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-xs">
          Views/Sheets
        </span>
      </div>
      
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold mb-1">
          {selectedWorkbook ? `${selectedWorkbook.name} Views` : 'All Views'}
        </h1>
        <p className="text-muted-foreground mb-6">
          Browse and manage your Tableau views for migration
        </p>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-2 max-w-md w-full">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search views..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Export to PDF
            </Button>
            {/* Debug section - only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <Button variant="outline" size="sm" onClick={logCurrentState} className="gap-2 bg-yellow-50 border-yellow-200 text-yellow-800">
                  🔍 Debug State
                </Button>
                <Button variant="outline" size="sm" onClick={forceClearData} className="gap-2 bg-red-50 border-red-200 text-red-800">
                  🗑️ Force Clear
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {!error && selectedWorkbook && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <p className="font-medium text-blue-800">Workbook Selected</p>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Showing views from: <span className="font-medium">{selectedWorkbook.name}</span>
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/3 mb-1" />
                <Skeleton className="h-4 w-1/4" />
                </CardHeader>
              <CardContent>
                <Skeleton className="w-full aspect-video rounded-md" />
                </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-9 rounded-md" />
                </CardFooter>
              </Card>
          ))}
        </div>
      ) : filteredViews.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredViews.map(view => (
            <ViewCard key={view.id} view={view} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-muted to-muted/60 rounded-full flex items-center justify-center mb-6 border-4 border-muted/30">
            {error ? (
              <AlertCircle className="h-12 w-12 text-destructive" />
            ) : (
              <FileText className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-xl font-semibold mb-3 text-foreground">
            {error ? 'Unable to Connect to Tableau Server' : 'No Views Found'}
          </h3>
          <div className="max-w-lg mx-auto text-muted-foreground space-y-3">
            {error ? (
              <>
                <p className="text-destructive font-medium">
                  Failed to load views from Tableau server
                </p>
                <p className="text-sm">
                  Check your Tableau connection and authentication status. The server may be unavailable or you may not have the proper permissions.
                </p>
                <div className="flex gap-2 justify-center mt-4">
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry Connection
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/workbooks">
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      Back to Workbooks
                    </Link>
                  </Button>
                </div>
              </>
            ) : searchQuery ? (
              <>
                <p>No views match your search for <span className="font-medium text-foreground">"{searchQuery}"</span></p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh Views
                  </Button>
                </div>
              </>
            ) : selectedWorkbook ? (
              <>
                <p>No views found in the <span className="font-medium text-foreground">"{selectedWorkbook.name}"</span> workbook</p>
                <p className="text-sm">This workbook might not contain any published views, or you might not have access to them.</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh Views
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/workbooks">
                      <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                      Back to Workbooks
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p>No views are currently available</p>
                <p className="text-sm">Select a workbook to view its sheets and dashboards.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/workbooks">
                    <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                    Browse Workbooks
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewsPage;
