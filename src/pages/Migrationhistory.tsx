import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, History, Search, Download, CalendarClock, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

interface MigrationRecord {
  id: string;
  date: string;
  project: string;
  status: "Completed" | "Failed" | "In Progress" | "Pending";
  remarks: string;
  migrationTime?: string;
  user?: string;
  type?: string;
  items?: number;
  successRate?: number;
}

// Helper function for status variant
const getStatusVariant = (status: string) => {
  switch (status) {
    case "Completed":
      return "secondary";
    case "Failed":
      return "destructive";
    case "In Progress":
      return "default";
    case "Pending":
      return "outline";
    default:
      return "outline";
  }
};

// Helper function for status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case "Completed":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "Failed":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "In Progress":
      return <Clock className="h-5 w-5 text-blue-500" />;
    case "Pending":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    default:
      return null;
  }
};

// Sample mock data
const mockMigrationHistory: MigrationRecord[] = [
  {
    id: "m1",
    date: "2025-06-24",
    project: "Sales Dashboard",
    status: "Completed",
    remarks: "All workbooks and dashboards migrated successfully",
    migrationTime: "4 min 32 sec",
    user: "Karthik",
    type: "Dashboard",
    items: 5,
    successRate: 100
  },
  {
    id: "m2",
    date: "2025-06-22",
    project: "Inventory Tracker",
    status: "Failed",
    remarks: "Data source connection error. Unable to migrate custom calculations.",
    migrationTime: "2 min 15 sec",
    user: "Jane Smith",
    type: "Workbook",
    items: 3,
    successRate: 67
  },
  {
    id: "m3",
    date: "2025-06-18",
    project: "Finance Overview",
    status: "Completed",
    remarks: "Successfully migrated with minor formatting adjustments",
    migrationTime: "6 min 23 sec",
    user: "Robert Johnson",
    type: "Dashboard",
    items: 8,
    successRate: 100
  }
];

const MigrationHistoryItem: React.FC<{ record: MigrationRecord }> = ({ record }) => {
  return (
    <Card className="mb-4 hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full">
              {getStatusIcon(record.status)}
            </div>
            <CardTitle className="text-base">{record.project}</CardTitle>
          </div>
          <Badge variant={getStatusVariant(record.status)}>
            {record.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          {new Date(record.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
          <div>
            <span className="text-muted-foreground">Migration Time:</span> {record.migrationTime}
          </div>
          <div>
            <span className="text-muted-foreground">User:</span> {record.user}
          </div>
          <div>
            <span className="text-muted-foreground">Type:</span> {record.type}
          </div>
          <div>
            <span className="text-muted-foreground">Items:</span> {record.items}
          </div>
        </div>
        <p className="text-sm mt-2 text-muted-foreground">{record.remarks}</p>
        {record.successRate !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Success Rate</span>
              <span className="font-medium">{record.successRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  record.successRate > 90 ? 'bg-green-500' : 
                  record.successRate > 60 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} 
                style={{ width: `${record.successRate}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t flex justify-end space-x-2">
        <Button variant="outline" size="sm">View Details</Button>
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="h-4 w-4" />
          Report
        </Button>
      </CardFooter>
    </Card>
  );
};

const MigrationHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<MigrationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

  useEffect(() => {
    // Get selected project from localStorage
    const projectData = localStorage.getItem('selectedProject');
    if (projectData) {
      try {
        const project = JSON.parse(projectData);
        setSelectedProject(project);
      } catch (e) {
        console.error("Error parsing project data", e);
      }
    }

    // Simulate fetch
    const timer = setTimeout(() => {
      setHistory(mockMigrationHistory);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Filter by search term
  const filteredHistory = history.filter(item =>
    searchTerm ? (
      item.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.user && item.user.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : true
  );

  return (
    <div className="container px-4 mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/">Home</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-xs">
          Migration History
        </span>
      </div>
      
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold mb-1">Migration History</h1>
        <p className="text-muted-foreground mb-2">
          View all past migration activities and their status
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search migrations..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="space-y-4">
          {filteredHistory.map((record) => (
            <MigrationHistoryItem key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-lg font-medium">No migration history found</h3>
          <p className="text-muted-foreground">Start a migration to see your history here</p>
        </div>
      )}
    </div>
  );
};

export default MigrationHistoryPage;
