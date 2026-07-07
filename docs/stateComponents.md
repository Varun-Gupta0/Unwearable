# Account State Components

Reusable UI components that standardize error, loading, and empty states across the account area.

**Location:** `src/components/account/state/`

---

## Components

### `ErrorState`

Displays a full-screen glassmorphic overlay when a data fetch fails.

```tsx
import { ErrorState } from '@/components/account/state/ErrorState';

<ErrorState
  title="Failed to load orders"
  message="We couldn't fetch your order history."
  error={err}          // optional — shows raw error in <pre>
  onRetry={refetch}    // optional — shows a Retry button
  actionLabel="Try again"
/>
```

| Prop | Type | Default |
|---|---|---|
| `title` | `string` | `'Something went wrong'` |
| `message` | `string` | `'We were unable to load the data.'` |
| `error` | `unknown` | — |
| `onRetry` | `() => void` | — |
| `actionLabel` | `string` | `'Retry'` |
| `className` | `string` | `''` |

---

### `LoadingState`

Displays a centered spinner with an optional message.

```tsx
import { LoadingState } from '@/components/account/state/LoadingState';

// Use in Next.js loading.tsx segments:
export default function Loading() {
  return <LoadingState message="Loading your orders..." />;
}
```

| Prop | Type | Default |
|---|---|---|
| `message` | `string` | `'Loading...'` |
| `className` | `string` | `''` |

---

### `EmptyState`

Displays a placeholder when a list or dataset is empty.

```tsx
import { EmptyState } from '@/components/account/state/EmptyState';

<EmptyState
  title="No orders yet"
  description="Place your first order to see it here."
  onAction={() => router.push('/shop')}
  actionLabel="Shop now"
/>
```

| Prop | Type | Default |
|---|---|---|
| `title` | `string` | `'No data available'` |
| `description` | `string` | `'There is nothing to display at the moment.'` |
| `illustration` | `ReactNode` | — |
| `onAction` | `() => void` | — |
| `actionLabel` | `string` | `'Take Action'` |
| `className` | `string` | `''` |

---

## Supabase Query Hook

`src/lib/supabaseHooks.ts` provides `useSupabaseQuery<T>` — a generic client-side hook that wraps any async fetch with loading, error, and data states.

```tsx
import { useSupabaseQuery } from '@/lib/supabaseHooks';

const { data, error, loading, refetch } = useSupabaseQuery(() =>
  supabase.from('orders').select('*').then(({ data, error }) => {
    if (error) throw error;
    return data;
  })
);

if (loading) return <LoadingState />;
if (error)   return <ErrorState onRetry={refetch} />;
if (!data?.length) return <EmptyState />;
```

> **Note:** Wrap `fetchFn` in `useCallback` if it depends on component state to avoid infinite refetch loops.

---

## Where They Are Used

| Route | Component | State type |
|---|---|---|
| `src/app/account/orders/loading.tsx` | `LoadingState` | Next.js loading segment |
| `src/app/account/orders/error.tsx` | `ErrorState` | Next.js error boundary |
| `src/app/account/orders/page.tsx` | `ErrorState`, `EmptyState` | Server-side fetch result |
| `src/app/account/page.tsx` | `EmptyState` | Empty recent activity |

---

## Styling

Shared styles live in `src/components/account/state/state.module.css`.  
The `.overlay` class produces a full-screen fixed overlay. To use a component **inline** (not full-screen), override it with a `className`:

```tsx
<EmptyState
  className="relative inset-auto backdrop-filter-none bg-white border-3 border-brutal-black"
/>
```
