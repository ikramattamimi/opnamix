export interface PaginationParams {
  page: number;
  perPage: number;
  search?: string; // Optional search term for filtering
  status?: string; // Optional status filter
  createdBy?: string; // Optional filter by creator user ID
  nakesName?: string; // Optional filter by nakes name (nama_nakes column)
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
