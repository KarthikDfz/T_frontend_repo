import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, BarChart3, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [tableauCredentials, setTableauCredentials] = useState({
    server_url: '',
    site_name: '',
    token_name: '',
    token_secret: ''
  });
  
  const [microstrategyCredentials, setMicrostrategyCredentials] = useState({
    server_url: '',
    username: '',
    password: '',
    project_id: ''
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleTableauLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!tableauCredentials.server_url || !tableauCredentials.site_name || 
        !tableauCredentials.token_name || !tableauCredentials.token_secret) {
      toast({
        title: "Error",
        description: "Please enter all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call Tableau backend API for authentication
      const response = await fetch('http://localhost:8000/auth/tableau', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tableauCredentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Authentication failed');
      }
      
      const data = await response.json();
      
      // Set authentication for Tableau project
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', data.user_id);
      localStorage.setItem('projectType', 'tableau');
      localStorage.setItem('siteId', data.site_id);
      
      toast({
        title: "Success",
        description: "Logged into Tableau Migration Tool successfully"
      });
      
      // Navigate to Tableau dashboard
      navigate('/tableau/dashboard');
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleMicrostrategyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!microstrategyCredentials.server_url || !microstrategyCredentials.username || 
        !microstrategyCredentials.password) {
      toast({
        title: "Error",
        description: "Please enter all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call MicroStrategy backend API for authentication
      const response = await fetch('http://localhost:8001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(microstrategyCredentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Authentication failed');
      }
      
      const data = await response.json();
      
      // Set authentication for MicroStrategy project
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', microstrategyCredentials.username);
      localStorage.setItem('projectType', 'microstrategy');
      localStorage.setItem('projectId', microstrategyCredentials.project_id || data.default_project_id);
      localStorage.setItem('authToken', data.token);
      
      toast({
        title: "Success", 
        description: "Logged into MicroStrategy Analytics Platform successfully"
      });
      
      // Navigate to MicroStrategy dashboard
      navigate('/mstr/dashboard');
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">BI Migration Hub</h1>
          <p className="text-muted-foreground">Choose your BI platform and sign in</p>
        </div>

        <Tabs defaultValue="tableau" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tableau">Tableau Migration</TabsTrigger>
            <TabsTrigger value="microstrategy">MicroStrategy Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tableau">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tableau to Power BI Migration
                </CardTitle>
                <CardDescription>
                  Sign in to access the Tableau to Power BI migration tool
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTableauLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tableau-server">Server URL</Label>
                    <Input
                      id="tableau-server"
                      type="text"
                      placeholder="https://your-tableau-server.com"
                      value={tableauCredentials.server_url}
                      onChange={(e) => setTableauCredentials({...tableauCredentials, server_url: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tableau-site">Site Name</Label>
                    <Input
                      id="tableau-site"
                      type="text"
                      placeholder="your-site-name"
                      value={tableauCredentials.site_name}
                      onChange={(e) => setTableauCredentials({...tableauCredentials, site_name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tableau-token-name">Personal Access Token Name</Label>
                    <Input
                      id="tableau-token-name"
                      type="text"
                      placeholder="Token Name"
                      value={tableauCredentials.token_name}
                      onChange={(e) => setTableauCredentials({...tableauCredentials, token_name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tableau-token-secret">Personal Access Token Secret</Label>
                    <Input
                      id="tableau-token-secret"
                      type="password"
                      placeholder="Token Secret"
                      value={tableauCredentials.token_secret}
                      onChange={(e) => setTableauCredentials({...tableauCredentials, token_secret: e.target.value})}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Sign In to Tableau Tool
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="microstrategy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  MicroStrategy Analytics Platform
                </CardTitle>
                <CardDescription>
                  Sign in to access the MicroStrategy analytics and migration tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMicrostrategyLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mstr-server">Server URL</Label>
                    <Input
                      id="mstr-server"
                      type="text"
                      placeholder="https://your-mstr-server.com"
                      value={microstrategyCredentials.server_url}
                      onChange={(e) => setMicrostrategyCredentials({...microstrategyCredentials, server_url: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mstr-username">Username</Label>
                    <Input
                      id="mstr-username"
                      type="text"
                      placeholder="Enter your username"
                      value={microstrategyCredentials.username}
                      onChange={(e) => setMicrostrategyCredentials({...microstrategyCredentials, username: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mstr-password">Password</Label>
                    <Input
                      id="mstr-password"
                      type="password"
                      placeholder="Enter your password"
                      value={microstrategyCredentials.password}
                      onChange={(e) => setMicrostrategyCredentials({...microstrategyCredentials, password: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mstr-project">Project ID (Optional)</Label>
                    <Input
                      id="mstr-project"
                      type="text"
                      placeholder="Project ID (optional)"
                      value={microstrategyCredentials.project_id}
                      onChange={(e) => setMicrostrategyCredentials({...microstrategyCredentials, project_id: e.target.value})}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Sign In to MicroStrategy
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login; 