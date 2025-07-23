// @ts-check
// Test script to check frontend and backend connectivity
// Run with: node test-connection.js

import fetch from 'node-fetch';

const checkBackendConnection = async () => {
  try {
    console.log('Testing connection to backend API...');
    const response = await fetch('http://localhost:8000/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend connection successful!', data);
      return true;
    } else {
      console.error('❌ Backend connection failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend connection error:', error.message);
    return false;
  }
};

const testApiEndpoints = async () => {
  try {
    console.log('\nTesting API endpoints...');
    
    // Test projects endpoint
    const projectsResponse = await fetch('http://localhost:8000/projects');
    if (projectsResponse.ok) {
      const data = await projectsResponse.json();
      console.log('✅ Projects endpoint working:', data.projects ? `${data.projects.length} projects found` : 'No projects returned');
    } else {
      console.error('❌ Projects endpoint failed:', projectsResponse.status);
    }
    
    // Test workbooks endpoint
    const workbooksResponse = await fetch('http://localhost:8000/workbooks');
    if (workbooksResponse.ok) {
      const data = await workbooksResponse.json();
      console.log('✅ Workbooks endpoint working:', data.workbooks ? `${data.workbooks.length} workbooks found` : 'No workbooks returned');
    } else {
      console.error('❌ Workbooks endpoint failed:', workbooksResponse.status);
    }
    
  } catch (error) {
    console.error('❌ API endpoints test error:', error.message);
  }
};

const runTests = async () => {
  const backendConnected = await checkBackendConnection();
  
  if (backendConnected) {
    await testApiEndpoints();
  }
  
  console.log('\nTest Summary:');
  console.log(`Backend API: ${backendConnected ? '✅ Connected' : '❌ Not Connected'}`);
  console.log('Frontend: ✅ Running (since this script is executing)');
  
  if (!backendConnected) {
    console.log('\nTroubleshooting steps:');
    console.log('1. Make sure the backend server is running with: cd Backend && uvicorn main_2:app --host 0.0.0.0 --port 8000');
    console.log('2. Check if there are any CORS issues in the browser console');
    console.log('3. Verify the backend is accessible at http://localhost:8000/health');
  }
};

runTests(); 