import { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

// This is the app layout - accessible to both authenticated and unauthenticated users
// Includes Header, Sidebar, Content area, and Footer
export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <div className="min-h-screen">
      {/* Fixed AppHeader across top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader />
      </div>
      
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Content area with sidebar margin */}
      <div className="ml-64 pt-16 min-h-screen flex flex-col">
        {/* Scrollable main content */}
        <main className="flex-1 p-6 bg-base-100">
          {children}
        </main>
        
        {/* Footer only in content area */}
        <div className="bg-base-100">
          <Footer />
        </div>
      </div>
    </div>
  );
}
