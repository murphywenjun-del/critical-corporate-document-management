# AI Prototype 实施方案
## Critical Corporate Document Management — Tickler System

> 创建日期：2026-09-28
> 状态：设计中（等待真实 template 验证）

---

## 一、Risk Flag Matrix（完整检查规则）

### 1.1 Universal Flags（所有合同类型共用）

| Field | 检查项 | Flag 条件 | 风险类别 | 严重程度 |
|---|---|---|---|---|
| signatories | 至少两个 VP 签字 | 签字人数 < 2 OR 不在授权名单 | Financial | 🔴 Critical |
| effective_date | 有生效日期 | 缺少生效日期 | Operational | 🟠 High |
| expiry_date | 有到期日期 | 缺少到期日期 | Operational | 🟡 Medium |
| expiry_date | 未过期 | 已过期 > 30 天 | Operational | 🟠 High |
| renewal_terms | 有续约条款 | 缺少续约条款 AND 非永久合同 | Operational | 🟡 Medium |
| renewal_alert | 续约提醒 | 到期前 90 天内 | Operational | 🟡 Medium |
| document_version | 有版本控制 | 缺少版本号 | Operational | 🟢 Low |

### 1.2 NDA Specific Flags

| Field | 检查项 | Flag 条件 | 风险类别 | 严重程度 |
|---|---|---|---|---|
| confidential_scope | 明确定义保密范围 | 范围过于宽泛 OR 无定义 | Operational | 🟡 Medium |
| phipa_compliance | PHIPA 合规 | 涉及健康信息但无 PHIPA 声明 | Reputational | 🔴 Critical |
| breach_notification | 泄露通知条款 | 缺少通知要求 OR 时限 > 72h | Reputational | 🟠 High |
| return_destruction | 归还/销毁条款 | 缺少归还或销毁条款 | Operational | 🟡 Medium |

### 1.3 MOU Specific Flags

| Field | 检查项 | Flag 条件 | 风险类别 | 严重程度 |
|---|---|---|---|---|
| binding_language | 明确 binding 状态 | 同时存在 binding/non-binding | Financial | 🟠 High |
| financial_cap | 有财务上限 | 涉及资金但无金额上限 | Financial | 🟠 High |
| termination_clause | 有终止条款 | 缺少终止条款 OR 通知期 > 90天 | Operational | 🟡 Medium |
| dispute_resolution | 有争议解决 | 缺少争议解决条款 | Financial | 🟡 Medium |

### 1.4 Procurement Contract Specific Flags

| Field | 检查项 | Flag 条件 | 风险类别 | 严重程度 |
|---|---|---|---|---|
| indemnity_clause | 有赔偿条款 | 缺少 indemnity OR cap < $1M | Financial | 🟠 High |
| sla_present | 有 SLA | 服务类合同缺少 SLA OR 无处罚 | Operational | 🟠 High |
| payment_terms | 付款条款明确 | 可变价格无上限 OR 自动涨价 | Financial | 🟡 Medium |
| data_security | 数据安全 | Vendor 处理 PHI 但无数据保护 | Reputational | 🔴 Critical |
| termination_convenience | 便利终止 | 缺少 termination for convenience | Operational | 🟡 Medium |

### 1.5 Data Sharing Agreement Specific Flags

| Field | 检查项 | Flag 条件 | 风险类别 | 严重程度 |
|---|---|---|---|---|
| phipa_compliance | PHIPA 合规 | 缺少 PHIPA compliance 声明 | Reputational | 🔴 Critical |
| purpose_limitation | 目的限制 | 使用目的过于宽泛或无限制 | Reputational | 🟠 High |
| data_minimization | 数据最小化 | 缺少数据最小化声明 | Reputational | 🟡 Medium |
| breach_timeline | 泄露通知时限 | 时限 > 72h OR 无时限 | Reputational | 🟠 High |
| security_standards | 安全标准 | 缺少安全标准 OR 低于 NCSG | Reputational | 🟠 High |
| audit_rights | 审计权 | 缺少审计权 OR 受限 | Operational | 🟡 Medium |

---

## 二、AI 分析流程

```
输入: 合同文档 (PDF/Word/扫描)
    │
    ▼
┌─────────────────────────────────────────────┐
│  Step 1: 文档分类                            │
│  - 识别文档类型: NDA / MOU / Procurement /  │
│    Data_Sharing / Policy                    │
│  - 方法: 关键词匹配 + ML 分类器              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Step 2: 字段提取                            │
│  - Parties (签约方)                          │
│  - Effective Date / Expiry Date             │
│  - Signatories (签字人 + 职位)               │
│  - Financial Terms (金额/条款)               │
│  - Key Clauses (关键条款是否存在)            │
│  - 方法: NER (Named Entity Recognition)     │
│         + 正则表达式 + LLM 辅助              │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Step 3: 合规检查                            │
│  - 对照 Risk Flag Matrix 逐条检查           │
│  - 生成 Flag 列表                           │
│  - 方法: 规则引擎 (Rule-Based)               │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Step 4: 风险评分                            │
│  - 基于 Flag 严重程度计算综合风险分          │
│  - 1-5 分制 (1=Low, 5=Critical)             │
│  - 方法: 加权评分 + 风险类别权重             │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Step 5: 输出                                │
│  - JSON 结构化结果                           │
│  - Dashboard 可视化                         │
│  - 警报通知 (Teams/Email)                   │
└─────────────────────────────────────────────┘
```

---

## 三、虚构合同测试集（8 份）

| # | 文件名 | 类型 | 预期 Flags | 预期风险分 | 测试目的 |
|---|---|---|---|---|---|
| 1 | NDA_Standard_Compliant.pdf | NDA | 0 | 1 (Low) | 基准测试 - 正常合同应无 flag |
| 2 | MOU_Missing_Second_Signature.pdf | MOU | 3 | 4 (High) | 测试签字权限检测 |
| 3 | Procurement_HealthIT_Service.pdf | Procurement | 4 | 3 (Medium) | 测试多重风险叠加 |
| 4 | DSA_Provider_Data_Sharing.pdf | Data_Sharing | 7 | 5 (Critical) | 测试最严格合规检查 |
| 5 | NDA_Old_Vendor_2022.pdf | NDA | 2 | 3 (Medium-High) | 测试过期检测 |
| 6 | Procurement_Security_Services_2024.pdf | Procurement | 1 | 1 (Low) | 测试续约提醒 |
| 7 | MOU_Partnership_v1+v2.pdf | MOU (x2) | 3 | 4 (High) | 测试重复/冲突检测 |
| 8 | Legacy_IT_Contract_2019_scan.pdf | Procurement | 3 | 4 (High) | 测试 OCR 质量处理 |

**详细合同文本和预期结果见上方文档。**

---

## 四、技术架构

### 4.1 推荐技术栈（Microsoft 生态）

| 组件 | 工具 | 理由 |
|---|---|---|
| 文档输入 | SharePoint Online | 数据不出境，已有基础设施 |
| OCR 提取 | Azure AI Document Intelligence (Canada East) | 专门处理合同/发票，加拿大区域合规 |
| 字段提取 | Power Automate + AI Builder | 低代码，可解释，DHLC 简化路径 |
| 规则引擎 | Power Automate 条件逻辑 | 无需代码，完全可解释 |
| 数据存储 | SharePoint Lists / SQL (Canada) | 本地化存储 |
| 通知 | Microsoft Teams + Power Automate | 现有工具，无需额外审批 |
| Dashboard | Power BI (Southlake tenant) | 可视化风险地图 |

### 4.2 替代方案（如 DHLC 审批受限）

| 组件 | 替代工具 | 说明 |
|---|---|---|
| OCR | Tesseract + Azure OCR (Canada) | 开源 OCR + 本地化云服务 |
| 字段提取 | Python + spaCy/LLM | 需要自建，开发周期更长 |
| 规则引擎 | Python Pandas + 自定义逻辑 | 更灵活但需要维护 |
| 通知 | Python SMTP + Teams Webhook | 基础功能 |

### 4.3 DHLC 审批策略

```
优先路径（简化）:
  Microsoft Copilot / AI Builder → 已简化审批 → 快速上线

备选路径（完整）:
  自建 Python 方案 → 需完整 DHLC 审批 → 开发周期 +4-6 周
```

**建议**：周一 meeting 直接问 Sam 确认 Copilot/AI Builder 的 DHLC 状态。

---

## 五、输出格式示例

### 5.1 JSON 输出结构

```json
{
  "contract_id": "CONTR-2024-0042",
  "document_type": "NDA",
  "parties": ["Southlake Health", "Community Care Partners Inc."],
  "effective_date": "2024-03-15",
  "expiry_date": "2029-03-15",
  "signatories": [
    {"name": "Maria Gonzalez", "title": "VP Operations", "is_vp": true},
    {"name": "James Chen", "title": "VP Finance", "is_vp": true}
  ],
  "vp_signature_count": 2,
  "flags": [],
  "risk_score": 1.0,
  "risk_level": "Low",
  "risk_breakdown": {
    "operational": 0,
    "financial": 0,
    "reputational": 0,
    "continuity": 0
  },
  "ocr_quality": "Good",
  "recommendations": [
    "No action required - contract is compliant."
  ]
}
```

### 5.2 Alert 输出（高优先级合同）

```
🔴 CRITICAL ALERT: Contract CONTR-2024-0042
─────────────────────────────────────────────
Type: Data Sharing Agreement
Parties: Southlake Health × University Health Research Institute
Risk Score: 5.0/5.0 (Critical)

Flags:
  🔴 CRITICAL: No PHIPA compliance statement
  🔴 CRITICAL: No breach notification clause
  🔴 CRITICAL: Missing VP signatures (0 of 2 required)
  🟠 HIGH: Purpose too broad
  🟡 MEDIUM: No data minimization principle

Action Required:
  1. Review with Legal Counsel (Tonya)
  2. Request amendment to add PHIPA compliance
  3. Obtain proper VP signatures
  4. Narrow data use purpose

Next Review: Immediate
─────────────────────────────────────────────
```

---

## 六、下一步行动计划

### 本周（Sep 29 - Oct 3）
- [ ] 周一 meeting：确认 DHLC 审批状态 + Template 发送方式
- [ ] 周三：完成 Risk Flag Matrix 最终版（与 Sonia 对齐）
- [ ] 周五：完成 AI 架构详细设计文档

### 下周（Oct 6 - 10）
- [ ] 运行 8 份虚构合同测试
- [ ] 根据测试结果调整规则引擎
- [ ] 如收到真实 Template，开始验证测试

### 10月中旬
- [ ] 与 Sonia 1on1：Privacy/Compliance 深度讨论
- [ ] 与 Sam 1on1：技术架构 + DHLC 审批
- [ ] Phase 2 正式开发启动

---

*Created: 2026-09-28*
*Status: Design Phase*
*Owner: Susu (AI/Tech) + Evie (Risk)*
