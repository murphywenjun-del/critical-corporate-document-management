---
type: research
title: "Southlake AI 政策与合规框架分析"
status: stable
created: 2026-08-30 18:00:00
updated: 2026-08-30 18:00:00
tags: [AFP, Southlake, AI-Policy, Compliance, Governance]
source: [Southlake Use of Artificial Intelligence - AI_08_2026.pdf, IVEY-STUDENT-PROJECT-OVERVIEW]
related: [项目/Critical-Corporate-Document-Management/项目日志, 项目/Critical-Corporate-Document-Management/技术方案选项]
---

# Southlake AI 政策与合规框架分析

> 基于 Matthew 分享的官方文件：
> 1. Southlake Use of Artificial Intelligence Policy (PolicyStat ID: 19463953)
> 2. Ivey Student Project Overview (IVEY-STUDENT-PROJECT-OVERVIEW)
>
> 分析日期：2026-08-30 | 分析目的：为SOW起草提供合规约束和技术路径指导

---

## 一、项目概述文档解读（IVEY-STUDENT-PROJECT-OVERVIEW）

### 业务问题陈述
> "There is a lack of a common repository for centralized and accountable data governance for critical corporate documents."

### 业务成果目标
> "Decrease risk exposure for Southlake Health for legal and contractual obligations."

### 学生目标
> "Develop an AI based solution to define, store, and decrease risk for Southlake health."

### 核心交付物（4项）

| # | 交付物 | 说明 |
|---|---|---|
| 1 | **文档分类体系** | 定义合同、协议、政策的库存/存储库标准；建立明确的合同分类法（如法律协议、数据共享协议、MOU等） |
| 2 | **风险评估框架** | 定义和分类风险类型：文档缺失、过期、未按政策执行、由个人而非组织持有、保额较低；设计AI作为"提醒系统"（tickler system）用于法律/隐私审查 |
| 3 | **风险类别探索** | 与SME合作探索四类风险：运营风险、财务风险、声誉风险、连续性/继任风险 |
| 4 | **风险降低建议** | 一套降低风险的建议方案 |

### 扩展交付物（2项，可选）

| # | 交付物 | 说明 |
|---|---|---|
| 1 | **AI代理原型** | 可扫描/标记文档中缺失字段、到期日、续约触发器、义务/里程碑截止日、财务触发条款（如可变财务条款）、留存期限、所有权/位置、重复或冲突版本 |
| 2 | **文档治理政策建议** | 推荐的文档治理政策或 intake 流程，防止未来碎片化 |

### 关键约束条件（来自项目概述）
> "All data is processed and hosted locally within the Southlake Health environment."
> 
> 企业文档预期包括：合同、协议、MOU、隐私影响评估、威胁风险评估/安全审查、数据共享协议
> 法律监管文档包括：相关立法和政策

### 关键利益相关者
| 姓名 | 职位 | 角色 |
|---|---|---|
| Sonia Pagura PhD(c), MSc, BScPT (RPT), BA | Director of Quality, Privacy, Risk and Patient Experience / Chief Privacy Officer (CIPM) | 隐私/质量/SME |
| Tanya N. Howell, B.A. (Honours), LL.B | In-House Counsel | 法务/SME |
| Sam Fielding, BBA (Honours), MBA, PPM | Chief Information Officer | IT/SME |

---

## 二、Southlake AI 使用政策详解（AI Policy PDF）

### 政策基本信息

| 项目 | 内容 |
|---|---|
| **政策ID** | 19463953 (PolicyStat) |
| **生效日期** | 2025年10月 |
| **下次审查** | 2028年10月 |
| **所有者** | Sam Fielding (CIO), Digital Health |
| **适用范围** | Southlake 全组织 |
| **标签** | Non-Clinical（非临床） |

### 核心政策条款

#### 1. AI 工具必须合规（第2条）
> "All external and internal endorsed software tools... that utilize AI must be compliant with Southlake's Accountability Framework for Ethical, Safe, and Effective Use (Appendix A)."

**含义**：本项目使用的任何AI工具必须符合 Southlake 的 AI 问责框架。

#### 2. 禁止使用未批准工具处理机密信息（第3条）
> "Any individuals acting on behalf of Southlake Health are prohibited from using any tools or technologies that are not officially endorsed by Southlake to process, store, or share confidential or restricted information."

**含义**：学生团队不能使用任何未经 Southlake 正式批准的工具来处理项目中的机密文档。

#### 3. AI 技术四分类（第3条）

| 类别 | 说明 | 对本项目的适用性 |
|---|---|---|
| A. Southlake 提供的AI解决方案 | 如AI医疗记录员 | 不适用（本项目是企业文档管理） |
| B. 独立采购的AI医疗记录员 | 仅限AI记录员计划列出的供应商 | 不适用 |
| C. 大型解决方案中的AI | 如Microsoft Copilot内置AI | **高度相关** — 如果使用Microsoft生态 |
| D. 基于AI的独立解决方案 | 独立开发的AI工具 | **相关** — 如果学生团队开发独立AI原型 |

#### 4. DHLC 治理权（第4条）
> "The Digital Health Leadership Council is accountable for: A. Establishing and maintaining governance and oversight for all AI technologies; B. Maintaining the inventory of endorsed technologies using AI."

**含义**：所有AI技术方案需通过DHLC审批。本项目的AI方案需要获得DHLC的认可。

#### 5. Agentic AI 明确禁止（第8条）⚠️ **关键发现**
> "Southlake does not permit the use of Agentic AI without the express approval the Digital Health Leadership Council."

**含义**：项目概述中的"Stretch Deliverable"是"Prototype an AI agent"——但政策明确禁止Agentic AI，除非获得DHLC明确批准。**必须在SOW中明确说明这一点，并提出替代方案或DHLC审批路径。**

#### 6. 新AI技术审批流程（第5条）
```
IT项目入口表 → AI技术清单 → DHLC审查 + 伦理办公室审查 → DHLC认可 → 应用清单更新
```

**对本项目的启示**：
- 如果SOW中包含AI方案，需提前了解DHLC审批周期
- DHLC批准与资金批准是分开的

#### 7. 集成AI技术（如Microsoft Copilot）的简化流程（第6条）
> "DHLC can request a validation that technology such as Workday does address the AI Accountability Framework and the AI checklist considerations."

**含义**：如果使用Microsoft生态系统内置AI（如Copilot），可通过DHLC验证简化审批。

#### 8. 数据隐私合规要求（Appendix A）
- 必须遵循 **Ontario Trustworthy AI Framework**
- 必须遵守 **PHIPA** 和 **FIPPA**
- 必须遵循：
  - Acceptable Use Policy (A135)
  - Information Security Policy (A518)
  - Privacy Policy (P105)
  - Records Retention, Storage and Destruction Policy (AR20)
  - Lockbox and Consent Directive (AP003)
  - Confidentiality Policy (AC070)
  - Transparency through FOI Requests policy (AF001)

---

## 三、对项目的关键影响

### 直接影响

| 发现 | 影响 | 行动 |
|---|---|---|
| **Agentic AI 禁止** | Stretch Deliverable 1（AI代理原型）需DHLC明确批准 | SOW中需说明此风险并提出替代方案 |
| **所有AI工具需DHLC认可** | 技术方案选型受限 | 优先选择已获认可的Microsoft生态AI，或明确审批路径 |
| **数据必须本地处理** | 确认严禁美国云 | 继续使用本地/加拿大托管方案 |
| **四类风险类别** | 明确了风险分类框架 | SOW中应引用此分类 |
| **tickler system概念** | 明确了AI的使用方式 | 不是主动决策，而是风险提示/提醒 |
| **项目概述中的文档类型** | 比会议中说的更具体 | 更新taxonomy范围 |

### 风险类别澄清

项目概述明确要求探索四类风险：
1. **运营风险** — 文档缺失、过期、未按政策执行
2. **财务风险** — 保额不足、财务触发条款
3. **声誉风险** — 公开披露的合规失败
4. **连续性/继任风险** — 关键人员离职导致文档失控

### 税务类别细化

项目概述中提到的具体风险指标：
- 文档缺失
- 文档过期
- 未按政策执行
- 由个人而非组织持有
- 保额较低的合同
- 缺失字段
- 到期日
- 续约触发器
- 义务/里程碑截止日
- 财务触发条款（可变财务条款）
- 留存期限
- 所有权/位置
- 重复或冲突版本

---

## 四、SOW起草建议

### 必须包含的内容
1. **文档分类体系（taxonomy）** — 基于项目概述中明确提到的文档类型
2. **四类风险评估框架** — 运营、财务、声誉、连续性
3. **合规检查规则** — 签约权限、到期提醒等
4. **AI使用合规路径** — 说明将走DHLC审批流程
5. **成本/FTE/运营分析** — 项目概述虽未明确提及，但会议中Sam要求了
6. **本地数据处理承诺** — 重申所有数据处理在Southlake环境内

### 需要谨慎处理的内容
1. **AI Agent原型** — 政策禁止Agentic AI，需提出替代方案（如"AI辅助审查"而非"AI代理"）
2. **技术选型** — 优先Microsoft生态，走集成AI简化审批路径
3. **DHLC审批时间** — SOW中需预留DHLC审批的缓冲时间

### 建议的技术路径（符合政策）
```
首选路径：Microsoft生态 + 集成AI
  ├── SharePoint/OneDrive：文档存储（已有基础设施）
  ├── Power Automate：工作流和提醒（规则驱动，非AI）
  ├── Microsoft Copilot（如已获DHLC认可）：文档搜索和分析
  └── 所有数据处理在Southlake租户内完成

备选路径：本地部署AI模型
  ├── Ollama + Llama 3.1（本地运行）
  ├── Python + FastAPI后端
  └── 需走完整的DHLC审批流程（更长时间）
```

---

## 五、待确认事项更新

| 事项 | 状态 | 优先级 |
|---|---|---|
| DHLC审批流程和周期 | ⚠️ 需确认 | 高 |
| Microsoft Copilot是否已获DHLC认可 | ⚠️ 需确认 | 高 |
| AI Technology Checklist具体内容 | ⚠️ 需获取 | 中 |
| Care-Management项目协调 | 待定 | 低 |
| 与 high reliability journey 的对齐文档 | ⚠️ 需Matt提供 | 中 |
