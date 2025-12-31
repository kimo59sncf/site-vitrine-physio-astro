import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '41782556061',
  message = 'Bonjour, je souhaite prendre rendez-vous pour une séance de physiothérapie.',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };


  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        {isOpen && (
          <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-2xl p-4 w-64 mb-4 animate-fadeIn">
            <h3 className="font-bold text-gray-800 mb-3">Prendre Rendez-vous</h3>
            <p className="text-sm text-gray-600 mb-4">Cliquez ci-dessous pour nous contacter via WhatsApp.</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center"
              onClick={() => setIsOpen(false)}
            >
              <MessageCircle size={18} className="mr-2" />
              Ouvrir WhatsApp
            </a>
          </div>
        )}

        <button
          onClick={toggleMenu}
          className="bg-green-500 text-white rounded-full p-4 shadow-2xl hover:bg-green-600 transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
          title="Contacter via WhatsApp"
          aria-label="Bouton WhatsApp"
        >
          {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </button>

        {!isOpen && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse">
            !
          </div>
        )}
      </div>

      {isOpen && <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default WhatsAppButton;

