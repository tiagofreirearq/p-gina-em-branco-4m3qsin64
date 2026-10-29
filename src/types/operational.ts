export type ProjectCategory = 'Residencial' | 'Comercial' | 'Institucional' | 'Outro'

export interface ProjectRecord {
  id: string
  code: string
  name: string
  category: ProjectCategory
  created: string
  updated: string
}

export interface StageRecord {
  id: string
  name: string
  order?: number
  created: string
  updated: string
}

export type LogStatus = 'concluído' | 'em andamento' | 'bloqueado' | 'pendente'

export interface OperationalLogRecord {
  id: string
  project_name: string
  stage: string
  status: LogStatus
  observation: string
  author: string
  source: string
  raw_text: string
  log_date?: string
  created: string
  updated: string
}

export interface InterpretedEntry {
  projectName: string | null // null means 'não identificado'
  stage: string | null // null means 'não identificado'
  status: LogStatus | null // null means 'não identificado'
  observation: string | null
  author: string
  date: string // ISO string or formatted
}

export const KNOWN_AUTHORS = ['Murilo', 'Raquel', 'Felipe', 'Tiago'] as const
export type KnownAuthor = (typeof KNOWN_AUTHORS)[number]
