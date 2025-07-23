import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoonIcon, SunIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/ThemeProvider";

export function TopHeader() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [userName, setUserName] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<string | null>(null);

  useEffect(() => {
    // Get user info from localStorage
    const userId = localStorage.getItem('userId');
    const storedProjectType = localStorage.getItem('projectType');
    setUserName(userId);
    setProjectType(storedProjectType);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="ml-auto flex items-center gap-2">
        {/* Platform badge */}
        <div className="hidden md:block">
          <span className={`px-3 py-1 text-xs rounded-full ${
            projectType === 'tableau' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {projectType === 'tableau' ? 'Tableau Migration Tool' : 'MicroStrategy Analytics'}
          </span>
        </div>
        
        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              {theme === "light" ? (
                <SunIcon className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 md:flex">
              <User className="h-4 w-4" />
              <span className="hidden md:inline-flex">{userName || 'User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => navigate('/')}>
              Home
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 