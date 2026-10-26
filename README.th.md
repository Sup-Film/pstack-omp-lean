# pstack-omp-lean

[English](README.md) | ภาษาไทย

ชุด skill [pstack](https://github.com/cursor/plugins/tree/main/pstack) ของ Lauren Tan (poteto) สำหรับ
[OMP](https://omp.sh/) ติดตั้งเป็น plugin ของ OMP ได้ และปรับให้งานส่วนใหญ่ทำใน agent loop เดียว

repo นี้ต่อยอดจาก [`dsebban/skills`](https://github.com/dsebban/skills) ซึ่งพอร์ต pstack จาก Cursor มาใช้กับ OMP
โดยแปลงกลไกของ Cursor เป็นของ OMP ทั้งหมด ได้แก่ `task` batch, การเลือกโมเดลตาม role, `skill://`, `agent://` และ
`history://` repo นี้คงงานพอร์ตไว้ แล้วเปลี่ยนเงื่อนไขว่าเมื่อไรจึงควร spawn subagent ตามบทความของ Anthropic
[When to fold subagents into your main agent loop](https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop)
และ [คู่มือ pstack](https://x.com/poteto/status/2097732320606507506) ของ poteto เอง สรุปภาษาไทยของคู่มืออยู่ที่
[`docs/pstack-guide-notes.th.md`](docs/pstack-guide-notes.th.md)

## ติดตั้ง

ใน OMP session:

```text
/marketplace add Sup-Film/pstack-omp-lean
/marketplace install pstack-omp-lean@pstack-omp-lean
/reload-plugins
```

หรือจาก shell:

```bash
omp plugin marketplace add Sup-Film/pstack-omp-lean
omp plugin install pstack-omp-lean@pstack-omp-lean
```

plugin นี้มี skill 59 ตัวใน `skills/` และ subagent 2 ตัวใน `agents/` คือ `poteto-agent` กับ `comment-sicko`
ถ้าต้องการติดตั้งให้ใช้ได้แค่ใน repo เดียว ให้เพิ่ม `--scope project`

### ถ้าเคยติดตั้ง pstack แบบอื่นไว้

ของเดิมสองอย่างจะบัง plugin:

1. entry ใน `skills.customDirectories` ของ `~/.omp/agent/config.yml` ที่ชี้ไปที่ pstack ชุดอื่น ทำให้มี skill
   ชื่อซ้ำกัน ให้ลบ entry นั้นออก
2. ไฟล์ `poteto-agent.md` และ `comment-sicko.md` ใน `~/.omp/agent/agents/` OMP โหลด agent ระดับ user ก่อน agent
   ของ plugin ให้ลบหรือย้ายทั้งสองไฟล์ออก

จากนั้นเปิด OMP process ใหม่

### อัปเดตและถอนการติดตั้ง

```bash
omp plugin marketplace update pstack-omp-lean
omp plugin upgrade pstack-omp-lean@pstack-omp-lean
omp plugin uninstall pstack-omp-lean@pstack-omp-lean
```

`upgrade` จะดึงของใหม่ก็ต่อเมื่อ `version` ใน `.omp-plugin/marketplace.json` เปลี่ยน ผู้ดูแลต้องเพิ่มเลขเวอร์ชันทุกครั้งที่ออกรุ่นใหม่

### ติดตั้งแบบ manual

ถ้าต้องการใช้ checkout ที่แก้ไขได้แทน cache ของ plugin:

```bash
git clone https://github.com/Sup-Film/pstack-omp-lean.git ~/dev/pstack-omp-lean
mkdir -p ~/.omp/agent/agents && cp ~/dev/pstack-omp-lean/agents/*.md ~/.omp/agent/agents/
```

```yaml
# ~/.omp/agent/config.yml
skills:
  customDirectories:
    - ~/dev/pstack-omp-lean/skills
```

## สิ่งที่ต้องมี

- OMP 18.10.4 ขึ้นไป ทดสอบแล้วกับ 18.12.6
- Bun สำหรับ script ของ `poteto-mode`
- `gh` สำหรับ playbook ที่เกี่ยวกับ PR
- RepoPrompt CE และ `rpce-cli` สำหรับ `fable-deslop`
- `trash` สำหรับ playbook ล้าง worktree

## ตั้งค่าโมเดล

OMP เลือกโมเดลตาม role ไม่ได้เลือกต่อการเรียกแต่ละครั้ง รันคำสั่งนี้ครั้งเดียว:

```text
/skill:setup-pstack
```

skill นี้ถามงบด้าน reasoning แล้วเขียน `modelRoles` และ `task.agentModelOverrides` หลังตรวจทุก selector แล้ว
งบนี้มีผลกับ agent ที่ถูก spawn เท่านั้น ส่วน session หลักซึ่งตอนนี้ทำงานส่วนใหญ่ ใช้โมเดลที่เลือกด้วย `/model` หรือ
`modelRoles.default`

reviewer, runner ของ arena และ judge จะให้มุมมองที่ต่างกันจริงก็ต่อเมื่อใช้โมเดลต่างตระกูลกัน `setup-pstack`
จะแจ้งเมื่อ agent สองตัวใน panel ใช้โมเดลเดียวกัน

## วิธีใช้

เริ่มด้วย `/skill:poteto-mode` แล้วอธิบายงาน skill นี้จะเลือก playbook ที่ตรงกับงาน เช่น feature, bug fix, perf,
refactoring, investigation, prototype, multi-phase plan แล้วโหลด skill ที่ playbook นั้นต้องใช้ ทุก skill เรียกตรงได้ด้วย
`/skill:<name>`

```text
/skill:poteto-mode fix this bug report: <วางรายงาน>. Reproduce it first and show me the failing and passing runs.
/skill:poteto-mode build <feature>. Architect it first.
/skill:how how does <subsystem> work?
/skill:why why does <code> do it this way?
```

ทุก skill ยังตั้ง `disable-model-invocation: true` ตาม upstream โมเดลจึงโหลด skill เองไม่ได้ ต้องให้ผู้ใช้เรียก
หรือให้ `poteto-mode` ส่งต่อไป ยกเว้น `pstack-omp`, `orchestrate-omp` และ `setup-pstack` ส่วน `/skill:poteto-help`
อธิบายภาพรวมของทั้งชุด

| กลุ่ม | Skill |
|---|---|
| Router | `poteto-mode` |
| OMP adapter | `pstack-omp`, `orchestrate-omp`, `setup-pstack` |
| ทำความเข้าใจ | `how`, `why`, `interrogate`, `blast-radius`, `recall`, `ketchup`, `in-your-own-words`, `teach` |
| ออกแบบและสำรวจ | `architect`, `arena`, `swarm`, `figure-it-out`, `sharpen`, `reflect` |
| ลงมือทำ | `tdd`, `correct`, `bro`, `show-me-your-work`, `benchmark-checklist`, `automate-me` |
| เขียน | `unslop`, `technical-writing`, `no-comments` |
| Verification | `create-verification-skill`, `maintain-verification-skill`, `create-formal-verification-skill`, `maintain-formal-verification-skill` |
| Review | `fable-deslop` |
| อื่นๆ | `typescript-best-practices`, `make-bot-ui`, `poteto-help` และ `principle-*` อีก 24 ตัว |

## ต่างจาก upstream อย่างไร

upstream แบ่งงานตามบทบาท explorer อ่านโค้ด planner วางแผน implementer เขียนโค้ด synthesizer สรุป การส่งต่อแต่ละครั้ง
ทำให้ context หาย และใช้ token มากขึ้นหลายเท่า ใน repo นี้ chat ที่รัน `poteto-mode` ทำงานเหล่านั้นเอง และจะ spawn
subagent ก็ต่อเมื่อผ่านเงื่อนไขข้อใดข้อหนึ่งในส่วน Delegation ของ `poteto-mode`:

1. **Context** subagent ต้องอ่านข้อมูลมากกว่าที่ agent หลักต้องใช้ต่อมาก และอ่านให้แคบลงไม่ได้แล้ว
2. **Independence** งานต้องใช้ context ใหม่ที่ไม่เห็นของ agent หลัก เช่น review, verification, judge, แบบออกแบบที่แข่งกัน
   หรืองานขนานที่เขียนไฟล์ไม่ทับกัน
3. **Conflict** งานต้องใช้เครื่องมือหรือคำสั่งที่ขัดกับของ agent หลัก และ skill ช่วยประสานไม่ได้

| งาน | upstream | repo นี้ |
|---|---|---|
| โค้ดของ feature, bug fix, perf, refactoring | subagent implementer | agent หลักเขียนโค้ดและเทสต์เอง |
| `how` | subagent explainer และ explorer เมื่อขอบเขตซับซ้อน | agent หลักอธิบายเอง ใช้ `scout` เมื่อคำตอบข้ามตั้งแต่ 3 directory หรือ 2 service |
| `why` | subagent ค้น git และ synthesizer | agent หลักอ่าน git และสรุปเอง ใช้ investigator เฉพาะแหล่งที่ไม่ใช่ git |
| `architect` | arena ที่มี runner และ cross-judge | เหมือนเดิม |
| เปิด PR และเฝ้า CI | subagent | คำสั่งธรรมดาและ shell job เบื้องหลัง |
| `interrogate`, `no-comments`, `swarm`, `eval`, `reflect` | subagent | เหมือนเดิม |

เมื่อ agent หลักต้องคัดแยก review ของโค้ดที่ตัวเองเขียน `interrogate` จึงมีกฎเพิ่ม คือทุก finding ต้องแก้ หรือหักล้างด้วย
หลักฐานที่รันได้

subagent ทุกตัวส่งรายงานรูปแบบเดียวกัน ได้แก่ verdict (`PASS`, `ISSUES` หรือ `BLOCKED`) ข้อสรุป และหลักฐานเป็น
`file:line` หรือคำสั่งพร้อมผล verifier ห้ามให้ผ่านถ้ารันไม่ครบ

[`docs/single-loop/inventory.tsv`](docs/single-loop/inventory.tsv) ระบุจุดที่เคย spawn ทั้ง 40 จุดพร้อมคำตัดสินและเหตุผล
[`docs/single-loop/decisions.tsv`](docs/single-loop/decisions.tsv) บันทึกการตัดสินใจทุกข้อพร้อมหลักฐาน

## การทดสอบ

```bash
node scripts/validate-skills.mjs                                      # frontmatter และลิงก์ skill:// ทุกตัว
cd skills/poteto-mode/scripts && bun install && bun test              # 70 เทสต์
cd skills/setup-pstack/scripts && node --test apply-models.test.mjs   # 9 เทสต์
```

รันเทสต์ของ script บน Linux, macOS หรือ WSL บน Windows โดยตรง (upstream ก็เป็นเหมือนกัน) จะล้ม 7 เทสต์ของ bun
เพราะ `gh` และ `origin` ปลอมในเทสต์เป็น bash script และใช้ `:` คั่น `PATH` และล้ม 6 เทสต์ของ `apply-models`
ซึ่งยังไม่ได้หาสาเหตุ ทั้งหมดผ่านบน WSL Ubuntu

ผลของรุ่นนี้ วัดบน OMP 18.12.6:

- Validator 59 skill, 0 problems เทสต์ของ script 70/70 และ 9/9 บน WSL Ubuntu เท่ากับ upstream
- รันจริงด้วย `omp -p` แบบละ 1 ครั้ง ค่าใช้จ่ายนับเฉพาะ session หลัก

| สถานการณ์ | subagent ที่ spawn | ผล | เวลา | ค่าใช้จ่ายของ session หลัก |
|---|---|---|---|---|
| Bug fix | 0 | เทสต์ล้มก่อนแก้ ผ่าน 3/3 หลังแก้ | 57 วินาที | $0.36 |
| Feature ผ่าน architect | candidate 2, judge 1, reviewer 1 | agent หลักเขียนโค้ด reviewer เจอ overflow ผ่าน 10/10 | 17 นาที | $1.31 |
| `why` จากประวัติ git | 0 | อ้าง commit และ incident ถูก | 65 วินาที | $0.37 |
| `how` บน repo 4 ไฟล์ | 0 | ไล่จาก handler ถึง store | 52 วินาที | $0.26 |
| `how` บน service ขนาดใหญ่ | scout 2 | ไล่จาก route ถึง Usage Record | 330 วินาที | $0.84 |
| `interrogate` กับ diff ของตัวเอง | reviewer 2 | แก้ finding โดยเขียนเทสต์ก่อน และหักล้างข้ออ้างหนึ่งข้อด้วยการรันซ้ำ | 294 วินาที | $0.91 |

ยังไม่ได้ทดสอบ playbook ที่ต้องมี git remote เช่น การเปิด PR, การเฝ้า CI และ autopilot

## ที่มา

- ชุด skill ดัดแปลงจาก [`pstack`](https://github.com/cursor/plugins/tree/main/pstack) ของ Lauren Tan
  เวอร์ชัน 0.15.28 (`cursor/plugins` ที่ `d457567`)
- งานพอร์ตไป OMP, `pstack-omp`, `fable-deslop` และตัวช่วยตั้งค่าโมเดลของ `setup-pstack` มาจาก
  [`dsebban/skills`](https://github.com/dsebban/skills) ที่ `12c3f3f`
- `orchestrate-omp` เริ่มจาก [`orchestrate`](https://github.com/provencher/codex-skills/tree/main/orchestrate)
  ของ Eric Provencher

ประกาศลิขสิทธิ์ของ upstream อยู่ใน [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)

## License

MIT ดู [`LICENSE`](LICENSE)
