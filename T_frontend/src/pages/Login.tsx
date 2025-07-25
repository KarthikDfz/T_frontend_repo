import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, BarChart3, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [tableauCredentials, setTableauCredentials] = useState({
    username: '',
    password: ''
  });
  const [microstrategyCredentials, setMicrostrategyCredentials] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleTableauLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!tableauCredentials.username || !tableauCredentials.password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    // Set authentication for Tableau project
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userId', tableauCredentials.username);
    localStorage.setItem('projectType', 'tableau');
    
    toast({
      title: "Success",
      description: "Logged into Tableau Migration Tool successfully"
    });
    
    // Navigate to current application (localhost:8080)
    navigate('/');
  };

  const handleMicrostrategyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!microstrategyCredentials.username || !microstrategyCredentials.password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success", 
      description: "Redirecting to Microstrategy project..."
    });
    
    // Redirect to Microstrategy project (localhost:8081)
    window.location.href = 'http://localhost:8081';
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
          <h1 className="text-2xl font-bold">Project Portal</h1>
          <p className="text-muted-foreground">Choose your project and sign in</p>
        </div>

        <Tabs defaultValue="tableau" className="w-full">
          {/* <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tableau">Tableau (localhost:8080)</TabsTrigger>
            <TabsTrigger value="microstrategy">Microstrategy (localhost:8081)</TabsTrigger>
          </TabsList> */}
          
          <TabsContent value="tableau">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tableau Migration Tool
                </CardTitle>
                <CardDescription>
                  Sign in to access the Tableau to Power BI migration tool (localhost:8080)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTableauLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tableau-username">Username</Label>
                    <Input
                      id="tableau-username"
                      type="text"
                      placeholder="Enter your username"
                      value={tableauCredentials.username}
                      onChange={(e) => setTableauCredentials({...tableauCredentials, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tableau-password">Password</Label>
                    <Input
                      id="tableau-password"
                      type="password"
                      placeholder="Enter your password"
                      value={tableauCredentials.password}
                      onChange={(e) => setTableauCredentials({...tableauCredentials, password: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button type="submit" className="w-full">
                    Log in with Tableau
                    </Button>
                    <Link to="http://localhost:8081/login" className="text-brand-500 hover:text-brand-600 text-sm text-center">
                      Log in to Microstrategy?
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="microstrategy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Microstrategy Project
                </CardTitle>
                <CardDescription>
                  Sign in to access the Microstrategy project (localhost:8081)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMicrostrategyLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="micro-username">Username</Label>
                    <Input
                      id="micro-username"
                      type="text"
                      placeholder="Enter your username"
                      value={microstrategyCredentials.username}
                      onChange={(e) => setMicrostrategyCredentials({...microstrategyCredentials, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="micro-password">Password</Label>
                    <Input
                      id="micro-password"
                      type="password"
                      placeholder="Enter your password"
                      value={microstrategyCredentials.password}
                      onChange={(e) => setMicrostrategyCredentials({...microstrategyCredentials, password: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Sign In to Microstrategy
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