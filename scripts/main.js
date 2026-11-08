/**
 * Impeccable Intelligence Consulting — Main Interactions
 * Scroll reveal, progress indicator, header scroll state, smooth interactions
 */

(() => {
  'use strict';

  /* ============================================================
     Scroll Progress Indicator
     ============================================================ */

  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progressBar);

  function updateScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    progressBar.style.transform = `scaleX(${progress})`;
  }

  /* ============================================================
     Header Scroll State
     ============================================================ */

  const header = document.querySelector('.header');
  let lastScrollY = 0;
  let ticking = false;

  function updateHeader() {
    const scrollY = window.scrollY;
    if (scrollY > 20) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    lastScrollY = scrollY;
    ticking = false;
  }

  function onScroll() {
    updateScrollProgress();
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }

  /* ============================================================
     Intersection Observer — Reveal Animations
     ============================================================ */

  const revealElements = document.querySelectorAll('[data-reveal]');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${index * 80}ms`;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ============================================================
     Smooth Scroll for Anchor Links
     ============================================================ */

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        target.focus({ preventScroll: true });
      }
    });
  });

  /* ============================================================
     Button Ripple Effect
     ============================================================ */

  function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();

    ripple.style.cssText = `
      position: absolute;
      width: ${Math.max(rect.width, rect.height)}px;
      height: ${Math.max(rect.width, rect.height)}px;
      left: ${event.clientX - rect.left - Math.max(rect.width, rect.height) / 2}px;
      top: ${event.clientY - rect.top - Math.max(rect.width, rect.height) / 2}px;
      background: currentColor;
      opacity: 0.15;
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 400ms ease-out forwards;
      pointer-events: none;
    `;

    if (!document.querySelector('#ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = `
        @keyframes ripple {
          to { transform: scale(2.5); opacity: 0; }
        }
        .btn { position: relative; overflow: hidden; }
      `;
      document.head.appendChild(style);
    }

    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  document.querySelectorAll('.btn--primary, .btn--light').forEach(btn => {
    btn.addEventListener('click', createRipple);
  });

  /* ============================================================
     Parallax Hero Visual (subtle)
     ============================================================ */

  const heroVisual = document.querySelector('.hero__visual');
  let heroTicking = false;

  function updateHeroParallax() {
    if (!heroVisual) { heroTicking = false; return; }
    const scrollY = window.scrollY;
    const heroRect = heroVisual.getBoundingClientRect();
    const heroCenter = heroRect.top + heroRect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const distance = (heroCenter - viewportCenter) * 0.08;
    heroVisual.style.transform = `translateY(${distance}px)`;
    heroTicking = false;
  }

  function onHeroScroll() {
    if (!heroTicking) {
      window.requestAnimationFrame(updateHeroParallax);
      heroTicking = true;
    }
  }

  /* ============================================================
     Initialize
     ============================================================ */

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onHeroScroll, { passive: true });

  updateScrollProgress();
  updateHeader();

  /* ============================================================
     Keyboard Navigation Enhancement
     ============================================================ */

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });

  /* ============================================================
     Respect Reduced Motion
     ============================================================ */

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReduced.matches) {
    document.body.classList.add('reduced-motion');
    if (heroVisual) heroVisual.style.transform = 'none';
  }

  prefersReduced.addEventListener('change', (e) => {
    if (e.matches) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  });

})();