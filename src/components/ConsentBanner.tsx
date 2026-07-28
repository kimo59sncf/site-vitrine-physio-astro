import { useState, useEffect } from 'react';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

export default function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(defaultPreferences);

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const stored = sessionStorage.getItem('kena_consent_preferences');
    if (!stored) {
      setIsVisible(true);
    }
  }, []);

  const updateConsent = (newPreferences: ConsentPreferences) => {
    // Mettre à jour le Consent Mode v2
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': newPreferences.analytics ? 'granted' : 'denied',
        'ad_storage': newPreferences.marketing ? 'granted' : 'denied',
        'ad_user_data': newPreferences.marketing ? 'granted' : 'denied',
        'ad_personalization': newPreferences.marketing ? 'granted' : 'denied',
        'personalization_storage': newPreferences.preferences ? 'granted' : 'denied',
      });
    }

    // Stocker les préférences
    sessionStorage.setItem('kena_consent_preferences', JSON.stringify(newPreferences));

    // Envoyer l'événement au dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'consent_update',
      consent_preferences: newPreferences,
    });
  };

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    updateConsent(allAccepted);
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    updateConsent(defaultPreferences);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    updateConsent(preferences);
    setIsVisible(false);
  };

  const handleToggle = (key: keyof ConsentPreferences) => {
    if (key === 'necessary') return; // Toujours activé
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        {!showDetails ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <p>
                Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic.
                En cliquant "Accepter tout", vous consentez à notre utilisation des cookies.
                <a href="/privacy" className="text-blue-600 hover:underline ml-1">
                  En savoir plus
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Refuser
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Personnaliser
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Accepter tout
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Préférences de cookies</h3>
            
            <div className="space-y-3">
              <CookieOption
                title="Cookies nécessaires"
                description="Essentiels au fonctionnement du site. Ne peuvent pas être désactivés."
                checked={true}
                disabled={true}
                onChange={() => {}}
              />
              <CookieOption
                title="Cookies analytiques"
                description="Nous aident à comprendre comment vous interagissez avec le site."
                checked={preferences.analytics}
                onChange={() => handleToggle('analytics')}
              />
              <CookieOption
                title="Cookies marketing"
                description="Utilisés pour afficher des publicités pertinentes."
                checked={preferences.marketing}
                onChange={() => handleToggle('marketing')}
              />
              <CookieOption
                title="Cookies de préférences"
                description="Mémorisent vos préférences et paramètres."
                checked={preferences.preferences}
                onChange={() => handleToggle('preferences')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sauvegarder mes préférences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CookieOptionProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}

function CookieOption({ title, description, checked, disabled, onChange }: CookieOptionProps) {
  return (
    <div className="flex items-start gap-3">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
      </label>
      <div>
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
