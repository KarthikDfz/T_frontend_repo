import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  FileSpreadsheet, 
  Presentation, 
  Cube, 
  PieChart, 
  Table, 
  Code2, 
  ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";

interface StatCard {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

export default function MstrDashboard() {
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: "Projects",
      value: "...",
      description: "MicroStrategy projects",
      icon: <Database className="h-5 w-5" />,
      link: "/mstr/projects"
    },
    {
      title: "Reports",
      value: "...",
      description: "Available reports",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      link: "/mstr/reports"
    },
    {
      title: "Dossiers",
      value: "...",
      description: "Interactive dashboards",
      icon: <Presentation className="h-5 w-5" />,
      link: "/mstr/dossiers"
    },
    {
      title: "Cubes",
      value: "...",
      description: "OLAP and Super Cubes",
      icon: <Cube className="h-5 w-5" />,
      link: "/mstr/cubes"
    },
    {
      title: "Metrics",
      value: "...",
      description: "Business metrics",
      icon: <PieChart className="h-5 w-5" />,
      link: "/mstr/metrics"
    },
    {
      title: "Attributes",
      value: "...",
      description: "Data dimensions",
      icon: <Table className="h-5 w-5" />,
      link: "/mstr/attributes"
    }
  ]);

  useEffect(() => {
    // Simulate API call to get stats
    const fetchStats = async () => {
      try {
        // In a real app, these would be actual API calls
        // For now, just simulate with timeouts and random data

        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats(prev => 
          prev.map(item => {
            if (item.title === "Projects") return { ...item, value: "5" };
            if (item.title === "Reports") return { ...item, value: "64" };
            if (item.title === "Dossiers") return { ...item, value: "18" };
            if (item.title === "Cubes") return { ...item, value: "27" };
            if (item.title === "Metrics") return { ...item, value: "103" };
            if (item.title === "Attributes") return { ...item, value: "86" };
            return item;
          })
        );

      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">MicroStrategy Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Explore and analyze your MicroStrategy environment
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className="bg-primary/10 p-2 rounded-full">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value === "..." ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {stat.description}
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Link to={stat.link} className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  <span>View Details</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Analysis Tools</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Button className="h-auto py-4 flex items-center justify-center gap-4">
            <Code2 className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>SQL Analysis</span>
              <span className="text-xs font-normal">Explore underlying SQL queries</span>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex items-center justify-center gap-4">
            <Database className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>Export to Power BI</span>
              <span className="text-xs font-normal">Create Power BI dataset from MSTR</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
} 