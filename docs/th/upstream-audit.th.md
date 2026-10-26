# ผลตรวจเทียบกับ pstack ต้นฉบับของ Cursor

เอกสารนี้ตอบคำถามว่า workflow ใน repo นี้ยังตรงกับ pstack ต้นฉบับหรือไม่ เราเทียบสามชุดทีละ hunk:

| ชุด | ที่มา |
|---|---|
| ต้นฉบับ | `cursor/plugins` โฟลเดอร์ `pstack` ที่ commit `d457567` (pstack 0.15.28) ซึ่งเป็นเวอร์ชันที่ port นำมาใช้ |
| Port | `dsebban/skills` ที่ commit `12c3f3f` ตัวที่พอร์ตมาใช้กับ OMP และเป็นจุดตั้งต้นของ repo นี้ |
| ของเรา | repo นี้ หลังปรับเป็น single loop |

รายงานฉบับเต็มพร้อมหลักฐานบรรทัดต่อบรรทัดอยู่ใน [`../upstream-audit/audit-poteto-mode.md`](../upstream-audit/audit-poteto-mode.md)
และ [`../upstream-audit/audit-other-skills.md`](../upstream-audit/audit-other-skills.md)

## วิธีจัดประเภท

| ประเภท | ความหมาย |
|---|---|
| T | แปลงให้เข้ากับ OMP เพราะ OMP ต่างจาก Cursor เช่น `task` แทน `Task`, เลือกโมเดลผ่าน config แทนการใส่ชื่อโมเดล, `skill://` แทน path, ตัด cloud agent และ automation ของ Cursor |
| E | แก้ถ้อยคำ ความหมายเท่าเดิม |
| S | กฎ ขั้นตอน เกณฑ์ หรือข้อกำหนดเปลี่ยนไปเกินกว่าที่ OMP บังคับ |
| B | port ทำให้ไฟล์ขัดกันเองหรือใช้ไม่ได้ |

## ภาพรวม

- ไฟล์ที่มีทั้งในต้นฉบับและ port มี 136 ไฟล์ ต่างกัน 88 ไฟล์ ไม่มีไฟล์ใดของต้นฉบับหายไป
- port เพิ่มไฟล์ของ OMP เอง 7 ไฟล์ ได้แก่ `pstack-omp`, `orchestrate-omp`, `fable-deslop` (2 ไฟล์), `apply-models.mjs` กับเทสต์ และเทสต์ของ `worktree-audit`
- ต้นฉบับมี `automations/`, `docs/` และ assets ของ Cursor ที่ไม่ได้พอร์ตมา เพราะเป็นของเฉพาะ Cursor

| กลุ่มไฟล์ | T | E | S | B |
|---|---|---|---|---|
| `poteto-mode`, `agents`, `poteto-help`, `setup-pstack` | 41 แถว | 3 แถว | 17 เรื่อง | 6 เรื่อง |
| skill อื่นทั้งหมด | 203 hunk | 5 hunk | 12 เรื่อง | 0 |

สรุปคือ การเปลี่ยนส่วนใหญ่เป็นการแปลงให้เข้ากับ OMP ตามที่ควรเป็น workflow หลักของทุก playbook ยังครบ แต่ port ทิ้งจุดที่ขัดกันเองไว้ 6 จุด
และเปลี่ยนนโยบายบางข้อโดยไม่ได้บอกไว้

## จุดที่ขัดกันเอง (B) และสถานะ

| รหัส | ปัญหา | สถานะ |
|---|---|---|
| B1 | template ของ `multi-phase-plan.md` เปลี่ยนเป็น `skill://` และ `/loop` แต่ `check-plan.mjs` ยังบังคับ `git show origin/main:` และ `/loop 1h` แผนที่คัดลอกจาก template จึงไม่ผ่าน script | แก้แล้ว `check-plan.mjs` ตรวจคำที่ template ใช้จริง |
| B2 | router บอกว่า owner เป็นคน merge ใน Autopilot-full แต่ตัว playbook บอกว่า root merge | แก้แล้ว router ตรงกับ playbook |
| B3 | Feature บอกว่า owner แตกงานย่อยต่อ ขัดกับกฎห้าม subagent spawn ต่อ | แก้แล้วตอนปรับ single loop |
| B4 | router บอกให้ใช้ `poteto-agent` กับทุก subagent ขัดกับตาราง role | แก้แล้วตอนปรับ single loop |
| B5 | `comment-sicko` ถูกทำให้อ่านอย่างเดียว แต่ยังรายงานไฟล์ที่แก้ และ `no-comments` ยังตรวจ diff ของมัน | แก้แล้ว คืนสิทธิ์ลบ comment ตามต้นฉบับ |
| B6 | template ตัด `on <swarm workers model>` แต่ script ยังบังคับ | แก้แล้ว ใช้ข้อความเดียวกับต้นฉบับ |

## การเปลี่ยนนโยบาย (S) ที่แก้แล้ว

| เรื่อง | ต้นฉบับ | port | ตอนนี้ |
|---|---|---|---|
| `setup-pstack` ขั้น 7 และ 8 | ถ้าผู้ใช้ตอบ yes ให้สร้าง verification skill | ตัดประโยค yes ทิ้ง ตอบ yes แล้วไม่มีขั้นต่อ | คืนประโยค yes ในรูปแบบ OMP |
| การล้าง verdict | verdict ใช้ต่อได้ถ้า `git patch-id` ไม่เปลี่ยน | adapter ล้าง verdict ทุกครั้งที่ restack ขัดกับ `shipping.md` | adapter อ้างกฎ patch-id ของ `shipping.md` |
| งานที่ยากที่สุด | ส่งให้ agent ที่ตั้งเป็นโมเดลแรงสุด ซึ่งมีค่าตั้งต้น | router ยังชี้ไปที่ agent ที่ `setup-pstack` บอกว่าไม่มีโดยค่าตั้งต้น | งานยากอยู่กับ agent หลัก เว้นแต่ตั้ง `poteto-agent` เป็น `@slow` |
| `reflect` แก้ skill | ใช้ `create-skill` ของ Cursor ที่มีรอบ draft, test, iterate | สัญญารอบที่ playbook ของ OMP ไม่มี | ชี้ไปที่ขั้น validate ของ playbook |

## การเปลี่ยนนโยบายที่ยังไม่แตะ

แต่ละข้อเป็นการตัดสินใจของ port ที่ทำงานได้บน OMP ไม่ได้พัง แต่ต่างจากต้นฉบับ ผู้ดูแล repo ควรเลือกเอง:

| เรื่อง | ต้นฉบับ | port และของเรา |
|---|---|---|
| subagent spawn ต่อ (S5) | owner แตกงานย่อยได้ | subagent ห้าม spawn ต่อ ส่ง brief กลับให้ agent หลัก |
| ใคร merge ใน Autopilot-full (S6) | owner merge เอง | agent หลัก merge |
| โมเดลต่างตระกูล (S9) | verifier และ judge ต้องใช้โมเดลต่างตระกูลจาก worker | "ถ้า config ทำได้" และให้ `setup-pstack` เตือน |
| ระดับ reasoning (S14) | ทุก role ได้ระดับเดียวกันตามงบ | แยกระดับตาม role ป้ายของงบจึงไม่ตรงกับค่าที่ใช้จริงทุก role |
| ตัด slop ก่อน commit (S4) | `/deslop` ของ Cursor บังคับทุกครั้ง | `fable-deslop` ข้ามได้ถ้าไม่มี `rpce-cli` |
| lens Divergent ของ `reflect` | ใช้ agent เดียวกับ lens Judgment | ใช้ `security-reviewer` |
| `maintain-formal-verification-skill` ขั้น 3 | ไม่มีการ spawn | เพิ่มการแบ่งอ่านให้ `scout` เมื่อ diff ใหญ่ |
| `make-bot-ui` | ห้าม poll เป็นทางหลัก | มีทาง `/loop` drain เป็นหนึ่งในสองทาง |

## การยืนยันว่ายังใช้กับ OMP ได้

- validator 59 skill, 0 problems
- `check-plan.test.ts` ผ่าน 5/5 และเมื่อรัน template ผ่าน `check-plan.mjs` เหลือปัญหาเดียวคือช่องชื่อโมเดลที่ยังไม่เติม ซึ่งต้นฉบับก็เป็นเหมือนกัน
- รัน `no-comments` จริงด้วย `omp -p` OMP โหลด `comment-sicko` จาก `.omp/agents` ของ project agent ตัวนี้ลบ comment 6 จุดด้วยตัวเอง
  แล้ว agent หลักแก้บั๊กที่มันชี้ บน OMP 18.12.6
