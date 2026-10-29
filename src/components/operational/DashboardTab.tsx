import React, { useMemo, useState } from 'react'
import {
  KNOWN_AUTHORS,
  LogStatus,
  OperationalLogRecord,
  ProjectRecord,
  StageRecord,
} from '@/types/operational'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Clock,
  FilterX,
  RefreshCw,
  FolderKanban,
  CheckCircle,
  PlayCircle,
  AlertOctagon,
  ClockAlert,
} from 'lucide-react'

interface DashboardTabProps {
  logs: OperationalLogRecord[]
  availableProjects: ProjectRecord[]
  availableStages: StageRecord[]
  isLoading?: boolean
  onRefresh?: () => void
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export const DashboardTab: React.FC<DashboardTabProps> = ({
  logs,
  availableProjects,
  availableStages,
  isLoading = false,
  onRefresh,
}) => {
  // Filters state
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [filterAuthor, setFilterAuthor] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Check if a record is outdated (> 7 days without update)
  const isOutdated = (updatedDateStr?: string, createdDateStr?: string): boolean => {
    const rawDate = updatedDateStr || createdDateStr
    if (!rawDate) return false
    const time = new Date(rawDate).getTime()
    if (isNaN(time)) return false
    return Date.now() - time > SEVEN_DAYS_MS
  }

  // Format date or "sem dado"
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'sem dado'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return 'sem dado'
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (_) {
      return 'sem dado'
    }
  }

  // Compute counters across all logs
  const counters = useMemo(() => {
    let total = logs.length
    let concluidos = 0
    let emAndamento = 0
    let bloqueados = 0
    let desatualizados = 0

    logs.forEach((log) => {
      if (log.status === 'concluído') concluidos++
      if (log.status === 'em andamento') emAndamento++
      if (log.status === 'bloqueado') bloqueados++
      if (isOutdated(log.updated, log.created)) desatualizados++
    })

    return { total, concluidos, emAndamento, bloqueados, desatualizados }
  }, [logs])

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterProject !== 'all' && log.project_name !== filterProject) {
        return false
      }
      if (filterStage !== 'all' && log.stage !== filterStage) {
        return false
      }
      if (filterAuthor !== 'all' && log.author !== filterAuthor) {
        return false
      }
      if (filterStatus !== 'all' && log.status !== filterStatus) {
        return false
      }
      return true
    })
  }, [logs, filterProject, filterStage, filterAuthor, filterStatus])

  const clearFilters = () => {
    setFilterProject('all')
    setFilterStage('all')
    setFilterAuthor('all')
    setFilterStatus('all')
  }

  const hasActiveFilters =
    filterProject !== 'all' ||
    filterStage !== 'all' ||
    filterAuthor !== 'all' ||
    filterStatus !== 'all'

  const renderStatusBadge = (status?: LogStatus | string) => {
    if (!status || status === '0') {
      return <span className="text-slate-600 italic">sem dado</span>
    }
    const colorMap: Record<string, string> = {
      concluído: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      'em andamento': 'bg-blue-100 text-blue-900 border-blue-300',
      bloqueado: 'bg-rose-100 text-rose-900 border-rose-300',
      pendente: 'bg-amber-100 text-amber-900 border-amber-300',
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
          colorMap[status] || 'bg-slate-100 text-slate-900 border-slate-300'
        }`}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full pb-10">
      {/* Top Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total */}
        <div className="bg-white border-2 border-slate-700 rounded-lg p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider">Total</span>
            <FolderKanban className="w-4 h-4 text-slate-700" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {counters.total}
          </div>
          <span className="text-[11px] text-slate-700 mt-1">Registros no sistema</span>
        </div>

        {/* Concluídos */}
        <div className="bg-white border-2 border-emerald-600 rounded-lg p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-xs font-bold uppercase tracking-wider">Concluídos</span>
            <CheckCircle className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-900">
            {counters.concluidos}
          </div>
          <span className="text-[11px] text-emerald-800 mt-1">Entregas finalizadas</span>
        </div>

        {/* Em andamento */}
        <div className="bg-white border-2 border-blue-600 rounded-lg p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-xs font-bold uppercase tracking-wider">Em andamento</span>
            <PlayCircle className="w-4 h-4 text-blue-700" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-900">
            {counters.emAndamento}
          </div>
          <span className="text-[11px] text-blue-800 mt-1">Atividades ativas</span>
        </div>

        {/* Bloqueados */}
        <div className="bg-white border-2 border-rose-600 rounded-lg p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-900">
            <span className="text-xs font-bold uppercase tracking-wider">Bloqueados</span>
            <AlertOctagon className="w-4 h-4 text-rose-700" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-900">
            {counters.bloqueados}
          </div>
          <span className="text-[11px] text-rose-800 mt-1">Aguardando solução</span>
        </div>

        {/* Desatualizados */}
        <div className="col-span-2 sm:col-span-1 bg-amber-50 border-2 border-amber-600 rounded-lg p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-xs font-bold uppercase tracking-wider">Desatualizados</span>
            <ClockAlert className="w-4 h-4 text-amber-700" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-900">
            {counters.desatualizados}
          </div>
          <span className="text-[11px] text-amber-800 mt-1">&gt; 7 dias sem atualização</span>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Filtros Operacionais
            </h3>
            {hasActiveFilters && (
              <span className="text-xs text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Filtros ativos ({filteredLogs.length} de {logs.length})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-slate-700 hover:text-slate-900 h-8"
              >
                <FilterX className="w-3.5 h-3.5 mr-1" />
                Limpar filtros
              </Button>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="text-xs border-slate-300 text-slate-800 h-8 hover:bg-slate-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Projeto */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Projeto</label>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="h-9 bg-slate-50 border-slate-300 text-xs">
                <SelectValue placeholder="Todos os projetos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {availableProjects.map((p) => (
                  <SelectItem key={p.id} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Etapa */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Etapa</label>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="h-9 bg-slate-50 border-slate-300 text-xs">
                <SelectValue placeholder="Todas as etapas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as etapas</SelectItem>
                {availableStages.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Responsável</label>
            <Select value={filterAuthor} onValueChange={setFilterAuthor}>
              <SelectTrigger className="h-9 bg-slate-50 border-slate-300 text-xs">
                <SelectValue placeholder="Todos os responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {KNOWN_AUTHORS.map((author) => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 bg-slate-50 border-slate-300 text-xs">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="concluído">concluído</SelectItem>
                <SelectItem value="em andamento">em andamento</SelectItem>
                <SelectItem value="bloqueado">bloqueado</SelectItem>
                <SelectItem value="pendente">pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table / Mobile Cards */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Projeto</th>
                <th className="py-3 px-4">Etapa</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Última atualização</th>
                <th className="py-3 px-4">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-600">
                    Nenhum registro operacional encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const outdated = isOutdated(log.updated, log.created)
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        outdated ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      {/* Projeto */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {log.project_name || 'sem dado'}
                        </div>
                        {log.observation && (
                          <div className="text-[11px] text-slate-700 mt-0.5 max-w-sm line-clamp-1">
                            {log.observation}
                          </div>
                        )}
                      </td>

                      {/* Etapa */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {log.stage || 'sem dado'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {renderStatusBadge(log.status)}
                          {outdated && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-950 border border-amber-400">
                              <Clock className="w-2.5 h-2.5 mr-0.5" />
                              desatualizado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {log.author || 'sem dado'}
                      </td>

                      {/* Última atualização */}
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {formatDate(log.updated || log.created)}
                      </td>

                      {/* Origem */}
                      <td className="py-3 px-4 text-slate-700">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                          {log.source || 'sem dado'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards View (< md) */}
        <div className="block md:hidden divide-y divide-slate-200">
          {filteredLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-600">
              Nenhum registro operacional encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const outdated = isOutdated(log.updated, log.created)
              return (
                <div
                  key={log.id}
                  className={`p-4 space-y-2.5 ${outdated ? 'bg-amber-50/50' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-700 block tracking-wider">
                        Projeto
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">
                        {log.project_name || 'sem dado'}
                      </h4>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {renderStatusBadge(log.status)}
                      {outdated && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-950 border border-amber-400">
                          <Clock className="w-2.5 h-2.5 mr-0.5" />
                          desatualizado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-700 font-semibold block uppercase">
                        Etapa
                      </span>
                      <span className="font-medium text-slate-900">{log.stage || 'sem dado'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-700 font-semibold block uppercase">
                        Responsável
                      </span>
                      <span className="font-semibold text-slate-900">
                        {log.author || 'sem dado'}
                      </span>
                    </div>
                  </div>

                  {log.observation && (
                    <div className="bg-slate-50 p-2 rounded text-xs text-slate-800 border border-slate-200">
                      <span className="text-[10px] text-slate-700 font-semibold block mb-0.5 uppercase">
                        Observação
                      </span>
                      {log.observation}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1 border-t border-slate-100">
                    <div>
                      <span className="font-medium text-slate-700">Atualizado: </span>
                      {formatDate(log.updated || log.created)}
                    </div>
                    <div>
                      <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                        {log.source || 'sem dado'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
