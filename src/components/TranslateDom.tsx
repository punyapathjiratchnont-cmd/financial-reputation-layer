'use client';

import { useEffect } from 'react';
import { translateTh, useLanguage } from '@/lib/i18n';

/**
 * Safety net for Thai mode. Renders nothing.
 *
 * Most interface text goes through the dictionary directly (the <Tr> component
 * and t()). Some text still reaches the page as plain data: labels held in
 * arrays, demo records, placeholders. This component translates any text node
 * or attribute whose whole text matches a dictionary entry, so nothing is left
 * in English in Thai mode. Switching back to English restores the original text.
 *
 * Hydration safety: nothing is touched until React has attached to the element
 * that holds it, otherwise React would report the edit as a server/client
 * mismatch.
 */

const ATTRS = ['placeholder', 'title', 'aria-label'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE']);

const isHydrated = (el: Element) => Object.keys(el).some((k) => k.startsWith('__reactFiber$'));

// text with a number or name inside, written once as a rule
const RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Share my score \((\d+)\)$/, (m) => `แชร์คะแนนของฉัน (${m[1]})`],
  [/^(\d+) months$/, (m) => `${m[1]} เดือน`],
  [/^(\d+) years?$/, (m) => `${m[1]} ปี`],
  [/^(\d+) entered$/, (m) => `กรอกแล้ว ${m[1]}`],
  [/^(\d+) of (\d+)$/, (m) => `${m[1]} จาก ${m[2]}`],
  [/^Expires: (.+)$/, (m) => `หมดอายุ: ${m[1]}`],
  [/^Created: (.+)$/, (m) => `สร้างเมื่อ: ${m[1]}`],
  [/^Revoked on: (.+)$/, (m) => `เพิกถอนเมื่อ: ${m[1]}`],
  [/^Logged in as (.+)$/, (m) => `เข้าสู่ระบบในนาม ${m[1]}`],
  [/^Results for “(.+)”$/, (m) => `ผลการค้นหาสำหรับ “${m[1]}”`],
];

function translate(raw: string): string | null {
  const key = raw.split(/\s+/).filter(Boolean).join(' ');
  if (!key || !/[A-Za-z]{2,}/.test(key)) return null;
  let th = translateTh(key);
  if (!th) {
    for (const [re, fn] of RULES) {
      const m = key.match(re);
      if (m) {
        th = fn(m);
        break;
      }
    }
  }
  return th ?? null;
}

export function TranslateDom() {
  const { language } = useLanguage();

  useEffect(() => {
    const originalText = new WeakMap<Text, string>();
    const originalAttr = new WeakMap<Element, Record<string, string>>();
    const touchedText = new Set<Text>();
    const touchedEls = new Set<Element>();
    let raf = 0;
    let busy = false;

    const applyText = (node: Text) => {
      const parent = node.parentElement;
      if (!parent || SKIP.has(parent.tagName) || !isHydrated(parent)) return;
      const value = node.nodeValue ?? '';
      const th = translate(value);
      if (th === null) return;
      if (!originalText.has(node)) originalText.set(node, value);
      const lead = value.slice(0, value.length - value.trimStart().length);
      const trail = value.slice(value.trimEnd().length);
      node.nodeValue = lead + th + trail;
      touchedText.add(node);
    };

    const applyAttrs = (el: Element) => {
      if (!isHydrated(el)) return;
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (!v) continue;
        const th = translate(v);
        if (th === null) continue;
        const saved = originalAttr.get(el) ?? {};
        if (!(a in saved)) saved[a] = v;
        originalAttr.set(el, saved);
        el.setAttribute(a, th);
        touchedEls.add(el);
      }
    };

    const scan = () => {
      raf = 0;
      busy = true;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walker.nextNode())) applyText(n as Text);
      document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(applyAttrs);
      mo.takeRecords();
      busy = false;
    };
    const schedule = () => {
      if (busy || raf) return;
      raf = window.requestAnimationFrame(scan);
    };

    const mo = new MutationObserver(schedule);

    let retries = 0;
    let retryTimer = 0;
    if (language === 'th') {
      scan();
      // React hydrates progressively; keep looking for a few seconds so late parts are covered too
      retryTimer = window.setInterval(() => {
        scan();
        if (++retries >= 12) window.clearInterval(retryTimer);
      }, 500);
      mo.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRS,
      });
    }

    return () => {
      mo.disconnect();
      window.clearInterval(retryTimer);
      if (raf) window.cancelAnimationFrame(raf);
      // back to English: put every changed text and attribute back
      touchedText.forEach((t) => {
        const o = originalText.get(t);
        if (o !== undefined && t.isConnected) t.nodeValue = o;
      });
      touchedEls.forEach((el) => {
        const saved = originalAttr.get(el);
        if (saved && el.isConnected) Object.entries(saved).forEach(([a, v]) => el.setAttribute(a, v));
      });
    };
  }, [language]);

  return null;
}
