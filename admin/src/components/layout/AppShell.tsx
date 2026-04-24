import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandMenu } from '@/components/command-menu';

export function AppShell() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandMenu />
    </div>
  );
}
