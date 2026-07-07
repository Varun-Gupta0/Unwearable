"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/account/state/ErrorState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong!"
      message="We're having trouble loading this page."
      onRetry={reset}
      error={error}
    />
  );
}
