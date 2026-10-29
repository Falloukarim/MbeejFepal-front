'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  ArrowRight,
  Router as RouterIcon,
  Tag,
  Wallet,
  BarChart3,
  ShieldCheck,
  Smartphone,
  Network,
  Server,
  Palette,
  CreditCard,
  Banknote,
  QrCode,
  Users,
  Gauge,
  Check,
  Mail,
} from 'lucide-react';

// 6 cartes affichées 3 par 3 (2 en haut, 1 centrée en dessous) => 2 pages
const FEATURE_PAGES = 2;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

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
      // Progression du trait de la timeline selon le défilement
      const el = timelineRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = (vh * 0.65 - rect.top) / rect.height;
        setProgress(Math.min(1, Math.max(0, p)));
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setPage((p) => (p + 1) % FEATURE_PAGES), 4500);
    return () => clearInterval(id);
  }, [paused]);

  if (!mounted) return null;

  const features = [
    {
      icon: RouterIcon,
      title: 'Gestion des routeurs',
      desc: 'Ajoutez vos routeurs MikroTik en quelques minutes et suivez leur état en temps réel : en ligne, hors ligne, dernière connexion.',
    },
    {
      icon: Tag,
      title: 'Forfaits sur mesure',
      desc: "Créez vos offres : durée, prix, limite de débit et nombre d'appareils autorisés. Modifiez-les à tout moment.",
    },
    {
      icon: Wallet,
      title: 'Portefeuille intégré',
      desc: 'Suivez vos revenus, consultez votre solde et gardez le contrôle sur chaque transaction de votre zone WiFi.',
    },
    {
      icon: BarChart3,
      title: 'Statistiques claires',
      desc: "Visualisez les sessions actives, les appareils connectés et l'activité de vos hotspots depuis un seul tableau de bord.",
    },
    {
      icon: ShieldCheck,
      title: 'Sécurisé et fiable',
      desc: 'Connexions chiffrées entre vos routeurs et la plateforme, accès protégé par authentification.',
    },
    {
      icon: Smartphone,
      title: 'Accessible partout',
      desc: 'Pilotez votre activité depuis votre téléphone, votre tablette ou votre ordinateur, sans rien installer.',
    },
  ];

  const steps = [
    {
      title: 'Connectez votre routeur',
      desc: 'Créez votre compte, ajoutez votre routeur et appliquez la configuration fournie.',
    },
    {
      title: 'Définissez vos forfaits',
      desc: 'Choisissez durées, tarifs et limites de débit adaptés à vos clients.',
    },
    {
      title: 'Encaissez vos revenus',
      desc: 'Vos clients se connectent et paient, vos gains arrivent dans votre portefeuille.',
    },
  ];

  const techGroups = [
    {
      icon: Network,
      title: 'Réseau & Infrastructure',
      subtitle: 'Zéro configuration',
      items: [
        {
          icon: ShieldCheck,
          title: 'Tunnel VPN WireGuard intégré',
          desc: "Le routeur se connecte de manière sécurisée à notre serveur sans adresse IP publique. Tout est automatisé via un simple script à copier-coller.",
        },
        {
          icon: Server,
          title: 'Gestion multi-routeurs',
          desc: "Gérez tous vos points d'accès depuis un tableau de bord unique, où que vous soyez dans le monde.",
        },
        {
          icon: Palette,
          title: 'Portail captif sur mesure',
          desc: 'Personnalisez entièrement le portail client : logo, couleurs, nom de votre WiFi, pour coller à votre image de marque.',
        },
      ],
    },
    {
      icon: CreditCard,
      title: 'Monétisation & Paiement',
      subtitle: 'Vos ventes, automatisées',
      items: [
        {
          icon: CreditCard,
          title: 'Paiement 100 % automatisé',
          desc: "Paiement mobile (Wave, Orange Money, etc. via PayDunya). Le client paie, la session s'active instantanément.",
        },
        {
          icon: Wallet,
          title: 'Portefeuille en temps réel',
          desc: "Suivez vos revenus en temps réel. Chaque vente crédite votre compte après déduction d'une commission transparente.",
        },
        {
          icon: Banknote,
          title: 'Retrait direct',
          desc: 'Retirez vos gains directement et de manière sécurisée vers votre compte Wave.',
        },
      ],
    },
    {
      icon: QrCode,
      title: 'Partage & Sessions',
      subtitle: 'La force du système',
      items: [
        {
          icon: QrCode,
          title: "Codes d'accès & QR codes dynamiques",
          desc: 'Plus besoin de créer des tickets à la main : le système génère des codes uniques.',
        },
        {
          icon: Users,
          title: 'Multi-appareils intelligent',
          desc: "Un client peut acheter un forfait 2, 5 ou 10 appareils et partager son accès via un code ou un QR code, dans la limite définie.",
        },
        {
          icon: Gauge,
          title: 'Gestion des quotas',
          desc: 'Définissez des limites de consommation journalière (Go) pour éviter les abus sur votre bande passante.',
        },
      ],
    },
  ];

  const advantages = [
    {
      title: 'Sauvegarde automatique',
      others: "Un abonnement mensuel pour sauvegarder la configuration de vos routeurs,",
      ours: "Inclus. Votre script de configuration est généré à vie : routeur en panne ? Rachetez-en un, collez le script, tout est restauré en 2 minutes.",
    },
    {
      title: "Codes d'accès illimités",
      others: "Messages WhatsApp facturés à l'unité",
      ours: "Générez autant de codes ou de QR codes que vous voulez. Le QR code et le ticket s'affichent directement sur l'écran du client, sans frais cachés.",
    },
    {
      title: 'Répartition de charge',
      others: "Une option facturée très cher.",
      ours: "Une application optimisée pour une connexion directe et stable, sans frais exorbitants pour des fonctions réseau avancées dont la plupart des cybercafés n'ont pas besoin.",
    },
    {
      title: 'Transparence tarifaire',
      others: "Frais cachés sur les transactions, frais de mise en service",
      ours: "Un prix fixe, tout inclus : jusqu'à 10 routeurs pour 6 500 F/mois. Pas de frais d'installation, et une commission de retrait claire de 5 % sur vos gains.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 scroll-smooth">
      {/* ================= NAVBAR ================= */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 shadow-xl'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              MbeejFepal
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-200 hover:text-amber-500 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO : VIDEO + CARTES QUI DÉFILENT ================= */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Vidéo de fond */}
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

        {/* Voiles pour la lisibilité */}
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(217,119,6,0.25)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(217,119,6,0.12)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

        {/* Cartes : 2 par 2, aspirées puis remplacées */}
        <div
          className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative sm:min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.3, filter: 'blur(14px)' }}
                transition={{ duration: 0.6, ease: [0.45, 0, 0.2, 1] }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {features.slice(page * 3, page * 3 + 3).map((f, idx) => (
                  <div
                    key={f.title}
                    className={`group relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-md rounded-[32px] shadow-xl p-7 border border-white/10 hover:border-amber-500/50 transition-colors duration-300 ${
                      idx === 2 ? 'sm:col-span-2 sm:w-[calc(50%-0.75rem)] sm:justify-self-center' : ''
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 mb-5">
                        <f.icon className="w-6 h-6 text-amber-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicateurs */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: FEATURE_PAGES }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Afficher le groupe ${i + 1}`}
                onClick={() => setPage(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === page ? 'w-8 bg-amber-500' : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION : COMMENT ÇA MARCHE (timeline verticale, image en fond) ================= */}
      <section
        id="comment-ca-marche"
        className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden"
      >
        {/* Image de fond */}
        <div className="absolute inset-0">
          <Image
            src="/videos/wifi-zone-poster.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            aria-hidden="true"
          />
        </div>

        {/* Voile sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-black/75" />

        {/* Halo ambré pour conserver l'identité visuelle */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,119,6,0.18)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="inline-block bg-white/10 border border-white/15 text-amber-500 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 backdrop-blur-sm">
              Comment ça marche
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
              Lancez-vous en 3 étapes
            </h2>
          </motion.div>

          <div ref={timelineRef} className="relative">
            {/* Trait vertical : fond + remplissage qui suit le défilement */}
            <div className="absolute left-3 top-3 bottom-3 w-px bg-white/10">
              <div
                className="w-full bg-gradient-to-b from-amber-500 to-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.8)] transition-[height] duration-150 ease-out"
                style={{ height: `${progress * 100}%` }}
              />
            </div>

            <div className="space-y-24 sm:space-y-32 py-4">
              {steps.map((s, i) => (
                <div key={s.title} className="relative pl-12">
                  {/* Point sur le trait */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '0px 0px -30% 0px' }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="absolute left-0 top-6 w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-amber-500 flex items-center justify-center shadow-[0_0_16px_rgba(217,119,6,0.5)]"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                  </motion.div>

                  {/* Carte : apparaît quand on arrive à son niveau */}
                  <motion.div
                    initial={{ opacity: 0, x: 60, scale: 0.95 }}
                    whileInView={{ opacity: 1, x: 0, scale: 1 }}
                    viewport={{ once: true, margin: '0px 0px -30% 0px' }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="relative overflow-hidden bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-[32px] border border-white/10 hover:border-amber-500/40 transition-colors p-6 sm:p-7 shadow-xl"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10">
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-1.5">{s.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION : FONCTIONNALITÉS TECHNIQUES ================= */}
      <section id="fonctionnalites" className="relative py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="inline-block bg-white/5 border border-white/10 text-amber-500 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-4">
              Fonctionnalités techniques
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Tout ce qu&apos;il faut pour exploiter votre WiFi
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Du réseau au paiement, en passant par le partage d&apos;accès : tout est pensé pour fonctionner sans configuration compliquée.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {techGroups.map((g, gi) => (
              <motion.div
                key={g.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: gi * 0.12 }}
                className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] border border-white/10 shadow-xl p-7"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                      <g.icon className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white leading-tight">{g.title}</h3>
                      <p className="text-xs text-amber-500 font-medium mt-0.5">{g.subtitle}</p>
                    </div>
                  </div>

                  <ul className="divide-y divide-white/5">
                    {g.items.map((it) => (
                      <li key={it.title} className="py-4 first:pt-0 last:pb-0 flex gap-3">
                        <it.icon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">{it.title}</h4>
                          <p className="text-xs text-gray-400 leading-relaxed">{it.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION : NOS AVANTAGES ================= */}
      <section id="avantages" className="relative py-20 sm:py-28 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,119,6,0.08)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="inline-block bg-white/5 border border-white/10 text-amber-500 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-4">
              Nos avantages
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Face aux autres solutions
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Ce qui est souvent facturé en option ou en extra est inclus par défaut chez MbeejFepal.
            </p>
          </motion.div>

          <div className="space-y-4">
            {advantages.map((a, i) => (
              <motion.div
                key={a.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-[32px] border border-white/10 hover:border-amber-500/40 transition-colors shadow-xl p-6 sm:p-7"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-amber-500" strokeWidth={3} />
                  </span>
                  {a.title}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="px-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      Les autres
                    </p>
                    <p className="text-sm text-gray-400 leading-relaxed">{a.others}</p>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500 mb-1.5">
                      Chez MbeejFepal
                    </p>
                    <p className="text-sm text-gray-200 leading-relaxed">{a.ours}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3 bg-[#d97706] text-white font-bold rounded-xl hover:bg-[#b45309] transition-all shadow-lg shadow-amber-600/20"
            >
              Créer mon compte <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative border-t border-white/10 bg-[#0f172a]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
          <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
          <p className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Mail className="w-4 h-4 text-amber-500" />
            {/* Remplacez par votre vraie adresse */}
            contact@mbeejfepal.com
          </p>

          <div className="mt-10 pt-6 border-t border-white/10 text-xs text-gray-500">
            © 2026 MbeejFepal. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}