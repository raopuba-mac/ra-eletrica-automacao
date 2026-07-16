import React from 'react';
import { useEffect, useState } from 'react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Button, buttonVariants } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { addDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Phone, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import perfilImg from './perfil.jpg';
import SEO from '../../components/SEO';

const BRANDS = [
  "JFL", "HIKVISION", "intelbras", "WEG", "SIEMENS", "STECK", "HDL", "PROTEC"
];

export default function Home() {
  const [phone, setPhone] = useState('5534992609206');
  const [profileName, setProfileName] = useState('Renan Augusto');
  const [companyName, setCompanyName] = useState('Elétrica, Automação e Segurança Eletrônica');
  const [bio, setBio] = useState('Olá! Eu sou Renan Augusto. Tenho dedicado minha carreira a oferecer soluções de alta qualidade em elétrica e automação.');
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  useEffect(() => {
    async function loadPublicData() {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
        if (!usersSnap.empty) {
          const u = usersSnap.docs[0].data();
          if (u.whatsappInfo) {
            const p = String(u.whatsappInfo).replace(/\D/g, '');
            setPhone(p.startsWith('55') ? p : (p ? '55' + p : '5534992609206'));
          }
          if (u.name) setProfileName(u.name);
          if (u.companyName) setCompanyName(u.companyName);
          if (u.bio) setBio(u.bio);
        }
      } catch(err) {
        console.warn("Could not fetch user config for whatsapp.", err);
      }
    }
    loadPublicData();
  }, []);

  const handleWhatsApp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      serviceType: formData.get('serviceType') as string,
    };

    const msg = `Olá! Meu nome é ${data.name}.\nPreciso de um serviço de: ${data.serviceType}.\nEndereço: ${data.address}\nTelefone: ${data.phone}`;
    const destinationPhone = phone && phone.trim() !== '' ? phone : '5534992609206';
    window.open(`https://wa.me/${destinationPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    
    formElement.reset();
    setIsContactDialogOpen(false);
    
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
      let ownerId = 'admin';
      if (!usersSnap.empty) {
        ownerId = usersSnap.docs[0].id;
      }

      await addDoc(collection(db, 'leads'), {
        userId: ownerId,
        ...data,
        status: 'new',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (e) {
      console.error('Erro ao salvar lead:', e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-24 pb-24 bg-grid-slate-100"
    >
      <SEO 
        title="RA Elétrica, Automação e Segurança Eletrônica | Soluções Profissionais"
        description="Serviços especializados de elétrica residencial e industrial, instalação de cercas elétricas, automatizadores, câmeras de segurança (CFTV) e automação em geral comandados por Renan Augusto."
        keywords="elétrica, automação, segurança eletrônica, cerca elétrica, concertina, CFTV, interfone, instalação elétrica, Renan Augusto, RA"
        ogType="website"
      />
      {/* Hero Section */}
      <section className="bg-slate-950 text-white mt-[-80px] pt-44 pb-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/20 blur-[120px] -z-0"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs md:text-sm font-extrabold tracking-widest uppercase mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              Disponível para Novos Projetos
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
            >
              ELÉTRICA <span className="text-primary">&</span><br/> 
              AUTOMAÇÃO
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl text-slate-200 mb-12 max-w-3xl mx-auto leading-relaxed font-normal"
            >
              Soluções inteligentes em segurança eletrônica, controle de acesso e infraestrutura elétrica de alto padrão. Tecnologia a serviço da sua proteção.
            </motion.p>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <a href="#contact" className={cn(buttonVariants({ size: "lg" }), "bg-primary hover:bg-primary/90 text-white rounded-full px-12 py-8 h-auto text-xl font-black shadow-2xl shadow-primary/40 uppercase tracking-tighter italic")}>
                Solicitar Visita Técnica
              </a>
              <Link to="/portfolio" className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "rounded-full px-12 py-8 h-auto border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 text-xl font-black uppercase tracking-tighter italic backdrop-blur-sm")}>
                Ver Portfólio
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Brands / Trusted by */}
      <section className="container mx-auto px-4 overflow-hidden -mt-12">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-8 shadow-xl relative z-20">
          <p className="text-center text-sm font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-8">Trabalhamos com as Melhores Marcas</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-80 hover:opacity-100 transition-all duration-700">
            {BRANDS.map(brand => (
              <span key={brand} className="text-2xl font-black tracking-tighter text-slate-900">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE MIM - Refined */}
      <section id="about" className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2 space-y-8">
            <div className="relative">
              <div className="absolute -top-8 -left-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
              <div className="w-full aspect-square max-w-[500px] rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl relative">
                 <img 
                   src={perfilImg} 
                   alt={profileName} 
                   className="w-full h-full object-cover"
                   loading="lazy"
                 />
              </div>
              <div className="mt-6 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 max-w-sm lg:absolute lg:-bottom-8 lg:right-0 lg:mt-0 z-10 transition-transform hover:scale-105">
                 <p className="text-primary font-black uppercase text-xs md:text-sm tracking-widest mb-1.5">Fundador & Técnico Especialista</p>
                 <h3 className="text-3xl md:text-4xl font-black text-slate-900 italic tracking-tighter uppercase">{profileName}</h3>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs md:text-sm font-black tracking-widest uppercase mb-2">
               Trajetória Profissional
            </div>
            <h2 className="text-6xl md:text-7xl font-[1000] tracking-tighter text-slate-900 leading-[0.85] uppercase italic">
              Excelência <br/> <span className="text-primary">em cada detalhe</span>.
            </h2>
            <div className="space-y-6 text-slate-700 text-lg sm:text-xl leading-relaxed">
              <p className="text-xl md:text-2xl font-semibold text-slate-900 border-l-4 border-primary pl-6 py-2 bg-slate-50 rounded-r-xl">
                "{bio}"
              </p>
              <p className="max-w-xl">
                Minha missão é unir <strong>estética, organização e segurança</strong>, entregando projetos que superam expectativas e garantem a total tranquilidade de quem confia no meu trabalho.
              </p>
              <div className="space-y-6 mt-10">
                {[
                  { title: "Atendimento Premium", desc: "Cada cliente é tratado como prioridade absoluta, com atenção a cada detalhe." },
                  { title: "Suporte que Encanta", desc: "Acompanhamento dedicado e humanizado em todas as etapas da obra." },
                  { title: "Serviço de Confiança", desc: "Garantia validada com excelência técnica e total transparência." },
                  { title: "Alta Performance", desc: "Durabilidade, sofisticação e tecnologia de ponta em cada entrega." }
                ].map((item, i) => (
                  <motion.div 
                    key={item.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                      <div className="w-2 h-2 rounded-full bg-primary group-hover:bg-white animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-1.5">
                        {item.title}
                      </h4>
                      <p className="text-slate-600 text-base md:text-lg font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services Overview */}
      <section className="bg-slate-900 py-24 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-slate-100 opacity-[0.03]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">SOLUÇÕES COMPLETAS</h2>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">Do projeto à execução, cuidamos de toda a infraestrutura tecnológica do seu imóvel.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { title: "Elétrica", desc: "Instalações de baixa tensão, quadros e manutenção." },
               { title: "Automação", desc: "Controle por voz, iluminação inteligente e conforto." },
               { title: "Segurança", desc: "Câmeras 4k, alarmes monitorados e acesso remoto." }
             ].map((s, idx) => (
               <div key={idx} className="bg-white/5 border border-white/10 p-10 rounded-[2rem] hover:bg-white/10 transition-all hover:translate-y-[-8px]">
                  <div className="text-primary font-black text-6xl mb-6">0{idx+1}</div>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-4">{s.title}</h3>
                  <p className="text-slate-300 text-lg leading-relaxed">{s.desc}</p>
               </div>
             ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link to="/portfolio" className="text-primary font-bold inline-flex items-center group">
               Explorar Galeria de Projetos <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section - Industrial Dark */}
      <section id="contact" className="container mx-auto px-4 mb-24">
        <div className="bg-primary rounded-[3rem] p-12 md:p-24 text-white relative overflow-hidden flex flex-col items-center text-center shadow-3xl shadow-primary/30">
          <div className="absolute top-0 left-0 w-full h-full bg-dot-pattern opacity-20"></div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="relative z-10 max-w-2xl"
          >
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">VAMOS DAR UM UPGRADE NO SEU PROJETO?</h2>
            <p className="text-blue-50 text-xl md:text-2xl mb-12 font-medium leading-relaxed">
              Transforme sua casa ou empresa com o que há de mais moderno em elétrica e segurança. Atendimento rápido via WhatsApp.
            </p>
            
            <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
              <DialogTrigger 
                render={
                  <Button className="bg-white text-primary hover:bg-slate-100 rounded-full px-12 py-8 h-auto text-xl font-black shadow-xl group">
                    <Phone className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" /> INICIAR ATENDIMENTO
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-8 border-none bg-slate-50">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-3xl font-black tracking-tight">DADOS DO SERVIÇO</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleWhatsApp} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-bold flex items-center gap-2">👨 Nome Completo</Label>
                    <Input id="name" name="name" required placeholder="Ex: João da Silva" className="rounded-xl h-12 border-slate-200 bg-white" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">📱 WhatsApp</Label>
                      <Input id="phone" name="phone" required placeholder="(34) 99999-9999" className="rounded-xl h-12 border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">📩 E-mail</Label>
                      <Input id="email" name="email" type="email" placeholder="email@exemplo.com" className="rounded-xl h-12 border-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">📍 Endereço / Cidade</Label>
                    <Input id="address" name="address" placeholder="Bairro e Cidade" className="rounded-xl h-12 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">🛠 Tipo de Serviço</Label>
                    <Input id="serviceType" name="serviceType" required placeholder="Ex: Câmeras, Elétrica, etc." className="rounded-xl h-12 border-slate-200" />
                  </div>
                  <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-14 text-lg font-bold mt-4">
                    ENVIAR E CHAMAR NO WHATSAPP
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
