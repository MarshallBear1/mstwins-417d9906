
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const LazyOptimizedHowItWorks = lazy(() => import('./OptimizedHowItWorks'));
const LazyMatchingAnimation = lazy(() => import('./MatchingAnimation'));
const LazySocialProof = lazy(() => import('./SocialProof'));
const LazyTrustSignals = lazy(() => import('./TrustSignals'));
const LazyFooter = lazy(() => import('./Footer'));
const LazyLaunchStats = lazy(() => import('./LaunchStats'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Wrapper components with suspense
export const OptimizedHowItWorksLazy = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyOptimizedHowItWorks />
  </Suspense>
);

export const MatchingAnimationLazy = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyMatchingAnimation />
  </Suspense>
);

export const SocialProofLazy = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazySocialProof />
  </Suspense>
);

export const TrustSignalsLazy = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyTrustSignals />
  </Suspense>
);

export const FooterLazy = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyFooter />
  </Suspense>
);

export const LaunchStatsLazy = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyLaunchStats />
  </Suspense>
);
