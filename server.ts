/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Room, Booking, Employee, Subcontractor, ChatMessage, HotelData } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_FILE = path.join(process.cwd(), 'db_store.json');

// Default initial data for Borda Silente (Huesca Pyrenees)
const INITIAL_DATA: HotelData = {
  rooms: [
    {
      id: 101,
      number: '101',
      name: 'Estancia Borda Clásica',
      type: 'standard',
      capacity: 2,
      price: 175,
      status: 'available',
      features: ['Paredes de piedra natural', 'Vigas de abeto visto', 'Ropa de lino orgánico', 'Vistas al valle de Ansó'],
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 102,
      number: '102',
      name: 'Habitación Valle de Arán',
      type: 'standard',
      capacity: 2,
      price: 190,
      status: 'occupied',
      features: ['Aroma a madera de pino', 'Mobiliario de roble artesanal', 'Chimenea de piedra', 'Terraza privada'],
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 103,
      number: '103',
      name: 'Doble Refugio Bosque',
      type: 'standard',
      capacity: 2,
      price: 185,
      status: 'cleaning',
      features: ['Revestimiento de cedro silvestre', 'Ventanal panorámico al pinar', 'Ducha de lluvia', 'Suplemento de té local'],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 201,
      number: '201',
      name: 'Estudio Ordesa con Bañera de Cedro',
      type: 'suite',
      capacity: 3,
      price: 265,
      status: 'available',
      features: ['Bañera de madera de cedro natural', 'Rincón de tatami', 'Estufa de pellets ecológica', 'Vistas directas a Monte Perdido'],
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 202,
      number: '202',
      name: 'Loft Ático Monte Perdido',
      type: 'suite',
      capacity: 3,
      price: 295,
      status: 'available',
      features: ['Techo acristalado para ver estrellas', 'Chimenea suspendida de hierro', 'Cafetera artesanal', 'Balcón volado'],
      image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 301,
      number: '301',
      name: 'Cabaña Silente Exclusiva',
      type: 'cabin',
      capacity: 4,
      price: 450,
      status: 'maintenance',
      features: ['Estructura independiente de madera negra', 'Bañera termal de piedra exterior', 'Cocina rústica', 'Aislamiento acústico completo'],
      image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=600&q=80'
    }
  ],
  bookings: [
    {
      id: 'B-7821',
      guestName: 'Alejandro Sanz Ruiz',
      guestEmail: 'alejandro.sanz@gmail.com',
      roomId: 102,
      checkIn: '2026-07-13',
      checkOut: '2026-07-16',
      totalPrice: 570,
      platform: 'booking',
      status: 'active',
      createdAt: '2026-06-12T14:32:00Z',
      invoiceNumber: 'BS-2026-0211'
    },
    {
      id: 'B-3490',
      guestName: 'Mireia Vila Pont',
      guestEmail: 'mireia.vp@icloud.com',
      roomId: 202,
      checkIn: '2026-07-18',
      checkOut: '2026-07-21',
      totalPrice: 885,
      platform: 'web',
      status: 'confirmed',
      createdAt: '2026-07-02T09:15:00Z',
      invoiceNumber: 'BS-2026-0212'
    },
    {
      id: 'B-1049',
      guestName: 'David Martínez Flores',
      guestEmail: 'david.mtnez@outlook.es',
      roomId: 103,
      checkIn: '2026-07-10',
      checkOut: '2026-07-14',
      totalPrice: 740,
      platform: 'expedia',
      status: 'checked-out',
      createdAt: '2026-06-25T18:40:00Z',
      invoiceNumber: 'BS-2026-0210'
    }
  ],
  employees: [
    {
      id: 'EMP-01',
      name: 'Marta Aznárez Larrosa',
      role: 'reception',
      dni: '18067445R',
      contractType: 'Indefinido - Tiempo Completo',
      startDate: '2021-04-10',
      vacationsTaken: 12,
      vacationsTotal: 30,
      status: 'present',
      sickLeaves: 0,
      tenure: '5 años y 3 meses',
      hourlySchedule: 'Turno de Mañana (07:00 - 15:00)',
      todayClockIn: '07:02'
    },
    {
      id: 'EMP-02',
      name: 'Javier Bielsa Santolaria',
      role: 'maintenance',
      dni: '17855321K',
      contractType: 'Indefinido - Tiempo Completo',
      startDate: '2022-11-15',
      vacationsTaken: 8,
      vacationsTotal: 30,
      status: 'present',
      sickLeaves: 1,
      tenure: '3 años y 8 meses',
      hourlySchedule: 'Flexible / Guardias',
      todayClockIn: '08:15'
    },
    {
      id: 'EMP-03',
      name: 'Sonia Garuz Lanau',
      role: 'cleaning',
      dni: '18099387H',
      contractType: 'Fijo Discontinuo (Temporada de Montaña)',
      startDate: '2023-06-01',
      vacationsTaken: 15,
      vacationsTotal: 22,
      status: 'present',
      sickLeaves: 0,
      tenure: '3 años y 1 mes',
      hourlySchedule: 'Turno Continuo (09:00 - 16:00)',
      todayClockIn: '09:00'
    },
    {
      id: 'EMP-04',
      name: 'Liam Larrosa Berroy',
      role: 'chef',
      dni: '73244856E',
      contractType: 'Indefinido - Tiempo Completo',
      startDate: '2024-01-10',
      vacationsTaken: 5,
      vacationsTotal: 30,
      status: 'absent',
      sickLeaves: 0,
      tenure: '2 años y 6 meses',
      hourlySchedule: 'Turno de Tarde/Cena (13:30 - 21:30)'
    },
    {
      id: 'EMP-05',
      name: 'Maite Ordás Broto',
      role: 'spa',
      dni: '18122340M',
      contractType: 'Temporal de Verano',
      startDate: '2025-06-15',
      vacationsTaken: 4,
      vacationsTotal: 10,
      status: 'vacation',
      sickLeaves: 0,
      tenure: '1 año y 1 mes',
      hourlySchedule: 'Turno de Tarde (15:00 - 22:00)'
    }
  ],
  subcontractors: [
    {
      id: 'SUB-01',
      company: 'Pirineo H2O S.L.',
      service: 'water',
      contact: 'Santi Goñi (+34 974 40 12 88)',
      lastReview: '2026-05-12',
      nextReview: '2026-11-12',
      activeTickets: [
        { id: 'TKT-101', title: 'Ajuste de presión de filtros de ósmosis del spa', status: 'resolved', date: '2026-07-05' }
      ],
      status: 'ok'
    },
    {
      id: 'SUB-02',
      company: 'Calefacción Alto Aragón',
      service: 'heating',
      contact: 'Taller Sabiñánigo (+34 974 48 20 44)',
      lastReview: '2026-06-20',
      nextReview: '2026-12-20',
      activeTickets: [],
      status: 'ok'
    },
    {
      id: 'SUB-03',
      company: 'Ascensores Huesca S.A.',
      service: 'elevator',
      contact: 'Asistencia 24h (+34 900 10 20 30)',
      lastReview: '2025-10-15',
      nextReview: '2026-10-15',
      activeTickets: [
        { id: 'TKT-102', title: 'Lubricación de amortiguador hidráulico de polea', status: 'resolved', date: '2026-06-10' }
      ],
      status: 'ok'
    },
    {
      id: 'SUB-04',
      company: 'Mantenimiento Termal Pirineos',
      service: 'spa',
      contact: 'Raúl Broto (+34 609 88 11 22)',
      lastReview: '2026-07-10',
      nextReview: '2026-08-10',
      activeTickets: [
        { id: 'TKT-105', title: 'Inspección periódica del vaso exterior de piedra de la Cabaña 301', status: 'open', date: '2026-07-14' }
      ],
      status: 'pending-review'
    }
  ],
  chats: [
    {
      id: 'MSG-001',
      senderRole: 'consumer',
      senderName: 'David Martínez Flores',
      message: 'Buenas tardes, querría saber si el baño de la habitación 103 tiene secador de pelo potente.',
      timestamp: '2026-07-12T16:05:00Z'
    },
    {
      id: 'MSG-002',
      senderRole: 'receptionist',
      senderName: 'Marta Aznárez Larrosa',
      message: 'Hola David, sí, todas nuestras estancias cuentan con secadores de pelo de gama profesional (iónicos, 2200W). ¡Te esperamos!',
      timestamp: '2026-07-12T16:10:00Z'
    },
    {
      id: 'MSG-003',
      senderRole: 'consumer',
      senderName: 'Invitado Web',
      message: 'Hola, ¿las cabañas cuentan con estufa de leña privada?',
      timestamp: '2026-07-14T15:20:00Z'
    },
    {
      id: 'MSG-004',
      senderRole: 'receptionist',
      senderName: 'Marta Aznárez Larrosa',
      message: '¡Buenas tardes! Sí, la Cabaña Silente Exclusiva (301) dispone de estufa de leña tradicional y os dejamos una cesta de troncos de abedul de cortesía cada día.',
      timestamp: '2026-07-14T15:25:00Z'
    }
  ]
};

// Helper to load data from JSON
function loadData(): HotelData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading DB, using initial seeds', err);
  }
  // If not exists or error, write seeds
  saveData(INITIAL_DATA);
  return INITIAL_DATA;
}

// Helper to save data to JSON
function saveData(data: HotelData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file', err);
  }
}

// REST APIs
app.get('/api/hotel/data', (req, res) => {
  const data = loadData();
  res.json(data);
});

// Book a room (triggers automatic invoice, updates room status)
app.post('/api/hotel/book', (req, res) => {
  const data = loadData();
  const { guestName, guestEmail, roomId, checkIn, checkOut, platform } = req.body;

  if (!guestName || !guestEmail || !roomId || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para completar la reserva.' });
  }

  const room = data.rooms.find(r => r.id === parseInt(roomId));
  if (!room) {
    return res.status(404).json({ error: 'La habitación especificada no existe.' });
  }

  // Calculate days
  const dateIn = new Date(checkIn);
  const dateOut = new Date(checkOut);
  const diffTime = Math.abs(dateOut.getTime() - dateIn.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  const totalPrice = room.price * diffDays;

  // Generate unique IDs
  const bookingId = `B-${Math.floor(1000 + Math.random() * 9000)}`;
  const invoiceIndex = data.bookings.length + 213; // sequential elegant invoice numbers
  const invoiceNumber = `BS-2026-0${invoiceIndex}`;

  const newBooking: Booking = {
    id: bookingId,
    guestName,
    guestEmail,
    roomId: room.id,
    checkIn,
    checkOut,
    totalPrice,
    platform: platform || 'web',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    invoiceNumber
  };

  // If check-in is today (2026-07-14), mark room as occupied immediately
  const todayStr = '2026-07-14';
  if (checkIn <= todayStr && checkOut >= todayStr) {
    room.status = 'occupied';
  }

  data.bookings.push(newBooking);
  saveData(data);

  res.status(201).json({
    message: 'Reserva creada con éxito e informe de facturación generado.',
    booking: newBooking,
    room
  });
});

// Change room housekeeping/maintenance status
app.put('/api/hotel/rooms/:id/status', (req, res) => {
  const data = loadData();
  const roomId = parseInt(req.params.id);
  const { status } = req.body;

  const room = data.rooms.find(r => r.id === roomId);
  if (!room) {
    return res.status(404).json({ error: 'Habitación no encontrada' });
  }

  room.status = status;
  saveData(data);
  res.json({ message: 'Estado de la habitación actualizado.', room });
});

// Chat message post
app.post('/api/hotel/chat', (req, res) => {
  const data = loadData();
  const { senderRole, senderName, message } = req.body;

  if (!senderRole || !senderName || !message) {
    return res.status(400).json({ error: 'Datos de mensaje incompletos.' });
  }

  const newMessage: ChatMessage = {
    id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
    senderRole,
    senderName,
    message,
    timestamp: new Date().toISOString()
  };

  data.chats.push(newMessage);
  saveData(data);
  res.status(201).json(newMessage);
});

// Employee clock in/out
app.post('/api/hotel/employees/clock', (req, res) => {
  const data = loadData();
  const { employeeId, action } = req.body; // action: 'in' | 'out'

  const employee = data.employees.find(e => e.id === employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Empleado no encontrado' });
  }

  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (action === 'in') {
    employee.status = 'present';
    employee.todayClockIn = hhmm;
    employee.todayClockOut = undefined;
  } else {
    employee.status = 'absent';
    employee.todayClockOut = hhmm;
  }

  saveData(data);
  res.json({ message: `Fichaje de ${action === 'in' ? 'entrada' : 'salida'} registrado.`, employee });
});

// Add vacation or sick leave
app.post('/api/hotel/employees/leave', (req, res) => {
  const data = loadData();
  const { employeeId, leaveType, days } = req.body; // leaveType: 'vacation' | 'sick'

  const employee = data.employees.find(e => e.id === employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Empleado no encontrado' });
  }

  if (leaveType === 'vacation') {
    employee.status = 'vacation';
    employee.vacationsTaken += parseInt(days || 1);
  } else if (leaveType === 'sick') {
    employee.status = 'sick';
    employee.sickLeaves += parseInt(days || 1);
  }

  saveData(data);
  res.json({ message: 'Ausencia o descanso registrado en la ficha laboral.', employee });
});

// File subcontractor maintenance ticket
app.post('/api/hotel/subcontractors/ticket', (req, res) => {
  const data = loadData();
  const { subcontractorId, title } = req.body;

  const sub = data.subcontractors.find(s => s.id === subcontractorId);
  if (!sub) {
    return res.status(404).json({ error: 'Subcontratista no registrado' });
  }

  const newTicket = {
    id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
    title,
    status: 'open' as const,
    date: new Date().toISOString().split('T')[0]
  };

  sub.activeTickets.push(newTicket);
  sub.status = 'alert'; // triggers alert status due to open tickets
  saveData(data);

  res.status(201).json({ message: 'Ticket de incidencia enviado.', subcontractor: sub });
});

// Resolve a maintenance ticket
app.post('/api/hotel/subcontractors/resolve', (req, res) => {
  const data = loadData();
  const { subcontractorId, ticketId } = req.body;

  const sub = data.subcontractors.find(s => s.id === subcontractorId);
  if (!sub) {
    return res.status(404).json({ error: 'Subcontratista no registrado' });
  }

  const ticket = sub.activeTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket de incidencia no encontrado.' });
  }

  ticket.status = 'resolved';
  
  // If no open tickets left, status is ok
  const openTickets = sub.activeTickets.filter(t => t.status === 'open');
  if (openTickets.length === 0) {
    sub.status = 'ok';
    sub.lastReview = new Date().toISOString().split('T')[0];
    // Push next review 6 months in future
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    sub.nextReview = d.toISOString().split('T')[0];
  }

  saveData(data);
  res.json({ message: 'Incidencia marcada como resuelta e informe de mantenimiento actualizado.', subcontractor: sub });
});

// Simulated Energy Stats Feed
app.get('/api/hotel/energy', (req, res) => {
  // Returns immediate reading with tiny random fluctuations around typical values
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // Daytime produces solar, night time draws more grid
  const hours = now.getHours();
  const isDay = hours >= 7 && hours <= 20;
  const solarGen = isDay ? (12.4 + Math.sin((hours - 7) * Math.PI / 13) * 15 + (Math.random() - 0.5) * 2) : 0;
  const gridDraw = Math.max(1.5, 18.5 - solarGen + (Math.random() - 0.5) * 3);
  
  const biomassTemp = 72.4 + (Math.random() - 0.5) * 1.5;
  const waterFlow = Math.max(0, 8.2 + (Math.random() - 0.5) * 4); // active tap usage

  res.json({
    timestamp: hhmm,
    gridPowerkW: parseFloat(gridDraw.toFixed(1)),
    solarPowerkW: parseFloat(solarGen.toFixed(1)),
    biomassTempC: parseFloat(biomassTemp.toFixed(1)),
    waterFlowLpm: parseFloat(waterFlow.toFixed(1))
  });
});

// Vite middleware integration or production static assets serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Borda Silente backend listening on port ${PORT}`);
  });
}

startServer();
