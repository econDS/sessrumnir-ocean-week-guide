# Sessrumnir Ocean Week — คู่มือย้อนหลัง

คู่มือ NPC, /navi และขั้นตอนของกิจกรรมรอบ **6 พฤษภาคม – 4 มิถุนายน 2569 ก่อนปิดปรับปรุงเซิร์ฟเวอร์** ซึ่งสิ้นสุดแล้ว ข้อมูลของรอบเดิมอาจไม่ตรงกับกิจกรรมที่กลับมาในอนาคต

เว็บ: https://econds.github.io/sessrumnir-ocean-week-guide/

- Publishing source: `master` / `docs/` โดย URL ไม่มี `/docs/`
- หน้าและรูปภาพอยู่ใน `docs/index.html` และ `docs/assets/`
- แถบร่วม `ro-suite-nav 1.3.0` โหลดจากไฟล์ใน `docs/assets/ro-suite/1.3.0/` พร้อมลิงก์สำรองกลับ Portal
- คำสั่ง `/navi`, ข้อมูลเควส และภาพยังเป็นข้อมูลรอบเดิม การตรวจ navigation หรือทบทวน metadata ไม่ใช่การยืนยันข้อมูลเกมใหม่

## ตรวจสอบ

`node --test tests/*.test.cjs`

PR workflow ทดสอบ Chromium เทียบ base commit และเก็บรายงาน/ภาพเป็น artifacts ดูรายละเอียดใน `qa/archive-status/REPORT.md`
