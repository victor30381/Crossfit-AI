import React, { useState, useMemo } from 'react';
import { Play, Search, X, Dumbbell, Activity, Zap, Info, ChevronLeft, ArrowRight, Video, FileText, ImageIcon } from 'lucide-react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

type Category = 'Todos' | 'Básicos' | 'Gimnasia' | 'Halterofilia' | 'Cardio' | 'Accesorios';

interface Movement {
  id: string;
  name: string;
  category: Category;
  description: string;
  videoId: string; // YouTube ID
  infographic?: string; // Optional URL for infographic
  type: string;
  muscles: string;
  keyPoints: string[];
}

// Comprehensive CrossFit Movement Database
const MOVEMENTS_DB: Movement[] = [
  // --- BÁSICOS ---
  {
    id: 'bq1', name: 'Air Squat', category: 'Básicos',
    description: 'La base de todos los movimientos de sentadilla.',
    videoId: 'rMvwVtlqjTE', type: 'Fuerza / Movilidad', muscles: 'Cuádriceps, Glúteos, Isquios',
    keyPoints: ['Romper paralelo (cadera bajo rodillas)', 'Peso en los talones', 'Pecho arriba', 'Rodillas hacia afuera']
  },
  {
    id: 'bq_back', name: 'Back Squat', category: 'Básicos',
    description: 'Sentadilla con barra en la espalda.',
    videoId: '4ZYCwYAuiwE', type: 'Fuerza', muscles: 'Cuádriceps, Glúteos',
    keyPoints: ['Romper paralelo', 'Peso en talones', 'Pecho arriba', 'Respiración abdominal']
  },
  {
    id: 'bq2', name: 'Front Squat', category: 'Básicos',
    description: 'Sentadilla con barra en posición de rack frontal.',
    videoId: 'm4ytaCJZpl0', type: 'Fuerza', muscles: 'Cuádriceps, Core, Glúteos',
    keyPoints: ['Codos altos', 'Torso vertical', 'Talones pegados al suelo']
  },
  {
    id: 'bq3', name: 'Overhead Squat', category: 'Básicos',
    description: 'Sentadilla manteniendo la barra bloqueada sobre la cabeza.',
    videoId: 'zDWiJ8l-R8I', type: 'Fuerza / Estabilidad', muscles: 'Hombros, Core, Piernas',
    keyPoints: ['Axilas al frente', 'Barra sobre centro de gravedad', 'Empuje activo', 'Estabilidad media']
  },
  {
    id: 'bq4', name: 'Deadlift', category: 'Básicos',
    description: 'Levantamiento de peso muerto desde el suelo.',
    videoId: 'wV_211i4i9o', type: 'Fuerza', muscles: 'Cadena Posterior',
    keyPoints: ['Espalda neutra', 'Barra pegada a espinillas', 'Hombros delante de barra', 'Empujar suelo']
  },
  {
    id: 'bq5', name: 'Shoulder Press', category: 'Básicos',
    description: 'Press estricto de hombros.',
    videoId: 'B-aVuyhvLHU', type: 'Fuerza', muscles: 'Deltoides, Tríceps',
    keyPoints: ['Cuerpo rígido', 'Trayectoria vertical', 'Cabeza se aparta', 'Bloqueo completo']
  },
  {
    id: 'bq6', name: 'Push Press', category: 'Básicos',
    description: 'Press de hombros con ayuda de las piernas (Dip & Drive).',
    videoId: 'j9916671g-U', type: 'Potencia', muscles: 'Hombros, Piernas',
    keyPoints: ['Dip vertical', 'Extensión explosiva de cadera', 'Talones apoyados en el dip']
  },
  {
    id: 'bq7', name: 'Push Jerk', category: 'Básicos',
    description: 'Press con recepción en flexión de rodillas.',
    videoId: 'V-hKuAfWNUw', type: 'Potencia', muscles: 'Hombros, Piernas',
    keyPoints: ['Salto y recepción', 'Brazos bloqueados al recibir', 'Cadera extendida antes de empujar']
  },

  // --- HALTEROFILIA ---
  {
    id: 'wl1', name: 'Snatch', category: 'Halterofilia',
    description: 'Arrancada: barra del suelo a overhead en un movimiento.',
    videoId: '9xQp2sldyts', type: 'Potencia / Técnica', muscles: 'Full Body',
    keyPoints: ['Triple extensión', 'Recepción profunda', 'Brazos relajados inicio', 'Velocidad']
  },
  {
    id: 'wl2', name: 'Power Snatch', category: 'Halterofilia',
    description: 'Arrancada recibiendo la barra por encima del paralelo.',
    videoId: '82100-n_4-Q', type: 'Potencia', muscles: 'Full Body',
    keyPoints: ['Recepción alta', 'Velocidad de codos', 'Extensión completa']
  },
  {
    id: 'wl3', name: 'Clean', category: 'Halterofilia',
    description: 'Cargada: barra del suelo a los hombros (Squat).',
    videoId: 'Kz0K37h65Pe', type: 'Potencia', muscles: 'Trapecios, Piernas',
    keyPoints: ['Codos rápidos', 'Extensión cadera', 'Contacto muslo', 'Recepción sólida']
  },
  {
    id: 'wl4', name: 'Power Clean', category: 'Halterofilia',
    description: 'Cargada recibiendo por encima del paralelo.',
    videoId: 'KjGvqhaxU70', type: 'Potencia', muscles: 'Trapecios, Piernas',
    keyPoints: ['Recepción parcial', 'Codos rápidos al frente', 'Espalda recta']
  },
  {
    id: 'wl5', name: 'Clean & Jerk', category: 'Halterofilia',
    description: 'Dos tiempos: Cargada y Envión.',
    videoId: '8miqQQJEsO0', type: 'Potencia', muscles: 'Full Body',
    keyPoints: ['Paciencia primer tirón', 'Dip vertical Jerk', 'Recepción estable']
  },
  {
    id: 'wl6', name: 'Split Jerk', category: 'Halterofilia',
    description: 'Envión con recepción en tijera.',
    videoId: 'Wp4BlxcftkE', type: 'Potencia', muscles: 'Hombros, Piernas',
    keyPoints: ['Pie delantero plano', 'Talón trasero levantado', 'Torso vertical', 'Bloqueo sólido']
  },
  {
    id: 'wl7', name: 'Thruster', category: 'Halterofilia',
    description: 'Combinación de Front Squat y Push Press. Devastador.',
    videoId: 'L219ltL15kq', type: 'Metabólico / Fuerza', muscles: 'Piernas, Hombros, Pulmones',
    keyPoints: ['Un solo movimiento fluido', 'Respiración rítmica', 'Extensión potente de cadera']
  },

  // --- GIMNASIA ---
  {
    id: 'gy1', name: 'Pull-Up', category: 'Gimnasia',
    description: 'Dominada pasando la barbilla sobre la barra.',
    videoId: 'aAgglkKyECo', type: 'Gimnasia', muscles: 'Dorsales, Bíceps',
    keyPoints: ['Kipping rítmico', 'Empuje lejos arriba', 'Barbilla supera barra']
  },
  {
    id: 'gy2', name: 'Chest to Bar (C2B)', category: 'Gimnasia',
    description: 'Dominada donde el pecho toca la barra.',
    videoId: '4q7s3c3J2yE', type: 'Gimnasia', muscles: 'Dorsales, Bíceps',
    keyPoints: ['Tirón más potente', 'Contacto físico pecho-barra', 'Codos atrás']
  },
  {
    id: 'gy3', name: 'Toes to Bar (T2B)', category: 'Gimnasia',
    description: 'Colgado, tocar la barra con ambos pies simultáneamente.',
    videoId: '6dHdpbL9i5w', type: 'Core / Gimnasia', muscles: 'Abdominales, Flexores',
    keyPoints: ['Kipping constante', 'Pies tocan barra', 'Hombros activos', 'Ritmo']
  },
  {
    id: 'gy4', name: 'Bar Muscle-Up', category: 'Gimnasia',
    description: 'Subir todo el cuerpo por encima de la barra.',
    videoId: 'OC7sX_5XjF0', type: 'Gimnasia Avanzada', muscles: 'Full Body',
    keyPoints: ['Cadera a la barra', 'Transición rápida', 'Press final']
  },
  {
    id: 'gy5', name: 'Ring Muscle-Up', category: 'Gimnasia',
    description: 'Muscle-up en anillas.',
    videoId: 'G8W0BhzrWcs', type: 'Gimnasia Avanzada', muscles: 'Full Body',
    keyPoints: ['False grip (opcional)', 'Tirón al esternón', 'Transición agresiva', 'Bloqueo']
  },
  {
    id: 'gy6', name: 'Handstand Push-Up (HSPU)', category: 'Gimnasia',
    description: 'Flexión de pino invertido.',
    videoId: '0wDEO6shpVg', type: 'Fuerza', muscles: 'Hombros, Tríceps',
    keyPoints: ['Trípode', 'Kipping explosivo', 'Bloqueo cabeza metida']
  },
  {
    id: 'gy7', name: 'Handstand Walk', category: 'Gimnasia',
    description: 'Caminar sobre las manos.',
    videoId: '0gX0j2x5j0k', type: 'Equilibrio', muscles: 'Hombros, Core',
    keyPoints: ['Cuerpo apretado', 'Mirada al suelo', 'Pasos cortos']
  },
  {
    id: 'gy8', name: 'Burpee', category: 'Gimnasia',
    description: 'Pecho al suelo y salto.',
    videoId: 'auBLPXO8Fww', type: 'Metabólico', muscles: 'Full Body',
    keyPoints: ['Pecho suelo', 'Extensión cadera aire', 'Eficiencia']
  },
  {
    id: 'gy9', name: 'Pistol Squat', category: 'Gimnasia',
    description: 'Sentadilla a una pierna.',
    videoId: 'qDcniqddTeE', type: 'Fuerza / Equilibrio', muscles: 'Piernas',
    keyPoints: ['Talón apoyado', 'Pie libre no toca suelo', 'Romper paralelo']
  },
  {
    id: 'gy10', name: 'Ring Dip', category: 'Gimnasia',
    description: 'Fondo en anillas.',
    videoId: 'c4DAnQ6DtF8', type: 'Fuerza', muscles: 'Pecho, Tríceps',
    keyPoints: ['Bíceps toca anilla abajo', 'Bloqueo completo arriba', 'Estabilidad']
  },
  {
    id: 'gy11', name: 'Rope Climb', category: 'Gimnasia',
    description: 'Subir la cuerda.',
    videoId: 'lIEI0d5l8AI', type: 'Técnica', muscles: 'Dorsales, Agarre',
    keyPoints: ['Uso de pies (J-Hook)', 'Brazos estirados al reposicionar', 'Seguridad al bajar']
  },

  // --- CARDIO ---
  {
    id: 'ca1', name: 'Double Under', category: 'Cardio',
    description: 'La cuerda pasa dos veces por salto.',
    videoId: '8XZGdbYP9fw', type: 'Resistencia', muscles: 'Gemelos, Hombros',
    keyPoints: ['Salto vertical', 'Muñecas rápidas', 'Codos pegados', 'Relajación']
  },
  {
    id: 'ca2', name: 'Box Jump', category: 'Cardio',
    description: 'Salto al cajón.',
    videoId: 'kxxcD1u4d0c', type: 'Potencia', muscles: 'Piernas',
    keyPoints: ['Despegue dos pies', 'Extensión cadera arriba', 'Aterrizaje suave']
  },
  {
    id: 'ca3', name: 'Rowing', category: 'Cardio',
    description: 'Remo en ergómetro.',
    videoId: 'H0r_ZCp88pY', type: 'Resistencia', muscles: 'Full Body',
    keyPoints: ['Piernas-Cuerpo-Brazos', 'Cadena recta', 'Talones pegados al empujar']
  },
  {
    id: 'ca4', name: 'Assault Bike', category: 'Cardio',
    description: 'Bicicleta de aire.',
    videoId: 'O8tGrT-d8-M', type: 'Metabólico', muscles: 'Piernas, Brazos',
    keyPoints: ['Uso de brazos y piernas', 'Respiración controlada', 'Ajuste sillín']
  },
  {
    id: 'ca5', name: 'Ski Erg', category: 'Cardio',
    description: 'Simulador de esquí nórdico.',
    videoId: 'P7qpoJmX91I', type: 'Resistencia', muscles: 'Dorsales, Core, Tríceps',
    keyPoints: ['Triple extensión', 'Uso del peso corporal', 'Brazos estirados inicio']
  },

  // --- ACCESORIOS / OTROS ---
  {
    id: 'ac1', name: 'Wall Ball', category: 'Accesorios',
    description: 'Lanzamiento de balón medicinal a la pared desde sentadilla.',
    videoId: '_KfCGKfP1_g', type: 'Metabólico', muscles: 'Piernas, Hombros',
    keyPoints: ['Sentadilla profunda', 'Lanzamiento al subir', 'Recibir balón cerca cara']
  },
  {
    id: 'ac2', name: 'Kettlebell Swing', category: 'Accesorios',
    description: 'Balanceo de pesa rusa (Americano o Ruso).',
    videoId: '1cVT3ee9mgU', type: 'Cadena Posterior', muscles: 'Glúteos, Isquios, Espalda',
    keyPoints: ['Golpe de cadera', 'Espalda neutra', 'Brazos como correas']
  },
  {
    id: 'ac3', name: 'Turkish Get Up', category: 'Accesorios',
    description: 'Levantarse del suelo con una pesa en alto.',
    videoId: 'sgd8n917Zv0', type: 'Estabilidad / Core', muscles: 'Full Body',
    keyPoints: ['Mirada a la pesa', 'Pasos controlados', 'Brazo siempre vertical']
  },
  {
    id: 'ac4', name: 'Dumbbell Snatch', category: 'Accesorios',
    description: 'Arrancada con mancuerna a una mano.',
    videoId: 'HHsOcHb_IFI', type: 'Potencia', muscles: 'Full Body',
    keyPoints: ['Espalda recta', 'Extensión cadera', 'Bloqueo arriba']
  },
  {
    id: 'ac5', name: 'Walking Lunge', category: 'Accesorios',
    description: 'Zancadas caminando.',
    videoId: 'DlhojghkaQ0', type: 'Fuerza Unilateral', muscles: 'Piernas, Glúteos',
    keyPoints: ['Rodilla trasera toca suelo', 'Torso vertical', 'Ángulo 90 grados']
  }
];

const Movements: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Category>('Todos');
  const [selectedMov, setSelectedMov] = useState<Movement | null>(null);
  const [viewMode, setViewMode] = useState<'video' | 'infographic'>('video');

  const filteredMovements = useMemo(() => {
    return MOVEMENTS_DB.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'Todos' || m.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  // Reset view mode when selecting a new movement
  const handleSelectMovement = (mov: Movement) => {
    setSelectedMov(mov);
    setViewMode('video');
  };



  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* List View (Hidden when a movement is selected) */}
      <div className={`flex flex-col h-full ${selectedMov ? 'hidden' : 'block'}`}>
        <div className="mb-6 flex-none">
          <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">Biblioteca de Movimientos</h2>
          <p className="opacity-70 text-sm mb-4">Domina la técnica perfecta. {MOVEMENTS_DB.length} movimientos disponibles.</p>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar (ej. Snatch)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-card)] border border-[var(--color-secondary)] rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {(['Todos', 'Básicos', 'Halterofilia', 'Gimnasia', 'Cardio', 'Accesorios'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`
                    px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                    ${filter === cat
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-card)] text-gray-400 border-[var(--color-secondary)] hover:border-gray-500'}
                    `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-20">
          <div className="space-y-3">
            {filteredMovements.map((mov) => (
              <div
                key={mov.id}
                onClick={() => handleSelectMovement(mov)}
                className="group bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-secondary)] hover:border-[var(--color-primary)] transition-all cursor-pointer flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-bg)] flex items-center justify-center border border-[var(--color-secondary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                    <Play size={20} className="ml-1" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-500 group-hover:text-[var(--color-primary)] transition-colors">{mov.name}</h3>
                    <p className="text-xs text-gray-400 truncate max-w-[150px]">{mov.type}</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail View (The "Mannequin Card" Style) */}
      {selectedMov && (
        <div className="fixed inset-0 z-50 bg-[#000] flex flex-col h-full w-full animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center p-4 z-10 shrink-0">
            <button
              onClick={() => setSelectedMov(null)}
              className="p-2 -ml-2 text-white hover:text-[var(--color-primary)] transition-colors"
            >
              <ChevronLeft size={32} />
            </button>
            <h2 className="text-xl font-bold ml-2 text-white">{selectedMov.name}</h2>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
            <div className="max-w-md mx-auto w-full px-6">

              {/* Media Card Area - Fixed Layout */}
              <div className="relative w-full aspect-video bg-[#111] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden mb-4 group">

                {/* Content based on viewMode */}
                {viewMode === 'video' ? (
                  <div className="w-full h-full">
                    <LiteYouTubeEmbed
                      id={selectedMov.videoId}
                      title={selectedMov.name}
                      poster="maxresdefault"
                      wrapperClass="yt-lite"
                    />
                  </div>
                ) : (
                  selectedMov.infographic ? (
                    <img
                      src={selectedMov.infographic}
                      alt="Infographic"
                      className="w-full h-full object-contain bg-gray-900"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                      <ImageIcon size={48} className="mb-2 opacity-50" />
                      <p>No hay infografía disponible</p>
                    </div>
                  )
                )
                }
              </div>

              {/* View Toggle (Video vs Infographic) */}
              {selectedMov.infographic && (
                <div className="flex bg-gray-800 p-1 rounded-xl mb-6 mx-auto max-w-[200px]">
                  <button
                    onClick={() => setViewMode('video')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${viewMode === 'video'
                      ? 'bg-[var(--color-primary)] text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    <Video size={14} />
                    Video
                  </button>
                  <button
                    onClick={() => setViewMode('infographic')}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${viewMode === 'infographic'
                      ? 'bg-[var(--color-primary)] text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    <FileText size={14} />
                    Info
                  </button>
                </div>
              )}

              {/* Technical Data Fields */}
              <div className="space-y-6">
                {/* Type */}
                <div>
                  <h4 className="text-gray-500 text-sm mb-1">Tipo</h4>
                  <p className="text-xl font-medium text-white">{selectedMov.type}</p>
                </div>

                {/* Muscles */}
                <div>
                  <h4 className="text-gray-500 text-sm mb-1">Músculos</h4>
                  <p className="text-xl font-medium text-white">{selectedMov.muscles}</p>
                </div>

                {/* Key Points */}
                <div>
                  <h4 className="text-gray-500 text-sm mb-3">Puntos Clave:</h4>
                  <ul className="space-y-3">
                    {selectedMov.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 shadow-[0_0_8px_var(--color-primary)]"></div>
                        <span className="text-lg text-gray-200 leading-snug">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="p-6 bg-gradient-to-t from-black via-black to-transparent shrink-0">
            <button
              onClick={() => setSelectedMov(null)}
              className="w-full bg-[var(--color-primary)] text-black font-bold text-lg py-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/20"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movements;