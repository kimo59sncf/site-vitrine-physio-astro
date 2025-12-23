import React, { useState } from 'react';
import { Upload, User, Mail, Phone, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
  prescription?: File | null;
}

interface FormStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

const BookingForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    reason: '',
    message: '',
    prescription: null,
  });

  const [status, setStatus] = useState<FormStatus>({
    type: 'idle',
    message: '',
  });

  const [filePreview, setFilePreview] = useState<string | null>(null);

  const reasons = [
    'Rééducation post-opératoire',
    'Thérapie manuelle',
    'Performance sportive',
    'Gestion de la douleur',
    'Réhabilitation cardiaque',
    'Thérapie aquatique',
    'Autre',
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'];
      if (!allowedTypes.includes(file.type)) {
        setStatus({
          type: 'error',
          message: 'Seuls les fichiers PDF, JPG, PNG et DOC sont acceptés.',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setStatus({
          type: 'error',
          message: 'Le fichier ne doit pas dépasser 5MB.',
        });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        prescription: file,
      }));

      setFilePreview(file.name);
      setStatus({ type: 'idle', message: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      setStatus({
        type: 'error',
        message: 'Veuillez remplir tous les champs obligatoires.',
      });
      return;
    }

    setStatus({ type: 'loading', message: 'Envoi du formulaire...' });

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('reason', formData.reason);
      submitData.append('message', formData.message);

      if (formData.prescription) {
        submitData.append('prescription', formData.prescription);
      }

      const response = await fetch('/api/booking', {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        setStatus({
          type: 'success',
          message: "Votre demande a été envoyée avec succès. Nous vous recontacterons sous peu.",
        });

        setFormData({
          name: '',
          email: '',
          phone: '',
          reason: '',
          message: '',
          prescription: null,
        });
        setFilePreview(null);
      } else {
        throw new Error("Erreur lors de l'envoi du formulaire");
      }
    } catch {
      setStatus({
        type: 'error',
        message: "Une erreur est survenue lors de l'envoi du formulaire. Veuillez réessayer.",
      });
    }
  };



  return (
    <section id="booking" className="py-20 md:py-32 bg-light-gray">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-medical-blue mb-4">Demande de Rendez-vous ou Informations</h2>
          <p className="text-lg text-gray-600">Remplissez le formulaire ci-dessous pour nous contacter.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  Nom Complet *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-blue"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="jean@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-blue"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="078 255 60 61"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-blue"
                  required
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-bold text-gray-700 mb-2">
                  <FileText size={16} className="inline mr-2" />
                  Motif de la Consultation *
                </label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-blue"
                  required
                >
                  <option value="">Sélectionnez un motif</option>
                  {reasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2">
                  <FileText size={16} className="inline mr-2" />
                  Message (Optionnel)
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Décrivez votre demande ou vos besoins..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-blue resize-vertical"
                />
              </div>

              <div>
                <label htmlFor="prescription" className="block text-sm font-bold text-gray-700 mb-2">
                  <Upload size={16} className="inline mr-2" />
                  Ordonnance Médicale (Optionnel)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="prescription"
                    name="prescription"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                  />
                  <label
                    htmlFor="prescription"
                    className="block w-full px-4 py-3 border-2 border-dashed border-medical-blue rounded-lg text-center cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <Upload size={20} className="mx-auto mb-2 text-medical-blue" />
                    <p className="text-sm text-gray-700">Cliquez pour télécharger votre ordonnance</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG ou DOC (Max 5MB)</p>
                  </label>
                </div>
                {filePreview && (
                  <p className="text-sm text-green-600 mt-2">
                    <CheckCircle size={14} className="inline mr-1" />
                    Fichier sélectionné: {filePreview}
                  </p>
                )}
              </div>
            </div>
          </div>

          {status.type !== 'idle' && (
            <div
              className={`mt-8 p-4 rounded-lg flex items-start space-x-3 ${
                status.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : status.type === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-blue-50 border border-blue-200'
              }`}
            >
              {status.type === 'success' && <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />}
              {status.type === 'error' && <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />}
              {status.type === 'loading' && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 flex-shrink-0"></div>
              )}
              <p
                className={`text-sm ${
                  status.type === 'success'
                    ? 'text-green-800'
                    : status.type === 'error'
                      ? 'text-red-800'
                      : 'text-blue-800'
                }`}
              >
                {status.message}
              </p>
            </div>
          )}

          <div className="mt-8">
            <button
              type="submit"
              disabled={status.type === 'loading'}
              className="w-full bg-medical-blue text-white px-8 py-4 rounded-lg font-bold hover:bg-medical-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {status.type === 'loading' ? 'Envoi en cours...' : 'Envoyer ma Demande'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Vos données sont confidentielles et ne seront utilisées que pour votre rendez-vous.
          </p>
        </form>
      </div>
    </section>
  );
};

export default BookingForm;
