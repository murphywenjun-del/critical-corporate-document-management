import { useState, useEffect } from 'react'
import { contracts, pipelineStages } from './data'
import './App.css'

type Severity = 'Critical' | 'High' | 'Medium'
type RiskLevel = 'Low' | 'Critical'

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

const highlightBgColor: Record<Severity, string> = {
  Critical: 'bg-red-200 border-b border-red-300',
  High: 'bg-orange-200 border-b border-orange-300',
  Medium: 'bg-yellow-200 border-b border-yellow-300',
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

// ── Highlighted text rendering ───────────────────────────────────────────────

// Search the FULL text for highlight terms, returning character-level ranges
function buildHighlightRanges(
  fullText: string,
  highlights: Array<{ text: string; severity: Severity }>
): Array<{ start: number; end: number; severity: Severity }> {
  if (highlights.length === 0) return []

  // Sort by length descending so longer matches take priority
  const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length)
  const ranges: Array<{ start: number; end: number; severity: Severity }> = []

  for (const h of sorted) {
    const needleLower = h.text.toLowerCase()
    let idx = 0
    while (idx <= fullText.length - h.text.length) {
      const pos = fullText.toLowerCase().indexOf(needleLower, idx)
      if (pos === -1) break
      ranges.push({ start: pos, end: pos + h.text.length, severity: h.severity })
      idx = pos + h.text.length
    }
  }

  // Sort by start position and merge overlapping ranges
  ranges.sort((a, b) => a.start - b.start)
  const merged: Array<{ start: number; end: number; severity: Severity }> = []
  const sevOrder = { Critical: 3, High: 2, Medium: 1 }
  for (const r of ranges) {
    if (merged.length > 0 && r.start < merged[merged.length - 1].end) {
      const last = merged[merged.length - 1]
      if (sevOrder[r.severity] > sevOrder[last.severity]) {
        last.severity = r.severity
      }
      last.end = Math.max(last.end, r.end)
    } else {
      merged.push(r)
    }
  }
  return merged
}

// Build per-line spans from full-text ranges (handles cross-line matches)

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

function FlagRow({ flag, onClick }: { flag: (typeof contracts)[0]['flags'][0]; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors hover:shadow-sm ${
        onClick ? 'cursor-pointer' : ''
      } ${severityColor[flag.severity]}`}
    >
      <span className={`w-2 h-2 rounded-full ${severityDot[flag.severity]} mt-1.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold uppercase tracking-wide opacity-70">{flag.severity}</span>
          <span className="text-xs font-mono opacity-60">[{flag.field}]</span>
          {flag.highlightField && (
            <span className="text-[10px] text-slate-400 ml-auto shrink-0">Click to locate</span>
          )}
        </div>
        <p className="text-sm">{flag.flag_if}</p>
      </div>
    </button>
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

function ContractTextPanel({
  text,
  highlights,
  selectedFlagHighlight,
}: {
  text: string
  highlights: Array<{ text: string; severity: Severity; reason: string }>
  selectedFlagHighlight?: string
}) {
  const [selectedHighlight, setSelectedHighlight] = useState<{ text: string; severity: Severity; reason: string; lineIdx: number } | null>(null)
  const ranges = buildHighlightRanges(text, highlights)
  const lines = text.split('\n')
  
  // Compute line start offsets in the full text
  const lineOffsets: number[] = []
  let off = 0
  for (const l of lines) {
    lineOffsets.push(off)
    off += l.length + 1
  }

  // Auto-select and scroll to highlight when a flag is clicked
  useEffect(() => {
    if (!selectedFlagHighlight) return
    // Poll until text is loaded
    const poll = setInterval(() => {
      if (!text) return
      const hl = highlights.find(h => h.text === selectedFlagHighlight)
      if (!hl) { clearInterval(poll); return }
      const idx = text.toLowerCase().indexOf(hl.text.toLowerCase())
      if (idx === -1) { clearInterval(poll); return }
      const lineNum = text.slice(0, idx).split('\n').length
      setSelectedHighlight({ text: hl.text, severity: hl.severity, reason: hl.reason, lineIdx: lineNum - 1 })
      clearInterval(poll)
      // Scroll into view after React renders
      setTimeout(() => {
        const marked = document.querySelector('mark[title="Click to show/hide reason"]:not([style*="display: none"])')
        if (marked) marked.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }, 50)
    // Cleanup after 3 seconds max
    setTimeout(() => clearInterval(poll), 3000)
    return () => clearInterval(poll)
  }, [selectedFlagHighlight])
  
  return (
    <div className="text-xs text-slate-700 font-mono leading-relaxed max-h-96 overflow-y-auto bg-slate-50 rounded-lg p-4 border border-slate-200 whitespace-pre-wrap">
      {lines.map((line, i) => {
        const ls = lineOffsets[i]
        const le = ls + line.length
        
        const segments: Array<{ text: string; severity: Severity | null }> = []
        let pos = ls
        
        for (const r of ranges) {
          if (r.end <= ls || r.start >= le) continue
          // Text before this range (within this line)
          if (r.start > pos) {
            segments.push({ text: line.slice(pos - ls, r.start - ls), severity: null })
          }
          // Range portion within this line
          const segS = Math.max(r.start, ls) - ls
          const segE = Math.min(r.end, le) - ls
          segments.push({ text: line.slice(segS, segE), severity: r.severity })
          pos = Math.max(pos, r.end)
        }
        
        if (pos < le) {
          segments.push({ text: line.slice(pos - ls), severity: null })
        }
        
        if (segments.length === 0 || (segments.length === 1 && !segments[0].severity && segments[0].text === line)) {
          if (line.trim() === '') return <div key={i} />
          if (line.startsWith('# ')) return <h2 key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1">{line.slice(2)}</h2>
          if (line.startsWith('## ')) return <h3 key={i} className="text-xs font-bold text-slate-700 mt-2 mb-1">{line.slice(3)}</h3>
          if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>
          return <p key={i} className="mb-0.5">{line}</p>
        }
        
        const content = segments.map((s, j) => {
          if (!s.severity) return <span key={j}>{s.text}</span>
          const hl = highlights.find(h => h.text === s.text)
          const isSelected = selectedHighlight?.text === s.text && selectedHighlight?.lineIdx === i
          const sev = s.severity
          return (
            <span key={j}>
              <mark
                className={`px-0.5 rounded cursor-pointer hover:opacity-80 ${highlightBgColor[sev!]} ${isSelected ? 'ring-1 ring-slate-400' : ''}`}
                onClick={() => {
                  if (!sev || !hl) return
                  setSelectedHighlight(prev => {
                    if (prev?.text === s.text && prev?.lineIdx === i) return null
                    return { text: s.text, severity: sev, reason: hl.reason, lineIdx: i }
                  })
                }}
                title="Click to show/hide reason"
              >{s.text}</mark>
              {isSelected && hl && (
                <span className="ml-1 text-[10px] border-l-2 pl-2 align-middle" style={{ whiteSpace: 'nowrap', borderColor: s.severity === 'Critical' ? '#f87171' : s.severity === 'High' ? '#fb923c' : '#facc15' }}>
                  <span className={`font-semibold mr-2 ${
                    s.severity === 'Critical' ? 'text-red-600' : s.severity === 'High' ? 'text-orange-600' : 'text-yellow-700'
                  }`}>{s.severity}</span>
                  <span className="text-red-600">{hl.reason}</span>
                </span>
              )}
            </span>
          )
        })

        if (line.trim() === '') return <div key={i} />
        if (line.startsWith('# ')) return <h2 key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1">{content}</h2>
        if (line.startsWith('## ')) return <h3 key={i} className="text-xs font-bold text-slate-700 mt-2 mb-1">{content}</h3>
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{content}</li>
        return <p key={i} className="mb-0.5">{content}</p>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedFlagHighlight, setSelectedFlagHighlight] = useState<string | null>(null)

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
        .then((t) => {
        const match = t.match(/```([\s\S]*?)```/)
        setContractText(match ? match[1].trim() : t)
      })
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
      <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate">Southlake Health — Document Risk Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">AI-assisted contract compliance &amp; risk assessment prototype</p>
          </div>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
          {/* Desktop stats */}
          <div className="hidden sm:flex items-center gap-6 text-xs">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{contracts.length}</div>
              <div className="text-slate-500">Contracts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
              <div className="text-slate-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{totalFlags}</div>
              <div className="text-slate-500">Flags</div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile stats bar */}
      <div className="sm:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-around text-xs">
        <div className="text-center">
          <div className="text-lg font-bold text-slate-800">{contracts.length}</div>
          <div className="text-slate-500">Contracts</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-500">{criticalCount}</div>
          <div className="text-slate-500">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-500">{totalFlags}</div>
          <div className="text-slate-500">Flags</div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-3">
        <div className="max-w-screen-2xl mx-auto">
          <PipelineDiagram />
        </div>
      </div>

      {/* Highlight legend */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 sm:px-6">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <span className="font-semibold">Legend:</span>
          <span className="flex items-center gap-1"><mark className="px-1 rounded bg-red-200 border-b border-red-300 text-xs">Critical</mark> Unauthorized signatory / missing compliance</span>
          <span className="flex items-center gap-1"><mark className="px-1 rounded bg-orange-200 border-b border-orange-300 text-xs">High</mark> Expired / uncapped / conflicting terms</span>
          <span className="flex items-center gap-1"><mark className="px-1 rounded bg-yellow-200 border-b border-yellow-300 text-xs">Medium</mark> Warning / attention needed</span>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto flex">
        {/* Left: Contract List — desktop sidebar / mobile overlay */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-slate-200 flex flex-col gap-4 p-4 overflow-y-auto
            transform transition-transform duration-200 ease-in-out
            lg:relative lg:transform-none lg:w-80 lg:flex lg:visible
            ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{ top: '112px', maxHeight: 'calc(100vh - 112px)' }}
        >
          {/* Overlay backdrop for mobile */}
          {mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden absolute top-3 right-3 p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

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
                onClick={() => { setSelected(c); setMobileMenuOpen(false) }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center">
            {filtered.length} of {contracts.length} contracts
          </p>
        </aside>

        {/* Overlay backdrop for mobile sidebar */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Right: Detail Panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-96 text-center text-slate-400 gap-3">
              <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Select a contract to view details</p>
              <p className="text-xs">Click any contract card on the left to see flags, extracted fields, and AI risk assessment</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Contract header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-slate-400">Contract #{selected.num}</span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">{selected.type}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">{selected.displayName}</h2>
                  <p className="text-sm text-slate-500 mt-1">{selected.summary}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-800">{selected.riskScore.toFixed(1)}</div>
                    <div className="text-xs text-slate-500">Risk Score</div>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${riskLevelColor[selected.riskLevel as RiskLevel]}`}>
                    {selected.riskLevel}
                  </span>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              {/* Three-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                      {selected.flags.map((f) => (
                      <FlagRow
                        key={f.field}
                        flag={f}
                        onClick={f.highlightField ? () => setSelectedFlagHighlight(selectedFlagHighlight === f.highlightField ? null : f.highlightField!) : undefined}
                      />
                    ))}
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

              {/* Contract Text with highlights */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Contract Document
                  {selected.textHighlights.length > 0 && (
                    <span className="ml-2 text-slate-400 font-normal normal-case">
                      ({selected.textHighlights.length} risk terms highlighted)
                    </span>
                  )}
                </h3>
                <ContractTextPanel text={contractText} highlights={selected.textHighlights} selectedFlagHighlight={selectedFlagHighlight || undefined} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
