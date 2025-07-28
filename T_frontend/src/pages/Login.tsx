import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [selectedPlatform, setSelectedPlatform] = useState<'tableau' | 'microstrategy'>('tableau');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    if (selectedPlatform === 'tableau') {
      // Set authentication for Tableau project
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', credentials.username);
      localStorage.setItem('projectType', 'tableau');
      
      toast({
        title: "Success",
        description: "Logged into Tableau Migration Tool successfully"
      });
      
      // Redirect to Tableau (localhost:8080)
      if (window.location.port !== '8080') {
        window.location.href = 'http://localhost:8080';
      } else {
        navigate('/');
      }
    } else {
      // Set authentication for MicroStrategy project
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', credentials.username);
      localStorage.setItem('projectType', 'microstrategy');
      
      toast({
        title: "Success", 
        description: "Redirecting to Microstrategy project..."
      });
      
      // Redirect to Microstrategy project (localhost:8081)
      window.location.href = 'http://localhost:8081';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="BI Accelerator Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BI Accelerator</h1>
          <p className="text-gray-600 mt-2">Login to access the BI acceleration platform</p>
        </div>

        <Card className="shadow-lg border-0 bg-orange-50">
          <CardContent className="p-8">
            {/* Platform Toggle */}
            <div className="flex bg-white border border-orange-200 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setSelectedPlatform('tableau')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  selectedPlatform === 'tableau'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tableau
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('microstrategy')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  selectedPlatform === 'microstrategy'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                MicroStrategy
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700 font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    className="h-11 bg-white border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="h-11 bg-white border-orange-200 focus:border-orange-400"
                  />
                </div>
              </div>
              
              <Button 
                type="submit"
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md"
              >
                Log in with {selectedPlatform === 'tableau' ? 'Tableau' : 'MicroStrategy'}
              </Button>
            </form>
          </CardContent>
        </Card> 
      </div>
    </div>
  );
};

export default Login;