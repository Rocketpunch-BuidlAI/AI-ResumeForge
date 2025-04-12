import React from 'react';
import { type LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// 네비게이션 아이템 타입 정의
type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  isLogout?: boolean;
};

export function NavSecondary({
  items,
  onItemClick,
  ...props
}: {
  items: NavItem[];
  onItemClick?: (item: NavItem) => void;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a 
                  href={item.url}
                  onClick={(e) => {
                    if (onItemClick) {
                      e.preventDefault();
                      onItemClick(item);
                    }
                  }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
              {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
