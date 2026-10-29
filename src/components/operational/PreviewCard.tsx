import React, { useState } from 'react'
import { InterpretedEntry, LogStatus, ProjectRecord, StageRecord } from '@/types/operational'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, Edit2, X, AlertCircle } from 'lucide-react'

interface PreviewCardProps {
  preview: InterpretedEntry
  availableProjects: ProjectRecord[]
  availableStages: StageRecord[]
  onConfirm: (confirmedEntry: InterpretedEntry) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  preview,
  availableProjects,
  availableStages,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState<string>(preview.projectName || '')
  const [editedStage, setEditedStage] = useState<string>(preview.stage || '')
  const [editedStatus, setEditedStatus] = useState<LogStatus>(preview.status || 'pendente')
  const [editedObs, setEditedObs] = useState<string>(preview.observation || '')
  const [editedAuthor, setEditedAuthor] = useState<string>(preview.author)

  const formattedDate = new Date(preview.date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleConfirm = () => {
    if (isEditing) {
      onConfirm({
        projectName: editedProject || null,
        stage: editedStage || null,
        status: editedStatus || null,
        observation: editedObs || null,
        author: editedAuthor,
        date: preview.date,
      })
    } else {
      onConfirm(preview)
    }
  }

  const renderStatusBadge = (status: LogStatus | null) => {
    if (!status) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
          não identificado
        </span>
      )
    }
    const colorMap: Record<LogStatus, string> = {
      concluído: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      'em andamento': 'bg-blue-100 text-blue-900 border-blue-300',
      bloqueado: 'bg-rose-100 text-rose-900 border-rose-300',
      pendente: 'bg-amber-100 text-amber-900 border-amber-300',
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colorMap[status]}`}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-lg border-2 border-slate-700 shadow-md p-4 sm:p-5 my-3 text-slate-900">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
          <h3 className="font-bold text-sm tracking-wide text-slate-900 uppercase">
            {isEditing ? 'Editar Prévia do Registro' : 'Prévia Estruturada do Registro'}
          </h3>
        </div>
        <span className="text-xs text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded">
          {formattedDate}
        </span>
      </div>

      {!isEditing ? (
        <div className="space-y-2.5 text-sm">
          <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Projeto
            </span>
            <span className="col-span-2 font-medium text-slate-900">
              {preview.projectName ? (
                preview.projectName
              ) : (
                <span className="text-amber-800 italic font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> não identificado
                </span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Etapa
            </span>
            <span className="col-span-2 font-medium text-slate-900">
              {preview.stage ? (
                preview.stage
              ) : (
                <span className="text-amber-800 italic font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> não identificado
                </span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Status
            </span>
            <div className="col-span-2">{renderStatusBadge(preview.status)}</div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Observação
            </span>
            <span className="col-span-2 text-slate-800 leading-relaxed">
              {preview.observation || (
                <span className="text-slate-600 italic">não identificado</span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Autor
            </span>
            <span className="col-span-2 font-medium text-slate-900">{preview.author}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Data e hora
            </span>
            <span className="col-span-2 text-slate-800">{formattedDate}</span>
          </div>
        </div>
      ) : (
        /* Edit mode */
        <div className="space-y-3 text-sm">
          <div>
            <Label className="text-xs font-semibold text-slate-800">Projeto *</Label>
            <Select value={editedProject} onValueChange={setEditedProject}>
              <SelectTrigger className="mt-1 h-9 bg-slate-50 border-slate-300">
                <SelectValue placeholder="Selecione o projeto" />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.map((p) => (
                  <SelectItem key={p.id} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-800">Etapa *</Label>
            <Select value={editedStage} onValueChange={setEditedStage}>
              <SelectTrigger className="mt-1 h-9 bg-slate-50 border-slate-300">
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent>
                {availableStages.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-800">Status *</Label>
            <Select value={editedStatus} onValueChange={(v) => setEditedStatus(v as LogStatus)}>
              <SelectTrigger className="mt-1 h-9 bg-slate-50 border-slate-300">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concluído">concluído</SelectItem>
                <SelectItem value="em andamento">em andamento</SelectItem>
                <SelectItem value="bloqueado">bloqueado</SelectItem>
                <SelectItem value="pendente">pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-800">Observação</Label>
            <Textarea
              value={editedObs}
              onChange={(e) => setEditedObs(e.target.value)}
              className="mt-1 min-h-[70px] bg-slate-50 border-slate-300 text-sm"
              placeholder="Descreva a atividade..."
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-800">Autor *</Label>
            <Input
              value={editedAuthor}
              onChange={(e) => setEditedAuthor(e.target.value)}
              className="mt-1 h-9 bg-slate-50 border-slate-300"
              placeholder="Nome do autor"
            />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-slate-700 hover:text-slate-950 hover:bg-slate-100 text-xs font-medium"
        >
          <X className="w-3.5 h-3.5 mr-1 text-slate-600" />
          Cancelar
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          disabled={isSubmitting}
          className="border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-semibold"
        >
          <Edit2 className="w-3.5 h-3.5 mr-1 text-slate-600" />
          {isEditing ? 'Voltar à Prévia' : 'Corrigir'}
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={isSubmitting || (isEditing && (!editedProject || !editedStage))}
          className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold shadow-sm px-4"
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          {isSubmitting ? 'Gravando...' : 'Confirmar'}
        </Button>
      </div>
    </div>
  )
}
