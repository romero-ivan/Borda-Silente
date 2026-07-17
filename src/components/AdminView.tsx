/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Activity, ShieldAlert, Users, 
  Settings, Clock, Sparkles, Building2, Hammer, 
  Camera, Zap, Calendar, HeartPulse, FileSpreadsheet, Eye, Play, AlertCircle
} from 'lucide-react';
import { Room, Booking, Employee, Subcontractor, EnergyStats } from '../types.js';

interface AdminViewProps {
  rooms: Room[];
  bookings: Booking[];
  employees: Employee[];
  subcontractors: Subcontractor[];
  onClockEmployee: (employeeId: string, action: 'in' | 'out') => Promise<void>;
  onLogLeave: (employeeId: string, leaveType: 'vacation' | 'sick', days: number) => Promise<void>;
  onAddSubcontractorTicket: (subcontractorId: string, title: string) => Promise<void>;
  onResolveSubcontractorTicket: (subcontractorId: string, ticketId: string) => Promise<void>;
  loading?: boolean;
}

export default function AdminView({
  rooms,
  bookings,
  employees,
  subcontractors,
  onClockEmployee,
  onLogLeave,
  onAddSubcontractorTicket,
  onResolveSubcontractorTicket,
  loading
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'kpis' | 'cameras' | 'employees' | 'subcontractors'>('kpis');

  const isFirstRender = useRef(true);

  // Auto-scroll to content area on mobile when activeTab changes (skips initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (window.innerWidth < 1024) {
      const element = document.getElementById('admin-content-area');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [activeTab]);

  // Live Energy telemetry state
  const [energy, setEnergy] = useState<EnergyStats>({
    timestamp: '16:00',
    gridPowerkW: 4.8,
    solarPowerkW: 12.2,
    biomassTempC: 73.1,
    waterFlowLpm: 6.4
  });

  // Ticket creation states
  const [ticketTitles, setTicketTitles] = useState<Record<string, string>>({});
  
  // Custom camera timeline
  const [camTime, setCamTime] = useState('');

  // Fetch live energy stats
  useEffect(() => {
    const fetchEnergy = async () => {
      let fetched = false;
      try {
        const res = await fetch('/api/hotel/energy');
        if (res.ok) {
          const data = await res.json();
          setEnergy(data);
          fetched = true;
        }
      } catch (err) {
        // Fallback to local simulation
      }

      if (!fetched) {
        setEnergy(prev => {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          // Solar fluctuates naturally during day/night cycles
          const hour = now.getHours();
          const baseSolar = (hour > 6 && hour < 20) ? Math.sin((hour - 6) / 14 * Math.PI) * 15 : 0;
          const solarChange = (Math.random() - 0.5) * 0.5;
          const nextSolar = Math.max(0, parseFloat((baseSolar + solarChange).toFixed(1)));
          
          // Refugio total load is roughly 15-18 kW. Grid handles what solar doesn't cover.
          const load = 16.2 + (Math.random() - 0.5) * 1.2;
          const nextGrid = Math.max(0.5, parseFloat((load - nextSolar).toFixed(1)));
          
          // Biomass water temperature fluctuates slightly around 74 degrees C
          const nextBiomass = parseFloat((prev.biomassTempC + (Math.random() - 0.5) * 0.4).toFixed(1));
          
          // Spring water flow fluctuates slightly around 6.5 L/min
          const nextWater = parseFloat(Math.max(4.0, prev.waterFlowLpm + (Math.random() - 0.5) * 0.2).toFixed(1));
          
          return {
            timestamp: timeStr,
            gridPowerkW: nextGrid,
            solarPowerkW: nextSolar,
            biomassTempC: nextBiomass,
            waterFlowLpm: nextWater
          };
        });
      }
    };

    fetchEnergy();
    const interval = setInterval(fetchEnergy, 3000);
    return () => clearInterval(interval);
  }, []);

  // Live Cam Date Timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCamTime(now.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Administrative Calculations
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalBookingsCount = bookings.length;
  const occupiedRoomsCount = rooms.filter(r => r.status === 'occupied').length;
  const occupancyPercentage = Math.round((occupiedRoomsCount / rooms.length) * 100);
  const activeStaffCount = employees.filter(e => e.status === 'present').length;

  const handleCreateTicket = async (subId: string) => {
    const title = ticketTitles[subId];
    if (!title || !title.trim()) return;

    try {
      await onAddSubcontractorTicket(subId, title.trim());
      setTicketTitles(prev => ({ ...prev, [subId]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
      
      {/* Side Menu Tab Panel */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-[#FDFCFB] border border-[#E5E1D8] p-5 rounded-xs space-y-4">
          <div className="space-y-1">
            <h2 className="font-serif text-lg font-medium text-[#2D2D2D]">Consola de Dirección</h2>
            <p className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider">Supervisión y Recursos</p>
          </div>

          <div className="flex flex-col gap-1.5 font-mono text-xs">
            <button 
              onClick={() => setActiveTab('kpis')}
              className={`flex items-center gap-2.5 px-3.5 py-3 border-l-2 text-left transition-all duration-300 cursor-pointer ${
                activeTab === 'kpis' 
                  ? 'bg-[#2C3627]/5 text-[#2C3627] border-[#2C3627] font-semibold' 
                  : 'text-[#8C857B] border-transparent hover:bg-[#F5F3EF]/60 hover:text-[#2D2D2D]'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              Rendimiento e Ingresos
            </button>
            <button 
              onClick={() => setActiveTab('cameras')}
              className={`flex items-center gap-2.5 px-3.5 py-3 border-l-2 text-left transition-all duration-300 cursor-pointer ${
                activeTab === 'cameras' 
                  ? 'bg-[#2C3627]/5 text-[#2C3627] border-[#2C3627] font-semibold' 
                  : 'text-[#8C857B] border-transparent hover:bg-[#F5F3EF]/60 hover:text-[#2D2D2D]'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              Cámaras de Seguridad (4)
            </button>
            <button 
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2.5 px-3.5 py-3 border-l-2 text-left transition-all duration-300 cursor-pointer ${
                activeTab === 'employees' 
                  ? 'bg-[#2C3627]/5 text-[#2C3627] border-[#2C3627] font-semibold' 
                  : 'text-[#8C857B] border-transparent hover:bg-[#F5F3EF]/60 hover:text-[#2D2D2D]'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              Fichas de Empleados
            </button>
            <button 
              onClick={() => setActiveTab('subcontractors')}
              className={`flex items-center gap-2.5 px-3.5 py-3 border-l-2 text-left transition-all duration-300 cursor-pointer ${
                activeTab === 'subcontractors' 
                  ? 'bg-[#2C3627]/5 text-[#2C3627] border-[#2C3627] font-semibold' 
                  : 'text-[#8C857B] border-transparent hover:bg-[#F5F3EF]/60 hover:text-[#2D2D2D]'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              Contratos y Mantenimiento
            </button>
          </div>
        </div>

        {/* Dynamic Energy Mini Widget (Ecotrendy) */}
        <div className="bg-[#F5F3EF] border border-[#D1CDC3] p-5 space-y-4 rounded-xs text-xs">
          <div className="flex justify-between items-center border-b border-[#D1CDC3] pb-2">
            <span className="font-serif font-medium text-[#2C3627] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#8C857B]" /> Microred Eco-Borda
            </span>
            <span className="font-mono text-[9px] text-[#2C3627] animate-pulse uppercase">Activo</span>
          </div>
          
          <div className="space-y-3 font-mono text-[11px] text-[#8C857B]">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Generación Solar:</span>
                <span className="text-[#2C3627] font-bold">{energy.solarPowerkW} kW</span>
              </div>
              <div className="w-full bg-[#E5E1D8] h-1 rounded-full overflow-hidden">
                <div className="bg-[#2C3627] h-full" style={{ width: `${Math.min(100, (energy.solarPowerkW / 25) * 100)}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Importación Red:</span>
                <span className="text-[#8C857B] font-bold">{energy.gridPowerkW} kW</span>
              </div>
              <div className="w-full bg-[#E5E1D8] h-1 rounded-full overflow-hidden">
                <div className="bg-[#8C857B] h-full" style={{ width: `${Math.min(100, (energy.gridPowerkW / 25) * 100)}%` }} />
              </div>
            </div>
            <div className="flex justify-between border-t border-[#D1CDC3] pt-2 text-[10px]">
              <span>Caldera Biomasa:</span>
              <span className="text-[#2D2D2D] font-bold">{energy.biomassTempC}°C</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Flujo de Agua Manantial:</span>
              <span className="text-[#2D2D2D] font-bold">{energy.waterFlowLpm} L/min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel Content Container */}
      <div id="admin-content-area" className="lg:col-span-9 bg-[#FDFCFB] border border-[#E5E1D8] p-6 rounded-xs">
        
        {/* TAB 1: FINANCIALS & PERFORMANCE */}
        {activeTab === 'kpis' && (
          <div className="space-y-8">
            <div className="border-b border-[#E5E1D8] pb-4">
              <h3 className="font-serif text-lg text-[#2D2D2D] font-medium">Informe Financiero y Operativo</h3>
              <p className="text-xs text-[#8C857B]">Métricas de rendimiento acumuladas del refugio Borda Silente</p>
            </div>

            {/* Metric Blocks */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="border border-[#E5E1D8] p-5 bg-[#FDFCFB] shadow-3xs relative overflow-hidden group hover:border-[#2C3627] transition-all duration-300 rounded-lg">
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#8C857B] block">Ingresos Totales</span>
                <p className="font-serif text-3xl font-light text-[#2C3627] mt-2 group-hover:scale-102 transition-transform duration-300 origin-left">{totalRevenue.toFixed(2)}€</p>
                <span className="text-[9px] text-[#8C857B] font-mono mt-2 block border-t border-[#F5F3EF] pt-2">100% de ocupación web</span>
              </div>
              <div className="border border-[#E5E1D8] p-5 bg-[#FDFCFB] shadow-3xs relative overflow-hidden group hover:border-[#2C3627] transition-all duration-300 rounded-lg">
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#8C857B] block">Ocupación Hoy</span>
                <p className="font-serif text-3xl font-light text-[#2C3627] mt-2 group-hover:scale-102 transition-transform duration-300 origin-left">{occupancyPercentage}%</p>
                <span className="text-[9px] text-[#8C857B] font-mono mt-2 block border-t border-[#F5F3EF] pt-2">{occupiedRoomsCount} de {rooms.length} habitadas</span>
              </div>
              <div className="border border-[#E5E1D8] p-5 bg-[#FDFCFB] shadow-3xs relative overflow-hidden group hover:border-[#2C3627] transition-all duration-300 rounded-lg">
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#8C857B] block">Reservas Totales</span>
                <p className="font-serif text-3xl font-light text-[#2C3627] mt-2 group-hover:scale-102 transition-transform duration-300 origin-left">{totalBookingsCount}</p>
                <span className="text-[9px] text-[#8C857B] font-mono mt-2 block border-t border-[#F5F3EF] pt-2">Ventas directas y agencias</span>
              </div>
              <div className="border border-[#E5E1D8] p-5 bg-[#FDFCFB] shadow-3xs relative overflow-hidden group hover:border-[#2C3627] transition-all duration-300 rounded-lg">
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#8C857B] block">Personal Hoy</span>
                <p className="font-serif text-3xl font-light text-[#2C3627] mt-2 group-hover:scale-102 transition-transform duration-300 origin-left">{activeStaffCount}</p>
                <span className="text-[9px] text-[#2C3627] font-mono mt-2 block border-t border-[#F5F3EF] pt-2">Fichados en recepción</span>
              </div>
            </div>

            {/* Customized SVG bar chart - Minimalist and incredibly responsive */}
            <div className="border border-[#E5E1D8] p-6 rounded-xs bg-[#FDFCFB] space-y-4">
              <div className="space-y-1">
                <h4 className="font-serif text-sm font-medium text-[#2D2D2D]">Rendimiento por Tipología de Habitación</h4>
                <p className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider">Distribución de Ingresos en Euros</p>
              </div>

              {/* Pure SVG Custom Bar Graph */}
              <div className="pt-4 h-60 w-full flex items-end justify-around border-b border-l border-[#E5E1D8] px-4 pb-2">
                {/* Standard */}
                <div className="flex flex-col items-center w-20 group">
                  <span className="font-mono text-[10px] text-[#8C857B] opacity-0 group-hover:opacity-100 transition-opacity mb-1">1,495€</span>
                  <div className="w-12 bg-[#F5F3EF] border border-[#D1CDC3] group-hover:bg-[#E5E1D8] transition-colors rounded-t-xs" style={{ height: '70px' }} />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#2D2D2D] mt-2 text-center">Clásica</span>
                </div>
                {/* Suites */}
                <div className="flex flex-col items-center w-20 group">
                  <span className="font-mono text-[10px] text-[#8C857B] font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1">1,625€</span>
                  <div className="w-12 bg-[#8C857B] group-hover:bg-[#8C857B]/80 transition-colors rounded-t-xs" style={{ height: '110px' }} />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#2D2D2D] mt-2 text-center">Suite</span>
                </div>
                {/* Cabins */}
                <div className="flex flex-col items-center w-20 group">
                  <span className="font-mono text-[10px] text-[#2C3627] font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1">2,250€</span>
                  <div className="w-12 bg-[#2C3627] group-hover:bg-[#2C3627]/80 transition-colors rounded-t-xs" style={{ height: '160px' }} />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#2D2D2D] mt-2 text-center">Cabaña</span>
                </div>
              </div>
              <div className="flex justify-center gap-6 text-[10px] font-mono text-[#8C857B] pt-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#F5F3EF] border border-[#D1CDC3] inline-block" /> Estancia Clásica</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#8C857B] inline-block" /> Estilo Suite</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#2C3627] inline-block" /> Cabaña Silente</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY CAMERAS */}
        {activeTab === 'cameras' && (
          <div className="space-y-6">
            <div className="border-b border-[#E5E1D8] pb-4 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-serif text-lg text-[#2D2D2D] font-medium">Circuito Cerrado de Vigilancia (CCTV)</h3>
                <p className="text-xs text-[#8C857B]">Simulador visual de cámaras perimetrales e interiores del refugio</p>
              </div>
              <span className="font-mono text-[10px] text-[#8C857B] bg-[#F5F3EF] border border-[#D1CDC3] px-2 py-1 rounded-xs">
                {camTime || 'REC'}
              </span>
            </div>

            {/* 4-Camera Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CAM 1: Lobby */}
              <div className="border border-[#2D2D2D] bg-[#1A1A1A] p-2 rounded-xs relative group overflow-hidden">
                <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center cctv-scanlines">
                  {/* Fireplace CSS Loop simulation */}
                  <div className="absolute inset-0 bg-radial-gradient from-[#8C857B]/20 to-transparent animate-pulse" />
                  <div className="w-20 h-20 bg-gradient-to-t from-orange-600/30 to-transparent blur-xl rounded-full absolute bottom-4 animate-bounce" />
                  <div className="text-center space-y-2 z-10 text-white opacity-40">
                    <p className="font-mono text-[10px]">CÁMARA 01 · SALÓN CHIMENEA</p>
                    <div className="record-dot mx-auto" />
                  </div>
                </div>
                <div className="absolute top-4 left-4 font-mono text-[9px] text-[#E5B181] uppercase bg-black/70 px-1.5 py-0.5 rounded-xs tracking-wider">
                  ● CAM_01_LOBBY
                </div>
                <div className="absolute bottom-4 right-4 font-mono text-[9px] text-white/60 bg-black/50 px-1">
                  1080p · {camTime}
                </div>
              </div>

              {/* CAM 2: Path */}
              <div className="border border-[#2D2D2D] bg-[#1A1A1A] p-2 rounded-xs relative group overflow-hidden">
                <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center cctv-scanlines">
                  <div className="absolute inset-0 bg-radial-gradient from-teal-900/10 to-transparent" />
                  {/* Misty CSS wind sway effect */}
                  <div className="absolute inset-0 bg-[#2C3627]/5 blur-md animate-pulse" />
                  <div className="text-center space-y-2 z-10 text-white opacity-40">
                    <p className="font-mono text-[10px]">CÁMARA 02 · ENTRADA PINAR</p>
                    <div className="record-dot mx-auto" />
                  </div>
                </div>
                <div className="absolute top-4 left-4 font-mono text-[9px] text-red-500 uppercase bg-black/70 px-1.5 py-0.5 rounded-xs tracking-wider">
                  ● CAM_02_ACCESO
                </div>
                <div className="absolute bottom-4 right-4 font-mono text-[9px] text-white/60 bg-black/50 px-1">
                  1080p · {camTime}
                </div>
              </div>

              {/* CAM 3: Thermal Pool */}
              <div className="border border-[#2D2D2D] bg-[#1A1A1A] p-2 rounded-xs relative group overflow-hidden">
                <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center cctv-scanlines">
                  <div className="absolute inset-0 bg-radial-gradient from-blue-900/10 to-transparent" />
                  {/* Ripples simulator */}
                  <div className="absolute w-24 h-24 border border-[#E5B181]/20 rounded-full animate-ping opacity-30" />
                  <div className="text-center space-y-2 z-10 text-white opacity-40">
                    <p className="font-mono text-[10px]">CÁMARA 03 · BAÑO TERMAL</p>
                    <div className="record-dot mx-auto" />
                  </div>
                </div>
                <div className="absolute top-4 left-4 font-mono text-[9px] text-[#E5B181] uppercase bg-black/70 px-1.5 py-0.5 rounded-xs tracking-wider">
                  ● CAM_03_SPA_EXT
                </div>
                <div className="absolute bottom-4 right-4 font-mono text-[9px] text-white/60 bg-black/50 px-1">
                  1080p · {camTime}
                </div>
              </div>

              {/* CAM 4: Pantry Kitchen */}
              <div className="border border-[#2D2D2D] bg-[#1A1A1A] p-2 rounded-xs relative group overflow-hidden">
                <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center cctv-scanlines">
                  <div className="text-center space-y-2 z-10 text-white opacity-40">
                    <p className="font-mono text-[10px]">CÁMARA 04 · DESPENSA Y COCINA</p>
                    <div className="record-dot mx-auto" />
                  </div>
                </div>
                <div className="absolute top-4 left-4 font-mono text-[9px] text-yellow-500 uppercase bg-black/70 px-1.5 py-0.5 rounded-xs tracking-wider">
                  ● CAM_04_COCINA
                </div>
                <div className="absolute bottom-4 right-4 font-mono text-[9px] text-white/60 bg-black/50 px-1">
                  1080p · {camTime}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: EMPLOYEES LEDGER */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="border-b border-[#E5E1D8] pb-4">
              <h3 className="font-serif text-lg text-[#2D2D2D] font-medium">Registro Laboral e Historial de Fichaje</h3>
              <p className="text-xs text-[#8C857B]">Consulte contratos, DNI, vacaciones consumidas y registre incidencias de personal</p>
            </div>

            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="border border-[#E5E1D8] p-5 bg-[#FDFCFB] rounded-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-pulse">
                    <div className="space-y-2 flex-1 w-full">
                      <div className="flex items-center gap-3">
                        <div className="h-5 bg-[#E5E1D8]/60 rounded-xs w-36" />
                        <div className="h-4 bg-[#E5E1D8]/45 rounded-xs w-20" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                        <div className="h-6 bg-[#E5E1D8]/30 rounded-xs w-20" />
                        <div className="h-6 bg-[#E5E1D8]/30 rounded-xs w-20" />
                        <div className="h-6 bg-[#E5E1D8]/30 rounded-xs w-20" />
                        <div className="h-6 bg-[#E5E1D8]/30 rounded-xs w-20" />
                      </div>
                    </div>
                    <div className="flex flex-wrap md:flex-col gap-2 w-full md:w-auto">
                      <div className="h-8 bg-[#E5E1D8]/50 rounded-xs w-28" />
                      <div className="h-8 bg-[#E5E1D8]/35 rounded-xs w-28" />
                    </div>
                  </div>
                ))
              ) : (
                employees.map((emp) => (
                  <div 
                    key={emp.id}
                    className="border border-[#E5E1D8] p-5 bg-[#FDFCFB] rounded-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-[#8C857B] transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-serif text-base font-semibold text-[#2D2D2D]">{emp.name}</h4>
                        <span className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider rounded-xs border ${
                          emp.status === 'present'
                            ? 'bg-[#F5F3EF] border-[#E5E1D8] text-[#2C3627]'
                            : emp.status === 'vacation'
                            ? 'bg-[#F5F3EF] border-[#D1CDC3] text-[#8C857B]'
                            : emp.status === 'sick'
                            ? 'bg-[#FAF8F5] border-red-200 text-red-700'
                            : 'bg-[#FDFCFB] border-[#E5E1D8] text-[#8C857B]'
                        }`}>
                          {emp.status === 'present' ? 'Fichado Hoy' : emp.status === 'vacation' ? 'Vacaciones' : emp.status === 'sick' ? 'Baja' : 'Ausente'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] font-mono text-[#8C857B] leading-relaxed">
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-[#8C857B]">Identificador</span>
                          <span className="font-semibold text-[#2D2D2D]">{emp.id} · {emp.dni}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-[#8C857B]">Puesto</span>
                          <span className="capitalize">{emp.role === 'reception' ? 'Recepción' : emp.role === 'cleaning' ? 'Gobernanta' : emp.role === 'maintenance' ? 'Mantenimiento' : emp.role}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-[#8C857B]">Contrato</span>
                          <span className="truncate block" title={emp.contractType}>{emp.contractType}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-[#8C857B]">Antigüedad</span>
                          <span>{emp.tenure}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-4 text-[11px] font-mono text-[#8C857B] border-t border-[#E5E1D8]">
                        <span>Horario: <span className="text-[#2D2D2D]">{emp.hourlySchedule}</span></span>
                        {emp.todayClockIn && (
                          <span>Entrada hoy: <span className="text-[#2C3627] font-bold">{emp.todayClockIn}h</span></span>
                        )}
                        <span>Vacaciones: <span className="text-[#2D2D2D]">{emp.vacationsTaken} / {emp.vacationsTotal} días</span></span>
                        <span>Bajas registradas: <span className="text-red-500">{emp.sickLeaves}</span></span>
                      </div>
                    </div>

                    {/* Operational Clock-in Simulator Controls */}
                    <div className="flex md:flex-col gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#E5E1D8]">
                      {emp.status !== 'present' ? (
                        <button 
                          onClick={() => onClockEmployee(emp.id, 'in')}
                          className="flex-1 md:w-32 py-1.5 text-[10px] font-mono uppercase bg-[#2C3627] text-white hover:bg-[#2C3627]/90 transition-colors rounded-xs text-center cursor-pointer"
                        >
                          Registrar Fichaje
                        </button>
                      ) : (
                        <button 
                          onClick={() => onClockEmployee(emp.id, 'out')}
                          className="flex-1 md:w-32 py-1.5 text-[10px] font-mono uppercase bg-[#8C857B] text-white hover:bg-[#8C857B]/90 transition-colors rounded-xs text-center cursor-pointer"
                        >
                          Fichar Salida
                        </button>
                      )}
                      
                      <button 
                        onClick={() => onLogLeave(emp.id, 'vacation', 2)}
                        className="flex-1 md:w-32 py-1.5 text-[10px] font-mono uppercase border border-[#D1CDC3] text-[#8C857B] hover:bg-[#F5F3EF] transition-colors rounded-xs text-center cursor-pointer"
                      >
                        Asignar Vacac.
                      </button>
                      <button 
                        onClick={() => onLogLeave(emp.id, 'sick', 1)}
                        className="flex-1 md:w-32 py-1.5 text-[10px] font-mono uppercase border border-red-200 text-red-600 hover:bg-red-50/20 transition-colors rounded-xs text-center cursor-pointer"
                      >
                        Loguear Baja
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SUBCONTRACTORS */}
        {activeTab === 'subcontractors' && (
          <div className="space-y-6">
            <div className="border-b border-[#E5E1D8] pb-4">
              <h3 className="font-serif text-lg text-[#2D2D2D] font-medium">Empresas Externas y Homologaciones</h3>
              <p className="text-xs text-[#8C857B]">Seguimiento de revisiones periódicas obligatorias de agua, caldera de biomasa, ascensor e instalaciones termales</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subcontractors.map((sub) => (
                <div 
                  key={sub.id}
                  className="border border-[#E5E1D8] p-5 bg-[#FDFCFB] rounded-xs space-y-4 hover:border-[#8C857B] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif text-base font-semibold text-[#2D2D2D]">{sub.company}</h4>
                        <span className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider">Servicio: {sub.service.toUpperCase()}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-xs border ${
                        sub.status === 'ok' 
                          ? 'bg-[#F5F3EF] border-[#E5E1D8] text-[#2C3627]' 
                          : 'bg-[#FDFCFB] border-[#D1CDC3] text-[#E5B181]'
                      }`}>
                        {sub.status === 'ok' ? 'Homologado' : 'Revisión'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono text-[#8C857B] leading-relaxed">
                      <p>Contacto Emergencia: <span className="text-[#2D2D2D] font-bold">{sub.contact}</span></p>
                      <p>Última Revisión: <span>{sub.lastReview}</span></p>
                      <p>Siguiente Revisión: <span className="text-[#8C857B] font-bold">{sub.nextReview}</span></p>
                    </div>

                    {/* Active Tickets List */}
                    <div className="pt-3 border-t border-[#E5E1D8] space-y-2">
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-[#8C857B]">Tickets de Mantenimiento Activos:</span>
                      {sub.activeTickets.length === 0 ? (
                        <p className="text-[10px] font-mono text-[#8C857B] italic">Ninguna incidencia activa reportada.</p>
                      ) : (
                        <div className="space-y-2">
                          {sub.activeTickets.map(tkt => (
                            <div 
                              key={tkt.id}
                              className="p-2 bg-[#F5F3EF] border border-[#D1CDC3] flex justify-between items-center text-[10px] rounded-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-mono text-[8px] text-[#8C857B] font-bold uppercase">{tkt.id} · {tkt.date}</span>
                                <p className="font-medium text-[#2D2D2D] truncate max-w-[200px]">{tkt.title}</p>
                              </div>
                              {tkt.status === 'open' ? (
                                <button
                                  onClick={() => onResolveSubcontractorTicket(sub.id, tkt.id)}
                                  className="px-2 py-1 bg-[#2C3627] hover:bg-[#2C3627]/90 text-white text-[8px] font-mono uppercase tracking-wider rounded-xs cursor-pointer"
                                >
                                  Resolver
                                </button>
                              ) : (
                                <span className="text-[#2C3627] font-bold uppercase text-[8px] font-mono">Solucionado</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Create New Ticket Inline Form */}
                  <div className="pt-4 border-t border-[#E5E1D8] flex gap-2">
                    <input 
                      type="text"
                      placeholder="Nueva anomalía (ej. Calibración del caudal)"
                      value={ticketTitles[sub.id] || ''}
                      onChange={(e) => setTicketTitles(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      className="flex-1 px-2 py-1 text-[10px] bg-[#FDFCFB] border border-[#D1CDC3] rounded-xs focus:outline-hidden text-[#2D2D2D]"
                    />
                    <button 
                      onClick={() => handleCreateTicket(sub.id)}
                      className="px-2.5 py-1 bg-[#2D2D2D] hover:bg-[#8C857B] text-[#FDFCFB] text-[9px] font-mono uppercase rounded-xs cursor-pointer"
                    >
                      Reportar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
