import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { FileText, Plus, Calendar, User, Lock, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface AppointmentNotesProps {
  clientId: string;
  businessId: string;
  preselectedAppointmentId?: string; // Nueva prop para pre-seleccionar una cita
}

interface AppointmentNote {
  id: string;
  appointment_id: string;
  client_id: string;
  business_id: string;
  staff_id: string | null;
  note: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  appointment?: {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    service?: {
      name: string;
    };
  };
  staff?: {
    id: string;
    full_name: string;
  };
}

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  service?: {
    name: string;
  };
}

export function AppointmentNotes({ clientId, businessId, preselectedAppointmentId }: AppointmentNotesProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<AppointmentNote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<AppointmentNote | null>(null);
  const [formData, setFormData] = useState({
    appointment_id: '',
    note: '',
    is_private: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
    loadAppointments();
  }, [clientId, businessId]);

  // Nuevo efecto para manejar la cita pre-seleccionada
  useEffect(() => {
    if (preselectedAppointmentId && appointments.length > 0) {
      // Verificar que la cita existe en la lista
      const appointmentExists = appointments.some(apt => apt.id === preselectedAppointmentId);
      if (appointmentExists) {
        setFormData(prev => ({
          ...prev,
          appointment_id: preselectedAppointmentId
        }));
        // Abrir automáticamente el diálogo de agregar nota
        setShowAddDialog(true);
      }
    }
  }, [preselectedAppointmentId, appointments]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointment_notes')
        .select(`
          *,
          appointment:appointments(
            id, 
            start_time, 
            end_time, 
            status,
            service:services(name)
          ),
          staff:profiles(id, full_name)
        `)
        .eq('client_id', clientId)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error(t('errorLoadingNotes'));
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, 
          start_time, 
          end_time, 
          status,
          service:services(name)
        `)
        .eq('client_id', clientId)
        .eq('business_id', businessId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleAddNote = async () => {
    if (!formData.appointment_id || !formData.note.trim()) {
      toast.error(t('completeRequiredFields'));
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('appointment_notes')
        .insert({
          appointment_id: formData.appointment_id,
          client_id: clientId,
          business_id: businessId,
          staff_id: profile?.id || null,
          note: formData.note.trim(),
          is_private: formData.is_private
        });

      if (error) throw error;

      toast.success(t('noteAddedSuccess'));
      setShowAddDialog(false);
      setFormData({ appointment_id: '', note: '', is_private: false });
      loadNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error(t('errorAddingNote'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditNote = async () => {
    if (!selectedNote || !formData.note.trim()) {
      toast.error(t('completeRequiredFields'));
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('appointment_notes')
        .update({
          note: formData.note.trim(),
          is_private: formData.is_private,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedNote.id);

      if (error) throw error;

      toast.success(t('noteUpdatedSuccess'));
      setShowEditDialog(false);
      setSelectedNote(null);
      setFormData({ appointment_id: '', note: '', is_private: false });
      loadNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error(t('errorUpdatingNote'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm(t('confirmDeleteNote'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointment_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast.success(t('noteDeletedSuccess'));
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error(t('errorDeletingNote'));
    }
  };

  const openEditDialog = (note: AppointmentNote) => {
    setSelectedNote(note);
    setFormData({
      appointment_id: note.appointment_id,
      note: note.note,
      is_private: note.is_private
    });
    setShowEditDialog(true);
  };

  const canEditNote = (note: AppointmentNote) => {
    return profile?.role === 'business_owner' || 
           profile?.role === 'admin' || 
           note.staff_id === profile?.id;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">{t('loadingNotes')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t('appointmentNotesTitle')}
              </CardTitle>
              <CardDescription>
                {t('appointmentNotesDescription')}
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('addNote')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No hay notas registradas para este cliente
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primera Nota
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    {/* Header de la nota */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {note.appointment?.service?.name || t('serviceDeletedLabel')}
                          </span>
                          {note.appointment && (
                            <span className="text-sm text-muted-foreground">
                              - {format(new Date(note.appointment.start_time), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {note.is_private && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              {t('privateLabel')}
                            </Badge>
                          )}
                          {note.appointment && (
                            <Badge 
                              variant={
                                note.appointment.status === 'completed' ? 'default' :
                                note.appointment.status === 'confirmed' ? 'secondary' :
                                note.appointment.status === 'cancelled' ? 'destructive' :
                                'outline'
                              }
                              className="text-xs"
                            >
                              {note.appointment.status === 'completed' && t('completed')}
                              {note.appointment.status === 'confirmed' && t('confirmed')}
                              {note.appointment.status === 'pending' && t('pending')}
                              {note.appointment.status === 'cancelled' && t('cancelled')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {canEditNote(note) && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(note)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Contenido de la nota */}
                    <div className="space-y-2">
                      <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                        {note.note}
                      </p>
                    </div>

                    {/* Footer de la nota */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span>
                          {note.staff?.full_name || t('userDeletedLabel')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>
                          Creada: {format(new Date(note.created_at), "d/MM/yyyy HH:mm", { locale: es })}
                        </span>
                        {note.updated_at !== note.created_at && (
                          <span>
                            Editada: {format(new Date(note.updated_at), "d/MM/yyyy HH:mm", { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar nota */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('addNoteToAppointment')}</DialogTitle>
            <DialogDescription>
              Agrega una nota sobre una cita específica del cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appointment">Cita *</Label>
              <select
                id="appointment"
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={formData.appointment_id}
                onChange={(e) => setFormData({ ...formData, appointment_id: e.target.value })}
              >
                <option value="">{t('selectAppointment')}</option>
                {appointments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.service?.name || t('noServiceAssigned')} - {format(new Date(apt.start_time), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Nota *</Label>
              <Textarea
                id="note"
                placeholder={t('notePlaceholder')}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_private"
                checked={formData.is_private}
                onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
              />
              <Label htmlFor="is_private" className="cursor-pointer">
                Nota privada (solo visible para el personal)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setFormData({ appointment_id: '', note: '', is_private: false });
              }}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleAddNote} disabled={saving}>
              {saving ? t('saving') : t('saveNote')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar nota */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('editNote')}</DialogTitle>
            <DialogDescription>
              Modifica la nota de la cita
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('appointment')}</Label>
              <div className="px-3 py-2 border rounded-md bg-muted/50">
                {selectedNote?.appointment?.service?.name || t('serviceDeletedLabel')}
                {selectedNote?.appointment && (
                  <span className="text-sm text-muted-foreground ml-2">
                    - {format(new Date(selectedNote.appointment.start_time), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_note">Nota *</Label>
              <Textarea
                id="edit_note"
                placeholder={t('notePlaceholder')}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_private"
                checked={formData.is_private}
                onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
              />
              <Label htmlFor="edit_is_private" className="cursor-pointer">
                Nota privada (solo visible para el personal)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedNote(null);
                setFormData({ appointment_id: '', note: '', is_private: false });
              }}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleEditNote} disabled={saving}>
              {saving ? t('saving') : t('updateNote')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}








