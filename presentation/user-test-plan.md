# 用户测试计划 — Tanya & Sam 实际体验 Prototype（30–60 分钟）

> 背景：Matthew 要求最终展示前安排 Tanya + Sam 直接登录系统操作（不只是会议演示）。Adriana 负责排期。
> 目标：确认系统是否符合 Tanya 的日常工作方式；找出哪些操作不清楚、哪些功能有用、哪些需要改进；为 11/24 最终交付收集反馈。
> 时间窗：2026-11-10 ~ 11-17 之间（建议靠近 11/10）。

## 测试前准备（我方）
1. 部署最新 build 到可访问地址（GH Pages 已 live；如需内网访问则走 Sam IT 团队的部署）。
2. 发送深链（免登录）：
   - 主入口：`https://murphywenjun-del.github.io/critical-corporate-document-management/?demo=1`
   - 角色深链：`?demo=1&role=legal`（legal 为最高访问级，Tanya / Sam 视角共用）/ `?demo=1&role=readonly`（受限视角）
   - 功能深链：`?demo=1&tab=template-match` / `?demo=1&tab=deadlines` / `?demo=1&tab=insights`
3. 准备反馈记录表（下方"反馈记录表"），测试人边点边标记，不需要写长文。
4. 演示数据说明：当前为 13 份 synthetic 合同 + 磁盘 archive（.md）；Tanya 若带来脱敏真实合同（Alicia 的 de-identified 合同），可现场替换进 `data/archive/` 再刷新搜索。

## 测试脚本（约 45 分钟）

### 第一部分：Tanya 视角 — "合同审核日"（20 min）
| # | 操作 | 观察点 / 期望反馈 |
|---|------|------------------|
| 1 | 角色切到 **Legal & Compliance (Tanya Howell)** | 全量文档可见（legal 有最高访问级）；角色切换是否直观？锁定文档（restricted-PHI）对 readonly/finance 是否清楚？ |
| 2 | **Work Queue**：看行动项排序，处理 1–2 项（Process → 4-step wizard → Mark resolved） | 是否像她真实的工作流？哪一步多余/不清楚？ |
| 3 | **Documents → 搜索**：搜 "PHIPA"、"indemnity"、"waste"（现在也索引 .docx）；切到 **General Staff (Read-only)** 再搜 "PHI" 看 "N hidden by role access" | 磁盘 archive 搜索是否符合预期？snippet 够不够定位？受限文件对低权限角色隐藏是否直观？ |
| 4 | **Template Match**：选 #4 供应商 DSA → 对 DSA Executed 参考；再点 **"Past signed contract"** 模式对比 #11（修订 vs 原 DSA）；点 **"Run AI review"**（本地 Ollama，约 10–40 秒） | "Needs Attention 清单"能否让她只看有变化的部分？合同对合同模式是否比"只对比模板"更贴近真实？AI 审查结论是否有用还是噪音？ |
| 5 | 点一个锁定文档（restricted） | 提示文案是否清楚？申请途径是否合理？ |

### 第二部分：Sam 视角 — "管理层看趋势"（15 min）
| # | 操作 | 观察点 / 期望反馈 |
|---|------|------------------|
| 1 | 角色切到 **Legal & Compliance（全量访问，原 System Admin 已移除）** | 全量文档可见？KPI（Documents / Open Flags / Compliance / Retention Alerts）是否是他要的 portfolio 视图？ |
| 2 | **Risk Register → Risk Matrix**：点红区格子 | 单份合同风险 + 组织级趋势是否够管理层决策？ |
| 3 | **Insights**：systemic patterns（同字段 ≥3 份 = 系统性问题）+ What-If top 3 | "大量合同缺签名 / 非 Ontario 管辖"这类趋势是否直接可见？ |
| 4 | **Deadlines → Retention Board**：看 eligible-for-discard 行，点 "Approve discard"，再点 "Dispose N paper copies"（纸质副本列 + 销毁签核，digital 记录保留审计轨迹） | 处置流程（提醒负责人 → 审批 → 纸质销毁 → 路由 Records Management）是否符合 Southlake 政策？纸质副本追踪是否是他们真实要做的？ |

### 第三部分：开放反馈（10 min）
- 哪些功能你明天上班就会用？哪些是"演示功能"？
- 操作中最不自然的 3 个地方。
- 如果只有 1 个改进机会，改什么？
- 部署到 Southlake 内网（Sam IT 团队）需要哪些前置条件？（记录给 handover 文档）

## 反馈记录表（会后 30 分钟内整理）
| 反馈人 | 模块 | 原话/要点 | 类型（clear / useful / needs-fix / skip） | 是否已落实 | 目标轮次 |
|--------|------|-----------|------------------------------------------|-----------|----------|
|  |  |  |  |  |  |

> 约定（来自客户）：不要求项目结束前做完所有功能——反馈进 Final Documentation 的 "feedback log + 后续建议" 部分即可。

## 已知演示局限（测试前向客户说明，避免误解）
- RBAC 是前端角色模拟（4 个 demo 角色），编辑/管理动作已按角色门控（legal 可改，其他角色只读），生产 SSO/RBAC 属 Phase 2。
- Retention 规则当前为合理假设值，等 Southlake Retention Policy 映射后更新；纸质副本数量/位置为演示元数据。
- 相似度 = 确定性条款对齐（系统记录）；**"AI Clause Review" 为真实本地 LLM（Ollama gemma3:1b，无云）辅助判断**——测试机需开 `ollama serve`，未开时面板显示离线提示，功能自动降级到确定性 diff。
- 风险矩阵为 AI 默认框架，等 Southlake 内部 risk register 后替换。
