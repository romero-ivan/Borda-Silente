/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Printer, ArrowDownToLine, Receipt } from 'lucide-react';
import { Booking, Room } from '../types.js';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  room: Room | null;
}

export default function InvoiceModal({ isOpen, onClose, booking, room }: InvoiceModalProps) {
  if (!isOpen || !booking || !room) return null;

  const handlePrint = () => {
    window.print();
  };

  // Pricing calculations
  const dateIn = new Date(booking.checkIn);
  const dateOut = new Date(booking.checkOut);
  const diffDays = Math.ceil(Math.abs(dateOut.getTime() - dateIn.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  
  const subtotalNights = room.price * diffDays;
  const ecoTax = 1.5 * diffDays; // Pyrenean eco preservation tax
  const cleaningFee = 25.0;      // Fixed cleaning / linen prep
  const subtotalBeforeTax = subtotalNights + ecoTax + cleaningFee;
  const iva = subtotalBeforeTax * 0.1; // 10% tourist tax in Spain
  const total = subtotalBeforeTax + iva;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div 
        id="invoice-modal-content"
        className="relative w-full max-w-2xl bg-[#FDFCFB] text-[#2D2D2D] shadow-xl border border-[#D1CDC3] flex flex-col max-h-[90vh] overflow-hidden rounded-xs"
      >
        {/* Modal Controls */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5E1D8] bg-[#F5F3EF] print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#8C857B]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#8C857B]">Detalle de Facturación</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#FDFCFB] bg-[#2D2D2D] hover:bg-[#8C857B] transition-colors rounded-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button 
              onClick={onClose}
              className="p-1 text-[#8C857B] hover:text-[#2D2D2D] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 print:p-0 print:overflow-visible">
          {/* Printable container */}
          <div className="space-y-8 select-text">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#E5E1D8] pb-8 gap-4">
              <div>
                <h1 className="font-serif text-3xl font-medium tracking-tight text-[#2C3627]">Borda Silente</h1>
                <p className="font-sans text-xs text-[#8C857B] mt-1">Refugio de Montaña · Huesca</p>
                <p className="font-sans text-[10px] text-[#8C857B] leading-relaxed mt-0.5">
                  Valle de Ansó, Pirineo Aragonés<br />
                  CIF: ES87120443B · tlf: +34 974 330 112
                </p>
              </div>
              <div className="text-left md:text-right font-mono text-xs">
                <div className="text-[#8C857B] font-semibold text-sm tracking-tight">{booking.invoiceNumber}</div>
                <div className="text-[#8C857B] mt-1">Fecha Emisión: {new Date(booking.createdAt).toLocaleDateString('es-ES')}</div>
                <div className="text-[#8C857B]">Vía: {booking.platform.toUpperCase()}</div>
                <div className="inline-block mt-2 px-2 py-0.5 text-[9px] bg-[#F5F3EF] text-[#2C3627] border border-[#E5E1D8] uppercase tracking-wider font-semibold rounded-xs">
                  Pagado · Confirmado
                </div>
              </div>
            </div>

            {/* Guest & Stay Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#8C857B] mb-2">Huésped Facturado</h3>
                <p className="font-sans font-medium text-sm text-[#2D2D2D]">{booking.guestName}</p>
                <p className="font-mono text-[#8C857B] mt-0.5">{booking.guestEmail}</p>
                <p className="font-sans text-[#8C857B] mt-1">DNI/Pasaporte: Registrado en recepción</p>
              </div>
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#8C857B] mb-2">Detalles de Estancia</h3>
                <p className="font-sans font-medium text-[#2D2D2D]">{room.name} (Hab. {room.number})</p>
                <p className="font-sans text-[#8C857B] mt-0.5">
                  Entrada: <span className="font-mono">{booking.checkIn}</span><br />
                  Salida: <span className="font-mono">{booking.checkOut}</span>
                </p>
                <p className="font-mono text-[#8C857B] mt-1">{diffDays} {diffDays === 1 ? 'Noche' : 'Noches'} · {room.capacity} Personas máx.</p>
              </div>
            </div>

            {/* Charges Breakdown Table */}
            <div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E1D8] text-[#8C857B] font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 font-medium">Concepto</th>
                    <th className="py-2.5 text-center font-medium">Cant.</th>
                    <th className="py-2.5 text-right font-medium">Precio Unit.</th>
                    <th className="py-2.5 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]">
                  <tr>
                    <td className="py-3 font-sans">
                      <span className="font-medium text-[#2D2D2D]">{room.name}</span>
                      <p className="text-[10px] text-[#8C857B]">Estancia premium en refugio con servicios de cortesía</p>
                    </td>
                    <td className="py-3 text-center font-mono">{diffDays} {diffDays === 1 ? 'noche' : 'noches'}</td>
                    <td className="py-3 text-right font-mono">{room.price.toFixed(2)}€</td>
                    <td className="py-3 text-right font-mono">{(room.price * diffDays).toFixed(2)}€</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-sans">
                      <span className="font-medium text-[#2D2D2D]">Ecotasa de Montaña</span>
                      <p className="text-[10px] text-[#8C857B]">Preservación ecológica y gestión forestal del Pirineo</p>
                    </td>
                    <td className="py-3 text-center font-mono">{diffDays} {diffDays === 1 ? 'día' : 'días'}</td>
                    <td className="py-3 text-right font-mono">1.50€</td>
                    <td className="py-3 text-right font-mono">{(1.5 * diffDays).toFixed(2)}€</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-sans">
                      <span className="font-medium text-[#2D2D2D]">Preparación de Estancia & Lino</span>
                      <p className="text-[10px] text-[#8C857B]">Lavandería ecológica tradicional de algodón y lino orgánico</p>
                    </td>
                    <td className="py-3 text-center font-mono">1 serv.</td>
                    <td className="py-3 text-right font-mono">25.00€</td>
                    <td className="py-3 text-right font-mono">25.00€</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations Totals */}
            <div className="flex justify-end pt-4 border-t border-[#E5E1D8]">
              <div className="w-full max-w-xs space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#8C857B]">
                  <span>Subtotal Base:</span>
                  <span>{subtotalBeforeTax.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-[#8C857B]">
                  <span>IVA (10%):</span>
                  <span>{iva.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-[#2D2D2D] font-bold border-t border-[#E5E1D8] pt-2 text-sm">
                  <span className="font-sans">TOTAL NETO:</span>
                  <span className="text-[#8C857B] font-mono">{total.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            {/* Footnote stamp */}
            <div className="flex items-center justify-between pt-8 border-t border-[#E5E1D8] text-[10px] text-[#8C857B] leading-relaxed">
              <div>
                <p className="font-serif italic">"En armonía con las cumbres del Pirineo aragonés."</p>
                <p className="mt-1">Gracias por alojarse en Borda Silente. Esperamos verle de nuevo.</p>
              </div>
              <div className="w-16 h-16 border-2 border-dashed border-[#D1CDC3] rounded-full flex flex-col items-center justify-center text-[8px] font-mono text-[#8C857B] select-none text-center">
                <span>SELLO</span>
                <span className="font-serif italic text-[#2C3627] font-bold">SILENTE</span>
                <span>OK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Print only instructions for formatting */}
        <style>{`
          @media print {
            /* Hide all main app content wrappers to prevent blank pages */
            #root > *:not(.fixed) {
              display: none !important;
            }
            /* Format modal backdrop for printing */
            .fixed.inset-0.z-50 {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: transparent !important;
              backdrop-filter: none !important;
              display: block !important;
              padding: 0 !important;
            }
            #invoice-modal-content {
              border: none !important;
              box-shadow: none !important;
              background: #FAF8F5 !important;
              color: #2D2D2D !important;
              max-height: none !important;
              width: 100% !important;
              max-width: 100% !important;
              position: static !important;
              overflow: visible !important;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
