# Release Notes – 0.3.0

ซิงก์กับ pstack 0.15.32 (`cursor/plugins` ที่ `99b609a`) อัปเดตจากรุ่นก่อนด้วย:

```bash
omp plugin marketplace update pstack-omp-lean
omp plugin upgrade pstack-omp-lean@pstack-omp-lean
```

แล้วเปิด OMP process ใหม่ หรือรัน `/reload-plugins`

## พฤติกรรมที่เปลี่ยน

- **`/skill:sharpen` คืน prompt ที่เขียนใหม่และไม่ทำงานแล้ว** ตอบสี่ข้อ คือมืออาชีพจะทำอะไรเพิ่ม วัตถุดิบดิบที่สุด วิธีและเครื่องมือ
  และสิ่งภายนอกที่พิสูจน์ว่าผลถูก จากนั้นเขียน prompt ใหม่ การเลือกที่เป็นของผู้ใช้ปล่อยไว้เปิด รุ่นก่อนลับงานแล้วลงมือทำเลย
- **`/skill:reflect` ไม่แก้ skill ใน `plugins/cache/`** ก่อนอนุมัติจะแสดงปลายทาง `.omp/skills/<skill>/` หรือ
  `~/.omp/agent/skills/<skill>/` หลังอนุมัติจะ copy skill ไปที่นั่นแล้วแก้ copy และไม่เปิด PR หรือ push

## Skill ใหม่

- **`statechart`** วาดการเปลี่ยนสถานะของระบบเป็น Mermaid statechart จาก model TLA+ บั๊กแต่ละตัวเป็นเส้นทางมีเลขกำกับ
  เปลี่ยน chart ที่ตกลงกันแล้วเป็นโครง TLA+ หรือตรวจโค้ดเทียบกับ spec ที่มี ครั้งแรกติดตั้ง TLC และ Java ด้วย mise ราว 305 MB
  หรือตั้ง `TLA2TOOLS` และ `JAVA` ให้ใช้ตัวที่มีอยู่
- **`ketchup-video`** สรุปงานแบบ `ketchup` เป็นวิดีโอสไลด์สั้นไม่มีเสียง แล้วลิงก์ path ของไฟล์วิดีโอในคำตอบ ต้องมีเครื่องมือ render
  เช่น `ffmpeg`
- **`create-formal-verification-skill`** บอก skill ที่สร้างให้อ่านผล TLA+ ด้วย `statechart`

## แก้ไข

- `check-plan.mjs` อ่าน inline code ที่ใช้ backtick หลายตัวถูกต้อง
- `orch` เลือก PR ที่ยัง active ก่อนประวัติของ branch
- `watch-pr` ไม่ sleep เกิน deadline และแยก head ที่มาจาก fork ได้ตอนหา stack

## สำหรับผู้ดูแล

- `UPSTREAM` บันทึก commit ของ upstream ที่ซิงก์ล่าสุด `scripts/sync-upstream.sh` ดึงช่วงถัดไปมาใส่ และลิสต์ hunk ที่ต้องพอร์ตเอง
- ผลตรวจรายไฟล์ของรอบนี้อยู่ที่ `docs/upstream-audit/sync-0.15.32.md` ทุก hunk เป็นการแปลงให้เข้ากับ OMP หรือแก้ถ้อยคำ

## การทดสอบ

- validator 61 skill, 0 problems
- WSL Ubuntu: `poteto-mode/scripts` 84/84, `apply-models` 9/9, `statechart` 147 pass, 0 fail, 3 skipped (ต้องใช้ font Type 1 หรือ TLC จาก mise)
- รันจริงด้วย `omp -p` บน OMP 18.12.6 Windows: `statechart` วาดบั๊กตัดเงินซ้ำเป็นเส้นทางสองขั้นพร้อม PNG, `ketchup-video` render
  mp4 15 วินาทีและลิงก์ในคำตอบ, `sharpen` คืน prompt ใหม่โดยไม่แตะไฟล์

---

# Release Notes – 0.2.0

อัปเดตจาก 0.1.0 ด้วย:

```bash
omp plugin marketplace update pstack-omp-lean
omp plugin upgrade pstack-omp-lean@pstack-omp-lean
```

แล้วเปิด OMP process ใหม่ หรือรัน `/reload-plugins`

## พฤติกรรมที่เปลี่ยน

- **`comment-sicko` ลบ comment เองได้อีกครั้ง** agent ได้เครื่องมือ `edit` คืน และลบ comment กับ suppression ในขอบเขตที่ได้รับเอง
  ตรงกับ pstack ต้นฉบับ แต่ยังห้ามแก้โค้ดของแอป `no-comments` ตรวจ diff ของมันเหมือนเดิม ถ้าเคย copy `comment-sicko.md`
  ไว้ใน `~/.omp/agent/agents/` ไฟล์นั้นยังเป็นเวอร์ชันอ่านอย่างเดียว ให้ลบออกเพื่อใช้ตัวของ plugin
- **`check-plan.mjs` ตรวจคำใน Program checklist ตาม template ของ OMP** ต้องมี `skill://poteto-mode/playbooks/`, `/loop` และ
  `status message` แทน `git show origin/main:` และ `/loop 1h` แผนที่เขียนตาม template ปัจจุบันจึงผ่าน
- **ส่วน Verify, live ของแผนต้องระบุโมเดล** template ใน `multi-phase-plan.md` เขียนว่า
  `Ten lanes on <swarm workers model> at the PR head` ตรงกับต้นฉบับและกับ `check-plan.mjs`
- **verdict ใช้ต่อได้หลัง restack ตามกฎ patch-id** `pstack-omp` ไม่ล้าง verdict ทุกครั้งที่ restack แล้ว แต่ใช้กฎ `git patch-id`
  ใน `shipping.md` ขั้น 3
- **งานโค้ดที่ยากที่สุดอยู่กับ agent หลัก** เว้นแต่ตั้ง `poteto-agent` ให้ใช้โมเดลแรงสุด เช่น `--agent poteto-agent=@slow`

## แก้ไข

- `poteto-mode` บรรทัดของ Autopilot-full บอกตรงกับ playbook แล้วว่า agent หลักเป็นคน merge PR ที่ swarm ตรวจผ่าน
- `setup-pstack` ขั้น 7 และ 8 บอกอีกครั้งว่าถ้าผู้ใช้ตอบ yes ให้รัน `create-verification-skill` หรือ
  `create-formal-verification-skill`
- `reflect` ไม่สัญญารอบ draft, test, iterate ที่ playbook ของ OMP ไม่มีแล้ว ชี้ไปที่ขั้น validate ของ `authoring-a-skill` แทน

## เอกสาร

- `README.th.md` README ภาษาไทย
- `docs/th/` เอกสารภาษาไทยฉบับเต็ม ได้แก่ กระบวนการทำงานทั้งหมด, ขั้นตอนของทั้ง 23 playbook, คำอธิบายทั้ง 59 skill
  และผลตรวจเทียบกับ pstack ต้นฉบับของ Cursor (`docs/th/upstream-audit.th.md`)
- `docs/pstack-guide-notes.th.md` สรุปคู่มือ pstack ของ poteto ภาค 1 และ 2 ด้วยถ้อยคำของเราเอง พร้อมตารางเทียบกับ repo นี้
- `docs/upstream-audit/` รายงานตรวจเทียบฉบับเต็ม ระหว่าง `cursor/plugins` pstack 0.15.28, `dsebban/skills` และ repo นี้

## การทดสอบ

- validator 59 skill, 0 problems
- `check-plan.test.ts` 5/5 และ template ของ `multi-phase-plan.md` ผ่าน `check-plan.mjs` เหลือเพียงช่องชื่อโมเดลที่ต้องเติม
- รัน `no-comments` จริงด้วย `omp -p` บน OMP 18.12.6 `comment-sicko` โหลดจาก plugin และลบ comment 6 จุดด้วยตัวเอง

---

# Release Notes – 0.1.0

รุ่นแรก ติดตั้งเป็น OMP plugin ผ่าน `.omp-plugin/marketplace.json`

- ชุด skill pstack 0.15.28 ที่พอร์ตมาใช้กับ OMP จาก `dsebban/skills` ที่ `12c3f3f`
- agent หลักทำงานเองเป็นค่าเริ่มต้น และ spawn subagent เฉพาะเมื่อผ่าน spawn gate สามข้อ ได้แก่ context, independence และ conflict
- `architect` ใช้ arena และ cross-judge ทุกครั้ง, `how` ใช้ `scout` เมื่อคำตอบข้ามตั้งแต่ 3 directory หรือ 2 service
- `interrogate` มีกฎผู้เขียน ทุก finding ต้องแก้หรือหักล้างด้วยหลักฐานที่รันได้
- รายงานของ subagent ทุกตัวใช้รูปแบบเดียว และ verifier ห้ามผ่านเมื่อรันไม่ครบ
