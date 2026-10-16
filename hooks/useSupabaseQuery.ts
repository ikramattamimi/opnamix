import { useNavigate } from 'react-router-dom';

/*
 * Note: While TanStack Query handles states well, this file can serve
 * as a place for shared configurations (like default staleTime) or error logging.
 * For now, standard useQuery is sufficient, but we keep this file structure
 * for future extensibility (e.g. tracking online status).
 */

export const QUERY_KEYS = {
  products: ['products'],
  services: ['services'],
  serviceCategories: ['serviceCategories'],
  stockIn: ['stockIn'],
  stockOut: ['stockOut'],
  users: ['users']
};
