import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/useAuth';
import { APP_ROUTES, type AppRoute, type SidebarParent } from '@/app/routes';
import { buildSidebarNodes, getUserRoles } from '@/app/routeUtils';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const { userProfile } = useAuth();
  // Menu dibangun dari APP_ROUTES dan difilter per role
  const nodes = buildSidebarNodes(APP_ROUTES, getUserRoles(userProfile));

  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Collapsed by default on medium screens (md to lg), expanded on lg+
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  });

  // On mobile overlay, always show full menu (not collapsed)
  const effectiveCollapsed = isMobileOpen ? false : isCollapsed;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300',
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onCloseMobile}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card flex flex-col border-r border-gray-100 dark:border-none relative',
          // Desktop
          'transition-all duration-300',
          isCollapsed ? 'md:w-24' : 'md:w-72',
          // Mobile - Animated slide in/out
          'fixed md:relative inset-y-0 left-0 w-72',
          'transform transition-transform duration-300 ease-in-out',
          // Z-index
          isMobileOpen ? 'z-50' : 'z-20',
          // Translation
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Toggle Button — hidden on mobile */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          className="absolute -right-3 top-9 bg-card border border-gray-100 dark:border-gray-700 rounded-full p-1.5 shadow-sm hover:text-primary hover:scale-110 active:scale-95 transition-all duration-200 z-30 hidden md:flex"
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" aria-hidden />
          ) : (
            <ChevronLeft className="size-4" aria-hidden />
          )}
        </Button>

        {/* Header / Logo */}
        <div
          className={cn(
            'flex items-center justify-center h-24 border-b border-gray-100 dark:border-gray-800 mb-4 transition-all duration-300',
            effectiveCollapsed ? 'mx-2' : 'mx-6',
          )}
        >
          <div
            className={cn(
              'flex items-center transition-all duration-300',
              effectiveCollapsed ? 'justify-center' : 'gap-3',
            )}
          >
            <img
              src="/logo.svg"
              alt="Logo Opnamix"
              className={cn(
                'object-contain rounded-xl transition-all duration-300',
                effectiveCollapsed ? 'h-10 w-10' : 'h-12 w-12',
              )}
            />
            {!effectiveCollapsed && (
              <div className="text-xl font-bold uppercase tracking-wide text-foreground whitespace-nowrap">
                Opna<span className="text-primary font-bold">mix</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-8 scrollbar-hide">
          {nodes.map((node) => {
            if (node.kind === 'group') {
              return effectiveCollapsed ? (
                <div key={`group-${node.label}`} className="h-4"></div>
              ) : (
                <div key={`group-${node.label}`} className="px-4 pt-4 pb-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {node.label}
                  </p>
                </div>
              );
            }

            if (node.kind === 'parent') {
              return (
                <NavParent
                  key={`parent-${node.parent.label}`}
                  parent={node.parent}
                  items={node.children}
                  collapsed={effectiveCollapsed}
                  onCloseMobile={onCloseMobile}
                />
              );
            }

            return (
              <NavItem
                key={node.route.path}
                route={node.route}
                collapsed={effectiveCollapsed}
                onCloseMobile={onCloseMobile}
              />
            );
          })}
        </nav>
      </aside>
    </>
  );
};

interface NavParentProps {
  parent: SidebarParent;
  items: AppRoute[];
  collapsed: boolean;
  onCloseMobile?: () => void;
}

// Menu induk yang bisa dibuka-tutup, misalnya Stok Opname
const NavParent: React.FC<NavParentProps> = ({ parent, items, collapsed, onCloseMobile }) => {
  const location = useLocation();
  const isActivePath = location.pathname.startsWith(parent.pathPrefix);
  const [expanded, setExpanded] = useState(isActivePath);
  const Icon = parent.icon;

  return (
    <>
      <button
        onClick={() => setExpanded(!expanded)}
        title={collapsed ? parent.label : ''}
        className={cn(
          'w-full flex items-center h-11 transition-all duration-200 group rounded-lg relative hover:scale-[1.02] active:scale-[0.98]',
          collapsed ? 'justify-center px-2' : 'justify-start px-4',
          isActivePath
            ? 'text-primary font-bold'
            : 'text-muted-foreground hover:text-foreground dark:hover:text-white font-medium',
        )}
      >
        <Icon
          className={cn(
            'size-5 shrink-0 transition-transform duration-200',
            !collapsed && 'mr-3',
            isActivePath ? 'text-primary' : 'group-hover:text-primary',
          )}
          aria-hidden
        />
        {!collapsed && (
          <>
            <span>{parent.label}</span>
            <ChevronDown
              className={cn(
                'size-4 ml-auto transition-transform duration-300 ease-in-out',
                expanded && 'rotate-180',
              )}
              aria-hidden
            />
          </>
        )}
      </button>

      {/* Sub-menu items */}
      <div
        className={cn(
          'ml-6 pl-3 border-l-2 border-primary/10 space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out',
          expanded && !collapsed ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        {items.map((item) => (
          <NavItem
            key={item.path}
            route={item}
            collapsed={collapsed}
            onCloseMobile={onCloseMobile}
          />
        ))}
      </div>
    </>
  );
};

interface NavItemProps {
  route: AppRoute;
  collapsed?: boolean;
  onCloseMobile?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ route, collapsed, onCloseMobile }) => {
  const label = route.sidebar?.label ?? route.title;
  const Icon: LucideIcon | undefined = route.sidebar?.icon;

  const handleClick = () => {
    if (onCloseMobile) {
      // Close mobile menu when clicking on mobile
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        onCloseMobile();
      }
    }
  };

  return (
    <NavLink
      to={route.path}
      title={collapsed ? label : ''}
      onClick={handleClick}
      className={({ isActive }) =>
        cn(
          'w-full flex items-center h-11 transition-all duration-200 group rounded-lg relative hover:scale-[1.02] active:scale-[0.98]',
          collapsed ? 'justify-center px-2' : 'justify-start px-4',
          isActive
            ? 'bg-primary/10 text-primary font-bold hover:bg-primary/15 hover:text-primary'
            : 'text-muted-foreground hover:text-foreground dark:hover:text-white font-medium hover:bg-transparent',
        )
      }
    >
      {({ isActive }) => (
        <>
          {Icon && (
            <Icon
              className={cn(
                'size-5 shrink-0 transition-all duration-200',
                !collapsed && 'mr-3',
                isActive ? 'text-primary' : 'group-hover:text-primary',
              )}
              aria-hidden
            />
          )}
          {!collapsed && <span>{label}</span>}
          {isActive && !collapsed && (
            <div className="ml-auto w-1 h-8 bg-primary rounded-full absolute right-0"></div>
          )}
        </>
      )}
    </NavLink>
  );
};

export default Sidebar;
