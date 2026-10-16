import { matchPath } from 'react-router-dom';
import type { AppRoute, SidebarParent } from './routes';

// Logika murni di atas APP_ROUTES: akses per role, judul halaman, dan menu sidebar.

export const DEFAULT_TITLE = 'Opnamix';

interface ProfileWithRoles {
  roles?: string[] | null;
  role?: string | null;
}

export function getUserRoles(profile: ProfileWithRoles | null | undefined): string[] {
  return profile?.roles ?? (profile?.role ? [profile.role] : []);
}

export function canAccessRoute(route: Pick<AppRoute, 'roles'>, userRoles: readonly string[]) {
  if (!route.roles) return true;
  return route.roles.some((r) => userRoles.includes(r));
}

export function findRoute(pathname: string, routes: readonly AppRoute[]): AppRoute | undefined {
  return routes.find((route) => matchPath({ path: route.path, end: true }, pathname));
}

export function getRouteTitle(pathname: string, routes: readonly AppRoute[]): string {
  return findRoute(pathname, routes)?.title ?? DEFAULT_TITLE;
}

export type SidebarNode =
  | { kind: 'group'; label: string }
  | { kind: 'item'; route: AppRoute }
  | { kind: 'parent'; parent: SidebarParent; children: AppRoute[] };

// Mengubah daftar route menjadi urutan node sidebar yang boleh dilihat user.
// Judul grup muncul sekali sebelum item pertama grup itu, dan hanya kalau ada
// item grup yang terlihat. Item dengan parent yang sama digabung jadi satu node.
export function buildSidebarNodes(
  routes: readonly AppRoute[],
  userRoles: readonly string[],
): SidebarNode[] {
  const nodes: SidebarNode[] = [];
  let currentGroup: string | undefined;

  for (const route of routes) {
    const sidebar = route.sidebar;
    if (!route.showInSidebar || !sidebar || !canAccessRoute(route, userRoles)) continue;

    if (sidebar.group !== currentGroup) {
      if (sidebar.group) nodes.push({ kind: 'group', label: sidebar.group });
      currentGroup = sidebar.group;
    }

    if (sidebar.parent) {
      const last = nodes[nodes.length - 1];
      if (last?.kind === 'parent' && last.parent === sidebar.parent) {
        last.children.push(route);
      } else {
        nodes.push({ kind: 'parent', parent: sidebar.parent, children: [route] });
      }
      continue;
    }

    nodes.push({ kind: 'item', route });
  }

  return nodes;
}
