import React from 'react';
import styles from './state.module.css';

/** Props accepted by the `EmptyState` component. */
interface EmptyStateProps {
  /** Heading displayed in the card. Defaults to `'No data available'`. */
  title?: string;
  /** Supporting text below the title. */
  description?: string;
  /** Optional custom illustration rendered above the title. */
  illustration?: React.ReactNode;
  /** Callback for the optional CTA button. */
  onAction?: () => void;
  /** Label for the CTA button. Defaults to `'Take Action'`. */
  actionLabel?: string;
  /** Extra CSS class applied to the overlay wrapper. */
  className?: string;
}

/**
 * Full-screen glassmorphic overlay indicating that a list or dataset
 * is empty. Supports an optional custom illustration and a CTA button.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No orders yet"
 *   description="Place your first order to see it here."
 *   onAction={() => router.push('/shop')}
 *   actionLabel="Shop now"
 * />
 * ```
 */

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available',
  description = 'There is nothing to display at the moment.',
  illustration,
  onAction,
  actionLabel = 'Take Action',
  className = '',
}) => {
  return (
    <div className={`${styles.overlay} ${className}`} role="status">
      <div className={styles.container}>
        {illustration && <div className={styles.illustration}>{illustration}</div>}
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{description}</p>
        {onAction && (
          <button className={styles.button} onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
