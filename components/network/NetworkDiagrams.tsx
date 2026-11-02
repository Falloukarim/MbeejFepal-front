'use client';

// À placer dans : components/network/NetworkDiagrams.tsx
import { createContext, useContext, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X, Users, Router as RouterIcon, Satellite, RadioTower, Home, Smartphone, Server } from 'lucide-react';

// Mode compact : schémas affichés dans la maquette de téléphone
export const CompactCtx = createContext(false);

const COLORS = {
  amber: '#f59e0b',
  sky: '#38bdf8',
  green: '#4ade80',
  red: '#ef4444',
  line: 'rgba(255,255,255,0.14)',
};

// Câble : trait de base + halo
function Cable({ d, color = COLORS.line, width = 3, dashed = false, glow = false }: { d: string; color?: string; width?: number; dashed?: boolean; glow?: boolean }) {
  return (
    <g>
      {glow && <path d={d} fill="none" stroke={color} strokeWidth={width + 6} strokeLinecap="round" opacity="0.15" />}
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '6 7' : undefined} />
    </g>
  );
}

// Points lumineux qui circulent le long d'un câble
function Flow({ d, color, count = 3, dur = 3, offset = 0, r = 3.6 }: { d: string; color: string; count?: number; dur?: number; offset?: number; r?: number }) {
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => (
        <circle key={i} r={r} fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`-${(i * dur) / count + offset}s`} path={d} />
        </circle>
      ))}
    </g>
  );
}

// Groupe dont l'opacité suit un cycle
function Cycle({ values, keyTimes, dur = 9, children }: { values: string; keyTimes: string; dur?: number; children: ReactNode }) {
  return (
    <g>
      <animate attributeName="opacity" values={values} keyTimes={keyTimes} dur={`${dur}s`} repeatCount="indefinite" />
      {children}
    </g>
  );
}

type Tone = 'neutral' | 'amber' | 'sky' | 'green';
const toneCls: Record<Tone, string> = {
  neutral: 'border-white/15 text-gray-100',
  amber: 'border-amber-400/50 text-amber-300 shadow-[0_0_28px_-4px_rgba(245,158,11,0.55)]',
  sky: 'border-sky-400/50 text-sky-300 shadow-[0_0_28px_-4px_rgba(56,189,248,0.55)]',
  green: 'border-green-400/50 text-green-300 shadow-[0_0_28px_-4px_rgba(74,222,128,0.5)]',
};

// Appareil (position en coordonnées du viewBox)
function Device({ x, y, icon: Icon, label, tone = 'neutral', large = false }: { x: number; y: number; icon: LucideIcon; label?: string; tone?: Tone; large?: boolean }) {
  const compact = useContext(CompactCtx);
  if (compact) {
    return (
      <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1" style={{ left: `${x / 4}%`, top: `${y / 3}%` }}>
        <div className={`${large ? 'w-11 h-11' : 'w-9 h-9'} rounded-xl bg-white/10 border flex items-center justify-center ${toneCls[tone]}`}>
          <Icon className={large ? 'w-5 h-5' : 'w-4 h-4'} />
        </div>
        {label && <span className="text-[8px] font-bold text-gray-300 whitespace-nowrap">{label}</span>}
      </div>
    );
  }
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5" style={{ left: `${x / 4}%`, top: `${y / 3}%` }}>
      <div
        className={`${large ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-11 h-11 sm:w-14 sm:h-14'} rounded-2xl bg-white/10 backdrop-blur-md border flex items-center justify-center ${toneCls[tone]}`}
      >
        <Icon className={large ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-5 h-5 sm:w-6 sm:h-6'} />
      </div>
      {label && <span className="text-[10px] sm:text-xs font-bold text-gray-300 whitespace-nowrap">{label}</span>}
    </div>
  );
}

// Étiquette posée sur un câble
function Tagged({ x, y, children, tone = 'neutral' }: { x: number; y: number; children: ReactNode; tone?: Tone }) {
  const compact = useContext(CompactCtx);
  const cls =
    tone === 'amber' ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
    : tone === 'sky' ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
    : tone === 'green' ? 'bg-green-500/20 border-green-400/40 text-green-200'
    : 'bg-white/10 border-white/20 text-gray-200';
  return (
    <span
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border font-extrabold backdrop-blur-md whitespace-nowrap ${compact ? 'px-1.5 py-px text-[7px]' : 'px-2 py-0.5 text-[9px] sm:text-[11px]'} ${cls}`}
      style={{ left: `${x / 4}%`, top: `${y / 3}%` }}
    >
      {children}
    </span>
  );
}

function Stage({ children, svg }: { children: ReactNode; svg: ReactNode }) {
  return (
    <div className="relative w-full max-w-xl mx-auto aspect-[4/3]">
      <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" fill="none" aria-hidden="true">
        {svg}
      </svg>
      {children}
    </div>
  );
}

/* ───────── Schéma 1 : VLAN ───────── */
export function VlanDiagram() {
  const lanA = 'M190 150 C250 150 265 70 335 70';
  const lanB = 'M190 150 C250 150 265 230 335 230';
  const trunk = 'M60 150 L190 150';
  return (
    <Stage
      svg={
        <>
          <Cable d={trunk} color="rgba(255,255,255,0.22)" width={7} />
          <Flow d={trunk} color={COLORS.amber} count={2} dur={2.4} />
          <Flow d={trunk} color={COLORS.sky} count={2} dur={2.4} offset={0.6} />
          <Cable d={lanA} color="rgba(245,158,11,0.45)" glow />
          <Flow d={lanA} color={COLORS.amber} count={3} dur={2.6} />
          <Cable d={lanB} color="rgba(56,189,248,0.45)" glow />
          <Flow d={lanB} color={COLORS.sky} count={3} dur={2.6} />
        </>
      }
    >
      <Device x={60} y={150} icon={RouterIcon} label="Routeur" large />
      <Device x={190} y={150} icon={Server} label="Switch" />
      <Device x={335} y={70} icon={Home} label="Abonnés PPPoE" tone="amber" />
      <Device x={335} y={230} icon={Smartphone} label="Clients Hotspot" tone="sky" />
      <Tagged x={125} y={122}>Trunk · 1 câble</Tagged>
      <Tagged x={268} y={96} tone="amber">VLAN 20</Tagged>
      <Tagged x={268} y={204} tone="sky">VLAN 30</Tagged>
    </Stage>
  );
}

/* ───────── Schéma 2 : Load balancing ───────── */
export function LoadBalancingDiagram() {
  const w1 = 'M55 55 C135 55 145 150 225 150';
  const w2 = 'M55 150 L225 150';
  const w3 = 'M55 245 C135 245 145 150 225 150';
  const out = 'M225 150 L350 150';
  return (
    <Stage
      svg={
        <>
          <Cable d={w1} color="rgba(245,158,11,0.4)" glow />
          <Flow d={w1} color={COLORS.amber} dur={3} />
          <Cable d={w2} color="rgba(56,189,248,0.4)" glow />
          <Flow d={w2} color={COLORS.sky} dur={2.6} offset={0.4} />
          <Cable d={w3} color="rgba(74,222,128,0.4)" glow />
          <Flow d={w3} color={COLORS.green} dur={3.4} offset={0.8} />
          <Cable d={out} color="rgba(255,255,255,0.22)" width={7} />
          <Flow d={out} color="#ffffff" count={4} dur={2} r={3} />
        </>
      }
    >
      <Device x={55} y={55} icon={Satellite} label="Starlink 1" tone="amber" />
      <Device x={55} y={150} icon={Satellite} label="Starlink 2" tone="sky" />
      <Device x={55} y={245} icon={RadioTower} label="4G" tone="green" />
      <Device x={225} y={150} icon={RouterIcon} label="Routeur" large />
      <Device x={350} y={150} icon={Users} label="Vos clients" />
      <Tagged x={128} y={74} tone="amber">33 %</Tagged>
      <Tagged x={128} y={150} tone="sky">33 %</Tagged>
      <Tagged x={128} y={226} tone="green">33 %</Tagged>
    </Stage>
  );
}

/* ───────── Schéma 3 : Failover (cycle de 9 s : normal → panne → retour) ───────── */
export function FailoverDiagram() {
  const w1 = 'M55 80 C135 80 145 150 225 150';
  const w2 = 'M55 220 C135 220 145 150 225 150';
  const out = 'M225 150 L350 150';
  const okVals = '1;1;0;0;1;1';
  const failVals = '0;0;1;1;0;0';
  const kt = '0;0.3;0.34;0.7;0.74;1';
  return (
    <Stage
      svg={
        <>
          {/* Ligne principale */}
          <Cable d={w1} color="rgba(255,255,255,0.12)" />
          <Cycle values={okVals} keyTimes={kt}>
            <Cable d={w1} color="rgba(74,222,128,0.6)" glow />
            <Flow d={w1} color={COLORS.green} dur={2.6} />
          </Cycle>
          <Cycle values={failVals} keyTimes={kt}>
            <Cable d={w1} color="rgba(239,68,68,0.7)" dashed />
          </Cycle>

          {/* Ligne de secours */}
          <Cable d={w2} color="rgba(255,255,255,0.12)" />
          <Cycle values={failVals} keyTimes={kt}>
            <Cable d={w2} color="rgba(245,158,11,0.65)" glow />
            <Flow d={w2} color={COLORS.amber} dur={2.6} />
          </Cycle>

          {/* Sortie vers les clients : toujours active */}
          <Cable d={out} color="rgba(255,255,255,0.22)" width={7} />
          <Flow d={out} color="#ffffff" count={4} dur={2} r={3} />
        </>
      }
    >
      <style>{`
        @keyframes lp-ok { 0%,30%{opacity:1} 34%,70%{opacity:0} 74%,100%{opacity:1} }
        @keyframes lp-failcycle { 0%,30%{opacity:0} 34%,70%{opacity:1} 74%,100%{opacity:0} }
        .lp-ok { animation: lp-ok 9s infinite; }
        .lp-fail { animation: lp-failcycle 9s infinite; }
        @media (prefers-reduced-motion: reduce) { .lp-ok,.lp-fail { animation: none; } .lp-fail { opacity: 0; } }
      `}</style>
      <Device x={55} y={80} icon={Satellite} label="Ligne principale" />
      <Device x={55} y={220} icon={RadioTower} label="Ligne de secours" />
      <Device x={225} y={150} icon={RouterIcon} label="Routeur" large />
      <Device x={350} y={150} icon={Users} label="Vos clients" />

      {/* Anneau rouge + croix pendant la panne */}
      <div
        className="lp-fail absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-[3.7rem] sm:h-[3.7rem] rounded-2xl border-2 border-red-500/80 shadow-[0_0_26px_rgba(239,68,68,0.55)] pointer-events-none"
        style={{ left: `${55 / 4}%`, top: `${80 / 3}%` }}
      />
      <span className="lp-fail absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg" style={{ left: `${128 / 4}%`, top: `${95 / 3}%` }}>
        <X className="w-4 h-4" strokeWidth={3.5} />
      </span>

      {/* Statut qui alterne */}
      <span className="lp-ok absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-400/40 text-green-200 text-[10px] sm:text-xs font-extrabold whitespace-nowrap backdrop-blur-md" style={{ left: '50%', top: '93%' }}>
        ● Ligne principale active
      </span>
      <span className="lp-fail absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 text-[10px] sm:text-xs font-extrabold whitespace-nowrap backdrop-blur-md" style={{ left: '50%', top: '93%' }}>
        ⚡ Bascule vers la ligne de secours
      </span>
    </Stage>
  );
}


// Carte d'habillage commune aux schémas (même style que la page d'accueil)
export function DiagramCard({ icon, title, subtitle, action, children }: { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="pppoe-rise relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
      <div className="absolute inset-0 opacity-60 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">{icon}</div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="mt-4">{action}</div>}
        <div className="mt-2 sm:mt-4">{children}</div>
      </div>
    </div>
  );
}