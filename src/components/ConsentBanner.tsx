/**
 * KENA Consent Banner Component
 * Bannière de consentement RGPD/LPD suisse
 * Intégration avec Google Consent Mode v2
 */

import { useState, useEffect, useCallback } from 'react';
import { updateConsentMode, getSavedConsentPreferences, type ConsentPreferences } from '../lib/analytics/tracking';

// ============================================
// Types
// ============================================

interface ConsentBannerProps {
  position?: 'bottom' | 'top';
  showDelay?: number;
  onConsentGiven?: (preferences: ConsentPreferences) => void;
}

// ============================================
// Styles (CSS-in-JS via style attributes)
// ============================================

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  overlayVisible: {
    opacity: 1,
  },
  banner: {
    position: 'fixed' as const,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'var(--color-background, #ffffff)',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
    padding: '1rem',
    transform: 'translateY(100%)',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
  },
  bannerVisible: {
    transform: 'translateY(0)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--color-text, #1a1a1a)',
    margin: 0,
  },
  description: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted, #666666)',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  optionsGrid: {
    display: 'grid',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  optionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: 'var(--color-surface, #f5f5f5)',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border, #e0e0e0)',
    transition: 'border-color 0.2s ease',
  },
  optionItemSelected: {
    borderColor: 'var(--color-primary, #0066cc)',
    backgroundColor: 'var(--color-primary-light, #e6f2ff)',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    minWidth: '20px',
    cursor: 'pointer',
    accentColor: 'var(--color-primary, #0066cc)',
  },
  checkboxDisabled: {
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: 'var(--color-text, #1a1a1a)',
    marginBottom: '0.25rem',
  },
  optionDescription: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-muted, #666666)',
    lineHeight: 1.5,
  },
  buttonsContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.9375rem',
    fontWeight: 500,
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px',
    minHeight: '44px',
  },
  buttonPrimary: {
    backgroundColor: 'var(--color-primary, #0066cc)',
    color: '#ffffff',
  },
  buttonSecondary: {
    backgroundColor: 'var(--color-surface, #f5f5f5)',
    color: 'var(--color-text, #1a1a1a)',
    border: '1px solid var(--color-border, #e0e0e0)',
  },
  buttonAccept: {
    backgroundColor: 'var(--color-success, #28a745)',
    color: '#ffffff',
  },
  link: {
    color: 'var(--color-primary, #0066cc)',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  detailsToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    color: 'var(--color-primary, #0066cc)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    padding: '0.5rem 0',
    marginBottom: '1rem',
  },
};

// ============================================
// Consent Options Data
// ============================================

interface ConsentOption {
  id: keyof ConsentPreferences;
  title: string;
  description: string;
  required: boolean;
}

const consentOptions: ConsentOption[] = [
  {
    id: 'necessary',
    title: 'Cookies nécessaires',
    description: 'Essentiels au fonctionnement du site. Ne peuvent pas être désactivés.',
    required: true,
  },
  {
    id: 'analytics',
    title: 'Cookies analytiques',
    description: 'Nous aident à comprendre comment vous interagissez avec le site (Google Analytics 4).',
    required: false,
  },
  {
    id: 'marketing',
    title: 'Cookies marketing',
    description: 'Permettent de vous proposer des publicités pertinentes basées sur vos centres d\'intérêt.',
    required: false,
  },
  {
    id: 'preferences',
    title: 'Cookies de préférences',
    description: 'Mémorisent vos préférences pour une meilleure expérience personnalisée.',
    required: false,
  },
];

// ============================================
// Component
// ============================================

export function ConsentBanner({
  position = 'bottom',
  showDelay = 1000,
  onConsentGiven,
}: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  // Vérifier si le consentement a déjà été donné
  useEffect(() => {
    const savedPreferences = getSavedConsentPreferences();
    
    if (!savedPreferences) {
      // Afficher la bannière après un délai
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, showDelay);
      
      return () => clearTimeout(timer);
    }
  }, [showDelay]);

  // Gérer le changement de préférence
  const handlePreferenceChange = useCallback((id: keyof ConsentPreferences, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [id]: checked,
    }));
  }, []);

  // Accepter tous les cookies
  const handleAcceptAll = useCallback(() => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    
    updateConsentMode(allAccepted);
    setIsVisible(false);
    onConsentGiven?.(allAccepted);
  }, [onConsentGiven]);

  // Refuser les cookies optionnels
  const handleRejectOptional = useCallback(() => {
    const onlyNecessary: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    
    updateConsentMode(onlyNecessary);
    setIsVisible(false);
    onConsentGiven?.(onlyNecessary);
  }, [onConsentGiven]);

  // Sauvegarder les préférences personnalisées
  const handleSavePreferences = useCallback(() => {
    updateConsentMode(preferences);
    setIsVisible(false);
    onConsentGiven?.(preferences);
  }, [preferences, onConsentGiven]);

  // Toggle l'affichage des détails
  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          ...styles.overlay,
          ...(isVisible ? styles.overlayVisible : {}),
        }}
        onClick={handleRejectOptional}
      />

      {/* Banner */}
      <div
        style={{
          ...styles.banner,
          ...(isVisible ? styles.bannerVisible : {}),
          ...(position === 'top' ? { top: 0, bottom: 'auto', transform: 'translateY(-100%)' } : {}),
        }}
        role="dialog"
        aria-labelledby="consent-title"
        aria-describedby="consent-description"
      >
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <h2 id="consent-title" style={styles.title}>
              Vos choix en matière de cookies
            </h2>
          </div>

          {/* Description */}
          <p id="consent-description" style={styles.description}>
            Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et 
            personnaliser le contenu. En cliquant sur "Accepter tout", vous consentez à notre 
            utilisation des cookies. Vous pouvez également personnaliser vos préférences.
            <br />
            <a 
              href="/politique-confidentialite" 
              style={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              En savoir plus sur notre politique de confidentialité
            </a>
          </p>

          {/* Toggle Details Button */}
          <button
            onClick={toggleDetails}
            style={styles.detailsToggle}
            aria-expanded={showDetails}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {showDetails ? 'Masquer les options' : 'Personnaliser mes choix'}
          </button>

          {/* Options Details */}
          {showDetails && (
            <div style={styles.optionsGrid}>
              {consentOptions.map((option) => (
                <div
                  key={option.id}
                  style={{
                    ...styles.optionItem,
                    ...(preferences[option.id] && !option.required ? styles.optionItemSelected : {}),
                  }}
                >
                  <input
                    type="checkbox"
                    id={`consent-${option.id}`}
                    checked={preferences[option.id]}
                    disabled={option.required}
                    onChange={(e) => handlePreferenceChange(option.id, e.target.checked)}
                    style={{
                      ...styles.checkbox,
                      ...(option.required ? styles.checkboxDisabled : {}),
                    }}
                    aria-describedby={`consent-${option.id}-description`}
                  />
                  <div style={styles.optionContent}>
                    <div style={styles.optionTitle}>
                      {option.title}
                      {option.required && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted, #666)' }}>(obligatoire)</span>}
                    </div>
                    <div id={`consent-${option.id}-description`} style={styles.optionDescription}>
                      {option.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div style={styles.buttonsContainer}>
            <button
              onClick={handleRejectOptional}
              style={{ ...styles.button, ...styles.buttonSecondary }}
            >
              Refuser les cookies optionnels
            </button>
            
            {showDetails && (
              <button
                onClick={handleSavePreferences}
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                Sauvegarder mes choix
              </button>
            )}
            
            <button
              onClick={handleAcceptAll}
              style={{ ...styles.button, ...styles.buttonAccept }}
            >
              Accepter tout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConsentBanner;