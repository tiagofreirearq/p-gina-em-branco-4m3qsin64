import { InterpretedEntry, LogStatus, ProjectRecord } from '@/types/operational'

// Fallback list of known projects in case database projects haven't loaded yet
export const DEFAULT_PROJECT_OPTIONS = [
  '222 - Apto DQ - AP',
  '310 - Casa Joá',
  '045 - Restaurante Zona Sul',
]

export const DEFAULT_STAGE_OPTIONS = [
  'Briefing',
  'Levantamento',
  'Estudo preliminar',
  'Anteprojeto',
  'Projeto executivo',
  'Obra',
]

/**
 * Remove diacritics and lowercase for robust fuzzy matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Interprets freeform operational team input according to strict architectural rules.
 * Never invents values. If missing/ambiguous, returns null so user can review/correct.
 */
export function interpretOperationalText(
  rawText: string,
  availableProjects: ProjectRecord[] = [],
  currentAuthor: string = 'Tiago',
): InterpretedEntry {
  const norm = normalizeText(rawText)

  // 1. Identify Project:
  // Match by code ("222", "310", "045", "45") or keywords ("apto dq", "dq", "casa joa", "joa", "restaurante zona sul", "zona sul")
  let identifiedProject: string | null = null

  // Check from available DB projects first
  const projectCandidates =
    availableProjects.length > 0
      ? availableProjects.map((p) => ({
          fullName: p.name,
          code: p.code,
          normalizedName: normalizeText(p.name),
        }))
      : DEFAULT_PROJECT_OPTIONS.map((name) => {
          const code = name.split(' - ')[0] || ''
          return {
            fullName: name,
            code,
            normalizedName: normalizeText(name),
          }
        })

  // Specific project alias mappings:
  const aliases: Array<{ triggers: string[]; matches: string }> = [
    {
      triggers: ['222', 'apto dq', 'apartamento dq', 'ap dq', 'dq'],
      matches: '222 - Apto DQ - AP',
    },
    {
      triggers: ['310', 'casa joa', 'joa', 'joá'],
      matches: '310 - Casa Joá',
    },
    {
      triggers: ['045', '45', 'restaurante zona sul', 'zona sul', 'restaurante'],
      matches: '045 - Restaurante Zona Sul',
    },
  ]

  // First try direct alias matching
  for (const alias of aliases) {
    const matched = alias.triggers.some((trig) => {
      const normTrig = normalizeText(trig)
      // Use regex word boundary or contains
      const regex = new RegExp(`\\b${normTrig}\\b`, 'i')
      return regex.test(norm) || norm.includes(normTrig)
    })
    if (matched) {
      // Find exact candidate name or fallback to matches
      const cand = projectCandidates.find(
        (c) => c.fullName.includes(alias.matches) || alias.matches.includes(c.code),
      )
      identifiedProject = cand ? cand.fullName : alias.matches
      break
    }
  }

  // If not found, check codes or candidate names in text
  if (!identifiedProject) {
    for (const cand of projectCandidates) {
      const codeRegex = new RegExp(`\\b${cand.code}\\b`, 'i')
      if (codeRegex.test(norm) || norm.includes(cand.normalizedName)) {
        identifiedProject = cand.fullName
        break
      }
    }
  }

  // 2. Identify Stage:
  // briefing, levantamento, estudo preliminar, anteprojeto, executivo / projeto executivo, obra
  let identifiedStage: string | null = null
  const stagePatterns: Array<{ stage: string; triggers: string[] }> = [
    { stage: 'Briefing', triggers: ['briefing', 'brifing'] },
    { stage: 'Levantamento', triggers: ['levantamento', 'medicao', 'medicoes', 'visita tecnica'] },
    {
      stage: 'Estudo preliminar',
      triggers: ['estudo preliminar', 'estudo', 'preliminar', 'layout inicial'],
    },
    { stage: 'Anteprojeto', triggers: ['anteprojeto', 'ante projeto', 'volumetria', '3d'] },
    {
      stage: 'Projeto executivo',
      triggers: [
        'projeto executivo',
        'executivo',
        'detalhamento',
        'plantas executivas',
        'prancha executiva',
      ],
    },
    { stage: 'Obra', triggers: ['obra', 'canteiro', 'acompanhamento de obra', 'execucao'] },
  ]

  for (const item of stagePatterns) {
    const matched = item.triggers.some((trig) => {
      const normTrig = normalizeText(trig)
      return norm.includes(normTrig)
    })
    if (matched) {
      identifiedStage = item.stage
      break
    }
  }

  // 3. Identify Status:
  // terminei/concluí = concluído; comecei/iniciei = em andamento; travado/parado/aguardando = bloqueado; senão pendente
  let identifiedStatus: LogStatus | null = null

  const doneTriggers = [
    'terminei',
    'conclui',
    'concluido',
    'concluida',
    'finalizei',
    'finalizado',
    'entregue',
    'fechado',
    'pronto',
  ]
  const inProgressTriggers = [
    'comecei',
    'iniciei',
    'iniciando',
    'desenvolvendo',
    'andamento',
    'fazendo',
    'elaborando',
    'ajustando',
    'trabalhando',
  ]
  const blockedTriggers = [
    'travado',
    'travada',
    'parado',
    'parada',
    'aguardando',
    'bloqueado',
    'bloqueada',
    'impedimento',
    'esperando',
  ]
  const pendingTriggers = ['pendente', 'a fazer', 'falta', 'nao iniciado', 'para fazer']

  const hasDone = doneTriggers.some((trig) => norm.includes(normalizeText(trig)))
  const hasInProgress = inProgressTriggers.some((trig) => norm.includes(normalizeText(trig)))
  const hasBlocked = blockedTriggers.some((trig) => norm.includes(normalizeText(trig)))
  const hasPending = pendingTriggers.some((trig) => norm.includes(normalizeText(trig)))

  // Note: If user says "terminei ... falta aprovação", the primary action they did was "terminei"
  // but if the user specifically states a status keyword, follow prompt priority:
  // "terminei/concluí = concluído; comecei/iniciei = em andamento; travado/parado/aguardando = bloqueado; senão pendente"
  if (hasDone) {
    identifiedStatus = 'concluído'
  } else if (hasInProgress) {
    identifiedStatus = 'em andamento'
  } else if (hasBlocked) {
    identifiedStatus = 'bloqueado'
  } else if (hasPending || norm.length > 5) {
    // If not matching earlier keywords, default to pendente as requested: "senão pendente"
    identifiedStatus = 'pendente'
  }

  // 4. Observation:
  // Capitalize nicely, keep the original message or relevant observation
  const trimmed = rawText.trim()
  const observation = trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : null

  return {
    projectName: identifiedProject,
    stage: identifiedStage,
    status: identifiedStatus,
    observation,
    author: currentAuthor,
    date: new Date().toISOString(),
  }
}
