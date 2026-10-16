import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowLeftRight,
  Bell,
  BellOff,
  BriefcaseMedical,
  CircleAlert,
  CircleCheck,
  CircleCheckBig,
  CirclePlus,
  ClipboardList,
  Diff,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Search,
  Store,
  Sun,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/features/notifications/useNotifications';
import { useAuth } from '@/features/auth/useAuth';
import { getNotificationColor, formatNotificationTime } from '@/features/notifications/format';
import { ROUTES } from '@/types/routes';
import { APP_ROUTES } from '@/app/routes';
import { getRouteTitle } from '@/app/routeUtils';
import { useTheme } from '@/app/providers/ThemeProvider';

// Sementara: padanan lucide untuk ikon notifikasi per tipe. Setelah
// getNotificationLucideIcon dari features/notifications/format masuk ke main,
// ganti map ini dengan fungsi itu.
const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  STOCK_OUT_REQUEST: ClipboardList,
  STOCK_OUT_PROCESSED: CircleCheck,
  STOCK_LOW: TriangleAlert,
  STOCK_EMPTY: CircleAlert,
  OPNAME_STARTED: Search,
  OPNAME_COMPLETED: CircleCheckBig,
  OPNAME_CREATED: ListChecks,
  OPNAME_STEP_CHANGED: ArrowLeftRight,
  STOCK_IN: Archive,
  STOCK_OUT_DIRECT: Store,
  OPNAME_DISCREPANCY: Diff,
  PRODUCT_ADDED: CirclePlus,
  PRODUCT_DELETED: Trash2,
  SERVICE_ADDED: BriefcaseMedical,
};

const NotificationTypeIcon: React.FC<{ type: string; className?: string }> = ({
  type,
  className,
}) => {
  const Icon = NOTIFICATION_ICONS[type] ?? Bell;
  return <Icon className={className} aria-hidden />;
};

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, userProfile, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const viewName = getRouteTitle(pathname, APP_ROUTES);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userId = user?.id || '';
  const { data: notificationList } = useNotifications(userId);
  const notifications = notificationList?.notifications ?? [];
  const unreadCount = notificationList?.unreadCount ?? 0;
  const { mutate: markAsRead } = useMarkNotificationRead(userId);
  const { mutate: markAll } = useMarkAllNotificationsRead(userId);
  const markAllAsRead = () => markAll();
  const [isOpen, setIsOpen] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const notifButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  // Mobile refs
  const mobileNotifPanelRef = useRef<HTMLDivElement>(null);
  const mobileNotifButtonRef = useRef<HTMLButtonElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuButtonRef = useRef<HTMLButtonElement>(null);

  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Close notification panel
      if (
        isOpen &&
        notifPanelRef.current &&
        !notifPanelRef.current.contains(target) &&
        notifButtonRef.current &&
        !notifButtonRef.current.contains(target) &&
        mobileNotifPanelRef.current &&
        !mobileNotifPanelRef.current.contains(target) &&
        mobileNotifButtonRef.current &&
        !mobileNotifButtonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }

      // Close user menu
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(target) &&
        userMenuButtonRef.current &&
        !userMenuButtonRef.current.contains(target) &&
        mobileUserMenuRef.current &&
        !mobileUserMenuRef.current.contains(target) &&
        mobileUserMenuButtonRef.current &&
        !mobileUserMenuButtonRef.current.contains(target)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen, showUserMenu]);

  // Handle logout with confirmation and loading state
  const handleLogout = async () => {
    if (isLoggingOut) return;

    const confirmed = window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?');
    if (!confirmed) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowUserMenu(false);
    }
  };

  // Validate avatar URL to prevent XSS
  const isValidImageUrl = (url: string | null | undefined): url is string => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Get avatar content with XSS protection
  const getAvatarContent = () => {
    const avatarUrl = userProfile?.avatar_url;
    if (isValidImageUrl(avatarUrl)) {
      return (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    return userProfile?.email ? userProfile.email[0].toUpperCase() : 'U';
  };

  const getRoleBadge = () => {
    const roles = userProfile?.roles ?? (userProfile?.role ? [userProfile.role] : []);
    const primaryRole = roles.includes('admin')
      ? 'admin'
      : roles.includes('apoteker')
        ? 'apoteker'
        : roles.includes('farmasi')
          ? 'farmasi'
          : roles.includes('nakes')
            ? 'nakes'
            : roles[0];
    switch (primaryRole) {
      case 'admin':
        return { label: 'Admin', color: 'bg-purple-500' };
      case 'apoteker':
        return { label: 'Farmasi', color: 'bg-blue-500' };
      case 'farmasi':
        return { label: 'Farmasi', color: 'bg-blue-500' };
      case 'nakes':
        return { label: 'Nakes', color: 'bg-green-500' };
      default:
        return { label: 'User', color: 'bg-gray-500' };
    }
  };

  const roleBadge = getRoleBadge();

  // Notification Panel Component (shared between mobile & desktop)
  const NotificationPanel = React.forwardRef<HTMLDivElement, { isMobile?: boolean }>(
    ({ isMobile }, ref) => {
      if (!isOpen) return null;

      // Shared notification list content
      const notifContent = (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-primary" aria-hidden />
              <h3 className="font-bold text-sm text-text-primary-light dark:text-white">
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Tandai semua dibaca
                </button>
              )}
              {isMobile && (
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Tutup notifikasi"
                  className="p-1 -mr-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="size-5 text-text-secondary-light" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <BellOff className="size-10 text-gray-300 dark:text-gray-600 mb-2" aria-hidden />
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Belum ada notifikasi
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) markAsRead(notif.id);
                  }}
                  className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-50 dark:border-white/5 last:border-0 ${
                    !notif.is_read ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                  }`}
                >
                  {/* Icon */}
                  <NotificationTypeIcon
                    type={notif.type}
                    className={`size-5 mt-0.5 flex-shrink-0 ${getNotificationColor(notif.type)}`}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-snug ${!notif.is_read ? 'font-bold text-text-primary-light dark:text-white' : 'font-medium text-text-secondary-light dark:text-text-secondary-dark'}`}
                      >
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-text-secondary-light/60 dark:text-text-secondary-dark/60 mt-1">
                      {formatNotificationTime(notif.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer: View all link */}
          <div className="border-t border-gray-100 dark:border-white/10 px-4 py-2.5 bg-gray-50 dark:bg-white/5">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(ROUTES.NOTIFICATIONS);
              }}
              className="w-full text-center text-xs font-bold text-primary hover:text-primary/80 transition-colors py-1"
            >
              Lihat semua notifikasi
            </button>
          </div>
        </>
      );

      // Mobile: fullscreen-like modal with backdrop
      if (isMobile) {
        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-[60] animate-in fade-in duration-200"
              onClick={() => setIsOpen(false)}
            />
            {/* Modal */}
            <div
              ref={ref}
              className="fixed inset-x-0 top-[5%] bottom-[5%] mx-auto w-[90%] max-w-md bg-white dark:bg-card-dark rounded-2xl shadow-2xl overflow-hidden z-[70] border border-gray-100 dark:border-white/10 flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-200"
            >
              {notifContent}
            </div>
          </>
        );
      }

      // Desktop: dropdown panel
      return (
        <div
          ref={ref}
          className="absolute right-0 mt-2 w-96 bg-white dark:bg-card-dark rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-100 dark:border-white/10 flex flex-col"
          style={{ maxHeight: '480px' }}
        >
          {notifContent}
        </div>
      );
    },
  );

  return (
    <>
      {/* Mobile Header - Simpel & Compact */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-blue-950 dark:to-gray-900 md:hidden px-4 py-1 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left: Menu Icon */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              aria-label="Buka menu"
              className="p-2 -ml-2 text-text-primary-light dark:text-white hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="size-7" aria-hidden />
            </button>
          )}

          {/* Center: Title */}
          <div className="flex-1 text-center px-2">
            <h1 className="text-lg font-bold text-text-primary-light dark:text-white truncate">
              {viewName}
            </h1>
          </div>

          {/* Right: Notification Bell + Profile Icon */}
          <div className="flex items-center gap-1">
            {/* Notification Bell (Mobile) */}
            <div className="relative">
              <button
                ref={mobileNotifButtonRef}
                aria-label="Notifikasi"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-text-primary-light dark:text-white hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors relative"
              >
                <Bell className="size-[22px]" aria-hidden />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5 border-2 border-purple-50 dark:border-gray-900">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel ref={mobileNotifPanelRef} isMobile />
            </div>

            {/* Profile Icon */}
            <div className="relative" ref={mobileUserMenuRef}>
              <button
                ref={mobileUserMenuButtonRef}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold cursor-pointer overflow-hidden hover:scale-105 transition-transform shadow-md"
              >
                {getAvatarContent()}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-card-dark rounded-2xl shadow-lg overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 dark:border-white/10">
                    <p className="text-sm font-bold text-text-primary-light dark:text-white">
                      {userProfile?.full_name}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 text-xs font-bold text-white rounded-full ${roleBadge.color}`}
                    >
                      {roleBadge.label}
                    </span>
                  </div>
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleDarkMode}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-text-primary-light dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center justify-start gap-2 h-auto"
                    >
                      {isDarkMode ? (
                        <Sun className="size-[18px]" aria-hidden />
                      ) : (
                        <Moon className="size-[18px]" aria-hidden />
                      )}
                      {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-start gap-2 h-auto disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="size-[18px] animate-spin" aria-hidden />
                        Keluar...
                      </>
                    ) : (
                      <>
                        <LogOut className="size-[18px]" aria-hidden />
                        Keluar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Header - Original Design */}
      <header className="hidden md:flex sticky top-0 z-10 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-xl px-6 md:px-8 pt-8 pb-4 flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <nav className="flex text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            <span className="hover:text-primary transition-colors cursor-pointer">Halaman</span>
            <span className="mx-2">/</span>
            <span className="text-text-primary-light dark:text-text-primary-dark font-medium">
              {viewName}
            </span>
          </nav>
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-white">{viewName}</h1>
        </div>

        <div className="flex items-center bg-white dark:bg-card-dark p-2 rounded-full shadow-sm gap-2">
          {/* Notification Bell (Desktop) */}
          <div className="relative">
            <Button
              ref={notifButtonRef}
              aria-label="Notifikasi"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-secondary-light hover:text-primary transition-colors relative h-10 w-10"
            >
              <Bell className="size-6" aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5 border-2 border-white dark:border-card-dark">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
            <NotificationPanel ref={notifPanelRef} />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? 'Mode terang' : 'Mode gelap'}
            className="text-text-secondary-light hover:text-primary transition-colors h-10 w-10"
          >
            {isDarkMode ? (
              <Sun className="size-6" aria-hidden />
            ) : (
              <Moon className="size-6" aria-hidden />
            )}
          </Button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              ref={userMenuButtonRef}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold cursor-pointer overflow-hidden border-2 border-white dark:border-gray-700 ml-2 hover:scale-105 transition-transform"
            >
              {getAvatarContent()}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-card-dark rounded-2xl shadow-lg overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 dark:border-white/10">
                  <p className="text-sm font-bold text-text-primary-light dark:text-white">
                    {userProfile?.full_name}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs font-bold text-white rounded-full ${roleBadge.color}`}
                  >
                    {roleBadge.label}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-start gap-2 h-auto disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="size-[18px] animate-spin" aria-hidden />
                      Keluar...
                    </>
                  ) : (
                    <>
                      <LogOut className="size-[18px]" aria-hidden />
                      Keluar
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
