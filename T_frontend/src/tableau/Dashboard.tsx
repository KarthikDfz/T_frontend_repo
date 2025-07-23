import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Database, BookOpen, FileSpreadsheet, Code2, GitMerge, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface StatCard {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

export default function TableauDashboard() {
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: "Projects",
      value: "...",
      description: "Total Tableau projects available",
      icon: <BookOpen className="h-5 w-5" />,
      link: "/tableau/projects"
    },
    {
      title: "Workbooks",
      value: "...",
      description: "Available workbooks to migrate",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      link: "/tableau/workbooks"
    },
    {
      title: "Datasources",
      value: "...",
      description: "Connected data sources",
      icon: <Database className="h-5 w-5" />,
      link: "/tableau/datasources"
    },
    {
      title: "Views",
      value: "...",
      description: "Dashboard views and sheets",
      icon: <BarChart2 className="h-5 w-5" />,
      link: "/tableau/views"
    },
    {
      title: "Calculations",
      value: "...",
      description: "Custom calculations to convert",
      icon: <Code2 className="h-5 w-5" />,
      link: "/tableau/calculations"
    },
    {
      title: "Migrations",
      value: "...",
      description: "Completed migration jobs",
      icon: <GitMerge className="h-5 w-5" />,
      link: "/tableau/migrations"
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
            if (item.title === "Projects") return { ...item, value: "12" };
            if (item.title === "Workbooks") return { ...item, value: "48" };
            if (item.title === "Datasources") return { ...item, value: "23" };
            if (item.title === "Views") return { ...item, value: "156" };
            if (item.title === "Calculations") return { ...item, value: "72" };
            if (item.title === "Migrations") return { ...item, value: "9" };
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
        <h1 className="text-3xl font-bold">Tableau Migration Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Tableau to Power BI migration project
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
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Button className="h-auto py-4 flex items-center justify-center gap-4">
            <BarChart2 className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>Start New Migration</span>
              <span className="text-xs font-normal">Convert Tableau assets to Power BI</span>
            </div>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex items-center justify-center gap-4">
            <Database className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span>Connect Data Source</span>
              <span className="text-xs font-normal">Add a new data connection</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
} 