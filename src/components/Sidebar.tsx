import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { ROUTES } from '../types';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const { userProfile } = useAuth();
  const userRoles = userProfile?.roles ?? (userProfile?.role ? [userProfile.role] : []);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Collapsed by default on medium screens (md to lg), expanded on lg+
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  });
  const location = useLocation();
  const isOpnamePath = location.pathname.startsWith('/audit/stok-opname');
  const [opnameExpanded, setOpnameExpanded] = useState(isOpnamePath);

  // Define visibility based on roles
  const isAdmin = userRoles.includes('admin');
  const isFarmasi = userRoles.includes('farmasi') || userRoles.includes('apoteker');
  const isNakes = userRoles.includes('nakes');

  // Admin and Farmasi have full access to current stock modules
  // Nakes has limited access
  const showMasterData = isAdmin || isFarmasi;
  const showStockIn = isAdmin || isFarmasi;
  const showStockOut = isAdmin || isFarmasi || isNakes;
  const showOpname = isAdmin || isFarmasi;
  const showReports = isAdmin || isFarmasi;

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
          'bg-card-light dark:bg-card-dark flex flex-col border-r border-gray-100 dark:border-none relative',
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
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-9 bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-700 rounded-full p-1.5 shadow-sm hover:text-primary hover:scale-110 active:scale-95 transition-all duration-200 z-30 h-7 w-7 hidden md:flex"
        >
          <span className="material-icons-round text-sm">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
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
              <div className="text-xl font-bold uppercase tracking-wide text-text-primary-light dark:text-white whitespace-nowrap">
                Opna<span className="text-primary font-bold">mix</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-8 scrollbar-hide">
          <NavItem
            icon="dashboard"
            label="Dashboard"
            to={ROUTES.DASHBOARD}
            collapsed={effectiveCollapsed}
            onCloseMobile={onCloseMobile}
          />

          {showMasterData && (
            <>
              {!effectiveCollapsed && (
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Master Data
                  </p>
                </div>
              )}
              {effectiveCollapsed && <div className="h-4"></div>}

              <NavItem
                icon="inventory_2"
                label="Data Produk"
                to={ROUTES.MASTER_DATA_PRODUK}
                collapsed={effectiveCollapsed}
                onCloseMobile={onCloseMobile}
              />
              <NavItem
                icon="medical_services"
                label="Data Jasa"
                to={ROUTES.MASTER_DATA_JASA}
                collapsed={effectiveCollapsed}
                onCloseMobile={onCloseMobile}
              />
            </>
          )}

          {!effectiveCollapsed && (
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                Transaksi
              </p>
            </div>
          )}
          {effectiveCollapsed && <div className="h-4"></div>}

          {showStockIn && (
            <NavItem
              icon="arrow_circle_down"
              label="Stok Masuk"
              to={ROUTES.STOK_MASUK}
              collapsed={effectiveCollapsed}
              onCloseMobile={onCloseMobile}
            />
          )}

          {showStockOut && (
            <NavItem
              icon="arrow_circle_up"
              label="Stok Keluar"
              to={ROUTES.STOK_KELUAR}
              collapsed={effectiveCollapsed}
              onCloseMobile={onCloseMobile}
            />
          )}

          {showOpname && (
            <>
              {!effectiveCollapsed && (
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Audit & Kontrol
                  </p>
                </div>
              )}
              {effectiveCollapsed && <div className="h-4"></div>}

              {/* Collapsible Stok Opname parent */}
              <button
                onClick={() => setOpnameExpanded(!opnameExpanded)}
                title={effectiveCollapsed ? 'Stok Opname' : ''}
                className={cn(
                  'w-full flex items-center py-3 transition-all duration-200 group rounded-xl relative h-auto hover:scale-[1.02] active:scale-[0.98]',
                  effectiveCollapsed ? 'justify-center px-2' : 'justify-start px-4',
                  isOpnamePath
                    ? 'text-primary font-bold'
                    : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-white font-medium',
                )}
              >
                <span
                  className={cn(
                    'material-icons-round text-xl transition-transform duration-200',
                    !effectiveCollapsed && 'mr-3',
                    isOpnamePath ? 'text-primary' : 'group-hover:text-primary',
                  )}
                >
                  fact_check
                </span>
                {!effectiveCollapsed && (
                  <>
                    <span>Stok Opname</span>
                    <span
                      className={cn(
                        'material-icons-round text-sm ml-auto transition-transform duration-300 ease-in-out',
                        opnameExpanded && 'rotate-180',
                      )}
                    >
                      expand_more
                    </span>
                  </>
                )}
              </button>

              {/* Sub-menu items */}
              <div
                className={cn(
                  'ml-6 pl-3 border-l-2 border-primary/10 space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out',
                  opnameExpanded && !effectiveCollapsed
                    ? 'max-h-48 opacity-100'
                    : 'max-h-0 opacity-0',
                )}
              >
                <NavItem
                  icon="history"
                  label="Riwayat Opname"
                  to={ROUTES.RIWAYAT_OPNAME}
                  collapsed={effectiveCollapsed}
                  onCloseMobile={onCloseMobile}
                />
                <NavItem
                  icon="settings"
                  label="Konfigurasi Opname"
                  to={ROUTES.KONFIGURASI_OPNAME}
                  collapsed={effectiveCollapsed}
                  onCloseMobile={onCloseMobile}
                />
              </div>
            </>
          )}

          {/* Notifications — visible to all roles */}
          <NavItem
            icon="notifications"
            label="Notifikasi"
            to={ROUTES.NOTIFICATIONS}
            collapsed={effectiveCollapsed}
            onCloseMobile={onCloseMobile}
          />

          {showReports && (
            <>
              {!effectiveCollapsed && (
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Laporan
                  </p>
                </div>
              )}
              {effectiveCollapsed && <div className="h-4"></div>}

              <NavItem
                icon="bar_chart"
                label="Laporan Stok"
                to={ROUTES.LAPORAN_STOK}
                collapsed={effectiveCollapsed}
                onCloseMobile={onCloseMobile}
              />
            </>
          )}

          {isAdmin && (
            <NavItem
              icon="manage_accounts"
              label="Kelola Pengguna"
              to={ROUTES.USER_MANAGEMENT}
              collapsed={effectiveCollapsed}
              onCloseMobile={onCloseMobile}
            />
          )}
          <NavItem
            icon="person"
            label="Profil"
            to={ROUTES.PROFIL}
            collapsed={effectiveCollapsed}
            onCloseMobile={onCloseMobile}
          />
        </nav>
      </aside>
    </>
  );
};

interface NavItemProps {
  icon: string;
  label: string;
  to?: string;
  collapsed?: boolean;
  onCloseMobile?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, collapsed, onCloseMobile }) => {
  const handleClick = () => {
    if (onCloseMobile) {
      // Close mobile menu when clicking on mobile
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        onCloseMobile();
      }
    }
  };

  if (!to) {
    // For items without routing (like Settings/Profile - to be implemented later)
    return (
      <Button
        variant="ghost"
        title={collapsed ? label : ''}
        onClick={handleClick}
        className={cn(
          'w-full flex items-center py-3 transition-all duration-200 group rounded-xl relative h-auto hover:scale-[1.02] active:scale-[0.98]',
          collapsed ? 'justify-center px-2' : 'justify-start px-4',
          'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-white font-medium hover:bg-transparent',
        )}
      >
        <span
          className={cn(
            'material-icons-round text-xl group-hover:text-primary transition-all duration-200',
            !collapsed && 'mr-3',
          )}
        >
          {icon}
        </span>
        {!collapsed && <span>{label}</span>}
      </Button>
    );
  }

  return (
    <NavLink
      to={to}
      title={collapsed ? label : ''}
      onClick={handleClick}
      className={({ isActive }) =>
        cn(
          'w-full flex items-center py-3 transition-all duration-200 group rounded-xl relative h-auto hover:scale-[1.02] active:scale-[0.98]',
          collapsed ? 'justify-center px-2' : 'justify-start px-4',
          isActive
            ? 'bg-primary/10 text-primary font-bold hover:bg-primary/15 hover:text-primary'
            : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-white font-medium hover:bg-transparent',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'material-icons-round text-xl transition-all duration-200',
              !collapsed && 'mr-3',
              isActive ? 'text-primary' : 'group-hover:text-primary',
            )}
          >
            {icon}
          </span>
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
