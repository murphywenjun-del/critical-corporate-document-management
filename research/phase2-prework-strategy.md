# Phase 2 Pre-Work: Template Waiting Strategy
## 三个并行方向的具体执行方案

> 适用场景：Template 还没收到，但不能干等。用这三件事保持进度，等 template 来了直接验证。

---

## 方向一：Risk Category Framework（理论框架）

### 目标
建立四类风险的评估框架，等 template 来了可以直接套用验证。

### 具体产出

#### 1. 风险分类矩阵（1 页）

| 风险类别 | 定义 | 具体指标 | 评估方法 |
|---|---|---|---|
| **Operational** | 影响日常运营的合同风险 | - 关键供应商合同缺失<br>- 服务级别协议(SLA)未签署<br>- 合同续约遗漏导致服务中断 | 检查合同清单中缺失的关键协议 |
| **Financial** | 直接造成经济损失的风险 | - 未授权签字导致合同无效<br>- 到期未续约导致的罚款/自动续约<br>-  indemnity 条款不足<br>- 可变财务条款未跟踪 | 审计签字权限合规性 + 到期合同清单 |
| **Reputational** | 损害组织声誉的风险 | - 与高风险第三方合作未审查<br>- 数据共享协议缺失导致泄露<br>- 违反 PHIPA/FIPPA 的合同条款 | 审查数据共享和隐私相关合同 |
| **Continuity/Succession** | 影响组织持续运营的风险 | - 关键人员离职导致合同管理真空<br>- 继承/继任计划缺失<br>- 业务连续性协议不存在 | 检查 key-person 依赖的合同 |

#### 2. 风险评分标准（1 页）

为每类风险建立评分卡（1-5 分）：

```
评分标准：
1 = No risk (完全合规)
2 = Low risk (轻微问题，易修复)
3 = Medium risk (需要关注，有潜在影响)
4 = High risk (显著风险，需尽快处理)
5 = Critical risk (立即行动，可能造成重大损失)
```

**示例 - Financial Risk 评分卡：**
| 指标 | 权重 | 评分依据 |
|---|---|---|
| 签字权限合规率 | 30% | 缺少一个VP签字 = 3分，缺少两个 = 5分 |
| 到期合同比例 | 25% | <5%过期 = 1分，5-20% = 3分，>20% = 5分 |
| Indemnity 不足 | 20% | 未审查 indemnity 条款 = 3分，明确不足 = 5分 |
| 可变财务条款跟踪 | 15% | 无跟踪机制 = 4分，有机制但不完整 = 2分 |
| 留存合规 | 10% | 超留存期合同未处置 = 4分 |

#### 3. 评估流程设计（1 页）

```
Step 1: 文档收集 → 从 taxonomy 中提取所有合同
Step 2: 合规检查 → 对照 signing authority policy
Step 3: 风险评分 → 按评分卡打分
Step 4: 优先级排序 → 找出 top 10 高风险合同
Step 5: 报告输出 → 风险地图 + 行动建议
```

### 执行建议
- **负责人**：Evie（Risk Assessment）
- **时间**：2-3 天
- **交付物**：风险分类矩阵 + 评分卡 + 评估流程文档
- **等 template 来之后**：用真实合同测试评分卡，调整权重

---

## 方向二：AI Solution Design（技术架构设计）

### 目标
设计好 tickler system 的完整架构，等 template 来了直接开始实现。

### 具体产出

#### 1. Tickler System 架构图（1 页）

```
┌─────────────────────────────────────────────────────────────┐
│                    Document Input Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Word/PDF │  │  Scanned │  │  Excel   │  │  Email   │   │
│  │ Contracts│  │  Contracts│  │  Metadata │  │  Alerts  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴──────────────┴──────────────┘        │
│                         ↓                                    │
│              ┌──────────────────────┐                       │
│              │   Document Processing │                       │
│              │  (OCR + Text Extract) │                       │
│              └──────────┬───────────┘                       │
│                         ↓                                    │
├─────────────────────────────────────────────────────────────┤
│                   AI Analysis Layer                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Field Extraction (NER)                              │   │
│  │  - Party names                                       │   │
│  │  - Effective dates                                   │   │
│  │  - Expiry dates                                      │   │
│  │  - Signatories                                       │   │
│  │  - Financial terms                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Compliance Rules Engine                              │   │
│  │  - Check: 2 VP signatures required?                  │   │
│  │  - Check: Within retention period?                   │   │
│  │  - Check: Renewal date approaching?                  │   │
│  │  - Check: Data sharing agreement in place?           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Risk Scoring Module                                  │   │
│  │  - Apply risk category framework                      │   │
│  │  - Calculate composite risk score                     │   │
│  │  - Flag high-risk items                               │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                  Output & Notification                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │  Alerts      │  │  Reports     │     │
│  │  (SharePoint)│  │  (Email/Teams)│  │  (PDF)       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

#### 2. 技术选型建议（1 页）

| 组件 | 推荐方案 | 理由 | DHLC 状态 |
|---|---|---|---|
| **文档处理** | Microsoft Power Automate + AI Builder | 内置 SharePoint，简化审批 | ✅ 已简化路径 |
| **文本提取** | Azure AI Document Intelligence（加拿大区域） | 专门处理合同/发票 | ⚠️ 需确认加拿大区域 |
| **规则引擎** | Power Automate 条件逻辑 | 无需代码，可解释性强 | ✅ 无需额外审批 |
| **数据存储** | SharePoint Online（Southlake tenant） | 数据不出境 | ✅ 已合规 |
| **通知** | Microsoft Teams + Power Automate | 现有工具 | ✅ 无需审批 |
| **Dashboard** | Power BI（Southlake tenant） | 可视化风险地图 | ⚠️ 需确认 |

**关键决策点**：
- 如果 Microsoft Copilot/AI Builder 已获 DHLC 简化审批 → 优先用这个路径
- 如果需要自建 → 考虑 Python + 本地模型（如 Ollama + Llama），但开发周期更长

#### 3. AI 分析逻辑设计（1 页）

**输入**：一份合同文档
**处理流程**：

```
1. 文档分类 → 识别是 NDA/MOU/Procurement/Policy 中的哪一类
2. 字段提取 → 用 NER 提取：
   - 签约方名称
   - 生效日期
   - 到期日期
   - 签字人姓名和职位
   - 金额条款
   - 续约条件
   -  indemnity 条款
3. 合规检查 → 对照 Southlake policy：
   - 是否两个 VP 签字？
   - 是否在留存期内？
   - 续约通知是否已发送？
4. 风险评分 → 应用风险评分卡
5. 输出 → Dashboard + 警报
```

**示例 Prompt（用于 AI 分析）**：
```
You are a contract compliance assistant. Analyze the following contract 
and extract: 1) All parties involved, 2) Effective date, 3) Expiry date, 
4) Signatories with their titles, 5) Key financial terms, 6) Renewal 
conditions, 7) Indemnity clauses. 

Return results in JSON format. If a field is not found, mark as "N/A".
```

### 执行建议
- **负责人**：Susu（AI & Technology）
- **时间**：3-4 天
- **交付物**：架构图 + 技术选型文档 + AI 分析逻辑设计
- **等 template 来之后**：用真实合同测试 AI 提取准确性

---

## 方向三：Synthetic Data Testing（虚构数据测试）

### 目标
用虚构合同验证 AI 逻辑和风险评分框架，等 template 来了做对比验证。

### 具体产出

#### 1. 生成 5-10 份虚构合同模板（1-2 天）

**合同类型覆盖**：
| # | 类型 | 用途 | 关键测试点 |
|---|---|---|---|
| 1 | NDA（标准版） | 测试基本信息提取 | Party names, dates, signatures |
| 2 | MOU（缺签字） | 测试合规检测 | Missing VP signatures → flag |
| 3 | Procurement Contract | 测试财务条款 | Variable financial terms |
| 4 | Data Sharing Agreement | 测试隐私合规 | PHIPA compliance check |
| 5 | Expired Contract | 测试到期检测 | Past expiry date → flag |
| 6 | Renewal-trigger Contract | 测试续约提醒 | Renewal in 30 days → alert |
| 7 | Duplicate Contract | 测试重复检测 | Same terms, different dates |
| 8 | Low-quality Scan | 测试 OCR 鲁棒性 | Poor quality → handling strategy |

**虚构合同示例（MOU 缺签字）**：
```
MEMORANDUM OF UNDERSTANDING

This MOU is entered into on January 15, 2024, between:
- Southlake Health, represented by John Smith, Executive Director
- Community Health Partners, represented by Jane Doe, CEO

Term: January 15, 2024 to January 14, 2026

Signatures:
☑ John Smith, Executive Director    Date: 01/15/2024
☐ [Missing: Second VP Signature]

Key Terms:
- Annual budget: $500,000
- Renewal: Automatic unless 90 days notice
- Indemnity: Mutual, capped at $1M
- Data sharing: Yes, subject to PHIPA compliance

[END OF DOCUMENT]
```

#### 2. 测试脚本（1 天）

```python
# 伪代码：测试框架
test_cases = [
    {"doc": "moU_missing_signature.pdf", "expected_flags": ["missing_vp_signature"], "risk_score": 4},
    {"doc": "contract_expired.pdf", "expected_flags": ["expired_document"], "risk_score": 3},
    {"doc": "nda_complete.pdf", "expected_flags": [], "risk_score": 1},
    {"doc": "procurement_renewal_30days.pdf", "expected_flags": ["renewal_imminent"], "risk_score": 2},
]

for test in test_cases:
    result = analyze_contract(test["doc"])
    assert set(result["flags"]) == set(test["expected_flags"])
    assert abs(result["risk_score"] - test["risk_score"]) <= 1
```

#### 3. 测试报告模板（0.5 天）

| 测试用例 | 预期结果 | 实际结果 | 通过/失败 | 备注 |
|---|---|---|---|---|
| MOU 缺签字 | Flag: missing_vp_signature | ? | ? | |
| 过期合同 | Flag: expired | ? | ? | |
| 完整 NDA | No flags | ? | ? | |
| 30天内续约 | Alert: renewal_imminent | ? | ? | |

### 执行建议
- **负责人**：Nicole + Susu 协作
- **时间**：2-3 天
- **交付物**：5-10 份虚构合同 + 测试脚本 + 测试报告
- **等 template 来之后**：用真实合同跑同样的测试，对比准确率

---

## 总时间线（等 template 期间）

```
Day 1 (今天): Team sync + 分工确认
Day 2-3: Risk Framework (Evie) + AI Design (Susu) + Synthetic Data (Nicole+Susu)
Day 4-5: 交叉 review + 整合
Day 6-7: 等 template，准备验证计划
Day 8+: Template 到达 → 验证框架 + 调整 + 进入 Phase 2 正式开发
```

---

## 周一 meeting 上可以说的

> "While we wait for the de-identified templates, we've been working on three parallel tracks:
> 1. A risk category framework with scoring criteria — ready to apply once we have documents
> 2. An AI solution architecture design — chose Microsoft ecosystem to align with your environment
> 3. Synthetic contract testing — we created 8 fake contracts to validate our logic
>
> So even without real templates, we're making progress. Once they arrive, we can validate everything in parallel."

---

*Created: 2026-09-28*
