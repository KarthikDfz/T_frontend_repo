import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Filter, FolderTree, Plus, Search } from 'lucide-react';
import { apiService, Project } from '@/services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const SpecsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiService.getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching specs:', error);
        setError('Failed to load specs. Please check your connection and try again.');
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [navigate]);

  const filteredProjects = searchTerm 
    ? projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : projects;

  const selectProject = (project: Project) => {
    // Store the selected project in localStorage
    localStorage.setItem('selectedProject', JSON.stringify(project));
    // Navigate to the Project Resources page for this project
    navigate(`/specs/${project.id}/resources`);
  };

  return (
    <div className="container px-4 mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/">Home</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/specs">Specs</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-xs">
          Projects
        </span>
      </div>
      
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-bold mb-1">Specs</h1>
        <p className="text-muted-foreground mb-6">
          Select a spec to start working with Tableau to Power BI migration
        </p>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search specs..."
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
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
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
          {filteredProjects.map((project) => (
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
                    <span>Parent Spec ID: {project.parent_id}</span>
                  ) : (
                    <span>Root Spec</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {project.description || 'No description available'}
                </p>
                {project.content_permissions && (
                  <Badge variant="secondary" className="font-normal text-xs">
                    {project.content_permissions}
                  </Badge>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => selectProject(project)}
                  variant="default" 
                  className="w-full"
                >
                  Browse Project
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <FolderTree className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Specs Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {searchTerm 
              ? `No specs matching "${searchTerm}" were found. Try a different search term.` 
              : 'There are no specs yet. Create your first spec to get started.'}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Spec
          </Button>
        </div>
      )}
    </div>
  );
};

export default SpecsPage; 