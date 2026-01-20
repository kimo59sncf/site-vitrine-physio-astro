import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, X, Save, FileText, User, Calendar, Phone, Mail, ChevronDown } from 'lucide-react';

const DIAGNOSES = [
  'Tendinopathie du Supraspinatus',
  'Lésion Ménisque Interne',
  'Lumbago Aigu',
  'Déchirure Ischio-Jambiers Grade 2',
  'Entorse LLE Cheville',
  'Capsulite Rétractile Épaule',
  'Syndrome Rotulien',
  'Tendinite Achilléenne',
  'Cervicalgie Commune',
  'Lombalgie Chronique',
  'Entorse LCA Genou',
  'Fracture de Fatigue Métatarse',
  'Conflit Sous-Acromial',
  'Pubalgie',
  'Syndrome du Piriforme'
];

const BodyChart3D = ({ view, onAddPin, pins }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotation);
    ctx.translate(-width / 2, -height / 2);

    if (view === 'muscles') {
      drawMuscles(ctx, width, height);
    } else {
      drawSkeleton(ctx, width, height);
    }

    ctx.restore();

    pins.forEach((pin, idx) => {
      const x = (pin.x / 100) * width;
      const y = (pin.y / 100) * height;
      
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      const evaColor = getEVAColor(pin.eva);
      ctx.fillStyle = evaColor;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(idx + 1, x, y);
    });
  }, [view, rotation, pins]);

  const drawMuscles = (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;

    ctx.beginPath();
    ctx.arc(cx, cy - 180, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#d4a574';
    ctx.fill();
    ctx.strokeStyle = '#b8935f';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#c4896a';
    ctx.fillRect(cx - 15, cy - 145, 30, 30);

    ctx.beginPath();
    ctx.moveTo(cx, cy - 120);
    ctx.lineTo(cx - 80, cy - 100);
    ctx.lineTo(cx - 90, cy - 40);
    ctx.lineTo(cx, cy - 60);
    ctx.closePath();
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 120);
    ctx.lineTo(cx + 80, cy - 100);
    ctx.lineTo(cx + 90, cy - 40);
    ctx.lineTo(cx, cy - 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx - 75, cy - 80, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#e67e22';
    ctx.fill();
    ctx.strokeStyle = '#d35400';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + 75, cy - 80, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx - 35, cy - 60, 30, 50, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f39c12';
    ctx.fill();
    ctx.strokeStyle = '#e67e22';
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx + 35, cy - 60, 30, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#3498db';
      ctx.fillRect(cx - 25, cy + i * 25, 20, 20);
      ctx.fillRect(cx + 5, cy + i * 25, 20, 20);
      ctx.strokeStyle = '#2980b9';
      ctx.strokeRect(cx - 25, cy + i * 25, 20, 20);
      ctx.strokeRect(cx + 5, cy + i * 25, 20, 20);
    }

    ctx.fillStyle = '#1abc9c';
    ctx.beginPath();
    ctx.moveTo(cx - 45, cy + 10);
    ctx.lineTo(cx - 60, cy + 60);
    ctx.lineTo(cx - 50, cy + 70);
    ctx.lineTo(cx - 35, cy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#16a085';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 45, cy + 10);
    ctx.lineTo(cx + 60, cy + 60);
    ctx.lineTo(cx + 50, cy + 70);
    ctx.lineTo(cx + 35, cy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx - 75, cy - 20, 18, 45, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#9b59b6';
    ctx.fill();
    ctx.strokeStyle = '#8e44ad';
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx + 75, cy - 20, 18, 45, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c27ba0';
    ctx.fillRect(cx - 85, cy + 30, 22, 60);
    ctx.fillRect(cx + 63, cy + 30, 22, 60);
    ctx.strokeStyle = '#a569bd';
    ctx.strokeRect(cx - 85, cy + 30, 22, 60);
    ctx.strokeRect(cx + 63, cy + 30, 22, 60);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(cx - 35, cy + 90, 28, 90);
    ctx.fillRect(cx + 7, cy + 90, 28, 90);
    ctx.strokeStyle = '#c0392b';
    ctx.strokeRect(cx - 35, cy + 90, 28, 90);
    ctx.strokeRect(cx + 7, cy + 90, 28, 90);

    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 180);
    ctx.lineTo(cx - 25, cy + 250);
    ctx.lineTo(cx - 15, cy + 250);
    ctx.lineTo(cx - 20, cy + 180);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 30, cy + 180);
    ctx.lineTo(cx + 25, cy + 250);
    ctx.lineTo(cx + 15, cy + 250);
    ctx.lineTo(cx + 20, cy + 180);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const drawSkeleton = (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;

    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(cx, cy - 180, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#bdc3c7';
    ctx.fill();
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 145);
    for (let i = 0; i < 8; i++) {
      const y = cy - 145 + i * 20;
      ctx.lineTo(cx + (i % 2 === 0 ? 3 : -3), y);
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(cx - 5, y - 3, 10, 6);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 120);
    ctx.lineTo(cx - 60, cy - 115);
    ctx.moveTo(cx, cy - 120);
    ctx.lineTo(cx + 60, cy - 115);
    ctx.stroke();

    ctx.fillStyle = 'rgba(189, 195, 199, 0.5)';
    ctx.fillRect(cx - 75, cy - 110, 25, 35);
    ctx.fillRect(cx + 50, cy - 110, 25, 35);
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 75, cy - 110, 25, 35);
    ctx.strokeRect(cx + 50, cy - 110, 25, 35);

    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy - 100);
    ctx.lineTo(cx - 70, cy + 20);
    ctx.moveTo(cx + 70, cy - 100);
    ctx.lineTo(cx + 70, cy + 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx - 70, cy + 20, 8, 0, Math.PI * 2);
    ctx.arc(cx + 70, cy + 20, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#95a5a6';
    ctx.fill();

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy + 20);
    ctx.lineTo(cx - 75, cy + 85);
    ctx.moveTo(cx + 70, cy + 20);
    ctx.lineTo(cx + 75, cy + 85);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const y = cy - 100 + i * 15;
      const width = 40 + i * 5;
      ctx.beginPath();
      ctx.arc(cx, y, width, 0.3, Math.PI - 0.3);
      ctx.strokeStyle = 'rgba(236, 240, 241, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(189, 195, 199, 0.7)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 75, 50, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx - 30, cy + 85, 10, 0, Math.PI * 2);
    ctx.arc(cx + 30, cy + 85, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#7f8c8d';
    ctx.fill();

    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 85);
    ctx.lineTo(cx - 25, cy + 175);
    ctx.moveTo(cx + 30, cy + 85);
    ctx.lineTo(cx + 25, cy + 175);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx - 25, cy + 175, 9, 0, Math.PI * 2);
    ctx.arc(cx + 25, cy + 175, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#95a5a6';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - 25, cy + 175, 6, 0, Math.PI);
    ctx.arc(cx + 25, cy + 175, 6, 0, Math.PI);
    ctx.fillStyle = '#bdc3c7';
    ctx.fill();

    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy + 175);
    ctx.lineTo(cx - 22, cy + 255);
    ctx.moveTo(cx + 25, cy + 175);
    ctx.lineTo(cx + 22, cy + 255);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx - 22, cy + 255, 7, 0, Math.PI * 2);
    ctx.arc(cx + 22, cy + 255, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#95a5a6';
    ctx.fill();

    ctx.fillStyle = 'rgba(189, 195, 199, 0.6)';
    ctx.fillRect(cx - 32, cy + 255, 20, 10);
    ctx.fillRect(cx + 12, cy + 255, 20, 10);
  };

  const getEVAColor = (eva) => {
    if (eva <= 3) return '#2ecc71';
    if (eva <= 6) return '#f39c12';
    return '#e74c3c';
  };

  const handleCanvasClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddPin(x, y);
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastX.current;
      setRotation(prev => prev + deltaX * 0.01);
      lastX.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        className="cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute top-2 right-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
        Cliquez pour ajouter un pin • Glissez pour tourner
      </div>
    </div>
  );
};

const PinPopover = ({ pin, index, onClose, onSave }) => {
  const [diagnosis, setDiagnosis] = useState(pin.diagnosis || '');
  const [notes, setNotes] = useState(pin.notes || '');
  const [eva, setEva] = useState(pin.eva || 5);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredDiagnoses, setFilteredDiagnoses] = useState(DIAGNOSES);

  const handleDiagnosisChange = (value) => {
    setDiagnosis(value);
    const filtered = DIAGNOSES.filter(d => 
      d.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredDiagnoses(filtered);
    setShowDropdown(filtered.length > 0);
  };

  const handleSave = () => {
    onSave(index, { diagnosis, notes, eva });
    onClose();
  };

  const getEVAColor = (value) => {
    if (value <= 3) return 'bg-green-500';
    if (value <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Pin #{index + 1}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Diagnostic
            </label>
            <div className="relative">
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => handleDiagnosisChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Rechercher un diagnostic..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showDropdown && filteredDiagnoses.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredDiagnoses.map((d, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setDiagnosis(d);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-600 text-white text-sm"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes Cliniques
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, tests cliniques..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              EVA Douleur: {eva}/10
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="10"
                value={eva}
                onChange={(e) => setEva(parseInt(e.target.value))}
                className="flex-1"
              />
              <div className={`w-12 h-8 rounded flex items-center justify-center text-white font-bold ${getEVAColor(eva)}`}>
                {eva}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Aucune</span>
              <span>Modérée</span>
              <span>Maximale</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Save size={16} />
            <span>Sauvegarder</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PatientDossier() {
  const [activeTab, setActiveTab] = useState('bodychart');
  const [view, setView] = useState('muscles');
  const [pins, setPins] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleAddPin = (x, y) => {
    const newPin = { x, y, diagnosis: '', notes: '', eva: 5 };
    setPins([...pins, newPin]);
    setSelectedPin(pins.length);
  };

  const handleSavePin = (index, data) => {
    const updated = [...pins];
    updated[index] = { ...updated[index], ...data };
    setPins(updated);
  };

  const patient = {
    name: 'Martin Dupont',
    id: 'P-2025-0142',
    birthDate: '15/03/1985',
    phone: '+33 6 12 34 56 78',
    email: 'martin.dupont@email.fr'
  };

  const getEVAColor = (eva) => {
    if (eva <= 3) return 'text-green-400';
    if (eva <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dossier Patient</h1>
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
          >
            <Camera size={20} />
            <span>Scanner Ordonnance</span>
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold">
              MD
            </div>
            <div>
              <h2 className="text-xl font-bold">{patient.name}</h2>
              <p className="text-sm text-gray-400">ID: {patient.id}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-gray-300">
              <Calendar size={18} className="text-gray-500" />
              <span className="text-sm">Né le {patient.birthDate}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <Phone size={18} className="text-gray-500" />
              <span className="text-sm">{patient.phone}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <Mail size={18} className="text-gray-500" />
              <span className="text-sm">{patient.email}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">HISTORIQUE</h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-700 rounded-lg">
                <p className="text-sm font-medium">Dernière consultation</p>
                <p className="text-xs text-gray-400">18/12/2024</p>
              </div>
              <div className="p-3 bg-gray-700 rounded-lg">
                <p className="text-sm font-medium">Consultations totales</p>
                <p className="text-xs text-gray-400">12 séances</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <div className="flex space-x-1">
              {['bodychart', 'notes', 'documents'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium capitalize transition ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'bodychart' ? 'Bodychart 3D' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'bodychart' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Cartographie Anatomique Interactive</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex bg-gray-700 rounded-lg p-1">
                      <button
                        onClick={() => setView('muscles')}
                        className={`px-4 py-2 rounded transition ${
                          view === 'muscles'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        Muscles
                      </button>
                      <button
                        onClick={() => setView('skeleton')}
                        className={`px-4 py-2 rounded transition ${
                          view === 'skeleton'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        Squelette
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <BodyChart3D
                      view={view}
                      onAddPin={handleAddPin}
                      pins={pins}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Zones Signalées ({pins.length})</h3>
                    {pins.length === 0 ? (
                      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center text-gray-400">
                        <p>Aucune zone signalée</p>
                        <p className="text-sm mt-2">Cliquez sur le bodychart pour ajouter un pin</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pins.map((pin, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition cursor-pointer"
                            onClick={() => setSelectedPin(idx)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-bold text-blue-400">Pin #{idx + 1}</span>
                                  <span className={`text-sm font-semibold ${getEVAColor(pin.eva)}`}>
                                    EVA: {pin.eva}/10
                                  </span>