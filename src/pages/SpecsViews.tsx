import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Filter, Search, RefreshCw, Plus, MoreHorizontal, PanelTop, Layers } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { apiService, View } from '@/services/api';

const ViewCard: React.FC<{ view: View }> = ({ view }) => {
  // Determine view type based on content_url or name
  const getViewType = (): string => {
    const name = view.name?.toLowerCase() || '';
    if (name.includes('dashboard')) return 'dashboard';
    if (name.includes('map')) return 'map';
    if (name.includes('table')) return 'table';
    return 'chart'; // default type
  };
  const viewType = getViewType();
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {viewType === 'chart' && <PanelTop className="h-4 w-4 text-blue-500" />}
            {viewType === 'table' && <Layers className="h-4 w-4 text-green-500" />}
            {viewType === 'dashboard' && <PanelTop className="h-4 w-4 text-orange-500" />}
            <CardTitle className="text-base truncate">{view.name}</CardTitle>
          </div>
          <Badge variant="outline">
            {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
          </Badge>
        </div>
        <CardDescription className="truncate">
          ID: {view.id.substring(0, 8)}...
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="w-full aspect-video bg-muted/40 rounded-md flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">View Preview</p>
            {view.content_url && (
              <p className="text-xs text-muted-foreground mt-1">{view.content_url}</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm">
          View Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Migrate to Power BI</DropdownMenuItem>
            <DropdownMenuItem>Preview</DropdownMenuItem>
            <DropdownMenuItem>Export</DropdownMenuItem>
            <Separator />
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

const SpecsViewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [views, setViews] = useState<View[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<any>(null);

  useEffect(() => {
    // Get selected spec from localStorage
    const specData = localStorage.getItem('selectedSpec');
    if (specData) {
      const spec = JSON.parse(specData);
      setSelectedSpec(spec);
      // Fetch views for the selected spec (workbook)
      apiService.getWorkbookViews(spec.id)
        .then((views) => setViews(views))
        .catch(() => setViews([]))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Filter views by search query
  const filteredViews = views.filter(view =>
    view.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container px-4 mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/">Home</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/specs">Projects</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to={selectedSpec ? `/specs/${selectedSpec.id}/resources` : '/specs'}>
            Project Resources{selectedSpec ? ` (${selectedSpec.name})` : ''}
          </Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-xs">
          Views/Sheets
        </span>
      </div>

      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold mb-1">
          {selectedSpec ? `${selectedSpec.name} Views/Sheets` : 'All Views/Sheets'}
        </h1>
        <p className="text-muted-foreground mb-6">
          Browse and manage your Tableau views and sheets for this spec
        </p>
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Search views/sheets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" size="icon" onClick={() => setIsLoading(true)} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredViews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-medium mb-1">No views or sheets found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? `No results matching "${searchQuery}"`
              : "There are no views or sheets available for this spec"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredViews.map((view) => (
            <ViewCard key={view.id} view={view} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecsViewsPage; 