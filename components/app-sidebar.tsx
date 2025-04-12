'use client';

import * as React from 'react';
import { AudioWaveform, Command, Home, Inbox, LogOut, Settings2, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { NavFavorites } from '@/components/nav-favorites';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { TeamSwitcher } from '@/components/team-switcher';
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type LucideIcon } from 'lucide-react';

// Navigation item type definition
type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  isLogout?: boolean;
};

// This is sample data.
const data = {
  teams: [
    {
      name: 'AI - ResumeForge',
      logo: Command,
      plan: 'Enterprise',
    },
    {
      name: 'AI - ResumeForge',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: Home,
    },
    {
      title: 'Resume AI Generation',
      url: '/resume/playground',
      icon: Sparkles,
    },
    {
      title: 'Resume Upload',
      url: '/resume/upload',
      icon: Inbox,
    },
    {
      title: 'Inbox',
      url: '/inbox',
      icon: Inbox,
      badge: '10',
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings2,
    },
    {
      title: 'Logout',
      url: '#',
      icon: LogOut,
      isLogout: true,
    },
  ],
  aiResumes: [
    {
      name: 'Software Engineer Resume',
      url: '/resume/1',
      emoji: '💻',
      date: '2023-06-15',
    },
    {
      name: 'Frontend Developer Resume',
      url: '/resume/2',
      emoji: '🎨',
      date: '2023-07-23',
    },
    {
      name: 'Backend Developer Resume',
      url: '/resume/3',
      emoji: '⚙️',
      date: '2023-08-05',
    },
    {
      name: 'Data Scientist Resume',
      url: '/resume/4',
      emoji: '📊',
      date: '2023-09-18',
    },
    {
      name: 'Project Manager Resume',
      url: '/resume/5',
      emoji: '📋',
      date: '2023-10-22',
    },
    {
      name: 'UI/UX Designer Resume for Creative Industries',
      url: '/resume/6',
      emoji: '🎭',
      date: '2023-11-07',
    },
    {
      name: 'Digital Marketing Specialist Resume with SEO Experience',
      url: '/resume/7',
      emoji: '📈',
      date: '2023-12-14',
    },
    {
      name: 'AI Research Scientist Resume',
      url: '/resume/8',
      emoji: '🤖',
      date: '2024-01-30',
    },
    {
      name: 'Cloud Solutions Architect Resume',
      url: '/resume/9',
      emoji: '☁️',
      date: '2024-02-17',
    },
    {
      name: 'Cybersecurity Expert Resume',
      url: '/resume/10',
      emoji: '🔒',
      date: '2024-03-25',
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const pathname = usePathname();

  // Set active menu items based on URL
  const mainNavItems = React.useMemo(() => {
    return data.navMain.map((item) => ({
      ...item,
      isActive: pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url)),
    }));
  }, [pathname]);

  // Set active state for secondary menu items
  const secondaryNavItems = React.useMemo(() => {
    return data.navSecondary.map((item) => ({
      ...item,
      isActive: !item.isLogout && pathname === item.url,
    }));
  }, [pathname]);

  const handleLogout = () => {
    // Implement logout logic
    console.log('Processing logout...');
    // Add actual logout API call here
    setLogoutDialogOpen(false);
  };

  // navSecondary item click handler
  const handleNavItemClick = (item: NavItem) => {
    if (item.isLogout) {
      setLogoutDialogOpen(true);
      return;
    }
    // Other navigation items navigate to URL normally
    if (item.url) {
      // URL handling logic
    }
  };

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={mainNavItems} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={data.aiResumes} title="AI Generated Resumes" />
        <NavSecondary
          items={secondaryNavItems}
          className="mt-auto"
          onItemClick={handleNavItemClick}
        />

        {/* Logout confirmation dialog */}
        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>Are you sure you want to logout?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
