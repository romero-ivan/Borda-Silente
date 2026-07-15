/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Compass, KeyRound, ShieldAlert, Sparkles, AlertCircle, Heart } from 'lucide-react';
import { Room, Booking, Employee, Subcontractor, ChatMessage, SenderRole, RoomStatus, BookingPlatform } from './types.js';
import RoleSwitcher from './components/RoleSwitcher.js';
import ClientView from './components/ClientView.js';
import ReceptionistView from './components/ReceptionistView.js';
import AdminView from './components/AdminView.js';
import InvoiceModal from './components/InvoiceModal.js';
import ChatBox from './components/ChatBox.js';
import { INITIAL_DATA } from './initialData.js';

const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const getLocalDb = (): any => {
  const local = localStorage.getItem('borda_silente_db');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }
  localStorage.setItem('borda_silente_db', JSON.stringify(INITIAL_DATA));
  return INITIAL_DATA;
};

const saveLocalDb = (data: any) => {
  localStorage.setItem('borda_silente_db', JSON.stringify(data));
};

export default function App() {
  const [currentRole, setCurrentRole] = useState<SenderRole>('consumer');
  
  // Database store state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active printable invoice
  const [activeInvoice, setActiveInvoice] = useState<{ booking: Booking; room: Room } | null>(null);

  // Poll database state periodically to keep client-receptionist-admin synced
  const fetchHotelData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    
    if (isProduction) {
      const db = getLocalDb();
      setRooms(db.rooms || []);
      setBookings(db.bookings || []);
      setEmployees(db.employees || []);
      setSubcontractors(db.subcontractors || []);
      setChats(db.chats || []);
      setError('');
      if (showLoading) setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/hotel/data');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
        setBookings(data.bookings || []);
        setEmployees(data.employees || []);
        setSubcontractors(data.subcontractors || []);
        setChats(data.chats || []);
        setError('');
      } else {
        const db = getLocalDb();
        setRooms(db.rooms || []);
        setBookings(db.bookings || []);
        setEmployees(db.employees || []);
        setSubcontractors(db.subcontractors || []);
        setChats(db.chats || []);
        setError('');
      }
    } catch (err) {
      console.error('Failed to sync hotel database, falling back to local storage', err);
      const db = getLocalDb();
      setRooms(db.rooms || []);
      setBookings(db.bookings || []);
      setEmployees(db.employees || []);
      setSubcontractors(db.subcontractors || []);
      setChats(db.chats || []);
      setError('');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelData(true);
    // Poll every 3 seconds to represent a live, multi-user system
    const interval = setInterval(() => {
      fetchHotelData(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Action: Add booking
  const handleBook = async (bookingData: {
    guestName: string;
    guestEmail: string;
    roomId: number;
    checkIn: string;
    checkOut: string;
    platform: BookingPlatform;
  }) => {
    if (isProduction) {
      const db = getLocalDb();
      const room = db.rooms.find((r: any) => r.id === bookingData.roomId);
      if (!room) throw new Error('La habitación especificada no existe.');

      const dateIn = new Date(bookingData.checkIn);
      const dateOut = new Date(bookingData.checkOut);
      const diffTime = Math.abs(dateOut.getTime() - dateIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      const totalPrice = room.price * diffDays;

      const bookingId = `B-${Math.floor(1000 + Math.random() * 9000)}`;
      const invoiceIndex = db.bookings.length + 213;
      const invoiceNumber = `BS-2026-0${invoiceIndex}`;

      const newBooking: Booking = {
        id: bookingId,
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        roomId: room.id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        totalPrice,
        platform: bookingData.platform || 'web',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        invoiceNumber
      };

      const todayStr = '2026-07-14';
      if (bookingData.checkIn <= todayStr && bookingData.checkOut >= todayStr) {
        room.status = 'occupied';
      }

      db.bookings.push(newBooking);
      saveLocalDb(db);
      await fetchHotelData(false);

      setActiveInvoice({
        booking: newBooking,
        room
      });
      return;
    }

    try {
      const res = await fetch('/api/hotel/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Fallo al procesar la reserva.');
      }
      
      const resData = await res.json();
      await fetchHotelData(false);
      
      const matchedRoom = rooms.find(r => r.id === bookingData.roomId);
      if (matchedRoom) {
        setActiveInvoice({
          booking: resData.booking,
          room: matchedRoom
        });
      }
    } catch (err: any) {
      // Fallback
      const db = getLocalDb();
      const room = db.rooms.find((r: any) => r.id === bookingData.roomId);
      if (!room) throw new Error('La habitación especificada no existe.');

      const dateIn = new Date(bookingData.checkIn);
      const dateOut = new Date(bookingData.checkOut);
      const diffTime = Math.abs(dateOut.getTime() - dateIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      const totalPrice = room.price * diffDays;

      const bookingId = `B-${Math.floor(1000 + Math.random() * 9000)}`;
      const invoiceIndex = db.bookings.length + 213;
      const invoiceNumber = `BS-2026-0${invoiceIndex}`;

      const newBooking: Booking = {
        id: bookingId,
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        roomId: room.id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        totalPrice,
        platform: bookingData.platform || 'web',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        invoiceNumber
      };

      const todayStr = '2026-07-14';
      if (bookingData.checkIn <= todayStr && bookingData.checkOut >= todayStr) {
        room.status = 'occupied';
      }

      db.bookings.push(newBooking);
      saveLocalDb(db);
      await fetchHotelData(false);

      setActiveInvoice({
        booking: newBooking,
        room
      });
    }
  };

  // Action: Send support chat message
  const handleSendMessage = async (messageText: string) => {
    const senderName = 
      currentRole === 'receptionist' 
        ? 'Marta Aznárez Larrosa' 
        : currentRole === 'admin' 
        ? 'Administrador General' 
        : 'Invitado Web';

    if (isProduction) {
      const db = getLocalDb();
      const newMessage: ChatMessage = {
        id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
        senderRole: currentRole,
        senderName,
        message: messageText,
        timestamp: new Date().toISOString()
      };
      db.chats.push(newMessage);
      saveLocalDb(db);
      await fetchHotelData(false);
      return;
    }

    try {
      const res = await fetch('/api/hotel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderRole: currentRole,
          senderName,
          message: messageText
        })
      });
      if (res.ok) {
        await fetchHotelData(false);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      const db = getLocalDb();
      const newMessage: ChatMessage = {
        id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
        senderRole: currentRole,
        senderName,
        message: messageText,
        timestamp: new Date().toISOString()
      };
      db.chats.push(newMessage);
      saveLocalDb(db);
      await fetchHotelData(false);
    }
  };

  // Action: Housekeeping status
  const handleUpdateRoomStatus = async (roomId: number, status: RoomStatus) => {
    if (isProduction) {
      const db = getLocalDb();
      const room = db.rooms.find((r: any) => r.id === roomId);
      if (room) {
        room.status = status;
        saveLocalDb(db);
        await fetchHotelData(false);
      }
      return;
    }

    try {
      const res = await fetch(`/api/hotel/rooms/${roomId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchHotelData(false);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      const db = getLocalDb();
      const room = db.rooms.find((r: any) => r.id === roomId);
      if (room) {
        room.status = status;
        saveLocalDb(db);
        await fetchHotelData(false);
      }
    }
  };

  // Action: Clock-in employee
  const handleClockEmployee = async (employeeId: string, action: 'in' | 'out') => {
    if (isProduction) {
      const db = getLocalDb();
      const emp = db.employees.find((e: any) => e.id === employeeId);
      if (emp) {
        if (action === 'in') {
          emp.status = 'present';
          const now = new Date();
          emp.todayClockIn = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        } else {
          emp.status = 'absent';
          delete emp.todayClockIn;
        }
        saveLocalDb(db);
        await fetchHotelData(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/employees/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, action })
      });
      if (res.ok) {
        await fetchHotelData(false);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      const db = getLocalDb();
      const emp = db.employees.find((e: any) => e.id === employeeId);
      if (emp) {
        if (action === 'in') {
          emp.status = 'present';
          const now = new Date();
          emp.todayClockIn = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        } else {
          emp.status = 'absent';
          delete emp.todayClockIn;
        }
        saveLocalDb(db);
        await fetchHotelData(false);
      }
    }
  };

  // Action: Log leave (vacations/sick)
  const handleLogLeave = async (employeeId: string, leaveType: 'vacation' | 'sick', days: number) => {
    if (isProduction) {
      const db = getLocalDb();
      const emp = db.employees.find((e: any) => e.id === employeeId);
      if (emp) {
        if (leaveType === 'vacation') {
          emp.status = 'vacation';
          emp.vacationsTaken = (emp.vacationsTaken || 0) + days;
        } else {
          emp.status = 'sick';
          emp.sickLeaves = (emp.sickLeaves || 0) + 1;
        }
        saveLocalDb(db);
        await fetchHotelData(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/employees/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, leaveType, days })
      });
      if (res.ok) {
        await fetchHotelData(false);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      const db = getLocalDb();
      const emp = db.employees.find((e: any) => e.id === employeeId);
      if (emp) {
        if (leaveType === 'vacation') {
          emp.status = 'vacation';
          emp.vacationsTaken = (emp.vacationsTaken || 0) + days;
        } else {
          emp.status = 'sick';
          emp.sickLeaves = (emp.sickLeaves || 0) + 1;
        }
        saveLocalDb(db);
        await fetchHotelData(false);
      }
    }
  };

  // Action: Add maintenance ticket
  const handleAddSubcontractorTicket = async (subcontractorId: string, title: string) => {
    if (isProduction) {
      const db = getLocalDb();
      const sub = db.subcontractors.find((s: any) => s.id === subcontractorId);
      if (sub) {
        const ticketId = `TKT-${Math.floor(100 + Math.random() * 900)}`;
        sub.activeTickets.push({
          id: ticketId,
          title,
          status: 'open',
          date: new Date().toISOString().split('T')[0]
        });
        sub.status = 'pending-review';
        saveLocalDb(db);
        await fetchHotelData(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/hotel/subcontractors/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subcontractorId, title })
      });
      if (res.ok) {
        await fetchHotelData(false);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      const db = getLocalDb();
      const sub = db.subcontractors.find((s: any) => s.id === subcontractorId);
      if (sub) {
        const ticketId = `TKT-${Math.floor(100 + Math.random() * 900)}`;
        sub.activeTickets.push({
          id: ticketId,
          title,
          status: 'open',
          date: new Date().toISOString().split('T')[0]
        });
        sub.status = 'pending-review';
        saveLocalDb(db);
        await fetchHotelData(false);
      }
    }
  };

  // Action: Resolve maintenance ticket
  const handleResolveSubcontractorTicket = async (subcontractorId: string, ticketId: string) => {
    if (isProduction) {
      const db = getLocalDb();
      const sub = db.subcontractors.find((s: any) => s.id === subcontractorId);
      if (sub) {
        const ticket = sub.activeTickets.find((t: any) => t.id === ticketId);
        if (ticket) {
          ticket.status = 'resolved';
          const hasOpen = sub.activeTickets.some((t: any) => t.status === 'open');
          sub.status = hasOpen ? 'pending-review' : 'ok';
          saveLocalDb(db);
          await fetchHotelData(false);
        }
      }
      return;
    }

    try {
      const res = await fetch('/api/hotel/subcontractors/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subcontractorId, ticketId })
      });
      if (res.ok) {
        await fetchHotelData(false);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      const db = getLocalDb();
      const sub = db.subcontractors.find((s: any) => s.id === subcontractorId);
      if (sub) {
        const ticket = sub.activeTickets.find((t: any) => t.id === ticketId);
        if (ticket) {
          ticket.status = 'resolved';
          const hasOpen = sub.activeTickets.some((t: any) => t.status === 'open');
          sub.status = hasOpen ? 'pending-review' : 'ok';
          saveLocalDb(db);
          await fetchHotelData(false);
        }
      }
    }
  };

  const handleOpenInvoiceModal = (booking: Booking, room: Room) => {
    setActiveInvoice({ booking, room });
  };


  return (
    <div className="min-h-screen bg-[#FDFCFB] wabi-paper text-[#2D2D2D] flex flex-col font-sans selection:bg-[#E5E1D8] selection:text-[#8C857B]">
      
      {/* 1. Demostración Role Switcher (Always available at the top for review) */}
      <RoleSwitcher currentRole={currentRole} onChangeRole={setCurrentRole} />

      {/* 2. Top Navigation Bar */}
      <header className="px-6 py-4 border-b border-[#E5E1D8] flex justify-between items-center bg-[#FDFCFB] print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#2D2D2D] flex items-center justify-center bg-[#FDFCFB] transition-all">
            <Compass className="w-5 h-5 text-[#2D2D2D]" />
          </div>
          <div>
            <span className="font-serif text-lg font-medium tracking-widest uppercase text-[#2D2D2D]">Borda Silente</span>
            <span className="font-mono text-[9px] uppercase text-[#8C857B] block tracking-[0.2em] mt-0.5">Refugio de Montaña</span>
          </div>
        </div>

        {/* Dynamic header pill reflecting current workspace */}
        <div className="flex items-center gap-2">
          {currentRole === 'consumer' ? (
            <span className="font-mono text-[10px] text-[#2C3627] bg-[#F5F3EF] border border-[#E5E1D8] px-2.5 py-1 tracking-wider uppercase rounded-xs">
              Portal del Huésped
            </span>
          ) : currentRole === 'receptionist' ? (
            <span className="font-mono text-[10px] text-[#8C857B] bg-[#F5F3EF] border border-[#D1CDC3] px-2.5 py-1 tracking-wider uppercase rounded-xs flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Mostrador Principal
            </span>
          ) : (
            <span className="font-mono text-[10px] text-[#FDFCFB] bg-[#2D2D2D] px-2.5 py-1 tracking-wider uppercase rounded-xs flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#E5B181]" />
              Supervisión de Dirección
            </span>
          )}
        </div>
      </header>

      {/* 3. Main Content Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <span className="w-6 h-6 border-2 border-[#8C857B] border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#8C857B]">Sincronizando Base de Datos...</span>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto my-16 p-6 border border-[#F3D1D1] bg-[#F5F3EF] text-[#2D2D2D] rounded-xs space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Incidencia en la Sincronización</span>
            </div>
            <p className="text-xs leading-relaxed">{error}</p>
            <button 
              onClick={() => fetchHotelData(true)}
              className="px-4 py-1.5 bg-[#2D2D2D] hover:bg-[#8C857B] text-[#FDFCFB] text-xs font-mono uppercase tracking-wider rounded-xs"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : (
          <div>
            {currentRole === 'consumer' && (
              <ClientView 
                rooms={rooms} 
                bookings={bookings} 
                onBook={handleBook}
                onOpenInvoice={handleOpenInvoiceModal}
              />
            )}
            
            {currentRole === 'receptionist' && (
              <ReceptionistView 
                rooms={rooms}
                bookings={bookings}
                chatMessages={chats}
                onSendMessage={handleSendMessage}
                onUpdateRoomStatus={handleUpdateRoomStatus}
                onBook={handleBook}
              />
            )}

            {currentRole === 'admin' && (
              <AdminView 
                rooms={rooms}
                bookings={bookings}
                employees={employees}
                subcontractors={subcontractors}
                onClockEmployee={handleClockEmployee}
                onLogLeave={handleLogLeave}
                onAddSubcontractorTicket={handleAddSubcontractorTicket}
                onResolveSubcontractorTicket={handleResolveSubcontractorTicket}
              />
            )}
          </div>
        )}
      </main>

      {/* 4. Global Printable PDF Invoice Modal */}
      <InvoiceModal 
        isOpen={activeInvoice !== null}
        onClose={() => setActiveInvoice(null)}
        booking={activeInvoice?.booking || null}
        room={activeInvoice?.room || null}
      />

      {/* 5. Floating Chat box in compact mode for guest interaction */}
      {currentRole === 'consumer' && !loading && !error && (
        <ChatBox 
          currentRole="consumer"
          currentUserName="Invitado Web"
          chatMessages={chats}
          onSendMessage={handleSendMessage}
          compact={true}
        />
      )}
    </div>
  );
}
