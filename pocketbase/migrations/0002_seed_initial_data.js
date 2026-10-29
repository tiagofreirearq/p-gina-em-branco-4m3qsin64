migrate(
  (app) => {
    const projectsCol = app.findCollectionByNameOrId('projects')
    const stagesCol = app.findCollectionByNameOrId('stages')
    const logsCol = app.findCollectionByNameOrId('operational_logs')

    // Seed Projects:
    // "222 - Apto DQ - AP" (Residencial), "310 - Casa Joá" (Residencial), "045 - Restaurante Zona Sul" (Comercial)
    const initialProjects = [
      { code: '222', name: '222 - Apto DQ - AP', category: 'Residencial' },
      { code: '310', name: '310 - Casa Joá', category: 'Residencial' },
      { code: '045', name: '045 - Restaurante Zona Sul', category: 'Comercial' },
    ]

    for (let i = 0; i < initialProjects.length; i++) {
      const p = initialProjects[i]
      try {
        app.findFirstRecordByData('projects', 'code', p.code)
      } catch (_) {
        const rec = new Record(projectsCol)
        rec.set('code', p.code)
        rec.set('name', p.name)
        rec.set('category', p.category)
        app.save(rec)
      }
    }

    // Seed Stages:
    // Briefing, Levantamento, Estudo preliminar, Anteprojeto, Projeto executivo, Obra
    const initialStages = [
      { name: 'Briefing', order: 1 },
      { name: 'Levantamento', order: 2 },
      { name: 'Estudo preliminar', order: 3 },
      { name: 'Anteprojeto', order: 4 },
      { name: 'Projeto executivo', order: 5 },
      { name: 'Obra', order: 6 },
    ]

    for (let i = 0; i < initialStages.length; i++) {
      const s = initialStages[i]
      try {
        app.findFirstRecordByData('stages', 'name', s.name)
      } catch (_) {
        const rec = new Record(stagesCol)
        rec.set('name', s.name)
        rec.set('order', s.order)
        app.save(rec)
      }
    }

    // Seed initial Operational Logs:
    // Three example records, one > 7 days old to exhibit the "desatualizado" state.
    // Responsáveis: Murilo, Raquel, Felipe, Tiago.
    const existingLogs = app.findRecordsByFilter('operational_logs', '', '', 1, 0)
    if (existingLogs.length === 0) {
      const now = new Date()
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)

      const initialLogs = [
        {
          project_name: '222 - Apto DQ - AP',
          stage: 'Estudo preliminar',
          status: 'concluído',
          observation:
            'Terminei a planta do estudo preliminar do Apto DQ, falta aprovação do cliente.',
          author: 'Felipe',
          source: 'Chat da Obra',
          raw_text: 'terminei a planta do estudo preliminar do Apto DQ, falta aprovação do cliente',
          createdDate: threeHoursAgo.toISOString(),
        },
        {
          project_name: '310 - Casa Joá',
          stage: 'Anteprojeto',
          status: 'em andamento',
          observation:
            'Desenvolvendo volumetria da fachada principal e detalhamento dos caixilhos.',
          author: 'Raquel',
          source: 'Chat da Obra',
          raw_text: 'iniciei a volumetria da fachada da Casa Joá',
          createdDate: twoDaysAgo.toISOString(),
        },
        {
          project_name: '045 - Restaurante Zona Sul',
          stage: 'Obra',
          status: 'bloqueado',
          observation: 'Aguardando aprovação de alteração de carga elétrica pela concessionária.',
          author: 'Murilo',
          source: 'Chat da Obra',
          raw_text: 'travado na obra do Restaurante Zona Sul aguardando carga elétrica',
          createdDate: tenDaysAgo.toISOString(),
        },
      ]

      for (let i = 0; i < initialLogs.length; i++) {
        const log = initialLogs[i]
        const rec = new Record(logsCol)
        rec.set('project_name', log.project_name)
        rec.set('stage', log.stage)
        rec.set('status', log.status)
        rec.set('observation', log.observation)
        rec.set('author', log.author)
        rec.set('source', log.source)
        rec.set('raw_text', log.raw_text)
        rec.set('log_date', log.createdDate)
        app.save(rec)

        // Backdate the created and updated timestamps for the > 7 days test
        if (log.project_name === '045 - Restaurante Zona Sul') {
          app
            .db()
            .newQuery(
              'UPDATE operational_logs SET created = {:oldDate}, updated = {:oldDate} WHERE id = {:id}',
            )
            .bind({
              oldDate: tenDaysAgo.toISOString().replace('T', ' ').replace('Z', ''),
              id: rec.id,
            })
            .execute()
        }
      }
    }
  },
  (app) => {
    // down logic is handled by deleting collections in migration 0001 if needed
  },
)
