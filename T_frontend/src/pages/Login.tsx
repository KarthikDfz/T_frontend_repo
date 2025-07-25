import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleTableauLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simple validation
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Set authentication for Tableau project
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userId', username);
    localStorage.setItem('projectType', 'tableau');
    
    toast({
      title: "Success",
      description: "Logged into Tableau Migration Tool successfully"
    });
    
    // Navigate to current application (localhost:8080)
    navigate('/');
    setIsLoading(false);
  };

  const handleMicrostrategyRedirect = () => {
    // Redirect to Microstrategy project (localhost:8081)
    window.location.href = 'http://localhost:8081/login';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          {/* Orange/Red Z Logo */}
          <div className="mb-6">
            <img
              src="/lovable-uploads/5e80d876-2fd7-45b1-b83e-f943d53a9209.png"
              alt="BI Accelerator Logo"
              className="w-24 h-24"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-center text-gray-900">BI Accelerator</h1>
          <p className="text-gray-600 text-center mb-8">
            Login to access the BI acceleration platform
          </p>
        </div>

        {/* Login Switcher Buttons - moved here */}
        <div className="flex gap-2 justify-center mb-6">
          <Button
            variant="default"
            className="bg-brand-500 hover:bg-brand-600 text-white"
            disabled
          >
            Tableau Login
          </Button>
          <Button
            variant="outline"
            onClick={handleMicrostrategyRedirect}
            className="bg-[#FFC89B] hover:bg-[#FFB578] text-white border-none px-6 py-2 rounded-md"
          >
            Microstrategy Login
          </Button>
        </div>
        
        <Card className="p-6 shadow-lg border border-gray-200 bg-gradient-to-br from-orange-50 to-white">
          <form onSubmit={handleTableauLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-gray-300 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-gray-300 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <span className="animate-spin mr-2">⟳</span> Signing in...
                  </div>
                ) : (
                  'Log in with Tableau'
                )}
              </Button>
                             <Link 
                 to="http://localhost:8081/login" 
                 className="text-orange-500 hover:text-orange-600 text-sm text-center font-medium"
               >
                 Log in to Microstrategy?
               </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
