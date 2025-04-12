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

export function NavFavorites({
  favorites,
  title = "Favorites"
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
      <SidebarGroupLabel className="flex items-center gap-2 font-semibold px-1 mb-2">
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
                className="flex items-center py-6 px-3 rounded-md w-full"
              >
                <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
                  <span className="truncate font-medium text-sm">
                    {item.name}
                  </span>
                  {item.date && (
                    <span className="text-xs text-muted-foreground truncate">
                      {item.date}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "transition-opacity duration-200 flex-shrink-0 ml-2",
                  "opacity-0 group-hover:opacity-100 text-muted-foreground"
                )}>
                  →
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem className="px-1 mt-3">
          <SidebarMenuButton className="text-sidebar-foreground/70 hover:bg-primary/5 transition-colors duration-200 px-3 py-3 rounded-md cursor-pointer w-full">
            <PlusCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground ml-3 truncate">Make New Resume</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
