/**
 * Projects Showroom module for Satvik Sethia Portfolio
 * Manages project lists, filters, live searches, and the interactive border glow spotlight cursor effects.
 */

// Portfolio Projects Catalog
const projects = [
  {
    title: "Linguistic Syntax Tree & IPA Soundboard",
    description: "An interactive, zero-dependency linguistic playground. Analyzes sentence syntax structures to construct elegant, branching grammar trees in real-time, and features an interactive IPA phonetic soundboard with audio visualizer feedback.",
    tags: ["HTML5 Canvas", "Linguistics", "Web Audio API", "Vanilla JS"],
    category: "linguistics",
    demoUrl: "./projects/linguistic-parser/",
    githubUrl: "https://github.com/ssethia2"
  },
  {
    title: "Matrix Transform & Fractal Sandbox",
    description: "A high-performance mathematical playground. Graphically visualizes linear algebra transformations (scaling, shearing, rotation) inside vector grids, and renders detailed Mandlebrot and Julia set fractals dynamically using slider parameter presets.",
    tags: ["HTML5 Canvas", "Math", "Linear Algebra", "Algorithms"],
    category: "math",
    demoUrl: "./projects/matrix-sandbox/",
    githubUrl: "https://github.com/ssethia2"
  }
];

export function initProjects() {
  const grid = document.getElementById('projects-grid');
  const searchInput = document.getElementById('project-search');
  const filterTabs = document.querySelectorAll('.filter-tab');

  if (!grid) return;

  let activeCategory = 'all';
  let searchQuery = '';

  // Function to render projects matching the active filters
  const renderProjects = () => {
    // Clear current grid
    grid.innerHTML = '';

    // Filter projects array
    const filtered = projects.filter(p => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch = p.title.toLowerCase().includes(searchQuery) ||
                            p.description.toLowerCase().includes(searchQuery) ||
                            p.tags.some(tag => tag.toLowerCase().includes(searchQuery));
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="glass flex-center" style="grid-column: 1/-1; padding: 60px; flex-direction: column; text-align: center; gap: 16px; border-style: dashed;">
          <p style="color: var(--text-secondary); font-size: 1.1rem; font-weight: 500;">No projects found matching "${searchQuery}"</p>
          <span style="color: var(--text-muted); font-size: 0.9rem;">Try searching for other terms or checking alternative categories.</span>
        </div>
      `;
      return;
    }

    // Build project elements
    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'glass glass-card project-card';
      
      const tagsList = p.tags.map(t => `<li class="tag-chip">${t}</li>`).join('');

      card.innerHTML = `
        <div class="project-card-header">
          <svg class="project-folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <div class="project-links">
            <a href="${p.githubUrl}" target="_blank" class="project-icon-link" aria-label="GitHub Repository">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
            <a href="${p.demoUrl}" ${p.demoUrl.startsWith('./') ? '' : 'target="_blank"'} class="project-icon-link" aria-label="Live Demo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
        <div class="project-card-body">
          <h3 class="project-card-title">${p.title}</h3>
          <p class="project-card-desc">${p.description}</p>
        </div>
        <div class="project-card-footer">
          <ul class="project-tags">
            ${tagsList}
          </ul>
        </div>
      `;

      // Set up Mouse Coordinate tracking for Card border spotlights
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });

      grid.appendChild(card);
    });
  };

  // Bind keyup listener for search bar
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderProjects();
    });
  }

  // Bind click handlers for filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.filter;
      renderProjects();
    });
  });

  // Perform initial render
  renderProjects();
}
