/**
 * Text of the "How FRL assesses" page, in both languages. The Thai is the
 * wording supplied for this page; the English is a translation of it.
 */

export type Dimension = {
  code: string;
  name: string;
  tagline: string;
  intro: string;
  relatedTitle: string;
  related: string[];
  note: string;
};

export type Content = {
  navTitle: string;
  toc: { id: string; label: string }[];
  intro: {
    eyebrow: string;
    title: string;
    paragraphs: [string, string, string];
    cta: string;
  };
  dimensions: { id: string; title: string; lead: string; items: Dimension[] };
  trust: {
    id: string;
    title: string;
    lead: string;
    chain: string[];
    sourcesTitle: string;
    sourcesLead: string;
    weightLabel: string;
    tiers: { name: string; thai: string; body: string; weight: string; level: 1 | 2 | 3 }[];
    reviewNote: string;
  };
  transparency: {
    id: string;
    title: string;
    lead: string;
    notWant: string;
    want: string;
    questions: string[];
    closing: string;
  };
  credibility: {
    id: string;
    title: string;
    lead: string;
    sourceName: string;
    sourceBody: string;
    claimName: string;
    claimBody: string;
    examplesTitle: string;
    examples: { a: string; b: string }[];
    checkTitle: string;
    checks: string[];
    checkNote: string;
  };
  claimChain: {
    id: string;
    title: string;
    lead: string;
    steps: { label: string; example: string }[];
    unverified: string;
    closing: string;
  };
  corroboration: {
    id: string;
    title: string;
    lead: string;
    tenSites: string;
    oneOrigin: string;
    notConfirm: string;
    mayBeOne: string;
    heavier: string;
    heavierName: string;
    heavierBody: string;
  };
  track: {
    id: string;
    title: string;
    lead: string;
    items: string[];
    note: string;
  };
  confidence: {
    id: string;
    title: string;
    lead: string;
    lowScore: string;
    notEnough: string;
    meaning: string;
    notThis: string;
    badResult: string;
    principle: string;
  };
  judge: {
    id: string;
    title: string;
    lead: string;
    body: string;
    decisions: string[];
    closing: string;
  };
  warning: { title: string; lines: string[] };
};

export const TH: Content = {
  navTitle: "การประเมินของ FRL",
  toc: [
    { id: "what", label: "FRL Score คืออะไร?" },
    { id: "dimensions", label: "เราประเมินจากอะไร?" },
    { id: "trust", label: "ข้อมูลน่าเชื่อถือได้อย่างไร?" },
    { id: "transparency", label: "แหล่งข้อมูลที่ใช้จริง" },
    { id: "credibility", label: "ความน่าเชื่อถือของแหล่งข้อมูล" },
    { id: "claim-chain", label: "ข้อมูลหนึ่งชิ้น ≠ ความจริง" },
    { id: "corroboration", label: "หลายแหล่ง ≠ เชื่อถือขึ้น" },
    { id: "track", label: "Track Record" },
    { id: "confidence", label: "Data Confidence" },
    { id: "judge", label: "FRL ไม่ใช่ผู้ตัดสิน" },
  ],
  intro: {
    eyebrow: "FRL Reputation Assessment",
    title: "FRL Score คืออะไร?",
    paragraphs: [
      "FRL ไม่ได้บอกว่าใคร “ดี” หรือ “ไม่ดี” และไม่ได้รับรองว่าบริษัทใดน่าเชื่อถือ 100%",
      "FRL เป็นการประเมินจากข้อมูลและหลักฐานที่มีอยู่ ณ เวลาที่ประเมิน เพื่อช่วยให้ผู้ใช้อ่านภาพรวมของ Reputation ได้ง่ายขึ้น",
      "การประเมินของ FRL ไม่ควรใช้เป็นเกณฑ์เดียวในการตัดสินใจทางธุรกิจ การให้เครดิต หรือการทำธุรกรรมใด ๆ",
    ],
    cta: "เริ่มอ่าน",
  },
  dimensions: {
    id: "dimensions",
    title: "เราประเมินจากอะไร?",
    lead: "FRL แบ่งการประเมิน Reputation ออกเป็น 4 ด้านหลัก",
    items: [
      {
        code: "01",
        name: "Reliability",
        tagline: "ความน่าเชื่อถือในการปฏิบัติตามสิ่งที่ตกลง",
        intro: "ประเมินว่าบริษัทมีพฤติกรรมที่สะท้อนถึงการรักษาคำมั่นและภาระผูกพันทางธุรกิจอย่างสม่ำเสมอหรือไม่",
        relatedTitle: "ข้อมูลที่เกี่ยวข้องอาจรวมถึง:",
        related: [
          "ประวัติการชำระเงิน",
          "การปฏิบัติตามข้อตกลง",
          "ประวัติการดำเนินธุรกิจกับคู่ค้า",
          "ข้อมูลหรือหลักฐานเกี่ยวกับการผิดนัดหรือข้อพิพาท",
          "คำยืนยันจากคู่ค้าที่เกี่ยวข้อง",
        ],
        note: "Reliability ไม่ได้หมายความว่าบริษัทจะไม่ผิดพลาดในอนาคต แต่สะท้อนพฤติกรรมที่สามารถตรวจสอบได้จากข้อมูลที่มีอยู่",
      },
      {
        code: "02",
        name: "Stability",
        tagline: "ความมั่นคงของธุรกิจ",
        intro: "ประเมินว่าธุรกิจมีความต่อเนื่องและมีเสถียรภาพเพียงใดจากข้อมูลที่เปิดเผยและตรวจสอบได้",
        relatedTitle: "ข้อมูลที่เกี่ยวข้องอาจรวมถึง:",
        related: [
          "อายุของกิจการ",
          "ประวัติการดำเนินธุรกิจ",
          "ข้อมูลทางธุรกิจที่เปิดเผยต่อสาธารณะ",
          "ประวัติการเปลี่ยนแปลงหรือเหตุการณ์สำคัญ",
          "ข้อมูลทางการที่เกี่ยวข้อง",
        ],
        note: "Stability ไม่ได้หมายความว่าธุรกิจจะไม่มีความเสี่ยง แต่ช่วยแสดงให้เห็นบริบทและความต่อเนื่องของธุรกิจ",
      },
      {
        code: "03",
        name: "Resilience",
        tagline: "ความสามารถในการรับมือและฟื้นตัวจากปัญหา",
        intro: "ประเมินว่าธุรกิจสามารถรับมือกับเหตุการณ์หรือปัญหาที่เกิดขึ้น และกลับมาดำเนินธุรกิจได้อย่างไร",
        relatedTitle: "ข้อมูลที่เกี่ยวข้องอาจรวมถึง:",
        related: [
          "ประวัติเหตุการณ์สำคัญ",
          "การแก้ไขปัญหาหรือข้อพิพาท",
          "ผลลัพธ์หลังเกิดเหตุการณ์",
          "การเปลี่ยนแปลงหรือการแก้ไขที่บริษัทดำเนินการ",
          "หลักฐานที่แสดงถึงการฟื้นตัวหรือการปรับปรุง",
        ],
        note: "การมีปัญหาในอดีตไม่ได้หมายความว่าธุรกิจนั้นไม่มีความน่าเชื่อถือในปัจจุบัน เพราะต้องพิจารณาด้วยว่าปัญหาถูกแก้ไขอย่างไรและเกิดขึ้นเมื่อใด",
      },
      {
        code: "04",
        name: "Leverage",
        tagline: "ภาระและแรงกดดันทางการเงิน",
        intro: "ประเมินบริบทของภาระทางการเงินและแรงกดดันที่อาจเกี่ยวข้องกับความสามารถในการดำเนินธุรกิจ",
        relatedTitle: "ข้อมูลที่เกี่ยวข้องอาจรวมถึง:",
        related: [
          "ภาระหนี้หรือภาระผูกพันที่เปิดเผย",
          "ข้อมูลทางการเงินที่เปิดเผยต่อสาธารณะ",
          "เหตุการณ์ทางการเงินที่มีการรายงาน",
          "ข้อมูลเกี่ยวกับภาระหรือข้อผูกพันที่เกี่ยวข้อง",
        ],
        note: "Leverage ไม่ได้หมายความว่า “หนี้มาก = ไม่ดี” โดยอัตโนมัติ เพราะระดับหนี้ต้องพิจารณาร่วมกับบริบทของธุรกิจ ขนาดกิจการ และข้อมูลอื่นที่มีอยู่",
      },
    ],
  },
  trust: {
    id: "trust",
    title: "แล้ว FRL รู้ได้อย่างไรว่าข้อมูลเหล่านี้น่าเชื่อถือ?",
    lead: "FRL ไม่ได้มองเพียงว่า “มีข้อมูลหรือไม่” เราพิจารณาด้วยว่า:",
    chain: ["ใครเป็นผู้ให้ข้อมูล", "ข้อมูลมาจากไหน", "มีหลักฐานหรือไม่", "มีแหล่งอื่นยืนยันหรือไม่", "ข้อมูลใหม่แค่ไหน"],
    sourcesTitle: "แหล่งข้อมูลของ FRL",
    sourcesLead: "FRL ใช้ข้อมูลจากแหล่งที่เปิดเผยต่อสาธารณะและข้อมูลที่มีหลักฐานรองรับ รวมถึงข้อมูลจากหลายระดับของหลักฐาน",
    weightLabel: "น้ำหนักของข้อมูล",
    tiers: [
      {
        name: "Official",
        thai: "ข้อมูลทางการ",
        body: "ข้อมูลจากเอกสารหรือแหล่งข้อมูลที่มีสถานะเป็นทางการ เช่น ข้อมูลทะเบียน ข้อมูลภาครัฐ เอกสารทางการ และข้อมูลสาธารณะที่ตรวจสอบย้อนกลับได้",
        weight: "สูง",
        level: 3,
      },
      {
        name: "Counterparty Attested",
        thai: "คำยืนยันจากคู่ค้า",
        body: "ข้อมูลที่มาจากคู่ค้าหรือผู้ที่มีประสบการณ์โดยตรงกับธุรกิจ เช่น การยืนยันเรื่องการชำระเงินหรือการปฏิบัติตามข้อตกลง",
        weight: "กลาง",
        level: 2,
      },
      {
        name: "Public Review",
        thai: "ข้อมูลจากสาธารณะ",
        body: "ข้อมูลจากความคิดเห็นหรือประสบการณ์ของบุคคลทั่วไป ข้อมูลประเภทนี้สามารถช่วยสะท้อนประสบการณ์ของผู้ใช้งานจริง แต่มีความเสี่ยงด้านความถูกต้องและบริบทมากกว่า จึงควรแยกออกจากหลักฐานทางการอย่างชัดเจน",
        weight: "ต่ำกว่า",
        level: 1,
      },
    ],
    reviewNote: "FRL ไม่ควรนำ Review เพียงรายการเดียวมาตัดสิน Reputation ของบริษัททั้งหมด",
  },
  transparency: {
    id: "transparency",
    title: "แหล่งข่าวจริงที่ FRL ใช้",
    lead: "FRL จะเปิดเผยแหล่งข้อมูลที่นำมาใช้จริง เพื่อให้ผู้ใช้สามารถตรวจสอบต้นทางได้",
    notWant: "เราไม่ต้องการให้ผู้ใช้เพียง “เชื่อ FRL”",
    want: "เราต้องการให้ผู้ใช้สามารถถามได้ว่า:",
    questions: ["ข้อมูลนี้มาจากไหน?", "ใครเป็นคนรายงาน?", "ต้นทางของข้อมูลคืออะไร?", "มีหลักฐานอะไรสนับสนุน?", "มีแหล่งอื่นยืนยันหรือไม่?"],
    closing: "ดังนั้นข้อมูลที่นำมาใช้จะมีการระบุแหล่งที่มาและสามารถย้อนกลับไปยังต้นทางได้เมื่อสามารถทำได้",
  },
  credibility: {
    id: "credibility",
    title: "FRL ประเมินความน่าเชื่อถือของแหล่งข้อมูลอย่างไร?",
    lead: "การเป็นแหล่งข่าวหรือเว็บไซต์ที่มีชื่อเสียงไม่ได้หมายความว่าข้อมูลทุกชิ้นจากแหล่งนั้นเป็นความจริง 100% FRL จึงแยกสองสิ่งออกจากกัน:",
    sourceName: "Source Credibility",
    sourceBody: "แหล่งข้อมูลนี้มีความน่าเชื่อถือเพียงใด",
    claimName: "Claim Credibility",
    claimBody: "ข้อกล่าวอ้างหรือข้อมูลชิ้นนี้มีหลักฐานสนับสนุนมากเพียงใด",
    examplesTitle: "ตัวอย่าง:",
    examples: [
      { a: "แหล่งข่าวมีชื่อเสียง", b: "ไม่ได้แปลว่า ทุกข้อกล่าวอ้างในบทความเป็นข้อเท็จจริงที่ยืนยันแล้ว" },
      { a: "แหล่งข่าวไม่เป็นที่รู้จัก", b: "ก็ไม่ได้แปลว่า ข้อมูลนั้นเป็นเท็จโดยอัตโนมัติ" },
    ],
    checkTitle: "สิ่งที่ FRL ตรวจสอบเกี่ยวกับ Source",
    checks: [
      "ผู้เผยแพร่เป็นใคร",
      "มีตัวตนและความรับผิดชอบต่อข้อมูลหรือไม่",
      "มีประวัติการเผยแพร่ข้อมูลหรือไม่",
      "มีการระบุแหล่งอ้างอิงหรือไม่",
      "สามารถตรวจสอบย้อนกลับได้หรือไม่",
      "มีแหล่งข้อมูลอิสระสนับสนุนหรือไม่",
      "มีผลประโยชน์ที่อาจเกี่ยวข้องกับข้อมูลหรือไม่",
      "มีประวัติการแก้ไขหรือถอนข้อมูลเมื่อพบข้อผิดพลาดหรือไม่",
    ],
    checkNote: "การไม่พบประวัติการถูกดิสเครดิต ไม่ได้หมายความว่าแหล่งนั้นน่าเชื่อถือโดยอัตโนมัติ",
  },
  claimChain: {
    id: "claim-chain",
    title: "ข้อมูลหนึ่งชิ้น ≠ ความจริงทั้งหมด",
    lead: "FRL แยก Claim → Source → Evidence → Verification ออกจากกัน ตัวอย่าง:",
    steps: [
      { label: "Claim", example: "“บริษัท X มีปัญหาการชำระเงิน”" },
      { label: "Source", example: "ข่าวจาก Source A" },
      { label: "Evidence", example: "เอกสาร / บันทึก / หลักฐาน (หากข่าวอ้างอิงเอกสาร)" },
      { label: "Verification", example: "Not independently verified" },
    ],
    unverified: "หากยังไม่มีการยืนยันอิสระ จะแสดงว่า Not independently verified",
    closing: "FRL จะไม่เปลี่ยนข้อกล่าวอ้างให้กลายเป็น “ข้อเท็จจริง” เพียงเพราะมีการเผยแพร่ข่าว",
  },
  corroboration: {
    id: "corroboration",
    title: "ข้อมูลหลายแหล่งไม่ได้หมายความว่าเชื่อถือมากขึ้นเสมอไป",
    lead: "ถ้าข่าว 10 เว็บไซต์อ้างข้อมูลมาจากข่าวต้นฉบับเดียวกัน FRL จะต้องระวังไม่ให้สิ่งนี้ถูกตีความว่าเป็น:",
    tenSites: "10 เว็บไซต์",
    oneOrigin: "ต้นทางเดียว",
    notConfirm: "“10 แหล่งยืนยันตรงกัน”",
    mayBeOne: "เพราะอาจมีต้นทางเพียงแห่งเดียว",
    heavier: "สิ่งที่มีน้ำหนักมากกว่าคือ:",
    heavierName: "Independent Corroboration",
    heavierBody: "หรือการยืนยันจากแหล่งที่เป็นอิสระต่อกัน",
  },
  track: {
    id: "track",
    title: "Track Record",
    lead: "นอกจาก 4 ด้านหลัก FRL ยังพิจารณาบริบทของประวัติข้อมูล ข้อมูลควรถูกมองตาม:",
    items: ["ระยะเวลา", "ความต่อเนื่อง", "เหตุการณ์ในอดีต", "การเปลี่ยนแปลงหลังเกิดปัญหา", "ข้อมูลที่หมดอายุหรือไม่เกี่ยวข้องกับสถานการณ์ปัจจุบัน"],
    note: "ข้อมูลเก่าไม่ควรถูกนำมาใช้เหมือนกับข้อมูลล่าสุดโดยไม่มีบริบท",
  },
  confidence: {
    id: "confidence",
    title: "Data Confidence",
    lead: "FRL ต้องแยกสองสิ่งนี้ออกจากกัน:",
    lowScore: "“บริษัทมีคะแนนต่ำ”",
    notEnough: "“เรามีข้อมูลไม่เพียงพอ”",
    meaning: "การไม่มีข้อมูลเพียงพอไม่ได้หมายความว่าบริษัทมีความเสี่ยงสูง สถานะ Insufficient Data หมายถึง: FRL ยังมีข้อมูลไม่เพียงพอที่จะประเมินด้านนั้นอย่างมีความหมาย",
    notThis: "ไม่ใช่:",
    badResult: "บริษัทมีผลการประเมินที่แย่",
    principle: "หลักการนี้เป็นหนึ่งในหลักการหลักของ FRL",
  },
  judge: {
    id: "judge",
    title: "FRL ไม่ใช่ผู้ตัดสิน",
    lead: "FRL ทำหน้าที่เป็น Evidence Provider ไม่ใช่ Judge",
    body: "เรานำข้อมูล แหล่งที่มา หลักฐาน และบริบทมาเรียบเรียงให้ตรวจสอบได้ การตัดสินใจว่าจะ:",
    decisions: ["ทำธุรกิจด้วยหรือไม่", "ให้เครดิตหรือไม่", "รับคู่ค้าหรือไม่", "ลงทุนหรือไม่"],
    closing: "ยังคงเป็นการตัดสินใจของผู้ใช้งาน FRL ไม่ได้อนุมัติหรือปฏิเสธบริษัทแทนผู้ใช้",
  },
  warning: {
    title: "โปรดอ่านก่อนใช้ข้อมูลจาก FRL",
    lines: [
      "FRL Reputation Assessment เป็นเพียงการประเมินจากข้อมูลที่มีอยู่ในระบบ ณ เวลาที่ประเมิน",
      "ข้อมูลอาจไม่ครบ อาจมีข้อจำกัด หรืออาจเปลี่ยนแปลงได้ในภายหลัง",
      "Score ไม่ใช่ข้อเท็จจริง 100% และไม่ใช่การรับรองความน่าเชื่อถือของบริษัท",
      "โปรดใช้ข้อมูลจาก FRL ร่วมกับการตรวจสอบข้อมูลเพิ่มเติมและการพิจารณาจากแหล่งอื่นก่อนตัดสินใจ",
      "ไม่มี Score ใดสามารถรับรองผลลัพธ์ของธุรกิจในอนาคตได้",
    ],
  },
};

export const EN: Content = {
  navTitle: "How FRL assesses",
  toc: [
    { id: "what", label: "What is the FRL Score?" },
    { id: "dimensions", label: "What do we assess?" },
    { id: "trust", label: "How is data trusted?" },
    { id: "transparency", label: "Sources actually used" },
    { id: "credibility", label: "Source credibility" },
    { id: "claim-chain", label: "One item ≠ the whole truth" },
    { id: "corroboration", label: "Many sources ≠ more trust" },
    { id: "track", label: "Track Record" },
    { id: "confidence", label: "Data Confidence" },
    { id: "judge", label: "FRL is not a judge" },
  ],
  intro: {
    eyebrow: "FRL Reputation Assessment",
    title: "What is the FRL Score?",
    paragraphs: [
      "FRL does not say who is “good” or “bad”, and does not guarantee that any company is 100% trustworthy.",
      "FRL is an assessment based on the data and evidence available at the time of assessment, to help users read the overall picture of a reputation more easily.",
      "An FRL assessment should not be the only criterion for any business decision, extending credit, or any transaction.",
    ],
    cta: "Start reading",
  },
  dimensions: {
    id: "dimensions",
    title: "What do we assess?",
    lead: "FRL divides a reputation assessment into 4 main dimensions.",
    items: [
      {
        code: "01",
        name: "Reliability",
        tagline: "Dependability in doing what was agreed",
        intro: "Assesses whether the company shows behaviour that reflects consistently keeping its commitments and business obligations.",
        relatedTitle: "Related information may include:",
        related: [
          "Payment history",
          "Compliance with agreements",
          "History of doing business with counterparties",
          "Information or evidence about defaults or disputes",
          "Confirmation from relevant counterparties",
        ],
        note: "Reliability does not mean the company will never make mistakes in future. It reflects behaviour that can be checked from the information available.",
      },
      {
        code: "02",
        name: "Stability",
        tagline: "Stability of the business",
        intro: "Assesses how continuous and stable the business is, from information that is disclosed and can be verified.",
        relatedTitle: "Related information may include:",
        related: [
          "Age of the business",
          "Operating history",
          "Publicly disclosed business information",
          "History of changes or significant events",
          "Relevant official information",
        ],
        note: "Stability does not mean a business carries no risk. It helps show the context and continuity of the business.",
      },
      {
        code: "03",
        name: "Resilience",
        tagline: "Ability to cope with and recover from problems",
        intro: "Assesses how the business has coped with events or problems that occurred, and how it returned to operating.",
        relatedTitle: "Related information may include:",
        related: [
          "History of significant events",
          "How problems or disputes were resolved",
          "Outcomes after the event",
          "Changes or corrections the company made",
          "Evidence of recovery or improvement",
        ],
        note: "Having had problems in the past does not mean a business is untrustworthy today. How the problem was resolved, and when it happened, must be considered too.",
      },
      {
        code: "04",
        name: "Leverage",
        tagline: "Financial burden and pressure",
        intro: "Assesses the context of financial burdens and pressures that may relate to the business's ability to operate.",
        relatedTitle: "Related information may include:",
        related: [
          "Disclosed debts or obligations",
          "Publicly disclosed financial information",
          "Reported financial events",
          "Information about related burdens or commitments",
        ],
        note: "Leverage does not automatically mean “more debt = bad”. Debt must be read together with the nature of the business, its size and other available information.",
      },
    ],
  },
  trust: {
    id: "trust",
    title: "So how does FRL know this information can be trusted?",
    lead: "FRL does not look only at “is there data”. We also consider:",
    chain: ["Who provided it", "Where it came from", "Is there evidence", "Is it confirmed elsewhere", "How recent is it"],
    sourcesTitle: "FRL's sources",
    sourcesLead: "FRL uses publicly disclosed information and information backed by evidence, across several levels of evidence.",
    weightLabel: "Weight of the information",
    tiers: [
      {
        name: "Official",
        thai: "Official information",
        body: "Information from documents or sources with official status, such as registry data, government data, official documents and public information that can be traced back.",
        weight: "High",
        level: 3,
      },
      {
        name: "Counterparty Attested",
        thai: "Confirmed by a counterparty",
        body: "Information from a counterparty or someone with direct experience of the business, such as confirmation about payments or keeping agreements.",
        weight: "Medium",
        level: 2,
      },
      {
        name: "Public Review",
        thai: "Public information",
        body: "Information from the opinions or experiences of ordinary people. It can reflect the experience of real users, but carries more risk in accuracy and context, so it should be kept clearly apart from official evidence.",
        weight: "Lower",
        level: 1,
      },
    ],
    reviewNote: "FRL should not use a single review to judge a company's whole reputation.",
  },
  transparency: {
    id: "transparency",
    title: "The real sources FRL uses",
    lead: "FRL discloses the sources it actually uses, so that users can check the origin.",
    notWant: "We do not want users to simply “believe FRL”.",
    want: "We want users to be able to ask:",
    questions: ["Where does this information come from?", "Who reported it?", "What is the origin of the information?", "What evidence supports it?", "Is it confirmed elsewhere?"],
    closing: "So the information used will state its source and can be traced back to its origin wherever that is possible.",
  },
  credibility: {
    id: "credibility",
    title: "How does FRL assess the credibility of a source?",
    lead: "Being a well-known news outlet or website does not mean everything it publishes is 100% true. FRL therefore separates two things:",
    sourceName: "Source Credibility",
    sourceBody: "How credible is this source?",
    claimName: "Claim Credibility",
    claimBody: "How much evidence supports this claim or piece of information?",
    examplesTitle: "Examples:",
    examples: [
      { a: "A well-known news source", b: "does not mean every claim in an article is a confirmed fact" },
      { a: "An unknown news source", b: "does not mean the information is automatically false" },
    ],
    checkTitle: "What FRL checks about a Source",
    checks: [
      "Who the publisher is",
      "Whether it has an identity and accountability for the information",
      "Whether it has a publishing record",
      "Whether references are cited",
      "Whether it can be traced back",
      "Whether independent sources support it",
      "Whether there are interests that may relate to the information",
      "Whether it has a record of correcting or withdrawing information when errors are found",
    ],
    checkNote: "Finding no record of discredit does not automatically mean the source is trustworthy.",
  },
  claimChain: {
    id: "claim-chain",
    title: "One item of information ≠ the whole truth",
    lead: "FRL keeps Claim → Source → Evidence → Verification separate. Example:",
    steps: [
      { label: "Claim", example: "“Company X has payment problems”" },
      { label: "Source", example: "A news report from Source A" },
      { label: "Evidence", example: "Documents / records / proof (if the report cites documents)" },
      { label: "Verification", example: "Not independently verified" },
    ],
    unverified: "Until there is independent confirmation, it is shown as Not independently verified.",
    closing: "FRL will not turn a claim into a “fact” just because a news report was published.",
  },
  corroboration: {
    id: "corroboration",
    title: "Many sources do not always mean more trust",
    lead: "If 10 websites cite the same original news report, FRL must take care that this is not read as:",
    tenSites: "10 websites",
    oneOrigin: "one origin",
    notConfirm: "“10 sources confirm the same thing”",
    mayBeOne: "because there may be only one origin.",
    heavier: "What carries more weight is:",
    heavierName: "Independent Corroboration",
    heavierBody: "confirmation from sources that are independent of one another.",
  },
  track: {
    id: "track",
    title: "Track Record",
    lead: "Beyond the 4 main dimensions, FRL also considers the context of the record. Information should be viewed by:",
    items: ["Duration", "Continuity", "Past events", "Changes after a problem", "Information that has expired or no longer relates to the current situation"],
    note: "Old information should not be used in the same way as recent information without context.",
  },
  confidence: {
    id: "confidence",
    title: "Data Confidence",
    lead: "FRL must keep these two apart:",
    lowScore: "“The company has a low score”",
    notEnough: "“We do not have enough data”",
    meaning: "Not having enough data does not mean the company is high risk. The Insufficient Data status means: FRL does not yet have enough information to assess that dimension in a meaningful way.",
    notThis: "It does not mean:",
    badResult: "the company has a poor assessment result",
    principle: "This principle is one of FRL's core principles.",
  },
  judge: {
    id: "judge",
    title: "FRL is not a judge",
    lead: "FRL acts as an Evidence Provider, not a Judge.",
    body: "We bring together information, sources, evidence and context so they can be checked. Deciding whether to:",
    decisions: ["do business with a company", "extend credit", "accept a counterparty", "invest"],
    closing: "remains the user's decision. FRL does not approve or reject a company on the user's behalf.",
  },
  warning: {
    title: "Please read before using FRL information",
    lines: [
      "FRL Reputation Assessment is only an assessment from the information in the system at the time of assessment.",
      "The information may be incomplete, may have limitations, or may change later.",
      "A Score is not 100% fact and is not a guarantee of a company's trustworthiness.",
      "Please use FRL information together with additional checks and other sources before deciding.",
      "No Score can guarantee a business's future results.",
    ],
  },
};
