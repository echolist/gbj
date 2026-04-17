import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './modules/auth/LoginPage';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { PatientsPage } from './modules/patients/PatientsPage';
import { BedsPage } from './modules/beds/BedsPage';
import { AnalyticsPage } from './modules/analytics/AnalyticsPage';
import { SummaryPage } from './modules/summary/SummaryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/beds" element={<BedsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/summary" element={<SummaryPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
