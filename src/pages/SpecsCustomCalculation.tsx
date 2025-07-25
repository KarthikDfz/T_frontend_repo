import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Code, Search, Info, ChevronRight, FileText, Calculator, Loader2, RefreshCw, Download, Plus } from 'lucide-react';
import { apiService } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FilteredItem {
  id: string;
  name: string;
}

interface ConvertedExpression {
  id: string;
  name: string;
  tableau_expression: string;
  powerbi_expression: string;
  form_name?: string;
}

const SpecsCustomCalculationPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<any>(null);
  const [selectedCalculations, setSelectedCalculations] = useState<string[]>([]);
  const [convertedCalculations, setConvertedCalculations] = useState<ConvertedExpression[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCachedData, setUseCachedData] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  useEffect(() => {
    const storedSpec = localStorage.getItem('selectedSpec');
    if (storedSpec) {
      setSelectedSpec(JSON.parse(storedSpec));
    }
  }, [navigate]);
  
  // Query for cached data
  const { 
    data: cachedCalculations, 
    isLoading: isLoadingCachedCalculations,
    refetch: refetchCachedCalculations
  } = useQuery({
    queryKey: ['cached_calculations', selectedSpec?.id],
    queryFn: () => selectedSpec ? apiService.getCachedMetrics(selectedSpec.id) : Promise.resolve([]),
    enabled: !!selectedSpec && useCachedData,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Queries for live data (only used if cached data is not available or user chooses not to use it)
  const { 
    data: filteredCalculations, 
    isLoading: isLoadingCalculations,
    isFetching: isFetchingCalculations
  } = useQuery({
    queryKey: ['filtered_calculations', selectedSpec?.id],
    queryFn: () => selectedSpec ? apiService.getFilteredMetrics(selectedSpec.id) : Promise.resolve([]),
    enabled: !!selectedSpec && !useCachedData,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: existingCalculations } = useQuery({
    queryKey: ['converted_calculations', selectedSpec?.id],
    queryFn: () => selectedSpec ? apiService.getConvertedMetrics(selectedSpec.id) : Promise.resolve([]),
    enabled: !!selectedSpec,
  });

  // Decide which data to use - cached or live
  const calculationsData = useCachedData ? cachedCalculations : filteredCalculations;
  const isLoadingObjectsData = useCachedData 
    ? isLoadingCachedCalculations
    : (isLoadingCalculations || isFetchingCalculations);

  // Mutations for background processing
  const processCalculationsMutation = useMutation({
    mutationFn: (specId: string) => apiService.startMetricsBackgroundProcess(specId),
    onSuccess: () => {
      toast({
        title: "Background Processing Started",
        description: "Custom calculations are being processed in the background.",
      });
    },
    onError: (error) => {
      console.error('Error starting background process for calculations:', error);
      toast({
        title: "Error",
        description: "Failed to start background processing for calculations.",
        variant: "destructive",
      });
    },
  });

  const convertCalculationsMutation = useMutation({
    mutationFn: (calculationIds: string[]) => 
      apiService.batchConvertMetricsToPowerBI(selectedSpec!.id, calculationIds),
    onSuccess: (data) => {
      setConvertedCalculations(prev => [...prev, ...data]);
      setIsConverting(false);
    },
    onError: (error) => {
      console.error('Error converting calculations:', error);
      setIsConverting(false);
    },
  });
  
  useEffect(() => {
    if (existingCalculations) {
      setConvertedCalculations(existingCalculations);
    }
  }, [existingCalculations]);
  
  const filteredCalculationsList = calculationsData?.filter(calc => 
    calc.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCalculationToggle = (id: string) => {
    setSelectedCalculations(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAllCalculations = (checked: boolean) => {
    if (checked) {
      setSelectedCalculations(filteredCalculationsList.map(calc => calc.id));
    } else {
      setSelectedCalculations([]);
    }
  };

  const handleConvert = async () => {
    if (!selectedSpec) return;
    
    setIsConverting(true);
    
    // Filter out already converted items
    const existingCalculationIds = new Set(convertedCalculations.map(calc => calc.id));
    const newCalculationIds = selectedCalculations.filter(id => !existingCalculationIds.has(id));
    
    if (newCalculationIds.length > 0) {
      convertCalculationsMutation.mutate(newCalculationIds);
    }
    
    // Clear selections after conversion
    setSelectedCalculations([]);
  };

  const handleGetObjects = async () => {
    if (!selectedSpec) return;
    
    setIsProcessing(true);
    toast({
      title: "Processing Started",
      description: "Starting background processing of custom calculations.",
    });
    
    // Start background processing
    try {
      await processCalculationsMutation.mutateAsync(selectedSpec.id);
      // Start polling for cached data
      startPollingForCachedData();
      toast({
        title: "Processing In Progress",
        description: "Background processing has started. Data will load automatically when ready.",
      });
    } catch (error) {
      console.error("Error starting background processes:", error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to start background processing for calculations.",
        variant: "destructive",
      });
    }
  };

  const startPollingForCachedData = () => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(() => {
      refetchCachedCalculations();
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isProcessing) {
      stopPolling();
    }
  }, [isProcessing]);

  const handleDownloadPowerBIExpressions = async () => {
    if (!selectedSpec) return;
    setIsDownloading(true);
    try {
      await apiService.downloadPowerBIExpressions(selectedSpec.id);
      toast({
        title: "Download Started",
        description: "Your Power BI expressions are being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download Power BI expressions.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!selectedSpec) {
    return (
      <div className="container max-w-6xl mx-auto animate-fade-in">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
            <Code className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">No Spec Selected</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Please select a spec from the Specs page to view custom calculations.
          </p>
          <Button 
            asChild
            variant="default"
            className="mt-6"
          >
            <Link to="/specs">Go to Specs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = isLoadingObjectsData;
  const totalSelected = selectedCalculations.length;

  return (
    <div className="container px-4 mx-auto animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/">Home</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to="/specs">Specs</Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link to={selectedSpec ? `/specs/${selectedSpec.id}/resources` : '/specs'}>
            Project Resources{selectedSpec ? ` (${selectedSpec.name})` : ''}
          </Link>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-xs">
          Custom Calculations
        </span>
      </div>
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-bold mb-1">Custom Calculations</h1>
        <p className="text-muted-foreground mb-6">
          Convert Tableau calculations to Power BI format for seamless migration
        </p>
        {isProcessing && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Processing objects...</span>
              <span className="text-sm">{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for calculations..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGetObjects}
              className="flex items-center gap-2"
              disabled={isProcessing || !selectedSpec}
              variant="outline"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Get Calculations
                </>
              )}
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Export to PDF
            </Button>
          </div>
        </div>
      </div>
      <Tabs defaultValue="selection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="selection">Select Calculations</TabsTrigger>
          <TabsTrigger value="conversions">View Conversions</TabsTrigger>
        </TabsList>
        <TabsContent value="selection">
          {isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Custom Calculations</CardTitle>
                <CardDescription>
                  Loading custom calculations...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Custom Calculations
                    <Badge variant="outline" className="ml-2">
                      {filteredCalculationsList.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Tableau calculations {useCachedData ? "(From Cache)" : ""}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCalculationsList.length > 0 ? (
                  <>
                    <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
                      <Checkbox
                        id="select-all-calculations"
                        checked={selectedCalculations.length === filteredCalculationsList.length && filteredCalculationsList.length > 0}
                        onCheckedChange={handleSelectAllCalculations}
                      />
                      <label
                        htmlFor="select-all-calculations"
                        className="text-sm font-medium leading-none cursor-pointer select-none"
                      >
                        Select All Calculations
                      </label>
                      {selectedCalculations.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {selectedCalculations.length} selected
                        </Badge>
                      )}
                    </div>
                    <ScrollArea className="h-[380px] pr-4">
                      <div className="space-y-3">
                        {filteredCalculationsList.map((calc) => (
                          <div key={calc.id} className="flex items-center space-x-2 py-1 hover:bg-muted/40 px-1 rounded">
                            <Checkbox
                              id={`calc-${calc.id}`}
                              checked={selectedCalculations.includes(calc.id)}
                              onCheckedChange={() => handleCalculationToggle(calc.id)}
                            />
                            <label
                              htmlFor={`calc-${calc.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none flex-1"
                            >
                              {calc.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calculator className="h-10 w-10 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {useCachedData && !cachedCalculations?.length ? (
                        isProcessing ? (
                          <>
                            Searching for custom calculations...<br/>
                            <span className="text-sm mt-2 italic">This may take a few moments</span>
                          </>
                        ) : (
                          <>
                            No cached calculations found. <br />
                            Click "Get Calculations" to search for custom calculations.
                          </>
                        )
                      ) : (
                        "No custom calculations found"
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="conversions">
          <div className="space-y-6">
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleDownloadPowerBIExpressions}
                className="flex items-center gap-2"
                variant="outline"
                disabled={isDownloading || (convertedCalculations.length === 0)}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download as Excel
                  </>
                )}
              </Button>
            </div>
            {convertedCalculations.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Converted Calculations
                    <Badge variant="outline" className="ml-2">
                      {convertedCalculations.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Tableau Expression</TableHead>
                        <TableHead>Power BI Expression</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {convertedCalculations.map((calc) => (
                        <TableRow key={calc.id}>
                          <TableCell className="font-medium">{calc.name}</TableCell>
                          <TableCell className="font-mono text-sm whitespace-pre-wrap break-all max-w-[300px]">{calc.tableau_expression}</TableCell>
                          <TableCell className="font-mono text-sm whitespace-pre-wrap break-all max-w-[300px]">{calc.powerbi_expression}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Code className="h-10 w-10 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No conversions available yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpecsCustomCalculationPage; 