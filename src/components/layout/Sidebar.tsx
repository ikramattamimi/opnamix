import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Monitor, Moon, Pin, PinOff, Sun } from 'lucide-react';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { useTheme } from '@/app/providers/ThemeProvider';
import type { SizePreference, ThemePreference } from '@/app/providers/displayPreferences';
import { useAuth } from '@/features/auth/useAuth';
import { useNotifications } from '@/features/notifications/useNotifications';
import { APP_ROUTES, type AppRoute, type SidebarBadge } from '@/app/routes';
import { buildSidebarNodes, getUserRoles } from '@/app/routeUtils';
import { ROUTES } from '@/types/routes';
import { cn } from '@/lib/utils';

// Sidebar: rel ikon 64px yang terbuka saat pointer di atasnya (melayang di atas
// isi), bisa di-pin supaya tetap terbuka (isi bergeser), dan menjadi laci di HP.
// Menu dibangun dari APP_ROUTES dan difilter per role.

interface SidebarProps {
  pinned: boolean;
  onTogglePin: () => void;
  isMobile: boolean;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
}

const HOVER_IN_MS = 90;
const HOVER_OUT_MS = 160;

const THEME_OPTIONS = [
  { value: 'light', label: 'Terang', icon: Sun },
  { value: 'system', label: 'Sistem', icon: Monitor },
  { value: 'dark', label: 'Gelap', icon: Moon },
] as const;

const SIZE_OPTIONS = [
  {
    value: 'standar',
    label: (
      <>
        <span className="text-2xs font-bold">Aa</span>Standar
      </>
    ),
  },
  {
    value: 'besar',
    label: (
      <>
        <span className="text-sm font-bold">Aa</span>Besar
      </>
    ),
  },
] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  apoteker: 'Apoteker',
  farmasi: 'Farmasi',
  nakes: 'Nakes',
};

// Label muncul saat sidebar terbuka; di HP selalu tampil karena laci selalu lebar
const LABEL =
  'min-w-0 truncate opacity-0 transition-opacity duration-100 pointer-events-none group-data-[expanded]/sb:pointer-events-auto group-data-[expanded]/sb:opacity-100 group-data-[expanded]/sb:delay-75 max-md:pointer-events-auto max-md:opacity-100';

function useSidebarBadges(): Record<SidebarBadge, number> {
  const { user } = useAuth();
  const { data } = useNotifications(user?.id ?? '');
  return { notifications: data?.unreadCount ?? 0 };
}

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const source = name?.trim() || email || 'U';
  const parts = source.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

export const Sidebar: React.FC<SidebarProps> = ({
  pinned,
  onTogglePin,
  isMobile,
  drawerOpen,
  onCloseDrawer,
}) => {
  const { userProfile, logout } = useAuth();
  const { theme, setTheme, size, setSize } = useTheme();
  const navigate = useNavigate();
  const badges = useSidebarBadges();
  const [hover, setHover] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const timer = useRef(0);
  const asideRef = useRef<HTMLElement>(null);

  const roles = getUserRoles(userProfile);
  const nodes = buildSidebarNodes(APP_ROUTES, roles);
  const expanded = isMobile ? drawerOpen : pinned || hover;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const hoverTo = (value: boolean, delay: number) => {
    if (isMobile) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHover(value), delay);
  };

  const handleLogout = async () => {
    if (loggingOut || !window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const renderItem = (route: AppRoute) => {
    const config = route.sidebar;
    if (!config) return null;
    const Icon = config.icon;
    const count = config.badge ? badges[config.badge] : 0;
    return (
      <NavLink
        key={route.path}
        to={route.path}
        end={route.path === ROUTES.DASHBOARD}
        title={config.label}
        onClick={() => isMobile && onCloseDrawer()}
        className={({ isActive }) =>
          cn(
            'grid h-8.5 w-full shrink-0 grid-cols-[2.75rem_1fr_auto] items-center rounded-lg text-meta font-medium text-on-grad-2 transition-colors hover:bg-glass hover:text-on-grad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-grad',
            isActive && 'bg-glass-2 font-semibold text-on-grad ring-1 ring-inset ring-glass-line',
          )
        }
      >
        <span className="relative grid place-items-center">
          <Icon className="size-4.5" aria-hidden />
          {count > 0 && (
            <span
              className="absolute -top-0.5 right-2.5 size-1.5 rounded-full bg-dot-warn ring-2 ring-grad-ink transition-opacity group-data-[expanded]/sb:opacity-0 max-md:opacity-0"
              aria-hidden
            />
          )}
        </span>
        <span className={LABEL}>{config.label}</span>
        {count > 0 ? (
          <span
            className={cn(
              LABEL,
              'mr-2 rounded-full bg-dot-warn px-1.5 text-2xs font-semibold leading-4 text-dot-warn-ink',
            )}
          >
            {count > 99 ? '99+' : count}
            <span className="sr-only"> belum dibaca</span>
          </span>
        ) : (
          <span />
        )}
      </NavLink>
    );
  };

  return (
    <aside
      ref={asideRef}
      aria-label="Navigasi utama"
      data-expanded={expanded ? '' : undefined}
      onMouseEnter={() => hoverTo(true, HOVER_IN_MS)}
      onMouseLeave={() => hoverTo(false, HOVER_OUT_MS)}
      onFocus={() => !isMobile && setHover(true)}
      onBlur={(event) => {
        if (!asideRef.current?.contains(event.relatedTarget as Node | null)) setHover(false);
      }}
      className={cn(
        'group/sb fixed inset-y-0 left-0 z-40 flex flex-col gap-2.5 overflow-hidden bg-grad-side px-2.5 py-3 text-on-grad transition-[width,transform,box-shadow] duration-200 ease-out',
        'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]',
        // HP: laci selebar sidebar terbuka, tersembunyi di kiri
        'max-md:w-sbw',
        isMobile && !drawerOpen && '-translate-x-[102%]',
        isMobile && drawerOpen && 'shadow-float',
        // Layar lebar: rel ikon, melebar saat hover (melayang) atau pin
        !isMobile && (expanded ? 'w-sbw' : 'w-rail'),
        !isMobile && expanded && !pinned && 'shadow-float',
      )}
    >
      <div className="grid h-11 shrink-0 grid-cols-[2.75rem_1fr_auto] items-center">
        <img
          src="/logo.svg"
          alt=""
          className="size-8.5 justify-self-center rounded-xl shadow"
          aria-hidden
        />
        <span className={cn(LABEL, 'flex flex-col leading-tight')}>
          <b className="text-[0.9375rem] tracking-wide">Opnamix</b>
          <small className="text-xs text-on-grad-2">Stok farmasi klinik</small>
        </span>
        <button
          type="button"
          onClick={onTogglePin}
          aria-pressed={pinned}
          aria-label={pinned ? 'Lepas kunci sidebar' : 'Kunci sidebar tetap terbuka'}
          title={pinned ? 'Lepas kunci (sidebar menutup sendiri)' : 'Kunci sidebar tetap terbuka'}
          className={cn(
            LABEL,
            'grid size-7 place-items-center rounded-lg text-on-grad-2 hover:bg-glass hover:text-on-grad aria-pressed:bg-glass-2 aria-pressed:text-on-grad max-md:hidden [&_svg]:size-4',
          )}
        >
          {pinned ? <PinOff aria-hidden /> : <Pin aria-hidden />}
        </button>
      </div>

      <nav className="scrollbar-hide flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        {nodes.map((node) => {
          if (node.kind === 'group') {
            return (
              <div
                key={`group-${node.label}`}
                className="relative flex h-6.5 shrink-0 items-end pb-1 pl-3 text-2xs font-semibold uppercase tracking-widest text-on-grad-3"
              >
                <span
                  className="absolute bottom-2.5 left-3 h-px w-5 bg-glass-line transition-opacity group-data-[expanded]/sb:opacity-0 max-md:opacity-0"
                  aria-hidden
                />
                <span className={LABEL}>{node.label}</span>
              </div>
            );
          }
          // Menu bertingkat lama (Riwayat/Konfigurasi Opname) ditampilkan rata;
          // keduanya digabung jadi satu menu Stok Opname di Fase 6.
          if (node.kind === 'parent') return node.children.map(renderItem);
          return renderItem(node.route);
        })}
      </nav>

      <div className="flex shrink-0 flex-col gap-2">
        <SegmentedControl<ThemePreference>
          label="Tema"
          variant="glass"
          full
          value={theme}
          onChange={setTheme}
          options={THEME_OPTIONS}
          className={cn(LABEL, 'mx-0.5')}
        />
        <SegmentedControl<SizePreference>
          label="Ukuran tampilan"
          variant="glass"
          full
          value={size}
          onChange={setSize}
          options={SIZE_OPTIONS}
          className={cn(LABEL, 'mx-0.5')}
        />
        <div className="grid h-11 grid-cols-[2.75rem_1fr_auto] items-center rounded-xl border border-glass-line bg-glass">
          <button
            type="button"
            onClick={() => {
              navigate(ROUTES.PROFIL);
              if (isMobile) onCloseDrawer();
            }}
            title="Profil"
            aria-label="Buka profil"
            className="col-span-2 grid h-full grid-cols-subgrid items-center rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-grad"
          >
            <span className="grid size-7.5 place-items-center justify-self-center rounded-full bg-on-grad text-xs font-bold text-grad-ink">
              {initials(userProfile?.full_name, userProfile?.email)}
            </span>
            <span className={cn(LABEL, 'flex flex-col leading-tight')}>
              <b className="truncate text-meta">{userProfile?.full_name || userProfile?.email}</b>
              <small className="truncate text-xs text-on-grad-2">
                {roles.map((r) => ROLE_LABELS[r] ?? r).join(' · ') || 'Pengguna'}
              </small>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            aria-label="Keluar"
            title="Keluar"
            className={cn(
              LABEL,
              'mr-1.5 grid size-7 place-items-center rounded-lg text-on-grad-2 hover:bg-glass-2 hover:text-on-grad disabled:opacity-50 [&_svg]:size-4',
            )}
          >
            <LogOut aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
};
