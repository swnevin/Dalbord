import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from './App'
import './index.css'

// Initialize Highcharts
import './components/statistics/HighchartsMain';

createRoot(document.getElementById("root")!).render(<App />);
