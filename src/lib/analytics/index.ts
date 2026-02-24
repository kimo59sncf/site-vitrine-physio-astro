/**
 * KENA Analytics Module
 * Point d'entrée principal pour l'export de tous les modules analytiques
 */

// Core tracking functions
export {
  initializeAnalytics,
  initializeConsentMode,
  updateConsentMode,
  hasConsent,
  getSavedConsentPreferences,
  pushToDataLayer,
  trackPageView,
  trackCTAClick,
  trackFormSubmission,
  trackFormStart,
  setupScrollDepthTracking,
  setupAutoPageViewTracking,
  setupCTATracking,
  setupFormTracking,
  setupEngagementTimeTracking,
  type ConsentState,
  type ConsentPreferences,
  type DataLayerEvent,
  type PageViewData,
  type ScrollDepthConfig,
  type FormTrackingConfig,
} from './tracking';

// React Hooks
export {
  useDataLayer,
  useCTATracking,
  useFormTracking,
  useScrollTracking,
  useVisibilityTracking,
  useTimeOnPage,
  useErrorTracking,
  usePerformanceTracking,
} from './hooks';

// Default export
export { default as analytics } from './tracking';
