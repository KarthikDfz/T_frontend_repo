import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Database, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const projectType = localStorage.getItem('projectType');
  
  useEffect(() => {
    // Auto-redirect based on authentication type after a short delay
    const redirectTimer = setTimeout(() => {
      if (isAuthenticated && projectType === 'tableau') {
        navigate('/tableau/dashboard');
      } else if (isAuthenticated && projectType === 'microstrategy') {
        navigate('/mstr/dashboard');
      }
    }, 3000); // 3 second delay before auto-redirect
    
    return () => clearTimeout(redirectTimer);
  }, [isAuthenticated, projectType, navigate]);
  
  const handleTableauRedirect = () => {
    if (projectType === 'tableau') {
      navigate('/tableau/dashboard');
    } else {
      // If authenticated with wrong type, log out and redirect to login
      localStorage.clear();
      navigate('/login');
    }
  };
  
  const handleMstrRedirect = () => {
    if (projectType === 'microstrategy') {
      navigate('/mstr/dashboard');
    } else {
      // If authenticated with wrong type, log out and redirect to login
      localStorage.clear();
      navigate('/login');
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to BI Migration Hub</h1>
        <p className="text-muted-foreground">
          Your unified platform for BI tool migration and analytics
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tableau Card */}
        <Card className={`${projectType === 'tableau' ? 'border-primary' : ''} transition-all hover:shadow-md`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tableau Migration Tool
            </CardTitle>
            <CardDescription>
              Convert Tableau dashboards, workbooks, and calculations to Power BI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access tools to analyze Tableau projects, extract metadata, and convert visualizations to 
              Power BI compatible formats. Streamline your migration process with automated conversions 
              and detailed mapping reports.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant={projectType === 'tableau' ? "default" : "outline"} 
              className="w-full" 
              onClick={handleTableauRedirect}
            >
              {projectType === 'tableau' ? 'Continue to Dashboard' : 'Switch to Tableau'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* MicroStrategy Card */}
        <Card className={`${projectType === 'microstrategy' ? 'border-primary' : ''} transition-all hover:shadow-md`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              MicroStrategy Analytics
            </CardTitle>
            <CardDescription>
              Analyze MicroStrategy reports, dossiers, and data models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Explore MicroStrategy projects, extract report definitions, analyze data models, 
              and prepare content for migration. View SQL dependencies and extract metrics for 
              conversion to other platforms.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant={projectType === 'microstrategy' ? "default" : "outline"} 
              className="w-full" 
              onClick={handleMstrRedirect}
            >
              {projectType === 'microstrategy' ? 'Continue to Dashboard' : 'Switch to MicroStrategy'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>You'll be automatically redirected to your dashboard in a few seconds...</p>
      </div>
    </div>
  );
};

export default Home; 