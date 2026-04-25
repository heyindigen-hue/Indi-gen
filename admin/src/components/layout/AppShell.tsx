import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { GlobalShortcuts } from './GlobalShortcuts';
import { CommandMenu } from '@/components/command-menu';
import { ImpersonationBanner } from '@/components/common/ImpersonationBanner';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function AppShell() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <GlobalShortcuts />
      {isDesktop && <Sidebar mode="fixed" />}
      {!isDesktop && (
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="p-0 w-[280px] max-w-[80vw]">
            <Sidebar mode="drawer" onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <ImpersonationBanner />
        <TopBar onMenuClick={() => setDrawerOpen(true)} showMenu={!isDesktop} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-4 lg:px-6 lg:py-6">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandMenu />
    </div>
  );
}
