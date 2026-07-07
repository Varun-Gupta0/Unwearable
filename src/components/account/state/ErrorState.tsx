import React from 'react';
import styles from './state.module.css';

/** Props accepted by the `ErrorState` component. */
interface ErrorStateProps {
  /** Heading shown in the error card. Defaults to `'Something went wrong'`. */
  title?: string;
  /** Human-readable description of the error. */
  message?: string;
  /** Raw error value — displayed in a `<pre>` block when provided. */
  error?: unknown;
  /** Optional callback wired to the retry/action button. */
  onRetry?: () => void;
  /** Label for the retry button. Defaults to `'Retry'`. */
  actionLabel?: string;
  /** Extra CSS class applied to the overlay wrapper. */
  className?: string;
}

/**
 * Full-screen glassmorphic overlay that displays an error state.
 * Renders an optional `<pre>` block with raw error details and a
 * configurable retry button when `onRetry` is provided.
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load orders"
 *   message={err.message}
 *   onRetry={refetch}
 * />
 * ```
 */

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We were unable to load the data.',
  error,
  onRetry,
  actionLabel = 'Retry',
  className = '',
}) => {
  return (
    <div className={`${styles.overlay} ${className}`} role="alert">
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        {error ? <pre className={styles.error}>{String(error)}</pre> : null}
        {onRetry && (
          <button className={styles.button} onClick={onRetry}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
