/**
 * KENA Analytics Module
 * Module de tracking analytique complet avec GA4, GTM et Consent Mode v2
 * Conforme RGPD/LPD suisse
 */

// ============================================
// Types & Interfaces
// ============================================

export interface ConsentState {
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
  functionality_storage: 'granted' | 'denied';
  personalization_storage: 'granted' | 'denied';
  security_storage: 'granted' | 'denied';
}

export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface DataLayerEvent {
  event: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
}

export interface PageViewData {
  page_title: string;
  page_location: string;
  page_path: string;
  content_group?: string;
  user_type?: 'new' | 'returning';
}

export interface ScrollDepthConfig {
  milestones: number[];
  trackTimeout: number;
}

export interface FormTrackingConfig {
  formId: string;
  formName: string;
  formType: 'contact' | 'booking' | 'newsletter' | 'other';
}

// ============================================
// Consent Management
// ============================================

const CONSENT_STORAGE_KEY = 'kena_consent_preferences';
const DEFAULT_CONSENT: ConsentState = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'granted',
};

/**
 * Initialise le Consent Mode v2 avec les valeurs par défaut
 */
export function initializeConsentMode(): void {
  if (typeof window === 'undefined') return;

  const savedConsent = getSavedConsentPreferences();
  
  if (savedConsent) {
    updateConsentMode(savedConsent);
  } else {
    // Appliquer le consentement par défaut (tout refusé sauf nécessaire)
    pushToDataLayer({
      event: 'consent_default',
      consent_mode: DEFAULT_CONSENT,
    });
    
    // Commande gtag pour le consentement par défaut
    if (window.gtag) {
      window.gtag('consent', 'default', DEFAULT_CONSENT);
    }
  }
}

/**
 * Met à jour le Consent Mode selon les préférences utilisateur
 */
export function updateConsentMode(preferences: ConsentPreferences): void {
  const consentState: ConsentState = {
    ad_storage: preferences.marketing ? 'granted' : 'denied',
    ad_user_data: preferences.marketing ? 'granted' : 'denied',
    ad_personalization: preferences.marketing ? 'granted' : 'denied',
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
    functionality_storage: 'granted',
    personalization_storage: preferences.preferences ? 'granted' : 'denied',
    security_storage: 'granted',
  };

  // Mise à jour via gtag
  if (window.gtag) {
    window.gtag('consent', 'update', consentState);
  }

  // Push dans le dataLayer pour GTM
  pushToDataLayer({
    event: 'consent_update',
    consent_mode: consentState,
    consent_preferences: preferences,
  });

  // Sauvegarder les préférences
  saveConsentPreferences(preferences);
}

/**
 * Récupère les préférences de consentement sauvegardées
 */
export function getSavedConsentPreferences(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = sessionStorage.getItem(CONSENT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Sauvegarde les préférences de consentement
 */
function saveConsentPreferences(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    console.warn('Impossible de sauvegarder les préférences de consentement');
  }
}

/**
 * Vérifie si le consentement a été donné
 */
export function hasConsent(): boolean {
  return getSavedConsentPreferences() !== null;
}

// ============================================
// Data Layer Management
// ============================================

declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Initialise le Data Layer
 */
export function initializeDataLayer(): void {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
}

/**
 * Push un événement dans le Data Layer
 */
export function pushToDataLayer(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return;
  
  initializeDataLayer();
  window.dataLayer.push(event);
}

// ============================================
// Page View Tracking
// ============================================

/**
 * Track une page vue
 */
export function trackPageView(data: PageViewData): void {
  pushToDataLayer({
    event: 'page_view',
    page_title: data.page_title,
    page_location: data.page_location,
    page_path: data.page_path,
    content_group: data.content_group,
    user_type: data.user_type,
  });
}

/**
 * Track automatiquement les changements de page (SPA)
 */
export function setupAutoPageViewTracking(): void {
  if (typeof window === 'undefined') return;

  // Track initial page view
  trackPageView({
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
  });

  // Observer pour les changements de page (Astro View Transitions)
  document.addEventListener('astro:page-load', () => {
    trackPageView({
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
  });
}

// ============================================
// CTA Click Tracking
// ============================================

/**
 * Track un clic sur un CTA
 */
export function trackCTAClick(
  ctaName: string,
  ctaLocation: string,
  ctaType: 'primary' | 'secondary' | 'link' | 'button' = 'button'
): void {
  pushToDataLayer({
    event: 'cta_click',
    event_category: 'CTA',
    event_label: ctaName,
    cta_location: ctaLocation,
    cta_type: ctaType,
    value: 1,
  });
}

/**
 * Configure le tracking automatique des CTA
 */
export function setupCTATracking(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const ctaElement = target.closest('[data-cta]') as HTMLElement;
    
    if (ctaElement) {
      const ctaName = ctaElement.dataset.ctaName || ctaElement.textContent?.trim() || 'Unknown CTA';
      const ctaLocation = ctaElement.dataset.ctaLocation || getWindowLocation();
      const ctaType = (ctaElement.dataset.ctaType as 'primary' | 'secondary' | 'link' | 'button') || 'button';
      
      trackCTAClick(ctaName, ctaLocation, ctaType);
    }
  });
}

/**
 * Détermine la location du CTA basée sur la position dans la page
 */
function getWindowLocation(): string {
  const path = window.location.pathname;
  
  if (path === '/') return 'homepage';
  if (path.includes('/services')) return 'services_page';
  if (path.includes('/contact')) return 'contact_page';
  if (path.includes('/about')) return 'about_page';
  if (path.includes('/booking')) return 'booking_page';
  
  return 'other_page';
}

// ============================================
// Scroll Depth Tracking
// ============================================

let trackedMilestones: Set<number> = new Set();
let scrollTrackingTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Configure le tracking de profondeur de scroll
 */
export function setupScrollDepthTracking(config: ScrollDepthConfig = {
  milestones: [25, 50, 75, 90, 100],
  trackTimeout: 500,
}): void {
  if (typeof window === 'undefined') return;

  trackedMilestones = new Set();

  const trackScrollDepth = (): void => {
    if (scrollTrackingTimeout) {
      clearTimeout(scrollTrackingTimeout);
    }

    scrollTrackingTimeout = setTimeout(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      config.milestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
          trackedMilestones.add(milestone);
          
          pushToDataLayer({
            event: 'scroll_depth',
            event_category: 'Engagement',
            event_label: `${milestone}%`,
            value: milestone,
            scroll_percent: scrollPercent,
          });
        }
      });
    }, config.trackTimeout);
  };

  window.addEventListener('scroll', trackScrollDepth, { passive: true });
}

// ============================================
// Form Tracking
// ============================================

/**
 * Track une soumission de formulaire
 */
export function trackFormSubmission(config: FormTrackingConfig, success: boolean = true): void {
  pushToDataLayer({
    event: success ? 'form_submission_success' : 'form_submission_error',
    event_category: 'Form',
    event_label: config.formName,
    form_id: config.formId,
    form_name: config.formName,
    form_type: config.formType,
    value: success ? 1 : 0,
  });
}

/**
 * Track le début de saisie dans un formulaire
 */
export function trackFormStart(config: FormTrackingConfig): void {
  pushToDataLayer({
    event: 'form_start',
    event_category: 'Form',
    event_label: config.formName,
    form_id: config.formId,
    form_name: config.formName,
    form_type: config.formType,
  });
}

/**
 * Configure le tracking automatique des formulaires
 */
export function setupFormTracking(): void {
  if (typeof window === 'undefined') return;

  // Track form start on first input
  document.addEventListener('focusin', (event) => {
    const target = event.target as HTMLElement;
    const form = target.closest('form');
    
    if (form && target.matches('input, textarea, select')) {
      const formId = form.id || 'unknown_form';
      const formName = form.dataset.formName || formId;
      const formType = (form.dataset.formType as FormTrackingConfig['formType']) || 'other';
      
      if (!form.dataset.trackingStarted) {
        form.dataset.trackingStarted = 'true';
        trackFormStart({
          formId,
          formName,
          formType,
        });
      }
    }
  });

  // Track form submission
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    
    if (form) {
      const formId = form.id || 'unknown_form';
      const formName = form.dataset.formName || formId;
      const formType = (form.dataset.formType as FormTrackingConfig['formType']) || 'other';
      
      trackFormSubmission({
        formId,
        formName,
        formType,
      });
    }
  });
}

// ============================================
// Engagement Time Tracking
// ============================================

let engagementStartTime: number | null = null;
let totalEngagementTime = 0;

/**
 * Configure le tracking du temps d'engagement
 */
export function setupEngagementTimeTracking(): void {
  if (typeof window === 'undefined') return;

  const startEngagement = (): void => {
    if (!engagementStartTime) {
      engagementStartTime = Date.now();
    }
  };

  const stopEngagement = (): void => {
    if (engagementStartTime) {
      totalEngagementTime += Date.now() - engagementStartTime;
      engagementStartTime = null;
    }
  };

  // Start tracking on page visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      startEngagement();
    } else {
      stopEngagement();
    }
  });

  // Track on page unload
  window.addEventListener('beforeunload', () => {
    stopEngagement();
    
    const totalTimeSeconds = Math.round(totalEngagementTime / 1000);
    
    pushToDataLayer({
      event: 'engagement_time',
      event_category: 'Engagement',
      value: totalTimeSeconds,
      engagement_time_seconds: totalTimeSeconds,
    });
  });

  // Start if page is visible
  if (document.visibilityState === 'visible') {
    startEngagement();
  }
}

// ============================================
// Initialize All Tracking
// ============================================

/**
 * Initialise tous les systèmes de tracking
 */
export function initializeAnalytics(): void {
  if (typeof window === 'undefined') return;

  // Initialize Data Layer first
  initializeDataLayer();
  
  // Initialize Consent Mode
  initializeConsentMode();
  
  // Setup tracking modules
  setupAutoPageViewTracking();
  setupCTATracking();
  setupScrollDepthTracking();
  setupFormTracking();
  setupEngagementTimeTracking();

  // Push initialization event
  pushToDataLayer({
    event: 'analytics_initialized',
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// Export default
// ============================================

export default {
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
};
