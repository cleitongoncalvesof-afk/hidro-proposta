import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
  loader: () => {
    // Redirect / to /dashboard client-side; ssr disabled by parent layout.
    if (typeof window !== "undefined") window.location.replace("/dashboard");
    return null;
  },
  component: () => null,
});
