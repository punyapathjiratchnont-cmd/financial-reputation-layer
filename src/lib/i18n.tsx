'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { TH_UI } from './th-ui';

export type Language = 'en' | 'th';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    'nav.backToSearch': 'Back to Search',
    'nav.home': 'Home',
    'nav.principles': 'Principles & Tiers',
    'nav.findCompany': 'Find a Company',
    'nav.forOwners': 'For Owners',

    // Home Page
    'home.badge': 'System Specification Demo',
    'home.title': 'Financial Reputation Layer',
    'home.subtitle': 'Proof of trust, without the single score. A verifiable reputation protocol that separates your data into distinct, meaningful axes. Own your claims.',
    'home.searchBtn': 'Search Companies',
    'home.ownerBtn': 'Owner Portal',
    'home.corePrinciples': 'Core Principles',
    'home.coreSub': 'Built on fundamental constraints that protect identity and prevent arbitrary scoring.',

    // Principles Page
    'principles.title': 'Principles & Evidence Tiers',
    'principles.badge': 'Financial Reputation Layer Core Architecture',
    'principles.subtitle': 'FRL is built on strict systemic guarantees designed to preserve financial privacy, prevent subjective credit bias, and deliver verifiable evidence for counterparties.',
    'principles.p1_title': 'No Single Score',
    'principles.p1_sub': 'ไม่มีคะแนนรวม แยกเป็นหลายแกน',
    'principles.p1_desc': 'FRL refuses to calculate, combine, or display a single overall score, total rating, or final grade. Business reputation is multi-dimensional and split into 6 independent axes: Reliability, Stability, Resilience, Leverage, Track Record, and Data Confidence.',

    'principles.p2_title': 'Selective Disclosure',
    'principles.p2_sub': 'เลือกเปิดเผยเฉพาะ Claim ไม่ส่งมอบข้อมูลดิบ',
    'principles.p2_desc': 'Verification Links expose only allowed Claim assertions (True / False) and Evidence Tiers. Raw transaction data, bank balances, and internal metrics are never exposed to counterparties or third parties.',

    'principles.p3_title': 'Insufficient Data ≠ Bad',
    'principles.p3_sub': 'แยกสถานะข้อมูลไม่พอออกจากผลประเมินแย่',
    'principles.p3_desc': 'Absence of evidence is never treated as negative performance. Insufficient data is presented as a neutral static state—never as 0%, red risk bars, or "bad credit". Missing data implies nothing about quality.',

    'principles.p4_title': 'System as Evidence-Provider',
    'principles.p4_sub': 'ระบบเป็นผู้ส่งมอบหลักฐาน ไม่ใช่ผู้พิพากษา',
    'principles.p4_desc': 'FRL does not render credit verdicts, assign risk ratings, or make loan decisions. The system acts strictly as an objective evidence infrastructure; counterparties evaluate the evidence themselves.',

    'principles.p5_title': 'Decay & Right to Restart',
    'principles.p5_sub': 'ข้อมูลมีอายุ Expire/Decay และสิทธิ์ในการเริ่มต้นใหม่',
    'principles.p5_desc': 'All claims and public feedback carry strict expiration dates. Expired records automatically decay and are removed from active verification views, allowing businesses the right to rebuild financial reputation over time.',

    // Matrix
    'matrix.title': 'Evidence Tiers Matrix',
    'matrix.subtitle': 'Hierarchical evidence categorization & weight distribution',
    'matrix.col_tier': 'Tier',
    'matrix.col_source': 'Source (ที่มา)',
    'matrix.col_weight': 'Weight (น้ำหนัก)',
    'matrix.col_method': 'Verification Method',
    'matrix.official_source': 'Official government filings, audited tax records, or bank filings',
    'matrix.official_weight': 'Highest Weight (สูงสุด)',
    'matrix.counterparty_source': 'Dual-signed attestations from known business partners',
    'matrix.counterparty_weight': 'Strong Weight (ปานกลาง)',
    'matrix.public_source': 'Crowdsourced public user feedback',
    'matrix.public_weight': 'Lowest Weight (ต่ำสุด — ห้ามนำไปคำนวณสินเชื่อ)',

    // Profile Page
    'profile.axes_title': 'Reputation Axes',
    'profile.what_are_tiers': 'What are evidence tiers?',
    'profile.insufficient_badge': 'Insufficient Data',
    'profile.insufficient_desc': 'Not enough evidence has been provided to establish a record for this axis. This does not indicate poor performance.',
    'profile.request_attestation': 'Request Counterparty Attestation',
    'profile.verified_active': 'Verified Active',
    'profile.expires': 'Expires:',
    'profile.reviews_title': 'Public Reviews Channel',
    'profile.reviews_desc': 'Qualitative user feedback channel. Strictly isolated from financial reputation axes (P1 & P4).',
    'profile.view_reviews': 'View Public Reviews →',

    // Reviews Page
    'reviews.back_to_profile': '← Back to Company Profile',
    'reviews.channel_title': 'Public Review Channel',
    'reviews.owner_mode': 'Viewing as Company Owner (Active)',
    'reviews.guest_mode': 'Owner Login / Respond Mode',
    'reviews.subtitle': 'Public feedback channel and qualitative user submissions.',
    'reviews.warning_title': 'FRL Isolation Protocol (Rule P1 & P4 Specification)',
    'reviews.warning_desc': 'Public reviews are qualitative feedback carrying the lowest evidence tier weight (public_review). Reviews are strictly isolated from all financial reputation axes (Reliability, Stability, Resilience, Leverage, Track Record, Data Confidence). Reviews are never aggregated into scores or financial claim verifications.',
    'reviews.form_title': 'Submit a Public Review',
    'reviews.author_label': 'Your Name / Organization (Optional)',
    'reviews.author_placeholder': 'e.g. Vendor B or Anonymous User',
    'reviews.content_label': 'Review Content *',
    'reviews.content_placeholder': 'Write your feedback regarding business interaction...',
    'reviews.decay_note': 'Reviews automatically expire in 1 year per P5 Decay rules.',
    'reviews.submit': 'Submit Public Review',
    'reviews.submitting': 'Submitting...',
    'reviews.list_title': 'Public Reviews',
    'reviews.empty_title': 'No public reviews yet',
    'reviews.empty_desc': 'Public reviews provide qualitative context and do not impact company reputation axes or financial claim evaluations.',
    'reviews.respond_btn': 'Respond to Review (Owner)',
    'reviews.respond_title': 'Respond as Company Owner',
    'reviews.respond_placeholder': 'Write official response or clarification...',
    'reviews.post_response': 'Post Owner Response',
    'reviews.posting': 'Posting...',
    'reviews.cancel': 'Cancel',
    'reviews.owner_only': 'Only company owner can respond to reviews.',
    'reviews.verified_owner': 'Verified Owner',

    // Common
    'common.search': 'Search Company',
    'common.founded': 'Founded',
    'common.reg': 'Reg:',
  },
  th: {
    // Navbar
    'nav.backToSearch': 'กลับหน้าค้นหา',
    'nav.home': 'หน้าแรก',
    'nav.principles': 'หลักการและระดับหลักฐาน',
    'nav.findCompany': 'ค้นหาบริษัท',
    'nav.forOwners': 'สำหรับเจ้าของธุรกิจ',

    // Home Page
    'home.badge': 'การสาธิตระบบ System Specification',
    'home.title': 'Financial Reputation Layer',
    'home.subtitle': 'ข้อพิสูจน์ความน่าเชื่อถือ โดยไม่มีคะแนนรวม โปรโตคอลชื่อเสียงทางการเงินที่แยกข้อมูลของคุณออกเป็นแกนที่มีความหมายและตรวจสอบได้',
    'home.searchBtn': 'ค้นหาบริษัท',
    'home.ownerBtn': 'พอร์ทัลเจ้าของธุรกิจ',
    'home.corePrinciples': 'หลักการสำคัญ (Core Principles)',
    'home.coreSub': 'สร้างขึ้นบนข้อจำกัดทางสถาปัตยกรรมที่ปกป้องข้อมูลและป้องกันการประเมินคะแนนแบบสุ่ม',

    // Principles Page
    'principles.title': 'หลักการและระดับหลักฐาน (Principles & Evidence Tiers)',
    'principles.badge': 'สถาปัตยกรรมหลักของ Financial Reputation Layer',
    'principles.subtitle': 'FRL สร้างขึ้นบนหลักการความปลอดภัยเข้มงวด เพื่อปกป้องความเป็นส่วนตัวทางการเงิน ป้องกันอคติในการประเมินสินเชื่อ และส่งมอบหลักฐานที่พิสูจน์ได้แก่คู่สัญญา',
    'principles.p1_title': 'No Single Score',
    'principles.p1_sub': 'ไม่มีคะแนนรวม แยกเป็นหลายแกน',
    'principles.p1_desc': 'FRL ปฏิเสธการคำนวณ รวมคะแนน หรือแสดงผลเป็นคะแนนรวม เกรด หรือความเสี่ยงรวมเพียงค่าเดียว ชื่อเสียงทางการเงินถูกแบ่งออกเป็น 6 แกนอิสระ: ความน่าเชื่อถือ (Reliability), เสถียรภาพ (Stability), ความยืดหยุ่น (Resilience), ภาระหนี้สิน (Leverage), ประวัติผลงาน (Track Record) และความเชื่อมั่นของข้อมูล (Data Confidence)',

    'principles.p2_title': 'Selective Disclosure',
    'principles.p2_sub': 'เลือกเปิดเผยเฉพาะ Claim ไม่ส่งมอบข้อมูลดิบ',
    'principles.p2_desc': 'Verification Links จะแสดงเฉพาะข้อความยืนยันสถานะ (True / False) และระดับหลักฐาน (Evidence Tier) เท่านั้น ข้อมูลการทำธุรกรรมดิบ ยอดเงินในบัญชี หรือตัวเลขภายในจะไม่ถูกเปิดเผยต่อคู่สัญญาหรือบุคคลภายนอก',

    'principles.p3_title': 'Insufficient Data ≠ Bad',
    'principles.p3_sub': 'แยกสถานะข้อมูลไม่พอออกจากผลประเมินแย่',
    'principles.p3_desc': 'การไม่มีหลักฐานไม่เคยถูกปฏิบัติเหมือนเป็นผลการดำเนินงานที่ไม่ดี ข้อมูลไม่พอ (Insufficient Data) จะแสดงเป็นสถานะกลางๆ นิ่งๆ ไม่เคยแสดงเป็น 0%, แถบสีแดง หรือคำว่า "ความเสี่ยงสูง" การขาดข้อมูลไม่สื่อถึงคุณภาพที่ไม่ดี',

    'principles.p4_title': 'System as Evidence-Provider',
    'principles.p4_sub': 'ระบบเป็นผู้ส่งมอบหลักฐาน ไม่ใช่ผู้พิพากษา',
    'principles.p4_desc': 'FRL ไม่ทำหน้าที่ตัดสินสินเชื่อ ให้เกรดความเสี่ยง หรืออนุมัติวงเงิน ระบบทำหน้าที่เป็นโครงสร้างพื้นฐานส่งมอบหลักฐานที่เป็นกลาง คู่สัญญาจะเป็นผู้ประเมินหลักฐานด้วยตนเอง',

    'principles.p5_title': 'Decay & Right to Restart',
    'principles.p5_sub': 'ข้อมูลมีวันหมดอายุ เพื่อสิทธิ์ในการเริ่มต้นใหม่',
    'principles.p5_desc': 'ทุก Claim และรีวิวสาธารณะจะมีวันหมดอายุที่ชัดเจน ข้อมูลที่หมดอายุจะสลายตัว (Decay) ออกจากการแสดงผลหลักโดยอัตโนมัติ ช่วยให้ธุรกิจมีสิทธิ์สร้างชื่อเสียงทางการเงินใหม่เมื่อเวลาผ่านไป',

    // Matrix
    'matrix.title': 'ตารางระดับหลักฐาน (Evidence Tiers Matrix)',
    'matrix.subtitle': 'การจัดลำดับชั้นหลักฐานและกระจายน้ำหนักความน่าเชื่อถือ',
    'matrix.col_tier': 'ระดับหลักฐาน (Tier)',
    'matrix.col_source': 'ที่มา (Source)',
    'matrix.col_weight': 'น้ำหนัก (Weight)',
    'matrix.col_method': 'วิธีการตรวจสอบ',
    'matrix.official_source': 'ข้อมูลงบการเงินทางการ, e-Tax invoices, รายการภาษี หรือคดีความจากภาครัฐ',
    'matrix.official_weight': 'น้ำหนักสูงสุด (Highest Weight)',
    'matrix.counterparty_source': 'ข้อความยืนยันร่วมสองฝ่ายจากคู่ค้า, ผู้ผลิต, หรือผู้ให้เช่าจริง',
    'matrix.counterparty_weight': 'น้ำหนักปานกลาง (Strong Weight)',
    'matrix.public_source': 'ข้อคิดเห็นและรีวิวจากผู้ใช้ทั่วไปในสาธารณะ',
    'matrix.public_weight': 'น้ำหนักต่ำสุด (ไม่ใช้คำนวณสินเชื่อ)',

    // Profile Page
    'profile.axes_title': 'แกนชื่อเสียงทางการเงิน (Reputation Axes)',
    'profile.what_are_tiers': 'ระดับหลักฐานคืออะไร?',
    'profile.insufficient_badge': 'ข้อมูลไม่พอ (Insufficient Data)',
    'profile.insufficient_desc': 'ยังไม่มีหลักฐานเพียงพอสำหรับแกนนี้ สถานะนี้ไม่ได้หมายความว่าบริษัทมีผลการดำเนินงานที่ไม่ดี',
    'profile.request_attestation': 'ส่งคำขอให้คู่ค้ายืนยัน (Request Attestation)',
    'profile.verified_active': 'Verified Active (ยืนยันแล้ว)',
    'profile.expires': 'หมดอายุ:',
    'profile.reviews_title': 'ช่องทางรีวิวสาธารณะ (Public Reviews Channel)',
    'profile.reviews_desc': 'ช่องทางแสดงความคิดเห็นจากผู้ใช้ทั่วไป ถูกแยกออกจากแกนชื่อเสียงทางการเงินโดยสิ้นเชิง (ตามกฎ P1 & P4)',
    'profile.view_reviews': 'ดูรีวิวสาธารณะทั้งหมด →',

    // Reviews Page
    'reviews.back_to_profile': '← กลับหน้าโปรไฟล์บริษัท',
    'reviews.channel_title': 'ช่องทางรีวิวสาธารณะ (Public Review Channel)',
    'reviews.owner_mode': 'กำลังมองในมุมมองเจ้าของบริษัท (Active)',
    'reviews.guest_mode': 'โหมดเจ้าของบริษัท / ตอบกลับรีวิว',
    'reviews.subtitle': 'ช่องทางรับฟังความคิดเห็นเชิงคุณภาพจากสาธารณชน',
    'reviews.warning_title': 'ข้อกำหนดการแยกข้อมูล FRL Isolation Protocol (Rule P1 & P4)',
    'reviews.warning_desc': 'รีวิวสาธารณะเป็นความคิดเห็นเชิงคุณภาพที่มีน้ำหนักระดับต่ำสุด (public_review) รีวิวถูกแยกออกจากแกนความน่าเชื่อถือทางการเงินทั้งหมดโดยสิ้นเชิง (Reliability, Stability, Resilience, Leverage, Track Record, Data Confidence) และจะไม่ถูกนำไปคำนวณรวมเป็นคะแนนเด็ดขาด',
    'reviews.form_title': 'เขียนรีวิวสาธารณะ',
    'reviews.author_label': 'ชื่อของคุณ / องค์กร (ระบุหรือไม่ก็ได้)',
    'reviews.author_placeholder': 'เช่น คู่ค้า B หรือ ผู้ใช้งานทั่วไป',
    'reviews.content_label': 'ข้อความรีวิว *',
    'reviews.content_placeholder': 'พิมพ์ข้อคิดเห็นหรือประสบการณ์การติดต่อทางธุรกิจ...',
    'reviews.decay_note': 'รีวิวจะหมดอายุโดยอัตโนมัติภายใน 1 ปีตามกฎ P5 Decay',
    'reviews.submit': 'ส่งรีวิวสาธารณะ',
    'reviews.submitting': 'กำลังส่งข้อมูล...',
    'reviews.list_title': 'รายการรีวิวสาธารณะ',
    'reviews.empty_title': 'ยังไม่มีรีวิวสาธารณะ',
    'reviews.empty_desc': 'รีวิวสาธารณะให้ข้อมูลบริบทเชิงคุณภาพ และไม่มีผลกระทบต่อแกนชื่อเสียงทางการเงินหรือการประเมิน Claim ของบริษัท',
    'reviews.respond_btn': 'ตอบกลับรีวิว (สำหรับเจ้าของบริษัท)',
    'reviews.respond_title': 'ตอบกลับในฐานะเจ้าของบริษัท',
    'reviews.respond_placeholder': 'พิมพ์ข้อความตอบกลับหรือชี้แจงอย่างเป็นทางการ...',
    'reviews.post_response': 'โพสต์ข้อความตอบกลับ',
    'reviews.posting': 'กำลังโพสต์...',
    'reviews.cancel': 'ยกเลิก',
    'reviews.owner_only': 'เฉพาะเจ้าของบริษัทเท่านั้นที่สามารถตอบกลับรีวิวได้',
    'reviews.verified_owner': 'เจ้าของบริษัท (Verified)',

    // Common
    'common.search': 'ค้นหาบริษัท',
    'common.founded': 'ก่อตั้งเมื่อ',
    'common.reg': 'เลขทะเบียน:',

    // Company profile (key is the English sentence; English falls back to the key)
    "Directory": "ไดเรกทอรี",
    "Search": "ค้นหา",
    "Search Companies": "ค้นหาบริษัท",
    "Public profile": "โปรไฟล์สาธารณะ",
    "Owner tools": "เครื่องมือเจ้าของ",
    "Sample data.": "ข้อมูลตัวอย่าง",
    "This is not a real company and the score is not a real reputation.": "นี่ไม่ใช่บริษัทจริง และคะแนนไม่ใช่ชื่อเสียงจริง",
    "Company Reputation Profile": "โปรไฟล์ชื่อเสียงบริษัท",
    "Score": "คะแนน",
    "About": "ข้อมูลบริษัท",
    "How it’s made": "คะแนนมาจากอะไร",
    "Proof": "หลักฐาน",
    "Problems": "ปัญหา",
    "Verified by FRL": "ยืนยันโดย FRL",
    "Not verified by FRL": "ยังไม่ได้รับการยืนยันโดย FRL",
    "Verification status not reported": "ไม่มีข้อมูลสถานะการยืนยัน",
    "Claimed profile": "เจ้าของรับรองโปรไฟล์แล้ว",
    "Public profile (unclaimed)": "โปรไฟล์สาธารณะ (ยังไม่มีเจ้าของรับรอง)",
    "Demo reputation score — not real": "คะแนนตัวอย่าง — ไม่ใช่ของจริง",
    "Reputation score": "คะแนนชื่อเสียง",
    "No score yet": "ยังไม่มีคะแนน",
    "Based on the records FRL holds about this company. A guide, not a guarantee.": "อิงจากข้อมูลที่ FRL มีเกี่ยวกับบริษัทนี้ ใช้เป็นแนวทาง ไม่ใช่การรับประกัน",
    "FRL does not have enough verified records to give this company a score yet.": "FRL ยังมีข้อมูลที่ยืนยันแล้วไม่พอที่จะให้คะแนนบริษัทนี้",
    "See how it’s made": "ดูว่าคะแนนมาจากอะไร",
    "Edit my company data": "แก้ไขข้อมูลบริษัทของฉัน",
    "About this company": "เกี่ยวกับบริษัทนี้",
    "Who they are and where the data comes from.": "บริษัทคือใคร และข้อมูลมาจากไหน",
    "Business type": "ประเภทธุรกิจ",
    "Country": "ประเทศ",
    "Founded": "ก่อตั้ง",
    "Registration no.": "เลขทะเบียน",
    "Country not reported": "ไม่มีข้อมูลประเทศ",
    "Not reported": "ไม่มีข้อมูล",
    "Company overview not available.": "ไม่มีคำอธิบายบริษัท",
    "Source:": "แหล่งที่มา:",
    "Retrieved:": "ดึงข้อมูลเมื่อ:",
    "How the score is made": "คะแนนนี้มาจากอะไร",
    "Four areas feed the score. Each is marked out of 1000.": "คะแนนมาจาก 4 ด้าน แต่ละด้านเต็ม 1000",
    "Payment Reliability": "ความน่าเชื่อถือด้านการชำระเงิน",
    "Business Reliability": "ความน่าเชื่อถือด้านธุรกิจ",
    "Financial Stability": "ความมั่นคงทางการเงิน",
    "Transaction History": "ประวัติธุรกรรม",
    "Not enough verified payment records.": "ยังมีบันทึกการชำระเงินที่ยืนยันแล้วไม่พอ",
    "Not enough verified business attestation data.": "ยังมีข้อมูลรับรองทางธุรกิจที่ยืนยันแล้วไม่พอ",
    "Financial stability metrics unavailable.": "ไม่มีตัวชี้วัดความมั่นคงทางการเงิน",
    "Transaction history data not submitted.": "ยังไม่มีข้อมูลประวัติธุรกรรม",
    "Not enough data": "ข้อมูลไม่พอ",
    "Insufficient Data": "ข้อมูลไม่พอ",
    "Strong": "แข็งแกร่ง",
    "Good": "ดี",
    "Stable": "คงที่",
    "Moderate": "ปานกลาง",
    "Public Source": "แหล่งสาธารณะ",
    "Company Provided": "บริษัทให้ข้อมูล",
    "Verified Record": "บันทึกที่ยืนยันแล้ว",
    "In short": "สรุปสั้นๆ",
    "Data status:": "สถานะข้อมูล:",
    "Data status not reported.": "ไม่มีข้อมูลสถานะ",
    "Strengths": "จุดแข็ง",
    "Things to consider": "ควรพิจารณา",
    "No specific strengths recorded.": "ไม่มีบันทึกจุดแข็ง",
    "No specific warnings recorded.": "ไม่มีบันทึกข้อควรระวัง",
    "Score trend over time (0 – 1000)": "แนวโน้มคะแนนตามเวลา (0 – 1000)",
    "No historical reputation data is available.": "ไม่มีข้อมูลคะแนนย้อนหลัง",
    "Records and events behind the reputation. Each one shows its source.": "ข้อมูลและเหตุการณ์เบื้องหลังชื่อเสียง แต่ละรายการระบุแหล่งที่มา",
    "Achievements & projects": "ผลงานและโครงการ",
    "Business relationships": "ความสัมพันธ์ทางธุรกิจ",
    "Reputation history": "ประวัติชื่อเสียง",
    "Source": "แหล่งที่มา",
    "No public achievements listed.": "ไม่มีผลงานสาธารณะ",
    "No public relationship records listed.": "ไม่มีข้อมูลความสัมพันธ์สาธารณะ",
    "No historical events recorded.": "ไม่มีบันทึกเหตุการณ์ในอดีต",
    "Known concerns and missing information.": "ข้อกังวลที่ทราบและข้อมูลที่ยังขาด",
    "No current issues.": "ไม่พบปัญหาในขณะนี้",
    "No verified issues have been identified from the available data.": "ไม่พบปัญหาที่ยืนยันได้จากข้อมูลที่มี",
    "Confirmed problems": "ปัญหาที่ยืนยันแล้ว",
    "Missing information": "ข้อมูลที่ยังขาด",
    "Automated analysis (interpretation, not fact)": "การวิเคราะห์อัตโนมัติ (การตีความ ไม่ใช่ข้อเท็จจริง)",
    "A registry record is not an FRL verification. Records marked as demo data are development samples and are never presented as verified companies.": "ข้อมูลจากทะเบียนไม่ใช่การยืนยันโดย FRL ข้อมูลที่ระบุว่าเป็นตัวอย่างใช้เพื่อการพัฒนาเท่านั้น และจะไม่ถูกแสดงเป็นบริษัทที่ยืนยันแล้ว",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('th'); // Default to Thai as requested

  useEffect(() => {
    const saved = localStorage.getItem('frl_lang') as Language;
    if (saved === 'en' || saved === 'th') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('frl_lang', lang);
    } catch {}
  };

  const t = (key: string, fallback?: string): string => {
    if (language === 'th') {
      // dictionary entries (English text as the key) win over older per-key text
      const ui = TH_UI[key] || (fallback ? TH_UI[fallback] : undefined);
      if (ui) return ui;
    }
    return (
      translations[language]?.[key] ||
      translations['en']?.[key] ||
      fallback ||
      key
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Thai text for an English string, from either dictionary, or undefined. */
export function translateTh(key: string): string | undefined {
  return TH_UI[key] || translations.th[key];
}

/** Renders interface text through the dictionary. The English text is the key. */
export function Tr({ s }: { s: string }) {
  const { t } = useLanguage();
  return <>{t(s)}</>;
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-full border border-white/15 bg-black/40 p-0.5 text-xs font-medium backdrop-blur-md">
      <button
        onClick={() => setLanguage('en')}
        className={`whitespace-nowrap px-2 sm:px-2.5 py-1 rounded-full transition-all ${
          language === 'en'
            ? 'bg-indigo-600 text-white font-bold shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('th')}
        className={`whitespace-nowrap px-2 sm:px-2.5 py-1 rounded-full transition-all ${
          language === 'th'
            ? 'bg-indigo-600 text-white font-bold shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        TH (ไทย)
      </button>
    </div>
  );
}
