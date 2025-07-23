import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { apiService } from '../services/api';

// Updated Calculation interface to include dataType and sheet
interface Calculation {
  id: string;
  name: string;
  formula: string;
  type: 'measure' | 'dimension' | 'parameter';
  complexity: 'simple' | 'medium' | 'complex';
  description?: string;
  dataType?: string;
  sheet?: string;
  role?: string;
}

interface DaxConversion {
  id: string;
  calculationId: string;
  daxFormula: string;
  status: 'converted' | 'error' | 'warning';
  notes?: string;
}

// Mock DAX conversions for demo purposes
const generateMockDaxConversions = (calculations: Calculation[]): DaxConversion[] => {
  return calculations.map(calc => ({
    id: `dax-${calc.id}`,
    calculationId: calc.id,
    daxFormula: `${calc.name} = ${calc.formula.replace(/\[/g, 'Table[').replace(/SUM/g, 'SUM')}`,
    status: 'converted' as const,
    notes: calc.type === 'measure' ? 'Converted as DAX measure' : undefined
  }));
};

export const CustomCalculationPage: React.FC = () => {
  const [selectedCalculations, setSelectedCalculations] = useState<string[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<{id: string, name: string} | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [daxConversions, setDaxConversions] = useState<DaxConversion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Simplified fetchWorkbookCalculations
  const fetchWorkbookCalculations = async (workbookId: string, workbookName: string) => {
    setIsLoading(true);
    setApiError(null);
    
    console.log(`Fetching calculations for workbook: ${workbookName}`);
    
    try {
      const calculationsResponse = await apiService.getWorkbookCalculations(workbookId, workbookName);
      
      console.log("API Response:", calculationsResponse);
      
      if (calculationsResponse && calculationsResponse.calculations && calculationsResponse.calculations.length > 0) {
        console.log(`Found ${calculationsResponse.calculations.length} calculations`);
        setCalculations(calculationsResponse.calculations);
        
        // Generate mock DAX conversions
        const mockDax = generateMockDaxConversions(calculationsResponse.calculations);
        setDaxConversions(mockDax);
        
        toast({
          title: "Calculations Loaded",
          description: `Successfully loaded ${calculationsResponse.calculations.length} calculations`
        });
      } else {
        // No calculations found
        console.log('No calculations found for this workbook');
        setCalculations([]);
        setDaxConversions([]);
        
        toast({
          title: "No Calculations Found",
          description: `No custom calculations found in workbook "${workbookName}"`
        });
      }
    } catch (error) {
      console.error("Error fetching workbook calculations:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setApiError(`Failed to fetch calculations: ${errorMessage}`);
      
      setCalculations([]);
      setDaxConversions([]);
      
      toast({
        title: "Error Loading Calculations",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified useEffect
  useEffect(() => {
    const workbookId = searchParams.get('workbookId');
    const workbookName = searchParams.get('workbookName');
    
    if (workbookId && workbookName && workbookName !== 'undefined') {
      const decodedWorkbookName = decodeURIComponent(workbookName);
      const workbook = {
        id: workbookId,
        name: decodedWorkbookName
      };
      
      setSelectedDashboard(workbook);
      fetchWorkbookCalculations(workbookId, decodedWorkbookName);
    } else {
      setApiError("No workbook selected. Please select a workbook to view its custom calculations.");
      setIsLoading(false);
    }
  }, [searchParams]);

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
    if (selectedDashboard && selectedDashboard.name) {
      toast({
        title: "Refreshing",
        description: "Reloading custom calculations..."
      });
      fetchWorkbookCalculations(selectedDashboard.id, selectedDashboard.name);
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
          {selectedDashboard && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground truncate max-w-xs">
                {selectedDashboard.name}
              </span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">
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
              disabled={isLoading || !selectedDashboard}
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
              {selectedDashboard 
                ? `Workbook: ${selectedDashboard.name}`
                : 'No workbook selected'
              }
            </span>
            {!isLoading && calculations.length > 0 && (
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
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-destructive/80 mt-2">{apiError}</p>
            </div>
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
                Custom calculations found in this workbook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">Loading Calculations</p>
                    <p className="text-sm text-muted-foreground">Fetching custom calculations from Tableau server...</p>
                  </div>
                ) : calculations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
                    <Calculator className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-3">
                      {apiError ? 'Error Loading Calculations' : 'No Calculations Found'}
                    </h3>
                    <div className="max-w-md mx-auto text-muted-foreground space-y-3">
                      {apiError ? (
                        <p className="text-destructive font-medium">{apiError}</p>
                      ) : (
                        <p>
                          {selectedDashboard
                            ? `No custom calculations found in workbook "${selectedDashboard.name}"`
                            : 'Select a workbook to view its custom calculations'
                          }
                        </p>
                      )}
                    </div>
                    {selectedDashboard?.name && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh}
                        className="gap-2 mt-6"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retry
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
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {calculation.dataType || 'Unknown Type'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          {calculation.sheet && (
                            <div className="text-xs text-muted-foreground mb-2">
                              Sheet: {calculation.sheet}
                            </div>
                          )}
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
              <ScrollArea className="h-[500px] pr-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">Processing Conversions</p>
                    <p className="text-sm text-muted-foreground">Converting Tableau calculations to Power BI DAX...</p>
                  </div>
                ) : selectedCalculations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
                    <ArrowRight className="h-16 w-16 text-orange-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-3">No Calculations Selected</h3>
                    <div className="max-w-md mx-auto text-muted-foreground space-y-3">
                      <p>
                        {calculations.length === 0 
                          ? 'Load calculations from a workbook first, then select them to see DAX conversions'
                          : 'Select calculations from the left panel to see their Power BI DAX equivalents'
                        }
                      </p>
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
                                <Check className="h-4 w-4 text-success" />
                                <CardTitle className="text-base font-medium">
                                  {originalCalc?.name}
                                </CardTitle>
                              </div>
                              <Badge variant="default">
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(conversion.daxFormula);
                                  }}
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

        {/* Bottom Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <Button 
            variant="outline" 
            onClick={handleBackToWorkbooks}
            className="gap-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to Workbooks
          </Button>
          {calculations.length > 0 && (
            <Button 
              disabled={selectedCalculations.length === 0}
              onClick={exportDaxFormulas}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Selected DAX ({selectedCalculations.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomCalculationPage;