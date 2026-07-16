import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../../components/ui/dialog';
import { Camera, ArrowRight, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../../components/SEO';

const STATIC_SERVICES = [
  { id: '1', name: 'CERCAS ELETRIFICADAS', image: 'https://images.unsplash.com/photo-1557597774-9d2739f85a76?auto=format&fit=crop&q=80&w=800' },
  { id: '2', name: 'INSTALAÇÕES DE CONCERTINAS', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800' },
  { id: '3', name: 'PROJETOS ELÉTRICOS', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800' },
  { id: '4', name: 'REPAROS ELÉTRICOS', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800' },
  { id: '5', name: 'AUTOMATIZADORES ELETRÔNICOS', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=800' },
  { id: '6', name: 'SISTEMAS DE CFTV', image: 'https://images.unsplash.com/photo-1557597774-9d2739f85a76?auto=format&fit=crop&q=80&w=800' },
  { id: '7', name: 'CONTROLE DE ACESSO', image: 'https://images.unsplash.com/photo-1551829142-d9b812bb3d2f?auto=format&fit=crop&q=80&w=800' },
  { id: '8', name: 'INSTALAÇÕES ELÉTRICAS', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800' },
];

const BRANDS = [
  "JFL", "HIKVISION", "intelbras", "WEG", "SIEMENS", "STECK", "HDL", "PROTEC"
];

interface Portfolio {
  id: string;
  title: string;
  description: string;
  category: string;
  photoUrl: string | null;
  mediaUrls?: string[];
}

// Componente focado na experiência de visualização do projeto (Carousel Premium com Lightbox)
function ProjectMediaViewer({ items }: { items: string[] }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollPos = scrollRef.current.scrollLeft;
      const width = scrollRef.current.clientWidth;
      if (width > 0) {
        const index = Math.round(scrollPos / width);
        if (index !== currentIndex) setCurrentIndex(index);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({ left: index * width, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Viewer Header Info (Innovative element) */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">
              {currentIndex + 1} / {items.length}
            </span>
          </div>
          {items[currentIndex]?.includes('youtube.com') || items[currentIndex]?.includes('youtu.be') ? (
            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Vídeo</span>
          ) : (
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">Foto</span>
          )}
        </div>
        
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex gap-1">
            {items.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative group/viewer overflow-hidden rounded-[2.5rem] md:rounded-[4rem] bg-slate-900 border border-white/10 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)]">
        {/* Progress bar top */}
        <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-white/5">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          className={`flex overflow-x-auto snap-x snap-mandatory hide-scrollbar select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((url, index) => {
            const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return (
              <div key={index} className="flex-shrink-0 w-full h-[60vh] sm:h-[70vh] md:h-[80vh] min-h-[400px] max-h-[900px] snap-center flex items-center justify-center relative overflow-hidden bg-black/60">
                {/* Background blur with Ken Burns effect */}
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-30 blur-[120px] pointer-events-none scale-110"
                  style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                
                {ytMatch ? (
                  <div className="relative z-10 w-full h-full p-3 sm:p-6 md:p-12">
                    <iframe 
                      src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1`}
                      className="w-full h-full rounded-3xl md:rounded-[3.5rem] shadow-2xl border border-white/10"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-8 md:p-16">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={url}
                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                        className="relative w-full h-full flex items-center justify-center"
                      >
                        <img 
                          src={url} 
                          alt={`Mídia ${index + 1}`} 
                          className="max-w-full max-h-full w-auto h-auto object-contain rounded-3xl md:rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 transition-transform duration-1000 group-hover/viewer:scale-[1.02]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/30 via-transparent to-white/5 pointer-events-none rounded-3xl md:rounded-[4rem]" />
                      </motion.div>
                    </AnimatePresence>

                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedImage(url)}
                      className="absolute bottom-6 right-6 md:bottom-12 md:right-12 p-6 rounded-[2rem] bg-slate-950/80 backdrop-blur-2xl text-white border border-white/20 opacity-0 group-hover/viewer:opacity-100 transition-all hover:bg-primary hover:border-primary/50 shadow-3xl z-30"
                    >
                      <Maximize2 className="w-7 h-7" />
                    </motion.button>
                  </div>
                )}
              </div>
            );
          })}
        </div>


        {/* Navigation Overlays */}
        {items.length > 1 && (
          <>
            <motion.button 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: currentIndex === 0 ? 0 : 1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => scrollTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className={`absolute left-6 md:left-10 top-1/2 -translate-y-1/2 p-5 rounded-3xl bg-slate-950/50 backdrop-blur-xl text-white border border-white/10 transition-all z-20 shadow-2xl hover:bg-primary ${currentIndex === 0 ? 'invisible pointer-events-none' : ''}`}
            >
              <ChevronLeft className="w-8 h-8" />
            </motion.button>
            <motion.button 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: currentIndex === items.length - 1 ? 0 : 1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => scrollTo(currentIndex + 1)}
              disabled={currentIndex === items.length - 1}
              className={`absolute right-6 md:right-10 top-1/2 -translate-y-1/2 p-5 rounded-3xl bg-slate-950/50 backdrop-blur-xl text-white border border-white/10 transition-all z-20 shadow-2xl hover:bg-primary ${currentIndex === items.length - 1 ? 'invisible pointer-events-none' : ''}`}
            >
              <ChevronRight className="w-8 h-8" />
            </motion.button>
          </>
        )}
      </div>

      {/* Thumbnails / Indicators */}
      {items.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-4 px-4">
          {items.map((url, index) => {
            const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return (
              <motion.button
                key={index}
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo(index)}
                className={`relative w-20 h-16 md:w-24 md:h-20 rounded-2xl overflow-hidden border-2 transition-all duration-500 ${currentIndex === index ? 'border-primary ring-8 ring-primary/10 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'border-white/10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
              >
                <img src={ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/0.jpg` : url} className="w-full h-full object-cover" alt="thumbnail" />
                {ytMatch && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                    <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center pl-0.5 shadow-lg backdrop-blur-sm">
                      <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent"></div>
                    </div>
                  </div>
                )}
                {currentIndex === index && (
                  <motion.div layoutId="thumb-active" className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary" />
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/98 backdrop-blur-3xl p-2 md:p-12 overflow-hidden"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 right-6 md:top-10 md:right-10 flex items-center gap-4 z-[210]"
            >
              <span className="hidden md:block text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Toque para fechar</span>
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.9)' }}
                whileTap={{ scale: 0.9 }}
                className="p-5 rounded-3xl bg-white/5 text-white hover:bg-red-500 transition-colors shadow-2xl border border-white/10"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-8 h-8" />
              </motion.button>
            </motion.div>
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage} 
                className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_150px_rgba(0,0,0,0.8)] border border-white/5 select-none" 
                alt="Fullscreen View" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none rounded-3xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [categoryPhotos, setCategoryPhotos] = useState<Record<string, string>>({});
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when opening the page
    window.scrollTo(0, 0);

    // Listens for customized category images
    const unsubCats = onSnapshot(doc(db, 'site_settings', 'categories'), 
      (docSnap) => {
        if (docSnap.exists()) {
          setCategoryPhotos(docSnap.data().images || {});
        }
        setCategoriesLoaded(true);
      },
      (err) => {
        console.error("Error loading category images:", err);
        setCategoriesLoaded(true);
      }
    );

    async function fetchData() {
      setLoading(true);
      try {
        // Query for portfolio items - fetching and then filtering to avoid index requirements
        const portSnap = await getDocs(query(collection(db, 'portfolio'), limit(30)));
        const p: Portfolio[] = [];
        portSnap.forEach(d => {
          const data = d.data();
          // Show if isPublic is not explicitly false (handles legacy data)
          if (data.isPublic !== false) {
             p.push({ id: d.id, ...data } as Portfolio);
          }
        });
        
        // Sort manually by date
        setPortfolio(p.sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0)));
      } catch (e: any) {
        console.error("Error loading portfolio data:", e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    
    return () => {
      unsubCats();
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-12 pb-24 pt-32 relative overflow-hidden"
    >
      <SEO 
        title="Nosso Portfólio de Projetos | RA Elétrica, Automação e Segurança Eletrônica"
        description="Conheça nossos projetos executados de instalação elétrica residencial/comercial, cercas de segurança, concertinas de proteção, automação de portões e CFTV profissional."
        keywords="portfólio, projetos elétricos, sistemas de cftv, cercas elétricas, concertinas, automação de ambientes, elétrica, Renan Augusto, RA"
        ogType="website"
      />
      <div className="absolute inset-0 bg-dot-pattern opacity-5 -z-10"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Portfolio Header */}
      <section className="container mx-auto px-4 text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-4"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Projetos Executados</span>
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-slate-900 uppercase italic"
        >
          PORTFÓLIO & <br/> <span className="text-primary italic">TECNOLOGIA</span>
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
        >
          Soluções avançadas em elétrica de potência, automação inteligente e segurança eletrônica de alto nível.
        </motion.p>
      </section>

      {/* Services Section */}
      <section id="services" className="mx-auto w-full bg-slate-950 text-slate-50 pt-32 pb-0 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between items-center text-center md:text-left mb-24 gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                ÁREAS DE <br/> <span className="text-primary">ATUAÇÃO</span>
              </h2>
              <div className="w-24 h-1.5 bg-primary rounded-full"></div>
            </div>
            <p className="text-slate-400 font-medium max-w-md text-sm italic">
               Atendimento especializado para residências, condomínios e indústrias que buscam o mais alto padrão técnico.
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto mb-32">
            {!categoriesLoaded ? (
              STATIC_SERVICES.map((s) => (
                <div key={s.id} className="relative bg-slate-900/50 rounded-[2rem] aspect-[4/5] border border-white/5 animate-pulse"></div>
              ))
            ) : (
              STATIC_SERVICES.map((s, idx) => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="relative group overflow-hidden bg-slate-900 rounded-[2rem] aspect-[4/5] border border-white/5 hover:border-primary/50 transition-all duration-700"
              >
                <img 
                  key={categoryPhotos[s.id] || s.image}
                  src={categoryPhotos[s.id] || s.image} 
                  alt={s.name} 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== s.image && !target.src.includes(s.image)) {
                      target.src = s.image;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                  <div className="transform transition-transform duration-700">
                    <div className="text-[10px] font-black tracking-[0.2em] text-primary mb-3 uppercase opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
                       Tecnologia Certificada
                    </div>
                    <h3 className="text-lg md:text-xl font-black italic tracking-tight text-white leading-tight uppercase group-hover:text-primary transition-colors duration-500">
                      {s.name}
                    </h3>
                  </div>
                </div>
              </motion.div>
            )))}
          </div>

          {/* Marquee Banner - Reinvented as Tech Slider */}
          <div className="w-screen relative left-1/2 -translate-x-1/2 bg-slate-900/40 backdrop-blur-xl border-t border-white/5 py-10 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 z-10 pointer-events-none"></div>
            <div className="flex w-max animate-marquee flex-nowrap items-center group-hover:pause-animation">
              <div className="flex flex-shrink-0 items-center gap-24 pr-24">
                {BRANDS.map((brand, i) => (
                  <span key={'a'+i} className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-slate-100 hover:text-primary transition-all duration-500 cursor-none select-none opacity-60 hover:opacity-100 whitespace-nowrap">
                    {brand}
                  </span>
                ))}
              </div>
              <div className="flex flex-shrink-0 items-center gap-24 pr-24" aria-hidden="true">
                {BRANDS.map((brand, i) => (
                  <span key={'b'+i} className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-slate-100 hover:text-primary transition-all duration-500 cursor-none select-none opacity-60 hover:opacity-100 whitespace-nowrap">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Meus Trabalhos Section (Higher visibility) */}
      <section id="portfolio" className="container mx-auto px-4 mt-40">
        <div className="flex flex-col items-center text-center gap-6 mb-20">
           <div className="flex items-center gap-4 w-full">
              <div className="h-px bg-slate-200 flex-1"></div>
              <div className="flex items-center gap-3 italic">
                 <Camera className="w-5 h-5 text-primary" />
                 <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">TRABALHOS REAIS</h2>
              </div>
              <div className="h-px bg-slate-200 flex-1"></div>
           </div>
           <p className="text-slate-500 font-medium max-w-xl">
             Transparência e qualidade em cada centímetro de fiação. Confira fotos reais de nossa execução no dia a dia.
           </p>
        </div>
        
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Sincronizando Portfólio</span>
            </div>
          ) : portfolio.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-32 bg-slate-50 border border-slate-200 rounded-[3rem] border-dashed flex flex-col items-center"
            >
               <div className="p-6 bg-white rounded-3xl shadow-xl shadow-slate-200 mb-6">
                 <Camera className="w-10 h-10 text-slate-200" />
               </div>
               <p className="text-slate-900 font-black text-xl uppercase tracking-tight italic">Nenhum projeto público ainda</p>
               <p className="text-slate-400 text-sm mt-2 max-w-xs font-medium italic">Estamos selecionando nossas melhores entregas para mostrar aqui em breve.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {portfolio.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Dialog>
                    <DialogTrigger
                      render={
                        <button type="button" className="text-left w-full block bg-transparent p-0 border-none relative group transition-all duration-500 cursor-pointer outline-none">
                          <Card className="overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] shadow-none group-hover:border-primary/20 group-hover:shadow-2xl group-hover:shadow-primary/10 transition-all duration-700 h-full flex flex-col">
                            <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                              {p.photoUrl ? (
                                <img src={p.photoUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                              ) : (p.mediaUrls && p.mediaUrls.length > 0) ? (
                                <img src={p.mediaUrls[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full text-slate-300">
                                  <Camera className="w-8 h-8" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-overlay duration-700" />
                              
                              <div className="absolute top-4 left-4">
                                <div className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-white/10 tracking-widest leading-none">
                                  {p.category || 'PROJETO'}
                                </div>
                              </div>

                              {(p.mediaUrls && p.mediaUrls.filter(url => url !== p.photoUrl).length > 0) && (
                                <div className="absolute bottom-4 right-4 bg-white text-slate-900 text-[10px] font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl border border-slate-100">
                                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                  +{p.mediaUrls.filter(url => url !== p.photoUrl).length} FOTOS/VÍDEOS
                                </div>
                              )}
                            </div>
                            <CardHeader className="p-8 pb-4 flex-1">
                              <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors tracking-tighter uppercase italic leading-none">{p.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8">
                              <CardDescription className="line-clamp-2 text-slate-500 font-medium text-sm leading-relaxed italic">{p.description}</CardDescription>
                              <div className="mt-8 flex items-center justify-between">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Resumo Técnico</span>
                                 <div className="p-2 bg-slate-50 group-hover:bg-primary transition-colors rounded-xl">
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                 </div>
                              </div>
                            </CardContent>
                          </Card>
                        </button>
                      }
                    />
                    
                    <DialogContent className="max-w-[1400px] w-[98vw] h-[98vh] p-0 md:p-4 overflow-hidden rounded-none md:rounded-[4rem] border-none md:border md:border-white/10 bg-slate-950 shadow-[0_0_100px_rgba(0,0,0,1)]">
                       <div className="flex flex-col h-full bg-slate-950 md:rounded-[3.5rem] overflow-hidden relative">
                         <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                           <div className="p-4 md:p-12 space-y-12">
                            <header className="relative space-y-6 pt-10 md:pt-0">
                               <div className="space-y-4">
                                 <motion.div 
                                   initial={{ opacity: 0, x: -20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10"
                                 >
                                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--color-primary),0.8)]"></div>
                                   <span className="text-[11px] font-black text-white/70 tracking-[0.3em] uppercase">{p.category}</span>
                                 </motion.div>
                                 <DialogTitle className="text-4xl sm:text-6xl md:text-8xl font-[1000] text-white italic tracking-tighter leading-[0.85] uppercase break-words drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                                    {p.title}
                                 </DialogTitle>
                                 <div className="w-24 md:w-48 h-3 bg-primary rounded-full shadow-[0_0_40px_rgba(59,130,246,0.8)]"></div>
                               </div>
                            </header>
                            
                            <div className="space-y-12">
                               {(() => {
                                 const mainImage = p.photoUrl || (p.mediaUrls && p.mediaUrls.length > 0 ? p.mediaUrls[0] : null);
                                 const allMedia = Array.from(new Set([
                                   ...(mainImage ? [mainImage] : []),
                                   ...(p.mediaUrls || [])
                                 ]));
                                 
                                 if (allMedia.length === 0) return null;
                                 
                                 return (
                                   <div className="space-y-12 pb-12">
                                     <ProjectMediaViewer items={allMedia} />
                                     
                                     <div className="space-y-8 max-w-5xl mx-auto">
                                       <DialogDescription className="text-slate-300 text-base md:text-xl leading-relaxed font-medium italic block bg-white/5 p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-inner">
                                         {p.description}
                                       </DialogDescription>

                                       {allMedia.length > 1 && (
                                         <div className="pt-6 border-t border-white/5">
                                           <div className="flex items-center gap-4 mb-4">
                                             <div className="p-2 bg-primary/10 rounded-xl">
                                               <Camera className="w-5 h-5 text-primary" />
                                             </div>
                                             <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Galeria do Projeto</h3>
                                           </div>
                                           <p className="text-slate-400 text-sm font-medium italic">
                                             Este projeto possui {allMedia.length} mídias registradas. Deslize acima para conferir cada detalhe da execução. Clique no ícone de expansão para tela cheia.
                                           </p>
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 );
                               })()}
                            </div>
                           </div>
                         </div>
                       </div>
                     </DialogContent>
                  </Dialog>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </section>

      <section className="container mx-auto px-4 mt-20 text-center pb-24">
        <Link to="/#contact" className="group">
          <Button variant="outline" className="rounded-full border-2 border-primary/20 hover:border-primary text-primary hover:bg-primary/5 transition-all px-10 h-16 text-lg font-black italic tracking-tighter uppercase">
            SOLICITAR ORÇAMENTO <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
          </Button>
        </Link>
      </section>
    </motion.div>
  );
}
