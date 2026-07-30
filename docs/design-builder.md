# Custom Design Builder

The Custom Design Builder is a complex interactive frontend application embedded within the platform, allowing users to customize apparel with text, images, and layers before ordering.

## Architecture

The builder is heavily client-side, utilizing the HTML5 Canvas API (via libraries like Fabric.js or raw canvas manipulation) to render designs in real-time.

### State Management (`DesignContext`)
Because the builder requires tracking multiple distinct pieces of state (current active layer, text properties, colors, base template), it utilizes a dedicated React Context (`DesignContext`).

State tracks:
- `layers`: Array of design elements (images, text).
- `activeLayerId`: The currently selected element for editing.
- `template`: The base product image and printable area bounds.

### Performance
To maintain 60FPS during dragging and resizing operations, the canvas rendering logic is optimized to only re-paint bounding boxes when necessary, leveraging React's `useMemo` and `useCallback` to prevent unnecessary re-renders of the sidebar controls.

## Future Plans (Phase 2)
Currently, the builder is integrated directly into the `src/app` routes. As part of our architectural roadmap, the Custom Builder logic will be completely isolated from the main e-commerce platform. It will be migrated into a separate, standalone local environment to prevent feature bloat on the main repository, returning compiled design assets back to the main app only when an order is finalized.
