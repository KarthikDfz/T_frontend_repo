import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Database, Plus, ServerIcon, FileSpreadsheet, Cloud, RefreshCw, Search, ArrowRight, ExternalLink } from 'lucide-react';
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
import { apiService, Datasource } from '@/services/api';

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
  const getDatasourceType = (): string => {
    const name = datasource.name?.toLowerCase() || '';
    const type = datasource.type?.toLowerCase() || '';
    if (type.includes('azure') || name.includes('azure')) return 'azure';
    if (type.includes('sql') || name.includes('sql')) return 'sql';
    if (type.includes('excel') || name.includes('excel')) return 'excel';
    return 'database';
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

const SpecsDatasourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const [datasources, setDatasources] = useState<Datasource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<any>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    const specData = localStorage.getItem('selectedSpec');
    if (specData) {
      setSelectedSpec(JSON.parse(specData));
    }
  }, [navigate]);

  useEffect(() => {
    if (!selectedSpec) return; // Only fetch if selectedSpec is loaded
    const fetchDatasources = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch all datasources, do not filter by project_id
        let datasourcesData: Datasource[] = await apiService.getDatasources();
        setDatasources(datasourcesData);
      } catch (error) {
        console.error('Error fetching datasources:', error);
        setError('Failed to load datasources. Please check your connection and try again.');
        setDatasources([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDatasources();
  }, [selectedSpec]);

  const filteredDatasources = datasources.filter(ds => 
    ds.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (ds.description && ds.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRefresh = async () => {
    if (!selectedSpec) return;
    setIsLoading(true);
    try {
      let datasourcesData: Datasource[] = await apiService.getDatasources();
      setDatasources(datasourcesData);
      setError(null);
    } catch (error) {
      console.error('Error refreshing datasources:', error);
      setError('Failed to refresh datasources. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (source: string, data: Record<string, string>) => {
    console.log(`Connecting to ${source} with`, data);
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
        {selectedSpec && (
          <>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link to={`/specs/${selectedSpec.id}/resources`}>Project Resources ({selectedSpec.name})</Link>
            </Button>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="font-medium text-foreground truncate max-w-xs">
          Data Sources
        </span>
      </div>
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-bold mb-1">
          {selectedSpec ? `${selectedSpec.name} Power BI Data Sources` : 'All Data Sources'}
        </h1>
        <p className="text-muted-foreground mb-6">
          Connect and manage your Tableau data sources for migration to Power BI
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
              <ScrollArea className="h-[250px]">
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
                    : selectedSpec 
                      ? `No data sources found in spec "${selectedSpec.name}"` 
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

export default SpecsDatasourcesPage; 