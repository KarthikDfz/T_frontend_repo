/**
 * Unified API Service for BI Migration Hub
 * 
 * This service handles API calls to both the Tableau Migration backend
 * and the MicroStrategy Analytics backend.
 */

// Base URLs for API calls
const TABLEAU_API_URL = 'http://localhost:8000';
const MSTR_API_URL = 'http://localhost:8001';

// Tableau interfaces
export interface TableauCredentials {
  server_url: string;
  site_name: string;
  token_name: string;
  token_secret: string;
}

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
}

export interface View {
  id: string;
  name: string;
  content_url?: string;
  workbook_id?: string;
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

export interface ConvertedExpression {
  id: string;
  name: string;
  tableau_expression: string;
  powerbi_expression: string;
  form_name?: string;
}

// MicroStrategy interfaces
export interface MstrCredentials {
  server_url: string;
  username: string;
  password: string;
  project_id?: string;
}

export interface MstrProject {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

export interface MstrReport {
  id: string;
  name: string;
  description?: string;
  type?: string;
  owner?: string;
  last_modified?: string;
}

export interface MstrDossier {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  last_modified?: string;
  chapters?: number;
}

export interface MstrCube {
  id: string;
  name: string;
  type?: string; // "SuperCube" or "OlapCube"
  description?: string;
  owner?: string;
  last_modified?: string;
}

export interface MstrMetric {
  id: string;
  name: string;
  description?: string;
  expression?: string;
  dependencies?: string[];
}

export interface MstrAttribute {
  id: string;
  name: string;
  description?: string;
  forms?: Array<{ name: string, type: string }>;
}

class ApiService {
  // Check which backend to use based on project type
  private getBaseUrl(): string {
    const projectType = localStorage.getItem('projectType');
    return projectType === 'tableau' ? TABLEAU_API_URL : MSTR_API_URL;
  }

  // Helper method to handle API requests
  private async apiRequest(url: string, options = {}) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // ===== TABLEAU API METHODS =====

  // Authentication method for Tableau
  async authenticateTableau(credentials: TableauCredentials): Promise<any> {
    return this.apiRequest(`${TABLEAU_API_URL}/auth/tableau`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
  }

  // Project methods for Tableau
  async getTableauProjects(): Promise<Project[]> {
    const data = await this.apiRequest(`${TABLEAU_API_URL}/projects`);
    return data.projects;
  }

  // Workbook methods for Tableau
  async getTableauWorkbooks(projectId?: string): Promise<Workbook[]> {
    const url = projectId 
      ? `${TABLEAU_API_URL}/workbooks?project_id=${projectId}`
      : `${TABLEAU_API_URL}/workbooks`;
      
    const data = await this.apiRequest(url);
    return data.workbooks;
  }

  // View methods for Tableau
  async getTableauViews(workbookId?: string): Promise<View[]> {
    const url = workbookId 
      ? `${TABLEAU_API_URL}/views?workbook_id=${workbookId}`
      : `${TABLEAU_API_URL}/views`;
      
    const data = await this.apiRequest(url);
    return data.views;
  }

  // Datasource methods for Tableau
  async getTableauDatasources(projectId?: string): Promise<Datasource[]> {
    const url = projectId 
      ? `${TABLEAU_API_URL}/datasources?project_id=${projectId}`
      : `${TABLEAU_API_URL}/datasources`;
      
    const data = await this.apiRequest(url);
    return data.datasources;
  }

  // Calculations methods for Tableau
  async getCalculations(projectId: string): Promise<any[]> {
    // Replace with actual API path when implemented
    return this.apiRequest(`${TABLEAU_API_URL}/calculations?project_id=${projectId}`);
  }

  // ===== MICROSTRATEGY API METHODS =====
  
  // Authentication method for MicroStrategy
  async authenticateMstr(credentials: MstrCredentials): Promise<any> {
    return this.apiRequest(`${MSTR_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
  }

  // Project methods for MicroStrategy
  async getMstrProjects(): Promise<MstrProject[]> {
    return this.apiRequest(`${MSTR_API_URL}/api/projects`);
  }

  // Report methods for MicroStrategy
  async getMstrReports(projectId: string): Promise<MstrReport[]> {
    return this.apiRequest(`${MSTR_API_URL}/api/reports?project_id=${projectId}`);
  }

  // Dossier methods for MicroStrategy
  async getMstrDossiers(projectId: string): Promise<MstrDossier[]> {
    return this.apiRequest(`${MSTR_API_URL}/api/dossiers?project_id=${projectId}`);
  }

  // Cube methods for MicroStrategy
  async getMstrCubes(projectId: string): Promise<MstrCube[]> {
    return this.apiRequest(`${MSTR_API_URL}/api/cubes?project_id=${projectId}`);
  }

  // Metrics methods for MicroStrategy
  async getMstrMetrics(projectId: string): Promise<MstrMetric[]> {
    return this.apiRequest(`${MSTR_API_URL}/api/metrics?project_id=${projectId}`);
  }

  // Attributes methods for MicroStrategy
  async getMstrAttributes(projectId: string): Promise<MstrAttribute[]> {
    return this.apiRequest(`${MSTR_API_URL}/api/attributes?project_id=${projectId}`);
  }

  // SQL Analysis for MicroStrategy
  async analyzeSql(projectId: string, objectId: string, objectType: string): Promise<any> {
    return this.apiRequest(`${MSTR_API_URL}/api/sql-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, object_id: objectId, object_type: objectType })
    });
  }
}

// Export a singleton instance
export const apiService = new ApiService(); 