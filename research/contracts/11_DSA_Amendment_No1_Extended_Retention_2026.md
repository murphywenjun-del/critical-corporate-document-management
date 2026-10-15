# HEALTH DATA SHARING SERVICES AGREEMENT
## AMENDMENT NO. 1 — EXTENDED DATA RETENTION & ENHANCED SECURITY
**Effective Date:** January 1, 2027
**Reference Agreement:** Health Data Sharing Services Agreement, dated August 1, 2024 (the "Original Agreement")
**Parties:** Southlake Health (hereinafter "Southlake") and Regional Hospital Network ("RHN")
**Amendment Status:** PENDING EXECUTION — Both parties have reviewed; awaiting VP-level signatures

---

## RECITALS

WHEREAS, the Original Agreement established a framework for sharing de-identified and limited personal health information between Southlake and RHN for population health analytics and care coordination; and

WHEREAS, both parties have identified the need to extend data retention to support longitudinal research, add ICD-10 diagnosis codes to the shared data elements, and strengthen security obligations in response to the 2025 PHIPA compliance update; and

WHEREAS, the parties desire to amend the Original Agreement as set forth herein without modifying any other terms;

NOW, THEREFORE, in consideration of the mutual covenants set forth below, the parties agree as follows:

---

## SECTION 1 — AMENDED DATA RETENTION PERIOD

**1.1** The data retention period set forth in Section 8.2 of the Original Agreement is hereby amended from three (3) years to five (5) years following termination or expiration of the Original Agreement.

**1.2** This extension applies to all de-identified datasets, limited data sets, and derived analytics products maintained by RHN on behalf of Southlake.

**1.3** Upon the expiration of the extended retention period, RHN shall return or destroy all personal health information in its possession in accordance with Section 9 of the Original Agreement, and shall provide Southlake with written certification of destruction within thirty (30) days of completion.

**1.4** Notwithstanding the foregoing, RHN may retain de-identified data for research purposes in perpetuity, provided such data is irreversibly de-identified in accordance with PHIPA s.39 and 45 CFR §164.514(b).

---

## SECTION 2 — ADDED DATA ELEMENTS: ICD-10 DIAGNOSIS CODES

**2.1** The list of permitted data elements in Section 4.1 of the Original Agreement is hereby amended to include:

| Data Element | Format | Frequency | Purpose |
|---|---|---|---|
| ICD-10-CM Diagnosis Codes | HL7 CDA / CSV | Quarterly | Longitudinal cohort analysis |
| ICD-10-CA Procedure Codes | HL7 CDA / CSV | Quarterly | Service utilization tracking |
| Drug Class (ATC Level 2) | Structured | Semi-annual | Medication adherence studies |

**2.2** The addition of ICD-10 codes is subject to RHN implementing the security safeguards set forth in Section 3 of this Amendment.

**2.3** Neither party shall use ICD-10 codes to identify individual patients without express written consent, in accordance with PHIPA s.12(1).

---

## SECTION 3 — ENHANCED SECURITY OBLIGATIONS

**3.1 Breach Notification Timeline**
The breach notification requirement in Section 11.3 of the Original Agreement (forty-eight (48) hours) is hereby amended to twenty-four (24) hours from discovery of a reportable security incident.

**3.2 Annual Penetration Testing**
RHN shall engage an independent third-party security firm to conduct annual penetration testing of all systems that store, process, or transmit Southlake personal health information. A summary report (with all critical and high-severity findings remediated) shall be delivered to Southlake's CISO within ninety (90) days of test completion.

**3.3 Encryption Standards**
All ICD-10 data elements added under Section 2 shall be encrypted at rest using AES-256 or equivalent, and in transit using TLS 1.2 or higher.

**3.4 Access Controls**
RHN shall implement role-based access control (RBAC) for all data elements, with quarterly access reviews documented and available to Southlake upon request.

---

## SECTION 4 — CROSS-REFERENCES TO ORIGINAL AGREEMENT

This Amendment modifies the following sections of the Original Agreement:

| Original Section | Subject | Amendment Reference |
|---|---|---|
| §4.1 | Permitted Data Elements | Amended by §2.1 (adds ICD-10) |
| §8.2 | Data Retention | Amended by §1.1 (3yr → 5yr) |
| §9 | Return/Destruction | Modified by §1.3 (extended timeline) |
| §11.3 | Breach Notification | Amended by §3.1 (48hr → 24hr) |
| §12 | Security Safeguards | Supplemented by §3.2–3.4 |

**Conflict Resolution:** In the event of a conflict between this Amendment and the Original Agreement, the terms of this Amendment shall govern with respect to the subject matter hereof. All other terms of the Original Agreement remain in full force and effect.

---

## SECTION 5 — EXECUTION

This Amendment shall be effective upon execution by authorized representatives of both parties.

**SOUTHLAKE HEALTH**
By: ___________________________
Name: [VP, Information Governance]
Date: _______________

**REGIONAL HOSPITAL NETWORK**
By: ___________________________
Name: [VP, Clinical Informatics]
Date: _______________
By: ___________________________
Name: [CISO]
Date: _______________

---

*This document is Amendment No. 1 to the Health Data Sharing Services Agreement dated August 1, 2024. Cross-reference markers [§X.X] link to the Original Agreement's section numbering. This amendment has NOT yet been executed — it is pending VP-level signatures from both parties.*
