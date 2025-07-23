import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add a sample project to localStorage for testing if none exists
if (!localStorage.getItem('selectedProject')) {
  const sampleProject = {
    id: '1',
    name: 'Sample Tableau Project',
    description: 'A sample project for testing the Tableau to Power BI migration',
    created_at: new Date().toISOString()
  };
  localStorage.setItem('selectedProject', JSON.stringify(sampleProject));
}

createRoot(document.getElementById("root")!).render(<App />);
