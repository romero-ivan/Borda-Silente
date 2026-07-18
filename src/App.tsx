/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Compass, KeyRound, ShieldAlert, Sparkles, AlertCircle, Heart, Map, MapPin, Phone } from 'lucide-react';
import { Room, Booking, Employee, Subcontractor, ChatMessage, SenderRole, RoomStatus, BookingPlatform } from './types.js';
import ClientView from './components/ClientView.js';
import ReceptionistView from './components/ReceptionistView.js';
import AdminView from './components/AdminView.js';
import InvoiceModal from './components/InvoiceModal.js';
import ChatBox from './components/ChatBox.js';
import { INITIAL_DATA } from './initialData.js';
import { db, auth } from './firebase.js';
import { signInAnonymously } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  runTransaction, 
  query, 
  orderBy,
  deleteField,
  updateDoc
} from 'firebase/firestore';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Active printable invoice
  const [activeInvoice, setActiveInvoice] = useState<{ booking: Booking; room: Room } | null>(null);

  // Authenticate anonymously on mount before starting synchronization
  useEffect(() => {
    const performAuth = async () => {
      try {
        await signInAnonymously(auth);
        setIsAuthenticated(true);
      } catch (err: any) {
        console.error('Anonymous auth failed:', err);
        setError(`Error al autenticar sesión: [${err.code || 'UNKNOWN'}] - ${err.message || err.toString()}`);
        setLoading(false);
      }
    };
    performAuth();
  }, []);

  // Sync database state from Cloud Firestore in real time once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubRooms: () => void;
    let unsubBookings: () => void;
    let unsubEmployees: () => void;
    let unsubSubcontractors: () => void;
    let unsubChats: () => void;

    const checkAndSeedDatabase = async () => {
      try {
        const roomsRef = collection(db, 'rooms');
        const roomsSnap = await getDocs(roomsRef);
        const needsImageMigration = !roomsSnap.empty && roomsSnap.docs.some(doc => {
          const img = doc.data().image || '';
          return img.includes('w=600') || img.includes('q=80');
        });

        if (roomsSnap.empty || needsImageMigration) {
          console.log('Seeding initial Borda Silente data to Firestore in background...');
          for (const r of INITIAL_DATA.rooms) {
            await setDoc(doc(db, 'rooms', r.id.toString()), r);
          }
          for (const b of INITIAL_DATA.bookings) {
            await setDoc(doc(db, 'bookings', b.id), b);
          }
          for (const emp of INITIAL_DATA.employees) {
            await setDoc(doc(db, 'employees', emp.id), emp);
          }
          for (const sub of INITIAL_DATA.subcontractors) {
            await setDoc(doc(db, 'subcontractors', sub.id), sub);
          }
          for (const chat of INITIAL_DATA.chats) {
            await setDoc(doc(db, 'chats', chat.id), chat);
          }
          console.log('Background database seeding/migration complete.');
        }
      } catch (err) {
        console.error('Background database check/seeding failed:', err);
      }
    };

    const setupSync = async () => {
      try {
        // 1. Check and seed/migrate Firestore in background without blocking setup
        checkAndSeedDatabase();

        // 2. Set up realtime listeners (onSnapshot resolves immediately from IndexedDB cache if available)
        unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
          const list = snapshot.docs.map(doc => doc.data() as Room);
          list.sort((a, b) => a.id - b.id);
          setRooms(list);
          setLoading(false); // Instantly clears loading layout when local cache yields data
        }, (err) => {
          console.error('Error syncing rooms:', err);
          setError('Fallo al sincronizar las habitaciones.');
        });

        unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
          const list = snapshot.docs.map(doc => doc.data() as Booking);
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBookings(list);
        }, (err) => {
          console.error('Error syncing bookings:', err);
          setError('Fallo al sincronizar las reservas.');
        });

        unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
          const list = snapshot.docs.map(doc => doc.data() as Employee);
          list.sort((a, b) => a.id.localeCompare(b.id));
          setEmployees(list);
        }, (err) => {
          console.error('Error syncing employees:', err);
          setError('Fallo al sincronizar los empleados.');
        });

        unsubSubcontractors = onSnapshot(collection(db, 'subcontractors'), (snapshot) => {
          const list = snapshot.docs.map(doc => doc.data() as Subcontractor);
          list.sort((a, b) => a.id.localeCompare(b.id));
          setSubcontractors(list);
        }, (err) => {
          console.error('Error syncing subcontractors:', err);
          setError('Fallo al sincronizar las subcontratas.');
        });

        unsubChats = onSnapshot(query(collection(db, 'chats'), orderBy('timestamp', 'asc')), (snapshot) => {
          const list = snapshot.docs.map(doc => doc.data() as ChatMessage);
          setChats(list);
        }, (err) => {
          console.error('Error syncing chats:', err);
          setError('Fallo al sincronizar el chat de atención.');
        });

      } catch (err: any) {
        console.error('Failed to initialize Firestore connection:', err);
        setError('Error de conexión con la base de datos Firestore.');
        setLoading(false);
      }
    };

    setupSync();

    return () => {
      if (unsubRooms) unsubRooms();
      if (unsubBookings) unsubBookings();
      if (unsubEmployees) unsubEmployees();
      if (unsubSubcontractors) unsubSubcontractors();
      if (unsubChats) unsubChats();
    };
  }, [isAuthenticated]);

  // Action: Add booking
  // Action: Add booking (with atomic Firestore runTransaction)
  const handleBook = async (bookingData: {
    guestName: string;
    guestEmail: string;
    roomId: number;
    checkIn: string;
    checkOut: string;
    platform: BookingPlatform;
  }) => {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const roomDocRef = doc(db, 'rooms', bookingData.roomId.toString());
        const roomSnap = await transaction.get(roomDocRef);
        if (!roomSnap.exists()) {
          throw new Error('La habitación especificada no existe.');
        }

        const room = roomSnap.data() as Room;

        const dateIn = new Date(bookingData.checkIn);
        const dateOut = new Date(bookingData.checkOut);
        const diffTime = Math.abs(dateOut.getTime() - dateIn.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const totalPrice = room.price * diffDays;

        const bookingId = `B-${Math.floor(1000 + Math.random() * 9000)}`;
        const invoiceNumber = `BS-2026-${Math.floor(10000 + Math.random() * 90000)}`;

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
          transaction.update(roomDocRef, { status: 'occupied' });
          room.status = 'occupied';
        }

        const bookingDocRef = doc(db, 'bookings', bookingId);
        transaction.set(bookingDocRef, newBooking);

        return { booking: newBooking, room };
      });

      setActiveInvoice({
        booking: result.booking,
        room: result.room
      });
    } catch (err: any) {
      console.error('Failed to create booking in transaction:', err);
      throw err;
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

    try {
      const msgId = `MSG-${Math.floor(1000 + Math.random() * 9000)}`;
      const newMessage: ChatMessage = {
        id: msgId,
        senderRole: currentRole,
        senderName,
        message: messageText,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'chats', msgId), newMessage);
    } catch (err) {
      console.error('Failed to send chat message:', err);
    }
  };

  // Action: Housekeeping status
  const handleUpdateRoomStatus = async (roomId: number, status: RoomStatus) => {
    try {
      const roomDocRef = doc(db, 'rooms', roomId.toString());
      await updateDoc(roomDocRef, { status });
    } catch (err) {
      console.error('Failed to update room status:', err);
    }
  };

  // Action: Clock-in employee
  const handleClockEmployee = async (employeeId: string, action: 'in' | 'out') => {
    try {
      const empDocRef = doc(db, 'employees', employeeId);
      if (action === 'in') {
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        await updateDoc(empDocRef, {
          status: 'present',
          todayClockIn: hhmm,
          todayClockOut: deleteField()
        });
      } else {
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        await updateDoc(empDocRef, {
          status: 'absent',
          todayClockOut: hhmm
        });
      }
    } catch (err) {
      console.error('Failed to clock employee:', err);
    }
  };

  // Action: Log leave (vacations/sick)
  const handleLogLeave = async (employeeId: string, leaveType: 'vacation' | 'sick', days: number) => {
    try {
      const empDocRef = doc(db, 'employees', employeeId);
      await runTransaction(db, async (transaction) => {
        const empSnap = await transaction.get(empDocRef);
        if (!empSnap.exists()) return;
        const emp = empSnap.data() as Employee;
        if (leaveType === 'vacation') {
          transaction.update(empDocRef, {
            status: 'vacation',
            vacationsTaken: (emp.vacationsTaken || 0) + days
          });
        } else {
          transaction.update(empDocRef, {
            status: 'sick',
            sickLeaves: (emp.sickLeaves || 0) + 1
          });
        }
      });
    } catch (err) {
      console.error('Failed to log leave:', err);
    }
  };

  // Action: Add maintenance ticket
  const handleAddSubcontractorTicket = async (subcontractorId: string, title: string) => {
    try {
      const subDocRef = doc(db, 'subcontractors', subcontractorId);
      await runTransaction(db, async (transaction) => {
        const subSnap = await transaction.get(subDocRef);
        if (!subSnap.exists()) return;
        const sub = subSnap.data() as Subcontractor;
        const ticketId = `TKT-${Math.floor(100 + Math.random() * 900)}`;
        const newTicket = {
          id: ticketId,
          title,
          status: 'open' as const,
          date: new Date().toISOString().split('T')[0]
        };
        const updatedTickets = [...(sub.activeTickets || []), newTicket];
        transaction.update(subDocRef, {
          activeTickets: updatedTickets,
          status: 'pending-review'
        });
      });
    } catch (err) {
      console.error('Failed to add subcontractor ticket:', err);
    }
  };

  // Action: Resolve maintenance ticket
  const handleResolveSubcontractorTicket = async (subcontractorId: string, ticketId: string) => {
    try {
      const subDocRef = doc(db, 'subcontractors', subcontractorId);
      await runTransaction(db, async (transaction) => {
        const subSnap = await transaction.get(subDocRef);
        if (!subSnap.exists()) return;
        const sub = subSnap.data() as Subcontractor;
        const updatedTickets = (sub.activeTickets || []).map(t => {
          if (t.id === ticketId) {
            return { ...t, status: 'resolved' as const };
          }
          return t;
        });
        const hasOpen = updatedTickets.some(t => t.status === 'open');
        const nextStatus = hasOpen ? 'pending-review' : 'ok';
        transaction.update(subDocRef, {
          activeTickets: updatedTickets,
          status: nextStatus
        });
      });
    } catch (err) {
      console.error('Failed to resolve subcontractor ticket:', err);
    }
  };

  const handleOpenInvoiceModal = (booking: Booking, room: Room) => {
    setActiveInvoice({ booking, room });
  };


  return (
    <div className="min-h-screen bg-[#FDFCFB] wabi-paper text-[#2D2D2D] flex flex-col font-sans selection:bg-[#E5E1D8] selection:text-[#8C857B]">
      
      {/* 2. Top Navigation Bar (Sticky & Standard Compliant) */}
      {currentRole === 'consumer' ? (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 border-b border-[#E5E1D8] flex justify-between items-center bg-[#FDFCFB]/95 backdrop-blur-md print:hidden h-16">
          
          {/* Left Block: Brand Identity (Constrained width to balance layout) */}
          <div className="flex items-center gap-3 w-1/3 min-w-[200px]">
            <div className="w-9 h-9 border border-[#2C3627] flex items-center justify-center bg-transparent transition-all">
              <Compass className="w-5 h-5 text-[#2C3627]" />
            </div>
            <div>
              <span className="font-serif text-base font-bold tracking-wider uppercase text-[#2C3627] block leading-tight">Borda Silente</span>
              <span className="font-sans text-[9px] uppercase text-[#2C3627]/70 block tracking-[0.1em] mt-0.5 font-semibold leading-none">Refugio de Montaña</span>
            </div>
          </div>

          {/* Central Block: Navigation Links (Geometrically Centered via absolute positioning) */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 font-sans text-[13px] text-[#2C3627] font-semibold tracking-wide">
            <a href="#rooms-section" className="hover:text-[#E5B181] transition-colors">Habitaciones</a>
            <a href="#amenities-section" className="hover:text-[#E5B181] transition-colors">Servicios</a>
            <a href="#gastronomy-section" className="hover:text-[#E5B181] transition-colors">Gastronomía</a>
            <a href="#social-proof-section" className="hover:text-[#E5B181] transition-colors">Reseñas</a>
            <a href="#contact-section" className="hover:text-[#E5B181] transition-colors">Ubicación</a>
          </nav>

          {/* Right Block: Localization & CTA Button (Constrained width to align layouts) */}
          <div className="flex items-center justify-end gap-5 w-1/3 min-w-[200px]">
            <span className="hidden sm:inline font-sans text-xs text-[#2C3627]/75 hover:text-[#2C3627] cursor-pointer transition-colors font-bold tracking-wider">
              ES | EUR
            </span>
            <a 
              href="#booking-engine"
              onClick={(e) => {
                e.preventDefault();
                const engine = document.getElementById('booking-engine');
                if (engine) {
                  engine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Highlight feedback
                  engine.classList.add('ring-4', 'ring-[#E5B181]/65');
                  setTimeout(() => {
                    engine.classList.remove('ring-4', 'ring-[#E5B181]/65');
                  }, 1800);
                  // Focus the check-in input
                  const checkInInput = document.getElementById('search-check-in');
                  if (checkInInput) {
                    (checkInInput as HTMLInputElement).focus();
                  }
                }
              }}
              className="bg-[#2C3627] hover:bg-[#E5B181] hover:text-[#2D2D2D] text-white border border-[#2C3627] px-4.5 py-2 font-sans text-xs uppercase tracking-wider transition-all duration-300 font-bold rounded-md shadow-xs hover:shadow-md"
            >
              Reservar Ahora
            </a>
          </div>
        </header>
      ) : (
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
            {currentRole === 'receptionist' ? (
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
      )}

      {/* 3. Main Content Router */}
      <main className={`flex-1 w-full mx-auto ${currentRole === 'consumer' ? 'pt-16 pb-6' : 'p-4 md:p-6'}`}>
        {error ? (
          <div className="max-w-md mx-auto my-16 p-6 border border-[#F3D1D1] bg-[#F5F3EF] text-[#2D2D2D] rounded-xs space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Incidencia en la Sincronización</span>
            </div>
            <p className="text-xs leading-relaxed">{error}</p>
            <button 
              onClick={() => window.location.reload()}
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
                loading={loading}
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
                loading={loading}
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
                loading={loading}
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
      {currentRole === 'consumer' && !error && (
        <ChatBox 
          currentRole="consumer"
          currentUserName="Invitado Web"
          chatMessages={chats}
          onSendMessage={handleSendMessage}
          compact={true}
        />
      )}

      {/* 6. Standard Utility Footer with hidden Portal Staff switcher */}
      {currentRole === 'consumer' && (
        <footer id="contact-section" className="bg-[#1C2319] text-[#E5E1D8]/70 border-t border-[#E5E1D8]/10 py-16 px-6 sm:px-12 mt-20 print:hidden font-sans scroll-mt-28">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Column 1: Logo & Vision */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 border border-white/20 flex items-center justify-center bg-transparent">
                  <Compass className="w-4.5 h-4.5 text-[#E5B181]" />
                </div>
                <div>
                  <span className="font-serif text-base font-semibold tracking-widest uppercase block">Borda Silente</span>
                  <span className="font-mono text-[7px] uppercase text-[#E5B181] block tracking-[0.2em] mt-0.5">Refugio de Montaña</span>
                </div>
              </div>
              <p className="text-[11px] font-light leading-relaxed max-w-sm">
                Un santuario de desconexión y silencio en el corazón del Pirineo de Huesca. La arquitectura tradicional fusionada con el descanso elemental de montaña.
              </p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#E5B181] font-semibold">Explorar</h4>
              <ul className="text-[11px] space-y-2 font-light">
                <li><a href="#rooms-section" className="hover:text-white transition-colors">Habitaciones & Suites</a></li>
                <li><a href="#amenities-section" className="hover:text-white transition-colors">Instalaciones & Servicios</a></li>
                <li><a href="#gastronomy-section" className="hover:text-white transition-colors">La Cocina de Brasa</a></li>
              </ul>
            </div>

            {/* Column 3: Contact Direct Details */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#E5B181] font-semibold">Contacto Directo</h4>
              <ul className="text-[11px] space-y-2 font-mono text-[10px]">
                <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#E5B181]" /> +34 974 330 112</li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#E5B181] shrink-0 mt-0.5" /> 
                  <span className="font-sans font-light leading-snug">Camino de las Borda s/n, 22728 Valle de Ansó, Huesca, España</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Map & Legal */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#E5B181] font-semibold">Legal & Reservas</h4>
              <ul className="text-[11px] space-y-2 font-light">
                <li><a href="https://maps.google.com/?q=Valle+de+Anso+Huesca+Spain" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline flex items-center gap-1.5"><Map className="w-3.5 h-3.5" /> Ver Ruta en Google Maps</a></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Política de Cancelación (Flexible 48h)</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Aviso Legal y Privacidad</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="max-w-7xl mx-auto border-t border-[#E5E1D8]/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono tracking-wider">
            <span>Borda Silente S.A. © 2026. Todos los derechos reservados.</span>
            
            {/* The hidden staff switch portal button */}
            <button 
              onClick={() => {
                const roles: SenderRole[] = ['consumer', 'receptionist', 'admin'];
                const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
                setCurrentRole(nextRole);
              }}
              className="text-[#E5B181]/70 hover:text-[#E5B181] underline transition-colors cursor-pointer uppercase flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-sm hover:bg-white/10"
            >
              <KeyRound className="w-3 h-3 text-[#E5B181]" />
              Acceso Staff ({currentRole === 'consumer' ? 'Huésped' : currentRole === 'receptionist' ? 'Recepción' : 'Director'})
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
