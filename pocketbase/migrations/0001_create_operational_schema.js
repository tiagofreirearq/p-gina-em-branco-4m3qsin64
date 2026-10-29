migrate(
  (app) => {
    // 1. Projects collection
    const projects = new Collection({
      name: 'projects',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'code', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['Residencial', 'Comercial', 'Institucional', 'Outro'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_projects_code ON projects (code)'],
    })
    app.save(projects)

    // 2. Stages collection
    const stages = new Collection({
      name: 'stages',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'order', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_stages_name ON stages (name)'],
    })
    app.save(stages)

    // 3. Operational logs collection
    const operationalLogs = new Collection({
      name: 'operational_logs',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'project_name', type: 'text', required: true },
        { name: 'stage', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['concluído', 'em andamento', 'bloqueado', 'pendente'],
          maxSelect: 1,
        },
        { name: 'observation', type: 'text' },
        { name: 'author', type: 'text', required: true },
        { name: 'source', type: 'text' }, // "Chat da Obra", "Web", etc.
        { name: 'raw_text', type: 'text' },
        { name: 'log_date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_logs_project ON operational_logs (project_name)',
        'CREATE INDEX idx_logs_status ON operational_logs (status)',
        'CREATE INDEX idx_logs_author ON operational_logs (author)',
        'CREATE INDEX idx_logs_created ON operational_logs (created DESC)',
      ],
    })
    app.save(operationalLogs)
  },
  (app) => {
    try {
      const logs = app.findCollectionByNameOrId('operational_logs')
      app.delete(logs)
    } catch (_) {}
    try {
      const stages = app.findCollectionByNameOrId('stages')
      app.delete(stages)
    } catch (_) {}
    try {
      const projects = app.findCollectionByNameOrId('projects')
      app.delete(projects)
    } catch (_) {}
  },
)
