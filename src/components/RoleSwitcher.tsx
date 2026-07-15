/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, KeyRound, ShieldAlert } from 'lucide-react';
import { SenderRole } from '../types.js';

interface RoleSwitcherProps {
  currentRole: SenderRole;
  onChangeRole: (role: SenderRole) => void;
}

export default function RoleSwitcher({ currentRole, onChangeRole }: RoleSwitcherProps) {
  return (
    <div className="bg-[#F8F6F2] border-b border-[#E5E1D8]/80 px-6 py-2.5 flex flex-col md:flex-row justify-between items-center gap-3.5 print:hidden">
      <div className="flex items-center gap-2.5">
        <span className="inline-block w-2 h-2 rounded-full bg-[#E5B181] shadow-xs animate-ping" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#8C857B] font-medium">
          ENTORNO DE SIMULACIÓN INTERCONECTADA DE ALTA GESTIÓN
        </span>
      </div>
      <div className="flex items-center bg-[#FAF9F6] p-1 border border-[#D1CDC3]/70 rounded-lg gap-1.5 shadow-3xs">
        <button
          onClick={() => onChangeRole('consumer')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[10.5px] font-mono uppercase tracking-widest transition-all duration-300 rounded-md cursor-pointer ${
            currentRole === 'consumer'
              ? 'bg-[#2C3627] text-[#FDFCFB] shadow-xs font-semibold'
              : 'text-[#8C857B] hover:text-[#2D2D2D] hover:bg-[#F5F3EF]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Huésped
        </button>
        <button
          onClick={() => onChangeRole('receptionist')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[10.5px] font-mono uppercase tracking-widest transition-all duration-300 rounded-md cursor-pointer ${
            currentRole === 'receptionist'
              ? 'bg-[#8C857B] text-[#FDFCFB] shadow-xs font-semibold'
              : 'text-[#8C857B] hover:text-[#2D2D2D] hover:bg-[#F5F3EF]'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Recepcionista
        </button>
        <button
          onClick={() => onChangeRole('admin')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[10.5px] font-mono uppercase tracking-widest transition-all duration-300 rounded-md cursor-pointer ${
            currentRole === 'admin'
              ? 'bg-[#2D2D2D] text-[#FDFCFB] shadow-xs font-semibold'
              : 'text-[#8C857B] hover:text-[#2D2D2D] hover:bg-[#F5F3EF]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Director
        </button>
      </div>
    </div>
  );
}
