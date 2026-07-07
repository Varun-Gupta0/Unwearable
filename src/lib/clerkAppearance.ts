/**
 * Minimal Clerk appearance configuration that aligns with Unwearable's brutalist design.
 * It re‑uses the project's existing font and primary color variables.
 */
export const appearance = {
  variables: {
    // Adjust to match the project's existing font family.
    fontFamily: 'Inter, sans-serif',
    // Replace with the actual primary brand color defined in your CSS/theme.
    colorPrimary: '#ff4500',
  },
  elements: {
    button: {
      borderRadius: '0px',
    },
    input: {
      backgroundColor: 'inherit',
    },
  },
};
