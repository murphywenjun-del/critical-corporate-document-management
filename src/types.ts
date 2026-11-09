export interface ContractResult {
  contract_name: string
  contract_num: number
  document_type: string
  extraction_method: string
  agnes_ok: boolean
  rules_flags_count: number
  rules_risk_level: string
  rules_risk_score: number
  jeV_result: JevResult
  timestamp: string
}

export interface JevResult {
  model?: string
  answers?: JevAnswers
  error?: string
}

export interface JevAnswers {
  risk_severity?: JevAnswer
  needs_human_review?: JevAnswer
  is_compliance_related?: JevAnswer
  should_alert?: JevAnswer
  decision_confidence?: JevAnswer
}

export interface JevAnswer {
  type?: string
  choice?: string
  noul?: number
  score?: number
  confidence?: number
  probabilities?: Record<string, number>
}
