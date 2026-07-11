import { useState, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { TOC } from './TOC';
import { Breadcrumb } from '../navigation/Breadcrumb';
import { DocNavigation } from '../navigation/DocNavigation';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="block shrink-0 h-full overflow-y-auto border-r">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Scrollable Content */}
        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto px-2 py-8"
        >
          <div className="m-4 fade-in">
            <Breadcrumb />

            <article className="doc-content">
              <Outlet />
            </article>
            <DocNavigation />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;