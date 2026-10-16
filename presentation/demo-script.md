# Southlake Health Prototype · Live Demo 讲解稿

**总时长**：12-15 分钟（不含 Q&A）
**目标**：让 client 理解系统能做什么 + 明确下一步要他们配合什么

---

## 开场（30 秒）

> "谢谢各位。今天用 10 分钟给大家 demo 我们做的 Critical Document Management 原型。
> 核心就一句话：**从被动发现问题，变成主动预防问题。**
> 我会直接打开系统，带大家走一遍完整流程。"

**操作**：打开 `localhost:5173/critical-corporate-document-management/`，停在 Risk Register tab。

---

## Part 1：Risk Register — "你现在的风险有多大"（2 min）

**说什么**：
> "这是 Risk Register。13 份合同，41 个 compliance flags。
> 顶部这行数字是最关键的：7 个 Critical，整体合规率 58%。
> 下面表格按 risk score 排序——最上面的是最紧急的。"

**操作**：
1. 指一下顶部 KPI（41 flags, 7 critical, 58% compliance）
2. 指一下顶部蓝色提示条："💡 3 systemic patterns → View Prevention Playbook"
3. 点表格第一行（Critical, score 25）→ 看到 "Missing 2nd VP signature"
4. 点合同名 `#3 Cerner EHR Service Agreement` → 侧面板打开
   - 指 extracted fields 区域
   - 指 "Related Documents"（amendments + cross-refs）
   - 指 Compliance Summary（hard gaps 3, BP gaps 5, rate bar）

**说什么**：
> "点任何一个合同，右边会弹出完整详情：提取的字段、关联文档、合规评分。
> 不需要翻 PDF 找——系统已经帮你解析好了。"

**操作**：关闭侧面板（点 X）

---

## Part 2：L×I 分布 — "风险不是随机的"（1.5 min）

**操作**：
1. 展开顶部的 "📊 L×I Risk Distribution"（点 details）
2. 点 "Likely × Severe · 4" 这个 chip
3. 出现合同列表：#3, #8, #10, #11
4. 点其中一个 → 跳转到合同详情

**说什么**：
> "这里按 Likelihood × Impact 分布。
> 点 'Likely × Severe' 这一格——4 个 flags 落在这里，分布在 4 份合同。
> 点任何一份直接跳过去看。"

**说什么（关键 transition）**：
> "但注意——这 4 个不是 4 个独立问题。它们是**同一个流程缺陷**产生的。
> 下面我会展示系统怎么自动发现这种 pattern。"

---

## Part 3：Cross-Refs — "文档之间有依赖"（2 min）

**操作**：
1. 切到 **Cross-Refs** tab
2. 看顶部 5 个状态计数（Detected 3, Acknowledged 1, Fixing 1, Verified 0, Closed 1）
3. 点第一个卡片（Detected 状态的）→ 展开
4. 看到 Before / After 文本 + "Continue from Detected" 按钮
5. **点 "Continue" 按钮 → 打开 wizard 弹窗**
6. 在 wizard 里点 "Acknowledged →" 按钮（前进一步）
7. 再点 "Fixing →" 按钮
8. 指顶部 5 个步骤框——"你也可以点任意一个跳回去"
9. 关闭弹窗

**说什么**：
> "Cross-Reference 解决的是：**一份文件改了，引用它的文件要同步改。**
> 比如 Cerner 协议修订了 breach notice 时限，但 NDA 模板还是旧的。
> 系统自动检测到这个 gap，然后走 5 步 workflow：
> Detected → Acknowledged → Fixing → Verified → Closed。
> 每一步都有人确认，不会自动跳过。
> 你看这个弹窗——点一下就前进一步，所有步骤在一个窗口里完成。"

---

## Part 4：Smart Filing — "文件进来就归位"（1.5 min）

**操作**：
1. 切到 **Smart Filing** tab
2. 指上传区（"拖文件进来或点 Choose Files"）
3. 指下方 FOLDER STRUCTURE 树（显示 HEROC 5 大类）
4. 展开 "💰 Financial" → 看到 Liability / Other 子文件夹
5. 如果有真实文件在 archive 里，指一下文件路径

> ⚠️ **如果 API server (port 8000) 没开，不要尝试上传——会报错。**
> 直接展示 folder tree + 说 "文件上传后自动分类归档"。

**说什么**：
> "上传一份合同，AI 自动判断它属于哪个 HEROC 类别、哪个子分类，
> 然后物理归档到对应文件夹。
> 这里你看——Financial/Liability 下面已经有 5 份文件了。
> 不需要人手动拖到 14 个文件夹里挑一个。"

**如果 client 问 "AI 是什么？"**：
> "本地 Ollama 跑的 Llama 3.1 8B。合同数据不出 Southlake 边界，不走任何云。"

---

## Part 5：Deadlines — "别忘了谁快到期"（1 min）

**操作**：
1. 切到 **Deadlines** tab
2. 指顶部时间轴（红色 = 已过期，黄色 = 本月到期，蓝色 = 未来）
3. 指红线（"Today"）
4. 指第一个到期合同（红色 dot）
5. 点那个 dot → 跳转合同详情

**说什么**：
> "时间轴一眼看出：哪份合同 30 天内到期、哪份 renewal notice 已经过了 deadline。
> 点任何一个 dot 直接看合同详情。"

---

## Part 6：Insights — "不是告诉你有问题，是告诉你怎么预防"（2 min）⭐ 最重要

**操作**：
1. 切到 **Insights** tab
2. 指 Portfolio Health 圆环（62 分）
3. 指 What-If 区域："Fix Top 3 Patterns → Critical 从 7 降到 2"
4. 看 Systemic Patterns 列表：
   - signatories: 7 flags, 7 contracts
   - breach_notification: 4 flags, 4 contracts
   - governing_law: 3 flags, 3 contracts
5. 点 Prevention Playbook 第 1 条：
   > "Implement pre-execution dual-signature verification gate"
6. 指 Impact 行："Eliminates 7 flags across 7 contracts"

**说什么**：
> "这是整个系统最关键的一层。
> 前面 Risk Register 告诉你'**这份**合同有问题'——这是 reactive。
> 这里告诉你'**为什么** 7 份合同都有同一个问题'——这是 **proactive**。
>
> 7 份合同缺 VP 签字，不是 7 个独立 error，是 1 个 signing authority 流程缺失。
> 修复方法不是改 7 份合同，是加一个 pre-execution verification gate。
> 一次操作，消除 7 个 Critical flags。
>
> 这就是从'检测'到'预防'的跨越。"

**如果 client 问 "这是怎么算出来的？"**：
> "规则引擎扫完所有合同的 flags 后，按 field 聚合。
> 同一个 field 在 3 个以上合同出现 = systemic pattern。
> 然后针对每个 pattern 生成一条 process-level 建议。
> 不是 AI 猜的，是确定性逻辑。"

---

## 收尾（30 秒）

**说什么**：
> "这就是当前原型的全部功能。13 份合同、41 个 flags、6 个 cross-references、
> 完整归档体系、prevention insights。
>
> 下一步需要各位配合的：
> - **Alicia**：给 5-10 份 de-identified 真实合同替换 synthetic data
> - **Tanya**：确认 22 条规则跟 PHIPA / Southlake 政策对齐
> - **Sam / Warren**：确认 Ollama 部署在什么硬件上
> - **Sonia**：安排 30 分钟 usability session，让 Risk / Legal / IT 各一人操作一下
>
> 我的建议是 2 周内做 stakeholder validation，4 周内 pilot 5 份真实合同。
> 有问题现在提，或者会后单独找我也行。"

**操作**：回到 Risk Register 总览画面，定格。

---

## 备用 Q&A 弹药

| 他们可能问 | 你怎么答 |
|-----------|---------|
| "能接现有 DMS（如 ILM）吗？" | "可以。file 归档路径是标准文件夹结构，ILM 可以 watch 这些目录。或者我们出 API。" |
| "22 条规则谁定的？" | "基于 PHIPA s.33(3)、Southlake 的 signing authority policy、和 3 份参考合同。Tanya 来 confirm。" |
| "Llama 8B 够吗？" | "对合同分类够用。如果要更细的 clause-level NLI，可以换 70B 但需要 A100。目前 8B 在 M2 上 2-3 秒一份。" |
| "能不能生成 PPT 给董事会？" | "可以。Insights tab 的内容直接 export 成 slide。我 10 分钟能做。" |
| "上线要多久？" | "Pilot 4 周。Full production 看 scope——如果只做 monitoring + filing，8 周。如果加 workflow automation，12 周。" |

---

## 技术准备清单（今晚确认）

- [ ] `localhost:5173` 能打开（Vite 运行中）
- [ ] `localhost:8000` API 能跑（`python3 server.py`）—— Smart Filing upload 用
- [ ] 浏览器 full-screen 模式（F 键 / Cmd+Shift+F）
- [ ] 提前走一遍所有点击路径，确认没有 bug
- [ ] 准备 1 份 `.docx` 测试文件（万一要现场 upload）
- [ ] 网络备着——如果 localhost 挂了，用 GitHub Pages 静态版兜底
