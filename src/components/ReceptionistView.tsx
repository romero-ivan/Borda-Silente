/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  ClipboardList, 
  UserPlus, 
  Coffee, 
  AlertTriangle, 
  Hammer, 
  CheckCircle2, 
  MessageSquare, 
  Search, 
  Plus, 
  Phone, 
  Clock, 
  User, 
  SlidersHorizontal, 
  Calendar, 
  DollarSign, 
  PenSquare, 
  FileText,
  Trash2,
  X,
  Compass
} from 'lucide-react';
import { Room, Booking, BookingPlatform, RoomStatus } from '../types.js';
import ChatBox from './ChatBox.js';

interface ReceptionistViewProps {
  rooms: Room[];
  bookings: Booking[];
  chatMessages: any[];
  onSendMessage: (message: string) => Promise<void>;
  onUpdateRoomStatus: (roomId: number, status: RoomStatus) => Promise<void>;
  onBook: (bookingData: {
    guestName: string;
    guestEmail: string;
    roomId: number;
    checkIn: string;
    checkOut: string;
    platform: BookingPlatform;
  }) => Promise<void>;
}

interface TaskItem {
  id: string;
  roomNumber: string;
  type: 'Limpieza' | 'Mantenimiento' | 'Preparación' | 'Otro';
  staff: string;
  description: string;
  status: 'Pendiente' | 'En Proceso' | 'Completada';
  priority: 'Alta' | 'Media' | 'Baja';
}

export default function ReceptionistView({
  rooms,
  bookings,
  chatMessages,
  onSendMessage,
  onUpdateRoomStatus,
  onBook
}: ReceptionistViewProps) {
  // Navigation: 'matrix' (dashboard), 'ledger' (history/billing), 'tasks' (work orders), 'walkin' (front desk checkin), 'chat' (customer help)
  const [activeTab, setActiveTab] = useState<'matrix' | 'ledger' | 'tasks' | 'walkin' | 'chat'>('matrix');

  // Walk-in form state
  const [walkinRoomId, setWalkinRoomId] = useState<number>(rooms[0]?.id || 101);
  const [walkinName, setWalkinName] = useState('');
  const [walkinEmail, setWalkinEmail] = useState('');
  const [walkinIn, setWalkinIn] = useState('2026-07-14');
  const [walkinOut, setWalkinOut] = useState('2026-07-16');
  const [walkinError, setWalkinError] = useState('');
  const [walkinSuccess, setWalkinSuccess] = useState('');

  // Search & Filter state for Ledger (Historial y Facturación)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');

  // Shift Notes / Libro de Novedades (Persists in localStorage)
  const [shiftNotes, setShiftNotes] = useState(() => {
    return localStorage.getItem('borda_shift_notes') || 
      'Marta: Por favor, revisar la estufa de pellets de la Cabaña 301 por la tarde.\nLimpieza: La habitación 103 requiere cambio doble de lino belga orgánico.';
  });

  // Extra charges state (Simulated per booking, kept in session/local state)
  const [extraCharges, setExtraCharges] = useState<Record<string, { id: string; desc: string; amount: number; date: string }[]>>({
    'B-7821': [
      { id: 'ch-1', desc: 'Botella Tinto Somontano Gran Reserva', amount: 28.00, date: '2026-07-14' },
      { id: 'ch-2', desc: 'Cesta Aperitivos de la Estepa', amount: 14.50, date: '2026-07-14' }
    ]
  });

  // Selected Occupied Room details (for side drawer/modal panel)
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<{ room: Room; booking: Booking } | null>(null);
  
  // Custom interactive tasks organizer state
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 't1', roomNumber: '103', type: 'Limpieza', staff: 'Elena G.', description: 'Desinfección tina de cedro, abrillantado y lino nuevo', status: 'En Proceso', priority: 'Alta' },
    { id: 't2', roomNumber: '301', type: 'Mantenimiento', staff: 'Pedro M.', description: 'Revisión purgado radiador y fuego suspendido', status: 'Pendiente', priority: 'Alta' },
    { id: 't3', roomNumber: '101', type: 'Limpieza', staff: 'Elena G.', description: 'Limpieza rutinaria estándar', status: 'Completada', priority: 'Baja' },
    { id: 't4', roomNumber: '202', type: 'Preparación', staff: 'Mateo S. (Chef)', description: 'Colocación de bandeja gourmet de cortesía', status: 'Pendiente', priority: 'Media' },
  ]);

  // Task Form State
  const [newTaskRoom, setNewTaskRoom] = useState('101');
  const [newTaskType, setNewTaskType] = useState<'Limpieza' | 'Mantenimiento' | 'Preparación' | 'Otro'>('Limpieza');
  const [newTaskStaff, setNewTaskStaff] = useState('Elena G.');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;

    const task: TaskItem = {
      id: `task-${Date.now()}`,
      roomNumber: newTaskRoom,
      type: newTaskType,
      staff: newTaskStaff,
      description: newTaskDesc,
      status: 'Pendiente',
      priority: newTaskPriority
    };

    setTasks([task, ...tasks]);
    setNewTaskDesc('');
  };

  const handleToggleTaskStatus = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextStatus: Record<string, 'Pendiente' | 'En Proceso' | 'Completada'> = {
          'Pendiente': 'En Proceso',
          'En Proceso': 'Completada',
          'Completada': 'Pendiente'
        };
        return { ...t, status: nextStatus[t.status] };
      }
      return t;
    }));
  };

  const handleSaveNotes = (value: string) => {
    setShiftNotes(value);
    localStorage.setItem('borda_shift_notes', value);
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkinError('');
    setWalkinSuccess('');

    if (!walkinName.trim() || !walkinEmail.trim()) {
      setWalkinError('Por favor, indique nombre y correo de contacto.');
      return;
    }

    if (new Date(walkinIn) >= new Date(walkinOut)) {
      setWalkinError('La fecha de salida debe ser posterior al check-in.');
      return;
    }

    try {
      await onBook({
        guestName: walkinName,
        guestEmail: walkinEmail,
        roomId: walkinRoomId,
        checkIn: walkinIn,
        checkOut: walkinOut,
        platform: 'reception'
      });
      setWalkinSuccess('¡Reserva presencial (Walk-in) registrada de forma impecable!');
      setWalkinName('');
      setWalkinEmail('');
    } catch (err: any) {
      setWalkinError(err.message || 'Error al procesar reserva directa.');
    }
  };

  const handleAddExtraCharge = (bookingId: string, desc: string, amount: number) => {
    if (!desc.trim() || isNaN(amount) || amount <= 0) return;
    
    const newCharge = {
      id: `ch-${Date.now()}`,
      desc: desc.trim(),
      amount,
      date: new Date().toISOString().split('T')[0]
    };

    setExtraCharges(prev => ({
      ...prev,
      [bookingId]: [...(prev[bookingId] || []), newCharge]
    }));
  };

  const handleDeleteExtraCharge = (bookingId: string, chargeId: string) => {
    setExtraCharges(prev => ({
      ...prev,
      [bookingId]: (prev[bookingId] || []).filter(c => c.id !== chargeId)
    }));
  };

  // Resolve active/latest booking for a specific room
  const getActiveBookingForRoom = (roomId: number): Booking | undefined => {
    return bookings.find(b => b.roomId === roomId && (b.status === 'active' || b.status === 'confirmed'));
  };

  // Helper styles for room statuses
  const getRoomStatusDetails = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return { 
          colorClass: 'bg-emerald-500', 
          text: 'Disponible', 
          borderClass: 'border-t-emerald-500', 
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' 
        };
      case 'occupied':
        return { 
          colorClass: 'bg-rose-500', 
          text: 'Ocupada', 
          borderClass: 'border-t-rose-500', 
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200' 
        };
      case 'cleaning':
        return { 
          colorClass: 'bg-amber-500', 
          text: 'Limpieza', 
          borderClass: 'border-t-amber-500', 
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' 
        };
      case 'maintenance':
        return { 
          colorClass: 'bg-purple-500', 
          text: 'Mantenimiento', 
          borderClass: 'border-t-purple-500', 
          badgeClass: 'bg-purple-50 text-purple-800 border-purple-200' 
        };
    }
  };

  // Filter ledger list
  const filteredBookings = bookings.filter(booking => {
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = 
      booking.guestName.toLowerCase().includes(query) || 
      booking.guestEmail.toLowerCase().includes(query) || 
      booking.invoiceNumber.toLowerCase().includes(query);
    
    const matchPlatform = filterPlatform === 'all' || booking.platform === filterPlatform;
    const matchStatus = filterStatus === 'all' || booking.status === filterStatus;
    const matchDate = !filterDate || booking.checkIn.includes(filterDate) || booking.checkOut.includes(filterDate);

    return matchSearch && matchPlatform && matchStatus && matchDate;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-16 select-none animate-fadeIn">
      
      {/* LEFT COLUMN: NAVIGATION & widgets (3 cols on xl) */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* User Card */}
        <div id="receptionist-user-card" className="bg-[#FDFCFB] border border-[#E5E1D8] p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2C3627] text-[#FAF9F6] flex items-center justify-center font-serif text-lg font-light">
              MA
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-[#2C3627]">Marta Aznárez</h4>
              <p className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider">Turno Mañana · Directora</p>
            </div>
          </div>
          
          <div className="border-t border-[#F5F3EF] pt-3 flex justify-between items-center text-[11px] text-[#8C857B] font-mono">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 07:00 - 15:00</span>
            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-100">Activo</span>
          </div>
        </div>
        {/* Sidebar Navigation */}
        <div id="receptionist-sidebar-navigation" className="bg-[#FDFCFB] border border-[#E5E1D8] p-4.5 rounded-xl shadow-xs">
          <nav className="flex flex-col gap-1.5 font-mono text-xs">
            <button 
              id="nav-tab-matrix"
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2.5 px-3.5 py-3 border-l-2 text-left transition-all duration-300 cursor-pointer ${
                activeTab === 'matrix' 
                  ? 'bg-[#2C3627]/5 text-[#2C3627] border-[#2C3627] font-semibold' 
                  : 'text-[#8C857B] border-transparent hover:bg-[#F5F3EF]/60 hover:text-[#2D2D2D]'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Panel de Control</span>
            </button>
            
            <button 
              id="nav-tab-ledger"
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2.5 px-3.5 py-3 border-l-2 text-left transition-all duration-300 cursor-pointer ${
                activeTab === 'ledger' 
                  ? 'bg-[#2C3627]/5 text-[#2C3627] border-[#2C3627] font-semibold' 
                  : 'text-[#8C857B] border-transparent hover:bg-[#F5F3EF]/60 hover:text-[#2D2D2D]'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Historial y Facturas</span>
            </button>
 
            <button 
              id="nav-tab-tasks"
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2.5 px-3.5 py-3 border-l-2 text-left transition-all duration-300 cursor-pointer ${
                activeTab === 'tasks' 
                  ? 'bg-[#2C3627]/5 text-[#2C3627] border-[#2C3627] font-semibold' 
                  : 'text-[#8C857B] border-transparent hover:bg-[#F5F3EF]/60 hover:text-[#2D2D2D]'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Calendario de Tareas</span>
            </button>
 
            <button 
              id="nav-tab-walkin"
              onClick={() => {
                setActiveTab('walkin');
                setWalkinSuccess('');
                setWalkinError('');
              }}
              className={`flex items-center gap-2.5 px-3.5 py-3 border-l-2 text-left transition-all duration-300 cursor-pointer ${
                activeTab === 'walkin' 
                  ? 'bg-[#2C3627]/5 text-[#2C3627] border-[#2C3627] font-semibold' 
                  : 'text-[#8C857B] border-transparent hover:bg-[#F5F3EF]/60 hover:text-[#2D2D2D]'
              }`}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Reserva Presencial</span>
            </button>
 
            <button 
              id="nav-tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center justify-between px-3.5 py-3 border-l-2 text-left transition-all duration-300 cursor-pointer ${
                activeTab === 'chat' 
                  ? 'bg-[#2C3627]/5 text-[#2C3627] border-[#2C3627] font-semibold' 
                  : 'text-[#8C857B] border-transparent hover:bg-[#F5F3EF]/60 hover:text-[#2D2D2D]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Atención Online</span>
              </span>
              <span className="bg-[#E5B181] text-[#2C3627] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-3xs">
                {chatMessages.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Action Widgets Grid */}
        <div id="quick-action-widgets" className="bg-[#FDFCFB] border border-[#E5E1D8] p-4 rounded-xl shadow-xs space-y-3">
          <span className="font-mono text-[9px] text-[#8C857B] uppercase tracking-widest font-semibold block">Acciones Rápidas</span>
          <div className="grid grid-cols-2 gap-2">
            <button 
              id="widget-btn-walkin"
              onClick={() => {
                setActiveTab('walkin');
                setWalkinSuccess('');
              }}
              className="flex flex-col items-center justify-center p-3 border border-[#E5E1D8] hover:border-[#2C3627] hover:bg-[#FAF9F6] rounded-lg transition-all text-center group cursor-pointer"
            >
              <UserPlus className="w-5 h-5 text-[#2C3627] mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono uppercase text-[#2D2D2D] font-medium leading-tight">Check-In</span>
            </button>
            <button 
              id="widget-btn-ledger"
              onClick={() => {
                setActiveTab('ledger');
                setFilterStatus('active');
              }}
              className="flex flex-col items-center justify-center p-3 border border-[#E5E1D8] hover:border-[#2C3627] hover:bg-[#FAF9F6] rounded-lg transition-all text-center group cursor-pointer"
            >
              <ClipboardList className="w-5 h-5 text-[#2C3627] mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono uppercase text-[#2D2D2D] font-medium leading-tight">Check-Out</span>
            </button>
          </div>
        </div>

        {/* Shift log book (Libro de Novedades) */}
        <div id="shift-novelties-widget" className="bg-[#FDFCFB] border border-[#E5E1D8] p-5 rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 border-b border-[#F5F3EF] pb-2">
            <Compass className="w-4 h-4 text-[#E5B181]" />
            <h5 className="font-serif text-xs font-semibold text-[#2C3627]">Libro de Novedades</h5>
          </div>
          <p className="text-[10px] text-[#8C857B] leading-normal font-light">
            Deje avisos importantes para los siguientes turnos de recepción. Se almacena localmente.
          </p>
          <textarea
            id="shift-notes-textarea"
            value={shiftNotes}
            onChange={(e) => handleSaveNotes(e.target.value)}
            rows={4}
            className="w-full p-2.5 text-[11px] bg-[#FAF9F6] border border-[#D1CDC3] rounded-lg text-[#2D2D2D] focus:outline-hidden focus:border-[#2C3627] font-sans resize-none leading-relaxed"
            placeholder="Escriba novedades relevantes aquí..."
          />
        </div>

        {/* Directory Widget */}
        <div id="useful-directory-widget" className="bg-[#FDFCFB] border border-[#E5E1D8] p-5 rounded-xl shadow-xs space-y-3.5">
          <div className="flex items-center gap-1.5 border-b border-[#F5F3EF] pb-2">
            <Phone className="w-4 h-4 text-[#8C857B]" />
            <h5 className="font-serif text-xs font-semibold text-[#2C3627]">Directorio de Utilidad</h5>
          </div>
          
          <div className="space-y-2.5 text-[10.5px] font-mono">
            <div className="flex justify-between items-center">
              <span className="text-[#8C857B]">🚖 Taxis Valle Ansó</span>
              <a href="tel:+34974348012" className="text-[#2C3627] font-semibold hover:underline">+34 974 348 012</a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8C857B]">🔧 Mantenimiento</span>
              <a href="tel:+34689124355" className="text-[#2C3627] font-semibold hover:underline">+34 689 124 355</a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8C857B]">🚑 Emergencias Nac.</span>
              <a href="tel:112" className="text-red-700 font-bold hover:underline">112</a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8C857B]">🏥 Centro Salud Jaca</span>
              <a href="tel:+34974370102" className="text-[#2C3627] font-semibold hover:underline">+34 974 370 102</a>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: WORKSPACE CONTENT (9 cols on xl) */}
      <div className="xl:col-span-9 bg-[#FDFCFB] border border-[#E5E1D8] p-6 sm:p-8 rounded-2xl shadow-xs">
        
        {/* VIEW 1: MATRIX (ROOMS GRID) */}
        {activeTab === 'matrix' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header */}
            <div className="border-b border-[#E5E1D8] pb-5 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="font-serif text-2xl text-[#2C3627] font-light">Matriz Operativa de Estancias</h3>
                <p className="text-xs text-[#8C857B] mt-0.5">Gestione el flujo de huéspedes, limpieza y mantenimiento en tiempo real</p>
              </div>
              <div className="flex gap-2">
                <span className="font-mono text-[9px] border border-[#2C3627]/20 bg-[#FAF9F6] px-3 py-1.5 text-[#2C3627] uppercase tracking-[0.12em] rounded-full font-semibold">
                  {rooms.length} Estancias Totales
                </span>
              </div>
            </div>

            {/* Matrix Stats Bar */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl text-center">
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider block">Disponibles</span>
                <span className="font-serif text-2xl font-light text-emerald-700">{rooms.filter(r => r.status === 'available').length}</span>
              </div>
              <div className="space-y-1 border-l border-[#E5E1D8]">
                <span className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider block">Ocupadas</span>
                <span className="font-serif text-2xl font-light text-rose-700">{rooms.filter(r => r.status === 'occupied').length}</span>
              </div>
              <div className="space-y-1 border-l border-[#E5E1D8]">
                <span className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider block">Limpieza</span>
                <span className="font-serif text-2xl font-light text-amber-700">{rooms.filter(r => r.status === 'cleaning').length}</span>
              </div>
              <div className="space-y-1 border-l border-[#E5E1D8]">
                <span className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider block">Mantenimiento</span>
                <span className="font-serif text-2xl font-light text-purple-700">{rooms.filter(r => r.status === 'maintenance').length}</span>
              </div>
            </div>

            {/* Matrix 6 Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => {
                const activeBooking = getActiveBookingForRoom(room.id);
                const isOccupied = room.status === 'occupied';
                const isCleaningOrMaint = room.status === 'cleaning' || room.status === 'maintenance';
                const statusDetails = getRoomStatusDetails(room.status);

                return (
                  <div 
                    key={room.id}
                    id={`room-card-${room.id}`}
                    onClick={() => {
                      if (isOccupied && activeBooking) {
                        setSelectedRoomDetails({ room, booking: activeBooking });
                      } else if (room.status === 'available') {
                        setWalkinRoomId(room.id);
                        setActiveTab('walkin');
                        setWalkinSuccess('');
                        setWalkinError('');
                      }
                    }}
                    className={`relative bg-[#FDFCFB] border-t-4 ${statusDetails.borderClass} border-x border-b border-[#E5E1D8] p-5 rounded-xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-5 group cursor-pointer ${
                      isCleaningOrMaint ? 'opacity-85 hover:opacity-100' : ''
                    }`}
                  >
                    
                    {/* Upper Room Stats Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10.5px] bg-[#F5F3EF] px-2.5 py-0.5 text-[#2D2D2D] font-bold rounded-sm border border-[#E5E1D8]">
                          Estancia {room.number}
                        </span>

                        {/* Custom Dropdown to change room status directly (No slop buttons!) */}
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="relative"
                        >
                          <select
                            id={`status-select-${room.id}`}
                            value={room.status}
                            onChange={(e) => onUpdateRoomStatus(room.id, e.target.value as RoomStatus)}
                            className="font-mono text-[10px] bg-white border border-[#D1CDC3] text-[#2D2D2D] rounded-md py-1 px-2.5 pr-6 cursor-pointer focus:outline-hidden focus:border-[#2C3627] font-semibold appearance-none leading-none shadow-3xs"
                            style={{
                              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%238C857B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-chevron-down'><polyline points='6 9 12 15 18 9'/></svg>")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 4px center',
                              backgroundSize: '12px'
                            }}
                          >
                            <option value="available">🟢 Libre</option>
                            <option value="occupied">🔴 Ocupada</option>
                            <option value="cleaning">🟠 Limpieza</option>
                            <option value="maintenance">🟣 Avería</option>
                          </select>
                        </div>
                      </div>

                      {/* Room Visual Info */}
                      <div>
                        <h4 className="font-serif text-lg font-medium text-[#2C3627] group-hover:text-black transition-colors">
                          {room.name}
                        </h4>
                        
                        {/* Dynamic view based on occupancy status */}
                        <div className="mt-2 pt-1">
                          {isOccupied && activeBooking ? (
                            <div className="space-y-1.5 bg-rose-50/40 border border-rose-100/60 p-3 rounded-lg text-xs font-sans">
                              <div className="flex items-center gap-1.5 text-rose-900 font-medium">
                                <User className="w-3.5 h-3.5 text-rose-500" />
                                <span className="truncate">{activeBooking.guestName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[#8C857B] font-mono text-[10px]">
                                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                                <span>Salida: {activeBooking.checkOut}</span>
                              </div>
                            </div>
                          ) : isCleaningOrMaint ? (
                            <div className="space-y-1.5 bg-[#FAF9F6] border border-[#E5E1D8]/60 p-3 rounded-lg text-xs font-mono text-[#8C857B]">
                              <span className="flex items-center gap-1.5">
                                {room.status === 'cleaning' ? (
                                  <>
                                    <Coffee className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                    <span>Asignada a: Elena G.</span>
                                  </>
                                ) : (
                                  <>
                                    <Hammer className="w-3.5 h-3.5 text-purple-500" />
                                    <span>Técnico: Pedro M.</span>
                                  </>
                                )}
                              </span>
                              <span className="text-[9.5px] italic leading-tight block">
                                {room.status === 'cleaning' ? 'Higienización de lino y tina' : 'Incidencia en caldera pendiente'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-baseline font-mono text-xs text-[#8C857B]">
                              <span>Capacidad: {room.capacity} Pax</span>
                              <span className="font-serif font-medium text-[#2C3627] text-sm bg-[#2C3627]/5 px-2 py-0.5 rounded-sm">{room.price}€ / noche</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lower helper instructions banner */}
                    <div className="pt-3 border-t border-[#F5F3EF] flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-[#8C857B]">
                      <span>{room.type === 'cabin' ? '★ Cabaña' : room.type === 'suite' ? '★ Suite' : '★ Estándar'}</span>
                      <span className="text-[#2C3627] group-hover:underline font-semibold">
                        {isOccupied ? 'Ver detalles →' : room.status === 'available' ? 'Reservar →' : 'Gestionar'}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: HISTORIAL Y FACTURAS (LEDGER WITH ADVANCED SEARCH) */}
        {activeTab === 'ledger' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header */}
            <div className="border-b border-[#E5E1D8] pb-5">
              <h3 className="font-serif text-2xl text-[#2C3627] font-light">Libro de Reservas y Facturación</h3>
              <p className="text-xs text-[#8C857B] mt-0.5">Control histórico unificado y búsqueda inteligente de folios</p>
            </div>

            {/* Filters bar */}
            <div className="bg-[#FAF9F6] border border-[#E5E1D8] p-5 rounded-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                
                {/* Search query input */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B]">Buscar por Huésped, Email o Factura</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C857B]" />
                    <input 
                      id="ledger-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ej. Mireia Vila..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D1CDC3] text-[#2D2D2D] rounded-lg focus:outline-hidden focus:border-[#2C3627]"
                    />
                  </div>
                </div>

                {/* Filter platform dropdown */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B]">Origen de Reserva</label>
                  <select
                    id="ledger-platform-filter"
                    value={filterPlatform}
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D1CDC3] text-[#2D2D2D] rounded-lg focus:outline-hidden focus:border-[#2C3627] font-mono"
                  >
                    <option value="all">Todas las plataformas</option>
                    <option value="web">Canal Web Directo</option>
                    <option value="booking">Booking.com</option>
                    <option value="expedia">Expedia</option>
                    <option value="reception">Mostrador / Walk-in</option>
                  </select>
                </div>

                {/* Filter status dropdown */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B]">Estado</label>
                  <select
                    id="ledger-status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D1CDC3] text-[#2D2D2D] rounded-lg focus:outline-hidden focus:border-[#2C3627] font-mono"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">En Estancia</option>
                    <option value="confirmed">Confirmadas futuras</option>
                    <option value="checked-out">Checked-out (Pasadas)</option>
                  </select>
                </div>

                {/* Clear filters button */}
                <div className="md:col-span-2">
                  <button
                    id="ledger-clear-filters-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterPlatform('all');
                      setFilterStatus('all');
                      setFilterDate('');
                    }}
                    className="w-full py-2 bg-[#F5F3EF] hover:bg-[#D1CDC3] text-[#2D2D2D] font-mono text-[10px] uppercase tracking-wider rounded-lg transition-colors border border-[#D1CDC3] font-semibold cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>

              </div>
            </div>

            {/* Bookings Ledger Table */}
            <div className="overflow-x-auto border border-[#E5E1D8] rounded-xl bg-white shadow-3xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E1D8] font-mono text-[9px] text-[#8C857B] uppercase tracking-widest bg-[#FAF9F6]">
                    <th className="py-3.5 px-4">Factura / ID</th>
                    <th className="py-3.5 px-4">Huésped</th>
                    <th className="py-3.5 px-4 text-center">Hab.</th>
                    <th className="py-3.5 px-4">Intervalo (Entrada - Salida)</th>
                    <th className="py-3.5 px-4 text-right">Monto</th>
                    <th className="py-3.5 px-4 text-center">Origen</th>
                    <th className="py-3.5 px-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] font-sans">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#8C857B] font-serif italic text-sm">
                        No se han encontrado registros que coincidan con los filtros de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => {
                      const charges = extraCharges[booking.id] || [];
                      const extrasSum = charges.reduce((acc, c) => acc + c.amount, 0);
                      const finalTotal = booking.totalPrice + extrasSum;

                      return (
                        <tr key={booking.id} className="hover:bg-[#F5F3EF]/30 transition-colors">
                          <td className="py-4 px-4 font-mono font-semibold text-[#8C857B]">
                            {booking.invoiceNumber}
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-[#2C3627]">{booking.guestName}</div>
                            <div className="text-[10px] text-[#8C857B] font-mono">{booking.guestEmail}</div>
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-[#2D2D2D]">{booking.roomId}</td>
                          <td className="py-4 px-4 font-mono text-[11px] text-[#8C857B]">
                            {booking.checkIn} al {booking.checkOut}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-semibold text-[#2D2D2D]">
                            <div>{finalTotal.toFixed(2)}€</div>
                            {extrasSum > 0 && (
                              <div className="text-[9px] text-amber-600 font-light">+ {extrasSum.toFixed(2)}€ extras</div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2.5 py-0.5 text-[8.5px] font-mono rounded-full border uppercase ${
                              booking.platform === 'web'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                                : booking.platform === 'booking'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : booking.platform === 'expedia'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-stone-50 text-stone-800 border-stone-200'
                            }`}>
                              {booking.platform === 'reception' ? 'mostrador' : booking.platform}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className={`inline-block px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-sm border ${
                              booking.status === 'active'
                                ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                                : booking.status === 'confirmed'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}>
                              {booking.status === 'active' ? 'En Estancia' : booking.status === 'confirmed' ? 'Confirmada' : 'Checked-Out'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: CALENDARIO DE TAREAS / HOUSEKEEPING */}
        {activeTab === 'tasks' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header */}
            <div className="border-b border-[#E5E1D8] pb-5">
              <h3 className="font-serif text-2xl text-[#2C3627] font-light">Calendario de Tareas del Refugio</h3>
              <p className="text-xs text-[#8C857B] mt-0.5">Asignación diaria de órdenes de limpieza y asistencia técnica del personal</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Form to add task (4 cols) */}
              <div className="lg:col-span-4 bg-[#FAF9F6] border border-[#E5E1D8] p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-1.5 border-b border-[#E5E1D8] pb-2">
                  <Plus className="w-4 h-4 text-[#2C3627]" />
                  <h4 className="font-serif text-sm font-semibold text-[#2C3627]">Nueva Orden</h4>
                </div>

                <form onSubmit={handleAddTask} className="space-y-3.5 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B]">Estancia</label>
                    <select
                      id="task-room-select"
                      value={newTaskRoom}
                      onChange={(e) => setNewTaskRoom(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D1CDC3] text-[#2D2D2D] rounded-lg focus:outline-hidden font-mono"
                    >
                      {rooms.map(r => (
                        <option key={r.id} value={r.number}>Estancia {r.number} - {r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B]">Categoría de Orden</label>
                    <select
                      id="task-type-select"
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#D1CDC3] text-[#2D2D2D] rounded-lg focus:outline-hidden"
                    >
                      <option value="Limpieza">🧹 Limpieza</option>
                      <option value="Mantenimiento">🔧 Mantenimiento</option>
                      <option value="Preparación">🎁 Preparación Especial</option>
                      <option value="Otro">📌 Otro Servicio</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B]">Asignar Operario</label>
                    <select
                      id="task-staff-select"
                      value={newTaskStaff}
                      onChange={(e) => setNewTaskStaff(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D1CDC3] text-[#2D2D2D] rounded-lg focus:outline-hidden"
                    >
                      <option value="Elena G.">Elena G. (Gobernanta/Linos)</option>
                      <option value="Pedro M.">Pedro M. (Mantenimiento Técnico)</option>
                      <option value="Mateo S.">Mateo S. (Servicios Gastronomía)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B]">Prioridad</label>
                    <div className="flex gap-2">
                      {['Baja', 'Media', 'Alta'].map((pr) => (
                        <button
                          key={pr}
                          type="button"
                          onClick={() => setNewTaskPriority(pr as any)}
                          className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md border text-center transition-all ${
                            newTaskPriority === pr
                              ? 'bg-[#2C3627] text-white border-[#2C3627] font-semibold'
                              : 'bg-white text-[#8C857B] border-[#D1CDC3] hover:bg-[#FAF9F6]'
                          }`}
                        >
                          {pr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B]">Instrucciones Específicas</label>
                    <textarea
                      id="task-desc-textarea"
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Describa los requerimientos..."
                      rows={3}
                      className="w-full p-2.5 bg-white border border-[#D1CDC3] rounded-lg text-[#2D2D2D] focus:outline-hidden text-xs font-sans leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    id="submit-new-task-btn"
                    className="w-full py-2.5 bg-[#2C3627] text-white font-mono text-xs uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#1C2319] transition-colors font-semibold"
                  >
                    Crear Orden de Trabajo
                  </button>
                </form>
              </div>

              {/* Task table list (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="border border-[#E5E1D8] rounded-xl overflow-hidden bg-white shadow-3xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E1D8] font-mono text-[9px] text-[#8C857B] uppercase tracking-widest bg-[#FAF9F6]">
                        <th className="py-3 px-4">Estancia</th>
                        <th className="py-3 px-4">Asignado</th>
                        <th className="py-3 px-4">Descripción</th>
                        <th className="py-3 px-4 text-center">Prioridad</th>
                        <th className="py-3 px-4 text-right">Estado (Haga clic para cambiar)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E1D8] font-sans">
                      {tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-[#FAF9F6] transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-[#2C3627]">Hab. {task.roomNumber}</span>
                            <span className="block text-[9px] font-mono text-[#8C857B] mt-0.5">{task.type}</span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#2D2D2D]">{task.staff}</td>
                          <td className="py-3.5 px-4 text-[#8C857B] leading-relaxed max-w-xs">{task.description}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 text-[8px] font-mono font-semibold rounded-xs border ${
                              task.priority === 'Alta' 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : task.priority === 'Media' 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(task.id)}
                              className={`px-3 py-1 font-mono text-[9px] uppercase tracking-wider rounded-lg border transition-all cursor-pointer font-bold ${
                                task.status === 'Completada'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : task.status === 'En Proceso'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                                  : 'bg-stone-50 text-stone-600 border-stone-300 hover:bg-[#F5F3EF]'
                              }`}
                            >
                              {task.status}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 4: WALK-IN BOOKINGS */}
        {activeTab === 'walkin' && (
          <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
            
            {/* Header */}
            <div className="border-b border-[#E5E1D8] pb-5">
              <h3 className="font-serif text-2xl text-[#2C3627] font-light">Nueva Reserva de Mostrador (Walk-In / Telefónica)</h3>
              <p className="text-xs text-[#8C857B] mt-0.5">Gestione e introduzca reservas directas tramitadas físicamente en el refugio</p>
            </div>

            <form onSubmit={handleWalkinSubmit} className="space-y-6 text-xs font-sans">
              
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C857B] font-semibold">Estancia Solicitada</label>
                <select 
                  id="walkin-room-select"
                  value={walkinRoomId}
                  onChange={(e) => setWalkinRoomId(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-[#D1CDC3] text-[#2D2D2D] focus:outline-hidden focus:border-[#2C3627] rounded-lg font-mono text-xs"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id} disabled={r.status === 'occupied'}>
                      Estancia {r.number} - {r.name} ({r.price}€ / noche) {r.status === 'occupied' ? '[Ocupada actualmente]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C857B] font-semibold">Fecha de Entrada</label>
                  <input 
                    id="walkin-in-date"
                    type="date" 
                    value={walkinIn}
                    onChange={(e) => setWalkinIn(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#D1CDC3] font-mono text-[#2D2D2D] rounded-lg focus:outline-hidden focus:border-[#2C3627] text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C857B] font-semibold">Fecha de Salida</label>
                  <input 
                    id="walkin-out-date"
                    type="date" 
                    value={walkinOut}
                    onChange={(e) => setWalkinOut(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#D1CDC3] font-mono text-[#2D2D2D] rounded-lg focus:outline-hidden focus:border-[#2C3627] text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C857B] font-semibold">Nombre Completo del Huésped</label>
                <input 
                  id="walkin-guest-name"
                  type="text" 
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="ej. Mireia Vila Pont"
                  className="w-full px-4 py-2.5 bg-white border border-[#D1CDC3] text-[#2D2D2D] rounded-lg focus:outline-hidden focus:border-[#2C3627] text-xs placeholder-[#8C857B]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C857B] font-semibold">Correo Electrónico de Contacto</label>
                <input 
                  id="walkin-guest-email"
                  type="email" 
                  value={walkinEmail}
                  onChange={(e) => setWalkinEmail(e.target.value)}
                  placeholder="ej. mireia@icloud.com"
                  className="w-full px-4 py-2.5 bg-white border border-[#D1CDC3] text-[#2D2D2D] rounded-lg focus:outline-hidden focus:border-[#2C3627] text-xs placeholder-[#8C857B]/50"
                />
              </div>

              {walkinError && (
                <div id="walkin-error-message" className="flex items-center gap-2.5 p-3.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p>{walkinError}</p>
                </div>
              )}

              {walkinSuccess && (
                <div id="walkin-success-message" className="flex items-center gap-2.5 p-3.5 text-xs bg-[#FAF9F6] text-[#2C3627] border border-[#2C3627]/30 rounded-lg font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2C3627]" />
                  <p>{walkinSuccess}</p>
                </div>
              )}

              <button 
                type="submit"
                id="walkin-submit-btn"
                className="w-full py-3.5 bg-[#2C3627] text-[#FAF9F6] hover:bg-[#1C2319] transition-colors font-mono text-xs uppercase tracking-widest rounded-lg font-bold shadow-md cursor-pointer"
              >
                Registrar e Imprimir Folio de Bienvenida
              </button>
            </form>
          </div>
        )}

        {/* VIEW 5: CHAT DESK */}
        {activeTab === 'chat' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header */}
            <div className="border-b border-[#E5E1D8] pb-5">
              <h3 className="font-serif text-2xl text-[#2C3627] font-light">Terminal de Mensajería y Atención</h3>
              <p className="text-xs text-[#8C857B] mt-0.5">Resuelva en directo las dudas de huéspedes alojados o visitantes en proceso de reserva</p>
            </div>
            
            <div className="border border-[#E5E1D8] rounded-xl overflow-hidden shadow-xs">
              <ChatBox 
                currentRole="receptionist"
                currentUserName="Marta Aznárez Larrosa"
                chatMessages={chatMessages}
                onSendMessage={onSendMessage}
                compact={false}
              />
            </div>
          </div>
        )}

      </div>

      {/* MODAL / DRAWER PANEL FOR OCCUPIED ROOM DETAIL & EXTRA CHARGES MANAGER */}
      {selectedRoomDetails && (
        <div 
          id="occupied-room-modal-backdrop"
          onClick={() => setSelectedRoomDetails(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4 select-none animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-xl bg-[#FDFCFB] h-full sm:h-auto sm:rounded-2xl border border-[#E5E1D8] shadow-2xl p-6 sm:p-8 overflow-y-auto space-y-6 flex flex-col justify-between"
          >
            
            <div className="space-y-5">
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-[#E5E1D8] pb-4">
                <div>
                  <span className="font-mono text-[9px] bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                    Ocupada · En Estancia
                  </span>
                  <h3 className="font-serif text-2xl text-[#2C3627] font-light mt-1.5">
                    Estancia {selectedRoomDetails.room.number}
                  </h3>
                  <p className="text-xs text-[#8C857B] italic">{selectedRoomDetails.room.name}</p>
                </div>
                <button 
                  id="close-room-modal-btn"
                  onClick={() => setSelectedRoomDetails(null)}
                  className="p-1.5 hover:bg-[#FAF9F6] rounded-full text-[#8C857B] hover:text-[#2D2D2D] transition-colors border border-transparent hover:border-[#D1CDC3] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Guest Information */}
              <div className="bg-[#FAF9F6] border border-[#D1CDC3] p-4 rounded-xl space-y-3 font-sans text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E5E1D8]/60">
                  <User className="w-4 h-4 text-[#2C3627]" />
                  <span className="font-semibold text-sm text-[#2C3627]">{selectedRoomDetails.booking.guestName}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[#8C857B]">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[8.5px] uppercase tracking-wider block">Correo Electrónico</span>
                    <span className="text-[#2D2D2D] truncate block">{selectedRoomDetails.booking.guestEmail}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-[8.5px] uppercase tracking-wider block">ID Factura / Folio</span>
                    <span className="text-[#2D2D2D] font-mono font-medium block">{selectedRoomDetails.booking.invoiceNumber}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-[8.5px] uppercase tracking-wider block">Fecha Entrada (In)</span>
                    <span className="text-[#2D2D2D] block">{selectedRoomDetails.booking.checkIn}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-[8.5px] uppercase tracking-wider block">Fecha Salida (Out)</span>
                    <span className="text-rose-900 font-semibold block">{selectedRoomDetails.booking.checkOut}</span>
                  </div>
                </div>
              </div>

              {/* Extras/Charges Manager */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline border-b border-[#FAF9F6] pb-1.5">
                  <span className="font-serif text-sm font-semibold text-[#2C3627]">Cargos Adicionales (Extras)</span>
                  <span className="font-mono text-[9.5px] text-[#8C857B] uppercase">Servicio de Habitaciones / Bar</span>
                </div>

                {/* Charges List Table */}
                <div className="border border-[#E5E1D8] rounded-lg bg-white overflow-hidden max-h-[160px] overflow-y-auto">
                  <table className="w-full text-left text-[11px] border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-[#E5E1D8] font-mono text-[8.5px] text-[#8C857B] uppercase tracking-wider bg-[#FAF9F6]">
                        <th className="py-2 px-3">Descripción</th>
                        <th className="py-2 px-3 text-right">Precio</th>
                        <th className="py-2 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E1D8] text-[#2D2D2D]">
                      {(extraCharges[selectedRoomDetails.booking.id] || []).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center italic text-[#8C857B] text-[10.5px]">
                            No hay cargos adicionales cargados a esta habitación.
                          </td>
                        </tr>
                      ) : (
                        (extraCharges[selectedRoomDetails.booking.id] || []).map((ch) => (
                          <tr key={ch.id} className="hover:bg-amber-50/10">
                            <td className="py-2 px-3 font-medium">{ch.desc}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold">{ch.amount.toFixed(2)}€</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteExtraCharge(selectedRoomDetails.booking.id, ch.id)}
                                className="text-[#8C857B] hover:text-red-700 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Form to add extra charge */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const descEl = form.elements.namedItem('extraDesc') as HTMLInputElement;
                    const amountEl = form.elements.namedItem('extraAmount') as HTMLInputElement;
                    handleAddExtraCharge(selectedRoomDetails.booking.id, descEl.value, parseFloat(amountEl.value));
                    form.reset();
                  }}
                  className="grid grid-cols-12 gap-2"
                >
                  <input 
                    type="text" 
                    name="extraDesc"
                    required
                    placeholder="Descripción del extra (ej. Minibar Agua 1L)" 
                    className="col-span-8 px-3 py-1.5 text-xs border border-[#D1CDC3] bg-white rounded-lg focus:outline-hidden"
                  />
                  <input 
                    type="number" 
                    name="extraAmount"
                    required
                    step="0.01"
                    placeholder="Precio" 
                    className="col-span-3 px-3 py-1.5 text-xs border border-[#D1CDC3] bg-white rounded-lg focus:outline-hidden font-mono"
                  />
                  <button 
                    type="submit"
                    className="col-span-1 bg-[#2C3627] hover:bg-[#1C2319] text-white flex items-center justify-center rounded-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Dynamic Budget Total Folio */}
              <div className="bg-[#FDFCFB] border border-[#E5E1D8] p-4.5 rounded-xl space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-[#8C857B]">
                  <span>Tarifa Estancia Base</span>
                  <span>{selectedRoomDetails.booking.totalPrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-[#8C857B]">
                  <span>Total Cargos Extra</span>
                  <span>
                    {((extraCharges[selectedRoomDetails.booking.id] || []).reduce((acc, c) => acc + c.amount, 0)).toFixed(2)}€
                  </span>
                </div>
                <div className="border-t border-dashed border-[#D1CDC3] pt-2.5 flex justify-between text-[#2D2D2D] font-bold text-sm">
                  <span>Balance Total</span>
                  <span className="text-base text-[#2C3627]">
                    {(
                      selectedRoomDetails.booking.totalPrice + 
                      ((extraCharges[selectedRoomDetails.booking.id] || []).reduce((acc, c) => acc + c.amount, 0))
                    ).toFixed(2)}€
                  </span>
                </div>
              </div>

            </div>

            {/* Quick check-out action */}
            <div className="border-t border-[#E5E1D8] pt-4.5 flex gap-3">
              <button
                type="button"
                id="modal-checkout-btn"
                onClick={() => {
                  onUpdateRoomStatus(selectedRoomDetails.room.id, 'cleaning');
                  setSelectedRoomDetails(null);
                }}
                className="flex-1 py-3 bg-[#2C3627] hover:bg-rose-950 text-white font-mono text-xs uppercase tracking-widest rounded-lg font-bold transition-all shadow-md cursor-pointer text-center"
              >
                Tramitar Check-Out (Liberar)
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoomDetails(null)}
                className="px-5 py-3 bg-[#FAF9F6] border border-[#D1CDC3] text-[#8C857B] hover:text-[#2D2D2D] hover:bg-[#F5F3EF] font-mono text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Volver
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
