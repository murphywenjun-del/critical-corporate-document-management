# Southlake Health · Live Demo Script (v23)
## 中英双语 / Bilingual — 15 min + Q&A

---

## 开场 / Opening (30s)

> **中**：谢谢各位。今天 10 分钟 demo 我们的 Critical Document Management 系统。核心就一句话：**从被动发现问题，变成主动预防问题。** 我直接打开系统，带各位走一遍。
>
> **EN**: Thanks everyone. I'll spend 10 minutes showing you our Critical Document Management system. One sentence: **from reactively finding problems, to proactively preventing them.** I'll walk you through the live system.

**操作**：打开 `localhost:5173/critical-corporate-document-management/`，默认停在 **Work Queue**。

---

## Part 1: Work Queue — "你今天该做什么" (2 min)

**看到什么**：
```
[7 Critical] [5 High] [3 Cross-Refs] [2 Expiring]   ← 4 tiles
[All] [Critical] [High] [Cross-Ref] [Expiring]       ← filter chips
| ● | Missing VP sig | #3 Cerner | 🔴 | Open | Fix→ |  ← task table
| ● | Breach 72h     | #8 Legacy | 🔴 | Open | Fix→ |
```

**说什么**：
> **中**：打开系统第一屏不是数据，是 **你的待办**。顶部四个数字告诉你：7 个 Critical 必须今天处理，3 个 Cross-Ref 在 workflow 里，2 份合同 90 天内到期。
> 点 "Critical" 只看到最紧急的。点任何一行，右边弹出详情。
>
> **EN**: The first thing you see is not a data dump — it's **your to-do list**. Four numbers up top: 7 critical items need attention today, 3 cross-references in workflow, 2 contracts expiring within 90 days.
> Click "Critical" to see only the most urgent. Click any row → detail panel slides in on the right.

**操作**：
1. 指顶部 4 tiles
2. 点 "Critical" filter chip
3. 点第一行（#3 Cerner）→ 右侧面板滑出
4. 指面板里的 Compliance Summary（顶部紧凑 3 格）
5. 指 Related Documents（在 JEV 下方右列）
6. 关面板（✕）

---

## Part 2: Risk Register — "全貌" (2 min)

**操作**：点 tab "Risk Register"

**说什么**：
> **中**：这是完整风险登记表。13 份合同、41 个 flags、按 score 排序。
> 顶部 L×I 分布图——点 "Likely × Severe" 直接看哪些合同落在那个格子。
> 注意这条蓝色提示：3 个 systemic patterns，同一个 issue 出现在 3 份以上合同。
>
> **EN**: This is the full risk register. 13 contracts, 41 flags, sorted by risk score.
> The L×I distribution at top — click "Likely × Severe" to see which contracts land in that cell.
> Notice the blue bar: 3 systemic patterns — the same issue appears in 3+ contracts.

**操作**：
1. 指 KPI row（41 flags / 7 critical / 58% compliance）
2. 展开 L×I（点 details）
3. 点 "Likely × Severe · 4" chip → 表格过滤 + 显示合同列表
4. 点合同名 → 右侧面板

---

## Part 3: Workflows — "文档之间有依赖" (2 min)

**操作**：点 tab "Workflows"（原 Cross-Refs）

**说什么**：
> **中**：一份文件改了，引用它的文件要同步改。
> 比如 DSA 修订了 breach notice 时限，但 NDA 模板还是旧的。
> 系统自动检测 gap，然后走 5 步 workflow：
> Detected → Acknowledged → Fixing → Verified → Closed。
> 每一步都有人确认，不会自动跳过。
>
> **EN**: When one document changes, documents that reference it must be updated.
> Example: DSA revised the breach notice timeline, but the NDA template still has the old value.
> The system detects the gap automatically, then runs a 5-step workflow:
> Detected → Acknowledged → Fixing → Verified → Closed.
> Every step requires human confirmation. Nothing skips automatically.

**操作**：
1. 看顶部 5 个状态计数
2. 点一个 "Detected" 卡片展开
3. 点 "Open Workflow" → wizard 弹窗（5 步骤框 + ←/→ 导航）
4. 点 "Acknowledged →" 前进
5. 指步骤框可以点任意一个跳回去
6. 关弹窗

---

## Part 4: Filing — "文件进来就归位" (1.5 min)

**操作**：点 tab "Filing"

**说什么**：
> **中**：上传一份合同，AI 自动判断 HEROC 类别，物理归档到对应文件夹。
> 你看 folder tree——Financial/Liability 下面已经有文件了。
> 如果 API 没开，系统会用 keyword fallback 兜底，不会卡住。
>
> **EN**: Upload a contract, AI auto-classifies it into the HEROC category and physically files it in the correct folder.
> See the folder tree — Financial/Liability already has documents.
> If the API is offline, the system falls back to keyword classification. It never blocks.

**操作**：
1. 指上传区
2. 指 FOLDER STRUCTURE 树（5 大类 + 子分类 + 文件数）
3. 展开 "Financial" → 看到 Liability 子文件夹 + 文件
4. （如果 API 在跑）拖一份 .docx 进去 → 看到 "auto-classified"

---

## Part 5: Deadlines — "别忘了谁快到期" (1 min)

**操作**：点 tab "Deadlines"

**说什么**：
> **中**：时间轴一眼看出：哪份 30 天内到期、哪份 renewal notice 已过。
> 点任何一个 dot 直接看合同详情。
>
> **EN**: The timeline shows at a glance: which contracts expire within 30 days, which renewal notices have passed.
> Click any dot to open the contract detail.

**操作**：
1. 指时间轴（红色=过期，黄色=本月，蓝色=未来）
2. 指 "Today" 红线
3. 点一个 dot → 右侧面板

---

## Part 6: Insights — "不是检测，是预防" (2 min) ⭐ 最重要

**操作**：点 tab "Insights"

**说什么**：
> **中**：前面是 **看到问题**。这里告诉你 **为什么 7 份合同都有同一个问题**。
> 7 份缺 VP 签字不是 7 个独立 error，是 1 个 signing authority 流程缺失。
> 修复方法不是改 7 份合同，是加一个 pre-execution verification gate。
> 一次操作，消除 7 个 Critical flags。
>
> 这就是从 detect 到 **prevent** 的跨越。
>
> **EN**: Everything before showed you **problems**. This page tells you **why 7 contracts all have the same problem**.
> 7 missing VP signatures aren't 7 individual errors — it's 1 missing signing authority process.
> The fix isn't to edit 7 contracts. It's to add a pre-execution verification gate.
> One process change eliminates 7 critical flags.
>
> This is the jump from detection to **prevention**.

**操作**：
1. 指 Portfolio Health 圆环（44 分）
2. 指 What-If："Fix Top 3 → Critical 从 7 降到 2"
3. 看 Systemic Patterns 列表
4. 点 Prevention Playbook 第 1 条
5. 指 "Eliminates 7 flags across 7 contracts"

---

## 收尾 / Close (30s)

**说什么**：
> **中**：这就是当前系统。13 份合同、41 个 flags、完整 workflow、prevention insights。
> 下一步需要各位配合：
> - **Alicia**：5-10 份 de-identified 真实合同替换 synthetic data
> - **Tanya**：确认 22 条规则跟 PHIPA / Southlake 政策对齐
> - **Sam / Warren**：Ollama 部署硬件确认
> - **Sonia**：30 min usability session（Risk / Legal / IT 各一人）
>
> 建议 2 周 stakeholder validation，4 周 pilot 5 份真实合同。
>
> **EN**: This is the current system. 13 contracts, 41 flags, full workflow, prevention insights.
> Next steps need your input:
> - **Alicia**: 5-10 de-identified real contracts to replace synthetic data
> - **Tanya**: Confirm 22 rules align with PHIPA / Southlake policy
> - **Sam / Warren**: Confirm Ollama deployment hardware
> - **Sonia**: 30-min usability session (one from Risk / Legal / IT)
>
> Recommendation: 2 weeks stakeholder validation, 4 weeks pilot with 5 real contracts.

**操作**：回到 Work Queue，定格。

---

## Q&A 弹药 / Q&A Ammo

| 他们问 / They ask | 你答 / You say |
|---|---|
| 能接 ILM 吗？/ Can it plug into ILM? | 可以。folder 是标准目录结构，ILM 可以 watch。或出 API。/ Yes. Standard folder structure — ILM can watch. Or we expose an API. |
| 22 条规则谁定的？/ Who defined the 22 rules? | 基于 PHIPA s.33(3) + Southlake signing policy + 3 参考合同。Tanya confirm。/ Based on PHIPA s.33(3), Southlake signing policy, 3 reference contracts. Tanya to confirm. |
| Llama 8B 够吗？/ Is 8B enough? | 合同分类够用。M2 上 2-3 秒/份。更细的 clause-level NLI 可以换 70B 但需要 A100。/ Sufficient for classification. 2-3s/doc on M2. Finer clause-level NLI would need 70B + A100. |
| 数据出不出楼？/ Does data leave the building? | 不出。本地 Ollama，不走任何云。/ No. Local Ollama, zero cloud. |
| 上线多久？/ Time to production? | Pilot 4 周。Monitoring + filing only: 8 周。加 workflow automation: 12 周。/ Pilot: 4 weeks. Monitor+file: 8. Add workflow automation: 12. |

---

## 技术检查 / Tech Checklist (今晚)

- [ ] `localhost:5173` 能打开（Vite 在跑）
- [ ] `localhost:8000` API 在跑（`python3 server.py`）
- [ ] 浏览器 fullscreen（Cmd+Shift+F）
- [ ] 走一遍 7 个 tab 的点击路径
- [ ] 准备 1 份 .docx（万一现场 upload）
- [ ] 网络备着 GitHub Pages 兜底：`https://murphywenjun-del.github.io/critical-corporate-document-management/`
