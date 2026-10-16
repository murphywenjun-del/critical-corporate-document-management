import { useState, useEffect, useRef } from 'react'
import { contracts, portfolioStats, docLinks, HEROC_SUBCATS, SOUTHDEPARTMENTS, SUBCAT_DEPTS, type Flag, type ContractDoc, type Amendment, type DocLink } from './data'


// ── Toast Notification System ──────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'info' | 'warn' }[]>([])
  const show = (msg: string, type: 'success' | 'info' | 'warn' = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }
  return { toasts, show }
}

function ToastContainer({ toasts }: { toasts: { id: number; msg: string; type: string }[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-16 right-4 z-[999] space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all animate-slideIn ${
          t.type === 'success' ? 'bg-emerald-600' : t.type === 'warn' ? 'bg-amber-500' : 'bg-slate-700'
        }`}>
          {t.type === 'success' ? '✓' : t.type === 'warn' ? '⚠' : 'ℹ'} {t.msg}
        </div>
      ))}
    </div>
  )
}


// ── Confirm Modal (in-page, replaces native confirm) ─────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false, showNote = false }: {
  title: string
  message: string
  onConfirm: (note?: string) => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
  showNote?: boolean
}) {
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5">
        <div className="text-sm font-bold text-slate-900 mb-1">{title}</div>
        <div className="text-xs text-slate-600 mb-3 whitespace-pre-line">{message}</div>
        {showNote && (
          <div className="mb-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Resolution note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Updated contract with legal, added clause 8.2…"
              rows={2}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
        )}
        <div className="text-[10px] text-slate-400 mb-3">Resolved by: You · {new Date().toLocaleDateString()}</div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg py-2 transition">Cancel</button>
          <button onClick={() => onConfirm(showNote ? note : undefined)} className={`flex-1 text-xs font-bold text-white rounded-lg py-2 transition ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}


// ── Design tokens ──────────────────────────────────────────────────────────────

const SEV_TEXT: Record<Flag['severity'], string> = {
  Critical: 'text-red-600',
  High: 'text-orange-600',
  Medium: 'text-amber-600',
  Low: 'text-emerald-600',
}
const SEV_DOT: Record<Flag['severity'], string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-amber-500',
  Low: 'bg-emerald-500',
}
const COMP_TYPE_BG: Record<string, string> = {
  hard: 'bg-red-50 text-red-700',
  best_practice: 'bg-amber-50 text-amber-700',
}

// ── Modal (in-page confirmation dialog) ─────────────────────────────────────

function Modal({ title, children, onConfirm, onCancel, confirmLabel = 'Confirm' }: {
  title: string
  children: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">{children}</div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button onClick={onCancel} className="text-xs font-medium px-4 py-2 rounded text-slate-500 hover:text-slate-700 bg-white border border-slate-200">
            Cancel
          </button>
          <button onClick={onConfirm} className="text-xs font-bold px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 shadow-sm">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── KPI Card (flat, big number) ──────────────────────────────────────────────

function KpiCard({ label, value, valueClass, onClick }: { label: string; value: number | string; valueClass?: string; onClick?: () => void }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-4 ${onClick ? 'cursor-pointer hover:border-teal-300 hover:shadow-sm transition' : ''}`}
      onClick={onClick}
    >
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${valueClass || 'text-slate-900'}`}>{value}</div>
    </div>
  )
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────

type TabId = 'work-queue' | 'risk-register' | 'contracts' | 'deadlines' | 'cross-refs' | 'smart-filing' | 'insights'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'work-queue', label: 'Work Queue' },
  { id: 'risk-register', label: 'Risk Register' },
  { id: 'contracts', label: 'Documents' },
  { id: 'deadlines', label: 'Deadlines' },
  { id: 'smart-filing', label: 'Filing' },
  { id: 'insights', label: 'Insights' },
]

function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="flex gap-6 border-b border-slate-200 overflow-x-auto">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
            active === t.id ? 'text-teal-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.label}
          {active === t.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}

// ── Tag Selector (filter pills) ──────────────────────────────────────────────

function TagSelector({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected === opt
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                active
                  ? 'bg-teal-600 text-white border-teal-600 font-medium'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}


// ── Risk Register Table (all flags across all contracts) ─────────────────────

function RiskRegisterTable({
  contracts: allContracts,
  onSelectContract,
  onSwitchTab,
  onFix,
  onConfirmAction,
  resolvedFlags,
}: {
  contracts: ContractDoc[]
  onSelectContract: (c: ContractDoc) => void
  onSwitchTab?: (tab: TabId) => void
  onFix?: (flagId: string) => void
  onConfirmAction?: (title: string, message: string, action: () => void, showNote?: boolean) => void
  resolvedFlags?: Set<string> // used in insights hint
}) {
  const [selSev, setSelSev] = useState('All')
  const [selCat, setSelCat] = useState('All')
  const [selSub, setSelSub] = useState('All')
  const [selClinDept, setSelClinDept] = useState('All')
  const [selFlagStatus, setSelFlagStatus] = useState('All')
  const [selSource, setSelSource] = useState('All')
  const [selScore, setSelScore] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem('southlake_status_overrides'); if (s) return JSON.parse(s) } catch {}
    return {}
  })
  useEffect(() => { localStorage.setItem('southlake_status_overrides', JSON.stringify(statusOverrides)) }, [statusOverrides])
  const rawFlags = allContracts.flatMap((c) => c.flags.map((f) => ({ ...f, contract: c })))
  const allFlags = rawFlags
  const filtered = allFlags.filter((f) => {
    if (selSev !== 'All' && f.severity !== selSev) return false
    if (selCat !== 'All' && f.risk_category !== selCat) return false
    if (selSub !== 'All' && f.subcategory !== selSub) return false
    if (selClinDept !== 'All' && f.department !== selClinDept) return false
    if (selFlagStatus !== 'All' && f.status !== selFlagStatus) return false
    if (selSource !== 'All' && f.source !== selSource) return false
    if (selScore !== null && f.risk_score !== selScore) return false
    if (search) {
      const q = search.toLowerCase()
      const match = f.flag_if?.toLowerCase().includes(q) || f.field?.toLowerCase().includes(q) || f.contract?.displayName?.toLowerCase().includes(q) || f.contract?.name?.toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })
  const sorted = [...filtered].sort((a, b) => b.risk_score - a.risk_score)
  const categories = ['All', ...Array.from(new Set(allFlags.map((f) => f.risk_category).filter(Boolean))) as string[]]
  const subcats = selCat === 'All'
    ? ['All', ...Array.from(new Set(allFlags.map((f) => f.subcategory).filter(Boolean))) as string[]]
    : ['All', ...(HEROC_SUBCATS[selCat] || [])]
  // Clinical depts: context-aware — if sub selected, show depts under that sub; else all
  const clinDepts = selSub === 'All'
    ? ['All', ...SOUTHDEPARTMENTS]
    : ['All', ...(SUBCAT_DEPTS[selSub] || [])]

  return (
    <div>
      {/* Systemic patterns hint */}
      {(() => {
        const allF = allContracts.flatMap((c) => c.flags.map((f) => ({ ...f })))
        const byField: Record<string, number> = {}
        for (const f of allF) { byField[f.field] = (byField[f.field] || 0) + 1 }
        const systemic = Object.entries(byField).filter(([, v]) => v >= 3)
        return systemic.length > 0 ? (
          <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5 mb-3 flex items-center gap-3">
            <span className="text-teal-600 text-sm">💡</span>
            <span className="text-xs text-teal-700"><b>{systemic.length} systemic patterns</b> — same issue in 3+ contracts. Consider process-level fixes.</span>
            <button onClick={() => onSwitchTab?.('insights')} className="ml-auto text-xs font-bold text-teal-600 hover:text-teal-800 hover:underline shrink-0">View Prevention Playbook →</button>
          </div>
        ) : null
      })()}

      {/* Collapsible L×I Distribution */}
      <details className="mt-4 bg-white border border-slate-200 rounded-lg">
        <summary className="px-4 py-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
          📊 L × I Risk Distribution <span className="font-normal text-slate-400">(click to expand)</span>
        </summary>
        <div className="px-4 pb-4">
          {(() => {
            const counts: Record<string, number> = {}
            const LABELS: string[][] = [
              ['Rare','Unlikely','Might happen','Likely','Will happen'],
              ['Tiny','Minor','Noticeable','Significant','Severe'],
            ]
            for (const f of allFlags) {
              const label = `${LABELS[0][f.likelihood-1] || '?'} × ${LABELS[1][f.impact-1] || '?'}`
              counts[label] = (counts[label] || 0) + 1
            }
            return (
              <>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, cnt]) => {
                  const lIdx = ['Rare','Unlikely','Might happen','Likely','Will happen'].indexOf(label.split(' × ')[0])
                  const iIdx = ['Tiny','Minor','Noticeable','Significant','Severe'].indexOf(label.split(' × ')[1] || '')
                  const matchScore = (lIdx + 1) * (iIdx + 1)
                  const isActive = selScore === matchScore
                  const sev = matchScore >= 20 ? 'bg-red-500 hover:bg-red-600' :
                    matchScore >= 12 ? 'bg-orange-500 hover:bg-orange-600' :
                    matchScore >= 6 ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-slate-400 hover:bg-slate-500'
                  return (
                    <button
                      key={label}
                      onClick={() => setSelScore(isActive ? null : matchScore)}
                      className={`${isActive ? sev + ' ring-2 ring-offset-1 ring-teal-300' : sev} text-white text-[10px] font-bold px-2.5 py-1.5 rounded cursor-pointer transition-all ${!isActive ? 'opacity-70 hover:opacity-100' : ''}`}
                      title={isActive ? 'Click to clear filter' : `Filter: ${cnt} flags with this score`}
                    >
                      {label} · {cnt}{isActive ? ' ✓' : ''}
                    </button>
                  )
                })}
              </div>
              {selScore !== null && (
                <div className="mt-3 bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <div className="text-[10px] font-bold text-teal-700 mb-2">
                    Score = {selScore}: {allFlags.filter((f) => f.risk_score === selScore).length} flags across {new Set(allFlags.filter((f) => f.risk_score === selScore).map((f) => f.contract.num)).size} contracts
                    <button onClick={() => setSelScore(null)} className="ml-2 text-teal-500 underline">clear</button>
                  </div>
                  <div className="space-y-1">
                    {allFlags.filter((f) => f.risk_score === selScore).map((f, i) => (
                      <button key={i} onClick={() => { onSelectContract(f.contract); setSelScore(null) }} className="flex items-center gap-2 text-[11px] text-slate-700 hover:text-teal-700 hover:bg-white rounded px-2 py-1 w-full text-left transition">
                        <span className={`w-2 h-2 rounded-full ${f.severity === 'Critical' ? 'bg-red-500' : f.severity === 'High' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                        <span className="font-medium">#{f.contract.num} {f.contract.displayName}</span>
                        <span className="text-slate-400">· {f.flag_if}</span>
                        <span className="ml-auto text-teal-600 text-[10px] font-bold">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              </>
            )
          })()}
        </div>
      </details>

      {/* Search + Export */}
      <div className="mb-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flags, contracts… (e.g. 'breach', 'NDA', 'VP signature')"
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>}
        </div>
        <button
          onClick={() => {
            const header = 'Severity,L,Impact,Score,Category,Subcategory,Department,Status,Source,Compliance,Issue,Contract\n'
            const rows = sorted.map((f) => [
              f.severity, f.likelihood, f.impact, f.risk_score,
              f.risk_category, f.subcategory, f.department,
              f.status, f.source, f.compliance_type,
              `"${f.flag_if.replace(/"/g, '""')}"`,
              `#${f.contract.num} ${f.contract.displayName}`
            ].join(',')).join('\n')
            const blob = new Blob([header + rows], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `risk_register_${new Date().toISOString().slice(0, 10)}.csv`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="text-[10px] font-medium text-slate-500 hover:text-teal-600 border border-slate-200 rounded px-2 py-1.5 bg-white hover:bg-teal-50 transition"
        >
          ⬇ Export CSV ({sorted.length})
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <div className="flex gap-6 flex-wrap">
          <TagSelector label="Severity" options={['All', 'Critical', 'High', 'Medium', 'Low']} selected={selSev} onChange={setSelSev} />
          <TagSelector label="HEROC Category" options={categories} selected={selCat} onChange={setSelCat} />
          <TagSelector label="Status" options={['All', 'open', 'remediated', 'accepted']} selected={selFlagStatus} onChange={setSelFlagStatus} />
          <details className="text-[11px] text-slate-400">
            <summary className="cursor-pointer hover:text-slate-600 py-1">More filters ▾</summary>
            <div className="flex gap-6 mt-2 flex-wrap">
              <TagSelector label="Subcategory" options={subcats} selected={selSub} onChange={setSelSub} />
              <TagSelector label="Clinical Dept" options={clinDepts} selected={selClinDept} onChange={setSelClinDept} />
              <TagSelector label="Source" options={['All', 'rule', 'ai_scan']} selected={selSource} onChange={setSelSource} />
            </div>
          </details>
        </div>
      </div>

      {/* Source legend */}
      <div className="flex items-center gap-4 mb-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Rule-based</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> AI-detected</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Open</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Remediated</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-20">Severity</th>
              <th className="text-center px-2 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-14">Risk</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-20">Status</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Issue</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-28">Contract</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => (
              <tr key={i} className={`border-b border-slate-100 last:border-0 transition-colors ${f.severity === 'Critical' ? 'border-l-4 border-l-red-500 bg-red-50/40 hover:bg-red-50' : f.severity === 'High' ? 'border-l-4 border-l-orange-400 bg-orange-50/30 hover:bg-orange-50' : 'hover:bg-slate-50'}`}>
                <td className="px-4 py-2.5">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${SEV_TEXT[f.severity]}`}>
                    <span className={`w-2 h-2 rounded-full ${SEV_DOT[f.severity]}`} />
                    {f.severity}
                  </span>
                </td>
                <td className="px-2 py-2.5 text-center">
                  <div className="text-[10px] font-mono font-bold text-slate-500">{f.likelihood}×{f.impact}</div>
                  <div className={`text-xs font-bold ${f.risk_score>=20?'text-red-600':f.risk_score>=12?'text-orange-600':f.risk_score>=6?'text-yellow-600':'text-emerald-600'}`}>{f.risk_score}</div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      f.status === 'open' ? 'bg-red-100 text-red-700' :
                      f.status === 'remediated' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {f.status === 'open' ? 'Open' : f.status === 'remediated' ? '✓ Done' : 'Accepted'}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${f.source === 'ai_scan' ? 'bg-purple-500' : 'bg-teal-500'}`} title={f.source === 'ai_scan' ? 'AI-detected' : 'Rule-based'} />
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-700 max-w-xs truncate">{f.flag_if}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => onSelectContract(f.contract)} className="text-xs text-teal-600 hover:text-teal-800 hover:underline">
                    #{f.contract.num} {f.contract.displayName}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    {statusOverrides[`${f.contract.num}_${f.field}_${i}`] === 'remediated' ? (
                      <span className="text-[9px] text-emerald-600 font-bold">✓ Done</span>
                    ) : statusOverrides[`${f.contract.num}_${f.field}_${i}`] === 'accepted' ? (
                      <span className="text-[9px] text-slate-500">Accepted</span>
                    ) : resolvedFlags?.has(`f-${f.contract.num}-${f.field}`) ? (
                      <span className="text-[9px] text-emerald-600 font-bold">✓ Resolved</span>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); onConfirmAction?.(`Resolve Flag`, `"${f.field}"\n\nDocument: ${f.contract.displayName} (#${f.contract.num})\nSeverity: ${f.severity}\nL×I: ${f.L}×${f.I} = ${f.risk_score}`, () => { setStatusOverrides((p) => ({ ...p, [`${f.contract.num}_${f.field}_${i}`]: 'remediated' })); onFix?.(`f-${f.contract.num}-${f.field}`) }), true) }} className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition">Fix</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  No flags match the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-2">{sorted.length} of {allFlags.length} flags</p>
    </div>
  )
}

// ── Contract List (flat items, not cards) ───────────────────────────────────


// ── Criteria-Based Compliance Panel (F) ─────────────────────────────────────────
// Sam's proposal: applicability varies by document type
function CriteriaPanel({ contracts: allContracts }: { contracts: ContractDoc[] }) {
  const CRITERIA: Record<string, string[]> = {
    'NDA': ['PHIPA clause', 'Data return/destruction', 'Breach notification ≤48h', 'Governing law = Ontario', '2 VP signatures', 'Confidentiality ≥3yr'],
    'MOU': ['Clear binding language', 'Financial caps', 'Termination mechanism', 'Governing law = Ontario', '2 VP signatures'],
    'Procurement': ['SLA with KPIs', 'Service credits', 'Insurance specified', 'Data security + encryption', 'Termination for convenience', 'Governing law = Ontario'],
    'Data_Sharing': ['PHIPA declaration', 'Data minimization', 'Breach notification ≤24h', 'Audit rights', 'Governing law = Ontario', 'Retention period defined'],
  }

  // Group by type and show criteria met
  const byType: Record<string, ContractDoc[]> = {}
  for (const c of allContracts) {
    if (!byType[c.type]) byType[c.type] = []
    byType[c.type].push(c)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-bold text-slate-800">Criteria-Based Compliance</h3>
        <span className="text-[10px] text-slate-400">Applicability varies by document type</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(byType).map(([type, docs]) => {
          const criteria = CRITERIA[type] || []
          const total = docs.length
          const clean = docs.filter((d) => d.flags.length === 0).length
          const hardGaps = docs.reduce((sum, d) => sum + (d.compliance?.hardGaps || 0), 0)
          const rate = total > 0 ? Math.round(((total - hardGaps) / (total * (criteria.length || 1))) * 100) : 100
          return (
            <div key={type} className="border border-slate-100 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">{type}</span>
                <span className="text-[10px] text-slate-400">{total} docs</span>
              </div>
              <div className="text-[10px] text-slate-500 mb-2">{clean}/{total} clean · {hardGaps} hard gaps</div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, rate)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{rate}% criteria met</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ContractList (with archive + superseded) ───────────────────────────────────

function ContractList({
  contracts: allContracts,
  selectedNum,
  onSelect,
}: {
  contracts: ContractDoc[]
  selectedNum: number | null
  onSelect: (c: ContractDoc) => void
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
      {allContracts.map((c) => (
        <button
          key={c.num}
          onClick={() => onSelect(c)}
          className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 ${
            selectedNum === c.num ? 'bg-teal-50/50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Left: number + type */}
            <div className="flex items-center gap-2 w-24 shrink-0">
              <span className="text-xs font-mono text-slate-400">#{c.num}</span>
              <span className="text-[10px] text-slate-400 uppercase">{c.type}</span>
            </div>

            {/* Middle: name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{c.displayName}</p>
              <p className="text-xs text-slate-400 truncate">{c.summary}</p>
            </div>

            {/* Right: risk indicators + badges */}
            <div className="flex items-center gap-3 shrink-0">
              {c.baseContractId != null && (
                <span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-200">
                  AMENDMENT
                </span>
              )}
              {c.flags.some((f) => f.field === 'duplicate_version') && (
                <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                  SUPERSEDED
                </span>
              )}
              {c.flags.length === 0 && (
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                  CLEAN ✓
                </span>
              )}
              <div className="text-right">
                <div className="text-xs font-bold text-slate-700">{c.riskScore.toFixed(1)}</div>
                <div className="text-[10px] text-slate-400">score</div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${c.riskLevel === 'Critical' ? 'bg-red-500' : c.riskLevel === 'High' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                <span className={`text-[10px] font-medium ${c.riskLevel === 'Critical' ? 'text-red-600' : c.riskLevel === 'High' ? 'text-orange-600' : 'text-emerald-600'}`}>
                  {c.riskLevel}
                </span>
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">
                {c.flagsCount > 0 ? `${c.flagsCount} flags` : 'clean'}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Deadlines / Tickler Table (enhanced) ───────────────────────────────────

function DeadlinesTimeline({ contracts: allContracts, onSelectContract }: { contracts: ContractDoc[]; onSelectContract?: (c: ContractDoc) => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const sorted = allContracts.filter((c) => c.expiryDate).sort((a, b) => (a.expiryDate || '').localeCompare(b.expiryDate || ''))
  const minDate = sorted[0]?.expiryDate || today
  const maxDate = sorted[sorted.length - 1]?.expiryDate || today

  // Calculate position on timeline (0-100%)
  const pos = (d: string) => {
    const min = new Date(minDate).getTime()
    const max = new Date(maxDate).getTime()
    if (max === min) return 50
    return Math.round(((new Date(d).getTime() - min) / (max - min)) * 100)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
      <div className="text-xs font-bold text-slate-700 mb-3">Expiration Timeline</div>
      <div className="relative h-32">
        {/* Timeline line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 rounded" />
        {/* Today marker */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-50" style={{ left: `${pos(today)}%` }} />
        <span className="absolute text-[9px] text-red-500 -translate-x-1/2" style={{ left: `${pos(today)}%`, top: '-12px' }}>Today</span>
        {/* Contract dots */}
        {sorted.map((c) => (
          <div key={c.num} className="absolute top-1/2 -translate-y-1/2 group cursor-pointer" style={{ left: `${pos(c.expiryDate!)}%` }} onClick={() => onSelectContract?.(c)}>
            <div className={`w-3 h-3 rounded-full border-2 border-white shadow ${c.expiryDate! < today ? 'bg-red-500' : c.expiryDate!.slice(0, 7) === today.slice(0, 7) ? 'bg-amber-500' : 'bg-teal-500'} group-hover:scale-125 transition-transform`} />
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
              #{c.num} {c.expiryDate} · click →
            </div>
          </div>
        ))}
        {/* Axis labels */}
        <div className="absolute bottom-0 left-0 text-[9px] text-slate-400">{minDate}</div>
        <div className="absolute bottom-0 right-0 text-[9px] text-slate-400">{maxDate}</div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[9px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Expired</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Expiring (this month)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Future</span>
        <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-red-400" /> Today</span>
      </div>
    </div>
  )
}

function DeadlinesTable({ contracts: allContracts, onSelectContract }: { contracts: ContractDoc[]; onSelectContract?: (c: ContractDoc) => void }) {
  const today = new Date('2026-10-15') // demo reference date
  const rows = allContracts
    .filter((c) => c.expiryDate)
    .map((c) => {
      const exp = new Date(c.expiryDate)
      const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 86400000)
      const noticeDays = c.renewalNoticeDays || 60
      const noticeDeadline = new Date(exp.getTime() - noticeDays * 86400000)
      const daysToNotice = Math.ceil((noticeDeadline.getTime() - today.getTime()) / 86400000)
      let urgency: 'expired' | 'critical' | 'warning' | 'ok'
      if (daysLeft < 0) urgency = 'expired'
      else if (daysLeft <= 30) urgency = 'critical'
      else if (daysLeft <= 90) urgency = 'warning'
      else urgency = 'ok'
      return { c, daysLeft, daysToNotice, noticeDays, urgency }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const urgencyColors: Record<string, { bg: string; text: string; bar: string }> = {
    expired:  { bg: 'bg-red-50',  text: 'text-red-700',  bar: 'bg-red-500' },
    critical: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
    warning:  { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-400' },
    ok:       { bg: 'bg-emerald-50/50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  }
  const urgencyLabels: Record<string, string> = {
    expired: 'EXPIRED', critical: 'CRITICAL', warning: 'UPCOMING', ok: 'ACTIVE',
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="flex gap-4 mb-4">
        {(['expired','critical','warning','ok'] as const).map((u) => {
          const count = rows.filter((r) => r.urgency === u).length
          const uc = urgencyColors[u]
          return (
            <div key={u} className={`flex-1 ${uc.bg} border border-slate-200 rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-bold ${uc.text}`}>{count}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{urgencyLabels[u]}</div>
            </div>
          )
        })}
      </div>

      {/* Source legend */}
      <div className="flex items-center gap-4 mb-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Rule-based</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> AI-detected</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Open</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Remediated</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-12">Num</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Document</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-24">Expiry</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-20">Days Left</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-28">Renewal Notice</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide w-20">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const uc = urgencyColors[r.urgency]
              return (
                <tr key={i} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${r.urgency === 'expired' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">#{r.c.num}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => onSelectContract?.(r.c)} className="text-sm text-slate-800 hover:text-teal-600 hover:underline text-left">
                      {r.c.displayName}
                    </button>
                    <div className="text-[10px] text-slate-400">{r.c.department}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 font-mono">{r.c.expiryDate}</td>
                  <td className={`px-4 py-2.5 text-xs font-bold ${uc.text}`}>
                    {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d ago` : `${r.daysLeft}d`}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {r.daysToNotice < 0
                      ? <span className="text-red-600 font-medium">Overdue ({Math.abs(r.daysToNotice)}d)</span>
                      : <span>{r.daysToNotice}d remaining</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${uc.bar}`} />
                      <span className={`text-[10px] font-bold ${uc.text}`}>{urgencyLabels[r.urgency]}</span>
                    </div>
                    {/* Urgency bar */}
                    <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${uc.bar}`}
                        style={{ width: `${Math.min(100, Math.max(5, 100 - Math.max(0, r.daysLeft)))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 5×5 L×I Risk Matrix ──────────────────────────────────────────────────────

const L_LABELS = ['', 'Rare', 'Unlikely', 'Might happen', 'Likely', 'Will happen']
const I_LABELS = ['', 'Tiny', 'Small', 'Noticeable', 'Major', 'Severe']

// @ts-ignore - inlined into Risk Register collapsible
function RiskMatrixView({ contracts: allContracts }: { contracts: ContractDoc[] }) {
  // Collect all flags with L and I
  const rawFlags = allContracts.flatMap((c) => c.flags.map((f) => ({ ...f, contract: c })))
  const allFlags = rawFlags
  
  // Build the 5×5 grid
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0))
  allFlags.forEach((f) => {
    const l = Math.min(5, Math.max(1, f.likelihood))
    const i = Math.min(5, Math.max(1, f.impact))
    grid[5 - l][i - 1]++ // row 0 = L5 (top), col 0 = I1 (left)
  })

  // Color based on L×I score
  function cellColor(l: number, i: number): string {
    const score = l * i
    if (score >= 20) return 'bg-red-100 border-red-300'
    if (score >= 12) return 'bg-orange-50 border-orange-200'
    if (score >= 6) return 'bg-yellow-50 border-yellow-200'
    return 'bg-emerald-50 border-emerald-200'
  }
  function cellText(l: number, i: number): string {
    const score = l * i
    if (score >= 20) return 'text-red-700'
    if (score >= 12) return 'text-orange-700'
    if (score >= 6) return 'text-yellow-700'
    return 'text-emerald-700'
  }

  return (
    <div className="space-y-6">
      {/* Methodology header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-1">How We Score Risk</h3>
        <p className="text-xs text-slate-500 mb-4">
          Each risk gets two scores: how likely it is to happen (L) and how bad it would be (I). Multiply them to get a risk score out of 25.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-600 mb-2">LIKELIHOOD (L)</h4>
            <div className="space-y-1">
              {[1,2,3,4,5].map((v) => (
                <div key={v} className="flex items-center gap-2 text-xs">
                  <span className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 font-bold text-slate-700">{v}</span>
                  <span className="text-slate-600">{L_LABELS[v]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-600 mb-2">IMPACT (I)</h4>
            <div className="space-y-1">
              {[1,2,3,4,5].map((v) => (
                <div key={v} className="flex items-center gap-2 text-xs">
                  <span className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 font-bold text-slate-700">{v}</span>
                  <span className="text-slate-600">{I_LABELS[v]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          <strong>Risk score = L × I</strong> → 1–5 = Low · 6–11 = Moderate · 12–19 = High · 20–25 = Critical
        </div>
      </div>

      {/* 5×5 Grid */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Risk Matrix (flags plotted)</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="w-8"></th>
                {[1,2,3,4,5].map((i) => (
                  <th key={i} className="text-center text-[10px] font-medium text-slate-500 pb-2">
                    <div className="text-xs font-bold text-slate-700">{I_LABELS[i]}</div>
                    <div className="text-[9px] text-slate-400">Impact {i}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[5,4,3,2,1].map((l) => (
                <tr key={l}>
                  <td className="text-right pr-2">
                    <div className="text-xs font-bold text-slate-700">{L_LABELS[l]}</div>
                    <div className="text-[9px] text-slate-400">L={l}</div>
                  </td>
                  {[1,2,3,4,5].map((i) => {
                    const count = grid[5-l][i-1]
                    return (
                      <td key={i} className={`border border-slate-200 p-2 text-center ${cellColor(l,i)}`}>
                        <div className={`text-lg font-bold ${cellText(l,i)}`}>{l*i}</div>
                        {count > 0 && (
                          <div className="text-[10px] font-medium text-slate-600 mt-0.5">{count} flag{count>1?'s':''}</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 mt-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300"/>Critical (20–25)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-50 border border-orange-200"/>High (12–19)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-50 border border-yellow-200"/>Moderate (6–11)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200"/>Low (1–5)</span>
        </div>
      </div>

      {/* HEROC Category breakdown */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3">HEROC Taxonomy — Flag Distribution</h3>
        <div className="grid grid-cols-4 gap-3">
          {['Operational','Financial','Reputational','Continuity'].map((cat) => {
            const catFlags = allFlags.filter((f) => f.risk_category === cat)
            const subcats = Array.from(new Set(catFlags.map((f) => f.subcategory).filter(Boolean)))
            const avgScore = catFlags.length ? Math.round(catFlags.reduce((s,f) => s+f.risk_score, 0) / catFlags.length) : 0
            return (
              <div key={cat} className="border border-slate-200 rounded-lg p-3">
                <div className="text-xs font-bold text-slate-700 mb-1">{cat}</div>
                <div className="text-2xl font-bold text-slate-900">{catFlags.length}</div>
                <div className="text-[10px] text-slate-400">avg score {avgScore}/25</div>
                <div className="mt-2 space-y-0.5">
                  {subcats.map((s) => (
                    <div key={s} className="text-[10px] text-slate-500">· {s}</div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Cross-References View (closed-loop, modal-confirmed) ────────────────────

type WfState = 'detected' | 'acknowledged' | 'fixing' | 'verified' | 'closed'
const WF_STEPS: Array<{ id: WfState; label: string; color: string; desc: string }> = [
  { id: 'detected',     label: 'Detected',   color: 'bg-red-100 text-red-700 border-red-200',     desc: 'System flagged this gap' },
  { id: 'acknowledged', label: 'Acknowledged', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'A human has seen and accepted this gap' },
  { id: 'fixing',       label: 'Fixing',     color: 'bg-blue-100 text-blue-700 border-blue-200',    desc: 'Target document is being updated' },
  { id: 'verified',     label: 'Verified',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Human confirmed the fix is correct' },
  { id: 'closed',       label: 'Closed',     color: 'bg-slate-100 text-slate-500 border-slate-200', desc: 'Loop complete, no further action needed' },
]

function CrossRefsView({ contracts: allContracts }: { contracts: ContractDoc[] }) {
  const [wf, setWf] = useState<Record<string, WfState>>(() => {
    const init: Record<string, WfState> = {}
    for (const l of docLinks) {
      init[`${l.sourceNum}-${l.targetName}`] = l.status === 'synced' ? 'closed' : 'detected'
    }
    return init
  })
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [wizard, setWizard] = useState<DocLink | null>(null) // open wizard for this link
  const [toast, setToast] = useState('')
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  function lk(l: DocLink) { return `${l.sourceNum}-${l.targetName}` }

  const openCount = docLinks.filter((l) => wf[lk(l)] !== 'closed').length




  function LinkCard({ link }: { link: DocLink }) {
    const key = lk(link)
    const state = wf[key]
    const isExpanded = expanded[key] || false
    const isSynced = link.status === 'synced'
    const source = allContracts.find((c) => c.num === link.sourceNum)
    const stepIdx = WF_STEPS.findIndex((s) => s.id === state)

    return (
      <div className={`border rounded-lg overflow-hidden ${isSynced ? 'border-emerald-200' : state === 'detected' ? 'border-red-200' : state === 'verified' || state === 'closed' ? 'border-emerald-200' : 'border-amber-200'}`}>
        {/* Main row - click to expand */}
        <div className="p-4 cursor-pointer" onClick={() => setExpanded((p) => ({ ...p, [key]: !isExpanded }))}>
          <div className="flex items-center gap-1 mb-2">
            {WF_STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${i <= stepIdx ? 'bg-teal-500 border-teal-400' : 'bg-white border-slate-300'}`} />
                {i < WF_STEPS.length - 1 && <div className={`w-5 h-0.5 ${i < stepIdx ? 'bg-teal-300' : 'bg-slate-200'}`} />}
              </div>
            ))}
            <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded border ${WF_STEPS[stepIdx]?.color}`}>
              {WF_STEPS[stepIdx]?.label}
            </span>
            <span className="ml-auto text-[10px] text-slate-400">{isExpanded ? '▲' : '▼ details'}</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">{source ? `#${source.num} ${source.displayName}` : `Contract #${link.sourceNum}`}</div>
              <div className="text-[11px] text-slate-500">{link.sourceClause}</div>
            </div>
            <div className="text-slate-300 text-sm">→</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">{link.targetName}</div>
              <div className="text-[11px] text-slate-500">{link.targetClause}</div>
            </div>
          </div>

          {!isExpanded && !isSynced && (
            <div className="mt-2 flex items-center gap-3">
              <div className="text-[11px] text-slate-500 line-clamp-1 flex-1">{link.riskIfNotUpdated}</div>
              {stepIdx < 4 && !isSynced && (
                <button
                  onClick={(e) => { e.stopPropagation(); setWizard(link); setExpanded((p) => ({ ...p, [key]: true })) }}
                  className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-200 rounded px-2 py-1 hover:bg-teal-100 transition shrink-0"
                >
                  ▶ Open Workflow
                </button>
              )}
            </div>
          )}
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">What changed</div>
              <div className="text-xs text-slate-700 bg-white rounded border border-slate-200 p-2">{link.changeDescription}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Risk if not updated</div>
              <div className={`text-xs p-2 rounded border ${state === 'closed' ? 'text-slate-500 bg-slate-50 border-slate-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                {link.riskIfNotUpdated}
              </div>
            </div>

            {/* Workflow button */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Workflow</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setWizard(link) }}
                  disabled={isSynced}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                    isSynced ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default' :
                    state === 'detected' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                    'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                  }`}
                >
                  {isSynced ? '✓ Resolved' : state === 'closed' ? 'Reopen' : `Continue from "${WF_STEPS[stepIdx]?.label}"`}
                </button>
                <span className="text-[10px] text-slate-400">
                  {isSynced ? 'No action needed' : `${4 - stepIdx} steps remaining`}
                </span>
              </div>
            </div>

            {/* Verification checklist */}
            {state === 'fixing' && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2">
                <div className="text-[10px] font-bold text-amber-700 uppercase mb-1">Before verifying, confirm:</div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>□ Target document ({link.targetName}) has been updated</div>
                  <div>□ Clause {link.targetClause} now matches the new requirement</div>
                  <div>□ No other documents reference the old value</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-3">
        {WF_STEPS.map((s) => {
          const count = docLinks.filter((l) => wf[lk(l)] === s.id).length
          return (
            <div key={s.id} className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-center">
              <div className={`text-xl font-bold ${s.id==='detected'?'text-red-600':s.id==='acknowledged'?'text-amber-600':s.id==='fixing'?'text-blue-600':s.id==='verified'?'text-emerald-600':'text-slate-500'}`}>{count}</div>
              <div className="text-[10px] text-slate-400">{s.label}</div>
            </div>
          )
        })}
      </div>

      <div className="text-xs text-slate-500">{openCount} of {docLinks.length} links open. Click a card to expand. Status changes require modal confirmation.</div>

      <div className="space-y-3">
        {docLinks.map((l) => <LinkCard key={lk(l)} link={l} />)}
      </div>

      {/* Workflow Wizard Modal */}
      {wizard && (() => {
        const w = wizard
        const wKey = `${w.sourceNum}-${w.targetName}`
        const wState = wf[wKey]
        const wStepIdx = WF_STEPS.findIndex((s) => s.id === wState)
        const wSource = allContracts.find((c) => c.num === w.sourceNum)
        const nextStep = wStepIdx < 4 ? WF_STEPS[wStepIdx + 1] : null
        const isDone = wState === 'closed' || wState === 'verified'
        
        // Step content generator
        function stepContent(to: WfState) {
          switch (to) {
            case 'acknowledged': return (
              <div className="space-y-2">
                <div className="text-sm text-slate-600">Confirm a responsible person has <b>reviewed and accepted</b> this gap.</div>
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                  <b>Gap:</b> {w.beforeText}
                </div>
                <div className="text-[10px] text-slate-400">Suggested owner: document custodian · SLA: 5 business days</div>
              </div>
            )
            case 'fixing': return (
              <div className="space-y-2">
                <div className="text-sm text-slate-600">Target document will be <b>updated</b> to match source requirement.</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-red-400 uppercase mb-1">Current</div>
                    <div className="text-xs text-slate-700 bg-red-50 border border-red-100 rounded p-3">{w.beforeText}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Required</div>
                    <div className="text-xs text-slate-700 bg-emerald-50 border border-emerald-100 rounded p-3">{w.afterText}</div>
                  </div>
                </div>
                {w.keyChanges.length > 0 && <div className="text-[10px] text-slate-500"><b>Changes:</b> {w.keyChanges.join(' · ')}</div>}
                <div className="text-[10px] text-slate-400">SLA: 30 days · Notify: custodian + Legal</div>
              </div>
            )
            case 'verified': return (
              <div className="space-y-2">
                <div className="text-sm text-slate-600">Confirm the target document <b>has been updated</b> and matches source.</div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs space-y-1">
                  <div className="text-blue-700 font-medium">Verification checklist:</div>
                  <div>□ {w.targetName} has been revised</div>
                  <div>□ Clause {w.targetClause} now matches: "{w.afterText}"</div>
                  <div>□ No other documents reference the old value</div>
                </div>
                <div className="text-[10px] text-slate-400">Verifier: Risk team · Evidence: revised doc version</div>
              </div>
            )
            case 'closed': return (
              <div className="space-y-2">
                <div className="text-sm text-slate-600">Marking this cross-reference as <b>fully resolved</b>.</div>
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-800">
                  ✓ {w.beforeText} → {w.afterText}
                </div>
                <div className="text-[10px] text-slate-400">Permanent. To reopen, set back to "Detected".</div>
              </div>
            )
            default: return <div className="text-[11px] text-slate-500">Review and continue.</div>
          }
        }
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setWizard(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                <div className="text-base font-bold text-slate-800">Workflow: #{w.sourceNum} → {w.targetName}</div>
                <div className="text-xs text-slate-500 mt-1">{wSource?.displayName} → {w.targetName}</div>
                {/* Step boxes - click to jump, like original 5 buttons */}
                <div className="flex items-center gap-1.5 mt-3">
                  {WF_STEPS.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setWf((p) => ({ ...p, [wKey]: s.id as WfState }))
                        setToast(`→ "${s.label}"`)
                      }}
                      className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all ${
                        i === wStepIdx ? `${s.color} ring-2 ring-offset-1 ring-teal-300` :
                        i < wStepIdx ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {i < wStepIdx && '✓ '}{s.label}{i === wStepIdx && ' ·'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                {isDone ? (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-3">✅</div>
                    <div className="text-base font-bold text-emerald-700">Workflow Complete</div>
                    <div className="text-[11px] text-slate-500 mt-1">All 5 steps completed for this cross-reference.</div>
                  </div>
                ) : (
                  stepContent(nextStep!.id as WfState)
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                <div className="flex items-center gap-2">
                  <button onClick={() => setWizard(null)} className="text-sm text-slate-400 hover:text-slate-600 px-3 py-2">
                    ✕
                  </button>
                  {wStepIdx > 0 && (
                    <button
                      onClick={() => {
                        const prev = WF_STEPS[wStepIdx - 1]
                        setWf((p) => ({ ...p, [wKey]: prev.id as WfState }))
                      }}
                      className="text-sm text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 px-4 py-2 rounded-lg"
                    >
                      ← {WF_STEPS[wStepIdx - 1]?.label}
                    </button>
                  )}
                  <div className="flex-1" />
                  {wStepIdx < 4 && (
                    <button
                      onClick={() => {
                        const nxt = WF_STEPS[wStepIdx + 1]
                        setWf((p) => ({ ...p, [wKey]: nxt.id as WfState }))
                      }}
                      className="text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 px-5 py-2 rounded-lg"
                    >
                      {WF_STEPS[wStepIdx + 1]?.label} →
                    </button>
                  )}
                  {isDone && (
                    <button onClick={() => setWizard(null)} className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-5 py-2 rounded-lg">
                      ✓ Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
      
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg max-w-sm z-50">
          {toast}
          <button onClick={() => setToast('')} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}
    </div>
  )
}

// ── Amendments View (closed-loop, modal-confirmed) ──────────────────────────

// @ts-ignore - merged into CrossRefs tab
function AmendmentsView({ contracts: allContracts, onSelect }: { contracts: ContractDoc[]; onSelect: (c: ContractDoc) => void }) {
  type AState = 'pending' | 'reviewed' | 'executed' | 'verified' | 'archived'
  const A_STEPS: Array<{ id: AState; label: string; color: string; desc: string }> = [
    { id: 'pending',  label: 'Pending',  color: 'bg-red-100 text-red-700 border-red-200', desc: 'Awaiting review' },
    { id: 'reviewed', label: 'Reviewed', color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'Terms have been read and checked' },
    { id: 'executed', label: 'Executed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'All required signatures collected' },
    { id: 'verified', label: 'Verified ✓', color: 'bg-teal-100 text-teal-700 border-teal-200', desc: 'Human confirmed terms are correct' },
    { id: 'archived', label: 'Archived', color: 'bg-slate-100 text-slate-500 border-slate-200', desc: 'Closed, no further action' },
  ]

  const [awf, setAwf] = useState<Record<string, AState>>(() => {
    const init: Record<string, AState> = {}
    for (const c of allContracts) {
      if (c.amendments) {
        for (const a of c.amendments) {
          init[`${c.num}-${a.id}`] = a.supersedesOriginal ? 'pending' : 'verified'
        }
      }
      if (c.baseContractId != null) init[`doc-${c.num}`] = 'pending'
    }
    return init
  })
  const [exp, setExp] = useState<Record<string, boolean>>({})
  const [modal, setModal] = useState<{ key: string; label: string; to: AState; context: AState; keyChanges?: string[]; beforeContext?: string; afterContext?: string } | null>(null)

  const withAmendments = allContracts.filter((c) => c.amendments && c.amendments.length > 0)
  const amendmentDocs = allContracts.filter((c) => c.baseContractId != null)

  function confirmModal() {
    if (!modal) return
    setAwf((p) => ({ ...p, [modal.key]: modal.to }))
    setModal(null)
  }

  function StatusBtns({ k, state, label, keyChanges, beforeContext, afterContext }: {
    k: string; state: AState; label: string; keyChanges?: string[]; beforeContext?: string; afterContext?: string
  }) {
    return (
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {A_STEPS.map((s) => {
            const isActive = state === s.id
            return (
              <button
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation()
                  if (isActive) return
                  setModal({ key: k, to: s.id, label, context: state, keyChanges, beforeContext, afterContext })
                }}
                className={`text-[11px] font-medium px-2 py-1 rounded border transition-all ${
                  isActive ? `${s.color} ring-2 ring-offset-1 ring-teal-300` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {s.label}{isActive && ' ✓'}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Amendment doc card (e.g. #11) ──
  function DocCard({ c }: { c: ContractDoc }) {
    const k = `doc-${c.num}`
    const state = awf[k] || 'pending'
    const isExp = exp[k] || false
    const parent = allContracts.find((x) => x.num === c.baseContractId)

    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 cursor-pointer" onClick={() => setExp((p) => ({ ...p, [k]: !isExp }))}>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={(e) => { e.stopPropagation(); parent && onSelect(parent) }} className="text-xs font-medium text-teal-600 hover:underline">
              #{parent?.num} {parent?.displayName}
            </button>
            <span className="text-slate-300">→</span>
            <button onClick={(e) => { e.stopPropagation(); onSelect(c) }} className="text-xs font-medium text-teal-600 hover:underline">
              #{c.num} {c.displayName}
            </button>
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded border ${A_STEPS.find((s) => s.id === state)?.color}`}>
              {A_STEPS.find((s) => s.id === state)?.label}
            </span>
            <span className="text-[10px] text-slate-400">{isExp ? '▲' : '▼'}</span>
          </div>
          {!isExp && c.flags.length > 0 && (
            <div className="text-[11px] text-slate-500">{c.flags.length} open risk{c.flags.length > 1 ? 's' : ''} · top: {c.flags[0].flag_if.slice(0, 60)}…</div>
          )}
        </div>

        {isExp && (
          <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            {c.flags.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Risk Flags</div>
                <div className="space-y-1.5">
                  {c.flags.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-white rounded border border-slate-200 p-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEV_DOT[f.severity]}`} />
                      <span className="text-slate-600 flex-1">{f.flag_if}</span>
                      <span className="text-slate-400 font-mono text-[10px] flex-shrink-0">L{f.likelihood}×I{f.impact}={f.risk_score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Key Fields</div>
              <div className="grid grid-cols-2 gap-1.5">
                {c.extractedFields.map((f, i) => (
                  <div key={i} className="text-[11px] bg-white rounded border border-slate-100 p-1.5">
                    <span className="text-slate-400">{f.label}: </span>
                    <span className={f.status === '✗' ? 'text-red-600 font-medium' : f.status === '?' ? 'text-amber-600' : 'text-slate-700'}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <StatusBtns k={k} state={state} label={`#${c.num} ${c.displayName}`}
              keyChanges={c.flags.map((f) => f.flag_if)}
              beforeContext={parent ? `Parent #${parent.num}: ${parent.summary.slice(0, 120)}` : ''}
              afterContext={c.summary}
            />
            {state === 'executed' && (
              <div className="bg-teal-50 border border-teal-200 rounded p-2 text-[11px] text-slate-600">
                <strong>Before verifying:</strong> Confirm all VP signatures in place, effective date correct,
                and cross-referenced docs (Security Policy, Breach Plan) updated to match.
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Amendment entry inside parent ──
  function AmendRow({ c, a }: { c: ContractDoc; a: Amendment }) {
    const k = `${c.num}-${a.id}`
    const state = awf[k] || 'pending'
    const isExp = exp[k] || false

    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-3 cursor-pointer" onClick={() => setExp((p) => ({ ...p, [k]: !isExp }))}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.supersedesOriginal ? 'bg-red-500' : 'bg-teal-500'}`} />
            <span className="text-xs font-bold text-slate-700 flex-1">{a.label}</span>
            {a.supersedesOriginal && <span className="text-[9px] font-bold bg-red-50 text-red-600 px-1.5 rounded">SUPERSEDES</span>}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${A_STEPS.find((s) => s.id === state)?.color}`}>
              {A_STEPS.find((s) => s.id === state)?.label}
            </span>
            <span className="text-[10px] text-slate-400">{a.effectiveDate}</span>
            <span className="text-slate-300 text-xs">{isExp ? '▲' : '▼'}</span>
          </div>
        </div>

        {isExp && (
          <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Key Changes</div>
              <div className="flex flex-wrap gap-1">
                {a.keyChanges.map((k2, j) => (
                  <span key={j} className="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-600">{k2}</span>
                ))}
              </div>
            </div>
            <StatusBtns k={k} state={state} label={`#${c.num} ${a.label}`}
              keyChanges={a.keyChanges}
              beforeContext={`Parent #${c.num}: ${c.summary.slice(0, 120)}`}
              afterContext={a.keyChanges.join('; ')}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {amendmentDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Amendment Documents</h3>
          <p className="text-xs text-slate-500 mb-3">Click to expand. Status changes open a confirmation dialog with before/after content.</p>
          <div className="space-y-3">{amendmentDocs.map((c) => <DocCard key={c.num} c={c} />)}</div>
        </div>
      )}

      {withAmendments.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Amendment Timelines</h3>
          <div className="space-y-3">
            {withAmendments.map((c) => (
              <div key={c.num} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => onSelect(c)} className="text-sm font-medium text-teal-600 hover:underline">
                    #{c.num} {c.displayName}
                  </button>
                  <span className="text-xs text-slate-400">· {c.amendments!.length} amendments</span>
                </div>
                <div className="space-y-2">{c.amendments!.map((a) => <AmendRow key={`${c.num}-${a.id}`} c={c} a={a} />)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          title={`Confirm: ${A_STEPS.find((s) => s.id === modal.to)?.label}`}
          onConfirm={confirmModal}
          onCancel={() => setModal(null)}
          confirmLabel={`Confirm → ${A_STEPS.find((s) => s.id === modal.to)?.label}`}
        >
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Document</div>
              <div className="text-xs text-slate-700 font-medium">{modal.label}</div>
            </div>

            {modal.keyChanges && modal.keyChanges.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Key Changes</div>
                <div className="space-y-1">
                  {modal.keyChanges.map((k, i) => (
                    <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <span className="text-teal-500 mt-0.5">•</span>
                      <span>{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modal.beforeContext && (
              <div>
                <div className="text-[10px] font-bold text-red-400 uppercase mb-1">Before (current state)</div>
                <div className="text-[11px] text-slate-700 bg-red-50 border border-red-100 rounded p-2 leading-relaxed">{modal.beforeContext}</div>
              </div>
            )}

            {modal.afterContext && (
              <div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">After (this change)</div>
                <div className="text-[11px] text-slate-700 bg-emerald-50 border border-emerald-100 rounded p-2 leading-relaxed">{modal.afterContext}</div>
              </div>
            )}

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status Change</div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded border ${A_STEPS.find((s) => s.id === modal.context)?.color}`}>
                  {A_STEPS.find((s) => s.id === modal.context)?.label}
                </span>
                <span className="text-slate-400">→</span>
                <span className={`px-2 py-0.5 rounded border ${A_STEPS.find((s) => s.id === modal.to)?.color}`}>
                  {A_STEPS.find((s) => s.id === modal.to)?.label}
                </span>
              </div>
            </div>

            {modal.to === 'verified' && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-slate-600">
                <strong>Before confirming, verify:</strong>
                <div className="mt-1 space-y-0.5">
                  <div>□ All required VP signatures collected</div>
                  <div>□ Effective date matches agreement</div>
                  <div>□ Cross-referenced documents updated to match</div>
                </div>
              </div>
            )}
            {modal.to === 'archived' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-[11px] text-slate-600">
                <strong>Archiving.</strong> Reopen by setting status back to "Pending".
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── ContractDoc Detail Panel ────────────────────────────────────────────────────

function ContractDetail({
  selected,
  docLinks: allDocLinks,
  onStatusOverride,
}: {
  selected: ContractDoc
  onBack?: () => void
  docLinks: DocLink[]
  onStatusOverride?: (flagId: string) => void
}) {
  const s = selected
  void onStatusOverride
  return (
    <div>
      {/* Title */}
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Contract #{s.num}</div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">{s.type}</span>
            <span className="text-[10px] text-slate-300">·</span>
            <span className="text-[10px] text-slate-400">{s.displayName}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">{s.displayName}</h2>
          <p className="text-sm text-slate-500 mt-1">{s.summary}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900 leading-none">{s.riskScore.toFixed(1)}</div>
            <div className="text-xs text-slate-400 mt-0.5">/ 25</div>
          </div>
          <div className="flex flex-col items-center">
            <span className={`w-3 h-3 rounded-full ${s.riskLevel === 'Critical' ? 'bg-red-500' : s.riskLevel === 'High' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
            <span className={`text-xs font-semibold mt-1 ${s.riskLevel === 'Critical' ? 'text-red-600' : s.riskLevel === 'High' ? 'text-orange-600' : 'text-emerald-600'}`}>
              {s.riskLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200 mb-6" />

      {/* Flags table */}
      <section className="mb-6">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Flags ({s.flagsCount})
        </h3>
        {s.flags.length === 0 ? (
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg px-4 py-3">
            <p className="text-sm text-emerald-700 font-medium">✓ No flags detected</p>
            <p className="text-xs text-emerald-600 mt-0.5">This document appears compliant</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {s.flags.map((f) => (
              <div key={f.field}>
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className={`w-2 h-2 rounded-full ${SEV_DOT[f.severity]} mt-1 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-xs font-bold ${SEV_TEXT[f.severity]}`}>{f.severity}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${COMP_TYPE_BG[f.compliance_type] || ''}`}>
                        {f.compliance_type === 'hard' ? 'HARD' : 'BP'}
                      </span>
                      <span className="text-xs text-slate-400">
                        L{f.likelihood}×I{f.impact} = <span className="font-bold text-slate-600">{f.risk_score}</span>
                      </span>
                      {f.risk_category && <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{f.risk_category} · {f.subcategory}</span>}
                    </div>
                    <p className="text-sm text-slate-800">{f.flag_if}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Extracted fields + Jev side by side */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Extracted Fields</h3>
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
            {s.extractedFields.map((f) => (
              <div key={f.label} className="flex items-start gap-3 px-4 py-2.5">
                <span className={`text-sm font-medium ${f.status === '✓' ? 'text-emerald-600' : f.status === '✗' ? 'text-red-500' : 'text-slate-400'} w-4 text-center shrink-0`}>
                  {f.status}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{f.label}</span>
                  <p className="text-sm text-slate-800">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Jev AI Assessment</h3>
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            {[
              { label: 'Risk Severity', value: s.jev.riskSeverity.choice, conf: s.jev.riskSeverity.confidence },
              { label: 'Human Review', value: `${(s.jev.needsHumanReview * 100).toFixed(0)}%`, conf: s.jev.needsHumanReview },
              { label: 'Compliance', value: `${(s.jev.isComplianceRelated * 100).toFixed(0)}%`, conf: s.jev.isComplianceRelated },
              { label: 'Alert', value: `${(s.jev.shouldAlert * 100).toFixed(0)}%`, conf: s.jev.shouldAlert },
              { label: 'Decision Confidence', value: s.jev.decisionConfidence.toFixed(2), conf: s.jev.decisionConfidence },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{row.label}</span>
                  <span className={`text-xs font-semibold ${row.conf >= 0.7 ? 'text-red-600' : row.conf >= 0.4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {row.value}
                  </span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.conf >= 0.7 ? 'bg-red-500' : row.conf >= 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.round(row.conf * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Related Documents (below JEV, in right column) */}
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Related Documents</h3>
            <div className="space-y-2">
              {s.amendments && s.amendments.length > 0 ? (
                s.amendments.map((a) => (
                  <div key={a.id} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <div className="text-xs font-bold text-amber-800">{a.label}</div>
                    <div className="text-[11px] text-amber-700 mt-0.5">Effective: {a.effectiveDate} {a.supersedesOriginal && '· supersedes original'}</div>
                    {a.keyChanges.length > 0 && <div className="text-[10px] text-amber-600 mt-0.5">{a.keyChanges.join(' · ')}</div>}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No amendments linked to this contract</div>
              )}
              {allDocLinks.filter((l: DocLink) => l.sourceNum === s.num).map((l: DocLink, i: number) => (
                <div key={`dl-${i}`} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <div className="text-xs font-medium text-slate-700">→ {l.targetName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{l.changeDescription}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Amendments */}
      {s.amendments && s.amendments.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Amendments</h3>
          <AmendmentTimeline amendments={s.amendments} />
        </section>
      )}


    </div>
  )
}

// ── Amendment Timeline ──────────────────────────────────────────────────────

function AmendmentTimeline({ amendments }: { amendments: Amendment[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
        {amendments.map((a) => (
          <div key={a.id} className="relative">
            <span
              className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 ${
                a.supersedesOriginal ? 'bg-red-500 border-red-300' : 'bg-teal-500 border-teal-300'
              }`}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">{a.label}</span>
              {a.supersedesOriginal && (
                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">SUPERSEDES</span>
              )}
              <span className="text-xs text-slate-400 ml-auto">{a.effectiveDate}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {a.keyChanges.map((k, j) => (
                <span key={j} className="text-[10px] bg-slate-100 rounded px-1.5 py-0.5 text-slate-600">{k}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Settings Sidebar ─────────────────────────────────────────────────────────

function SettingsSidebar({
  selectedType, onSelectType,
  selectedRisk, onSelectRisk,
  selectedDept, onSelectDept,
  selectedExpiry, onSelectExpiry,
  onUpload, isUploading,
  uploadError,
}: {
  selectedType: string; onSelectType: (v: string) => void
  selectedRisk: string; onSelectRisk: (v: string) => void
  selectedDept: string; onSelectDept: (v: string) => void
  selectedExpiry: string; onSelectExpiry: (v: string) => void
  onUpload: (files: FileList) => void
  isUploading: boolean
  uploadError: string | null
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const types = ['All', ...Array.from(new Set(contracts.map((c) => c.type)))]
  const risks = ['All', 'Low', 'Critical']
  const departments = ['All', ...SOUTHDEPARTMENTS]

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Filters</h3>
        <div className="space-y-3">
          <TagSelector label="Contract Type" options={types} selected={selectedType} onChange={onSelectType} />
          <TagSelector label="Risk Level" options={risks} selected={selectedRisk} onChange={onSelectRisk} />
          <TagSelector label="Department" options={departments} selected={selectedDept} onChange={onSelectDept} />
          <TagSelector label="Expiry" options={['All','Expired','< 30d','< 90d','> 90d']} selected={selectedExpiry} onChange={onSelectExpiry} />
        </div>
      </div>

      {/* Upload */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Upload</h3>
        <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.docx,.doc,.txt" className="hidden" onChange={(e) => { const files = e.target.files; if (files) onUpload(files) }} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="w-full text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded px-3 py-2.5 hover:bg-teal-100 transition-colors disabled:opacity-50"
        >
          {isUploading ? 'Processing…' : 'Upload document'}
        </button>
        {uploadError && <p className="text-[11px] text-red-500 mt-1.5">{uploadError}</p>}
      </div>
    </div>
  )
}

// ── Pipeline (small footer strip) ───────────────────────────────────────────




// ── Work Queue View (action-oriented workbench) ─────────────────────────────

function WorkQueueView({ contracts: allContracts, onSelectContract, onProcess, resolvedFlags, completedLinks, createdTasks, onResolveFlag, onConfirmAction, resolvedLog, focusFields }: { contracts: ContractDoc[]; onSelectContract: (c: ContractDoc) => void; onProcess?: (link: DocLink) => void; resolvedFlags: Set<string>; completedLinks: Set<string>; createdTasks: { id: string; label: string; contractNum: number; time: string }[]; onResolveFlag?: (id: string) => void; onConfirmAction?: (title: string, message: string, action: () => void, showNote?: boolean) => void; resolvedLog?: { id: string; label: string; time: string; type: string }[]; focusFields?: string[] }) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'expiring' | 'crossref'>('all')
  const [showResolved, setShowResolved] = useState(false)
  const [search, setSearch] = useState('')

  // Compute work items
  type WorkItem = {
    id: string
    what: string
    docLabel: string
    docNum: number
    contract: ContractDoc
    severity: 'critical' | 'high' | 'medium' | 'low'
    status: string
    action: string
    due?: string
  }

  const items: WorkItem[] = []
  const now = new Date().getTime()

  // Critical flags
  for (const c of allContracts) {
    for (const f of c.flags) {
      if (f.severity === 'Critical' && f.status === 'open') {
        items.push({
          id: `f-${c.num}-${f.field}`,
          what: f.flag_if,
          docLabel: c.displayName,
          docNum: c.num,
          contract: c,
          severity: 'critical',
          status: f.status,
          action: 'Fix',
        })
      } else if (f.severity === 'High' && f.status === 'open') {
        items.push({
          id: `f-${c.num}-${f.field}`,
          what: f.flag_if,
          docLabel: c.displayName,
          docNum: c.num,
          contract: c,
          severity: 'high',
          status: f.status,
          action: 'Review',
        })
      }
    }
  }

  // Cross-refs
  for (const d of docLinks) {
    if (d.status !== 'synced') {
      const src = allContracts.find((c) => c.num === d.sourceNum)
      if (src) {
        items.push({
          id: `x-${d.sourceNum}-${d.targetName}`,
          what: `${d.sourceClause} → ${d.targetName}`,
          docLabel: src.displayName,
          docNum: src.num,
          contract: src,
          severity: 'high',
          status: d.status,
          action: 'Process',
        })
      }
    }
  }

  // Expiring
  for (const c of allContracts) {
    if (c.expiryDate) {
      const days = Math.ceil((new Date(c.expiryDate).getTime() - now) / (24 * 3600 * 1000))
      if (days <= 90) {
        items.push({
          id: `e-${c.num}`,
          what: c.type,
          docLabel: c.displayName,
          docNum: c.num,
          contract: c,
          severity: days < 0 ? 'critical' : days < 30 ? 'high' : 'medium',
          status: days < 0 ? 'Expired' : `${days}d left`,
          action: days < 0 ? 'Renew' : 'Schedule',
          due: c.expiryDate,
        })
      }
    }
  }

  // Filter out resolved flags and completed cross-refs
  const active = items.filter((i) => {
    if (resolvedFlags.has(i.id)) return false
    if (completedLinks.has(i.id)) return false
    // If focusFields is set (from Insights), only show matching flags
    if (focusFields && focusFields.length > 0 && i.id.startsWith('f-')) {
      const field = i.id.split('-').slice(2).join('-')
      if (!focusFields.some((f) => field.includes(f) || f.includes(field))) return false
    }
    return true
  })

  // Add created tasks from Insights
  const taskItems: WorkItem[] = createdTasks.map((t) => ({
    id: `t-${t.id}`,
    what: t.label,
    docLabel: allContracts.find((c) => c.num === t.contractNum)?.displayName || 'Task',
    docNum: t.contractNum,
    contract: allContracts.find((c) => c.num === t.contractNum) || allContracts[0],
    severity: 'high' as const,
    status: 'New',
    action: 'Complete',
  }))

  const allItems = [...active, ...taskItems]

  // Sort: critical > high > medium > low, then by docNum
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  allItems.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || a.docNum - b.docNum)

  // Filter
  const filtered = allItems.filter((i) => {
    if (search) {
      const q = search.toLowerCase()
      if (!i.what.toLowerCase().includes(q) && !i.docLabel.toLowerCase().includes(q) && !String(i.docNum).includes(q)) return false
    }
    if (filter === 'all') return true
    if (filter === 'critical') return i.severity === 'critical'
    if (filter === 'high') return i.severity === 'high'
    if (filter === 'expiring') return i.id.startsWith('e-')
    if (filter === 'crossref') return i.id.startsWith('x-')
    return true
  })

  // Summary counts
  const counts = {
    critical: allItems.filter((i) => i.severity === 'critical').length,
    high: allItems.filter((i) => i.severity === 'high').length,
    expiring: allItems.filter((i) => i.id.startsWith('e-')).length,
    crossref: allItems.filter((i) => i.id.startsWith('x-')).length,
  }
  const totalResolved = (resolvedFlags?.size || 0) + (completedLinks?.size || 0)

  return (
    <div>
      {/* Summary Tiles */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <button onClick={() => setFilter('critical')} className={`text-left p-3 rounded-lg border transition ${filter === 'critical' ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
          <div className="text-2xl font-bold text-red-600">{counts.critical}</div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">Critical</div>
        </button>
        <button onClick={() => setFilter('high')} className={`text-left p-3 rounded-lg border transition ${filter === 'high' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
          <div className="text-2xl font-bold text-amber-600">{counts.high}</div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">High</div>
        </button>
        <button onClick={() => setFilter('crossref')} className={`text-left p-3 rounded-lg border transition ${filter === 'crossref' ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
          <div className="text-2xl font-bold text-teal-600">{counts.crossref}</div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">Cross-Refs</div>
        </button>
        <button onClick={() => setFilter('expiring')} className={`text-left p-3 rounded-lg border transition ${filter === 'expiring' ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
          <div className="text-2xl font-bold text-blue-600">{counts.expiring}</div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">Expiring</div>
        </button>
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
          <div className="text-2xl font-bold text-emerald-600">{totalResolved}</div>
          <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mt-0.5">Resolved</div>
          {totalResolved > 0 && (
            <button onClick={() => { localStorage.removeItem('resolvedFlags'); localStorage.removeItem('completedLinks'); localStorage.removeItem('createdTasks'); localStorage.removeItem('southlake_status_overrides'); window.location.reload() }} className="mt-1 text-[9px] text-emerald-600 hover:text-emerald-800 hover:underline">Reset all</button>
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search flags, docs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
        <button onClick={() => setFilter('all')} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition ${filter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>All ({allItems.length})</button>
        <button onClick={() => setFilter('critical')} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition ${filter === 'critical' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200 hover:border-red-400'}`}>Critical</button>
        <button onClick={() => setFilter('high')} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition ${filter === 'high' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-600 border-amber-200 hover:border-amber-400'}`}>High</button>
        <button onClick={() => setFilter('crossref')} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition ${filter === 'crossref' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-teal-600 border-teal-200 hover:border-teal-400'}`}>Cross-Ref</button>
        <button onClick={() => setFilter('expiring')} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition ${filter === 'expiring' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'}`}>Expiring</button>
        <span className="ml-auto text-[10px] text-slate-400">Showing {filtered.length} of {allItems.length}</span>
      </div>

      {/* Task Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide w-8"></th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Issue</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Document</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Severity</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.slice(0, 15).map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 cursor-pointer transition" onClick={() => onSelectContract(item.contract)}>
                <td className="px-4 py-2.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${item.severity === 'critical' ? 'bg-red-500' : item.severity === 'high' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-700 font-medium max-w-[200px] truncate">{item.what}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">
                  <span className="font-mono text-[10px] text-slate-400">#{item.docNum}</span>
                  <span className="ml-1.5">{item.docLabel}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    item.severity === 'high' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{item.severity}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{item.status}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (item.id.startsWith('x-') && onProcess) {
                        const link = docLinks.find((d) => d.sourceNum === item.docNum && d.status !== 'synced' && item.id.includes(d.targetName))
                        if (link) onProcess(link)
                      } else if (item.action === 'Fix' || item.action === 'Review') {
                        onConfirmAction?.(`Resolve Flag`, `"${item.what}"\n\nDocument: ${item.docLabel} (#${item.docNum})\nSeverity: ${item.severity}`, () => {
                          onResolveFlag?.(item.id)
                        }, true)
                      } else if (item.action === 'Renew' || item.action === 'Schedule') {
                        onConfirmAction?.(`Schedule Renewal`, `${item.docLabel} (#${item.docNum})\nExpiry: ${item.due || 'unknown'}\n\nConfirm renewal has been scheduled with the counterparty.`, () => {
                          onResolveFlag?.(item.id)
                        })
                      } else if (item.id.startsWith('t-')) {
                        onConfirmAction?.(`Complete Task`, `"${item.what}"\n\nDocument: ${item.docLabel} (#${item.docNum})\nStatus: ${item.status}`, () => {
                          onResolveFlag?.(item.id)
                        })
                      } else {
                        onSelectContract(item.contract)
                      }
                    }}
                    className="text-[11px] font-medium text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded px-2 py-1 transition"
                  >
                    {item.action} →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">No items in this view</div>
        )}
        {filtered.length > 15 && (
          <div className="px-4 py-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
            Showing 15 of {filtered.length} · Use filters to narrow down
          </div>
        )}
      </div>

      {/* Resolved Log */}
      {resolvedLog && resolvedLog.length > 0 && (
        <div className="mt-4 border border-emerald-200 rounded-lg overflow-hidden">
          <button onClick={() => setShowResolved((v) => !v)} className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 transition">
            <span className="text-xs font-bold text-emerald-700">✓ Resolved ({resolvedLog.length})</span>
            <span className="text-[10px] text-emerald-500">{showResolved ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {showResolved && (
            <div className="divide-y divide-emerald-100 max-h-40 overflow-y-auto">
              {resolvedLog.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-2 text-[11px]">
                  <span className="font-medium text-slate-700">{entry.label}</span>
                  <span className="text-slate-400">{entry.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Smart Filing View (AI Upload + Auto-Classification + Folder Archive) ─────────
interface UploadedDoc {
  filed_to?: string
  filename: string
  document_type: string
  risk_score: number
  risk_level: string
  flags_count: number
  flags: { severity: string; field: string; flag_if: string; risk_category?: string; subcategory?: string; department?: string }[]
  text_preview: string
  processed_at: string
}

function SmartFilingView({ contracts: allContracts }: { contracts: ContractDoc[] }) {

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<UploadedDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [diskTree, setDiskTree] = useState<Record<string, { files: string[]; subcategories: Record<string, string[]> }>>({})
  const [fileDetail, setFileDetail] = useState<string | null>(null)

  // Fetch real on-disk folder tree
  useEffect(() => {
    const fetchTree = () => {
      fetch('/api/folder-tree')
        .then((r) => r.json())
        .then((d) => setDiskTree(d.categories || {}))
        .catch(() => {})
    }
    fetchTree()
  }, [])

  // Upload handler
  const handleUpload = async (files: FileList | File[]) => {
    const fileArr = Array.from(files)
    if (fileArr.length === 0) return
    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      fileArr.forEach((f) => formData.append('files', f))

      // Try proxy first, then direct API
      let resp: Response
      try {
        resp = await fetch('/api/classify-and-file', { method: 'POST', body: formData })
        if (!resp.ok) throw new Error(`proxy ${resp.status}`)
      } catch {
        // Fallback: direct API call → keyword classification
        try {
          resp = await fetch('http://localhost:8000/api/classify-and-file', { method: 'POST', body: formData })
          if (!resp.ok) throw new Error(`API ${resp.status}`)
        } catch {
          // Ultimate fallback: keyword-based (no AI needed)
          const kw = (n: string) => {
            const l = n.toLowerCase()
            if (/(nda|agreement|contract|phr|phi)/.test(l)) return 'Operational'
            if (/(finance|payment|invoice|budget|cost)/.test(l)) return 'Financial'
            if (/(dr|backup|continuity|disaster|bcp)/.test(l)) return 'Continuity'
            if (/(reputation|marketing|brand|public)/.test(l)) return 'Reputational'
            return 'Other'
          }
          const fb: UploadedDoc[] = fileArr.map((f) => ({
            filename: f.name, document_type: kw(f.name), risk_score: 50,
            risk_level: 'Medium', flags_count: 0, flags: [],
            text_preview: f.name, processed_at: new Date().toISOString(),
            filed_to: `${kw(f.name)}/auto`, is_upload: true,
          }))
          setUploaded((p) => [...fb, ...p])
          setUploading(false)
          return
        }
      }

      const data = await resp.json()
      const rawResults: any[] = Array.isArray(data) ? data : (data.results || [data])
      const errors = rawResults.filter((r: any) => r.error)
      const results: UploadedDoc[] = rawResults.filter((r: any) => !r.error).map((r: any) => ({
        filename: r.filename || 'unknown',
        document_type: r.document_type || 'Unknown',
        risk_score: r.risk_score || 0,
        risk_level: r.risk_level || 'Low',
        flags_count: r.flags_count ?? r.flags?.length ?? 0,
        flags: r.flags || [],
        text_preview: r.text_preview || '',
        processed_at: r.processed_at || new Date().toISOString(),
        filed_to: r.filed_to || undefined,
      }))
      setUploaded((prev) => [...prev, ...results])
      if (errors.length > 0) {
        setUploadError(errors.map((e: any) => `${e.filename}: ${e.error}`).join(' | '))
      }
    } catch (e: any) {
      setUploadError(`Upload failed: ${e.message || e}. Is API running on port 8000? (Check terminal)`)
    } finally {
      setUploading(false)
    }
  }

  // Build folder tree from BOTH static contracts AND uploaded docs
  const tree: Record<string, Record<string, { docs: { label: string; num?: number; riskLevel: string; flagsCount: number; isUploaded: boolean }[] }>> = {}
  const addToTree = (cat: string, sub: string, doc: { label: string; num?: number; riskLevel: string; flagsCount: number; isUploaded: boolean }) => {
    if (!tree[cat]) tree[cat] = {}
    if (!tree[cat][sub]) tree[cat][sub] = { docs: [] }
    tree[cat][sub].docs.push(doc)
  }

  // Static contracts
  for (const c of allContracts) {
    const cFlags = c.flags || []
    if (cFlags.length === 0) {
      // Clean docs go to Clean/NoFlags folder
      addToTree('Clean', 'NoFlags', { label: `#${c.num} ${c.displayName}`, num: c.num, riskLevel: 'Low', flagsCount: 0, isUploaded: false })
      continue
    }
    // Use highest-severity flag's category
    const topFlag = cFlags.slice().sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))[0]
    const cat = topFlag?.risk_category || 'Uncategorized'
    const sub = topFlag?.subcategory || 'General'
    addToTree(cat, sub, { label: `#${c.num} ${c.displayName}`, num: c.num, riskLevel: c.riskLevel, flagsCount: c.flagsCount || cFlags.length, isUploaded: false })
  }

  // Uploaded docs: HEROC category (from top flag) + document type (as sub-folder)
  for (const u of uploaded) {
    const flags = u.flags || []
    const topFlag = flags.slice().sort((a, b) => (a.severity === 'Critical' ? 3 : a.severity === 'High' ? 2 : 1) - (b.severity === 'Critical' ? 3 : b.severity === 'High' ? 2 : 1))[0]
    const cat = topFlag?.risk_category || (u.flags_count === 0 ? 'Clean' : 'Operational')
    const sub = u.document_type || 'Other'
    addToTree(cat, sub, { label: `📎 ${u.filename}`, riskLevel: u.risk_level, flagsCount: u.flags_count || flags.length, isUploaded: true })
  }

  // Clean docs (no flags)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-slate-800">AI Smart Filing</h2>
        <p className="text-xs text-slate-500 mt-0.5">Upload → AI classifies → auto-files to HEROC folders. No manual step needed.</p>
      </div>

      {/* API Server Warning */}
      {uploadError && /port 8000|API/i.test(uploadError) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-700">
          ⚠ <b>Upload requires local API server.</b> Run <code className="bg-amber-100 px-1 rounded">python3 server.py</code> in <code className="bg-amber-100 px-1 rounded">web-dashboard/</code> (port 8000).
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
          dragOver ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-slate-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.docx,.txt,.md"
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
          id="sf-upload-input"
          onChange={(e) => {
            const files = e.target.files
            if (files && files.length > 0) handleUpload(files)
            e.target.value = '' // allow re-selecting same file
          }}
        />
        <button
          onClick={() => document.getElementById('sf-upload-input')?.click()}
          disabled={uploading}
          className="bg-teal-600 text-white px-4 py-2 rounded text-xs font-medium hover:bg-teal-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : '📤 Choose Files to Upload'}
        </button>
        <p className="text-[10px] text-slate-400 mt-2">Drag & drop or click · PDF, images, DOCX, TXT, MD</p>
        <div className="mt-2 space-y-1">
          {uploading && <p className="text-[11px] text-teal-600 animate-pulse">⏳ Processing via AI… (OCR → Rules → Filing)</p>}
          {uploadError && <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded p-1.5">⚠ {uploadError}</p>}
          {!uploading && !uploadError && uploaded.length === 0 && <p className="text-[10px] text-slate-300">Waiting for files…</p>}
          {!uploading && !uploadError && uploaded.length > 0 && <p className="text-[10px] text-emerald-600">✓ {uploaded.length} file(s) processed</p>}
        </div>
        {uploaded.length > 0 && (
          <div className="mt-3 text-left">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Uploaded ({uploaded.length})</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {uploaded.map((u, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className={`w-2 h-2 rounded-full ${u.risk_level === 'Critical' ? 'bg-red-500' : u.risk_level === 'High' ? 'bg-orange-500' : u.risk_level === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                  <span className="text-slate-700 truncate flex-1">{u.filename}</span>
                  <span className="text-slate-400">{u.document_type}</span>
                  <span className="text-slate-400">{u.flags_count} flags</span>
                  <span className={`text-[10px] font-bold ${u.risk_level === 'Critical' ? 'text-red-600' : u.risk_level === 'High' ? 'text-orange-600' : 'text-emerald-600'}`}>{u.risk_level}</span>
                  {u.filed_to && <span className="text-[9px] text-teal-600 font-mono">→ {u.filed_to}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filing status */}
      {uploaded.length > 0 && (
        <div className="text-xs text-emerald-600">
          ✓ {uploaded.length} file(s) auto-classified and filed on upload
        </div>
      )}

      {/* Folder tree - unified view from disk */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">
          FOLDER STRUCTURE
          <span className="font-normal text-slate-400 ml-2">
            5 HEROC categories · {Object.values(diskTree).reduce((a, v) => a + Object.values(v.subcategories).reduce((b, files) => b + files.length, 0), 0)} files on disk
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {(['Operational', 'Financial', 'Reputational', 'Continuity', 'Clean'] as const).map((cat) => {
            const icons: Record<string, string> = { Operational: '⚙️', Financial: '💰', Reputational: '📢', Continuity: '🔄', Clean: '✅' }
            const diskSubs = diskTree[cat]?.subcategories || {}
            const diskSubsWithFiles = Object.entries(diskSubs).filter(([_ , files]) => files.length > 0)
            const diskFileCount = diskSubsWithFiles.reduce((a, [_, files]) => a + files.length, 0)
            const computedSubs = tree[cat] || {}
            const computedDocCount = Object.values(computedSubs).reduce((a, v) => a + v.docs.length, 0)
            const totalVisible = Math.max(diskFileCount, computedDocCount)
            const isExpanded = selectedFolder === cat

            return (
              <div key={cat}>
                <div
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => setSelectedFolder(isExpanded ? null : cat)}
                >
                  <span className={`text-[10px] transition ${isExpanded ? 'text-teal-600' : 'text-slate-400'}`}>{isExpanded ? '▼' : '▶'}</span>
                  <span className="text-sm font-bold text-slate-800">{icons[cat]} {cat}</span>
                  <div className="ml-auto flex items-center gap-3">
                    {diskFileCount > 0 && <span className="text-[10px] text-slate-400">{diskFileCount} on disk</span>}
                    <span className={`text-[11px] font-medium ${totalVisible > 0 ? 'text-slate-600' : 'text-slate-300'}`}>
                      {totalVisible > 0 ? `${totalVisible} docs` : 'empty'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-8 space-y-2 pb-3">
                    {diskSubsWithFiles.length > 0 && (
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Disk Files (data/archive/{cat}/)</div>
                        {diskSubsWithFiles.map(([sub, files]) => (
                          <div key={sub} className="ml-3 mb-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                              <span>📂</span>
                              <span>{sub.replace(/_/g, ' ')}</span>
                              <span className="text-[9px] text-slate-400">({files.length})</span>
                            </div>
                            <div className="ml-5 space-y-0.5">
                              {files.map((f) => (
                                <button key={f} onClick={(e) => { e.stopPropagation(); setFileDetail(f) }} className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded px-1 py-0.5 w-full text-left transition">
                                  <span className="text-slate-300">📄</span>
                                  <span className="truncate max-w-md" title={f}>{f}</span>
                                  <span className="text-[9px] text-slate-300 ml-auto shrink-0">→</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}



                    {totalVisible === 0 && diskSubsWithFiles.length === 0 && (
                      <div className="text-[11px] text-slate-300 ml-4 py-2">No documents in this category yet.</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Filing rules */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3">
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Filing Logic</div>
        <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc pl-4">
          <li><b>Upload</b> → OCR + Agnes extraction + rules engine (server.py port 8000)</li>
          <li><b>Category</b> → HEROC from highest-severity flag (Operational / Financial / Reputational / Continuity)</li>
          <li><b>Subcategory</b> → 14 subcategories mapped to Southlake departments</li>
          <li><b>Confidence</b> → 95% (0 flags) · 88% (1-2) · 72% (3-5) · 55% (6+)</li>
          <li><b>Clean docs</b> → filed to "Clean / Unfiled" until flags appear</li>
        </ul>
      </div>
    </div>
  )
      {/* File Detail Modal */}
      {fileDetail && (() => { const fd = fileDetail!; return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setFileDetail(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold text-slate-800 mb-2">📄 {fd.split('/').pop()}</div>
            <div className="text-xs text-slate-500 space-y-1.5">
              <div><b>Full path:</b> <code className="text-teal-700 break-all">{fd}</code></div>
              <div><b>HEROC Category:</b> {fd.split('/').find((p) => ['Operational','Financial','Reputational','Continuity','Clean'].includes(p)) || 'Unknown'}</div>
              <div><b>Subcategory:</b> {fd.split('/').slice(-2, -1)[0] || 'N/A'}</div>
              <div className="text-slate-400 mt-2">Stored at <code className="text-slate-600">data/archive/{fd}</code></div>
            </div>
            <button onClick={() => setFileDetail(null)} className="mt-4 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1.5">✕ Close</button>
          </div>
        </div>
      )})()}

}



// ── Risk Prevention Insights: cross-file pattern detection + actionable recommendations ──
function InsightsView({ contracts: allContracts, onJumpToContract, onSwitchTab, resolvedFlags, completedLinks, onSetFocusFields }: { contracts: ContractDoc[]; onJumpToContract?: (c: ContractDoc) => void; onSwitchTab?: (tab: string) => void; resolvedFlags?: Set<string>; completedLinks?: Set<string>; onSetFocusFields?: (fields: string[]) => void }) {
  void completedLinks
  const rawFlags = allContracts.flatMap((c) => c.flags.map((f) => ({ ...f, contract: c })))
  const allFlags = rawFlags.filter((f) => {
    if (resolvedFlags) {
      const flagId = `f-${f.contract.num}-${f.field}`
      if (resolvedFlags.has(flagId)) return false
    }
    return true
  })
  
  // 1. Systemic pattern detection: group flags by field across contracts
  const byField: Record<string, { count: number; contracts: number[]; severity: string[] }> = {}
  for (const f of allFlags) {
    const key = f.field
    if (!byField[key]) byField[key] = { count: 0, contracts: [], severity: [] }
    byField[key].count++
    byField[key].contracts.push(f.contract.num)
    byField[key].severity.push(f.severity)
  }
  
  // 2. Identify systemic patterns (same field flagged in 3+ contracts)
  const systemicPatterns = Object.entries(byField)
    .filter(([_, v]) => v.contracts.length >= 3)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([field, data]) => {
      const hasCritical = data.severity.includes('Critical')
      const hasHigh = data.severity.includes('High')
      // Generate prevention recommendation
      const recs: Record<string, string> = {
        'signatories': 'Implement a pre-execution dual-signature verification gate. No contract should be countersigned without 2 authorized VPs. Add a mandatory fields check to the contract template.',
        'expiry_date': 'Automate expiration tracking: 90/60/30-day alerts to contract owners. Flag contracts expiring within 90 days for renewal review.',
        'breach_notification': 'Standardize breach notification clause to 24h (PHIPA s.33(3)). Add to all DSA templates. Require privacy officer approval for any deviation.',
        'governing_law': 'Enforce Ontario governing law in all template contracts. Add a mandatory fields validation step before execution. Flag any non-Ontario references.',
        'data_security': 'Mandate data security clauses (encryption, access controls, audit rights) in all contracts handling SENSITIVE data. Add to procurement checklist.',
        'auto_renewal': 'Require explicit opt-out language in all auto-renewal clauses. Set renewal notification at T-90 days. Flag any renewal without 60+ day notice window.',
      }
      return {
        field,
        count: data.count,
        contractNums: data.contracts,
        hasCritical,
        hasHigh,
        recommendation: recs[field] || `Review and standardize "${field}" across all contracts.`,
      }
    })

  // 3. What-If analysis: what if we fix top 3 patterns?
  const top3 = systemicPatterns.slice(0, 3)
  const flagsToEliminate = top3.reduce((sum, p) => sum + p.count, 0)
  const currentCritical = allFlags.filter((f) => f.severity === 'Critical').length
  const criticalAfterFix = Math.max(0, currentCritical - top3.filter((p) => p.hasCritical).reduce((s, p) => s + p.count, 0))
  const currentAvgScore = allFlags.length > 0 ? allFlags.reduce((s, f) => s + f.risk_score, 0) / allFlags.length : 0
  const avgScoreAfterFix = allFlags.length > 3 ? (allFlags.reduce((s, f) => s + f.risk_score, 0) - top3.reduce((s, p) => s + p.count * 12, 0)) / (allFlags.length - flagsToEliminate) : currentAvgScore

  // 4. Portfolio health score (0-100)
  const totalFlags = allFlags.length
  const openFlags = allFlags.filter((f) => f.status === 'open').length
    const criticalFlags = allFlags.filter((f) => f.severity === 'Critical').length
  const healthScore = Math.max(0, Math.round(100 - (openFlags / Math.max(1, totalFlags)) * 40 - (totalFlags > 0 ? (criticalFlags / totalFlags) : 0) * 40 - (totalFlags > 30 ? 10 : 0)))

  // 5. Risk prevention recommendations (actionable, prioritized)
  const playbook = systemicPatterns.map((p, i) => ({
    priority: i + 1,
    pattern: p.field,
    affected: p.contractNums.length,
    contracts: p.contractNums,
    severity: p.hasCritical ? 'Critical' : p.hasHigh ? 'High' : 'Medium',
    action: p.recommendation,
    impact: `Eliminates ${p.count} flags across ${p.contractNums.length} contracts`,
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-slate-800">Risk Prevention Insights</h2>
        <p className="text-xs text-slate-500 mt-0.5">Cross-document pattern analysis across {allContracts.length} monitored contracts · {allFlags.length} total flags</p>
      </div>

      {/* Portfolio Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Health score */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Portfolio Health</div>
          <div className="relative w-20 h-20 mx-auto">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="none" stroke="#e2e8f0" strokeWidth="3" r="16" />
              <circle cx="18" cy="18" fill="none" stroke={healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'} strokeWidth="3" r="16"
                strokeDasharray={`${healthScore * 1.005} 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-slate-800">{healthScore}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2">{healthScore >= 70 ? 'Good posture' : healthScore >= 40 ? 'Needs attention' : 'High risk exposure'}</div>
        </div>

        {/* What-If */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase">What-If: Fix Top 3 Patterns</div>
              {resolvedFlags && resolvedFlags.size > 0 && (
                <span className="text-[9px] bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 font-bold">{resolvedFlags.size} resolved</span>
              )}
            </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Critical flags:</span>
              <span className="font-bold text-red-600">{currentCritical}</span>
              <span className="text-slate-300">→</span>
              <span className="font-bold text-emerald-600">{criticalAfterFix}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Avg risk score:</span>
              <span className="font-bold text-orange-600">{currentAvgScore.toFixed(1)}</span>
              <span className="text-slate-300">→</span>
              <span className="font-bold text-emerald-600">{avgScoreAfterFix.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Flags eliminated:</span>
              <span className="font-bold text-teal-600">{flagsToEliminate}</span>
              <span className="text-slate-400">of {allFlags.length}</span>
            </div>
            {resolvedFlags && resolvedFlags.size >= flagsToEliminate && (
              <div className="mt-3 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                ✓ All top patterns resolved ({resolvedFlags.size} flags fixed)
              </div>
            )}
            <button
              onClick={() => { onSetFocusFields?.(top3.map((p) => p.field)); onSwitchTab?.('work-queue') }}
              className="mt-3 w-full text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg py-2.5 transition"
            >
              Address top patterns in Work Queue →
            </button>
          </div>
        </div>

        {/* Expiring soon */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Expiring &lt; 90 Days</div>
          {(() => {
            const today = new Date().toISOString().slice(0, 10)
            const in90 = allContracts.filter((c) => c.expiryDate && c.expiryDate > today && c.expiryDate < '2026-01-14')
            if (in90.length === 0) return <div className="text-xs text-slate-400">None in 90-day window</div>
            return in90.slice(0, 3).map((c) => (
              <div key={c.num} className="text-xs text-slate-600 flex items-center gap-2 py-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                #{c.num} {c.displayName}
                <span className="text-slate-400 ml-auto">{c.expiryDate}</span>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Systemic Patterns */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">
          Systemic Patterns <span className="font-normal text-slate-400">({systemicPatterns.length} detected — same issue across 3+ contracts)</span>
        </div>
        <div className="divide-y divide-slate-100">
          {systemicPatterns.map((p) => (
            <div key={p.field} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.hasCritical ? 'bg-red-100 text-red-700' : p.hasHigh ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {p.hasCritical ? 'CRITICAL' : p.hasHigh ? 'HIGH' : 'MEDIUM'}
                </span>
                <span className="text-xs font-bold text-slate-800">{p.field.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{p.count} flags · {p.contractNums.length} contracts</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1.5">
                {p.contractNums.slice(0, 6).map((n) => (
                  <button key={n} onClick={() => { const c = allContracts.find((cc) => cc.num === n); if (c) onJumpToContract?.(c) }} className="bg-slate-100 hover:bg-teal-100 text-teal-700 rounded px-1.5 text-[10px] font-medium cursor-pointer transition">#{n}</button>
                ))}
                {p.contractNums.length > 6 && <span>+{p.contractNums.length - 6} more</span>}
                <button onClick={() => onSwitchTab?.('risk-register')} className="ml-2 text-[10px] font-bold text-teal-600 hover:text-teal-800 hover:underline">View All →</button>
              </div>
            </div>
          ))}
          {systemicPatterns.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-slate-400">No systemic patterns detected. Each flag is unique to a single contract.</div>
          )}
        </div>
      </div>

      {/* Prevention Playbook */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">
          Prevention Playbook <span className="font-normal text-slate-400">(prioritized actions to prevent recurrence)</span>
        </div>
        <div className="divide-y divide-slate-100">
          {playbook.map((item) => (
            <div key={item.priority} className="px-4 py-3 flex items-start gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                item.priority === 1 ? 'bg-red-100 text-red-700' : item.priority === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
              }`}>{item.priority}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800">{item.pattern.replace(/_/g, ' ')}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{item.action}</div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-teal-600 font-medium">Impact: {item.impact}</span>
                  <span className="text-[10px] text-slate-400">Affects: {item.affected} contracts</span>
                </div>
                <button
                  onClick={() => onSwitchTab?.('work-queue')}
                  className="mt-2 text-[10px] font-medium text-teal-600 hover:text-teal-800"
                >
                  → Address in Work Queue
                </button>
              </div>
            </div>
          ))}
          {playbook.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-slate-400">No systemic issues to prevent. Maintain current controls.</div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-teal-50 border border-teal-200 rounded p-3 text-[11px] text-teal-700">
        💡 <b>How this works:</b> The engine scans all {allContracts.length} monitored contracts, groups flags by field, and identifies patterns affecting 3+ documents. 
        Systemic patterns indicate <b>process gaps</b> (not individual contract errors), so the recommendation targets the <b>control</b>, not the document. 
        This is the difference between reactive flagging and proactive risk prevention.
      </div>
    </div>
  )
}


// ── Process Wizard (standalone, used from Work Queue) ──────────────────────
function ProcessWizardInner({ link, onDone, onComplete }: { link: DocLink; onDone: () => void; onComplete?: (linkId: string) => void }) {
  const [step, setStep] = useState(() => {
    const steps = ['Detected', 'Acknowledged', 'Fixing', 'Verified', 'Closed']
    return Math.max(0, steps.indexOf(link.status || 'Detected'))
  })
  const STEPS = ['Detected', 'Acknowledged', 'Fixing', 'Verified', 'Closed']

  return (
    <div>
      {/* 5 step boxes */}
      <div className="flex items-center gap-1 mb-5">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)}
            className={`flex-1 px-2 py-2.5 rounded-md text-[11px] font-bold text-center border transition-all ${
              i === step ? 'bg-teal-100 text-teal-800 border-teal-300 ring-2 ring-teal-200' :
              i < step ? 'bg-teal-50 text-teal-600 border-teal-200' :
              'bg-white text-slate-400 border-slate-200'
            }`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* Current step detail */}
      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <div className="text-xs font-bold text-slate-700 mb-2">{STEPS[step]} — {link.riskIfNotUpdated}</div>
        {step === 0 && <div className="text-xs text-slate-500">System detected a gap between <b>{link.sourceClause}</b> and <b>{link.targetName}</b>. Review the before/after below.</div>}
        {step === 1 && <div className="text-xs text-slate-500">You acknowledge this gap exists. Proceed to fix.</div>}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-bold text-red-500 uppercase mb-1">Current text (target doc)</div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-slate-700 font-mono whitespace-pre-wrap">
                {link.beforeText || "No prior text recorded"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Required text (after amendment)</div>
              <textarea
                defaultValue={link.afterText || link.changeDescription || "Update to match source clause..."}
                rows={3}
                className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div className="text-[10px] text-slate-400">Edit the required text above, then advance to Verify.</div>
          </div>
        )}
        {step === 3 && <div className="text-xs text-emerald-600">Verify the fix. Both documents are now in sync.</div>}
        {step === 4 && <div className="text-xs text-slate-500">Workflow complete. No further action needed.</div>}
      </div>

      {/* Before / After (hidden during Fixing step which has its own editor) */}
      {step >= 1 && step !== 3 && step <= 4 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-[10px] font-bold text-red-600 uppercase mb-1">Before (current)</div>
            <div className="text-[11px] text-slate-700">{link.beforeText || "No prior text"}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">After (required)</div>
            <div className="text-[11px] text-slate-700">{link.afterText || "Update to match source"}</div>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 transition">
          ← Back
        </button>
        <button
          onClick={() => { if (step < 4) setStep(step + 1); else { onComplete?.('x-' + link.sourceNum + '-' + link.targetName); onDone() } }}
          className="px-5 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition">
          {step < 4 ? `${STEPS[step + 1]} →` : '✓ Complete'}
        </button>
      </div>
    </div>
  )
}

function App() {
  const { toasts, show } = useToast()
  const [activeTab, setActiveTab] = useState<TabId>('work-queue')
  const [selected, setSelected] = useState<ContractDoc | null>(null)
  const [filterType, setFilterType] = useState('All')
  const [filterRisk, setFilterRisk] = useState('All')
  const [filterDept, setFilterDept] = useState('All')
  const [filterExpiry, setFilterExpiry] = useState('All')
  const [, setUploadedContracts] = useState<any[]>([])
  const [isUploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [useAgnes, setUseAgnes] = useState(true)
  void setUseAgnes // toggle removed from UI; kept for API param
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [processLink, setProcessLink] = useState<DocLink | null>(null)
  const [resolvedLog, setResolvedLog] = useState<{ id: string; label: string; time: string; type: string }[]>(() => {
    try { const r = localStorage.getItem('resolvedLog'); return r ? JSON.parse(r) : [] } catch { return [] }
  })
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; onConfirm: (note?: string) => void; showNote?: boolean } | null>(null)
  const [focusFields, setFocusFields] = useState<string[]>([])
  // Persisted state
  const [resolvedFlags, setResolvedFlags] = useState<Set<string>>(() => {
    try { const r = localStorage.getItem('resolvedFlags'); return r ? new Set(JSON.parse(r)) : new Set() } catch { return new Set() }
  })
  const [completedLinks, setCompletedLinks] = useState<Set<string>>(() => {
    try { const r = localStorage.getItem('completedLinks'); return r ? new Set(JSON.parse(r)) : new Set() } catch { return new Set() }
  })
  const [createdTasks, setCreatedTasks] = useState<{ id: string; label: string; contractNum: number; time: string }[]>(() => {
    try { const r = localStorage.getItem('createdTasks'); return r ? JSON.parse(r) : [] } catch { return [] }
  })
  const markFlagResolved = (flagId: string) => {
    setResolvedFlags((prev) => { const next = new Set(prev); next.add(flagId); localStorage.setItem('resolvedFlags', JSON.stringify([...next])); return next })
    const parts = flagId.split('-')
    const label = parts.length > 2 ? parts.slice(2).join('-').replace(/_/g, ' ') : flagId
    setResolvedLog((prev) => {
      const entry = { id: flagId, label, time: new Date().toLocaleTimeString(), type: flagId.startsWith('x-') ? 'workflow' : 'flag' }
      const next = [entry, ...prev]
      localStorage.setItem('resolvedLog', JSON.stringify(next))
      return next
    })
    show('Flag resolved ✓', 'success')
  }
  const completeLink = (linkId: string) => {
    setCompletedLinks((prev) => { const next = new Set(prev); next.add(linkId); localStorage.setItem('completedLinks', JSON.stringify([...next])); return next })
    show('Workflow completed ✓', 'success')
  }
  void setCreatedTasks

  useEffect(() => {
    fetch('/api/results')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUploadedContracts(data)
      })
      .catch(() => {})
  }, [])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) formData.append('files', files[i])
    try {
      const resp = await fetch(`/api/batch-upload?use_agnes=${useAgnes}`, { method: 'POST', body: formData })
      const data = await resp.json()
      if (data.results) setUploadedContracts((prev) => [...data.results, ...prev])
    } catch {
      setUploadError('Upload failed. API server not running?')
    } finally {
      setUploading(false)
    }
  }

  const s = portfolioStats
  const today = new Date('2026-10-15')
  const filtered = contracts.filter((c) => {
    if (filterType !== 'All' && c.type !== filterType) return false
    if (filterRisk !== 'All' && c.riskLevel !== filterRisk) return false
    if (filterDept !== 'All' && c.department !== filterDept) return false
    if (filterExpiry !== 'All' && c.expiryDate) {
      const exp = new Date(c.expiryDate)
      const days = Math.ceil((exp.getTime() - today.getTime()) / 86400000)
      if (filterExpiry === 'Expired' && days >= 0) return false
      if (filterExpiry === '< 30d' && (days < 0 || days > 30)) return false
      if (filterExpiry === '< 90d' && (days < 0 || days > 90)) return false
      if (filterExpiry === '> 90d' && days <= 90) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Document Risk Management
                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded px-1.5 py-0.5 uppercase tracking-wide">Pilot</span>
              </h1>
              <p className="text-[11px] text-slate-400">Southlake Health</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-400 hidden lg:block">13 contracts · 41 flags · 58% compliance</span>
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarOpen
                  ? <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Documents" value={s.totalContracts} onClick={() => setActiveTab('contracts')} />
          <KpiCard label="Critical Flags" value={s.criticalCount} valueClass="text-red-600" onClick={() => setActiveTab('risk-register')} />
          <KpiCard label="Open Flags" value={contracts.flatMap((c) => c.flags).filter((f) => f.status === 'open').length} valueClass="text-orange-600" onClick={() => setActiveTab('risk-register')} />
          <KpiCard label="Remediated" value={contracts.flatMap((c) => c.flags).filter((f) => f.status === 'remediated').length} valueClass="text-emerald-600" onClick={() => setActiveTab('risk-register')} />
          <KpiCard label="Avg Compliance" value={`${Math.round(s.avgComplianceRate * 100)}%`} valueClass="text-teal-600" onClick={() => setActiveTab('insights')} />
          <KpiCard label="Clean Docs" value={contracts.filter((c) => c.flags.length === 0).length} valueClass="text-emerald-600" onClick={() => setActiveTab('contracts')} />
        </div>

        {/* Risk Distribution + Top Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Risk distribution by HEROC */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-bold text-slate-700 mb-3">Risk Distribution by HEROC Category</div>
            {(['Operational', 'Financial', 'Reputational', 'Continuity'] as const).map((cat) => {
              const catFlags = contracts.flatMap((c) => c.flags).filter((f) => f.risk_category === cat)
              const total = contracts.flatMap((c) => c.flags).length || 1
              const pct = Math.round((catFlags.length / total) * 100)
              const colors: Record<string, string> = { Operational: 'bg-teal-500', Financial: 'bg-amber-500', Reputational: 'bg-purple-500', Continuity: 'bg-blue-500' }
              return (
                <div key={cat} className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-slate-600 w-24">{cat}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[cat]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 w-16 text-right">{catFlags.length} flags ({pct}%)</span>
                </div>
              )
            })}
            {/* Remediation progress */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Remediation Progress</div>
              {(() => {
                const allFlags = contracts.flatMap((c) => c.flags)
                const remediated = allFlags.filter((f) => f.status === 'remediated').length
                const accepted = allFlags.filter((f) => f.status === 'accepted').length
                const total = allFlags.length || 1
                const pct = Math.round(((remediated + accepted) / total) * 100)
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600">{pct}%</span>
                    <span className="text-[10px] text-slate-400">{remediated + accepted}/{total} resolved</span>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Top 5 Action Items */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-bold text-slate-700 mb-3">
              ⚡ Top 5 Actions <span className="font-normal text-slate-400">(open flags, highest risk)</span>
            </div>
            {(() => {
              const openFlags = contracts.flatMap((c) => c.flags.map((f) => ({ ...f, contractNum: c.num, contractName: c.displayName })))
                .filter((f) => f.status === 'open')
                .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
                .slice(0, 5)
              if (openFlags.length === 0) return <div className="text-[11px] text-slate-400">All flags resolved. 🎉</div>
              return openFlags.map((f, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
                  <span className={`text-[10px] font-bold w-5 text-center ${i === 0 ? 'text-red-600' : i < 3 ? 'text-orange-600' : 'text-slate-400'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-slate-700 truncate">{f.flag_if}</div>
                    <div className="text-[10px] text-slate-400">
                      #{f.contractNum} {f.contractName} · {f.severity} · {f.risk_score}pts
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${f.severity === 'Critical' ? 'bg-red-100 text-red-700' : f.severity === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {f.severity}
                  </span>
                </div>
              ))
            })()}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pb-0">
        <div className="max-w-screen-2xl mx-auto">
          <TabBar active={activeTab} onChange={(t) => { setActiveTab(t); setSelected(null) }} />
        </div>
      </div>

      {/* ── Sidebar + Content ─────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex gap-6">
          {/* Sidebar */}
          <aside
            className={`
              fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 p-5 overflow-y-auto
              transform transition-all duration-200
              lg:relative lg:inset-auto lg:translate-x-0 lg:shrink-0
              ${sidebarCollapsed ? 'lg:w-10 lg:p-2' : 'lg:w-64'}
              ${sidebarOpen ? 'translate-x-0 shadow-2xl w-72' : '-translate-x-full lg:translate-x-0'}
              top-14 bottom-0
            `}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-3 right-3 p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-300 transition text-xs font-bold mb-4"
              title={sidebarCollapsed ? "展开 Settings" : "收起 Settings"}
            >
              {sidebarCollapsed ? '»' : '«'}
            </button>

            {sidebarCollapsed ? (
              <div className="hidden lg:block text-center text-[9px] text-slate-400 mt-2">Settings</div>
            ) : (
              <SettingsSidebar
                selectedType={filterType} onSelectType={setFilterType}
                selectedRisk={filterRisk} onSelectRisk={setFilterRisk}
                selectedDept={filterDept} onSelectDept={setFilterDept}
                selectedExpiry={filterExpiry} onSelectExpiry={setFilterExpiry}
                onUpload={handleFileUpload}
                isUploading={isUploading}
                uploadError={uploadError}
              />
            )}
          </aside>

          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Main Content + Detail Panel */}
          <main className="flex-1 min-w-0 overflow-x-auto flex">
            <div className="flex-1 min-w-0">
              <>
                {activeTab === 'work-queue' && (
                  <WorkQueueView contracts={contracts} onSelectContract={(c) => setSelected(c)}
                    onProcess={(link) => { setProcessLink(link); setSelected(null) }}
                    resolvedFlags={resolvedFlags} completedLinks={completedLinks} createdTasks={createdTasks} onResolveFlag={(id) => markFlagResolved(id)}
                    resolvedLog={resolvedLog}
                    focusFields={focusFields}
                    onConfirmAction={(title, msg, action, showNote) => setConfirmState({ title, message: msg, onConfirm: action, showNote })} />
                )}
                {activeTab === 'risk-register' && (
                  <RiskRegisterTable
                    contracts={filtered}
                    onSelectContract={(c) => { setSelected(c); }}
                    onSwitchTab={(tab) => setActiveTab(tab)}
                    onFix={(flagId) => markFlagResolved(flagId)}
                    onConfirmAction={(title, msg, action, showNote) => setConfirmState({ title, message: msg, onConfirm: action, showNote })}
                    resolvedFlags={resolvedFlags}
                  />
                )}
                {activeTab === 'contracts' && (
                  <div className="space-y-4">
                    {/* Criteria-based compliance panel (F) */}
                    <CriteriaPanel contracts={filtered} />

                    <ContractList
                      contracts={filtered}
                      selectedNum={selected?.num ?? null}
                      onSelect={(c) => setSelected(c)}
                    />
                  </div>
                )}
                {activeTab === 'deadlines' && (
                  <div>
                    <DeadlinesTimeline contracts={filtered} onSelectContract={(c) => { setSelected(c); }} />
                    <DeadlinesTable contracts={filtered} onSelectContract={(c) => { setSelected(c); }} />
                  </div>
                )}
                {activeTab === 'cross-refs' && (
                  <CrossRefsView contracts={filtered} />
                )}
                {activeTab === 'smart-filing' && (
                  <SmartFilingView contracts={filtered} />
                )}
                {activeTab === 'insights' && (
                  <InsightsView contracts={contracts} onJumpToContract={(c) => { setSelected(c); }} onSwitchTab={(tab) => setActiveTab(tab as TabId)} resolvedFlags={resolvedFlags} completedLinks={completedLinks} onSetFocusFields={setFocusFields} />
                )}
              </>
            </div>
            {/* Right-side detail panel */}
            {selected && (
              <aside className="w-[440px] shrink-0 border-l-2 border-slate-300 bg-slate-50 overflow-y-auto max-h-[calc(100vh-56px)] shadow-[-8px_0_24px_rgba(0,0,0,0.06)]">
                <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contract Detail</span>
                  <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition text-sm">✕</button>
                </div>
                <div className="px-5 py-4">
                  <ContractDetail selected={selected} onBack={() => setSelected(null)} docLinks={docLinks} onStatusOverride={(flagId) => { markFlagResolved(flagId) }} />
                </div>
              </aside>
            )}
          </main>
        </div>
      </div>

      <ToastContainer toasts={toasts} />

      {/* Confirm Modal */}
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={(note) => { confirmState.onConfirm(note); setConfirmState(null) }}
          onCancel={() => setConfirmState(null)}
          showNote={confirmState.showNote}
          confirmLabel="Confirm"
        />
      )}

      {/* Cross-Ref Workflow Wizard (from Work Queue) */}
      {processLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setProcessLink(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-bold text-slate-900">Cross-Ref Workflow</div>
                <div className="text-xs text-slate-500 mt-0.5">{processLink.sourceClause} → {processLink.targetName}</div>
              </div>
              <button onClick={() => setProcessLink(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 text-lg">✕</button>
            </div>
            <ProcessWizardInner link={processLink} onDone={() => setProcessLink(null)} onComplete={completeLink} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
