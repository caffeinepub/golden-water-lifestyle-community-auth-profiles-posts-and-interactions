import { lazy, Suspense } from 'react';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import RouteChunkLoading from './components/state/RouteChunkLoading';

// Lazy load route pages for code splitting
const FeedPage = lazy(() => import('./pages/FeedPage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));
const TipsPage = lazy(() => import('./pages/TipsPage'));
const FactsPage = lazy(() => import('./pages/FactsPage'));
const LoveTheLiquidPage = lazy(() => import('./pages/LoveTheLiquidPage'));
const GoldWaterTrackerPage = lazy(() => import('./pages/GoldWaterTrackerPage'));

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Suspense fallback={<RouteChunkLoading />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feed',
  component: FeedPage,
});

const postDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/post/$postId',
  component: PostDetailPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPanelPage,
});

const tipsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tips',
  component: TipsPage,
});

const factsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/facts',
  component: FactsPage,
});

const loveTheLiquidRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/love-the-liquid',
  component: LoveTheLiquidPage,
});

const goldWaterTrackerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gold-water-tracker',
  component: GoldWaterTrackerPage,
});

const routeTree = rootRoute.addChildren([indexRoute, feedRoute, postDetailRoute, profileRoute, adminRoute, tipsRoute, factsRoute, loveTheLiquidRoute, goldWaterTrackerRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
