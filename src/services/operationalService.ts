import pb from '@/lib/pocketbase/client'
import { OperationalLogRecord, ProjectRecord, StageRecord } from '@/types/operational'

export const operationalService = {
  async getLogs(): Promise<OperationalLogRecord[]> {
    try {
      const records = await pb.collection('operational_logs').getFullList<OperationalLogRecord>({
        sort: '-created',
      })
      return records
    } catch (error) {
      console.error('Erro ao buscar registros operacionais:', error)
      return []
    }
  },

  async createLog(data: {
    project_name: string
    stage: string
    status: string
    observation?: string
    author: string
    source?: string
    raw_text?: string
    log_date?: string
  }): Promise<OperationalLogRecord> {
    const record = await pb.collection('operational_logs').create<OperationalLogRecord>({
      project_name: data.project_name,
      stage: data.stage,
      status: data.status,
      observation: data.observation || '',
      author: data.author,
      source: data.source || 'Chat da Obra',
      raw_text: data.raw_text || '',
      log_date: data.log_date || new Date().toISOString(),
    })
    return record
  },

  async getProjects(): Promise<ProjectRecord[]> {
    try {
      const records = await pb.collection('projects').getFullList<ProjectRecord>({
        sort: 'code',
      })
      return records
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
      return []
    }
  },

  async getStages(): Promise<StageRecord[]> {
    try {
      const records = await pb.collection('stages').getFullList<StageRecord>({
        sort: 'order',
      })
      return records
    } catch (error) {
      console.error('Erro ao buscar etapas:', error)
      return []
    }
  },
}
