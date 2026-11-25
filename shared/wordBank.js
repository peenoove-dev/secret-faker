// คลังคำศัพท์สองภาษา (th / en) — ใช้บนเซิร์ฟเวอร์เพื่อสุ่มคำลับ
// ผู้เล่นแต่ละคนจะเห็นคำตามภาษาที่ตัวเองเลือกในเว็บ
// อยากเพิ่มคำ: เติมคำในรูปแบบ 'ไทย|English' ลงในหมวดนั้นได้เลย
// (ทุกหมวดควรมีอย่างน้อย 8 คำ เพราะตัวปลอมจะได้ตัวเลือกคำใบ้จากหมวดนี้)

const make = (th, en, list) => ({
  category: { th, en },
  words: list.map((s) => {
    const [t, e] = s.split('|')
    return { th: t.trim(), en: e.trim() }
  }),
})

export const WORD_BANK = [
  make('สถานที่', 'Places', [
    'โรงพยาบาล|Hospital', 'โรงเรียน|School', 'สนามบิน|Airport', 'ชายหาด|Beach', 'ห้องสมุด|Library',
    'โรงหนัง|Cinema', 'ตลาดน้ำ|Floating Market', 'วัด|Temple', 'ห้างสรรพสินค้า|Shopping Mall', 'สวนสัตว์|Zoo',
    'สวนสนุก|Amusement Park', 'สถานีตำรวจ|Police Station', 'สถานีรถไฟ|Train Station', 'ฟิตเนส|Gym', 'ร้านกาแฟ|Coffee Shop',
    'ธนาคาร|Bank', 'ไปรษณีย์|Post Office', 'พิพิธภัณฑ์|Museum', 'สนามกีฬา|Stadium', 'โรงแรม|Hotel',
    'ร้านสะดวกซื้อ|Convenience Store', 'ปั๊มน้ำมัน|Gas Station', 'สถานีดับเพลิง|Fire Station', 'ฟาร์ม|Farm', 'ภูเขา|Mountain',
    'น้ำตก|Waterfall', 'ถ้ำ|Cave', 'เกาะ|Island', 'ทะเลทราย|Desert', 'ป่าฝน|Rainforest',
    'ตลาดนัด|Night Market', 'ร้านตัดผม|Barbershop', 'ร้านขายยา|Pharmacy', 'ซูเปอร์มาร์เก็ต|Supermarket', 'สวนสาธารณะ|Public Park',
    'สระว่ายน้ำ|Swimming Pool', 'ผับ|Nightclub', 'โบสถ์|Church', 'มหาวิทยาลัย|University', 'ท่าเรือ|Harbor',
    'อู่ซ่อมรถ|Garage', 'โรงงาน|Factory', 'ศาล|Courthouse', 'สนามเด็กเล่น|Playground', 'ค่ายทหาร|Army Camp',
  ]),
  make('อาชีพ', 'Jobs', [
    'พ่อครัว|Chef', 'นักบิน|Pilot', 'หมอ|Doctor', 'ชาวนา|Farmer', 'ครู|Teacher',
    'ตำรวจ|Police Officer', 'นักดับเพลิง|Firefighter', 'ช่างตัดผม|Barber', 'พยาบาล|Nurse', 'ทนายความ|Lawyer',
    'วิศวกร|Engineer', 'โปรแกรมเมอร์|Programmer', 'นักบัญชี|Accountant', 'ช่างไฟฟ้า|Electrician', 'ช่างประปา|Plumber',
    'คนขับแท็กซี่|Taxi Driver', 'ไรเดอร์ส่งอาหาร|Delivery Rider', 'ช่างภาพ|Photographer', 'นักข่าว|Reporter', 'นักร้อง|Singer',
    'นักแสดง|Actor', 'จิตรกร|Painter', 'นักวิทยาศาสตร์|Scientist', 'ทันตแพทย์|Dentist', 'สัตวแพทย์|Veterinarian',
    'เภสัชกร|Pharmacist', 'ทหาร|Soldier', 'แอร์โฮสเตส|Flight Attendant', 'พนักงานธนาคาร|Bank Teller', 'แคชเชียร์|Cashier',
    'เจ้าหน้าที่รักษาความปลอดภัย|Security Guard', 'นักฟุตบอล|Football Player', 'โค้ชฟิตเนส|Personal Trainer', 'ช่างตัดเสื้อ|Tailor', 'นักดนตรี|Musician',
    'ชาวประมง|Fisherman', 'ช่างไม้|Carpenter', 'บาริสต้า|Barista', 'นักออกแบบ|Designer', 'หัวหน้าห้องครัว|Head Cook',
    'พนักงานเสิร์ฟ|Waiter', 'นักสืบ|Detective', 'ผู้พิพากษา|Judge', 'นักบินอวกาศ|Astronaut', 'ยูทูบเบอร์|YouTuber',
  ]),
  make('สัตว์', 'Animals', [
    'สิงโต|Lion', 'ช้าง|Elephant', 'เพนกวิน|Penguin', 'โลมา|Dolphin', 'งู|Snake', 'ลิง|Monkey', 'จระเข้|Crocodile', 'แมว|Cat',
    'สุนัข|Dog', 'ม้า|Horse', 'เสือ|Tiger', 'ยีราฟ|Giraffe', 'จิงโจ้|Kangaroo', 'หมี|Bear', 'นกฮูก|Owl', 'ฉลาม|Shark',
    'ผีเสื้อ|Butterfly', 'กระต่าย|Rabbit', 'เต่า|Turtle', 'ค้างคาว|Bat', 'แพนด้า|Panda', 'ปลาหมึก|Octopus', 'ไก่|Chicken', 'วัว|Cow',
  ]),
  make('อาหาร', 'Food', [
    'พิซซ่า|Pizza', 'ซูชิ|Sushi', 'ต้มยำกุ้ง|Tom Yum Goong', 'ไอศกรีม|Ice Cream', 'ผัดไทย|Pad Thai',
    'ข้าวเหนียวมะม่วง|Mango Sticky Rice', 'ส้มตำ|Papaya Salad', 'แพนเค้ก|Pancake', 'แฮมเบอร์เกอร์|Hamburger', 'สเต็ก|Steak',
    'ราเมน|Ramen', 'ข้าวมันไก่|Chicken Rice', 'ก๋วยเตี๋ยว|Noodle Soup', 'ไก่ทอด|Fried Chicken', 'ข้าวผัด|Fried Rice',
    'ชานมไข่มุก|Bubble Tea', 'โดนัท|Donut', 'ช็อกโกแลต|Chocolate', 'สปาเก็ตตี้|Spaghetti', 'หมูกระทะ|Thai BBQ',
    'ไข่เจียว|Omelette', 'ขนมปังปิ้ง|Toast', 'เฟรนช์ฟรายส์|French Fries', 'แกงเขียวหวาน|Green Curry',
  ]),
  make('ของใช้', 'Objects', [
    'ร่ม|Umbrella', 'โทรศัพท์|Phone', 'จักรยาน|Bicycle', 'กระจก|Mirror', 'นาฬิกา|Clock', 'กระเป๋าเป้|Backpack', 'พัดลม|Fan', 'แว่นตา|Glasses',
    'กุญแจ|Key', 'เก้าอี้|Chair', 'หมอน|Pillow', 'ตู้เย็น|Refrigerator', 'แปรงสีฟัน|Toothbrush', 'กรรไกร|Scissors', 'ไฟฉาย|Flashlight', 'หูฟัง|Headphones',
    'โคมไฟ|Lamp', 'ผ้าห่ม|Blanket', 'กล้องถ่ายรูป|Camera', 'ไม้กวาด|Broom', 'กระทะ|Frying Pan', 'รองเท้า|Shoes', 'หมวก|Hat', 'กระเป๋าสตางค์|Wallet',
  ]),
  make('กีฬา', 'Sports', [
    'ฟุตบอล|Football', 'บาสเกตบอล|Basketball', 'มวยไทย|Muay Thai', 'แบดมินตัน|Badminton', 'ว่ายน้ำ|Swimming', 'เทนนิส|Tennis',
    'วอลเลย์บอล|Volleyball', 'ตะกร้อ|Sepak Takraw', 'กอล์ฟ|Golf', 'ปิงปอง|Table Tennis', 'วิ่งมาราธอน|Marathon', 'โยคะ|Yoga',
    'ปั่นจักรยาน|Cycling', 'สเก็ตบอร์ด|Skateboarding', 'ยิมนาสติก|Gymnastics', 'ยิงธนู|Archery',
  ]),
  make('ยานพาหนะ', 'Vehicles', [
    'เครื่องบิน|Airplane', 'รถไฟ|Train', 'เรือ|Ship', 'มอเตอร์ไซค์|Motorcycle', 'รถบัส|Bus', 'ตุ๊กตุ๊ก|Tuk-tuk',
    'เฮลิคอปเตอร์|Helicopter', 'รถพยาบาล|Ambulance', 'รถดับเพลิง|Fire Truck', 'จรวด|Rocket', 'เรือดำน้ำ|Submarine', 'รถบรรทุก|Truck',
    'รถไฟฟ้า|Sky Train', 'เรือหางยาว|Longtail Boat', 'บอลลูน|Hot Air Balloon', 'สกู๊ตเตอร์|Scooter',
  ]),
  make('ผลไม้', 'Fruits', [
    'มะม่วง|Mango', 'ทุเรียน|Durian', 'แตงโม|Watermelon', 'กล้วย|Banana', 'ส้ม|Orange', 'สตรอว์เบอร์รี|Strawberry',
    'องุ่น|Grape', 'สับปะรด|Pineapple', 'มังคุด|Mangosteen', 'เงาะ|Rambutan', 'แอปเปิล|Apple', 'มะพร้าว|Coconut',
    'ลิ้นจี่|Lychee', 'ลำไย|Longan', 'ฝรั่ง|Guava', 'ชมพู่|Rose Apple',
  ]),
  make('ประเทศ', 'Countries', [
    'ไทย|Thailand', 'ญี่ปุ่น|Japan', 'เกาหลีใต้|South Korea', 'จีน|China', 'อินเดีย|India', 'สหรัฐอเมริกา|United States',
    'อังกฤษ|England', 'ฝรั่งเศส|France', 'อิตาลี|Italy', 'ออสเตรเลีย|Australia', 'บราซิล|Brazil', 'อียิปต์|Egypt',
    'เยอรมนี|Germany', 'รัสเซีย|Russia', 'สิงคโปร์|Singapore', 'เวียดนาม|Vietnam', 'สวิตเซอร์แลนด์|Switzerland', 'แคนาดา|Canada',
  ]),
]
