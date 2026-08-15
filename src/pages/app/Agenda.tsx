import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Calendar as CalIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { PageHeader } from '../../components/PageHeader';
import { useAgenda } from './Agenda/hooks/useAgenda';
import { AgendaForm } from './Agenda/components/AgendaForm';
import { AgendaPushWidget } from './Agenda/components/AgendaPushWidget';
import { AgendaStatsCard } from './Agenda/components/AgendaStatsCard';
import { AgendaEventCard } from './Agenda/components/AgendaEventCard';
import { AgendaDeleteModal } from './Agenda/components/AgendaDeleteModal';

export default function Agenda() {
  const {
    events,
    isDialogOpen,
    setIsDialogOpen,
    eventToDelete,
    setEventToDelete,
    form,
    setForm,
    notificationPermission,
    requestNotificationPermission,
    testPushNotification,
    resetForm,
    handleSubmit,
    confirmDelete,
  } = useAgenda();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Agenda"
        description="Organize seus serviços, visitas técnicas e lembretes com facilidade."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  size="lg"
                  className="shadow-lg shadow-blue-600/20"
                  onClick={() => resetForm()}
                >
                  <Plus className="w-4 h-4 mr-2" /> Novo Evento
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 border-b pb-2">
                  Agendar Compromisso
                </DialogTitle>
              </DialogHeader>
              <AgendaForm form={form} setForm={setForm} onSubmit={handleSubmit} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Bento stats and Push Trigger configs widget */}
        <div className="lg:col-span-1 space-y-6">
          <AgendaPushWidget
            notificationPermission={notificationPermission}
            onRequestPermission={requestNotificationPermission}
            onTestPush={testPushNotification}
          />
          <AgendaStatsCard events={events} />
        </div>

        {/* Right Side: Event schedule list */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="popLayout">
            {events.map((evt, i) => (
              <AgendaEventCard
                key={evt.id}
                evt={evt}
                index={i}
                onDeleteRequest={(target) => setEventToDelete(target)}
              />
            ))}
          </AnimatePresence>

          {events.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center border-2 border-dashed border-slate-800 bg-[#1E293B] rounded-[2.5rem]"
            >
              <CalIcon className="w-12 h-12 text-[#EAB308] opacity-80 mx-auto mb-4" />
              <h3 className="text-[#ffffff] font-extrabold text-xl uppercase tracking-tight italic">
                Sua agenda está vazia
              </h3>
              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                Adicione novos compromissos e agende visitas técnicas com um clique.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <AgendaDeleteModal
        eventToDelete={eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
