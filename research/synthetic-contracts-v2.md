# 虚构合同测试集 — Synthetic Contract Test Cases v2
## 基于真实 Ontario Healthcare 合同模板改编
## Critical Corporate Document Management AI Prototype

> 来源参考：
> - IPC Ontario Model Data Sharing Agreement
> - AFHTO QIDS Collaboration & Data-Sharing Agreement
> - LegalTemplate.ca Ontario NDA Template
> - Arca.inc Healthcare Vendor Services Agreement
>
> 创建日期：2026-09-28

---

## Contract 1: NDA — 标准合规版 (Expected: Clean, 0 Flags)
**文件名**: NDA_Standard_Compliant_2024.pdf
**文档类型**: NDA (Mutual)
**预期 Flag**: 无
**预期风险分**: 1.0 (Low)

```
MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered 
into as of March 15, 2024 ("Effective Date"), by and between:

SOUTHLAKE HEALTH
An Academic Family Health Team
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5

AND

COMMUNITY CARE PARTNERS INC.
456 Health Plaza
Newmarket, Ontario L3Y 5P3

RECITALS:
WHEREAS the parties wish to explore a potential partnership 
for integrated community health services; and
WHEREAS in connection with such discussions, each party may 
disclose confidential information to the other party;

NOW THEREFORE the parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public information 
disclosed by either party ("Disclosing Party") to the other 
party ("Receiving Party") that is designated as confidential 
or that reasonably should be understood to be confidential 
given the nature of the information and circumstances of 
disclosure, including but not limited to:
  a) Patient health information protected under PHIPA
  b) Business strategies, financial data, and operational plans
  c) Proprietary methodologies and protocols
  d) Staff and physician information

Confidential Information does NOT include information that:
  (a) is or becomes publicly available through no breach of 
      this Agreement
  (b) was rightfully known by the Receiving Party prior to 
      disclosure
  (c) is independently developed by the Receiving Party without 
      use of Confidential Information
  (d) is rightfully received from a third party without breach

2. OBLIGATIONS OF CONFIDENTIALITY
The Receiving Party shall:
  a) Use Confidential Information solely for the purpose of 
     evaluating and pursuing the potential partnership 
     described in Exhibit A
  b) Protect Confidential Information with at least the same 
     degree of care as it uses to protect its own confidential 
     information of like kind, but no less than reasonable care
  c) Not disclose Confidential Information to any third party 
     without prior written consent, except to its employees, 
     contractors, and advisors who have a need to know and 
     are bound by confidentiality obligations at least as 
     protective as this Agreement

3. PHIPA COMPLIANCE
To the extent that Confidential Information includes personal 
health information as defined in the Personal Health Information 
Protection Act, 2004, S.O. 2004, c. 3, Sch. 3 ("PHIPA"), the 
parties agree to comply with all applicable requirements of 
PHIPA, including but not limited to:
  a) Collecting, using, and disclosing personal health 
     information only for permitted purposes
  b) Implementing appropriate administrative, technical, and 
     organizational security safeguards
  c) Notifying the other party within 48 hours of becoming 
     aware of any actual or suspected breach of personal 
     health information

4. TERM
This Agreement shall commence on the Effective Date and 
continue for a period of five (5) years, unless terminated 
earlier in accordance with Section 5.

5. TERMINATION
Either party may terminate this Agreement upon sixty (60) 
days written notice to the other party. Upon termination, 
the obligations under Sections 2 and 6 shall survive.

6. RETURN OR DESTRUCTION OF INFORMATION
Upon termination or at the Disclosing Party's request, the 
Receiving Party shall, within thirty (30) days:
  a) Return all Confidential Information, including all copies, 
     reproductions, and summaries; or
  b) Destroy all Confidential Information and provide written 
     certification of destruction signed by an authorized 
     officer

7. REMEDIES
The parties acknowledge that monetary damages may not be 
an adequate remedy for any breach of this Agreement and 
that the Disclosing Party shall be entitled to seek 
injunctive relief and specific performance, in addition 
to any other remedies available at law.

8. GOVERNING LAW
This Agreement shall be governed by and construed in 
accordance with the laws of the Province of Ontario and 
the applicable laws of Canada.

IN WITNESS WHEREOF, the parties have executed this Agreement 
as of the Effective Date.

SOUTHLAKE HEALTH:                    COMMUNITY CARE PARTNERS INC.:

___________________________          ___________________________
Maria Gonzalez                       Community Care Partners Inc.
Vice President, Operations           Chief Executive Officer
Date: March 15, 2024                 Date: March 15, 2024

___________________________
James Chen
Vice President, Finance
Date: March 15, 2024
```

**预期提取结果**:
- Parties: Southlake Health, Community Care Partners Inc.
- Type: NDA (Mutual)
- Effective Date: 2024-03-15
- Expiry Date: 2029-03-15 (5 years)
- Signatories: Maria Gonzalez (VP Operations), James Chen (VP Finance), CEO
- VP Signatures: 2 ✓
- PHIPA Compliance: Yes ✓ (detailed clause)
- Breach Notification: 48 hours ✓
- Term: 5 years ✓
- Return/Destruction: Yes ✓
- Confidential Scope: Well-defined ✓
- Flags: None
- Risk Score: 1.0 (Low)

---

## Contract 2: MOU — 缺少第二个 VP 签字 (Expected: 3 Flags)
**文件名**: MOU_Missing_Second_Signature_2024.pdf
**文档类型**: MOU
**预期 Flag**: 3个（缺签字 + 混合语言 + 缺终止条款）
**预期风险分**: 4.0 (High)

```
MEMORANDUM OF UNDERSTANDING

This Memorandum of Understanding ("MOU") is made effective 
as of June 1, 2024, between:

SOUTHLAKE HEALTH
An Academic Family Health Team
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5

AND

YORK REGION COMMUNITY HEALTH NETWORK
456 Community Drive
Newmarket, Ontario L3X 1Y2

1. PURPOSE
This MOU establishes a partnership between the Parties for 
shared community health programming, including joint wellness 
workshops, chronic disease management initiatives, and 
health promotion activities in the York Region.

2. SCOPE OF COLLABORATION
The Parties agree to collaborate on the following activities:
  a) Joint health screening events (quarterly)
  b) Shared referral pathways for mental health services
  c) Coordinated care transitions between primary and 
     community care
  d) Shared de-identified data for program evaluation

3. FINANCIAL OBLIGATIONS
Southlake Health shall contribute up to $250,000 annually 
to support joint programming. Additional funding may be 
sought from provincial grants and foundations. Each Party 
shall bear its own operational costs unless otherwise 
agreed in writing.

4. DATA SHARING
The Parties agree to share de-identified program data for 
reporting purposes only, in compliance with applicable 
privacy legislation including PHIPA and FIPPA. A separate 
Data Sharing Agreement will be executed prior to any data 
exchange.

5. TERM AND RENEWAL
This MOU shall be effective from June 1, 2024 to May 31, 2026, 
and may be renewed by mutual written agreement of both 
Parties.

6. binding NATURE
This MOU represents the understanding of the Parties and is 
not intended to create legally binding obligations, except 
for the confidentiality provisions contained herein. 
Financial commitments outlined in Section 3 shall be binding 
upon execution of a separate formal agreement.

7. AMENDMENTS
Any amendments to this MOU must be made in writing and 
signed by authorized representatives of both Parties.

This MOU may be terminated by either Party upon ninety (90) 
days written notice to the other Party.

IN WITNESS WHEREOF, the Parties have caused this MOU to be 
executed by their duly authorized representatives as of 
the date first written above.

SOUTHLAKE HEALTH:                    YORK REGION COMMUNITY HEALTH NETWORK:

___________________________          ___________________________
Robert Thompson                      Dr. Amanda Lee
Executive Director,                  Chief Medical Officer
Population Health Management         Date: June 1, 2024
Date: June 1, 2024
```

**预期提取结果**:
- Parties: Southlake Health, York Region Community Health Network
- Type: MOU
- Effective Date: 2024-06-01
- Expiry Date: 2026-05-31
- Signatories: Robert Thompson (Executive Director), Dr. Amanda Lee (CMO)
- VP Signatures: 0 ✗ (Neither signatory is a VP)
- Binding Language: Mixed — says "not intended to create legally 
  binding obligations" BUT also has binding financial commitments ✗
- Financial Cap: $250,000/year ✓
- Termination: 90 days notice (present but at upper limit) ✓
- Flags:
  - 🔴 CRITICAL: Missing second VP signature — only non-VP signatories 
    (Financial)
  - 🟠 HIGH: Mixed binding/non-binding language creates legal ambiguity 
    (Financial)
  - 🟡 MEDIUM: Termination notice period at 90-day upper limit 
    (Operational)
- Risk Score: 4.0 (High)

---

## Contract 3: Procurement Contract — 多个风险 (Expected: 4 Flags)
**文件名**: Procurement_HealthIT_Service_Agreement_2023.pdf
**文档类型**: Procurement Contract
**预期 Flag**: 4个
**预期风险分**: 3.0 (Medium)

```
VENDOR SERVICES AGREEMENT

This Vendor Services Agreement ("Agreement") is entered into 
effective January 1, 2023, between:

SOUTHLAKE HEALTH
An Academic Family Health Team
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5
("Purchaser")

AND

MEDSOFT SOLUTIONS INC.
250 Technology Drive, Unit 5
Toronto, Ontario M5V 3A8
("Vendor")

1. SERVICES
Vendor shall provide electronic health record (EHR) software 
licensing, implementation support, and ongoing maintenance 
services to Purchaser as detailed in Exhibit A (Statement of 
Work).

2. TERM
This Agreement commenced on January 1, 2023 and shall continue 
until December 31, 2025, automatically renewing for successive 
one (1) year periods unless either Party provides written 
notice of non-renewal at least thirty (30) days prior to the 
expiration date.

3. FEES AND PAYMENT
  a) Annual license fee: $180,000
  b) Support services: $45,000/year
  c) Additional modules: $15,000 per module per year
  d) Fees are subject to annual increase of five percent (5%) 
     or the Consumer Price Index (CPI), whichever is greater
  e) Payment terms: Net thirty (30) days from invoice date

4. SERVICE LEVEL AGREEMENT
  a) Vendor guarantees ninety-nine point five percent (99.5%) 
     system uptime during business hours (7:00 AM – 7:00 PM, 
     Monday through Friday)
  b) For downtime exceeding the guaranteed level, Vendor shall 
     provide service credits equal to five percent (5%) of 
     monthly fees per hour of downtime
  c) Vendor shall provide monthly performance reports

5. DATA SECURITY AND PRIVACY
  a) Vendor acknowledges that it may have access to personal 
     health information ("PHI") of Purchaser's patients
  b) Vendor shall comply with all applicable privacy laws 
     including PHIPA and PIPEDA
  c) Vendor shall implement appropriate technical and 
     organizational security measures including encryption 
     of data at rest and in transit
  d) In the event of a data breach involving PHI, Vendor 
     shall notify Purchaser within seventy-two (72) hours

6. INDEMNIFICATION
Each Party shall indemnify, defend, and hold harmless the 
other Party and its officers, directors, and employees from 
and against any claims, damages, losses, and expenses 
(arising from negligence or wrongful acts of the indemnifying 
Party). Indemnification obligations shall not be subject to 
a monetary cap.

7. TERMINATION
  a) Either Party may terminate for material breach with 
     thirty (30) days written notice and failure to cure
  b) Purchaser may terminate for convenience with ninety 
     (90) days written notice
  c) Upon termination, Vendor shall return or destroy all 
     PHI in its possession within thirty (30) days

8. GOVERNING LAW
This Agreement shall be governed by the laws of the Province 
of Ontario and the applicable laws of Canada.

IN WITNESS WHEREOF, the Parties have executed this Agreement 
as of the Effective Date.

SOUTHLAKE HEALTH:                    MEDSOFT SOLUTIONS INC.:

___________________________          ___________________________
Patricia Wong                        Michael Torres
Vice President, Information          Chief Executive Officer
Technology                           Date: January 1, 2023
Date: January 1, 2023

___________________________
David Kumar
Vice President, Finance
Date: January 1, 2023
```

**预期提取结果**:
- Parties: Southlake Health, MedSoft Solutions Inc.
- Type: Procurement Contract
- Effective Date: 2023-01-01
- Expiry Date: 2025-12-31
- Signatories: Patricia Wong (VP IT), David Kumar (VP Finance), 
  Michael Torres (CEO)
- VP Signatures: 2 ✓
- Indemnity: Present but mutual WITHOUT cap ✗ (should have cap)
- SLA: Present with penalties ✓
- Payment Terms: Variable with 5% auto-increase WITHOUT cap ✗
- Data Security: PHIPA referenced, 72-hour breach notification ✓
- Termination for Convenience: 90 days ✗ (borderline, should be ≤60)
- Auto-Renewal: Yes without explicit expiry notification 
  mechanism ✗
- Flags:
  - 🟠 HIGH: Indemnity without monetary cap (Financial)
  - 🟠 HIGH: Auto-increasing fees without overall cap (Financial)
  - 🟡 MEDIUM: Termination for convenience too long (90 days) 
    (Operational)
  - 🟡 MEDIUM: Auto-renewal without expiry notification mechanism 
    (Operational)
- Risk Score: 3.0 (Medium)

---

## Contract 4: Data Sharing Agreement — PHIPA 严重缺失 (Expected: 7 Flags)
**文件名**: DSA_Provider_Data_Sharing_2024.pdf
**文档类型**: Data Sharing Agreement
**预期 Flag**: 7个（含 3 个 Critical）
**预期风险分**: 5.0 (Critical)

```
DATA SHARING AGREEMENT

This Data Sharing Agreement ("DSA") is made effective 
September 1, 2024, between:

SOUTHLAKE HEALTH
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5

AND

UNIVERSITY HEALTH RESEARCH INSTITUTE
789 Research Boulevard
Toronto, Ontario M5S 1A8

1. PURPOSE
The purpose of this Agreement is to facilitate the sharing 
of de-identified patient outcome data between the Parties 
for research purposes related to chronic disease management 
and quality improvement in primary care settings.

2. DATA TO BE SHARED
The following categories of de-identified data will be shared:
  a) Patient demographics (age group, gender, postal code 
     forward sortation area)
  b) Diagnosis codes (ICD-10-CA)
  c) Treatment outcomes and medication adherence rates
  d) Length of stay for hospital admissions
  e) 30-day readmission rates
  f) Preventive screening completion rates

3. USE OF DATA
The receiving Party may use the data for:
  a) Academic research and analysis
  b) Publication in peer-reviewed journals
  c) Presentation at conferences
  d) Sharing with research collaborators
  e) Quality improvement reporting

4. DURATION
This Agreement shall remain in effect for three (3) years 
from the Effective Date, unless terminated earlier by either 
Party with sixty (60) days written notice.

5. RESPONSIBILITIES OF THE PARTIES
  a) Both Parties agree to protect the confidentiality of 
     the data shared under this Agreement
  b) The receiving Party shall not attempt to re-identify 
     any de-identified data
  c) The disclosing Party warrants that all data shared 
     has been properly de-identified in accordance with 
     applicable privacy standards

6. GOVERNING LAW
This Agreement shall be governed by the laws of the Province 
of Ontario and the federal laws of Canada applicable therein.

IN WITNESS WHEREOF, the Parties have executed this Agreement 
as of the date first written above.

SOUTHLAKE HEALTH:                    UNIVERSITY HEALTH RESEARCH INSTITUTE:

___________________________          ___________________________
Susan Park                           Dr. Richard Foster
Director, Quality and Privacy        Chief Research Officer
Date: September 1, 2024              Date: September 1, 2024
```

**预期提取结果**:
- Parties: Southlake Health, University Health Research Institute
- Type: Data Sharing Agreement
- Effective Date: 2024-09-01
- Expiry Date: 2027-08-31
- Signatories: Susan Park (Director), Dr. Richard Foster (CRO)
- VP Signatures: 0 ✗✗✗ (Neither is a VP)
- PHIPA Compliance: NOT MENTIONED ANYWHERE ✗✗✗✗✗
- Purpose Limitation: Too broad — "academic research, 
  publication, conferences, collaborators" ✗
- Data Minimization: Not explicitly stated ✗
- Breach Notification: Not mentioned ✗✗✗
- Security Standards: Not specified ✗
- Audit Rights: Not mentioned ✗
- Retention/Return: Vague — "protect confidentiality" but 
  no specific retention or destruction process ✗
- Flags:
  - 🔴 CRITICAL: No PHIPA compliance statement (Reputational)
  - 🔴 CRITICAL: No breach notification clause (Reputational)
  - 🔴 CRITICAL: Missing VP signatures (Financial)
  - 🟠 HIGH: Purpose too broad — allows publication and 
    sharing with collaborators (Reputational)
  - 🟡 MEDIUM: No data minimization principle stated 
    (Reputational)
  - 🟡 MEDIUM: No security standards specified (Reputational)
  - 🟡 MEDIUM: No audit rights (Operational)
- Risk Score: 5.0 (Critical)

---

## Contract 5: NDA — 已过期未处理 (Expected: 2 Flags)
**文件名**: NDA_Old_Vendor_2022.pdf
**文档类型**: NDA
**预期 Flag**: 2个
**预期风险分**: 3.0 (Medium-High)

```
CONFIDENTIALITY AGREEMENT

This Confidentiality Agreement ("Agreement") is entered into 
as of February 14, 2022, between:

SOUTHLAKE HEALTH
An Academic Family Health Team
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5

AND

HEALTHTECH VENTURES LTD.
300 Innovation Way
Mississauga, Ontario L5B 2C9

1. CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public information 
relating to the business, operations, or patients of either 
Party that is disclosed by one Party to the other.

2. OBLIGATIONS
The receiving Party agrees to keep all Confidential 
Information confidential and not to disclose it to any 
third party without prior written consent.

3. TERM
This Agreement shall remain in effect for a period of two 
(2) years from the Effective Date.

4. GOVERNING LAW
This Agreement shall be governed by the laws of the Province 
of Ontario.

IN WITNESS WHEREOF, the Parties have executed this Agreement 
as of the date first written above.

SOUTHLAKE HEALTH:                    HEALTHTECH VENTURES LTD.:

___________________________          ___________________________
Lisa Martinez                        Jennifer Liu
Vice President, Operations           Chief Executive Officer
Date: February 14, 2022              Date: February 14, 2022

___________________________
Tom Anderson
Vice President, Procurement
Date: February 14, 2022
```

**预期提取结果**:
- Parties: Southlake Health, HealthTech Ventures Ltd.
- Type: NDA
- Effective Date: 2022-02-14
- Expiry Date: 2024-02-14 (ALREADY EXPIRED ~592 days ago)
- Signatories: Lisa Martinez (VP Ops), Tom Anderson (VP Procurement), 
  Jennifer Liu (CEO)
- VP Signatures: 2 ✓
- PHIPA Compliance: NOT MENTIONED ✗
- Confidential Scope: Vague — "all non-public information" 
  (no specific definition) ✗
- Return/Destruction: NOT MENTIONED ✗
- Breach Notification: NOT MENTIONED ✗
- Flags:
  - 🟠 HIGH: Contract expired 592 days ago — no renewal or 
    termination documented (Operational)
  - 🟡 MEDIUM: No return/destruction clause (Operational)
  - Note: Also missing PHIPA compliance and narrow scope, 
    but those are secondary to the expired status
- Risk Score: 3.0 (Medium-High — expired contracts create 
  legal uncertainty)

---

## Contract 6: Procurement — 续约即将到期 (Expected: 1 Alert)
**文件名**: Procurement_Security_Services_2024.pdf
**文档类型**: Procurement Contract
**预期 Flag**: 1个（续约提醒）
**预期风险分**: 1.0 (Low)

```
SECURITY SERVICES AGREEMENT

This Security Services Agreement ("Agreement") is made 
effective April 1, 2024, between:

SOUTHLAKE HEALTH
An Academic Family Health Team
1085 Davis Drive, Suite 200
Aurora, Ontario L4G 0B5
("Purchaser")

AND

SECUREPRO SERVICES INC.
55 Security Boulevard
Richmond Hill, Ontario L4C 9E8
("Vendor")

1. SERVICES
Vendor shall provide 24/7 physical security services 
including access control, surveillance monitoring, and 
emergency response at Purchaser's facilities.

2. TERM
This Agreement shall commence on April 1, 2024 and continue 
for a period of one (1) year, expiring on March 31, 2025. 
This Agreement shall automatically renew for successive 
one (1) year periods unless either Party provides written 
notice of non-renewal at least sixty (60) days prior to the 
expiration date.

3. FEES
  a) Monthly security services fee: $35,000
  b) Annual total: $420,000
  c) Overtime and special event staffing: billed at 
     pre-agreed hourly rates
  d) Payment terms: Net thirty (30) days from invoice

4. SERVICE LEVEL AGREEMENT
  a) Response time: 15 minutes for urgent requests, 
     30 minutes for standard requests
  b) Coverage: 24/7/365
  c) Monthly performance reporting required
  d) Service credits: 10% of monthly fee per hour of 
     coverage gap beyond guaranteed levels

5. TERMINATION
  a) Either Party may terminate for material breach with 
     sixty (60) days written notice and failure to cure
  b) Purchaser may terminate for convenience with thirty 
     (30) days written notice
  c) Vendor shall cooperate in transition of services 
     upon termination

6. INSURANCE
Vendor shall maintain commercial general liability insurance 
with minimum coverage of $2,000,000 per occurrence.

7. GOVERNING LAW
This Agreement shall be governed by the laws of the Province 
of Ontario.

IN WITNESS WHEREOF, the Parties have executed this Agreement 
as of the Effective Date.

SOUTHLAKE HEALTH:                    SECUREPRO SERVICES INC.:

___________________________          ___________________________
Mark Johnson                         Steven Clark
Vice President, Operations           President
Date: April 1, 2024                  Date: April 1, 2024

___________________________
Amanda White
Vice President, Finance
Date: April 1, 2024
```

**预期提取结果**:
- Parties: Southlake Health, SecurePro Services Inc.
- Type: Procurement Contract
- Effective Date: 2024-04-01
- Expiry Date: 2025-03-31
- Days to Expiry: ~6 months (within 90-day alert threshold)
- Signatories: Mark Johnson (VP Ops), Amanda White (VP Finance), 
  Steven Clark (President)
- VP Signatures: 2 ✓
- SLA: Present with penalties ✓
- Termination for Convenience: 30 days ✓
- Auto-Renewal: Yes with 60-day notice ✓
- Insurance: Specified ($2M) ✓
- Flags:
  - 🟡 MEDIUM: Renewal approaching within 90 days — ALERT 
    (Operational)
- Risk Score: 1.0 (Low — well-drafted, but needs renewal attention)

---

## Contract 7: Duplicate/Conflicting MOU Versions (Expected: 3 Flags)
**文件名**: MOU_Partnership_v1.pdf + MOU_Partnership_v2.pdf
**文档类型**: MOU (两份版本)
**预期 Flag**: 3个（重复/冲突检测）
**预期风险分**: 4.0 (High)

```
[VERSION 1 - FILE: MOU_Partnership_v1.pdf]

MEMORANDUM OF UNDERSTANDING

This MOU is made effective August 1, 2023, between:

SOUTHLAKE HEALTH
1085 Davis Drive, Suite 200, Aurora, ON L4G 0B5

AND

REGIONAL HEALTH ALLIANCE
200 Healthcare Blvd, Newmarket, ON L3Y 8Z5

PURPOSE: Joint community health outreach program.

TERM: Two (2) years from August 1, 2023 to July 31, 2025.

FINANCIAL: Southlake contributes $100,000/year.

BINDING: This MOU is not legally binding except for 
confidentiality.

SIGNATURES:
  - VP Operations (Southlake)
  - VP Finance (Southlake)
  - CEO (Regional Health Alliance)

[VERSION 2 - FILE: MOU_Partnership_v2.pdf]

MEMORANDUM OF UNDERSTANDING

This MOU supersedes all prior understandings between the 
Parties and is made effective October 15, 2023, between:

SOUTHLAKE HEALTH
1085 Davis Drive, Suite 200, Aurora, ON L4G 0B5

AND

REGIONAL HEALTH ALLIANCE
200 Healthcare Blvd, Newmarket, ON L3Y 8Z5

PURPOSE: Expanded partnership including data sharing and 
joint procurement for shared services.

TERM: Three (3) years from October 15, 2023 to October 14, 
2026.

FINANCIAL: Southlake contributes $150,000/year (increased 
from $100,000). Additional funding to be sought from provincial 
grants.

BINDING: This MOU constitutes a legally binding agreement 
regarding financial commitments and data sharing provisions. 
Other provisions are non-binding understandings.

SIGNATURES:
  - VP Operations (Southlake)
  - CEO (Southlake)
  - CEO (Regional Health Alliance)
```

**预期提取结果**:
- Same parties, two versions exist
- Version 1: Effective 2023-08-01, $100K/year, 2-year term, 
  VP+VP signed, non-binding
- Version 2: Effective 2023-10-15, $150K/year, 3-year term, 
  VP+CEO signed, partially binding
- Flags:
  - 🟠 HIGH: Potential duplicate/conflicting contract for same 
    partnership (Financial)
  - 🟠 HIGH: Different financial terms — $100K vs $150K/year 
    for same partnership (Financial)
  - 🟡 MEDIUM: Version 2 has different signatories and binding 
    nature than Version 1 (Financial)
- Risk Score: 4.0 (High — conflicting versions create legal 
  ambiguity)

---

## Contract 8: 低质量扫描件 (Expected: 3 Flags + OCR Warning)
**文件名**: Legacy_IT_Contract_2019_scan.pdf
**文档类型**: Procurement Contract (扫描件，质量差)
**预期 Flag**: 3个（OCR 质量问题）
**预期风险分**: 4.0 (High — cannot assess)

```
[NOTE: This is a poorly scanned document with the following 
characteristics:
  - Resolution: ~150 DPI (very low)
  - Faded text in multiple sections
  - Stain marks covering portions of pages 3-4
  - Some text partially cut off on left margin
  - Page 2 is rotated 15 degrees
  - Overall readability: poor]

[RECOVERABLE TEXT ONLY:]

SOFTWARE LICENSE AGREEMENT
Effective: March [unclear - possibly 2019]
Party: SOUTHLAKE HEALTH...[stain covers vendor name]
...[unclear]...annual license fee of $[illegible - stain]
Term: [unclear - possibly 3 years per ...]
...[cut off text]...indemnification...[illegible]
...[partially visible]...service level...[99% uptime?]
...[partially visible]...termination...[60 days?]
...[partially visible]...data security...[referenced]
Signatures present but names partially obscured:
  - [name]...[title unclear]...Date: 03/[unclear]/2019
  - [name]...[title unclear]...Date: 03/[unclear]/2019
  - [vendor rep]...[title unclear]...Date: 03/[unclear]/2019

[CRITICAL ISSUE: Key fields — vendor name, fee amount, 
exact term length, indemnity terms, and signatory names — 
are illegible due to scan quality.]
```

**预期提取结果**:
- Parties: Partially readable (Southlake Health confirmed, 
  vendor name obscured)
- Type: Procurement Contract (estimated from context)
- Effective Date: ~March 2019 (approximate only)
- Expiry Date: Unknown (scan quality prevents reading)
- Signatories: Present but names/titles partially obscured
- VP Signatures: Cannot verify (names obscured)
- Indemnity: Cannot verify (text illegible)
- Fee Amount: Cannot verify (stain-covered)
- Flags:
  - 🟡 MEDIUM: Low-quality scan — key fields illegible 
    (Operational)
  - 🔴 CRITICAL: Cannot verify indemnity clause (Financial)
  - 🔴 CRITICAL: Cannot verify exact financial terms 
    (Financial)
  - 🔴 CRITICAL: Cannot verify signatory authority (Financial)
- Risk Score: 4.0 (High — cannot assess due to poor quality; 
  this is itself a risk)
- Special Note: This tests the system's ability to handle 
  low-quality input and flag data gaps
