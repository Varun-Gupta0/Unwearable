import React from 'react';
import styles from './state.module.css';

/** Props accepted by the `LoadingState` component. */
interface LoadingStateProps {
  /** Text displayed beneath the spinner. Defaults to `'Loading...'`. */
  message?: string;
  /** Extra CSS class applied to the overlay wrapper. */
  className?: string;
}

/**
 * Full-screen glassmorphic overlay that displays a spinning indicator.
 * Use as the return value of Next.js `loading.tsx` segment files or
 * anywhere a suspense-style placeholder is needed.
 *
 * @example
 * ```tsx
 * // app/account/orders/loading.tsx
 * export default function Loading() {
 *   return <LoadingState message="Loading your orders..." />;
 * }
 * ```
 */

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className = '',
}) => {
  return (
    <div className={`${styles.overlay} ${className}`} role="status">
      <div className={styles.container}>
        <div className={styles.spinner} />
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
};
