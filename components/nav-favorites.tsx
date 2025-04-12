'use client';

import { FileText, PlusCircle } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NavFavorites({
  favorites,
  title = 'Favorites',
}: {
  favorites: {
    name: string;
    url: string;
    emoji: string;
    date?: string;
  }[];
  title?: string;
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="mb-2 flex items-center gap-2 px-1 font-semibold">
        <FileText className="h-4 w-4" />
        {title}
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-1">
        {favorites.map((item) => (
          <SidebarMenuItem key={item.name} className="px-1">
            <SidebarMenuButton
              asChild
              className="group hover:bg-primary/5 transition-colors duration-200"
            >
              <a
                href={item.url}
                title={item.name}
                className="flex w-full items-center rounded-md px-3 py-6"
              >
                <div className="flex min-w-0 flex-grow flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">{item.name}</span>
                  {item.date && (
                    <span className="text-muted-foreground truncate text-xs">{item.date}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'ml-2 flex-shrink-0 transition-opacity duration-200',
                    'text-muted-foreground opacity-0 group-hover:opacity-100'
                  )}
                >
                  →
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <Link href="/resume/playground">
        <SidebarMenuItem className="mt-3 px-1">
          <SidebarMenuButton className="text-sidebar-foreground/70 hover:bg-primary/5 w-full cursor-pointer rounded-md px-3 py-3 transition-colors duration-200">
            <PlusCircle className="text-primary h-5 w-5 flex-shrink-0" />
            <span className="text-muted-foreground ml-3 truncate">Make New Resume</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        </Link>
      </SidebarMenu>
    </SidebarGroup>
  );
}
