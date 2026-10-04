'use client';

import { useEffect } from 'react';

/**
 * Page-level motion wiring. Renders nothing.
 *
 *  - Every element carrying `data-fx` gets `data-in="true"` once it scrolls
 *    into view (one-shot). The CSS in globals.css decides what that looks like.
 *    Elements added to the page later (route changes, hot reload) are picked up
 *    too, so nothing can be left hidden because it arrived after mount.
 *  - Elements with the `frl-spot` class get --mx / --my set from the pointer, so
 *    a soft light follows the cursor across the card.
 *
 * Both are presentation only. With reduced motion the CSS simply shows
 * everything without movement.
 *
 * Hydration safety: an attribute written onto server-rendered markup before
 * React has hydrated it makes React report a mismatch. So an element is only
 * revealed once React has attached to it (it carries a __reactFiber key); until
 * then the reveal is retried shortly.
 */
const isHydrated = (el: Element) => Object.keys(el).some((k) => k.startsWith('__reactFiber$'));

export function ScrollFx() {
  useEffect(() => {
    const timers = new Set<number>();

    const reveal = (el: HTMLElement, tries = 0) => {
      if (isHydrated(el) || tries > 100) {
        el.dataset.in = 'true';
        return;
      }
      const id = window.setTimeout(() => {
        timers.delete(id);
        reveal(el, tries + 1);
      }, 100);
      timers.add(id);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        });
      },
      // A small threshold so very tall elements still count as "seen".
      { threshold: 0.05, rootMargin: '0px 0px -4% 0px' },
    );

    const watch = (el: HTMLElement) => {
      if (el.dataset.in !== 'true') io.observe(el);
    };
    const scan = (root: ParentNode) => {
      if (root instanceof HTMLElement && root.hasAttribute('data-fx')) watch(root);
      root.querySelectorAll<HTMLElement>('[data-fx]').forEach(watch);
    };

    scan(document);

    const mo = new MutationObserver((records) => {
      records.forEach((r) =>
        r.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) scan(n);
        }),
      );
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const onMove = (ev: PointerEvent) => {
      const el = (ev.target as HTMLElement | null)?.closest<HTMLElement>('.frl-spot');
      if (!el || !isHydrated(el)) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${ev.clientX - r.left}px`);
      el.style.setProperty('--my', `${ev.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      document.removeEventListener('pointermove', onMove);
    };
  }, []);

  return null;
}
