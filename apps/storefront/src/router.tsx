import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createDefaultQueryClientOptions } from "@/lib/query-defaults";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: createDefaultQueryClientOptions(),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
