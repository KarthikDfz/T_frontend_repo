import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  ArrowRight, 
  Copy, 
  Download, 
  Check, 
  FileSpreadsheet,
  Zap,
  Database,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService, Calculation } from '../services/api';

interface DaxConversion {
  id: string;
  calculationId: string;
  daxFormula: string;
  status: 'converted' | 'error' | 'warning';
  notes?: string;
}

// Mock data - will be used as fallback if API fails
const mockCalculations: Calculation[] = [
  {
    id: '1',
    name: 'Total Sales',
    formula: 'SUM([Sales])',
    type: 'measure',
    complexity: 'simple',
    description: 'Sum of all sales values'
  },
  {
    id: '2',
    name: 'Sales Growth Rate',
    formula: '([Sales] - LOOKUP([Sales], -1)) / LOOKUP([Sales], -1)',
    type: 'measure',
    complexity: 'complex',
    description: 'Year-over-year sales growth percentage'
  },
  {
    id: '3',
    name: 'Customer Segment',
    formula: 'IF [Sales] > 10000 THEN "High Value" ELSE "Standard" END',
    type: 'dimension',
    complexity: 'medium',
    description: 'Customer segmentation based on sales volume'
  },
  {
    id: '4',
    name: 'Moving Average',
    formula: 'WINDOW_AVG(SUM([Sales]), -2, 0)',
    type: 'measure',
    complexity: 'complex',
    description: '3-period moving average of sales'
  }
];

const mockDaxConversions: DaxConversion[] = [
  {
    id: '1',
    calculationId: '1',
    daxFormula: 'Total Sales = SUM(Sales[Sales])',
    status: 'converted'
  },
  {
    id: '2',
    calculationId: '2',
    daxFormula: 'Sales Growth Rate = DIVIDE([Total Sales] - CALCULATE([Total Sales], DATEADD(Date[Date], -1, YEAR)), CALCULATE([Total Sales], DATEADD(Date[Date], -1, YEAR)))',
    status: 'converted',
    notes: 'Requires proper date table relationship'
  },
  {
    id: '3',
    calculationId: '3',
    daxFormula: 'Customer Segment = IF(Sales[Sales] > 10000, "High Value", "Standard")',
    status: 'converted'
  },
  {
    id: '4',
    calculationId: '4',
    daxFormula: 'Moving Average = AVERAGEX(DATESINPERIOD(Date[Date], LASTDATE(Date[Date]), -3, MONTH), [Total Sales])',
    status: 'warning',
    notes: 'Requires date table with proper relationships'
  }
];

export const CustomCalculationPage: React.FC = () => {
  const [selectedCalculations, setSelectedCalculations] = useState<string[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<{id: string, name: string, workbook?: string, projectId?: string} | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [daxConversions, setDaxConversions] = useState<DaxConversion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get workbook information from URL parameters first
    const workbookId = searchParams.get('workbookId');
    const workbookName = searchParams.get('workbookName');
    const projectId = searchParams.get('projectId');
    
    // Also check for dashboard parameters (for backward compatibility)
    const dashboardId = searchParams.get('dashboardId');
    const dashboardName = searchParams.get('dashboardName');
    
    console.log("URL Parameters:", { workbookId, workbookName, projectId, dashboardId, dashboardName });
    console.log("Current URL:", window.location.href);
    
    // Validate workbook parameters and handle different scenarios
    if (workbookId && workbookId !== 'undefined' && workbookId !== 'null' && workbookName && workbookName !== 'undefined') {
      // If workbook info is provided and valid, use it and fetch workbook calculations
      const workbook = {
        id: workbookId,
        name: decodeURIComponent(workbookName),
        workbook: decodeURIComponent(workbookName),
        projectId: projectId && projectId !== 'undefined' ? projectId : undefined
      };
      
      console.log("Setting selected workbook from URL:", workbook);
      setSelectedDashboard(workbook);
      
      // Store in localStorage for persistence
      localStorage.setItem('selectedWorkbook', JSON.stringify(workbook));
      
      // Fetch calculations for this workbook
      fetchWorkbookCalculations(workbookId);
    } else if ((workbookId === 'undefined' || workbookId === 'null' || !workbookId) && workbookName) {
      // Handle cases where workbookId is explicitly undefined/null but we have a name
      console.error("Invalid workbook ID received:", workbookId, "but have name:", workbookName);
      setApiError("Invalid workbook selected. The workbook ID is missing or invalid. Please select a different workbook.");
      setSelectedDashboard({ id: 'invalid', name: workbookName ? decodeURIComponent(workbookName) : 'Invalid Workbook' });
      setCalculations([]);
      setDaxConversions([]);
      setIsLoading(false);
      
      toast({
        title: "Invalid Workbook",
        description: "The selected workbook has an invalid ID. Please go back and select a different workbook.",
        variant: "destructive"
      });
    } else if (dashboardId && dashboardName) {
      // Backward compatibility for dashboard-level calculations
      const dashboard = {
        id: dashboardId,
        name: dashboardName,
        workbook: workbookName || undefined
      };
      
      console.log("Setting selected dashboard:", dashboard);
      setSelectedDashboard(dashboard);
      
      // Store in localStorage for persistence
      localStorage.setItem('selectedDashboard', JSON.stringify(dashboard));
      
      // Fetch calculations for this dashboard
      fetchCalculations(dashboardId);
    } else {
      // Check localStorage for workbook or dashboard info if not in URL
      console.log("No valid params in URL, checking localStorage");
      const workbookData = localStorage.getItem('selectedWorkbook');
      const dashboardData = localStorage.getItem('selectedDashboard');
      
      if (workbookData) {
        try {
          const workbook = JSON.parse(workbookData);
          console.log("Found workbook in localStorage:", workbook);
          
          // Validate localStorage workbook ID
          if (!workbook.id || workbook.id === 'undefined' || workbook.id === 'null') {
            console.error("Invalid workbook ID in localStorage:", workbook);
            handleFallback();
            return;
          }
          
          setSelectedDashboard(workbook);
          fetchWorkbookCalculations(workbook.id);
        } catch (e) {
          console.error("Error parsing workbook data:", e);
          handleFallback();
        }
      } else if (dashboardData) {
        try {
          const dashboard = JSON.parse(dashboardData);
          console.log("Found dashboard in localStorage:", dashboard);
          setSelectedDashboard(dashboard);
          fetchCalculations(dashboard.id);
        } catch (e) {
          console.error("Error parsing dashboard data:", e);
          handleFallback();
        }
      } else {
        handleFallback();
      }
    }
  }, [searchParams]);

  const handleFallback = () => {
    console.log("No workbook or dashboard found, redirecting to workbooks page");
    setApiError("No workbook selected. Please select a workbook to view its custom calculations.");
    setSelectedDashboard({ id: 'none', name: 'No Workbook Selected' });
    setCalculations([]);
    setDaxConversions([]);
    setIsLoading(false);
    
    // Show guidance toast
    toast({
      title: "No Workbook Selected",
      description: "Please select a workbook from the workbooks page to view its custom calculations.",
      variant: "default"
    });
  };

  const fetchWorkbookCalculations = async (workbookId: string) => {
    setIsLoading(true);
    setApiError(null);
    
    console.log(`Fetching calculations for workbook ID: ${workbookId}`);
    
    // Validate workbook ID before making API call
    if (!workbookId || workbookId === 'undefined' || workbookId === 'null' || workbookId.startsWith('fallback-')) {
      const errorMsg = workbookId?.startsWith('fallback-') 
        ? 'This workbook has a temporary ID and cannot be used to fetch calculations from Tableau server.'
        : 'Invalid workbook ID. Cannot fetch calculations.';
      
      setApiError(errorMsg);
      setCalculations([]);
      setDaxConversions([]);
      setIsLoading(false);
      
      toast({
        title: "Invalid Workbook ID",
        description: errorMsg + " Please select a different workbook.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Fetch calculations from the API for the workbook
      toast({
        title: "Loading Calculations",
        description: `Fetching calculations for ${selectedDashboard?.name || 'workbook'}...`
      });
      
      console.log(`API call: GET /workbooks/${workbookId}/calculations`);
      const calculationsResponse = await apiService.getWorkbookCalculations(workbookId);
      
      console.log("API Response:", calculationsResponse);
      
      if (calculationsResponse && calculationsResponse.calculations && calculationsResponse.calculations.length > 0) {
        console.log(`Found ${calculationsResponse.calculations.length} calculations`);
        
        const apiCalculations = calculationsResponse.calculations.map((calc: any) => ({
          id: calc.id,
          name: calc.name || 'Unnamed Calculation',
          formula: calc.formula || 'N/A',
          type: calc.type || 'measure',
          complexity: calc.complexity || 'medium',
          description: calc.description || 'No description available'
        }));
        
        setCalculations(apiCalculations);
        
        // Convert to DAX format immediately for all calculations
        await convertCalculationsToDax(apiCalculations);
        
        toast({
          title: "Calculations Loaded",
          description: `Successfully loaded ${apiCalculations.length} calculations from Tableau server`
        });
      } else {
        // No calculations found for this workbook
        console.log('No calculations found for this workbook');
        setCalculations([]);
        setDaxConversions([]);
        setApiError(null); // Clear any previous errors
        
        toast({
          title: "No Calculations Found",
          description: `No custom calculations found in workbook "${selectedDashboard?.name}"`
        });
      }
    } catch (error) {
      console.error("Error fetching workbook calculations:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setApiError(`Failed to fetch calculations from Tableau server: ${errorMessage}`);
      
      // Clear calculations on error
      setCalculations([]);
      setDaxConversions([]);
      
      toast({
        title: "Error Loading Calculations",
        description: `Failed to fetch calculations for workbook "${selectedDashboard?.name}". Please check your Tableau connection.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const convertCalculationsToDax = async (apiCalculations: Calculation[]) => {
    if (apiCalculations.length > 0) {
      try {
        console.log("Converting calculations to DAX...");
        const calculationIds = apiCalculations.map(calc => calc.id);
        console.log("Calculation IDs for conversion:", calculationIds);
        
        console.log("API call: POST /convert-to-dax");
        const daxResponse = await apiService.convertToDax(calculationIds);
        
        console.log("DAX Conversion Response:", daxResponse);
        
        if (daxResponse && daxResponse.conversions && daxResponse.conversions.length > 0) {
          console.log(`Successfully converted ${daxResponse.conversions.length} expressions to DAX`);
          
          const apiDaxConversions = daxResponse.conversions.map((dax: any) => ({
            id: dax.id,
            calculationId: dax.calculation_id,
            daxFormula: dax.dax_formula,
            status: dax.status || 'converted',
            notes: dax.notes
          }));
          
          setDaxConversions(apiDaxConversions);
          
          toast({
            title: "DAX Conversion Complete",
            description: `Successfully converted ${apiDaxConversions.length} calculations to DAX`
          });
        } else {
          // No conversions returned from API
          console.warn('No DAX conversions returned from API');
          setDaxConversions([]);
          
          toast({
            title: "DAX Conversion Failed",
            description: "Could not convert calculations to DAX. The conversion service may be unavailable.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error converting to DAX:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Clear DAX conversions on error
        setDaxConversions([]);
        
        toast({
          title: "DAX Conversion Error",
          description: `Failed to convert calculations to DAX: ${errorMessage}`,
          variant: "destructive"
        });
      }
    } else {
      setDaxConversions([]);
    }
  };

  const fetchCalculations = async (dashboardId: string) => {
    setIsLoading(true);
    setApiError(null);
    
    console.log(`Fetching calculations for dashboard ID: ${dashboardId}`);
    
    try {
      // Fetch calculations from the API
      toast({
        title: "Loading Calculations",
        description: `Fetching calculations for ${selectedDashboard?.name || 'dashboard'}...`
      });
      
      console.log(`API call: GET /dashboards/${dashboardId}/calculations`);
      const calculationsResponse = await apiService.getDashboardCalculations(dashboardId);
      
      console.log("API Response:", calculationsResponse);
      
      if (calculationsResponse && calculationsResponse.calculations && calculationsResponse.calculations.length > 0) {
        console.log(`Found ${calculationsResponse.calculations.length} calculations`);
        
        const apiCalculations = calculationsResponse.calculations.map((calc: any) => ({
          id: calc.id,
          name: calc.name || 'Unnamed Calculation',
          formula: calc.formula || 'N/A',
          type: calc.type || 'measure',
          complexity: calc.complexity || 'medium',
          description: calc.description || 'No description available'
        }));
        
        setCalculations(apiCalculations);
        
        // Convert to DAX format immediately for all calculations
        await convertCalculationsToDax(apiCalculations);
        
        toast({
          title: "Calculations Loaded",
          description: `Successfully loaded ${apiCalculations.length} calculations from Tableau server`
        });
      } else {
        // No calculations found for this dashboard
        console.log('No calculations found for this dashboard');
        setCalculations([]);
        setDaxConversions([]);
        setApiError(null); // Clear any previous errors
        
        toast({
          title: "No Calculations Found",
          description: `No custom calculations found in dashboard "${selectedDashboard?.name}"`
        });
      }
    } catch (error) {
      console.error("Error fetching calculations:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setApiError(`Failed to fetch calculations from Tableau server: ${errorMessage}`);
      
      // Clear calculations on error
      setCalculations([]);
      setDaxConversions([]);
      
      toast({
        title: "Error Loading Calculations",
        description: `Failed to fetch calculations for dashboard "${selectedDashboard?.name}". Please check your Tableau connection.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculationSelect = (id: string) => {
    setSelectedCalculations(prev => 
      prev.includes(id) ? prev.filter(calcId => calcId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedCalculations(
      selectedCalculations.length === calculations.length 
        ? [] 
        : calculations.map(calc => calc.id)
    );
  };

  const getSelectedDaxConversions = () => {
    return daxConversions.filter(conversion => 
      selectedCalculations.includes(conversion.calculationId)
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "DAX formula has been copied to your clipboard.",
    });
  };

  const exportDaxFormulas = () => {
    const selectedConversions = getSelectedDaxConversions();
    const exportText = selectedConversions.map(conversion => {
      const calculation = calculations.find(calc => calc.id === conversion.calculationId);
      return `// ${calculation?.name}\n${conversion.daxFormula}\n`;
    }).join('\n');
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dax_formulas.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "DAX formulas have been exported to a text file.",
    });
  };

  const handleBackToWorkbooks = () => {
    navigate('/workbooks');
  };

  const handleRefresh = () => {
    if (selectedDashboard && selectedDashboard.id !== 'invalid' && selectedDashboard.id !== 'none') {
      toast({
        title: "Refreshing",
        description: "Reloading custom calculations..."
      });
      // Determine if it's a workbook or dashboard and call the appropriate fetch function
      if (selectedDashboard.workbook) {
        fetchWorkbookCalculations(selectedDashboard.id);
      } else {
        fetchCalculations(selectedDashboard.id);
      }
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'complex': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'measure': return <Calculator className="h-4 w-4" />;
      case 'dimension': return <Database className="h-4 w-4" />;
      case 'parameter': return <Zap className="h-4 w-4" />;
      default: return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'converted': return <Check className="h-4 w-4 text-success" />;
      case 'warning': return <Zap className="h-4 w-4 text-warning" />;
      case 'error': return <Database className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button variant="link" className="p-0 h-auto" asChild>
            <Link to="/">Home</Link>
          </Button>
          <ChevronRight className="h-4 w-4" />
          <Button variant="link" className="p-0 h-auto" asChild>
            <Link to="/workbooks">Workbooks</Link>
          </Button>
          {selectedDashboard && selectedDashboard.name !== 'No Workbook Selected' && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground truncate max-w-xs">
                {selectedDashboard.name}
              </span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground truncate max-w-xs">
                Custom Calculations
              </span>
            </>
          )}
          {(!selectedDashboard || selectedDashboard.name === 'No Workbook Selected') && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground truncate max-w-xs">
                Custom Calculations
              </span>
            </>
          )}
        </div>
        
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Tableau to Power BI Migration
            </h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || !selectedDashboard || selectedDashboard.name === 'No Workbook Selected'}
              className="ml-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Convert custom calculations and formulas seamlessly from Tableau to Power BI DAX
          </p>
          
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                         <span className="font-medium">
               {selectedDashboard && selectedDashboard.name !== 'No Workbook Selected' 
                 ? `Workbook: ${selectedDashboard.name}`
                 : 'No workbook selected'
               }
             </span>
            {calculations.length > 0 && (
              <>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <span className="text-sm">{calculations.length} calculation(s) found</span>
              </>
            )}
          </div>
          
          {/* Display API error if any */}
          {apiError && (
            <div className="max-w-2xl mx-auto p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Connection Error</span>
              </div>
              <p className="text-sm text-destructive/80 mt-2">{apiError}</p>
            </div>
          )}
          
          {/* Debug information in development */}
          {process.env.NODE_ENV === 'development' && selectedDashboard && (
            <details className="max-w-md mx-auto text-left">
              <summary className="cursor-pointer text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                🔍 Debug Info (Development Only)
              </summary>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs space-y-1 text-blue-600">
                <div><strong>ID:</strong> {selectedDashboard.id}</div>
                <div><strong>Name:</strong> {selectedDashboard.name}</div>
                <div><strong>ProjectId:</strong> {selectedDashboard.projectId || 'N/A'}</div>
                <div><strong>URL workbookId:</strong> {searchParams.get('workbookId')}</div>
                <div><strong>URL workbookName:</strong> {searchParams.get('workbookName')}</div>
              </div>
            </details>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Container 1: Custom Calculations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Tableau Calculations
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                  disabled={isLoading || calculations.length === 0}
                >
                  {selectedCalculations.length === calculations.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardTitle>
              <CardDescription>
                Custom calculations found in this dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <div className="relative">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Calculator className="h-8 w-8 text-primary" />
                      </div>
                      <Loader2 className="absolute inset-0 w-16 h-16 animate-spin text-primary opacity-75" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-2">Loading Calculations</p>
                    <p className="text-sm text-muted-foreground">Fetching custom calculations from Tableau server...</p>
                  </div>
                ) : calculations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/60 rounded-full flex items-center justify-center mb-6 border-4 border-muted/30">
                      <Calculator className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {apiError ? 'Error Loading Calculations' : 'No Calculations Found'}
                    </h3>
                    <div className="max-w-md mx-auto text-muted-foreground space-y-3">
                      {apiError ? (
                        <>
                          <p className="text-destructive font-medium">{apiError}</p>
                          <p className="text-sm">Check your Tableau server connection and ensure the workbook contains custom calculations.</p>
                        </>
                      ) : (
                        <>
                          <p>
                            {selectedDashboard && selectedDashboard.name !== 'No Workbook Selected'
                              ? `No custom calculations found in "${selectedDashboard.name}"`
                              : 'Select a workbook to view its custom calculations'
                            }
                          </p>
                          <p className="text-sm">Custom calculations include computed fields, parameters, and calculated measures.</p>
                        </>
                      )}
                    </div>
                    {apiError && (
                      <div className="flex gap-3 mt-6">
                        {selectedDashboard?.id !== 'invalid' && selectedDashboard?.id !== 'none' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRefresh}
                            className="gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Retry
                          </Button>
                        )}
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleBackToWorkbooks}
                          className="gap-2"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                          Back to Workbooks
                        </Button>
                      </div>
                    )}
                    {!apiError && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleBackToWorkbooks}
                        className="gap-2 mt-6"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        Browse Workbooks
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {calculations.map(calculation => (
                      <Card 
                        key={calculation.id}
                        className={`cursor-pointer border transition-colors ${
                          selectedCalculations.includes(calculation.id) ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleCalculationSelect(calculation.id)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(calculation.type)}
                              <CardTitle className="text-base font-medium">{calculation.name}</CardTitle>
                            </div>
                            <Badge variant="secondary" className={`${getComplexityColor(calculation.complexity)}`}>
                              {calculation.complexity}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="mt-2 text-sm text-muted-foreground">
                            {calculation.description}
                          </div>
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">Tableau Formula:</div>
                            <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-x-auto">
                              {calculation.formula}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Container 2: DAX Conversions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Power BI DAX Conversions
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={selectedCalculations.length === 0 || isLoading}
                  onClick={exportDaxFormulas}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : 
                  selectedCalculations.length > 0 
                    ? `${selectedCalculations.length} calculation(s) selected for conversion`
                    : 'Select Tableau calculations to see DAX conversions'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <div className="relative">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Zap className="h-8 w-8 text-primary" />
                      </div>
                      <Loader2 className="absolute inset-0 w-16 h-16 animate-spin text-primary opacity-75" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-2">Processing Conversions</p>
                    <p className="text-sm text-muted-foreground">Converting Tableau calculations to Power BI DAX...</p>
                  </div>
                ) : selectedCalculations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-6 border-4 border-orange-200">
                      <ArrowRight className="h-10 w-10 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">No Calculations Selected</h3>
                    <div className="max-w-md mx-auto text-muted-foreground space-y-3">
                      <p>
                        {calculations.length === 0 
                          ? 'Load calculations from a workbook first, then select them to see DAX conversions'
                          : 'Select calculations from the left panel to see their Power BI DAX equivalents here'
                        }
                      </p>
                      <p className="text-sm">DAX (Data Analysis Expressions) is the formula language used in Power BI for creating custom calculations.</p>
                      {calculations.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleSelectAll}
                          className="gap-2 mt-4"
                        >
                          <Check className="h-4 w-4" />
                          Select All Calculations
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getSelectedDaxConversions().map(conversion => {
                      const originalCalc = calculations.find(
                        calc => calc.id === conversion.calculationId
                      );
                      
                      return (
                        <Card key={conversion.id}>
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(conversion.status)}
                                <CardTitle className="text-base font-medium">
                                  {originalCalc?.name}
                                </CardTitle>
                              </div>
                              <Badge variant={
                                conversion.status === 'converted' ? 'default' :
                                conversion.status === 'warning' ? 'secondary' :
                                'destructive'
                              }>
                                {conversion.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="mt-2">
                              <div className="text-xs text-muted-foreground mb-1">DAX Formula:</div>
                              <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-x-auto flex justify-between items-start group">
                                <div>{conversion.daxFormula}</div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100"
                                  onClick={() => copyToClipboard(conversion.daxFormula)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {conversion.notes && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                <span className="font-medium">Note:</span> {conversion.notes}
                              </div>
                            )}
                            <div className="mt-2 pt-2 border-t text-xs flex justify-between text-muted-foreground">
                              <div>Conversion quality: High</div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Bottom section: Migration progress and actions */}
        <Card className="mt-8 bg-gradient-to-r from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Migration Actions
            </CardTitle>
            <CardDescription>
              Export and apply your converted DAX formulas to Power BI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Actions Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Available Actions</h4>
                <div className="space-y-3">
                  <Button 
                    disabled={selectedCalculations.length === 0 || isLoading}
                    className="w-full justify-start gap-2"
                    onClick={exportDaxFormulas}
                  >
                    <Download className="h-4 w-4" />
                    Export Selected DAX ({selectedCalculations.length})
                  </Button>
                  <Button 
                    variant="outline" 
                    disabled={selectedCalculations.length === 0 || isLoading}
                    className="w-full justify-start gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Preview in Power BI Desktop
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleBackToWorkbooks}
                    className="w-full justify-start gap-2"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Back to Workbooks
                  </Button>
                </div>
              </div>
              
              {/* Summary Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Migration Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Calculations</span>
                    <span className="font-medium">{calculations.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Selected for Export</span>
                    <span className="font-medium">{selectedCalculations.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">DAX Conversions Ready</span>
                    <span className="font-medium">{getSelectedDaxConversions().length}</span>
                  </div>
                  {selectedCalculations.length > 0 && (
                    <div className="pt-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(getSelectedDaxConversions().length / selectedCalculations.length) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((getSelectedDaxConversions().length / selectedCalculations.length) * 100)}% conversion success rate
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomCalculationPage;