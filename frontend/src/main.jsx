import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SessionProvider } from '@/context/SessionProvider';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <BrowserRouter>
        <TooltipProvider delayDuration={300}>
          <SessionProvider>
            <App />
          </SessionProvider>
          <Toaster position="bottom-center" />
        </TooltipProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
