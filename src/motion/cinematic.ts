import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis: Lenis | null = null;
let ctx: gsap.Context | null = null;
let initialized = false;

function splitWords(element: HTMLElement) {
  if (element.dataset.motionSplit === 'true') return;
  const text = element.textContent || '';
  const parts = text.split(/(\s+)/);
  element.textContent = '';
  element.setAttribute('aria-label', text.trim());
  parts.forEach((part) => {
    if (!part.trim()) {
      element.appendChild(document.createTextNode(part));
      return;
    }
    const mask = document.createElement('span');
    const word = document.createElement('span');
    mask.className = 'motion-word-mask';
    mask.setAttribute('aria-hidden', 'true');
    word.className = 'motion-word';
    word.textContent = part;
    mask.appendChild(word);
    element.appendChild(mask);
  });
  element.dataset.motionSplit = 'true';
}

function initTextReveals(scope: Element | Document) {
  if (reduceMotion) {
    gsap.set(scope.querySelectorAll('[data-motion-text]'), {
      autoAlpha: 1,
      clearProps: 'all',
    });
    return;
  }
  gsap.utils.toArray<HTMLElement>(scope.querySelectorAll('[data-motion-text="words"]')).forEach((el) => {
    if (el.dataset.motionDone === 'true') return;
    splitWords(el);
    const words = el.querySelectorAll('.motion-word');
    gsap.set(el, { autoAlpha: 1 });
    gsap.fromTo(
      words,
      { yPercent: 110, autoAlpha: 0, filter: 'blur(6px)' },
      {
        yPercent: 0,
        autoAlpha: 1,
        filter: 'blur(0px)',
        duration: 0.85,
        ease: 'power4.out',
        stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        onComplete: () => {
          el.dataset.motionDone = 'true';
        },
      },
    );
  });
}

function initScrollReveals(scope: Element | Document) {
  if (reduceMotion) {
    gsap.set(scope.querySelectorAll('[data-reveal]'), {
      autoAlpha: 1,
      clearProps: 'all',
    });
    return;
  }
  // Staggered groups: children with [data-reveal-item] enter in reading order
  gsap.utils.toArray<HTMLElement>(scope.querySelectorAll('[data-reveal-group]')).forEach((group) => {
    if (group.dataset.motionDone === 'true') return;
    const items = group.querySelectorAll('[data-reveal-item]');
    if (!items.length) return;
    gsap.set(group, { autoAlpha: 1 });
    gsap.fromTo(
      items,
      { y: 28, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.07,
        scrollTrigger: { trigger: group, start: 'top 84%', once: true },
        onComplete: () => {
          group.dataset.motionDone = 'true';
        },
      },
    );
  });
  // Standalone reveals (skip items already handled inside groups)
  gsap.utils.toArray<HTMLElement>(scope.querySelectorAll('[data-reveal]:not([data-reveal-item])')).forEach((el) => {
    if (el.dataset.motionDone === 'true') return;
    if (el.closest('[data-reveal-group]')) return;
    gsap.set(el, { autoAlpha: 1 });
    gsap.fromTo(
      el,
      { y: 30, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: 'power4.out',
        delay: Number(el.dataset.revealDelay || 0),
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        onComplete: () => {
          el.dataset.motionDone = 'true';
        },
      },
    );
  });
}

function initParallax() {
  if (reduceMotion) return;
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((layer) => {
    const speed = Number(layer.dataset.parallax || 0.12);
    const section = layer.closest('[data-parallax-section]') || layer;
    gsap.to(layer, {
      y: () => window.innerHeight * speed * -1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    });
  });
}

/** Initialize Lenis + all scroll choreography. Idempotent — safe to call
 *  from both the entry point (which may run before React commits) and a
 *  mounted effect (when DOM is guaranteed present). */
export function initCinematic() {
  if (typeof window === 'undefined') return () => {};
  document.documentElement.classList.add('has-motion');
  const firstRun = !initialized;
  initialized = true;
  gsap.defaults({ ease: 'power3.out', duration: 0.85 });

  if (!reduceMotion && !lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scan = () => {
    initTextReveals(document);
    initScrollReveals(document);
    if (firstRun) initParallax();
  };
  try {
    if (firstRun || !ctx) {
      ctx = gsap.context(scan);
    } else {
      // Late call (e.g. entry rAF won the race pre-commit): rescan for nodes
      // rendered afterwards. Per-node done-flags keep this duplicate-safe.
      ctx.add(scan);
    }
  } catch (error) {
    // Never leave content hidden: reveal everything if choreography fails.
    // eslint-disable-next-line no-console
    console.error('[cinematic] init failed, revealing content', error);
    document.documentElement.classList.remove('has-motion');
  }
  (window as unknown as { __cinematic?: object }).__cinematic = {
    textNodes: document.querySelectorAll('[data-motion-text]').length,
    splitNodes: document.querySelectorAll('[data-motion-split]').length,
    revealNodes: document.querySelectorAll('[data-reveal]').length,
    triggers: ScrollTrigger.getAll().length,
    reduced: reduceMotion,
  };
  ScrollTrigger.refresh();
  return destroyCinematic;
}

/** Re-scan newly rendered content (e.g. after analysis runs). */
export function refreshCinematic(scope: Element = document.body) {
  if (typeof window === 'undefined' || !ctx) return;
  ctx.add(() => {
    initTextReveals(scope);
    initScrollReveals(scope);
  });
  ScrollTrigger.refresh();
}

export function destroyCinematic() {
  initialized = false;
  ctx?.revert();
  ctx = null;
  lenis?.destroy();
  lenis = null;
  document.documentElement.classList.remove('has-motion');
}
