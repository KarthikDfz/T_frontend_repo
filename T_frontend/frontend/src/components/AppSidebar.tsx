import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Database, 
  BarChart2, 
  FileSpreadsheet, 
  Code2, 
  History,
  Newspaper,
  Presentation,
  Cube,
  PieChart,
  Table,
  GitCompare,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Define menu item type
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

export function AppSidebar() {
  const { isOpen, toggle } = useSidebar();
  const location = useLocation();
  const [projectType, setProjectType] = useState<string | null>(null);

  useEffect(() => {
    // Get the project type from localStorage
    const storedProjectType = localStorage.getItem('projectType');
    setProjectType(storedProjectType);
  }, []);

  // Define menu items based on project type
  const getMenuItems = (): MenuItem[] => {
    if (projectType === 'tableau') {
      return [
        {
          label: "Dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          href: "/tableau/dashboard",
        },
        {
          label: "Projects",
          icon: <FolderKanban className="h-5 w-5" />,
          href: "/tableau/projects",
        },
        {
          label: "Workbooks",
          icon: <Newspaper className="h-5 w-5" />,
          href: "/tableau/workbooks",
        },
        {
          label: "Datasources",
          icon: <Database className="h-5 w-5" />,
          href: "/tableau/datasources",
        },
        {
          label: "Views",
          icon: <BarChart2 className="h-5 w-5" />,
          href: "/tableau/views",
        },
        {
          label: "Calculations",
          icon: <Code2 className="h-5 w-5" />,
          href: "/tableau/calculations",
        },
        {
          label: "Migration History",
          icon: <History className="h-5 w-5" />,
          href: "/tableau/migrations",
        },
      ];
    } else if (projectType === 'microstrategy') {
      return [
        {
          label: "Dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          href: "/mstr/dashboard",
        },
        {
          label: "Projects",
          icon: <FolderKanban className="h-5 w-5" />,
          href: "/mstr/projects",
        },
        {
          label: "Reports",
          icon: <FileSpreadsheet className="h-5 w-5" />,
          href: "/mstr/reports",
        },
        {
          label: "Dossiers",
          icon: <Presentation className="h-5 w-5" />,
          href: "/mstr/dossiers",
        },
        {
          label: "Cubes",
          icon: <Cube className="h-5 w-5" />,
          href: "/mstr/cubes",
        },
        {
          label: "Metrics",
          icon: <PieChart className="h-5 w-5" />,
          href: "/mstr/metrics",
        },
        {
          label: "Attributes",
          icon: <Table className="h-5 w-5" />,
          href: "/mstr/attributes",
        },
        {
          label: "SQL Analysis",
          icon: <Code2 className="h-5 w-5" />,
          href: "/mstr/analysis",
        },
      ];
    } else {
      // Default or unknown project type
      return [
        {
          label: "Dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          href: "/",
        },
      ];
    }
  };
  
  const menuItems = getMenuItems();
  
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-20 h-full w-[270px] -translate-x-full border-r bg-background transition-transform lg:translate-x-0",
          isOpen && "translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              {projectType === 'tableau' ? (
                <BarChart2 className="h-6 w-6 text-primary" />
              ) : (
                <Database className="h-6 w-6 text-primary" />
              )}
              <span className="text-xl">
                {projectType === 'tableau' ? 'Tableau Migration' : 'MSTR Analytics'}
              </span>
            </Link>
          </div>
          <ScrollArea className="flex-1 py-4">
            <nav className="grid gap-1 px-2">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    location.pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </ScrollArea>
          
          {/* Switch Platform Button */}
          <div className="border-t p-4">
            <Link to="/">
              <Button variant="outline" className="w-full justify-start gap-3">
                <GitCompare className="h-5 w-5" />
                Switch Platform
              </Button>
            </Link>
          </div>
          
          {/* Logout Button */}
          <div className="border-t p-4">
            <Button 
              variant="destructive" 
              className="w-full justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-10 bg-background/80 backdrop-blur-sm transition-all lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={toggle}
      />

      {/* Toggle button */}
      <Button
        className="fixed bottom-4 right-4 h-10 w-10 rounded-full p-0 lg:hidden"
        size="icon"
        onClick={toggle}
      >
        {isOpen ? <ChevronLeft /> : <ChevronRight />}
        <span className="sr-only">Toggle Menu</span>
      </Button>
    </>
  );
} 