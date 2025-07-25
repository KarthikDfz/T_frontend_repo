import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const handleStartMigration = () => {
    // Set authentication for demo purposes
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userId', 'test-user');
    localStorage.setItem('siteId', 'test-site');
    navigate('/projects');
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <div className="w-full max-w-4xl space-y-10 text-center">
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <BarChart3 className="h-16 w-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold">
            Tableau to Power BI Migration Tool
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seamlessly migrate your Tableau workbooks, dashboards, and data sources to Microsoft Power BI
          </p>
        </div>
        
        <div className="flex flex-col items-center space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <h3 className="font-medium mb-1">Quick Analysis</h3>
              <p className="text-sm text-muted-foreground">Analyze Tableau assets for migration readiness</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <h3 className="font-medium mb-1">Smart Conversion</h3>
              <p className="text-sm text-muted-foreground">Intelligent mapping between platforms</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <h3 className="font-medium mb-1">Seamless Export</h3>
              <p className="text-sm text-muted-foreground">Generate Power BI-ready files</p>
            </div>
          </div>
          
          <Button 
            onClick={handleStartMigration} 
            size="lg" 
            className="mt-6 px-8 py-6 text-lg gap-2 group"
          >
            Start Migration
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        <div className="pt-10 border-t border-border/40">
          <p className="text-sm text-muted-foreground">
            © 2024 Visual Insights Migration Tool. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
