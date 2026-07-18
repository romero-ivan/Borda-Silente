/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Shield, Compass, Sparkles, AlertCircle, FileText, 
  Mail, Phone, MapPin, Flame, Thermometer, Wifi, Star, ArrowRight, X, Clock, Map,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, Booking, BookingPlatform } from '../types.js';

const ROOM_IMAGES_MAP: Record<number, string[]> = {
  101: [
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=70", // Dormitorio clásico de vigas y piedra
    "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=70", // Baño rústico de madera y piedra
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=70"  // Vistas al valle de Ansó
  ],
  102: [
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=70", // Dormitorio con chimenea de piedra
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=70", // Baño rústico de madera
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=70"  // Vistas al valle forestal
  ],
  103: [
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=70", // Dormitorio rústico con ventana al pinar
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=70", // Baño con ducha forestal
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=70"  // Vistas del pinar y niebla
  ],
  201: [
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=70", // Dormitorio abuhardillado tatami
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=70", // Baño de Suite bañera integrada
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=70"  // Vistas a Monte Perdido
  ],
  202: [
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=70", // Loft ático cama y chimenea de hierro
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=70", // Baño del ático
    "https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?auto=format&fit=crop&w=600&q=70"  // Vistas balcón volado atardecer
  ],
  301: [
    "/room_101_1.jpg", // Cabaña Silente Exclusiva - Dormitorio
    "/room_101_2.jpg", // Cabaña Silente Exclusiva - Baño termal de cedro
    "/room_101_3.jpg"  // Cabaña Silente Exclusiva - Chimenea suspendida y vistas
  ]
};

interface ImageCarouselProps {
  images: string[];
  alt: string;
  isOccupied?: boolean;
  occupiedText?: string;
  isLCP?: boolean;
}

function ImageCarousel({ images, alt, isOccupied, occupiedText, isLCP }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative aspect-[16/10] overflow-hidden bg-[#F5F3EF] rounded-lg shadow-inner group/carousel touch-pan-y"
    >
      {/* Slides Container */}
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((img, idx) => (
          <img 
            key={idx}
            src={img} 
            alt={`${alt} - Imagen ${idx + 1}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover shrink-0 select-none pointer-events-none group-hover:scale-103 transition-transform duration-700 ease-out"
            loading={isLCP && idx === 0 ? "eager" : "lazy"}
            {...{ fetchpriority: isLCP && idx === 0 ? "high" : "low" }}
            decoding={isLCP && idx === 0 ? "sync" : "async"}
          />
        ))}
      </div>

      {/* Prev/Next buttons (Only show if multiple images exist) */}
      {images.length > 1 && (
        <>
          <button 
            type="button"
            onClick={handlePrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7.5 h-7.5 rounded-full bg-[#121411]/60 text-white flex items-center justify-center hover:bg-[#121411]/80 hover:scale-105 active:scale-95 transition-all opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100 cursor-pointer select-none"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={handleNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7.5 h-7.5 rounded-full bg-[#121411]/60 text-white flex items-center justify-center hover:bg-[#121411]/80 hover:scale-105 active:scale-95 transition-all opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100 cursor-pointer select-none"
            aria-label="Siguiente imagen"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {images.map((_, idx) => (
            <span 
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${idx === index ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}

      {/* Occupied full glass overlay */}
      {isOccupied && (
        <div className="absolute inset-0 bg-[#121411]/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10 select-none pointer-events-none">
          <span className="bg-red-900/90 text-white border border-red-500/30 font-mono text-[9px] uppercase tracking-widest px-3 py-1 rounded-sm shadow-md font-bold mb-2">
            No Disponible
          </span>
          <p className="text-white font-serif text-xs sm:text-sm font-medium leading-relaxed max-w-[220px]">
            {occupiedText || 'Ocupada para estas fechas'}
          </p>
        </div>
      )}
    </div>
  );
}

interface ClientViewProps {
  rooms: Room[];
  bookings: Booking[];
  onBook: (bookingData: {
    guestName: string;
    guestEmail: string;
    roomId: number;
    checkIn: string;
    checkOut: string;
    platform: BookingPlatform;
  }) => Promise<void>;
  onOpenInvoice: (booking: Booking, room: Room) => void;
  loading?: boolean;
}

export default function ClientView({ rooms, bookings, onBook, onOpenInvoice, loading }: ClientViewProps) {
  // Booking Bar States (defaults for search)
  const [searchCheckIn, setSearchCheckIn] = useState('2026-07-14');
  const [searchCheckOut, setSearchCheckOut] = useState('2026-07-16');
  const [searchGuests, setSearchGuests] = useState(2);
  const [searchChildren, setSearchChildren] = useState(0);
  const [searchFiltered, setSearchFiltered] = useState(false);

  // Modal reservation form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingRoomId, setBookingRoomId] = useState<number | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [lastBookedEmail, setLastBookedEmail] = useState('');

  // Selected Room for Modal
  const modalRoom = rooms.find(r => r.id === bookingRoomId);

  // Filter Rooms based on Booking Bar search inputs
  const totalGuests = Number(searchGuests) + Number(searchChildren);

  const filteredRooms = rooms.filter(room => {
    // 1. Capacity filter
    if (room.capacity < totalGuests) return false;

    // 2. Availability filter
    const isOccupied = bookings.some(booking => {
      if (booking.roomId !== room.id) return false;
      return booking.checkIn < searchCheckOut && booking.checkOut > searchCheckIn;
    });

    return !isOccupied;
  });

  // Fallback: if no rooms available, show all but flag availability
  const isNoRoomsAvailable = searchFiltered && filteredRooms.length === 0;
  const roomsToDisplay = isNoRoomsAvailable ? rooms : (searchFiltered ? filteredRooms : rooms);

  // Nights calculation
  const calculateNights = () => {
    try {
      const d1 = new Date(searchCheckIn);
      const d2 = new Date(searchCheckOut);
      const diff = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return isNaN(diff) || diff <= 0 ? 1 : diff;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();
  const roomPriceTotal = modalRoom ? modalRoom.price * nights : 0;
  const subtotal = roomPriceTotal;
  const iva = subtotal * 0.1;
  const total = subtotal + iva;

  // Handle Search Execution
  const handleOpenBookingModal = (roomId: number) => {
    setBookingRoomId(roomId);
    setIsModalOpen(true);
    setBookingError('');
    setBookingSuccess('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFiltered(true);
    
    // Smooth scroll to rooms catalog section
    const element = document.getElementById('rooms-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle Booking Submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');
    setLastBookedEmail('');

    if (!guestName.trim() || !guestEmail.trim()) {
      setBookingError('Por favor, introduzca su nombre completo y correo electrónico.');
      return;
    }

    if (new Date(searchCheckIn) >= new Date(searchCheckOut)) {
      setBookingError('La fecha de salida debe ser posterior a la de entrada.');
      return;
    }

    if (!bookingRoomId) return;

    try {
      await onBook({
        guestName,
        guestEmail,
        roomId: bookingRoomId,
        checkIn: searchCheckIn,
        checkOut: searchCheckOut,
        platform: 'web'
      });
      setLastBookedEmail(guestEmail);
      setBookingSuccess('¡Estancia reservada con éxito! Su factura digital está lista para descargar.');
      setGuestName('');
      setGuestEmail('');
    } catch (err: any) {
      setBookingError(err.message || 'Error al procesar la reserva. Inténtelo de nuevo.');
    }
  };

  // Find the last booking created in this session by matching the lastBookedEmail
  const lastBooking = [...bookings]
    .reverse()
    .find(b => b.guestEmail.toLowerCase().trim() === lastBookedEmail.toLowerCase().trim());

  // Helper to get room properties
  const getRoomMetrics = (id: number) => {
    switch (id) {
      case 101: return { size: '28 m²', bed: 'Cama Queen Size', icon: '🌲' };
      case 102: return { size: '32 m²', bed: 'Cama Queen Size', icon: '🏔️' };
      case 103: return { size: '30 m²', bed: 'Cama Queen Size', icon: '🍁' };
      case 201: return { size: '45 m²', bed: 'Cama King Size', icon: '🛁' };
      case 202: return { size: '50 m²', bed: 'Cama King Size', icon: '🔥' };
      default: return { size: '75 m²', bed: 'Cama Imperial King', icon: '🏡' };
    }
  };

  return (
    <div className="space-y-24 pb-12">
      
      {/* 1. HERO SECTION & OVERLAY BOOKING ENGINE */}
      <section className="relative min-h-[85vh] flex flex-col justify-between items-center text-[#FDFCFB] rounded-2xl overflow-hidden border border-[#E5E1D8] bg-[#1C2319] shadow-2xl p-6 sm:p-12">
        {/* Full-screen Background image */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=70" 
            alt="Misty Pyrenees Peaks" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-25 scale-105 transform translate-y-[-2%] transition-transform duration-[3000ms] hover:scale-100"
            loading="eager"
            {...{ fetchpriority: "high" }}
            decoding="sync"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C2319] via-[#1C2319]/70 to-[#1C2319]/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1C2319]/50 via-transparent to-transparent" />
        </div>

        {/* Top Spacer or Small Indicator */}
        <div className="relative z-10 pt-4 flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2C3627]/80 border border-[#FDFCFB]/15 rounded-full text-[9px] font-mono uppercase tracking-[0.25em] text-[#E5B181] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5B181] animate-pulse" />
            <Compass className="w-3 h-3" />
            <span>Valle de Ansó · Pirineos</span>
          </div>
        </div>

        {/* Hero Central Titles */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 my-auto py-8">
          <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight leading-none drop-shadow-sm">
            Borda Silente
          </h1>
          <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-[#E5E1D8]/95 font-light tracking-wide max-w-lg mx-auto">
            La arquitectura del sosiego.
          </p>
          <p className="font-sans text-xs sm:text-sm text-[#E5E1D8]/80 max-w-xl mx-auto font-light leading-relaxed px-4 pt-2">
            Un refugio de piedra tradicional, vigas centenarias y fuego de leña suspendido a 1.280 metros de altitud. El auténtico silencio pirenaico hecho estancia.
          </p>
        </div>

        {/* Overlay Booking Engine Bar (Horizontal on Desktop, Single-column on Mobile) */}
        <div id="booking-engine" className="relative z-10 w-full max-w-5xl bg-[#FDFCFB] border border-[#E5E1D8] rounded-xl shadow-2xl p-5 pb-7 sm:p-6 text-[#2D2D2D] -mb-10 sm:-mb-14 scroll-mt-28 transition-all duration-300">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            
            {/* Check-In Date */}
            <div className="flex-1 min-w-[140px] space-y-1.5">
              <label className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#8C857B] font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#E5B181]" />
                Entrada
              </label>
              <input 
                id="search-check-in"
                type="date" 
                value={searchCheckIn}
                onChange={(e) => setSearchCheckIn(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#E5E1D8] text-base md:text-xs font-mono px-3 py-2.5 rounded-md focus:outline-hidden focus:border-[#2C3627] focus:ring-1 focus:ring-[#2C3627]/30 transition-all cursor-pointer"
                min="2026-01-01"
              />
            </div>

            {/* Separator Line */}
            <div className="hidden lg:block w-px h-8 bg-[#E5E1D8]" />

            {/* Check-Out Date */}
            <div className="flex-1 min-w-[140px] space-y-1.5">
              <label className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#8C857B] font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#E5B181]" />
                Salida
              </label>
              <input 
                type="date" 
                value={searchCheckOut}
                onChange={(e) => setSearchCheckOut(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#E5E1D8] text-base md:text-xs font-mono px-3 py-2.5 rounded-md focus:outline-hidden focus:border-[#2C3627] focus:ring-1 focus:ring-[#2C3627]/30 transition-all cursor-pointer"
                min={searchCheckIn}
              />
            </div>

            {/* Separator Line */}
            <div className="hidden lg:block w-px h-8 bg-[#E5E1D8]" />

            {/* Adults Select */}
            <div className="w-full lg:w-[130px] space-y-1.5">
              <label className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#8C857B] font-semibold">
                <Users className="w-3.5 h-3.5 text-[#E5B181]" />
                Adultos
              </label>
              <select 
                value={searchGuests}
                onChange={(e) => setSearchGuests(Number(e.target.value))}
                className="w-full bg-[#FAF9F6] border border-[#E5E1D8] text-base md:text-xs px-3 py-2.5 rounded-md focus:outline-hidden focus:border-[#2C3627] cursor-pointer"
              >
                <option value={1}>1 Adulto</option>
                <option value={2}>2 Adultos</option>
                <option value={3}>3 Adultos</option>
                <option value={4}>4 Adultos</option>
              </select>
            </div>

            {/* Children Select */}
            <div className="w-full lg:w-[130px] space-y-1.5">
              <label className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#8C857B] font-semibold">
                <Users className="w-3.5 h-3.5 text-[#E5B181]" />
                Niños
              </label>
              <select 
                value={searchChildren}
                onChange={(e) => setSearchChildren(Number(e.target.value))}
                className="w-full bg-[#FAF9F6] border border-[#E5E1D8] text-base md:text-xs px-3 py-2.5 rounded-md focus:outline-hidden focus:border-[#2C3627] cursor-pointer"
              >
                <option value={0}>Sin Niños</option>
                <option value={1}>1 Niño</option>
                <option value={2}>2 Niños</option>
              </select>
            </div>

            {/* Search Button (CTA) */}
            <button 
              type="submit"
              className="lg:self-end bg-[#2C3627] hover:bg-[#E5B181] hover:text-[#2D2D2D] text-white border border-[#2C3627] px-6 py-3 font-mono text-xs uppercase tracking-widest transition-all duration-300 font-bold rounded-md cursor-pointer shadow-sm text-center flex items-center justify-center gap-2 min-h-[44px] mt-3 lg:mt-0 w-full lg:w-auto"
            >
              Buscar Disponibilidad
            </button>
          </form>
        </div>
      </section>

      {/* 2. PHILOSOPHY & CONCEPT (WITHOUT ROMAN NUMERALS I, II, III) */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 pt-10 sm:pt-14">
        {/* Card 1: Materiales Nobles */}
        <div className="p-8 bg-[#FDFCFB] border border-[#E5E1D8] space-y-5 rounded-xl transition-all duration-500 hover:border-[#2C3627] hover:shadow-xl group">
          <div className="w-11 h-11 rounded-lg bg-[#2C3627]/5 flex items-center justify-center text-[#2C3627] group-hover:bg-[#2C3627] group-hover:text-white transition-all duration-500">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-lg text-[#2C3627] font-medium border-b border-[#E5E1D8]/60 pb-2">
              Materiales Nobles
            </h3>
            <p className="text-xs text-[#8C857B] leading-relaxed font-light font-sans">
              Piedra local labrada a mano, vigas de abeto centenario restauradas a cepillo y textiles de lino orgánico belga. Una conjunción honesta y sobria que abraza al viajero.
            </p>
          </div>
        </div>

        {/* Card 2: Aguas de Deshielo */}
        <div className="p-8 bg-[#FDFCFB] border border-[#E5E1D8] space-y-5 rounded-xl transition-all duration-500 hover:border-[#2C3627] hover:shadow-xl group">
          <div className="w-11 h-11 rounded-lg bg-[#2C3627]/5 flex items-center justify-center text-[#2C3627] group-hover:bg-[#2C3627] group-hover:text-white transition-all duration-500">
            <Thermometer className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-lg text-[#2C3627] font-medium border-b border-[#E5E1D8]/60 pb-2">
              Bañeras y Aguas Termales
            </h3>
            <p className="text-xs text-[#8C857B] leading-relaxed font-light font-sans">
              Estancias provistas de tinas profundas labradas en madera de cedro aromático o bañeras esculpidas en bloques de piedra. Disfrute de baños nutridos por manantiales locales.
            </p>
          </div>
        </div>

        {/* Card 3: Calidez Primitiva */}
        <div className="p-8 bg-[#FDFCFB] border border-[#E5E1D8] space-y-5 rounded-xl transition-all duration-500 hover:border-[#2C3627] hover:shadow-xl group">
          <div className="w-11 h-11 rounded-lg bg-[#2C3627]/5 flex items-center justify-center text-[#2C3627] group-hover:bg-[#2C3627] group-hover:text-white transition-all duration-500">
            <Flame className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-lg text-[#2C3627] font-medium border-b border-[#E5E1D8]/60 pb-2">
              Calidez de Leña
            </h3>
            <p className="text-xs text-[#8C857B] leading-relaxed font-light font-sans">
              Estufas de biomasa de última generación y chimeneas tradicionales suspendidas. Suministramos cestas de leña seca de abedul de nuestros bosques sostenibles.
            </p>
          </div>
        </div>
      </section>

      {/* 3. ROOMS CATALOG (GRID VIEW WITHOUT SIDEBAR FORM) */}
      <section id="rooms-section" className="max-w-7xl mx-auto px-4 space-y-8 scroll-mt-28">
        <div className="border-t border-[#E5E1D8] pt-14 flex flex-col md:flex-row justify-between items-baseline gap-4">
          <div className="space-y-1.5">
            <h2 className="font-serif text-3.5xl sm:text-4xl text-[#2C3627] font-light">Nuestras Estancias</h2>
            <p className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider">
              {searchFiltered ? 'Resultados de Búsqueda de Disponibilidad' : 'Colección de Cabañas y Suites de Montaña'}
            </p>
          </div>
          {searchFiltered && (
            <button 
              onClick={() => setSearchFiltered(false)}
              className="text-[#8C857B] hover:text-[#2D2D2D] font-mono text-[9px] uppercase tracking-widest underline cursor-pointer"
            >
              Ver todas las estancias
            </button>
          )}
        </div>

        {/* Booking Bar availability notifications */}
        {isNoRoomsAvailable && (
          <div className="p-5 bg-[#F5F3EF] border border-[#E5E1D8] text-xs text-[#8C857B] rounded-xl flex items-center gap-2.5 font-light leading-relaxed">
            <AlertCircle className="w-5 h-5 text-[#E5B181] shrink-0" />
            <p>
              No hay estancias totalmente libres para las fechas de **{searchCheckIn} al {searchCheckOut}**. A continuación, te mostramos toda nuestra colección para que puedas explorar otras fechas disponibles.
            </p>
          </div>
        )}

        {/* Room Cards Grid Layout (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#FDFCFB] border border-[#E5E1D8] p-5 rounded-xl animate-pulse space-y-5">
                <div className="aspect-[16/10] bg-[#FAF9F6]/80 rounded-lg shadow-inner" />
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="h-6 bg-[#E5E1D8]/60 rounded-xs w-2/3" />
                    <div className="h-4 bg-[#E5E1D8]/40 rounded-xs w-10" />
                  </div>
                  <div className="h-8 bg-[#E5E1D8]/45 rounded-xs w-24" />
                  <div className="h-4 bg-[#E5E1D8]/30 rounded-xs w-full" />
                </div>
                <div className="pt-4 border-t border-[#E5E1D8] flex justify-between items-center">
                  <div className="h-3 bg-[#E5E1D8]/30 rounded-xs w-16" />
                  <div className="h-8 bg-[#E5E1D8]/50 rounded-xs w-28" />
                </div>
              </div>
            ))
          ) : (
            roomsToDisplay.map((room, index) => {
              const isLCP = index === 0;
              const metrics = getRoomMetrics(room.id);
              const roomImages = ROOM_IMAGES_MAP[room.id] || [room.image];
              const isOccupiedDuringDates = bookings.some(booking => {
                if (booking.roomId !== room.id) return false;
                return booking.checkIn < searchCheckOut && booking.checkOut > searchCheckIn;
              });
              const isAvailable = !isOccupiedDuringDates;

              // Calculate total for this specific room during dates
              const specificRoomSubtotal = room.price * nights;
              const specificRoomIva = specificRoomSubtotal * 0.1;
              const specificRoomTotal = specificRoomSubtotal + specificRoomIva;

              return (
                <div 
                  key={room.id}
                  className={`bg-[#FDFCFB] border border-[#E5E1D8] p-5 flex flex-col justify-between rounded-xl transition-all duration-500 group relative overflow-hidden ${
                    searchFiltered && !isAvailable 
                      ? 'opacity-50 grayscale-15 scale-[0.98]' 
                      : 'hover:border-[#2C3627] hover:shadow-xl'
                  }`}
                >
                  <div>
                    {/* Room image carousel */}
                    <div className="relative mb-5">
                      <ImageCarousel 
                        images={roomImages} 
                        alt={room.name} 
                        isOccupied={searchFiltered && !isAvailable}
                        occupiedText={`Ocupada del ${searchCheckIn} al ${searchCheckOut}`}
                        isLCP={isLCP}
                      />

                      {/* Availability badge (Only show in search results) */}
                      {searchFiltered && (
                        <div className="absolute top-3 right-3 z-30">
                          <span className={`px-2.5 py-1 text-[8px] font-mono uppercase tracking-wider rounded-full border backdrop-blur-md font-semibold flex items-center gap-1 ${
                            isAvailable 
                              ? 'bg-white/95 text-[#2C3627] border-[#2C3627]/20 shadow-xs' 
                              : 'bg-red-950/90 text-red-200 border-red-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-[#2C3627]' : 'bg-red-500'}`} />
                            {isAvailable ? 'Disponible' : 'Ocupada'}
                          </span>
                        </div>
                      )}

                      {/* Category marker tag */}
                      <div className="absolute bottom-3.5 left-3.5 z-20">
                        <span className="px-2 py-0.5 text-[7px] font-mono uppercase tracking-widest text-white bg-[#2C3627]/90 rounded-sm">
                          {room.type === 'cabin' ? '★ Cabaña de Madera' : room.type === 'suite' ? '★ Suite Refugio' : '★ Habitación Principal'}
                        </span>
                      </div>
                    </div>

                    {/* Room specifications */}
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-serif text-lg text-[#2C3627] font-medium leading-snug group-hover:text-black transition-colors">
                          {room.name}
                        </h3>
                        <span className="font-mono text-[9px] text-[#8C857B] bg-[#F5F3EF] px-2 py-0.5 rounded-xs shrink-0">
                          Nº {room.number}
                        </span>
                      </div>

                      {/* Metrics bar (Standard compliant) */}
                      <div className="flex items-center gap-3.5 text-[9px] font-mono text-[#8C857B] uppercase border-y border-[#F5F3EF] py-2">
                        <span>{metrics.icon} {metrics.size}</span>
                        <span className="w-1 h-1 rounded-full bg-[#E5E1D8]" />
                        <span>{metrics.bed}</span>
                        <span className="w-1 h-1 rounded-full bg-[#E5E1D8]" />
                        <span>Capacidad: {room.capacity} p.</span>
                      </div>

                      {/* Features list */}
                      <ul className="text-[10.5px] text-[#8C857B] space-y-2 mt-1">
                        {room.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E5B181] shrink-0" />
                            <span className="font-sans font-light text-[#2D2D2D] truncate">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pricing and Book CTA Button (Conditioned on Search Filter state) */}
                  {searchFiltered ? (
                    <div className="pt-4 border-t border-[#E5E1D8] mt-6 flex justify-between items-center">
                      <div>
                        {isAvailable ? (
                          <>
                            <span className="block font-mono text-[8px] text-[#8C857B] tracking-wider uppercase leading-none">PRECIO TOTAL ({nights} n.)</span>
                            <div className="flex items-baseline gap-0.5 font-mono font-semibold text-[#2C3627] mt-0.5">
                              <span className="text-lg font-serif font-medium">{specificRoomTotal.toFixed(0)}€</span>
                              <span className="text-[9px] text-[#8C857B] font-light">({room.price}€/n.)</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="block font-mono text-[8px] text-red-500/80 tracking-wider uppercase leading-none">ESTADO</span>
                            <div className="font-mono text-xs font-semibold text-red-700 mt-1">
                              No disponible
                            </div>
                          </>
                        )}
                      </div>

                      <button 
                        onClick={() => isAvailable && handleOpenBookingModal(room.id)}
                        disabled={!isAvailable}
                        className={`px-4.5 py-2 font-mono text-[10px] uppercase tracking-widest transition-all duration-300 font-bold rounded-xs h-[36px] ${
                          isAvailable 
                            ? 'bg-[#2C3627] hover:bg-[#E5B181] hover:text-[#2D2D2D] text-white cursor-pointer shadow-xs' 
                            : 'bg-[#D1CDC3] text-[#8C857B] cursor-not-allowed border border-[#D1CDC3]'
                        }`}
                      >
                        {isAvailable ? 'Reservar' : 'Ocupada'}
                      </button>
                    </div>
                  ) : (
                    /* Homepage Inspirational mode: NO price, NO booking button. Show helper text link instead */
                    <div className="pt-4 border-t border-[#E5E1D8]/60 mt-6 text-center">
                      <a 
                        href="#booking-engine"
                        onClick={(e) => {
                          e.preventDefault();
                          const engine = document.getElementById('booking-engine');
                          if (engine) {
                            engine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            engine.classList.add('ring-4', 'ring-[#E5B181]/65');
                            setTimeout(() => {
                              engine.classList.remove('ring-4', 'ring-[#E5B181]/65');
                            }, 1800);
                            const checkInInput = document.getElementById('search-check-in');
                            if (checkInInput) {
                              setTimeout(() => {
                                (checkInInput as HTMLInputElement).focus();
                              }, 500);
                            }
                          }
                        }}
                        className="text-[#2C3627]/85 hover:text-[#E5B181] font-mono text-[9px] uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-1 font-semibold py-1.5 hover:underline"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#E5B181]" />
                        Buscar disponibilidad y tarifas
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 4. INSTALACIONES Y SERVICIOS (Amenities section with icons) */}
      <section id="amenities-section" className="max-w-7xl mx-auto px-4 space-y-12 scroll-mt-28">
        <div className="border-t border-[#E5E1D8] pt-14 text-center space-y-1.5">
          <h2 className="font-serif text-3.5xl sm:text-4xl text-[#2C3627] font-light">Experiencias y Servicios</h2>
          <p className="font-mono text-[9px] text-[#8C857B] uppercase tracking-widest">El descanso en sintonía con el entorno silvestre</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-5xl mx-auto pt-4">
          {/* Wifi */}
          <div className="space-y-3.5 p-4 bg-[#FDFCFB] border border-[#E5E1D8]/50 rounded-xl hover:border-[#2C3627] transition-all duration-300">
            <div className="w-12 h-12 bg-[#2C3627]/5 text-[#2C3627] rounded-full flex items-center justify-center mx-auto shadow-3xs">
              <Wifi className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-medium text-[#2C3627]">Conexión Satelital</h4>
              <p className="text-[10px] text-[#8C857B] mt-1 font-sans font-light">Starlink de alta velocidad en todo el refugio.</p>
            </div>
          </div>

          {/* Desayuno */}
          <div className="space-y-3.5 p-4 bg-[#FDFCFB] border border-[#E5E1D8]/50 rounded-xl hover:border-[#2C3627] transition-all duration-300">
            <div className="w-12 h-12 bg-[#2C3627]/5 text-[#2C3627] rounded-full flex items-center justify-center mx-auto shadow-3xs">
              <Sparkles className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-medium text-[#2C3627]">Desayuno Orgánico</h4>
              <p className="text-[10px] text-[#8C857B] mt-1 font-sans font-light">Recetas locales y pan artesano horneado al amanecer.</p>
            </div>
          </div>

          {/* Calefacción chimenea */}
          <div className="space-y-3.5 p-4 bg-[#FDFCFB] border border-[#E5E1D8]/50 rounded-xl hover:border-[#2C3627] transition-all duration-300">
            <div className="w-12 h-12 bg-[#2C3627]/5 text-[#2C3627] rounded-full flex items-center justify-center mx-auto shadow-3xs">
              <Flame className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-medium text-[#2C3627]">Hogar de Leña</h4>
              <p className="text-[10px] text-[#8C857B] mt-1 font-sans font-light">Chimeneas independientes con suministro de abedul.</p>
            </div>
          </div>

          {/* Tinas de Cedro */}
          <div className="space-y-3.5 p-4 bg-[#FDFCFB] border border-[#E5E1D8]/50 rounded-xl hover:border-[#2C3627] transition-all duration-300">
            <div className="w-12 h-12 bg-[#2C3627]/5 text-[#2C3627] rounded-full flex items-center justify-center mx-auto shadow-3xs">
              <Thermometer className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-medium text-[#2C3627]">Tinas Calientes</h4>
              <p className="text-[10px] text-[#8C857B] mt-1 font-sans font-light">Baños de inmersión profunda con aceites esenciales.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Culinary section: La Cocina Silente */}
      <section id="gastronomy-section" className="max-w-7xl mx-auto px-4 space-y-12 scroll-mt-28">
        <div className="border-t border-[#E5E1D8] pt-14 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <h2 className="font-serif text-3.5xl text-[#2C3627] font-light">La Cocina Silente</h2>
            <p className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider">Gastronomía Elemental de Fuego Lento · Altitud 1.280m</p>
          </div>
          <span className="font-mono text-[9px] text-[#E5B181] bg-[#2C3627] px-3.5 py-1.5 tracking-wider uppercase font-semibold rounded-full shadow-3xs">
            Exclusivo Huéspedes
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-6">
            <p className="font-serif italic text-2xl text-[#2D2D2D]/90 leading-relaxed font-light">
              "El sabor de la montaña cocinado a la brasa de encina y el calor de las cenizas."
            </p>
            <p className="text-xs text-[#8C857B] leading-relaxed font-light font-sans">
              En Borda Silente, la comida no es solo alimento, es una conexión directa con el Pirineo aragonés. El restaurante del refugio está dedicado exclusivamente a nuestros huéspedes. Servimos recetas tradicionales de Huesca preparadas con ingredientes de temporada de productores del Valle de Ansó, acompañadas de pan artesanal fermentado a la antigua usanza y quesos de cueva locales.
            </p>
            <div className="border-t border-[#E5E1D8] pt-5 space-y-3 font-mono text-[10px] text-[#8C857B]">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5B181]" />
                <span>Desayuno del Refugio incluido en todas las reservas</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5B181]" />
                <span>Platos elaborados con leña de encina y fuego de piedra</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5B181]" />
                <span>Selección exclusiva de vinos Somontano de bodegas boutique</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Food item 1 */}
            <div className="group overflow-hidden rounded-xl border border-[#E5E1D8] bg-[#FDFCFB] p-4.5 space-y-4 shadow-sm hover:border-[#2C3627] hover:shadow-lg transition-all duration-500">
              <div className="aspect-[4/3] overflow-hidden bg-[#F5F3EF] rounded-lg shadow-inner">
                <img 
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=450&q=70" 
                  alt="Brasas y Carnes Pirenaicas"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-serif text-lg text-[#2C3627] font-medium leading-snug">Brasas del Pirineo</h4>
                <p className="text-[11px] text-[#8C857B] font-light leading-relaxed">
                  Carnes de ternera y cordero del Pirineo de Huesca preparadas a la brasa abierta de encina y servidas con sales de manantial locales.
                </p>
              </div>
            </div>

            {/* Food item 2 */}
            <div className="group overflow-hidden rounded-xl border border-[#E5E1D8] bg-[#FDFCFB] p-4.5 space-y-4 shadow-sm hover:border-[#2C3627] hover:shadow-lg transition-all duration-500">
              <div className="aspect-[4/3] overflow-hidden bg-[#F5F3EF] rounded-lg shadow-inner">
                <img 
                  src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=450&q=70" 
                  alt="Panadería Tradicional"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-serif text-lg text-[#2C3627] font-medium leading-snug">Panadería y Masa Madre</h4>
                <p className="text-[11px] text-[#8C857B] font-light leading-relaxed">
                  Panes rústicos horneados cada mañana en el refugio con harinas molidas a piedra y fermentación natural de 24 horas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRUEBA SOCIAL (TripAdvisor/Google reviews simulated widget) */}
      <section id="social-proof-section" className="max-w-7xl mx-auto px-4 space-y-10 scroll-mt-28">
        <div className="border-t border-[#E5E1D8] pt-14 text-center space-y-1.5">
          <h2 className="font-serif text-3.5xl sm:text-4xl text-[#2C3627] font-light">La Opinión de Nuestros Huéspedes</h2>
          <p className="font-mono text-[9px] text-[#8C857B] uppercase tracking-widest">Respaldo y opiniones reales de viajeros en el Pirineo</p>
        </div>

        {/* Stars summary banner */}
        <div className="bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl p-6 max-w-2xl mx-auto flex flex-col sm:flex-row justify-around items-center gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <span className="font-mono text-[9px] tracking-wider text-[#8C857B] uppercase block">CALIFICACIÓN GENERAL</span>
            <div className="flex items-center gap-2">
              <span className="font-serif text-4xl font-semibold text-[#2C3627]">4.9</span>
              <span className="text-xs text-[#8C857B] font-light font-mono">/ 5.0</span>
            </div>
            <div className="flex gap-0.5 justify-center sm:justify-start">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#E5B181] text-[#E5B181]" />
              ))}
            </div>
          </div>

          <div className="w-px h-12 bg-[#E5E1D8] hidden sm:block" />

          <div className="space-y-1">
            <span className="font-mono text-[9px] tracking-wider text-[#8C857B] uppercase block font-semibold">RECOMENDADO EN PLATAFORMAS</span>
            <div className="flex items-center gap-4 pt-1 font-mono text-[10px] text-[#2C3627] font-semibold">
              <span className="bg-[#E5B181]/15 px-2.5 py-1 rounded-sm border border-[#E5B181]/30">Booking.com · 9.8</span>
              <span className="bg-[#2C3627]/5 px-2.5 py-1 rounded-sm border border-[#2C3627]/10">TripAdvisor · 5/5</span>
            </div>
          </div>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {/* Review 1 */}
          <div className="bg-[#FDFCFB] border border-[#E5E1D8] p-6.5 rounded-xl space-y-4 flex flex-col justify-between hover:border-[#2C3627] transition-all duration-300">
            <div className="space-y-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#E5B181] text-[#E5B181]" />
                ))}
              </div>
              <p className="text-xs text-[#2D2D2D] leading-relaxed font-light italic font-serif">
                "Un lugar mágico para reconectar. Las tinas de cedro caliente bajo las estrellas de los Pirineos son una experiencia espiritual. Las camas y el lino son sumamente cómodos."
              </p>
            </div>
            <div className="border-t border-[#F5F3EF] pt-3 flex justify-between items-center text-[10px] font-mono text-[#8C857B]">
              <span className="font-medium text-[#2C3627]">Clara Mendoza</span>
              <span>Julio 2026</span>
            </div>
          </div>

          {/* Review 2 */}
          <div className="bg-[#FDFCFB] border border-[#E5E1D8] p-6.5 rounded-xl space-y-4 flex flex-col justify-between hover:border-[#2C3627] transition-all duration-300">
            <div className="space-y-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#E5B181] text-[#E5B181]" />
                ))}
              </div>
              <p className="text-xs text-[#2D2D2D] leading-relaxed font-light italic font-serif">
                "Hacía años que no dormía en un silencio tan absoluto. La estufa de leña aporta una calidez incomparable y el desayuno de masa madre con quesos de Ansó es una locura."
              </p>
            </div>
            <div className="border-t border-[#F5F3EF] pt-3 flex justify-between items-center text-[10px] font-mono text-[#8C857B]">
              <span className="font-medium text-[#2C3627]">Andrés Varela</span>
              <span>Junio 2026</span>
            </div>
          </div>

          {/* Review 3 */}
          <div className="bg-[#FDFCFB] border border-[#E5E1D8] p-6.5 rounded-xl space-y-4 flex flex-col justify-between hover:border-[#2C3627] transition-all duration-300">
            <div className="space-y-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#E5B181] text-[#E5B181]" />
                ))}
              </div>
              <p className="text-xs text-[#2D2D2D] leading-relaxed font-light italic font-serif">
                "La atención al cliente, el diseño minimalista de inspiración wabi-sabi y el entorno pirenaico forman un refugio perfecto. Las facturas y la reserva online fueron inmediatas."
              </p>
            </div>
            <div className="border-t border-[#F5F3EF] pt-3 flex justify-between items-center text-[10px] font-mono text-[#8C857B]">
              <span className="font-medium text-[#2C3627]">Helena Rostova</span>
              <span>Mayo 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOOKING DETAILS MODAL (POPUP ON CTA CLICK) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop cover with blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#1C2319]/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Body Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              className="relative bg-[#FAF9F6] border border-[#E5E1D8] w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 z-10 overflow-y-auto max-h-[90vh] font-sans text-[#2D2D2D]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-[#8C857B] hover:text-[#2C3627] cursor-pointer p-1 rounded-full hover:bg-[#F5F3EF] transition-all"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Header */}
              <div className="space-y-1.5 border-b border-[#D1CDC3] pb-4 mb-5">
                <h3 className="font-serif text-xl sm:text-2xl text-[#2C3627] font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#E5B181]" />
                  Reserva tu Estancia
                </h3>
                <p className="font-mono text-[9px] text-[#8C857B] uppercase tracking-widest leading-none">Registro de Folio de Huésped</p>
              </div>

              {/* Booking success overlay view */}
              {bookingSuccess ? (
                <div className="space-y-5 py-2 text-center">
                  <div className="w-12 h-12 bg-[#2C3627]/10 text-[#2C3627] rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6 text-[#E5B181]" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-serif text-lg font-medium text-[#2C3627]">¡Reserva Completada!</h4>
                    <p className="text-xs text-[#8C857B] font-light leading-relaxed">
                      Tu reserva en **{modalRoom?.name}** del **{searchCheckIn} al {searchCheckOut}** ha sido registrada con éxito en Firestore.
                    </p>
                  </div>

                  {lastBooking && (
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        onOpenInvoice(lastBooking, modalRoom!);
                      }}
                      className="w-full py-3 bg-[#2C3627] hover:bg-[#2C3627]/90 text-white font-mono text-[10px] uppercase tracking-widest rounded-md flex items-center justify-center gap-2 cursor-pointer shadow-sm font-semibold transition-all"
                    >
                      <FileText className="w-4.5 h-4.5" />
                      Ver Factura & Descargar PDF
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-2.5 bg-white border border-[#D1CDC3] text-[#8C857B] hover:text-[#2D2D2D] transition-all font-mono text-[10px] uppercase tracking-widest rounded-md cursor-pointer"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitBooking} className="space-y-5">
                  {/* Selected Room overview pill */}
                  <div className="p-4 bg-white border border-[#E5E1D8] rounded-lg text-xs space-y-1 shadow-2xs relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2C3627]" />
                    <span className="font-mono text-[8px] uppercase tracking-widest text-[#8C857B] block font-semibold">ESTANCIA</span>
                    <p className="font-serif font-medium text-[#2C3627] text-base">{modalRoom?.name}</p>
                    <p className="font-mono text-[9px] text-[#8C857B]">
                      Fechas: {searchCheckIn} al {searchCheckOut} · ({nights} noches)
                    </p>
                  </div>

                  {/* Form inputs */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B] font-semibold">Nombre Completo del Huésped</label>
                      <input 
                        type="text" 
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="ej. Juan Pérez"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D1CDC3] text-[#2D2D2D] focus:outline-hidden focus:border-[#2C3627] focus:ring-1 focus:ring-[#2C3627]/30 rounded-md transition-all placeholder-[#8C857B]/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B] font-semibold">Correo Electrónico</label>
                      <input 
                        type="email" 
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="ej. juan@gmail.com"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D1CDC3] text-[#2D2D2D] focus:outline-hidden focus:border-[#2C3627] focus:ring-1 focus:ring-[#2C3627]/30 rounded-md transition-all placeholder-[#8C857B]/40"
                      />
                    </div>
                  </div>

                  {/* Pricing receipt detail */}
                  <div className="space-y-2 text-xs font-mono text-[#8C857B] bg-white border border-[#E5E1D8] p-4 rounded-lg shadow-3xs">
                    <div className="flex justify-between">
                      <span>Tarifa base ({nights} noches)</span>
                      <span className="text-[#2D2D2D]">{roomPriceTotal.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between border-b border-[#FAF9F6] pb-2">
                      <span>IVA Turístico (10%)</span>
                      <span className="text-[#2D2D2D]">{iva.toFixed(2)}€</span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-sm text-[#2C3627] border-t border-[#E5E1D8]/60 pt-2.5 mt-2">
                      <span className="font-sans font-medium text-xs">Total:</span>
                      <span className="text-base font-bold">{total.toFixed(2)}€</span>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {bookingError && (
                    <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-100 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p className="font-sans">{bookingError}</p>
                    </div>
                  )}

                  {/* Submit button */}
                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#2C3627] hover:bg-[#E5B181] hover:text-[#2D2D2D] text-white font-mono text-xs uppercase tracking-widest rounded-md flex items-center justify-center gap-2 shadow-md cursor-pointer font-semibold transition-all duration-300"
                  >
                    <Calendar className="w-4 h-4" />
                    Confirmar Reserva
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
