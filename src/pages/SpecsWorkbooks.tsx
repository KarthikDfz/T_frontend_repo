import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Download, Filter, Search, RefreshCw, Plus, MoreHorizontal, FolderTree } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { apiService, Workbook, Project } from '@/services/api';

interface SpecCardProps {
  spec: Workbook;
  onSelect: (spec: Workbook) => void;
}

const SpecCard: React.FC<SpecCardProps> = ({ spec, onSelect }) => {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg truncate">{spec.name}</CardTitle>
          </div>
          <Badge variant="outline" className="font-normal text-xs">
            {spec.id.substring(0, 8)}...
          </Badge>
        </div>
        <CardDescription>Project: {spec.project_name || "Unknown"}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Created:</span> {spec.created_at ? new Date(spec.created_at).toLocaleDateString() : "Unknown"}
          </div>
          <div>
            <span className="text-muted-foreground">Updated:</span> {spec.updated_at ? new Date(spec.updated_at).toLocaleDateString() : "Unknown"}
          </div>
          {spec.tags && spec.tags.length > 0 && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Tags:</span> {spec.tags.join(", ")}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onSelect(spec)}
        >
          View Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Migrate</DropdownMenuItem>
            <DropdownMenuItem>Export</DropdownMenuItem>
            <DropdownMenuItem>Analyze</DropdownMenuItem>
            <Separator />
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

const SpecsWorkbooksPage: React.FC = () => {
  const navigate = useNavigate();
  const [specs, setSpecs] = useState<Workbook[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Get selected project from localStorage
    const projectData = localStorage.getItem('selectedProject');
    if (projectData) {
      const project = JSON.parse(projectData);
      setSelectedProject(project);
    }

    // Fetch specs based on selected project
    const fetchSpecs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let specsData: Workbook[] = [];
        
        if (selectedProject) {
          // Fetch specs for the selected project
          specsData = await apiService.getWorkbooks(selectedProject.id);
        } else {
          // Fetch all specs if no project is selected
          specsData = await apiService.getWorkbooks();
        }
        
        setSpecs(specsData);
      } catch (error) {
        console.error('Error fetching specs:', error);
        setError('Failed to load specs. Please check your connection and try again.');
        setSpecs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpecs();
  }, [navigate]);

  // Filter specs by search query
  const filteredSpecs = specs.filter(spec => 
    spec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (spec.project_name && spec.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (spec.description && spec.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      let specsData: Workbook[] = [];
      
      if (selectedProject) {
        // Fetch specs for the selected project
        specsData = await apiService.getWorkbooks(selectedProject.id);
      } else {
        // Fetch all specs if no project is selected
        specsData = await apiService.getWorkbooks();
      }
      
      setSpecs(specsData);
      setError(null);
    } catch (error) {
      console.error('Error refreshing specs:', error);
      setError('Failed to refresh specs. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSpec = (spec: Workbook) => {
    // Store selected spec and navigate to specs dashboards page
    localStorage.setItem('selectedSpec', JSON.stringify(spec));
    navigate('/specs/dashboards');
  };

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
          <Link to={selectedProject ? `/specs/${selectedProject.id}/resources` : '/specs'}>
            Project Resources{selectedProject ? ` (${selectedProject.name})` : ''}
          </Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-xs">
          Workbooks
        </span>
      </div>

      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold mb-1">
          {selectedProject ? `${selectedProject.name} Specs` : 'All Specs'}
        </h1>
        <p className="text-muted-foreground mb-6">
          Browse and manage your Tableau specs
        </p>
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Search specs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-destructive mb-4">{error}</div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredSpecs.map(spec => (
            <SpecCard key={spec.id} spec={spec} onSelect={handleSelectSpec} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecsWorkbooksPage; 