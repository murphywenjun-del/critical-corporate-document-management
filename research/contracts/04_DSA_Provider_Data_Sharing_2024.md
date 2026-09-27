# Contract 4: DSA_Provider_Data_Sharing_2024

## Metadata
- **Document Type**: Data_Sharing
- **File Name**: DSA_Provider_Data_Sharing_2024.pdf
- **Risk Score**: 3.0 / 5.0 (Medium)
- **Rules Flags Count**: 0
- **Expected Outcome**: PHIPA严重缺失 · Zero PHIPA compliance, no breach notification, no VP signatures

---

## Contract Text

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

---

## Identified Risks & Flags

- 🟠 HIGH: Indemnity without monetary cap (Financial)
  - 🟠 HIGH: Auto-increasing fees without overall cap (Financial)
  - 🟡 MEDIUM: Termination for convenience too long (90 days) 
    (Operational)
  - 🟡 MEDIUM: Auto-renewal without expiry notification mechanism 
    (Operational)
