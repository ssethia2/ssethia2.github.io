/**
 * Main Orchestrator for Satvik Sethia Portfolio
 * Connects theme management, background canvas, dynamic project showroom,
 * scroll indicators, header layouts, and typewriter scripts.
 */

import { initTheme } from './theme.js';
import { initCanvas } from './canvas.js';
import { initProjects } from './projects.js';

// --- Typewriter Role Switcher ---
function initTypewriter() {
  const target = document.getElementById('typewriter-text');
  if (!target) return;

  const roles = [
    "Senior Software Engineer @ HubSpot",
    "UIUC B.S. CS & Linguistics",
    "Mathematics Minor Graduate",
    "Full-Stack Web Architect",
    "Loves soccer, piano, and neat code"
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let delay = 100; // Type speed

  function type() {
    const currentRole = roles[roleIndex];
    
    if (isDeleting) {
      target.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;
      delay = 40; // Faster deleting
    } else {
      target.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
      delay = 80; // Standard typing delay
    }

    // Finished typing full string
    if (!isDeleting && charIndex === currentRole.length) {
      delay = 2000; // Pause at the end
      isDeleting = true;
    } 
    // Finished deleting string
    else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 500; // Pause before typing next word
    }

    setTimeout(type, delay);
  }

  // Add typewriter structural cursor
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  target.parentNode.insertBefore(cursor, target.nextSibling);

  // Kickstart typewriter loop
  type();
}

// --- Shrinking Header & Active Nav Links ---
function initScrollHandling() {
  const header = document.querySelector('header');
  const sections = document.querySelectorAll('section, .hero');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    // 1. Shrink header on scroll
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // 2. Highlight active nav link on scroll
    let currentId = 'home';
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (window.scrollY >= top - 120) {
        if (section.id) {
          currentId = section.id;
        } else if (section.classList.contains('hero')) {
          currentId = 'home';
        }
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-scroll') === currentId) {
        link.classList.add('active');
      }
    });
  });

  // 3. Smooth scrolling on clicking nav items
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-scroll');
      let targetElement = document.getElementById(targetId);
      
      if (targetId === 'home') {
        targetElement = document.querySelector('.hero');
      }

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
}

// --- Viewport Entrance Animations (IntersectionObserver) ---
function initEntranceAnimations() {
  const elements = document.querySelectorAll('.reveal');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Unobserve once animation is complete
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// --- DomContentLoaded Entry ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCanvas();
  initProjects();
  initTypewriter();
  initScrollHandling();
  initEntranceAnimations();
});
