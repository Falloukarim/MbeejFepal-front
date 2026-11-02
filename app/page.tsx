'use client';

import { createContext, JSX, useContext, useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Router as RouterIcon,
  Tag,
  Wallet,
  ShieldCheck,
  Palette,
  CreditCard,
  QrCode,
  Users,
  Gauge,
  Check,
  X,
  Mail,
  Layers,
  GitMerge,
  Satellite,
  RadioTower,
  Home,
  Smartphone,
  Network,
  Server,
  Sparkles,
} from 'lucide-react';

// Vos vidéos : déposez-les dans public/videos/ (les noms se changent ici)
const VIDEO_NOUVEAUTES = '/videos/nouveautes.mp4';
const VIDEO_FINALE = '/videos/demo.mp4';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

function BrandMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12.5C7.5 10 12.5 10 15 12.5" strokeLinecap="round" />
      <path d="M2 8.5C6 4.5 14 4.5 18 8.5" strokeLinecap="round" strokeOpacity="0.7" />
      <path d="M8 16.5L12 12.5L16 16.5" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   BRIQUES DES SCHÉMAS ANIMÉS (viewBox 400 x 300)
   ══════════════════════════════════════════════════════════════ */

// Mode compact : schémas affichés dans la maquette de téléphone
const CompactCtx = createContext(false);

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
function VlanDiagram() {
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
function LoadBalancingDiagram() {
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
function FailoverDiagram() {
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

/* ══════════════════════════════════════════════════════════════
   MAQUETTE iPHONE 17 (HERO) : affiche le schéma VLAN
   Dessinée à taille fixe (290 x 628) puis réduite pour tenir dans l'écran.
   ══════════════════════════════════════════════════════════════ */
const PHONE_W = 290;
const PHONE_H = 628;

function PhoneMock() {
  return (
    <div className="relative" style={{ width: PHONE_W, height: PHONE_H }}>
      {/* Boutons latéraux */}
      <span className="absolute -left-[3px] top-[110px] h-8 w-[3px] rounded-l bg-orange-300/70" />
      <span className="absolute -left-[3px] top-[160px] h-14 w-[3px] rounded-l bg-orange-300/70" />
      <span className="absolute -left-[3px] top-[225px] h-14 w-[3px] rounded-l bg-orange-300/70" />
      <span className="absolute -right-[3px] top-[170px] h-20 w-[3px] rounded-r bg-orange-300/70" />

      {/* Châssis aluminium */}
      <div className="h-full rounded-[3.1rem] p-[3px] bg-gradient-to-br from-orange-200 via-orange-500 to-orange-800 shadow-[0_40px_100px_-20px_rgba(217,119,6,0.55)]">
        <div className="h-full rounded-[2.95rem] bg-black p-[7px]">
          <div className="relative h-full rounded-[2.4rem] overflow-hidden bg-[#0a0a0a] flex flex-col">
            {/* Dynamic Island */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 h-[22px] w-[84px] rounded-full bg-black" />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_100%_0%,rgba(217,119,6,0.18)_0%,transparent_55%)]" />

            {/* Barre d'état */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-3 text-[11px] font-bold text-white">
              <span>9:41</span>
              <span className="flex items-center gap-1">
                <span className="flex items-end gap-[2px]">
                  {[4, 6, 8, 10].map((h) => (
                    <span key={h} className="w-[3px] rounded-sm bg-white" style={{ height: h }} />
                  ))}
                </span>
                <span className="ml-1 h-[10px] w-[20px] rounded-[3px] border border-white/60 p-[1px]">
                  <span className="block h-full w-[75%] rounded-[1px] bg-white" />
                </span>
              </span>
            </div>

            {/* Contenu de l'app */}
            <div className="relative flex-1 min-h-0 flex flex-col px-3.5 pt-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <BrandMark className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold leading-none">MbeejFepal</p>
                    <p className="text-[15px] font-extrabold text-white leading-tight mt-0.5">Réseau</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[9px] font-extrabold text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> En ligne
                </span>
              </div>

              <div className="relative mt-5 rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black overflow-hidden">
                <div className="absolute inset-0 opacity-60 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:18px_18px]" />
                <div className="relative px-2 py-5">
                  <CompactCtx.Provider value={true}>
                    <VlanDiagram />
                  </CompactCtx.Provider>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {[
                  { icon: GitMerge, label: 'Multi-WAN', value: 'Actif' },
                  { icon: ShieldCheck, label: 'Failover', value: 'Prêt' },
                ].map((t) => (
                  <div key={t.label} className="rounded-2xl bg-white/5 border border-white/10 px-3 py-3">
                    <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-500">
                      <t.icon className="w-3.5 h-3.5 text-amber-500" /> {t.label}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-extrabold text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" /> {t.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
                <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-[12px] font-bold text-gray-100 flex-1">VLAN 20 · VLAN 30</p>
                <Check className="w-4 h-4 text-green-400" strokeWidth={3} />
              </div>
            </div>

            {/* Barre d'onglets */}
            <div className="relative mx-3 mb-2 mt-3 flex items-center justify-around rounded-2xl bg-white/5 border border-white/10 py-2">
              {[Home, RouterIcon, Wallet, Users].map((Ic, k) => (
                <span
                  key={k}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${k === 1 ? 'bg-amber-500 text-black' : 'text-gray-500'}`}
                >
                  <Ic className="w-[18px] h-[18px]" />
                </span>
              ))}
            </div>
            {/* Barre d'accueil */}
            <div className="mx-auto mb-2 h-1 w-24 rounded-full bg-white/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DIAPORAMA (à côté du téléphone) : fichiers dans public/images/
   ══════════════════════════════════════════════════════════════ */
type Slide = { src: string; tag: string; title: string; desc: string };

// Ajustez les textes ou l'ordre ici (fichiers dans public/images/)
const SLIDES: Slide[] = [
  { src: '/images/1.jpg', tag: 'VLAN', title: 'Un câble, plusieurs réseaux isolés', desc: 'Séparez le Hotspot et le PPPoE sur un seul trunk.' },
  { src: '/images/2.jpg', tag: 'PPPoE', title: 'Vos abonnés, bien organisés', desc: 'Créez des comptes PPPoE et partagez les identifiants en un geste.' },
  { src: '/images/3.jpg', tag: 'Failover', title: 'Une ligne tombe, le service continue', desc: 'Bascule automatique sur la ligne de secours.' },
  { src: '/images/4.jpg', tag: 'Load balancing', title: 'Toutes vos lignes, une seule connexion', desc: 'Répartissez le trafic sur plusieurs lignes Starlink ou 4G.' },
  { src: '/images/wave.jpg', tag: 'Paiement mobile', title: 'Wave et Orange Money disponibles', desc: 'Vos clients paient en mobile money, vous encaissez dans votre portefeuille.' },
];

const SLIDE_MS = 5000;

// Cadre vidéo : n'affiche rien tant que le fichier n'existe pas
function VideoBlock({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-gray-900 shadow-2xl aspect-video">
      <video className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline controls preload="metadata" aria-label={label}>
        <source src={src} type="video/mp4" onError={() => setFailed(true)} />
      </video>
    </div>
  );
}

// Hauteur commune au téléphone et aux cadres : tout reste visible sans défiler
const FRAME_H = 'h-[420px] sm:h-[clamp(345px,calc(100dvh-10rem),640px)]';

// Un cadre = son propre défilement d'images avec sa description dessous
function SlideFrame({ slides, delay = 0 }: { slides: Slide[]; delay?: number }) {
  const [bad, setBad] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const list = slides.filter((p) => !bad.includes(p.src));

  // Précharge les images pour éviter tout clignotement
  useEffect(() => {
    slides.forEach((p) => {
      const img = new window.Image();
      img.onerror = () => setBad((b) => (b.includes(p.src) ? b : [...b, p.src]));
      img.src = p.src;
    });
  }, [slides]);

  // Les cadres sont décalés (delay) pour ne pas changer tous en même temps
  useEffect(() => {
    if (list.length < 2) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      id = setInterval(() => setI((n) => (n + 1) % list.length), SLIDE_MS);
    }, delay);
    return () => {
      clearTimeout(t);
      if (id) clearInterval(id);
    };
  }, [list.length, delay]);

  if (list.length === 0) return null;
  const idx = i % list.length;
  const slide = list[idx];

  return (
    <div className={`${FRAME_H} flex flex-col rounded-[28px] border border-white/10 bg-gradient-to-br from-gray-900 to-black shadow-2xl overflow-hidden`}>
      <div className="relative flex-1 min-h-0 overflow-hidden bg-gray-900">
        <AnimatePresence initial={false}>
          <motion.img
            key={slide.src}
            src={slide.src}
            alt={slide.title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-25%', opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
          {slide.tag}
        </span>
      </div>

      {/* Description sous la photo */}
      <div className="shrink-0 px-3.5 sm:px-4 pt-3 pb-3.5 h-[124px] sm:h-[116px] flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.src}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-h-0"
          >
            <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight line-clamp-2">{slide.title}</h3>
            <p className="mt-1 text-xs sm:text-[13px] text-gray-400 leading-snug line-clamp-3">{slide.desc}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-2 flex gap-1.5">
          {list.map((p, k) => (
            <span key={p.src} className={`h-1.5 rounded-full transition-all ${k === idx ? 'w-5 bg-amber-500' : 'w-1.5 bg-white/25'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Trois cadres côte à côte, chacun avec ses propres images (fichiers dans public/images/)
const SLIDES_C: Slide[] = [
  { src: '/images/5.jpg', tag: 'Portail', title: 'Un portail à vos couleurs', desc: 'Vos clients se connectent depuis une page à l\'image de votre zone.' },
  { src: '/images/6.jpg', tag: 'Forfaits', title: 'Forfaits et codes en un geste', desc: 'Créez vos offres, générez codes et QR codes.' },
  { src: '/images/7.jpg', tag: 'Tableau de bord', title: 'Tout suivre en direct', desc: 'Revenus, connexions et routeurs dans une seule app.' },
];

function SlideFrames() {
  const frameA = SLIDES.slice(0, 3); // VLAN, PPPoE, Failover
  const frameB = SLIDES.slice(3); // Load balancing, Paiement mobile
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 w-full">
      <SlideFrame slides={frameA} />
      <SlideFrame slides={frameB} delay={1700} />
      <SlideFrame slides={SLIDES_C} delay={3400} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════ */

type ShowcaseKey = 'vlan' | 'lb' | 'failover';

const showcases: {
  key: ShowcaseKey;
  label: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  chips: string[];
  Diagram: () => JSX.Element;
}[] = [
  {
    key: 'vlan',
    label: 'VLAN',
    icon: Layers,
    title: 'Un câble. Deux réseaux isolés.',
    desc: 'Séparez le Hotspot et le PPPoE sur un seul trunk.',
    chips: ['Trunk unique', 'Réseaux isolés', 'Configuré depuis l\'app'],
    Diagram: VlanDiagram,
  },
  {
    key: 'lb',
    label: 'Load balancing',
    icon: GitMerge,
    title: 'Toutes vos lignes. Une seule connexion.',
    desc: 'Répartissez le trafic sur plusieurs lignes, par exemple Starlink.',
    chips: ['Multi-WAN', 'Répartition automatique', 'Plus de capacité'],
    Diagram: LoadBalancingDiagram,
  },
  {
    key: 'failover',
    label: 'Failover',
    icon: ShieldCheck,
    title: 'Une ligne tombe ? Le service continue.',
    desc: 'Le trafic bascule automatiquement sur les autres lignes.',
    chips: ['Bascule automatique', 'Zéro intervention', 'Service continu'],
    Diagram: FailoverDiagram,
  },
];

const tiles: { icon: LucideIcon; label: string }[] = [
  { icon: RouterIcon, label: 'Multi-routeurs' },
  { icon: Tag, label: 'Forfaits sur mesure' },
  { icon: Wallet, label: 'Portefeuille' },
  { icon: CreditCard, label: 'Wave & Orange Money' },
  { icon: QrCode, label: 'QR codes & tickets' },
  { icon: Palette, label: 'Portail à vos couleurs' },
  { icon: Users, label: 'Multi-appareils' },
  { icon: Gauge, label: 'Quotas de données' },
  { icon: ShieldCheck, label: 'Tunnel WireGuard' },
];

const steps = [
  { icon: RouterIcon, title: 'Connectez votre routeur', desc: 'Collez le script fourni, c\'est prêt.' },
  { icon: Tag, title: 'Créez vos forfaits', desc: 'Durée, prix, débit, appareils.' },
  { icon: Wallet, title: 'Encaissez', desc: 'Vos gains arrivent dans votre portefeuille.' },
];

const comparison = [
  { title: 'Sauvegarde automatique', others: 'Abonnement mensuel', ours: 'Incluse, script à vie' },
  { title: 'Codes & QR codes', others: 'Messages WhatsApp facturés', ours: 'Illimités, sans frais' },
  { title: 'Répartition de charge', others: 'Option facturée très cher', ours: 'Multi-WAN + failover, option unique de 3 000 F' },
  { title: 'Tarifs', others: 'Frais cachés et de mise en service', ours: 'Prix fixe, 6 500 F/mois pour 10 routeurs · retrait 5 %' },
];

export default function HomePage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<ShowcaseKey>('vlan');
  const [userPicked, setUserPicked] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Si l'utilisateur est déjà connecté, on l'envoie directement au tableau de bord
    try {
      if (localStorage.getItem('token')) {
        router.replace('/dashboard');
      }
    } catch {}
  }, [router]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBar(window.scrollY > 520);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Rotation automatique des schémas (s'arrête dès que l'utilisateur choisit)
  useEffect(() => {
    if (userPicked) return;
    const id = setInterval(() => {
      setActive((a) => (a === 'vlan' ? 'lb' : a === 'lb' ? 'failover' : 'vlan'));
    }, 9500);
    return () => clearInterval(id);
  }, [userPicked]);

  if (!mounted) return null;

  const current = showcases.find((s) => s.key === active)!;
  const Diagram = current.Diagram;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 scroll-smooth overflow-x-clip">
      <style>{`
        @keyframes lp-ok { 0%,30%{opacity:1} 34%,70%{opacity:0} 74%,100%{opacity:1} }
        @keyframes lp-failcycle { 0%,30%{opacity:0} 34%,70%{opacity:1} 74%,100%{opacity:0} }
        .lp-ok { animation: lp-ok 9s infinite; }
        .lp-fail { animation: lp-failcycle 9s infinite; }
        @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .lp-float { animation: lp-float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lp-ok,.lp-fail,.lp-float { animation: none; }
          .lp-fail { opacity: 0; }
        }
      `}</style>

      {/* ================= BARRE DU HAUT ================= */}
      <header
        className={`fixed top-0 inset-x-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-300 ${
          scrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 active:opacity-80">
              <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <BrandMark />
              </span>
              <span className="text-lg font-extrabold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">MbeejFepal</span>
            </Link>
            <a
              href="#nouveautes"
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-bold text-amber-300 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Nouveau · VLAN, Load balancing &amp; Failover
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 rounded-full text-sm font-bold text-gray-200 hover:text-white active:scale-95 transition-all">
              Connexion
            </Link>
            <Link href="/register" className="px-4 py-2 rounded-full text-sm font-extrabold bg-amber-500 text-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/videos/wifi-zone-poster.jpg"
        >
          <source src="/videos/wifi-zone.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(217,119,6,0.3)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.12)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="w-full">
            <SlideFrames />
          </motion.div>
        </div>
      </section>

      {/* ================= NOUVEAUTÉS : SCHÉMAS ANIMÉS ================= */}
      <section id="nouveautes" className="relative py-20 sm:py-28 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(217,119,6,0.12)_0%,transparent_55%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} transition={{ duration: 0.6 }} className="mb-8">
            <VideoBlock src={VIDEO_NOUVEAUTES} label="Présentation des nouveautés" />
          </motion.div>

          {/* Sélecteur */}
          <div role="tablist" className="grid grid-cols-3 bg-white/5 border border-white/10 rounded-2xl p-1 mb-5 max-w-xl mx-auto">
            {showcases.map((s) => {
              const on = s.key === active;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setActive(s.key);
                    setUserPicked(true);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                    on ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Scène */}
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
            <div className="absolute inset-0 opacity-60 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:26px_26px]" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

            <div className="relative px-3 sm:px-8 pt-8 pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                >
                  <Diagram />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative px-5 sm:px-8 pb-7 text-center">
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{current.title}</h3>
                  <p className="mt-2 text-gray-400">{current.desc}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {current.chips.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-200">
                        <Check className="w-3.5 h-3.5 text-amber-500" strokeWidth={3} /> {c}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TOUT EST INCLUS : TUILES ================= */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-10">
            <span className="inline-block bg-white/5 border border-white/10 text-amber-500 px-4 py-1.5 rounded-full text-[11px] font-extrabold tracking-widest uppercase mb-4">
              Tout est inclus
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Tout ce qu&apos;il faut, au même endroit.</h2>
          </motion.div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {tiles.map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: (i % 3) * 0.07 }}
                  className="flex flex-col items-center text-center gap-3 rounded-[24px] bg-gradient-to-br from-gray-900 to-black border border-white/10 p-4 sm:p-6 active:scale-95 transition-transform"
                >
                  <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-100 leading-tight">{t.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= EN 3 ÉTAPES ================= */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/videos/wifi-zone-poster.jpg" alt="" fill sizes="100vw" className="object-cover" aria-hidden="true" />
        </div>
        <div className="absolute inset-0 bg-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,119,6,0.2)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-12">
            <span className="inline-block bg-white/10 border border-white/15 text-amber-500 px-4 py-1.5 rounded-full text-[11px] font-extrabold tracking-widest uppercase mb-4 backdrop-blur-sm">
              Comment ça marche
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Lancez-vous en 3 étapes.</h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="relative overflow-hidden rounded-[28px] bg-black/50 backdrop-blur-md border border-white/10 p-5"
                >
                  <span className="absolute -right-2 -top-4 text-[88px] leading-none font-black text-white/[0.06] select-none">{i + 1}</span>
                  <span className="relative w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Icon className="w-6 h-6" />
                  </span>
                  <h3 className="relative mt-4 font-extrabold text-white leading-snug">{s.title}</h3>
                  <p className="relative mt-1 text-sm text-gray-400">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FACE AUX AUTRES ================= */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6">
        <div className="relative max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-10">
            <span className="inline-block bg-white/5 border border-white/10 text-amber-500 px-4 py-1.5 rounded-full text-[11px] font-extrabold tracking-widest uppercase mb-4">
              Nos avantages
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Face aux autres solutions.</h2>
          </motion.div>

          <div className="rounded-[28px] bg-gradient-to-br from-gray-900 to-black border border-white/10 overflow-hidden divide-y divide-white/5 shadow-xl">
            <div className="hidden sm:grid grid-cols-[1.1fr_1fr_1.4fr] gap-4 px-6 py-3 text-[11px] font-extrabold uppercase tracking-widest">
              <span />
              <span className="text-gray-500">Les autres</span>
              <span className="text-amber-500">MbeejFepal</span>
            </div>
            {comparison.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="px-5 sm:px-6 py-4 sm:grid sm:grid-cols-[1.1fr_1fr_1.4fr] sm:gap-4 sm:items-center"
              >
                <p className="font-extrabold text-white mb-2 sm:mb-0">{c.title}</p>
                <p className="flex items-start gap-2 text-sm text-gray-500 mb-1.5 sm:mb-0">
                  <X className="w-4 h-4 text-red-400/80 shrink-0 mt-0.5" strokeWidth={3} />
                  {c.others}
                </p>
                <p className="flex items-start gap-2 text-sm font-semibold text-gray-100">
                  <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={3} />
                  {c.ours}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VIDÉO ================= */}
      <section className="relative px-4 sm:px-6 pb-20 sm:pb-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeUp} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto">
          <VideoBlock src={VIDEO_FINALE} label="Présentation de MbeejFepal" />
        </motion.div>
      </section>

      {/* ================= TÉLÉPHONE ================= */}
      <section className="relative px-4 sm:px-6 pb-24 sm:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(217,119,6,0.14)_0%,transparent_55%)] pointer-events-none" />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeUp} transition={{ duration: 0.7 }} className="relative flex flex-col items-center text-center">
          <PhoneMock />
          <div className="mt-8 max-w-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-500">Réseau avancé</p>
            <h3 className="mt-1 text-2xl font-extrabold text-white leading-tight">VLAN, Multi-WAN et Failover.</h3>
            <p className="mt-1 text-sm text-gray-300">Pilotez tout depuis votre téléphone.</p>
          </div>
        </motion.div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative border-t border-white/10 bg-[#0f172a]/60 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Mail className="w-4 h-4 text-amber-500" />
            platform@mbeejfepal.com
          </p>
          <div className="mt-6 pt-5 border-t border-white/10 text-xs text-gray-500">© 2026 MbeejFepal. Tous droits réservés.</div>
        </div>
      </footer>

      {/* ================= BARRE D'ACTION MOBILE ================= */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent"
          >
            <Link
              href="/register"
              className="h-14 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-xl shadow-amber-600/30 active:scale-[0.98] transition-all"
            >
              Créer mon compte <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}