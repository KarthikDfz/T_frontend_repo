import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText, Calculator, Database, BookOpen } from 'lucide-react';

const resources = [
  {
    title: 'Workbooks',
    description: 'Browse and explore workbooks in this project',
    icon: BookOpen,
    link: '/specs/workbooks',
  },
  {
    title: 'Dashboards',
    description: 'Access interactive dashboards for this project',
    icon: BarChart3,
    link: '/specs/dashboards',
  },
  {
    title: 'Views/Sheets',
    description: 'Browse and explore views or sheets in this project',
    icon: FileText,
    link: '/specs/sheets',
  },
  {
    title: 'Custom Calculations',
    description: 'Convert and transform custom calculations',
    icon: Calculator,
    link: '/specs/customcalculation',
  },
  {
    title: 'Data Sources',
    description: 'Access and manage data sources',
    icon: Database,
    link: '/specs/datasources',
  },
];

const SpecsProjectResources = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container px-4 mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Button variant="link" className="p-0 h-auto" asChild>
          <a href="/">Home</a>
        </Button>
        <span className="mx-1">&gt;</span>
        <Button variant="link" className="p-0 h-auto" asChild>
          <a href="/specs">Projects</a>
        </Button>
        <span className="mx-1">&gt;</span>
        <span className="font-medium text-foreground truncate max-w-xs">Project Resources</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">Project Resources</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <Card key={resource.title} className="flex flex-col items-start p-6">
            <CardHeader className="p-0 mb-4 flex flex-row items-center gap-3">
              <resource.icon className="h-7 w-7 text-orange-500" />
              <CardTitle className="text-xl font-semibold">{resource.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mb-6">
              <CardDescription className="text-base text-muted-foreground">
                {resource.description}
              </CardDescription>
            </CardContent>
            <Button variant="outline" className="mt-auto" onClick={() => navigate(resource.link)}>
              View
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SpecsProjectResources; 