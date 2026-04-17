import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/ToastContainer';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
