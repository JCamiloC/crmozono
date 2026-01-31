"use client";

import { useState, type ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

type DashboardShellProps = {
  children: ReactNode;
};

export default function DashboardShell({ children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-botanical-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <Header onToggleSidebar={() => setIsSidebarOpen((value) => !value)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-6 shadow-card">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
