import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, BarChart3, Filter, Search, RefreshCw, Plus, MoreHorizontal, FolderTree, Clock, Eye } from 'lucide-react';
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
import { apiService, View } from '@/services/api';

interface Dashboard {
  id: number;
  name: string;
  workbook: string;
  owner: string;
  createdAt: string;
  views?: number;
  lastViewed?: string;
  status?: 'active' | 'draft' | 'archived';
  sheets?: number;
}

interface SpecInfo {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

// Sample mock dashboard data
const mockDashboards: Dashboard[] = [
  {
    id: 1,
    name: 'Executive Summary',
    workbook: 'Spec Overview',
    owner: 'John Doe',
    createdAt: '2024-10-05',
    views: 124,
    lastViewed: '1 day ago',
    status: 'active',
    sheets: 5
  },
  {
    id: 2,
    name: 'Spec Trends',
    workbook: 'Specs Tracker',
    owner: 'Jane Smith',
    createdAt: '2024-11-22',
    views: 87,
    lastViewed: '3 days ago',
    status: 'active',
    sheets: 3
  },
  {
    id: 3,
    name: 'Spec Engagement',
    workbook: 'Specs Behavior',
    owner: 'Karthik R',
    createdAt: '2025-01-10',
    views: 45,
    lastViewed: '1 week ago',
    status: 'draft',
    sheets: 7
  },
  {
    id: 4,
    name: 'Specs Analysis',
    workbook: 'Specs Performance',
    owner: 'John Doe',
    createdAt: '2024-09-18',
    views: 220,
    lastViewed: '2 days ago',
    status: 'active',
    sheets: 4
  },
  {
    id: 5,
    name: 'Specs Campaign',
    workbook: 'Specs Campaigns',
    owner: 'Sarah Johnson',
    createdAt: '2024-10-15',
    views: 32,
    lastViewed: '2 weeks ago',
    status: 'archived',
    sheets: 6
  }
];

const DashboardCard: React.FC<{ dashboard: View }> = ({ dashboard }) => {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg">{dashboard.name}</CardTitle>
          </div>
        </div>
        <CardDescription>Spec: {dashboard.workbook_id}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">View ID:</span> {dashboard.id}
          </div>
          <div>
            <span className="text-muted-foreground">Workbook ID:</span> {dashboard.workbook_id}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-3">
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

const SpecsDashboardsPage: React.FC = () => {
  const [dashboards, setDashboards] = useState<View[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState<any>(null);

  useEffect(() => {
    // Get selected spec from localStorage
    const specData = localStorage.getItem('selectedSpec');
    if (specData) {
      const spec = JSON.parse(specData);
      setSelectedSpec(spec);
      // Fetch dashboards/views for the selected spec (workbook)
      apiService.getAllViews(spec.id)
        .then((views) => setDashboards(views))
        .catch(() => setDashboards([]))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Filter dashboards by search query
  const filteredDashboards = dashboards.filter(db =>
    db.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container px-4 mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/">Home</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/specs/workbooks">Specs</Link>
        </Button>
        {selectedSpec && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground truncate max-w-xs">
              {selectedSpec.name}
            </span>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-xs">
          Specs Dashboards
        </span>
      </div>

      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold mb-1">
          {selectedSpec ? `Dashboards: ${selectedSpec.name}` : 'Dashboards'}
        </h1>
        {selectedSpec ? (
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground">
              View and manage Tableau dashboards for migration to Power BI
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Spec ID:</span> {selectedSpec.id} •
              <span className="text-muted-foreground ml-2">Created:</span> {selectedSpec.created_at ? new Date(selectedSpec.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            View and manage your Tableau dashboards for migration to Power BI
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search dashboards..."
              className="pl-8 w-full sm:w-[300px]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDashboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-medium mb-1">No dashboards found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No results matching "${searchQuery}"`
                : "There are no dashboards available for this project"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDashboards.map((dashboard) => (
              <DashboardCard key={dashboard.id} dashboard={dashboard} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecsDashboardsPage; 