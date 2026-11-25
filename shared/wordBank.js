// คลังคำศัพท์สองภาษา (th / en) — ใช้บนเซิร์ฟเวอร์เพื่อสุ่มคำลับ
// ผู้เล่นแต่ละคนจะเห็นคำตามภาษาที่ตัวเองเลือกในเว็บ
// อยากเพิ่มคำ: เติมบรรทัดใน `words` ของหมวดนั้นได้เลย

export const WORD_BANK = [
  {
    category: { th: 'สัตว์', en: 'Animals' },
    words: [
      { th: 'สิงโต', en: 'Lion' },
      { th: 'ช้าง', en: 'Elephant' },
      { th: 'เพนกวิน', en: 'Penguin' },
      { th: 'โลมา', en: 'Dolphin' },
      { th: 'งู', en: 'Snake' },
      { th: 'ลิง', en: 'Monkey' },
      { th: 'จระเข้', en: 'Crocodile' },
      { th: 'แมว', en: 'Cat' },
    ],
  },
  {
    category: { th: 'อาหาร', en: 'Food' },
    words: [
      { th: 'พิซซ่า', en: 'Pizza' },
      { th: 'ซูชิ', en: 'Sushi' },
      { th: 'ต้มยำกุ้ง', en: 'Tom Yum Goong' },
      { th: 'ไอศกรีม', en: 'Ice Cream' },
      { th: 'ผัดไทย', en: 'Pad Thai' },
      { th: 'ข้าวเหนียวมะม่วง', en: 'Mango Sticky Rice' },
      { th: 'ส้มตำ', en: 'Papaya Salad' },
      { th: 'แพนเค้ก', en: 'Pancake' },
    ],
  },
  {
    category: { th: 'สถานที่', en: 'Places' },
    words: [
      { th: 'โรงพยาบาล', en: 'Hospital' },
      { th: 'โรงเรียน', en: 'School' },
      { th: 'สนามบิน', en: 'Airport' },
      { th: 'ชายหาด', en: 'Beach' },
      { th: 'ห้องสมุด', en: 'Library' },
      { th: 'โรงหนัง', en: 'Cinema' },
      { th: 'ตลาดน้ำ', en: 'Floating Market' },
      { th: 'วัด', en: 'Temple' },
    ],
  },
  {
    category: { th: 'อาชีพ', en: 'Jobs' },
    words: [
      { th: 'พ่อครัว', en: 'Chef' },
      { th: 'นักบิน', en: 'Pilot' },
      { th: 'หมอ', en: 'Doctor' },
      { th: 'ชาวนา', en: 'Farmer' },
      { th: 'ครู', en: 'Teacher' },
      { th: 'ตำรวจ', en: 'Police Officer' },
      { th: 'นักดับเพลิง', en: 'Firefighter' },
      { th: 'ช่างตัดผม', en: 'Barber' },
    ],
  },
  {
    category: { th: 'ของใช้', en: 'Objects' },
    words: [
      { th: 'ร่ม', en: 'Umbrella' },
      { th: 'โทรศัพท์', en: 'Phone' },
      { th: 'จักรยาน', en: 'Bicycle' },
      { th: 'กระจก', en: 'Mirror' },
      { th: 'นาฬิกา', en: 'Clock' },
      { th: 'กระเป๋าเป้', en: 'Backpack' },
      { th: 'พัดลม', en: 'Fan' },
      { th: 'แว่นตา', en: 'Glasses' },
    ],
  },
]
