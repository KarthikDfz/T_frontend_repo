import { 
  Home, 
  FolderTree, 
  History, 
  Book, 
  BarChart3, 
  Database, 
  Calculator, 
  FileText, 
  Package, 
  GitBranch, 
  CheckCircle, 
  Server, 
  Monitor, 
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { BrandLogo } from "./BrandLogo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { apiService } from '@/services/api';

const navigationItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderTree,
  },
  {
    title: "Migration History",
    url: "/history",
    icon: History,
  },
];

const contentItems = [
  {
    title: "Workbooks",
    url: "/workbooks",
    icon: Book,
  },
  {
    title: "Dashboards",
    url: "/dashboards",
    icon: BarChart3,
  }, 
  {
    title: "Custom Calculations",
    url: "/customcalculation",
    icon: Calculator,
  },
  {
    title: "Views/Sheets",
    url: "/sheets",
    icon: FileText,
  },
  {
    title: "Data Sources",
    url: "/datasources",
    icon: Database,
  },
  {
    title: "Specs",
    url: "/specs",
    icon: FileText,
  }
];

const toolsItems = [
  {
    title: "Batch Migration",
    url: "/batch",
    icon: Package,
  },
  {
    title: "Mapping Rules",
    url: "/mapping",
    icon: GitBranch,
  },
  {
    title: "Validation Center",
    url: "/validation",
    icon: CheckCircle,
  },
];

const settingsItems = [
  {
    title: "Tableau Connections",
    url: "/tableau-connections",
    icon: Server,
  },
  {
    title: "Power BI Workspaces",
    url: "/powerbi-workspaces",
    icon: Monitor,
  },
  {
    title: "User Preferences",
    url: "/preferences",
    icon: Settings,
  },
];

function useIsActive(path: string) {
  const location = useLocation();
  if (path === '/') {
    return location.pathname === '/';
  }
  return location.pathname === path || location.pathname.startsWith(path + '/');
}

export function AppSidebar() {
  const location = useLocation();
  const [openSections, setOpenSections] = useState({
    content: true,
    tools: false,
    settings: false
  });
  const [selectedProject, setSelectedProject] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('selectedProject'));
    } catch {
      return null;
    }
  });

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    localStorage.setItem('selectedProject', JSON.stringify(project));
    window.location.href = `/project/${project.project_id || project.id}`;
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
          <div>
            <h2 className="font-sf-pro font-semibold text-sidebar-foreground">
              Tableau Migration
            </h2>
            <p className="text-xs text-sidebar-foreground/60">
              to Power BI
            </p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Navigation Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Home Button */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/"
                    className={`transition-apple flex items-center gap-2 rounded-md px-2 py-1 w-full ${useIsActive('/') ? 'bg-brand-50 text-brand-600 font-semibold' : ''}`}
                  >
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Projects Button (no dropdown) */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/projects"
                    className={`transition-apple flex items-center gap-2 rounded-md px-2 py-1 w-full ${useIsActive('/projects') ? 'bg-brand-50 text-brand-600 font-semibold' : ''}`}
                  >
                    <FolderTree className="h-4 w-4" />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Other Navigation Items (excluding Home and Projects) */}
              {navigationItems.filter(item => item.title !== 'Home' && item.title !== 'Projects').map((item) => {
                const isActive = useIsActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={`transition-apple flex items-center gap-2 rounded-md px-2 py-1 w-full ${isActive ? 'bg-brand-50 text-brand-600 font-semibold' : ''}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content Management Section */}
        <SidebarGroup>
          <Collapsible open={openSections.content} onOpenChange={() => toggleSection('content')}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-2 py-1">
                {openSections.content ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Content Management
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {contentItems.map((item) => {
                    const isActive = useIsActive(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link
                            to={item.url}
                            className={`transition-apple flex items-center gap-2 rounded-md px-2 py-1 w-full ${isActive ? 'bg-brand-50 text-brand-600 font-semibold' : ''}`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Migration Tools Section */}
        <SidebarGroup>
          <Collapsible open={openSections.tools} onOpenChange={() => toggleSection('tools')}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-2 py-1">
                {openSections.tools ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Migration Tools
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url} className="transition-apple">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Configuration Section */}
        <SidebarGroup>
          <Collapsible open={openSections.settings} onOpenChange={() => toggleSection('settings')}>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-2 py-1">
                {openSections.settings ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Configuration
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url} className="transition-apple">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
