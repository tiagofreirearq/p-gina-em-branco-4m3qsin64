import React, { useEffect, useState } from 'react'
import { OperationalLogRecord, ProjectRecord, StageRecord } from '@/types/operational'
import { operationalService } from '@/services/operationalService'
import { RegisterTab } from '@/components/operational/RegisterTab'
import { DashboardTab } from '@/components/operational/DashboardTab'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Building2, PlusCircle, LayoutDashboard, Compass } from 'lucide-react'

export const Index = () => {
  const [activeTab, setActiveTab] = useState<'registrar' | 'painel'>('registrar')
  const [logs, setLogs] = useState<OperationalLogRecord[]>([])
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [stages, setStages] = useState<StageRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [fetchedLogs, fetchedProjects, fetchedStages] = await Promise.all([
        operationalService.getLogs(),
        operationalService.getProjects(),
        operationalService.getStages(),
      ])
      setLogs(fetchedLogs)
      setProjects(fetchedProjects)
      setStages(fetchedStages)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRecordCreated = (newRecord: OperationalLogRecord) => {
    setLogs((prev) => [newRecord, ...prev])
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-blue-900 selection:text-white">
      {/* Top Header */}
      <header className="bg-slate-950 text-white border-b-2 border-slate-800 shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-900 text-white shadow-inner flex items-center justify-center">
              <Compass className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>Registro Operacional</span>
                <span className="hidden sm:inline text-xs font-normal text-slate-300">|</span>
                <span className="text-xs sm:text-sm font-semibold text-blue-200">
                  Tiago Freire Arquitetos
                </span>
              </h1>
              <p className="text-[11px] text-slate-300">
                Acompanhamento e registro diário de canteiro e escritório
              </p>
            </div>
          </div>

          {/* Navigation Tabs Header */}
          <div className="w-full sm:w-auto">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'registrar' | 'painel')}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-2 w-full sm:w-64 bg-slate-900 p-1 border border-slate-700">
                <TabsTrigger
                  value="registrar"
                  className="data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:font-bold text-xs font-medium text-slate-300 py-1.5 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Registrar
                </TabsTrigger>
                <TabsTrigger
                  value="painel"
                  className="data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:font-bold text-xs font-medium text-slate-300 py-1.5 transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                  Painel
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 p-3 sm:p-6 max-w-6xl mx-auto w-full">
        {activeTab === 'registrar' ? (
          <RegisterTab
            availableProjects={projects}
            availableStages={stages}
            onRecordCreated={handleRecordCreated}
          />
        ) : (
          <DashboardTab
            logs={logs}
            availableProjects={projects}
            availableStages={stages}
            isLoading={isLoading}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-[11px] text-slate-700">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>Registro Operacional &bull; Tiago Freire Arquitetos</span>
          <span>Sincronizado com PocketBase</span>
        </div>
      </footer>
    </div>
  )
}

export default Index
