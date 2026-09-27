import { useState } from 'react'
import { contracts, flagsByContract } from './data'

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Critical: 'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[level] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {level}
    </span>
  )
}

function SeverityBadge({ choice, confidence }: { choice?: string; confidence?: number }) {
  if (!choice) return <span className="text-gray-400 text-xs">—</span>
  const dotColors: Record<string, string> = {
    low: 'bg-emerald-500', medium: 'bg-amber-500', high: 'bg-orange-500', critical: 'bg-red-500',
  }
  const bgColors: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${bgColors[choice] ?? 'bg-gray-100 text-gray-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[choice] ?? 'bg-gray-500'}`} />
      {choice!.charAt(0).toUpperCase() + choice!.slice(1)}
      <span className="text-gray-400">({Math.round(confidence! * 100)}%)</span>
    </span>
  )
}

function ConfidenceMeter({ score }: { score: number }) {
  const pct = Math.round((score / 4) * 100)
  const color = score >= 3 ? 'bg-emerald-500' : score >= 2 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{Math.round(pct)}%</span>
    </div>
  )
}

function AlertIndicator({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? 'text-red-600' : pct >= 50 ? 'text-amber-600' : 'text-emerald-600'
  return <span className={`text-sm font-semibold ${color}`}>{pct}%</span>
}

function ContractDetail({ contract }: { contract: ContractResult }) {
  const flags = flagsByContract[contract.contract_name] ?? []
  const jev = contract.jeV_result?.answers

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{contract.contract_name}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{contract.document_type} &middot; Scanned {contract.agnes_ok ? 'successfully' : 'with issues'}</p>
        </div>
        <RiskBadge level={contract.rules_risk_level} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Risk Score</p>
          <p className="text-lg font-semibold text-slate-800">{contract.rules_risk_score.toFixed(1)} / 5.0</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Jev Alert Probability</p>
          <AlertIndicator value={jev?.should_alert?.noul ?? 0} />
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Review Needed</p>
          <AlertIndicator value={jev?.needs_human_review?.noul ?? 0} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Jev Risk Classification</p>
        <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-3">
          <div className="flex-1">
            <p className="text-sm text-slate-700">Severity: <SeverityBadge choice={jev?.risk_severity?.choice} confidence={jev?.risk_severity?.confidence} /></p>
            <p className="text-sm text-slate-700 mt-1">Compliance Related: {(jev?.is_compliance_related?.noul ?? 0) >= 0.5 ? 'Yes' : 'No'} ({Math.round((jev?.is_compliance_related?.noul ?? 0) * 100)}%)</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Decision Confidence</p>
            <ConfidenceMeter score={jev?.decision_confidence?.score ?? 0} />
          </div>
        </div>
      </div>

      {flags.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Rules Engine Flags ({flags.length})</p>
          <div className="space-y-1.5">
            {flags.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.severity === 'Critical' ? 'bg-red-500' : f.severity === 'High' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                <span className="text-slate-700">{f.flag_if}</span>
                <span className="text-xs text-slate-400 ml-auto">{f.field}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PipelineDiagram() {
  const stages = [
    { label: 'Document Input', icon: '\ud83d\udcc4' },
    { label: 'Agnes OCR', icon: '\ud83d\udc41\ufe0f' },
    { label: 'Rules Engine', icon: '\u2699\ufe0f' },
    { label: 'Jev Decision', icon: '\ud83c\udfaf' },
    { label: 'Evidence Store', icon: '\ud83d\udccb' },
    { label: 'Human Review', icon: '\ud83d\udc64' },
  ]
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {stages.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 min-w-[80px]">
            <span className="text-lg">{s.icon}</span>
            <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">{s.label}</span>
          </div>
          {i < stages.length - 1 && <span className="text-slate-300 text-sm flex-shrink-0">\u2192</span>}
        </div>
      ))}
    </div>
  )
}

function RiskChart() {
  const counts: Record<string, number> = { Low: 1, Medium: 1, High: 1, Critical: 5 }
  const max = Math.max(...Object.values(counts))
  const colors: Record<string, string> = { Low: 'bg-emerald-500', Medium: 'bg-amber-500', High: 'bg-orange-500', Critical: 'bg-red-500' }
  return (
    <div className="flex items-end gap-3 h-28">
      {(['Low', 'Medium', 'High', 'Critical'] as const).map(level => (
        <div key={level} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs font-semibold text-slate-700">{counts[level]}</span>
          <div className={`w-full rounded-t-md ${colors[level]}`} style={{ height: `${(counts[level] / max) * 80}px` }} />
          <span className="text-[10px] text-slate-500">{level}</span>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [selectedContract, setSelectedContract] = useState<ContractResult | null>(null)
  const [filterType, setFilterType] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')

  const filtered = contracts.filter(c => {
    if (filterType !== 'all' && c.document_type !== filterType) return false
    if (filterRisk !== 'all' && c.rules_risk_level !== filterRisk) return false
    return true
  })

  const totalAlerts = contracts.reduce((sum, c) => sum + (c.jeV_result.answers?.should_alert?.noul ?? 0), 0)
  const criticalCount = contracts.filter(c => c.rules_risk_level === 'Critical').length

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Southlake Health</h1>
              <p className="text-xs text-slate-500">Critical Corporate Document Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Prototype Active
            </span>
            <span className="text-xs text-slate-400">8 contracts scanned</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Total Documents</p>
            <p className="text-2xl font-semibold text-slate-800">8</p>
            <p className="text-xs text-slate-400 mt-0.5">Scanned & analyzed</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Critical Risks</p>
            <p className="text-2xl font-semibold text-red-600">{criticalCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Require immediate review</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Compliance Flags</p>
            <p className="text-2xl font-semibold text-amber-600">{contracts.reduce((s, c) => s + c.rules_flags_count, 0)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Across all documents</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Avg Alert Score</p>
            <p className="text-2xl font-semibold text-violet-600">{Math.round((totalAlerts / contracts.length) * 100)}%</p>
            <p className="text-xs text-slate-400 mt-0.5">Jev decision confidence</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Analysis Pipeline</p>
          <PipelineDiagram />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white border border-slate-200 rounded-lg">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Contract Analysis Results</p>
              <div className="flex items-center gap-2">
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-slate-50">
                  <option value="all">All Types</option>
                  <option value="NDA">NDA</option>
                  <option value="MOU">MOU</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Data_Sharing">Data Sharing</option>
                </select>
                <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-slate-50">
                  <option value="all">All Risks</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500">Contract</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500">Type</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500">Flags</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500">Risk Level</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500">Alert %</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.contract_name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{c.contract_name}</td>
                    <td className="px-5 py-3 text-slate-500">{c.document_type}</td>
                    <td className="px-5 py-3"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.rules_flags_count}</span></td>
                    <td className="px-5 py-3"><RiskBadge level={c.rules_risk_level} /></td>
                    <td className="px-5 py-3"><AlertIndicator value={c.jeV_result.answers?.should_alert?.noul ?? 0} /></td>
                    <td className="px-5 py-3">
                      <button onClick={() => setSelectedContract(selectedContract?.contract_name === c.contract_name ? null : c)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                        {selectedContract?.contract_name === c.contract_name ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Risk Distribution</p>
              <RiskChart />
            </div>
            {selectedContract ? (
              <ContractDetail contract={selectedContract} />
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
                <p className="text-2xl mb-2">&#128074;</p>
                <p className="text-sm text-slate-500">Select a contract to view detailed analysis</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
