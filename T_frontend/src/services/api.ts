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
  view_url_name?: string;
  created_at?: string;
  updated_at?: string;
  owner_id?: string;
  project_id?: string;
  tags?: string[];
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
      console.log(`Fetching views for workbook: ${workbookId}`);
      
      // Try different possible endpoints for workbook views
      const possibleEndpoints = [
        `${API_BASE_URL}/tableau/${SITE_NAME}/workbooks/${workbookId}/views`,
        `${API_BASE_URL}/tableau/${SITE_NAME}/views?workbook_id=${workbookId}`,
        `${API_BASE_URL}/workbooks/${workbookId}/views`,
        `${API_BASE_URL}/tableau/views?workbook=${workbookId}`,
        `${API_BASE_URL}/views?workbook_id=${workbookId}`
      ];
      
      let lastError = null;
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: GET ${endpoint}`);
          
          const response = await fetch(endpoint);
          console.log(`Response status for ${endpoint}: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Success! Received data from ${endpoint}:`, data);
            
            // Handle different response structures
            let views = [];
            if (data.views && Array.isArray(data.views)) {
              views = data.views;
            } else if (Array.isArray(data)) {
              views = data;
            } else if (data.data && Array.isArray(data.data)) {
              views = data.data;
            }
            
            console.log(`Processed ${views.length} views from workbook`);
            return views;
          } else if (response.status === 404) {
            console.log(`Endpoint ${endpoint} not found (404), trying next...`);
            continue;
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError);
          lastError = endpointError;
          continue;
        }
      }
      
      // If all endpoints failed, check if it's because the workbook has no views
      console.warn(`All view endpoints failed for workbook ${workbookId}. This workbook may not have any published views.`);
      return []; // Return empty array instead of throwing error
      
    } catch (error) {
      console.error('Error fetching workbook views:', error);
      // Return empty array instead of throwing error for better UX
      return [];
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

  /**
   * Get custom calculations for a specific workbook
   * @param workbookId The ID of the workbook to get calculations for
   * @returns Promise with the workbook calculations
   */
  async getWorkbookCalculations(workbookId: string): Promise<Calculation[]> {
    try {
      console.log(`Fetching calculations for workbook: ${workbookId}`);
      
      // Try different possible endpoints for workbook calculations
      const possibleEndpoints = [
        `${API_BASE_URL}/tableau/${SITE_NAME}/workbooks/${workbookId}/calculations`,
        `${API_BASE_URL}/tableau/${SITE_NAME}/calculations?workbook_id=${workbookId}`,
        `${API_BASE_URL}/workbooks/${workbookId}/calculations`,
        `${API_BASE_URL}/tableau/calculations?workbook=${workbookId}`,
        `${API_BASE_URL}/calculations?workbook_id=${workbookId}`,
        // Fallback: try views endpoint and extract calculations from views
        `${API_BASE_URL}/tableau/${SITE_NAME}/workbooks/${workbookId}/views`
      ];
      
      let lastError = null;
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: GET ${endpoint}`);
          
          const response = await fetch(endpoint);
          console.log(`Response status for ${endpoint}: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Success! Received data from ${endpoint}:`, data);
            
            // Handle different response structures
            let calculations = [];
            if (data.calculations && Array.isArray(data.calculations)) {
              calculations = data.calculations;
            } else if (Array.isArray(data)) {
              calculations = data;
            } else if (data.data && Array.isArray(data.data)) {
              calculations = data.data;
            } else if (endpoint.includes('/views') && data.views) {
              // If this is a views endpoint, try to extract calculations from views
              console.log('This is a views endpoint, no calculations available');
              calculations = [];
            }
            
            console.log(`Processed ${calculations.length} calculations from workbook`);
            return calculations;
          } else if (response.status === 404) {
            console.log(`Endpoint ${endpoint} not found (404), trying next...`);
            continue;
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError);
          lastError = endpointError;
          continue;
        }
      }
      
      // If all endpoints failed, this workbook may not have any calculations
      console.warn(`All calculation endpoints failed for workbook ${workbookId}. This workbook may not have any custom calculations.`);
      return []; // Return empty array instead of throwing error
      
    } catch (error) {
      console.error('Error fetching workbook calculations:', error);
      // Return empty array instead of throwing error for better UX
      return [];
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
}



// Create instance of API service
const apiService = new ApiService();
export { apiService, getSiteName };