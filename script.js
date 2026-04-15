/* ================================================================
   Green Plant Energy Oil & Gas Limited — Site JavaScript
================================================================ */

/* ── Sticky Nav: add .scrolled class on scroll ── */
(function () {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();


/* ── Mobile Nav Toggle ── */
(function () {
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('open', !expanded);
    document.body.style.overflow = expanded ? '' : 'hidden';
  });

  // Close when a link is clicked
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();


/* ── Active nav link highlight on scroll ── */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${entry.target.id}`
          );
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
})();


/* ── Animated Counter (stats band) ── */
(function () {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      el.textContent = Math.floor(easeOut(progress) * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();


/* ── Scroll-reveal animations ── */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    .reveal { opacity: 0; transform: translateY(28px); transition: opacity .6s ease, transform .6s ease; }
    .reveal.visible { opacity: 1; transform: none; }
    .reveal-delay-1 { transition-delay: .1s; }
    .reveal-delay-2 { transition-delay: .2s; }
    .reveal-delay-3 { transition-delay: .3s; }
  `;
  document.head.appendChild(style);

  const revealTargets = [
    '.service-card',
    '.feature-card',
    '.step',
    '.contact-card',
    '.stat-item',
    '.about-content p',
    '.about-list li',
    '.section-header',
  ];

  revealTargets.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('reveal');
      if (i % 3 === 1) el.classList.add('reveal-delay-1');
      if (i % 3 === 2) el.classList.add('reveal-delay-2');
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();


/* ── Contact Form — POSTs to mail.php ── */
(function () {
  const form       = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');
  const submitBtn  = document.getElementById('submit-btn');
  const errorMsg   = document.getElementById('form-error');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Reset field highlights
    form.querySelectorAll('input, textarea, select').forEach(f => f.style.borderColor = '');
    if (errorMsg) errorMsg.hidden = true;
    successMsg.hidden = true;

    // Required field validation
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = '#e53e3e';
        valid = false;
      }
    });
    if (!valid) return;

    // Email format validation
    const emailField   = form.querySelector('#email');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailField.value)) {
      emailField.style.borderColor = '#e53e3e';
      emailField.focus();
      return;
    }

    // Build payload
    const payload = {
      name:          form.querySelector('#name').value.trim(),
      phone:         form.querySelector('#phone').value.trim(),
      email:         emailField.value.trim(),
      volume:        form.querySelector('#volume').value.trim(),
      'client-type': form.querySelector('#client-type').value,
      message:       form.querySelector('#message').value.trim(),
    };

    // Send to mail.php
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Sending…';

    try {
      const response = await fetch('mail.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        form.reset();
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        if (errorMsg) {
          errorMsg.textContent = result.error || 'Something went wrong. Please try again.';
          errorMsg.hidden = false;
        }
      }
    } catch (err) {
      if (errorMsg) {
        errorMsg.textContent = 'Could not reach the server. Please call us directly.';
        errorMsg.hidden = false;
      }
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Send Enquiry';
    }
  });
})();


/* ── Footer current year ── */
(function () {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();
