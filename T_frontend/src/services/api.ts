// API Service for Tableau to Power BI migration

export interface Project {
  id: string;
  name: string;
  description?: string;
  content_permissions?: string;
  parent_id?: string;
}

export interface Workbook {
  id: string;
  name: string;
  description?: string;
  content_url?: string;
  show_tabs?: boolean;
  size?: number;
  created_at?: string;
  updated_at?: string;
  project_id?: string;
  project_name?: string;
  owner_id?: string;
  webpage_url?: string;
  tags?: string[];
  workbook_name?: string;
  workbook_id?: string;  // Add this field
  luid?: string;         // Add this field
}

export interface View {
  id: string;
  name: string;
  content_url?: string;
  workbook_id?: string;
  project_id?: string;
}

export interface Datasource {
  id: string;
  name: string;
  description?: string;
  content_url?: string;
  created_at?: string;
  updated_at?: string;
  project_id?: string;
  project_name?: string;
  owner_id?: string;
  type?: string;
  tags?: string[];
}

export interface Calculation {
  id: string;
  name: string;
  formula: string;
  type: 'measure' | 'dimension' | 'parameter';
  complexity: 'simple' | 'medium' | 'complex';
  description?: string;
  dataType?: string;
  sheet?: string;
}

export interface TableauCredentials {
  server_url: string;
  site_name: string;
  token_name: string;
  token_secret: string;
}

export interface FilteredItem {
  id: string;
  name: string;
}

export interface ConvertedExpression {
  id: string;
  name: string;
  tableau_expression: string;
  powerbi_expression: string;
  form_name?: string;
}

export interface ConvertedAttribute {
  id: string;
  name: string;
  expressions: {
    tableau_expression: string;
    powerbi_expression: string;
  }[];
}

export interface MigrateWorkbookRequest {
  workbook_name: string;
  powerbi_workspace?: string;
  convert_calculated_fields: boolean;
  create_powerbi_model: boolean;
  generate_relationship_code: boolean;
}

export interface MigrateWorkbookResponse {
  status: string;
  workbook_name: string;
  database?: string;
  extraction_time?: string;
  tableau_tables?: {
    table_count: number;
    total_columns: number;
    tables_and_columns: Record<string, any>;
  };
  powerbi_schema?: {
    table_count: number;
    relationship_count: number;
    tables: Record<string, any>;
  };
  relationships?: any[];
  output_files?: {
    tables_json: string;
    powerbi_schema: string;
  };
  dax_conversion?: {
    status: string;
    measures_converted: number;
    measures?: Array<{ name: string; dax_formula: string }>;
    message?: string;
    error?: string;
  };
  powerbi_model?: {
    status: string;
    task_id?: string;
    model_name?: string;
    workspace?: string;
    message: string;
  };
  powerbi_relationship_code?: string;
}

// Base URL for API calls
const API_BASE_URL = 'http://localhost:8001';

// Hardcoded site name
const SITE_NAME = 'datafactztableau';
function getSiteName() {
  return SITE_NAME;
}
class ApiService {
  // Authentication methods
  async authenticate(credentials: TableauCredentials): Promise<any> {
    try {
      // No need to set site name in localStorage
      const response = await fetch(`${API_BASE_URL}/auth/tableau`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Authentication failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tableau/projects/${SITE_NAME}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch projects');
      }
      
      const data = await response.json();
      
      // Handle both nested and non-nested structures
      if (data.projects && Array.isArray(data.projects)) {
      return data.projects;
      } else if (data.projects && data.projects.projects && Array.isArray(data.projects.projects)) {
        // Handle double nested structure
        return data.projects.projects;
      } else {
        console.error('Unexpected projects response format:', data);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  // Workbook methods
  async getAllWorkbooks(projectId?: string): Promise<Workbook[]> {
    try {
      let url = `${API_BASE_URL}/tableau/${SITE_NAME}/workbooks`;
      // If you want to filter by project, you can add a query param (if backend supports it)
      if (projectId) {
        url += `?project_id=${projectId}`;
      }
      
      console.log(`Fetching all workbooks from: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.detail || 'Failed to fetch workbooks');
      }

      const data = await response.json();
      console.log('Raw API Response for all workbooks:', data);
      
      // Log structure of first workbook if available
      if (data.workbooks && data.workbooks.length > 0) {
        console.log('First workbook structure:', data.workbooks[0]);
        console.log('Available keys in first workbook:', Object.keys(data.workbooks[0]));
      }
      
      console.log(`Returning ${data.workbooks?.length || 0} workbooks`);
      return data.workbooks || [];
    } catch (error) {
      console.error('Error fetching workbooks:', error);
      throw error;
    }
  }
  async getWorkbooks(projectId?: string): Promise<Workbook[]> {
    try {
      let url = `${API_BASE_URL}/tableau/${SITE_NAME}/workbooks`;
      // If you want to filter by project, you can add a query param (if backend supports it)
      if (projectId) {
        url += `?project_id=${projectId}`;
      }
      
      console.log(`Fetching workbooks from: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.detail || 'Failed to fetch workbooks');
      }

      let data = await response.json();
      console.log('Raw API Response for workbooks:', data);
      
      // Log structure of first workbook if available
      if (data && data.length > 0) {
        console.log('First workbook structure:', data[0]);
        console.log('Available keys in first workbook:', Object.keys(data[0]));
      }
      
      // filter by project id if projectId is provided
      if(projectId) data = data.filter(wb => wb.project_id === projectId);
      
      console.log(`Returning ${data?.length || 0} workbooks`);
      return data || [];
    } catch (error) {
      console.error('Error fetching workbooks:', error);
      throw error;
    }
  }

  async getWorkbookDetails(workbookId: string): Promise<Workbook> {
    try {
      const response = await fetch(`${API_BASE_URL}/tableau/workbooks/${workbookId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch workbook details');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching workbook details:', error);
      throw error;
    }
  }

  // Views methods
  async getAllViews(workbookId?: string): Promise<View[]> {
    try {
      const url = workbookId 
        ? `${API_BASE_URL}/tableau/${SITE_NAME}/views?workbook_id=${workbookId}`
        : `${API_BASE_URL}/tableau/${SITE_NAME}/views`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch views');
      }
      
      const data = await response.json();
      return data.views || [];
    } catch (error) {
      console.error('Error fetching views:', error);
      throw error;
    }
  }

  async getWorkbookViews(workbookId: string): Promise<View[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tableau/workbook/${workbookId}/views`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include auth cookies if using session auth
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Views endpoint not found');
        }
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.views || [];
    } catch (error) {
      console.error('API Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch views');
    }
  }

  // Datasource methods
  async getDatasources(projectId?: string): Promise<Datasource[]> {
    try {
      const url = projectId 
        ? `${API_BASE_URL}/tableau/${SITE_NAME}/datasources?project_id=${projectId}`
        : `${API_BASE_URL}/tableau/${SITE_NAME}/datasources`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch datasources');
      }
      
      const data = await response.json();
      return data.datasources || [];
    } catch (error) {
      console.error('Error fetching datasources:', error);
      throw error;
    }
  }

  // Tableau objects methods
  async getCachedAttributes(projectId: string): Promise<FilteredItem[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'attr1', name: 'Customer Segment' },
          { id: 'attr2', name: 'Product Category' },
          { id: 'attr3', name: 'Region' },
        ]);
      }, 700);
    });
  }

  async getCachedMetrics(projectId: string): Promise<FilteredItem[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'metric1', name: 'Sales Amount' },
          { id: 'metric2', name: 'Profit Margin' },
          { id: 'metric3', name: 'Customer Count' },
        ]);
      }, 700);
    });
  }

  async getFilteredAttributes(projectId: string): Promise<FilteredItem[]> {
    // Mock implementation - live data fetch
    return this.getCachedAttributes(projectId);
  }

  async getFilteredMetrics(projectId: string): Promise<FilteredItem[]> {
    // Mock implementation - live data fetch
    return this.getCachedMetrics(projectId);
  }

  // Conversion methods
  async getConvertedAttributes(projectId: string): Promise<ConvertedAttribute[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 300);
    });
  }

  async getConvertedMetrics(projectId: string): Promise<ConvertedExpression[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 300);
    });
  }

  async batchConvertAttributesToPowerBI(projectId: string, attributeIds: string[]): Promise<ConvertedAttribute[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(attributeIds.map(id => ({
          id,
          name: `Attribute ${id}`,
          expressions: [
            {
              tableau_expression: `ATTR([${id}])`,
              powerbi_expression: `'Table'[${id}]`
            }
          ]
        })));
      }, 1500);
    });
  }

  async batchConvertMetricsToPowerBI(projectId: string, metricIds: string[]): Promise<ConvertedExpression[]> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(metricIds.map(id => ({
          id,
          name: `Metric ${id}`,
          tableau_expression: `SUM([${id}])`,
          powerbi_expression: `SUM('Table'[${id}])`
        })));
      }, 1500);
    });
  }

  // Background processing methods
  async startAttributesBackgroundProcess(projectId: string): Promise<void> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  async startMetricsBackgroundProcess(projectId: string): Promise<void> {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  // Download functionality
  async downloadPowerBIExpressions(projectId: string): Promise<void> {
    // Mock implementation - in a real app, this would trigger a file download
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  /**
   * Get custom calculations for a specific dashboard
   * @param dashboardId The ID of the dashboard to get calculations for
   * @returns Promise with the dashboard calculations
   */
  async getDashboardCalculations(dashboardId: string) {
    try {
      console.log(`Fetching calculations for dashboard: ${dashboardId}`);
      
      // First try the standard endpoint
      const endpoint = `${API_BASE_URL}/dashboards/${dashboardId}/calculations`;
      console.log(`API Request: GET ${endpoint}`);
      
      const response = await fetch(endpoint);
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        // If the server returns an error response, parse it for better error messages
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          // If error response isn't valid JSON
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log(`Received ${data.calculations?.length || 0} calculations from Tableau server`);
      
      // Ensure we return the expected structure
      return {
        calculations: data.calculations || data || []
      };
    } catch (error) {
      console.error("Error fetching dashboard calculations:", error);
      // Re-throw the error so the calling code can handle it appropriately
      throw error;
    }
  }

  // Updated getWorkbookCalculations method in api.ts
// Add this to your existing ApiService class

/**
 * Get custom calculations for a specific workbook
 * @param workbookId The ID of the workbook (not used in API call but kept for compatibility)
 * @param workbookName The name of the workbook to get calculations for
 * @returns Promise with the workbook calculations
 */
async getWorkbookCalculations(workbookId: string, workbookName?: string): Promise<{ calculations: Calculation[] }> {
  try {
    // Validate that we have a workbook name
    if (!workbookName) {
      console.error('Workbook name is required to fetch calculations');
      return { calculations: [] };
    }
    
    console.log(`Fetching calculations for workbook: ${workbookName}`);
    
    // Use the correct endpoint with workbook_name as query parameter
    const endpoint = `${API_BASE_URL}/tableau/calculated-fields?workbook_name=${encodeURIComponent(workbookName)}`;
    console.log(`API Request: GET ${endpoint}`);
    
    const response = await fetch(endpoint);
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Received response:`, data);
    console.log(`Found ${data.calculated_fields_count || 0} calculations for workbook "${workbookName}"`);
    
    // Map the calculated_fields to the expected Calculation interface
    const calculations = (data.calculated_fields || []).map((field: any, index: number) => ({
      id: field.name || `calc-${index}`, // Use name as ID
      name: field.name || 'Unnamed Calculation',
      formula: field.formula || 'N/A',
      type: field.role === 'MEASURE' ? 'measure' : field.role === 'DIMENSION' ? 'dimension' : 'measure',
      complexity: 'medium', // Default since not provided by API
      description: `Data Type: ${field.dataType || 'Unknown'} | Sheet: ${field.sheet || 'Unknown'}`,
      dataType: field.dataType || 'Unknown',
      sheet: field.sheet || 'Unknown',
      role: field.role || 'MEASURE'
    }));
    
    return { calculations };
    
  } catch (error) {
    console.error('Error fetching workbook calculations:', error);
    throw error; // Re-throw to handle in component
  }
}
  
  /**
   * Convert Tableau calculations to DAX expressions
   * @param calculationIds Array of calculation IDs to convert
   * @returns Promise with the converted DAX expressions
   */
  async convertToDax(calculationIds: string[]) {
    try {
      console.log(`Converting ${calculationIds.length} calculations to DAX`);
      
      // First try the standard endpoint
      const endpoint = `${API_BASE_URL}/convert-to-dax`;
      console.log(`API Request: POST ${endpoint}`);
      console.log("Request payload:", { calculationIds });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calculationIds }),
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        // If the server returns an error response, parse it for better error messages
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          // If error response isn't valid JSON
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log(`Received ${data.conversions?.length || 0} DAX conversions from server`);
      
      // Ensure we return the expected structure
      return {
        conversions: data.conversions || data || []
      };
    } catch (error) {
      console.error("Error converting to DAX:", error);
      // Re-throw the error so the calling code can handle it appropriately
      throw error;
    }
  }
// Add this method to the ApiService class in api.ts
  async getWorkbookDatasources(workbookId: string): Promise<any[]> {
    try {
      const url = `${API_BASE_URL}/tableau/${workbookId}/datasources`;
      console.log(`Fetching datasources for workbook: ${workbookId} from ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch workbook datasources');
      }
      
      const data = await response.json();
      console.log('Workbook datasources response:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching workbook datasources:', error);
      throw error;
    }
  }

  /**
   * Migrate a Tableau workbook to Power BI
   * @param request Migration request parameters
   * @returns Promise with migration response
   */
  async migrateWorkbookToPowerBI(request: MigrateWorkbookRequest): Promise<MigrateWorkbookResponse> {
    try {
      console.log('Migrating workbook to Power BI:', request);
      
      const endpoint = `${API_BASE_URL}/tableau/migrate_workbook`;
      console.log(`API Request: POST ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Migration response:', data);
      
      return data;
    } catch (error) {
      console.error('Error migrating workbook:', error);
      throw error;
    }
  }
  /**
 * Check the status of a Power BI model creation task
 * @param taskId The task ID returned from migration
 * @returns Promise with task status
 */
async checkModelCreationStatus(taskId: string): Promise<any> {
  try {
    const endpoint = `${API_BASE_URL}/tableau/model-creation-status/${taskId}`;
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking model creation status:', error);
    throw error;
  }
}

}



// Create instance of API service
const apiService = new ApiService();
export { apiService, getSiteName };