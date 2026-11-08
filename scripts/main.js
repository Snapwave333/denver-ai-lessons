/**
 * Impeccable Intelligence Consulting — Living Biomorphic Interactions
 * Cellular automata, filament growth, magnetic cursor, scroll choreography
 */

(() => {
  'use strict';

  /* ============================================================
     UTILITIES
     ============================================================ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     LIVING BACKGROUND — Cellular Automata & Filaments
     ============================================================ */

  class LivingBackground {
    constructor() {
      if (prefersReduced()) return;
      this.cellsCanvas = $('#cells-canvas');
      this.filamentsCanvas = $('#filaments-canvas');
      this.sporesCanvas = $('#spores-canvas');
      this.initCanvases();
      this.initCells();
      this.initFilaments();
      this.initSpores();
      this.animate();
      this.handleResize();
    }

    initCanvases() {
      [this.cellsCanvas, this.filamentsCanvas, this.sporesCanvas].forEach(c => {
        if (c) this.resizeCanvas(c);
      });
    }

    resizeCanvas(canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      canvas.getContext('2d').scale(dpr, dpr);
    }

    handleResize() {
      let t; window.addEventListener('resize', () => {
        clearTimeout(t); t = setTimeout(() => this.initCanvases(), 100);
      });
    }

    /* --- Cellular Automata (Conway-ish with organic rules) --- */
    initCells() {
      const ctx = this.cellsCanvas?.getContext('2d'); if (!ctx) return;
      const cols = Math.ceil(window.innerWidth / 8);
      const rows = Math.ceil(window.innerHeight / 8);
      this.cellGrid = new Uint8Array(cols * rows);
      this.nextGrid = new Uint8Array(cols * rows);
      this.cellCols = cols; this.cellRows = rows; this.cellSize = 8;

      // Seed with organic clusters
      for (let i = 0; i < cols * rows * 0.15; i++) {
        const x = randInt(0, cols - 1), y = randInt(0, rows - 1);
        if (Math.random() < 0.3) this.cellGrid[y * cols + x] = 1;
      }
    }

    stepCells() {
      const { cellGrid, nextGrid, cellCols, cellRows } = this;
      for (let y = 0; y < cellRows; y++) {
        for (let x = 0; x < cellCols; x++) {
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = (x + dx + cellCols) % cellCols;
              const ny = (y + dy + cellRows) % cellRows;
              neighbors += cellGrid[ny * cellCols + nx];
            }
          }
          const idx = y * cellCols + x;
          const alive = cellGrid[idx];
          // Organic rules: survive with 2-3, birth with 3-4, occasional spontaneous generation
          if (alive) nextGrid[idx] = (neighbors >= 2 && neighbors <= 3) || Math.random() < 0.001 ? 1 : 0;
          else nextGrid[idx] = (neighbors >= 3 && neighbors <= 4) || Math.random() < 0.0005 ? 1 : 0;
        }
      }
      [this.cellGrid, this.nextGrid] = [this.nextGrid, this.cellGrid];
    }

    drawCells() {
      const ctx = this.cellsCanvas?.getContext('2d'); if (!ctx) return;
      const { cellGrid, cellCols, cellRows, cellSize } = this;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = 'rgba(247, 127, 0, 0.03)';
      for (let y = 0; y < cellRows; y++) {
        for (let x = 0; x < cellCols; x++) {
          if (cellGrid[y * cellCols + x]) {
            const px = x * cellSize, py = y * cellSize;
            // Organic rounded rectangles
            ctx.beginPath();
            ctx.roundRect(px + 1, py + 1, cellSize - 2, cellSize - 2, 2);
            ctx.fill();
          }
        }
      }
    }

    /* --- Filament Growth (Reaction-Diffusion inspired) --- */
    initFilaments() {
      this.filaments = [];
      for (let i = 0; i < 12; i++) this.spawnFilament();
    }

    spawnFilament() {
      const angle = rand(0, Math.PI * 2);
      const length = rand(100, 300);
      const x = rand(0, window.innerWidth);
      const y = rand(0, window.innerHeight);
      this.filaments.push({
        x, y, angle, length, currentLength: 0,
        speed: rand(0.5, 2), width: rand(0.5, 1.5),
        color: Math.random() < 0.6 ? 'amber' : (Math.random() < 0.5 ? 'emerald' : 'cyan'),
        branches: [], life: 0, maxLife: rand(200, 500)
      });
    }

    updateFilaments() {
      this.filaments = this.filaments.filter(f => {
        f.life++;
        if (f.life > f.maxLife) return false;

        f.currentLength = Math.min(f.length, f.currentLength + f.speed);
        const endX = f.x + Math.cos(f.angle) * f.currentLength;
        const endY = f.y + Math.sin(f.angle) * f.currentLength;

        // Organic curvature
        f.angle += rand(-0.02, 0.02) * Math.sin(f.life * 0.05);

        // Branching
        if (f.currentLength > 50 && f.branches.length < 3 && Math.random() < 0.01) {
          f.branches.push({
            x: endX, y: endY,
            angle: f.angle + rand(-Math.PI/3, Math.PI/3),
            length: rand(30, 100), currentLength: 0,
            speed: rand(0.3, 1), width: f.width * 0.7,
            color: f.color, life: 0, maxLife: rand(100, 200)
          });
        }

        // Update branches
        f.branches = f.branches.filter(b => {
          b.life++;
          if (b.life > b.maxLife) return false;
          b.currentLength = Math.min(b.length, b.currentLength + b.speed);
          b.angle += rand(-0.03, 0.03);
          return true;
        });

        return true;
      });

      // Spawn new occasionally
      if (this.filaments.length < 15 && Math.random() < 0.02) this.spawnFilament();
    }

    drawFilaments() {
      const ctx = this.filamentsCanvas?.getContext('2d'); if (!ctx) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      const colors = {
        amber: 'rgba(247, 127, 0, ',
        emerald: 'rgba(26, 138, 74, ',
        cyan: 'rgba(0, 180, 216, '
      };

      this.filaments.forEach(f => this.drawFilament(ctx, f, colors));
    }

    drawFilament(ctx, f, colors) {
      const alpha = 0.15 * (1 - f.life / f.maxLife);
      ctx.strokeStyle = colors[f.color] + alpha + ')';
      ctx.lineWidth = f.width;

      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      const steps = Math.max(1, Math.floor(f.currentLength / 10));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const px = f.x + Math.cos(f.angle) * f.currentLength * t;
        const py = f.y + Math.sin(f.angle) * f.currentLength * t;
        // Add organic noise
        const noise = Math.sin(f.life * 0.1 + t * 10) * 5 * (1 - t);
        ctx.lineTo(px + noise, py + noise);
      }
      ctx.stroke();

      // Draw branches
      f.branches.forEach(b => {
        const alpha = 0.1 * (1 - b.life / b.maxLife);
        ctx.strokeStyle = colors[b.color] + alpha + ')';
        ctx.lineWidth = b.width;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        const bx = b.x + Math.cos(b.angle) * b.currentLength;
        const by = b.y + Math.sin(b.angle) * b.currentLength;
        ctx.lineTo(bx, by);
        ctx.stroke();
      });
    }

    /* --- Spores / Floating Particles --- */
    initSpores() {
      this.spores = [];
      for (let i = 0; i < 80; i++) this.spawnSpore();
    }

    spawnSpore() {
      this.spores.push({
        x: rand(0, window.innerWidth), y: rand(0, window.innerHeight),
        vx: rand(-0.1, 0.1), vy: rand(-0.3, 0.1),
        size: rand(1, 3), opacity: rand(0.05, 0.2),
        color: Math.random() < 0.5 ? 'amber' : 'emerald',
        pulse: rand(0, Math.PI * 2), pulseSpeed: rand(0.01, 0.03)
      });
    }

    updateSpores() {
      this.spores.forEach(s => {
        s.x += s.vx; s.y += s.vy;
        s.pulse += s.pulseSpeed;
        // Gentle drift
        s.vx += rand(-0.002, 0.002);
        s.vy += rand(-0.002, 0.002);
        s.vx = clamp(s.vx, -0.2, 0.2);
        s.vy = clamp(s.vy, -0.3, 0.1);

        // Wrap around
        if (s.y < -10) { s.y = window.innerHeight + 10; s.x = rand(0, window.innerWidth); }
        if (s.x < -10) s.x = window.innerWidth + 10;
        if (s.x > window.innerWidth + 10) s.x = -10;
      });
    }

    drawSpores() {
      const ctx = this.sporesCanvas?.getContext('2d'); if (!ctx) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      this.spores.forEach(s => {
        const pulseOpacity = s.opacity * (0.5 + 0.5 * Math.sin(s.pulse));
        ctx.fillStyle = (s.color === 'amber'
          ? `rgba(247, 127, 0, ${pulseOpacity})`
          : `rgba(26, 138, 74, ${pulseOpacity})`);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    animate() {
      if (prefersReduced()) return;
      this.stepCells(); this.drawCells();
      this.updateFilaments(); this.drawFilaments();
      this.updateSpores(); this.drawSpores();
      requestAnimationFrame(() => this.animate());
    }
  }

  /* ============================================================
     HERO LIVING ORGANISM
     ============================================================ */

  class HeroOrganism {
    constructor() {
      if (prefersReduced()) return;
      this.canvas = $('#hero-canvas');
      this.colony = $('#hero-colony');
      this.spiral = $('#hero-spiral');
      this.motes = $('#hero-motes');
      this.ctx = this.canvas?.getContext('2d');
      this.time = 0;
      this.particles = [];
      this.init();
    }

    init() {
      if (!this.ctx) return;
      this.resize(); this.spawnParticles();
      window.addEventListener('resize', () => this.resize());
      this.animate();
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.canvas.style.width = window.innerWidth + 'px';
      this.canvas.style.height = window.innerHeight + 'px';
      this.ctx.scale(dpr, dpr);
      this.w = window.innerWidth; this.h = window.innerHeight;
    }

    spawnParticles() {
      for (let i = 0; i < 60; i++) {
        this.particles.push({
          x: rand(0, this.w), y: rand(0, this.h),
          vx: rand(-0.2, 0.2), vy: rand(-0.3, 0.1),
          size: rand(1.5, 4), opacity: rand(0.1, 0.4),
          color: Math.random() < 0.4 ? 'amber' : (Math.random() < 0.5 ? 'emerald' : 'cyan'),
          orbitRadius: rand(50, 200), orbitAngle: rand(0, Math.PI * 2), orbitSpeed: rand(0.001, 0.003),
          centerX: rand(this.w * 0.3, this.w * 0.7), centerY: rand(this.h * 0.3, this.h * 0.7)
        });
      }
    }

    animate() {
      this.time += 0.016;
      this.ctx.clearRect(0, 0, this.w, this.h);

      // Draw connecting filaments between nearby particles
      this.drawConnections();

      // Draw particles with orbital motion
      this.particles.forEach(p => {
        p.orbitAngle += p.orbitSpeed;
        p.x = p.centerX + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.y = p.centerY + Math.sin(p.orbitAngle) * p.orbitRadius;

        const pulse = 0.5 + 0.5 * Math.sin(this.time * 2 + p.orbitAngle);
        const opacity = p.opacity * pulse;

        this.ctx.fillStyle = (p.color === 'amber'
          ? `rgba(247, 127, 0, ${opacity})`
          : p.color === 'emerald'
            ? `rgba(26, 138, 74, ${opacity})`
            : `rgba(0, 180, 216, ${opacity})`);
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Glow
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.shadowBlur = p.size * 3;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      });

      requestAnimationFrame(() => this.animate());
    }

    drawConnections() {
      const maxDist = 180;
      this.ctx.strokeStyle = 'rgba(247, 127, 0, 0.02)';
      this.ctx.lineWidth = 0.5;
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[j].x - this.particles[i].x;
          const dy = this.particles[j].y - this.particles[i].y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist) {
            this.ctx.globalAlpha = 1 - dist / maxDist;
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.stroke();
          }
        }
      }
      this.ctx.globalAlpha = 1;
    }
  }

  /* ============================================================
     SECTION CANVASES — Ambient Fields
     ============================================================ */

  class SectionField {
    constructor(canvasId, type = 'filaments') {
      if (prefersReduced()) return;
      this.canvas = $(`#${canvasId}`);
      this.ctx = this.canvas?.getContext('2d');
      this.type = type;
      this.time = 0;
      this.particles = [];
      this.init();
    }

    init() {
      if (!this.ctx) return;
      this.resize();
      if (this.type === 'filaments') this.spawnFilaments();
      else if (this.type === 'mycelium') this.spawnMycelium();
      else if (this.type === 'dna') this.spawnDNA();
      else if (this.type === 'cta') this.spawnCTAParticles();
      else if (this.type === 'footer') this.spawnRoots();

      window.addEventListener('resize', () => this.resize());
      this.animate();
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = this.canvas.offsetWidth * dpr;
      this.canvas.height = this.canvas.offsetHeight * dpr;
      this.canvas.style.width = this.canvas.offsetWidth + 'px';
      this.canvas.style.height = this.canvas.offsetHeight + 'px';
      this.ctx.scale(dpr, dpr);
      this.w = this.canvas.offsetWidth; this.h = this.canvas.offsetHeight;
    }

    spawnFilaments() {
      for (let i = 0; i < 8; i++) this.particles.push({
        x: rand(0, this.w), y: rand(0, this.h),
        angle: rand(0, Math.PI * 2), length: rand(200, 400),
        progress: 0, speed: rand(0.2, 0.8), width: rand(0.5, 1.2),
        color: Math.random() < 0.5 ? 'amber' : 'emerald', life: 0
      });
    }

    spawnMycelium() {
      // Mycelium network nodes
      this.nodes = [];
      for (let i = 0; i < 25; i++) {
        this.nodes.push({
          x: rand(0, this.w), y: rand(0, this.h),
          connections: [], pulse: rand(0, Math.PI * 2)
        });
      }
      // Connect nearby nodes
      this.nodes.forEach((n, i) => {
        this.nodes.forEach((m, j) => {
          if (i !== j && Math.hypot(n.x - m.x, n.y - m.y) < 250 && Math.random() < 0.3) {
            n.connections.push(j);
          }
        });
      });
    }

    spawnDNA() {
      this.strands = [];
      for (let i = 0; i < 3; i++) {
        this.strands.push({
          x: this.w * (0.2 + i * 0.3), y: -100,
          phase: i * Math.PI * 1.5, speed: rand(0.3, 0.6),
          pairs: Array.from({ length: 30 }, (_, j) => ({
            offset: j * 30, rotation: rand(0, Math.PI * 2)
          }))
        });
      }
    }

    spawnCTAParticles() {
      for (let i = 0; i < 40; i++) {
        this.particles.push({
          x: rand(0, this.w), y: rand(0, this.h),
          vx: rand(-0.15, 0.15), vy: rand(-0.2, 0.05),
          size: rand(2, 5), opacity: rand(0.1, 0.3),
          color: ['amber', 'emerald', 'cyan'][randInt(0, 2)],
          pulsePhase: rand(0, Math.PI * 2)
        });
      }
    }

    spawnRoots() {
      this.roots = [];
      for (let i = 0; i < 15; i++) {
        this.roots.push({
          x: rand(0, this.w), y: this.h,
          segments: Array.from({ length: 12 }, (_, j) => ({
            angle: -Math.PI/2 + rand(-0.3, 0.3) + j * 0.1,
            length: rand(15, 30), width: rand(1, 3) * (1 - j * 0.05)
          }))
        });
      }
    }

    animate() {
      this.time += 0.016;
      this.ctx.clearRect(0, 0, this.w, this.h);

      switch (this.type) {
        case 'filaments': this.drawFilaments(); break;
        case 'mycelium': this.drawMycelium(); break;
        case 'dna': this.drawDNA(); break;
        case 'cta': this.drawCTA(); break;
        case 'footer': this.drawRoots(); break;
      }
      requestAnimationFrame(() => this.animate());
    }

    drawFilaments() {
      this.particles.forEach(p => {
        p.progress = Math.min(1, p.progress + p.speed / p.length);
        p.life++;
        if (p.progress >= 1 || p.life > 500) {
          Object.assign(p, { x: rand(0, this.w), y: rand(0, this.h), progress: 0, life: 0, angle: rand(0, Math.PI * 2) });
        }
        const endX = p.x + Math.cos(p.angle) * p.length * p.progress;
        const endY = p.y + Math.sin(p.angle) * p.length * p.progress;

        this.ctx.strokeStyle = (p.color === 'amber'
          ? `rgba(247, 127, 0, ${0.08 * (1 - p.progress)})`
          : `rgba(26, 138, 74, ${0.08 * (1 - p.progress)})`);
        this.ctx.lineWidth = p.width; this.ctx.lineCap = 'round';
        this.ctx.beginPath(); this.ctx.moveTo(p.x, p.y); this.ctx.lineTo(endX, endY); this.ctx.stroke();
      });
    }

    drawMycelium() {
      this.nodes.forEach((n, i) => {
        n.pulse += 0.02;
        const pulseOpacity = 0.05 + 0.1 * Math.sin(n.pulse);

        // Draw connections
        n.connections.forEach(j => {
          const m = this.nodes[j];
          if (!m) return;
          this.ctx.strokeStyle = `rgba(247, 127, 0, ${pulseOpacity * 0.5})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(n.x, n.y);
          // Curved connection
          const cx = (n.x + m.x) / 2 + Math.sin(this.time + i) * 20;
          const cy = (n.y + m.y) / 2 + Math.cos(this.time + i) * 20;
          this.ctx.quadraticCurveTo(cx, cy, m.x, m.y);
          this.ctx.stroke();
        });

        // Draw node
        this.ctx.fillStyle = `rgba(247, 127, 0, ${pulseOpacity})`;
        this.ctx.beginPath(); this.ctx.arc(n.x, n.y, 2 + Math.sin(n.pulse) * 1.5, 0, Math.PI * 2); this.ctx.fill();
      });
    }

    drawDNA() {
      this.strands.forEach(s => {
        s.y += s.speed;
        if (s.y > this.h + 100) s.y = -100;

        s.pairs.forEach((p, i) => {
          const y = s.y + p.offset;
          if (y < 0 || y > this.h) return;
          const width = 30 + Math.sin(this.time * 2 + p.offset * 0.1) * 15;
          const leftX = s.x - width / 2;
          const rightX = s.x + width / 2;

          // Backbone
          this.ctx.strokeStyle = `rgba(247, 127, 0, 0.06)`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath(); this.ctx.moveTo(s.x, y - 15); this.ctx.lineTo(s.x, y + 15); this.ctx.stroke();

          // Base pairs
          this.ctx.strokeStyle = `rgba(26, 138, 74, 0.08)`;
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath(); this.ctx.moveTo(leftX, y); this.ctx.lineTo(rightX, y); this.ctx.stroke();

          // Glowing nodes
          this.ctx.fillStyle = `rgba(247, 127, 0, 0.15)`;
          this.ctx.beginPath(); this.ctx.arc(leftX, y, 2, 0, Math.PI * 2); this.ctx.fill();
          this.ctx.beginPath(); this.ctx.arc(rightX, y, 2, 0, Math.PI * 2); this.ctx.fill();
        });
      });
    }

    drawCTA() {
      this.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.pulsePhase += 0.02;
        const pulse = 0.5 + 0.5 * Math.sin(p.pulsePhase);

        if (p.y < -10) { p.y = this.h + 10; p.x = rand(0, this.w); }
        if (p.x < -10) p.x = this.w + 10;
        if (p.x > this.w + 10) p.x = -10;

        const colors = {
          amber: `rgba(247, 127, 0, ${p.opacity * pulse})`,
          emerald: `rgba(26, 138, 74, ${p.opacity * pulse})`,
          cyan: `rgba(0, 180, 216, ${p.opacity * pulse})`
        };
        this.ctx.fillStyle = colors[p.color];
        this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2); this.ctx.fill();

        // Glow
        this.ctx.shadowColor = colors[p.color]; this.ctx.shadowBlur = p.size * 4; this.ctx.fill(); this.ctx.shadowBlur = 0;
      });
    }

    drawRoots() {
      this.roots.forEach(r => {
        this.ctx.strokeStyle = 'rgba(247, 127, 0, 0.04)'; this.ctx.lineCap = 'round';
        let px = r.x, py = r.y;
        r.segments.forEach((seg, i) => {
          const angle = seg.angle + Math.sin(this.time + i) * 0.1;
          const nx = px + Math.cos(angle) * seg.length;
          const ny = py + Math.sin(angle) * seg.length;
          this.ctx.lineWidth = seg.width;
          this.ctx.beginPath(); this.ctx.moveTo(px, py); this.ctx.lineTo(nx, ny); this.ctx.stroke();
          px = nx; py = ny;
        });
      });
    }
  }

  /* ============================================================
     MAGNETIC CURSOR FIELD
     ============================================================ */

  class MagneticCursor {
    constructor() {
      if (prefersReduced()) return;
      this.field = $('.cursor-field');
      this.core = $('.cursor-core');
      this.ring = $('.cursor-ring');
      this.trail = $('.cursor-trail');
      this.targetX = window.innerWidth / 2;
      this.targetY = window.innerHeight / 2;
      this.currentX = this.targetX;
      this.currentY = this.targetY;
      this.active = false;
      this.magneticElements = $$('.btn--magnetic, .focus__item, .approach__card, .step, .session__price, .cta__content, .nav a, .footer__col a, .social-link');
      this.init();
    }

    init() {
      document.addEventListener('mousemove', e => {
        this.targetX = e.clientX; this.targetY = e.clientY;
        if (!this.active) { this.active = true; this.field.classList.add('active'); }
      });

      document.addEventListener('mouseleave', () => {
        this.active = false; this.field.classList.remove('active');
      });

      // Magnetic attraction
      this.magneticElements.forEach(el => {
        el.addEventListener('mouseenter', () => this.attract(el));
        el.addEventListener('mouseleave', () => this.release());
      });

      this.animate();
    }

    attract(el) {
      const rect = el.getBoundingClientRect();
      this.magneticTarget = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        strength: el.classList.contains('btn--magnetic') ? 0.3 : 0.15
      };
    }

    release() { this.magneticTarget = null; }

    animate() {
      if (this.magneticTarget) {
        this.currentX = lerp(this.currentX, this.magneticTarget.x, this.magneticTarget.strength);
        this.currentY = lerp(this.currentY, this.magneticTarget.y, this.magneticTarget.strength);
      } else {
        this.currentX = lerp(this.currentX, this.targetX, 0.15);
        this.currentY = lerp(this.currentY, this.targetY, 0.15);
      }

      this.field.style.transform = `translate(${this.currentX - 200}px, ${this.currentY - 200}px)`;

      requestAnimationFrame(() => this.animate());
    }
  }

  /* ============================================================
     SCROLL PROGRESS & HEADER
     ============================================================ */

  class ScrollController {
    constructor() {
      this.progressFill = $('.scroll-progress__fill');
      this.header = $('.header');
      this.lastScroll = 0;
      this.ticking = false;
      this.init();
    }

    init() {
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      this.update();
    }

    onScroll() {
      if (!this.ticking) {
        requestAnimationFrame(() => { this.update(); this.ticking = false; });
        this.ticking = true;
      }
    }

    update() {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollY / docHeight : 0;
      this.progressFill.style.transform = `scaleX(${progress})`;

      // Header scroll state
      if (scrollY > 40) this.header.classList.add('header--scrolled');
      else this.header.classList.remove('header--scrolled');

      this.lastScroll = scrollY;
    }
  }

  /* ============================================================
     REVEAL ANIMATIONS — IntersectionObserver with Stagger
     ============================================================ */

  class RevealController {
    constructor() {
      this.elements = $$('[data-reveal]');
      this.observer = new IntersectionObserver(this.onIntersect.bind(this), {
        rootMargin: '0px 0px -15% 0px', threshold: 0.08
      });
      this.elements.forEach(el => this.observer.observe(el));
      // Split text elements
      this.splitTextElements = $$('[data-split-text]');
      this.splitTextElements.forEach(el => this.splitText(el));
    }

    splitText(el) {
      const text = el.textContent;
      el.textContent = '';
      [...text].forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.transitionDelay = `${i * 30}ms`;
        el.appendChild(span);
      });
    }

    onIntersect(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.revealDelay || '0', 10);
          const index = parseInt(el.dataset.revealIndex || '-1', 10);
          const totalDelay = delay + (index >= 0 ? index * 100 : 0);
          el.style.transitionDelay = `${totalDelay}ms`;
          el.classList.add('is-visible');
          this.observer.unobserve(el);
        }
      });
    }
  }

  /* ============================================================
     STAT COUNTER ANIMATION
     ============================================================ */

  class StatCounter {
    constructor() {
      this.stats = $$('.stat__value[data-count]');
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) this.animate(entry.target);
        });
      }, { threshold: 0.5 });
      this.stats.forEach(s => this.observer.observe(s));
    }

    animate(el) {
      const target = parseInt(el.dataset.count, 10);
      const duration = 1800;
      const start = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);

      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const value = Math.floor(ease(progress) * target);
        el.textContent = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString();
      };
      requestAnimationFrame(tick);
      this.observer.unobserve(el);
    }
  }

  /* ============================================================
     BUTTON RIPPLE & PARTICLES
     ============================================================ */

  class ButtonEffects {
    constructor() {
      this.initRipples();
      this.initParticles();
    }

    initRipples() {
      $$('.btn--primary, .btn--light, .btn--outline').forEach(btn => {
        btn.addEventListener('click', e => this.createRipple(e, btn));
      });
    }

    createRipple(e, btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position: absolute; width: ${size}px; height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        background: currentColor; opacity: 0.2; border-radius: 50%;
        transform: scale(0); animation: btnRipple 500ms ease-out forwards;
        pointer-events: none;`;
      if (!$('#ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `@keyframes btnRipple { to { transform: scale(2.5); opacity: 0; } }`;
        document.head.appendChild(style);
      }
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }

    initParticles() {
      $$('.btn__particles').forEach(container => {
        const btn = container.closest('.btn');
        btn.addEventListener('mouseenter', () => this.burstParticles(container));
      });
    }

    burstParticles(container) {
      for (let i = 0; i < 8; i++) {
        const p = document.createElement('span');
        const angle = (i / 8) * Math.PI * 2;
        const dist = 30 + Math.random() * 40;
        p.style.cssText = `
          position: absolute; width: 4px; height: 4px; border-radius: 50%;
          background: var(--amber); left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          animation: particleBurst 600ms ease-out forwards;
          --tx: ${Math.cos(angle) * dist}px; --ty: ${Math.sin(angle) * dist}px;`;
        if (!$('#particle-style')) {
          const style = document.createElement('style');
          style.id = 'particle-style';
          style.textContent = `
            @keyframes particleBurst {
              0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
            }`;
          document.head.appendChild(style);
        }
        container.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
      }
    }
  }

  /* ============================================================
     SMOOTH SCROLL ANCHORS
     ============================================================ */

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const offset = 88;
          const pos = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: pos, behavior: 'smooth' });
          target.focus({ preventScroll: true });
          // Close mobile nav
          document.querySelector('.nav')?.classList.remove('open');
          document.querySelector('.nav-toggle')?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ============================================================
     MOBILE NAV TOGGLE
     ============================================================ */

  function initMobileNav() {
    const toggle = $('.nav-toggle');
    const nav = $('.nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    // Close on link click
    $$('.nav a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ============================================================
     KEYBOARD NAVIGATION CLASS
     ============================================================ */

  function initKeyboardNav() {
    document.addEventListener('keydown', e => { if (e.key === 'Tab') document.body.classList.add('keyboard-nav'); });
    document.addEventListener('mousedown', () => document.body.classList.remove('keyboard-nav'));
  }

  /* ============================================================
     PARALLAX HERO VISUAL
     ============================================================ */

  function initHeroParallax() {
    const visual = $('.hero__visual');
    if (!visual || prefersReduced()) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = visual.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const viewportCenter = window.innerHeight / 2;
          const distance = (center - viewportCenter) * 0.08;
          visual.style.transform = `translateY(${distance}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ============================================================
     FOCUS ITEM HOVER — Network Connections
     ============================================================ */

  function initFocusNetwork() {
    const items = $$('.focus__item');
    const network = $('#focus-network');
    if (!network || items.length < 2) return;

    const drawConnections = () => {
      network.innerHTML = '';
      const rects = items.map(el => el.getBoundingClientRect());
      const containerRect = network.getBoundingClientRect();

      items.forEach((item, i) => {
        if (!item.matches(':hover')) return;
        rects.forEach((r, j) => {
          if (i === j) return;
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', rects[i].left + rects[i].width / 2 - containerRect.left);
          line.setAttribute('y1', rects[i].top + rects[i].height / 2 - containerRect.top);
          line.setAttribute('x2', r.left + r.width / 2 - containerRect.left);
          line.setAttribute('y2', r.top + r.height / 2 - containerRect.top);
          line.setAttribute('stroke', 'rgba(247, 127, 0, 0.3)');
          line.setAttribute('stroke-width', '1');
          line.setAttribute('stroke-dasharray', '4 4');
          line.style.animation = 'dashFlow 2s linear infinite';
          network.appendChild(line);
        });
      });
    };

    items.forEach(item => {
      item.addEventListener('mouseenter', drawConnections);
      item.addEventListener('mouseleave', () => { network.innerHTML = ''; });
    });

    // Add dash animation style
    if (!$('#dash-style')) {
      const style = document.createElement('style');
      style.id = 'dash-style';
      style.textContent = `@keyframes dashFlow { to { stroke-dashoffset: -8; } }`;
      document.head.appendChild(style);
    }
  }

  /* ============================================================
     INITIALIZE ALL
     ============================================================ */

  function init() {
    // Core systems
    new LivingBackground();
    new HeroOrganism();
    new ScrollController();
    new RevealController();
    new StatCounter();
    new ButtonEffects();
    new MagneticCursor();

    // Section fields
    new SectionField('approach-canvas', 'filaments');
    new SectionField('focus-canvas', 'mycelium');
    new SectionField('session-canvas', 'dna');
    new SectionField('cta-canvas', 'cta');
    new SectionField('footer-canvas', 'footer');

    // Interactions
    initSmoothScroll();
    initMobileNav();
    initKeyboardNav();
    initHeroParallax();
    initFocusNetwork();

    // Reduced motion listener
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
      if (e.matches) document.body.classList.add('reduced-motion');
      else document.body.classList.remove('reduced-motion');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();