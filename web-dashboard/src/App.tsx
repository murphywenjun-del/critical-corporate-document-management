import { useState, useEffect } from 'react'
import { contracts, pipelineStages } from './data'
import './App.css'

type Severity = 'Critical' | 'High' | 'Medium'
type RiskLevel = 'Low' | 'Critical'

interface SelectedContract {
  contract: typeof contracts[0]
  text: string
}

// ── Color helpers ────────────────────────────────────────────────────────────

const severityColor: Record<Severity, string> = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

const riskLevelColor: Record<RiskLevel, string> = {
  Low: 'bg-emerald-100 text-emerald-700',
  Critical: 'bg-red-100 text-red-700',
}

const severityDot: Record<Severity, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
}

function fieldStatusColor(status: '✓' | '✗' | '?'): string {
  if (status === '✓') return 'text-emerald-600'
  if (status === '✗') return 'text-red-500'
  return 'text-gray-400'
}

function jevMeter(value: number): { label: string; color: string; bg: string } {
  if (value >= 0.7) return { label: 'High', color: 'text-red-600', bg: 'bg-red-500' }
  if (value >= 0.4) return { label: 'Medium', color: 'text-orange-600', bg: 'bg-orange-500' }
  return { label: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-500' }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ContractCard({
  c,
  selected,
  onClick,
}: {
  c: typeof contracts[0]
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border-2 p-4 transition-all duration-150 ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
              #{c.num}
            </span>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 uppercase tracking-wide">
              {c.type}
            </span>
          </div>
          <p className="font-semibold text-slate-800 text-sm truncate">{c.displayName}</p>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.summary}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${riskLevelColor[c.riskLevel as RiskLevel]}`}>
            Risk {c.riskLevel}
          </span>
          {c.flagsCount > 0 && (
            <span className="text-xs text-red-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              {c.flagsCount} flag{c.flagsCount > 1 ? 's' : ''}
            </span>
          )}
          {c.flagsCount === 0 && (
            <span className="text-xs text-emerald-500 font-medium">✓ Clean</span>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {c.flags.slice(0, 3).map((f) => (
          <span key={f.field} className={`w-2 h-2 rounded-full ${severityDot[f.severity]}`} title={f.severity} />
        ))}
        {c.flags.length === 0 && (
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        )}
        {c.flags.length > 3 && (
          <span className="text-xs text-slate-400 ml-1">+{c.flags.length - 3} more</span>
        )}
      </div>
    </button>
  )
}

function FlagRow({ flag }: { flag: (typeof contracts)[0]['flags'][0] }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${severityColor[flag.severity]}`}>
      <span className={`w-2 h-2 rounded-full ${severityDot[flag.severity]} mt-1.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold uppercase tracking-wide opacity-70">{flag.severity}</span>
          <span className="text-xs font-mono opacity-60">[{flag.field}]</span>
        </div>
        <p className="text-sm">{flag.flag_if}</p>
      </div>
    </div>
  )
}

function ExtractedField({ field }: { field: (typeof contracts)[0]['extractedFields'][0] }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className={`text-base font-medium ${fieldStatusColor(field.status)} w-5 text-center shrink-0 pt-0.5`}>
        {field.status}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{field.label}</span>
        <p className="text-sm text-slate-800 mt-0.5 break-words">{field.value}</p>
      </div>
    </div>
  )
}

function JevPanel({ jev }: { jev: (typeof contracts)[0]['jev'] }) {
  const rows = [
    { label: 'Risk Severity', value: jev.riskSeverity.choice, confidence: jev.riskSeverity.confidence },
    { label: 'Needs Human Review', value: `${(jev.needsHumanReview * 100).toFixed(0)}%`, confidence: jev.needsHumanReview },
    { label: 'Compliance Related', value: `${(jev.isComplianceRelated * 100).toFixed(0)}%`, confidence: jev.isComplianceRelated },
    { label: 'Alert Recommended', value: `${(jev.shouldAlert * 100).toFixed(0)}%`, confidence: jev.shouldAlert },
    { label: 'Decision Confidence', value: jev.decisionConfidence.toFixed(2), confidence: jev.decisionConfidence },
  ]

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const meter = jevMeter(row.confidence)
        return (
          <div key={row.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-600">{row.label}</span>
              <span className={`text-xs font-semibold ${meter.color}`}>{row.value}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${meter.bg}`}
                style={{ width: `${Math.round(row.confidence * 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PipelineDiagram() {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {pipelineStages.map((stage, i) => (
        <div key={stage.label} className="flex items-center shrink-0">
          <div className="flex flex-col items-center gap-1 px-3 py-2">
            <span className="text-xl">{stage.icon}</span>
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{stage.label}</span>
            <span className="text-xs text-slate-400 whitespace-nowrap">{stage.desc}</span>
          </div>
          {i < pipelineStages.length - 1 && (
            <span className="text-slate-300 text-lg leading-none mx-1">→</span>
          )}
        </div>
      ))}
    </div>
  )
}

function ContractTextPanel({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="text-xs text-slate-600 font-mono leading-relaxed max-h-96 overflow-y-auto bg-slate-50 rounded-lg p-4 border border-slate-200">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h2 key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1">{line.slice(2)}</h2>
        if (line.startsWith('## ')) return <h3 key={i} className="text-xs font-bold text-slate-700 mt-2 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>
        if (line.trim() === '') return <div key={i} />
        return <p key={i} className="mb-0.5">{line}</p>
      })}
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [selected, setSelected] = useState<typeof contracts[0] | null>(null)
  const [contractText, setContractText] = useState('')
  const [filterType, setFilterType] = useState<string>('All')
  const [filterRisk, setFilterRisk] = useState<string>('All')

  const types = ['All', ...Array.from(new Set(contracts.map((c) => c.type)))]
  const risks = ['All', 'Low', 'Critical']

  const filtered = contracts.filter((c) => {
    if (filterType !== 'All' && c.type !== filterType) return false
    if (filterRisk !== 'All' && c.riskLevel !== filterRisk) return false
    return true
  })

  useEffect(() => {
    if (selected) {
      fetch(selected.filePath)
        .then((r) => r.text())
        .then((t) => setContractText(t))
        .catch(() => setContractText('(Could not load document)'))
    } else {
      setContractText('')
    }
  }, [selected])

  const totalFlags = contracts.reduce((s, c) => s + c.flagsCount, 0)
  const criticalCount = contracts.filter((c) => c.riskLevel === 'Critical').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Southlake Health — Document Risk Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">AI-assisted contract compliance &amp; risk assessment prototype</p>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{contracts.length}</div>
              <div className="text-slate-500">Contracts Reviewed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
              <div className="text-slate-500">Critical Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{totalFlags}</div>
              <div className="text-slate-500">Flags Raised</div>
            </div>
          </div>
        </div>
      </header>

      {/* Pipeline */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-screen-2xl mx-auto">
          <PipelineDiagram />
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto flex gap-0">
        {/* Left: Contract List */}
        <aside className="w-80 shrink-0 bg-white border-r border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter by Type</p>
            <div className="flex flex-wrap gap-1.5">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    filterType === t
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter by Risk</p>
            <div className="flex gap-2">
              {risks.map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    filterRisk === r
                      ? r === 'Critical' ? 'bg-red-50 border-red-300 text-red-700 font-semibold' : r === 'Low' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold' : 'bg-slate-700 text-white border-slate-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-2 min-h-0">
            {filtered.map((c) => (
              <ContractCard
                key={c.num}
                c={c}
                selected={selected?.num === c.num}
                onClick={() => setSelected(c)}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center">
            {filtered.length} of {contracts.length} contracts
          </p>
        </aside>

        {/* Right: Detail Panel */}
        <main className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-3">
              <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Select a contract to view details</p>
              <p className="text-xs">Click any contract card on the left to see flags, extracted fields, and AI risk assessment</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Contract header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400">Contract #{selected.num}</span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">{selected.type}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.displayName}</h2>
                  <p className="text-sm text-slate-500 mt-1 max-w-2xl">{selected.summary}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-800">{selected.riskScore.toFixed(1)}</div>
                    <div className="text-xs text-slate-500">Risk Score</div>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${riskLevelColor[selected.riskLevel as RiskLevel]}`}>
                    {selected.riskLevel}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-200" />

              {/* Three-column layout */}
              <div className="grid grid-cols-3 gap-6">
                {/* Flags */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    AI-Identified Flags ({selected.flagsCount})
                  </h3>
                  {selected.flags.length === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                      <p className="text-emerald-700 text-sm font-medium">✓ No flags detected</p>
                      <p className="text-emerald-600 text-xs mt-1">This document appears compliant</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selected.flags.map((f) => <FlagRow key={f.field} flag={f} />)}
                    </div>
                  )}
                </div>

                {/* Extracted Fields */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Extracted Information
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    {selected.extractedFields.map((f) => (
                      <ExtractedField key={f.label} field={f} />
                    ))}
                  </div>
                </div>

                {/* Jev AI Assessment */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Jev AI Risk Assessment
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <JevPanel jev={selected.jev} />
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Model:</span>
                        <span className="text-xs font-mono text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                          {selected.jev.riskSeverity.choice || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Text */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Contract Document
                </h3>
                <ContractTextPanel text={contractText} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
