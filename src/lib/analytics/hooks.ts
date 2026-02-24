/**
 * KENA Analytics Hooks
 * Hooks React pour l'utilisation facile du tracking analytique
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  pushToDataLayer,
  trackCTAClick,
  trackFormSubmission,
  trackFormStart,
  type FormTrackingConfig,
} from './tracking';

// ============================================
// useDataLayer Hook
// ============================================

/**
 * Hook pour pousser des événements dans le Data Layer
 */
export function useDataLayer() {
  const pushEvent = useCallback((event: string, data?: Record<string, unknown>) => {
    pushToDataLayer({
      event,
      ...data,
    });
  }, []);

  return { pushEvent };
}

// ============================================
// useCTATracking Hook
// ============================================

/**
 * Hook pour tracker les clics sur CTA
 */
export function useCTATracking(ctaName: string, ctaLocation: string) {
  const handleClick = useCallback(
    (ctaType: 'primary' | 'secondary' | 'link' | 'button' = 'button') => {
      trackCTAClick(ctaName, ctaLocation, ctaType);
    },
    [ctaName, ctaLocation]
  );

  return { handleClick };
}

// ============================================
// useFormTracking Hook
// ============================================

/**
 * Hook pour tracker les interactions avec les formulaires
 */
export function useFormTracking(config: FormTrackingConfig) {
  const hasStartedRef = useRef(false);

  const trackStart = useCallback(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      trackFormStart(config);
    }
  }, [config]);

  const trackSubmit = useCallback(
    (success: boolean = true) => {
      trackFormSubmission(config, success);
    },
    [config]
  );

  return { trackStart, trackSubmit };
}

// ============================================
// useScrollTracking Hook
// ============================================

/**
 * Hook pour tracker la profondeur de scroll sur un élément spécifique
 */
export function useScrollTracking(
  elementRef: React.RefObject<HTMLElement>,
  milestones: number[] = [25, 50, 75, 100]
) {
  const trackedMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);

      milestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !trackedMilestonesRef.current.has(milestone)) {
          trackedMilestonesRef.current.add(milestone);
          pushToDataLayer({
            event: 'element_scroll_depth',
            event_category: 'Engagement',
            event_label: `${milestone}%`,
            value: milestone,
            element_id: element.id || 'unknown',
          });
        }
      });
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [elementRef, milestones]);
}

// ============================================
// useVisibilityTracking Hook
// ============================================

/**
 * Hook pour tracker la visibilité d'un élément
 */
export function useVisibilityTracking(
  elementRef: React.RefObject<HTMLElement>,
  eventName: string,
  options: { threshold?: number; once?: boolean } = {}
) {
  const { threshold = 0.5, once = true } = options;
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!once || !hasTrackedRef.current)) {
            hasTrackedRef.current = true;
            pushToDataLayer({
              event: eventName,
              event_category: 'Visibility',
              element_id: element.id || 'unknown',
              visibility_ratio: entry.intersectionRatio,
            });
          }
        });
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, eventName, threshold, once]);
}

// ============================================
// useTimeOnPage Hook
// ============================================

/**
 * Hook pour tracker le temps passé sur une page
 */
export function useTimeOnPage(pageName: string) {
  const startTimeRef = useRef<number | null>(null);
  const totalTimeRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = Date.now();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && startTimeRef.current) {
        totalTimeRef.current += Date.now() - startTimeRef.current;
        startTimeRef.current = null;
      } else if (document.visibilityState === 'visible') {
        startTimeRef.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      if (startTimeRef.current) {
        totalTimeRef.current += Date.now() - startTimeRef.current;
      }

      const totalTimeSeconds = Math.round(totalTimeRef.current / 1000);
      pushToDataLayer({
        event: 'time_on_page',
        event_category: 'Engagement',
        page_name: pageName,
        time_seconds: totalTimeSeconds,
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pageName]);
}

// ============================================
// useErrorTracking Hook
// ============================================

/**
 * Hook pour tracker les erreurs JavaScript
 */
export function useErrorTracking() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      pushToDataLayer({
        event: 'javascript_error',
        event_category: 'Error',
        error_message: event.message,
        error_file: event.filename,
        error_line: event.lineno,
        error_column: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      pushToDataLayer({
        event: 'unhandled_promise_rejection',
        event_category: 'Error',
        error_message: String(event.reason),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
}

// ============================================
// usePerformanceTracking Hook
// ============================================

/**
 * Hook pour tracker les métriques de performance Web Vitals
 */
export function usePerformanceTracking() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const trackWebVital = (name: string, value: number) => {
      pushToDataLayer({
        event: 'web_vital',
        event_category: 'Performance',
        metric_name: name,
        metric_value: Math.round(value),
      });
    };

    // Track Navigation Timing
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      pushToDataLayer({
        event: 'navigation_timing',
        event_category: 'Performance',
        dns_time: Math.round(navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart),
        tcp_time: Math.round(navigationTiming.connectEnd - navigationTiming.connectStart),
        request_time: Math.round(navigationTiming.responseStart - navigationTiming.requestStart),
        response_time: Math.round(navigationTiming.responseEnd - navigationTiming.responseStart),
        dom_processing: Math.round(navigationTiming.domComplete - navigationTiming.domInteractive),
        total_load_time: Math.round(navigationTiming.loadEventEnd - navigationTiming.fetchStart),
      });
    }

    // Track Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      trackWebVital('LCP', lastEntry.startTime);
    });

    // Track First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if ('processingStart' in entry) {
          trackWebVital('FID', (entry as PerformanceEventTiming).processingStart - entry.startTime);
        }
      });
    });

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if ('value' in entry && !(entry as LayoutShiftEntry).hadRecentInput) {
          clsValue += (entry as LayoutShiftEntry).value;
        }
      });
      trackWebVital('CLS', clsValue * 1000);
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      fidObserver.observe({ type: 'first-input', buffered: true });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Browser doesn't support these APIs
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);
}

// Type for Layout Shift Entry
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

// Type for Performance Event Timing
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

// ============================================
// Export all hooks
// ============================================

export default {
  useDataLayer,
  useCTATracking,
  useFormTracking,
  useScrollTracking,
  useVisibilityTracking,
  useTimeOnPage,
  useErrorTracking,
  usePerformanceTracking,
};
