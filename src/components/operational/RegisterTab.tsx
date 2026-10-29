import React, { useState, useEffect, useRef } from 'react'
import {
  InterpretedEntry,
  KNOWN_AUTHORS,
  OperationalLogRecord,
  ProjectRecord,
  StageRecord,
} from '@/types/operational'
import { operationalService } from '@/services/operationalService'
import { interpretOperationalText } from '@/services/nlpInterpreter'
import { PreviewCard } from './PreviewCard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, User, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ChatMessage {
  id: string
  sender: 'user' | 'system'
  text?: string
  preview?: InterpretedEntry
  savedSummary?: {
    projectName: string
    stage: string
    status: string
    observation: string
    author: string
    date: string
  }
  timestamp: string
}

interface RegisterTabProps {
  availableProjects: ProjectRecord[]
  availableStages: StageRecord[]
  onRecordCreated?: (newRecord: OperationalLogRecord) => void
}

export const RegisterTab: React.FC<RegisterTabProps> = ({
  availableProjects,
  availableStages,
  onRecordCreated,
}) => {
  const [currentAuthor, setCurrentAuthor] = useState<string>('Tiago')
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'system',
      text: 'Olá! Digite abaixo o que você realizou na obra ou no escritório para registrar no sistema.',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [activePreview, setActivePreview] = useState<InterpretedEntry | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, activePreview])

  const handleSendText = () => {
    const trimmed = inputText.trim()
    if (!trimmed) return

    // 1. Add user message to chat
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputText('')

    // 2. Interpret text without saving anything
    const interpreted = interpretOperationalText(trimmed, availableProjects, currentAuthor)
    setActivePreview(interpreted)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const handleConfirmPreview = async (confirmed: InterpretedEntry) => {
    setIsSubmitting(true)
    try {
      const finalProject = confirmed.projectName || 'Não identificado'
      const finalStage = confirmed.stage || 'Não identificado'
      const finalStatus = confirmed.status || 'pendente'
      const finalObs = confirmed.observation || 'sem dado'
      const finalAuthor = confirmed.author || currentAuthor

      const newRecord = await operationalService.createLog({
        project_name: finalProject,
        stage: finalStage,
        status: finalStatus,
        observation: finalObs,
        author: finalAuthor,
        source: 'Chat da Obra',
        raw_text: confirmed.observation || '',
        log_date: confirmed.date || new Date().toISOString(),
      })

      // Add success message in chat with summary
      const successMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'system',
        savedSummary: {
          projectName: finalProject,
          stage: finalStage,
          status: finalStatus,
          observation: finalObs,
          author: finalAuthor,
          date: new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, successMsg])
      setActivePreview(null)
      if (onRecordCreated) {
        onRecordCreated(newRecord)
      }

      toast({
        title: 'Registro confirmado!',
        description: `Gravado com sucesso no projeto "${finalProject}".`,
      })
    } catch (error) {
      console.error('Falha ao gravar registro:', error)
      toast({
        title: 'Erro ao gravar',
        description: 'Não foi possível salvar o registro no banco de dados.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelPreview = () => {
    setActivePreview(null)
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-cancel-${Date.now()}`,
        sender: 'system',
        text: 'Registro cancelado. Nenhuma alteração foi gravada.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-9.5rem)] max-w-4xl mx-auto w-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      {/* Top Author Selector bar (optimized for fast field selection) */}
      <div className="bg-slate-900 text-white px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-slate-800 text-blue-300">
            <User className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">Autor do registro:</span>
        </div>
        <div className="w-40 sm:w-48">
          <Select value={currentAuthor} onValueChange={setCurrentAuthor}>
            <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700 text-white focus:ring-blue-400">
              <SelectValue placeholder="Selecione o autor" />
            </SelectTrigger>
            <SelectContent>
              {KNOWN_AUTHORS.map((author) => (
                <SelectItem key={author} value={author} className="text-xs">
                  {author}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat Messages area (full scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-[70%] bg-blue-900 text-white rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <span className="block text-[10px] text-blue-200 text-right mt-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            )
          }

          if (msg.savedSummary) {
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[95%] sm:max-w-[80%] bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl rounded-tl-none p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-emerald-900 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Registro gravado com sucesso no banco!</span>
                  </div>
                  <div className="space-y-1 text-xs border-t border-emerald-200 pt-2 text-slate-800">
                    <p>
                      <strong className="text-slate-900">Projeto:</strong>{' '}
                      {msg.savedSummary.projectName}
                    </p>
                    <p>
                      <strong className="text-slate-900">Etapa:</strong> {msg.savedSummary.stage}
                    </p>
                    <p>
                      <strong className="text-slate-900">Status:</strong> {msg.savedSummary.status}
                    </p>
                    <p>
                      <strong className="text-slate-900">Observação:</strong>{' '}
                      {msg.savedSummary.observation}
                    </p>
                    <p>
                      <strong className="text-slate-900">Responsável:</strong>{' '}
                      {msg.savedSummary.author}
                    </p>
                    <p className="text-[10px] text-slate-700 mt-1">Data: {msg.savedSummary.date}</p>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[70%] bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-xs">
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <span className="block text-[10px] text-slate-700 mt-1">{msg.timestamp}</span>
              </div>
            </div>
          )
        })}

        {/* Structured Preview Card inside chat */}
        {activePreview && (
          <div className="animate-fade-in-up">
            <PreviewCard
              preview={activePreview}
              availableProjects={availableProjects}
              availableStages={availableStages}
              onConfirm={handleConfirmPreview}
              onCancel={handleCancelPreview}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="bg-white border-t border-slate-200 p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          <div className="relative flex items-center">
            <Textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={activePreview !== null || isSubmitting}
              placeholder="O que você fez? Ex: terminei a planta do estudo preliminar do Apto DQ, falta aprovação do cliente"
              className="resize-none pr-12 min-h-[58px] max-h-32 text-sm bg-slate-50 border-slate-300 focus:bg-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
              rows={2}
            />
            <Button
              type="button"
              size="icon"
              disabled={!inputText.trim() || activePreview !== null || isSubmitting}
              onClick={handleSendText}
              className="absolute right-2 bottom-2 h-9 w-9 bg-blue-900 hover:bg-blue-950 text-white rounded-md shadow-sm"
              title="Interpretar e gerar prévia"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-700 px-1">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-900" />
              Interpretação automática de Projeto, Etapa e Status
            </span>
            <span className="hidden sm:inline">Pressione Enter para enviar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
