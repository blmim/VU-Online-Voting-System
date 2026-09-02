import './styles/animations.css';
import './styles/premium.css';

import React from 'react';

import ReactDOM from 'react-dom/client';

import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider, CssBaseline } from '@mui/material';

import App from './App';

import { AuthProvider } from './context/AuthContext';

import { ToastProvider } from './context/ToastContext';

import { TutorialProvider } from './context/TutorialContext';

import { LiveRegionProvider } from './components/LiveRegionAnnouncer';

import { AccessibilityProvider } from './context/AccessibilityContext';

import { BreadcrumbProvider } from './context/BreadcrumbContext';

import theme from './theme';



ReactDOM.createRoot(document.getElementById('root')).render(

  <React.StrictMode>

    <ThemeProvider theme={theme}>

      <CssBaseline />

      <BrowserRouter>

        <LiveRegionProvider>

          <AccessibilityProvider>

            <BreadcrumbProvider>

              <ToastProvider>

                <AuthProvider>

                  <TutorialProvider>

                    <App />

                  </TutorialProvider>

                </AuthProvider>

              </ToastProvider>

            </BreadcrumbProvider>

          </AccessibilityProvider>

        </LiveRegionProvider>

      </BrowserRouter>

    </ThemeProvider>

  </React.StrictMode>

);

