# Development Guidelines

## UI Components

### Data Table

We use `@tanstack/react-table` with a custom `DataTable` component.

**Usage:**

```tsx
import { DataTable } from '@/components/ui/data-table';
import { createPageColumns } from './PageColumns';

// ...
<DataTable columns={columns} data={data} searchable={true} />;
```

**Creating Columns:**
Use the `createColumnHelper` pattern or standard column definitions. Ensure the first column includes the decorative row indicator:

```tsx
cell: ({ row }) => (
  <div className="flex items-center gap-3">
    <div className="w-1 h-10 bg-primary rounded-full"></div>
    {/* Content */}
  </div>
);
```

### Buttons

Use the `shadcn/ui` Button component.

- **Primary actions**: `variant="default"` (Uses gradient)
- **Secondary actions**: `variant="secondary"` or `variant="outline"`
- **Icon only**: `size="icon" variant="ghost"`

## State Management

- **Server State**: React Query (TanStack Query) v5
- **Database**: Supabase
- **Pagination**: Handled via `PaginationParams` interface passed to API calls.
