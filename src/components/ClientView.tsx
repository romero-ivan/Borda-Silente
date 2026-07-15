/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Shield, Compass, Sparkles, AlertCircle, FileText, 
  Mail, Phone, MapPin, Flame, Thermometer 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, Booking, BookingPlatform } from '../types.js';

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
}

export default function ClientView({ rooms, bookings, onBook, onOpenInvoice }: ClientViewProps) {
  // Booking Form State
  const [selectedRoomId, setSelectedRoomId] = useState<number>(rooms[0]?.id || 101);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkIn, setCheckIn] = useState('2026-07-14');
  const [checkOut, setCheckOut] = useState('2026-07-16');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [lastBookedEmail, setLastBookedEmail] = useState('');

  const isFirstRender = useRef(true);

  // Auto-scroll to booking form on mobile when room selection changes (skips initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (window.innerWidth < 1024) {
      const element = document.getElementById('booking-engine-card');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [selectedRoomId]);

  // Selected Room
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Nights calculation
  const calculateNights = () => {
    try {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diff = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return isNaN(diff) || diff <= 0 ? 1 : diff;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();
  const roomPriceTotal = selectedRoom ? selectedRoom.price * nights : 0;
  const ecoTax = 1.5 * nights;
  const cleaningFee = 25.0;
  const subtotal = roomPriceTotal + ecoTax + cleaningFee;
  const iva = subtotal * 0.1;
  const total = subtotal + iva;

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');
    setLastBookedEmail('');

    if (!guestName.trim() || !guestEmail.trim()) {
      setBookingError('Por favor, introduzca su nombre completo y correo electrónico.');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      setBookingError('La fecha de salida debe ser posterior a la de entrada.');
      return;
    }

    try {
      await onBook({
        guestName,
        guestEmail,
        roomId: selectedRoomId,
        checkIn,
        checkOut,
        platform: 'web'
      });
      setLastBookedEmail(guestEmail);
      setBookingSuccess('¡Estancia reservada con éxito! Su factura digital está lista para descargar.');
      
      // Clear contact form but keep selection for invoice access
      setGuestName('');
      setGuestEmail('');
    } catch (err: any) {
      setBookingError(err.message || 'Error al procesar la reserva. Inténtelo de nuevo.');
    }
  };

  const getRoomById = (id: number) => rooms.find(r => r.id === id);

  // Find the last booking created in this session by matching the lastBookedEmail
  const lastBooking = [...bookings]
    .reverse()
    .find(b => b.guestEmail.toLowerCase().trim() === lastBookedEmail.toLowerCase().trim());

  return (
    <div className="space-y-20 pb-24">
      
      {/* Editorial Panoramic Hero Header */}
      <div className="relative py-24 sm:py-28 px-8 sm:px-12 overflow-hidden rounded-2xl border border-[#E5E1D8] bg-[#1C2319] shadow-2xl transition-all duration-700 hover:shadow-[#1C2319]/10">
        {/* Cinematic Mountain Background Image with Cinematic Dark Gradient Mask */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80" 
            alt="Misty Pyrenees Peaks" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-20 scale-105 transform translate-y-[-5%] transition-transform duration-[3000ms] hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C2319] via-[#1C2319]/80 to-[#1C2319]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C2319]/90 via-[#1C2319]/50 to-transparent" />
        </div>

        {/* Decorative thin structural outline mimicking architectural blueprints */}
        <div className="absolute inset-4 sm:inset-6 border border-[#FDFCFB]/10 rounded-xl pointer-events-none z-10" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 text-[#FDFCFB] py-6 sm:py-10">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#2C3627]/60 backdrop-blur-md border border-[#FDFCFB]/15 rounded-full text-[10px] font-mono uppercase tracking-[0.25em] text-[#E5B181]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5B181] animate-pulse" />
            <Compass className="w-3.5 h-3.5" />
            <span>Valle de Ansó · Pirineos</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl font-light tracking-tight text-[#FDFCFB] leading-[0.85] drop-shadow-sm">
              Borda Silente
            </h1>
            <p className="font-serif italic text-xl sm:text-2xl md:text-3xl text-[#E5E1D8]/90 font-light tracking-wide">
              La arquitectura del sosiego.
            </p>
          </div>

          <p className="font-sans text-xs sm:text-sm sm:text-base text-[#E5E1D8]/80 max-w-2xl mx-auto font-light leading-relaxed px-4">
            Un santuario de piedra tradicional, vigas centenarias y fuego de leña suspendido a 1.280m de altitud. Aquí, las cumbres aragonesas no solo se contemplan: se habitan en íntimo silencio, lejos del ruido del mundo.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-[10px] font-mono uppercase tracking-[0.2em] text-[#E5B181] pt-2">
            <span className="flex items-center gap-2 bg-[#2C3627]/40 px-4 py-2 rounded-full border border-[#FDFCFB]/10 backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5" /> Huesca, España
            </span>
            <span className="flex items-center gap-2 bg-[#2C3627]/40 px-4 py-2 rounded-full border border-[#FDFCFB]/10 backdrop-blur-xs">
              <Shield className="w-3.5 h-3.5" /> Altitud 1.280m
            </span>
          </div>
        </div>
      </div>

      {/* Philosophy Callout: High-End Japanese Rustic & Nordic Mountain Blend */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        
        {/* Card 1: Materiales Nobles */}
        <div className="p-8 bg-[#FDFCFB] border border-[#E5E1D8] space-y-5 relative overflow-hidden group hover:border-[#2C3627] hover:shadow-xl transition-all duration-500 rounded-xl">
          {/* Decorative absolute background number */}
          <span className="font-serif italic text-9xl text-[#E5B181]/10 absolute right-4 -top-2 select-none pointer-events-none group-hover:scale-110 group-hover:text-[#E5B181]/20 transition-all duration-500">I</span>
          
          <div className="w-12 h-12 rounded-xl bg-[#2C3627]/5 flex items-center justify-center text-[#2C3627] group-hover:bg-[#2C3627] group-hover:text-[#FDFCFB] transition-all duration-500 shadow-sm">
            <Compass className="w-5.5 h-5.5" />
          </div>
          
          <div className="space-y-2 relative z-10">
            <h3 className="font-serif text-xl text-[#2C3627] font-medium border-b border-[#E5E1D8]/60 pb-2.5">
              Materiales Nobles
            </h3>
            <p className="text-xs text-[#8C857B] leading-relaxed font-light">
              Sillares de piedra local de cantera aragonesa, vigas de abeto centenario restauradas a cepillo y textiles de lino belga lavado a la piedra. Una conjunción honesta y sobria que abraza al viajero.
            </p>
          </div>
        </div>
        
        {/* Card 2: Aguas de Deshielo */}
        <div className="p-8 bg-[#FDFCFB] border border-[#E5E1D8] space-y-5 relative overflow-hidden group hover:border-[#2C3627] hover:shadow-xl transition-all duration-500 rounded-xl">
          {/* Decorative absolute background number */}
          <span className="font-serif italic text-9xl text-[#E5B181]/10 absolute right-4 -top-2 select-none pointer-events-none group-hover:scale-110 group-hover:text-[#E5B181]/20 transition-all duration-500">II</span>
          
          <div className="w-12 h-12 rounded-xl bg-[#2C3627]/5 flex items-center justify-center text-[#2C3627] group-hover:bg-[#2C3627] group-hover:text-[#FDFCFB] transition-all duration-500 shadow-sm">
            <Thermometer className="w-5.5 h-5.5" />
          </div>
          
          <div className="space-y-2 relative z-10">
            <h3 className="font-serif text-xl text-[#2C3627] font-medium border-b border-[#E5E1D8]/60 pb-2.5">
              Aguas de Deshielo
            </h3>
            <p className="text-xs text-[#8C857B] leading-relaxed font-light">
              Estudios provistos de tinas profundas labradas en madera de cedro aromático o bañeras esculpidas en piedra de río. Disfrute de baños purificadores nutridos por la pureza de las cumbres pirenaicas.
            </p>
          </div>
        </div>

        {/* Card 3: Calidez Primitiva */}
        <div className="p-8 bg-[#FDFCFB] border border-[#E5E1D8] space-y-5 relative overflow-hidden group hover:border-[#2C3627] hover:shadow-xl transition-all duration-500 rounded-xl">
          {/* Decorative absolute background number */}
          <span className="font-serif italic text-9xl text-[#E5B181]/10 absolute right-4 -top-2 select-none pointer-events-none group-hover:scale-110 group-hover:text-[#E5B181]/20 transition-all duration-500">III</span>
          
          <div className="w-12 h-12 rounded-xl bg-[#2C3627]/5 flex items-center justify-center text-[#2C3627] group-hover:bg-[#2C3627] group-hover:text-[#FDFCFB] transition-all duration-500 shadow-sm">
            <Flame className="w-5.5 h-5.5" />
          </div>
          
          <div className="space-y-2 relative z-10">
            <h3 className="font-serif text-xl text-[#2C3627] font-medium border-b border-[#E5E1D8]/60 pb-2.5">
              Calidez Primitiva
            </h3>
            <p className="text-xs text-[#8C857B] leading-relaxed font-light">
              Estufas de biomasa de última generación y chimeneas tradicionales suspendidas. Suministramos cestas de leña seca de abedul de nuestros bosques sostenibles para revivir la danza elemental del fuego.
            </p>
          </div>
        </div>

      </div>

      {/* Culinary Section: Gastronomía de Altura */}
      <div className="max-w-7xl mx-auto px-4 space-y-10">
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
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80" 
                  alt="Brasas y Carnes Pirenaicas"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
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
                  src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80" 
                  alt="Panadería Tradicional"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-serif text-lg text-[#2C3627] font-medium leading-snug">Panadería y Masa Madre</h4>
                <p className="text-[11px] text-[#8C857B] font-light leading-relaxed">
                  Panes rústicos horneados cada mañana en el refugio con harinas molidas a piedra y fermentación natural extendida de 24 horas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Split: Reservation Engine & Room Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 px-4 max-w-7xl mx-auto">
        
        {/* LEFT: Room Showcase (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-2 border-b border-[#E5E1D8] pb-5 flex justify-between items-baseline flex-wrap gap-2">
            <div>
              <h2 className="font-serif text-3.5xl text-[#2C3627] font-light">Colección de Estancias</h2>
              <p className="font-mono text-[10px] text-[#8C857B] uppercase tracking-wider">Disponibilidad en Tiempo Real · Sello Boutique</p>
            </div>
            <span className="font-mono text-[9px] text-[#2C3627] border border-[#2C3627]/20 uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full bg-[#FAF9F6]">
              Estilo Exclusivo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {rooms.map((room) => {
              const isSelected = selectedRoomId === room.id;
              return (
                <motion.div 
                  layout
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`bg-[#FDFCFB] border p-5 flex flex-col justify-between transition-all duration-500 rounded-xl cursor-pointer group shadow-sm relative overflow-hidden ${
                    isSelected 
                      ? 'border-[#2C3627] ring-1 ring-[#2C3627] shadow-xl bg-[#FAF9F6]' 
                      : 'border-[#E5E1D8] hover:border-[#2C3627]/60 hover:shadow-md'
                  }`}
                >
                  {/* Subtle design top border for selected state */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#2C3627]" />
                  )}

                  <div>
                    {/* Image with zoom hover effect */}
                    <div className="relative aspect-[16/10] overflow-hidden mb-5 bg-[#F5F3EF] rounded-lg shadow-inner">
                      <img 
                        src={room.image} 
                        alt={room.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                      />
                      
                      {/* Interactive pill for Room status */}
                      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
                        <span className={`px-2.5 py-1 text-[8px] font-mono uppercase tracking-wider rounded-full border backdrop-blur-md font-semibold flex items-center gap-1.5 ${
                          room.status === 'available' 
                            ? 'bg-white/95 text-[#2C3627] border-[#2C3627]/20 shadow-xs' 
                            : 'bg-white/90 text-[#8C857B] border-[#D1CDC3]/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${room.status === 'available' ? 'bg-[#2C3627]' : 'bg-[#8C857B] animate-pulse'}`} />
                          {room.status === 'available' ? 'Disponible' : 'Ocupada'}
                        </span>
                      </div>

                      {/* Cabin/Suite marker tag */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 text-[7.5px] font-mono uppercase tracking-widest text-white bg-[#2C3627]/90 rounded-sm backdrop-blur-xs font-medium">
                          {room.type === 'cabin' ? '★ Cabaña de Madera' : room.type === 'suite' ? '★ Suite Refugio' : '★ Habitación Principal'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-serif text-xl text-[#2C3627] font-medium leading-snug group-hover:text-black transition-colors">{room.name}</h3>
                        <span className="font-mono text-[9px] text-[#8C857B] bg-[#F5F3EF] px-2 py-0.5 rounded-sm shrink-0 font-medium">Nº {room.number}</span>
                      </div>

                      <div className="flex items-baseline gap-1 font-mono text-xs text-[#2C3627] font-semibold bg-[#2C3627]/5 px-2.5 py-1 rounded-sm w-max">
                        <span className="text-base font-serif font-medium">{room.price}€</span>
                        <span className="text-[10px] text-[#8C857B] font-light">/ noche</span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-[#8C857B] font-mono border-t border-[#F5F3EF] pt-2.5">
                        <Users className="w-4 h-4 text-[#E5B181]" />
                        <span>Capacidad: {room.capacity} personas</span>
                      </div>

                      {/* Features list */}
                      <ul className="pt-2.5 text-[11px] text-[#8C857B] space-y-2 border-t border-[#F5F3EF] mt-2.5">
                        {room.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E5B181] shrink-0" />
                            <span className="font-sans font-light text-[#2D2D2D] truncate">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Selection footer banner */}
                  <div className="pt-4 border-t border-[#E5E1D8] mt-5 flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#8C857B]">Pirineo de Huesca</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoomId(room.id);
                      }}
                      className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-all rounded-sm cursor-pointer ${
                        isSelected 
                          ? 'bg-[#2C3627] text-[#FDFCFB] shadow-md font-semibold' 
                          : 'bg-[#F5F3EF] text-[#8C857B] hover:bg-[#D1CDC3] hover:text-[#2D2D2D]'
                      }`}
                    >
                      {isSelected ? '✓ Seleccionada' : 'Seleccionar'}
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Booking Engine & Folio Quote (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-8">
          <div id="booking-engine-card" className="bg-[#FAF9F6] border-double-fine p-7 space-y-6 rounded-xl shadow-lg relative overflow-hidden">
            {/* Subtle paper grain texture simulation */}
            <div className="absolute inset-0 bg-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMDAyIi8+Cjwvc3ZnPg==')] pointer-events-none" />

            <div className="space-y-1.5 border-b border-[#D1CDC3] pb-4 relative z-10">
              <h2 className="font-serif text-2.5xl text-[#2C3627] font-medium flex items-center gap-2.5">
                <Calendar className="w-5.5 h-5.5 text-[#E5B181]" />
                Reserva de Estancia
              </h2>
              <p className="font-mono text-[9px] text-[#8C857B] uppercase tracking-widest leading-none">Presupuesto Estimado y Registro</p>
            </div>

            <form onSubmit={handleSubmitBooking} className="space-y-5 relative z-10">
              
              {/* Confirmed Selection Box */}
              <div className="p-4 bg-[#FDFCFB] border border-[#D1CDC3] rounded-lg text-xs space-y-1.5 shadow-sm relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2C3627]" />
                <span className="font-mono text-[8px] uppercase tracking-widest text-[#8C857B] block font-semibold">ESTANCIA SELECCIONADA</span>
                <p className="font-serif font-medium text-[#2C3627] text-lg">{selectedRoom?.name}</p>
                <div className="flex justify-between items-baseline pt-1">
                  <p className="font-mono text-[10px] text-[#8C857B]">Refugio de Alta Montaña</p>
                  <p className="font-mono text-xs font-semibold text-[#2C3627]">{selectedRoom?.price}€ <span className="font-light text-[9px] text-[#8C857B]">/ noche</span></p>
                </div>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B] font-medium">Fecha de Entrada</label>
                  <input 
                    type="date" 
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCFB] border border-[#D1CDC3] text-[#2D2D2D] focus:outline-hidden focus:border-[#2C3627] focus:ring-1 focus:ring-[#2C3627]/30 rounded-md font-mono transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B] font-medium">Fecha de Salida</label>
                  <input 
                    type="date" 
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCFB] border border-[#D1CDC3] text-[#2D2D2D] focus:outline-hidden focus:border-[#2C3627] focus:ring-1 focus:ring-[#2C3627]/30 rounded-md font-mono transition-all"
                  />
                </div>
              </div>

              {/* Guest Identity */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B] font-medium">Nombre Completo del Huésped</label>
                <input 
                  type="text" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="ej. Alejandro Sanz"
                  className="w-full px-3 py-2.5 text-xs bg-[#FDFCFB] border border-[#D1CDC3] text-[#2D2D2D] focus:outline-hidden focus:border-[#2C3627] focus:ring-1 focus:ring-[#2C3627]/30 rounded-md transition-all placeholder-[#8C857B]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B] font-medium">Correo Electrónico de Contacto</label>
                <input 
                  type="email" 
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="ej. sanz@gmail.com"
                  className="w-full px-3 py-2.5 text-xs bg-[#FDFCFB] border border-[#D1CDC3] text-[#2D2D2D] focus:outline-hidden focus:border-[#2C3627] focus:ring-1 focus:ring-[#2C3627]/30 rounded-md transition-all placeholder-[#8C857B]/50"
                />
              </div>

              {/* Vintage Tear-off Divider Line */}
              <div className="relative py-2.5 select-none">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-[#D1CDC3]" />
                <span className="relative mx-auto block w-max bg-[#FAF9F6] px-3.5 font-mono text-[8px] text-[#8C857B] tracking-[0.2em] uppercase font-bold">Desglose de Tarifas</span>
              </div>

              {/* Invoice breakdown styled like traditional receipt folio */}
              <div className="space-y-2 text-xs font-mono text-[#8C857B] bg-[#FDFCFB] border border-[#E5E1D8] p-4.5 rounded-lg shadow-sm relative overflow-hidden">
                <div className="flex justify-between">
                  <span>{selectedRoom?.name} ({nights} n.)</span>
                  <span className="text-[#2D2D2D]">{roomPriceTotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasa Ecológica Pirenaica</span>
                  <span className="text-[#2D2D2D]">{ecoTax.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Acondicionamiento y Lino</span>
                  <span className="text-[#2D2D2D]">{cleaningFee.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#FAF9F6]/10">
                  <span>IVA Turístico Aplicado (10%)</span>
                  <span className="text-[#2D2D2D]">{iva.toFixed(2)}€</span>
                </div>
                
                {/* Total sum with high prominence and decorative authenticity seal */}
                <div className="flex justify-between font-bold text-sm text-[#2D2D2D] border-t border-[#E5E1D8]/60 pt-3 mt-2.5">
                  <span className="font-sans font-medium text-xs text-[#2C3627]">Total de la Estancia:</span>
                  <span className="text-lg text-[#2C3627] font-mono font-bold">{total.toFixed(2)}€</span>
                </div>

                {/* Simulated Traditional Wax Stamp Badge */}
                <div className="absolute bottom-1 right-2 w-16 h-16 border border-[#2C3627]/10 rounded-full flex flex-col items-center justify-center text-[5px] text-[#2C3627]/30 select-none uppercase pointer-events-none font-sans font-bold leading-none tracking-tighter origin-center rotate-12">
                  <span>BORDA</span>
                  <span className="text-[#2C3627]/40 text-[7px] italic font-serif py-0.5">SILENTE</span>
                  <span>AUTÉNTICA</span>
                </div>
              </div>

              {/* Status responses with transitions */}
              <AnimatePresence mode="wait">
                {bookingError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2 p-3.5 text-xs bg-red-50 text-red-700 border border-red-100 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="font-sans">{bookingError}</p>
                  </motion.div>
                )}

                {bookingSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-3.5 p-5 bg-[#F5F3EF] text-[#2C3627] border border-[#E5E1D8] rounded-lg text-left shadow-md"
                  >
                    <div className="flex items-start gap-2.5 text-xs">
                      <Sparkles className="w-4 h-4 shrink-0 text-[#E5B181] mt-0.5 animate-pulse" />
                      <div>
                        <p className="font-semibold font-serif text-sm">¡Reserva Registrada!</p>
                        <p className="font-sans font-light mt-1 text-[#8C857B] leading-relaxed">
                          La reserva de <strong className="font-medium text-[#2C3627]">{selectedRoom?.name}</strong> se ha completado correctamente.
                        </p>
                      </div>
                    </div>

                    {lastBooking && (
                      <button
                        type="button"
                        onClick={() => onOpenInvoice(lastBooking, selectedRoom!)}
                        className="w-full py-2.5 bg-[#2C3627] hover:bg-[#2C3627]/90 text-white transition-all font-mono text-[10px] uppercase tracking-widest rounded-md flex items-center justify-center gap-2 cursor-pointer shadow-sm font-semibold hover:shadow-md"
                      >
                        <FileText className="w-4 h-4" />
                        Ver e Imprimir Factura
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submission CTA */}
              {!bookingSuccess && (
                <button 
                  type="submit"
                  className="w-full py-3.5 bg-[#2C3627] hover:bg-[#2C3627]/90 text-[#FDFCFB] transition-all font-mono text-xs uppercase tracking-[0.18em] rounded-md flex items-center justify-center gap-2 shadow-md hover:shadow-xl cursor-pointer font-semibold hover:translate-y-[-1px]"
                >
                  <Calendar className="w-4 h-4" />
                  Confirmar Reserva
                </button>
              )}

              {bookingSuccess && (
                <button 
                  type="button"
                  onClick={() => {
                    setBookingSuccess('');
                    setLastBookedEmail('');
                  }}
                  className="w-full py-2.5 bg-white border border-[#D1CDC3] text-[#8C857B] hover:text-[#2D2D2D] transition-all font-mono text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Nueva Simulación de Reserva
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Elegant minimalist footer */}
      <div className="border-t border-[#E5E1D8] pt-14 text-center space-y-4 max-w-5xl mx-auto px-4 select-none">
        <h2 className="font-serif italic text-xl text-[#2C3627] font-light">"La montaña responde con su propio silencio."</h2>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2.5 font-mono text-[10px] text-[#8C857B] uppercase tracking-[0.15em] pt-2">
          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#2C3627]" /> +34 974 330 112</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#2C3627]" /> Valle de Ansó, Pirineos de Huesca</span>
          <span>Borda Silente S.A. © 2026</span>
        </div>
      </div>
    </div>
  );
}

