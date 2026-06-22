// Utility functions
const utils = {
  async fetchText(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      return null;
    }
  },

  async fetchJSON(url) {
    const text = await this.fetchText(url);
    return text ? JSON.parse(text) : null;
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }
};

// Application State
const appState = {
  data: {},
  pwa: {},
  selected: new Set(),
  currentCategory: 'all',
  searchQuery: '',

  async load() {
    console.log('Loading configuration...');
    this.data = await utils.fetchJSON('../sw/setup.json') || {};
    this.pwa = await utils.fetchJSON('../sw/pwa-edge.json') || {};
    
    // Add PWA group
    if (Object.keys(this.pwa).length > 0) {
      this.data.PWA = { id: 'grp-pwa', pkg: {} };
      Object.entries(this.pwa).forEach(([name, config]) => {
        this.data.PWA.pkg[name] = {
          name,
          type: 'pwa',
          args: config.url,
          pwa: config.id,
          prof: config.prof
        };
      });
    }

    console.log('Data loaded:', this.data);
  },

  addSelected(key) {
    this.selected.add(key);
    this.updateUI();
  },

  removeSelected(key) {
    this.selected.delete(key);
    this.updateUI();
  },

  selectAll() {
    const filteredPackages = this.getFilteredPackages();
    filteredPackages.forEach(pkg => this.selected.add(pkg.key));
    this.updateUI();
  },

  clearAll() {
    this.selected.clear();
    this.updateUI();
  },

  getFilteredPackages() {
    const packages = [];
    const query = this.searchQuery.toLowerCase();

    Object.entries(this.data).forEach(([category, group]) => {
      if (this.currentCategory !== 'all' && category !== this.currentCategory) {
        return;
      }

      Object.entries(group.pkg || {}).forEach(([name, config]) => {
        if (query === '' || name.toLowerCase().includes(query) || 
            (config.args && config.args.toLowerCase().includes(query))) {
          packages.push({
            key: `${category}::${name}`,
            category,
            name,
            config
          });
        }
      });
    });

    return packages;
  },

  updateUI() {
    ui.updateStats();
    ui.updatePackageCards();
  }
};

// UI Controller
const ui = {
  mainContent: document.getElementById('mainContent'),
  categoryList: document.getElementById('categoryList'),
  selectedCount: document.getElementById('selectedCount'),
  totalCount: document.getElementById('totalCount'),
  generateBtn: document.getElementById('generateBtn'),
  searchInput: document.getElementById('searchInput'),
  themeToggle: document.getElementById('themeToggle'),
  selectAllBtn: document.getElementById('selectAllBtn'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  scriptStatus: document.getElementById('scriptStatus'),

  init() {
    console.log('Initializing UI...');
    this.setupEventListeners();
    this.renderCategories();
    this.updateStats();
    this.loadThemePreference();
  },

  setupEventListeners() {
    this.generateBtn.addEventListener('click', () => this.generateScript());
    this.selectAllBtn.addEventListener('click', () => {
      appState.selectAll();
    });
    this.clearAllBtn.addEventListener('click', () => {
      appState.clearAll();
    });
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    this.searchInput.addEventListener('input', utils.debounce((e) => {
      appState.searchQuery = e.target.value;
      appState.currentCategory = 'all';
      this.updateCategoryButtons();
      appState.updateUI();
    }, 300));
  },

  renderCategories() {
    this.categoryList.innerHTML = '';
    const categories = Object.keys(appState.data);
    
    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn active';
    allBtn.innerHTML = '<span class="material-icons-outlined" style="font-size: 1.1rem; margin-right: 0.6rem;">dashboard</span>All Categories';
    allBtn.addEventListener('click', () => {
      appState.currentCategory = 'all';
      appState.searchQuery = '';
      this.searchInput.value = '';
      this.updateCategoryButtons();
      appState.updateUI();
    });
    this.categoryList.appendChild(allBtn);

    categories.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.innerHTML = `<span class="material-icons-outlined" style="font-size: 1.1rem; margin-right: 0.6rem;">inventory_2</span>${category}`;
      btn.addEventListener('click', () => {
        appState.currentCategory = category;
        appState.searchQuery = '';
        this.searchInput.value = '';
        this.updateCategoryButtons();
        appState.updateUI();
      });
      this.categoryList.appendChild(btn);
    });
  },

  updateCategoryButtons() {
    const buttons = this.categoryList.querySelectorAll('.category-btn');
    buttons.forEach((btn, index) => {
      const isAll = index === 0;
      const isActive = (isAll && appState.currentCategory === 'all') ||
                       (!isAll && btn.textContent.includes(appState.currentCategory));
      btn.classList.toggle('active', isActive);
    });
  },

  updateStats() {
    this.selectedCount.textContent = appState.selected.size;
    const filteredPackages = appState.getFilteredPackages();
    this.totalCount.textContent = filteredPackages.length;
  },

  updatePackageCards() {
    const filteredPackages = appState.getFilteredPackages();
    
    if (filteredPackages.length === 0) {
      this.mainContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">No packages found</div>
        </div>
      `;
      return;
    }

    // Group by category
    const grouped = {};
    filteredPackages.forEach(pkg => {
      if (!grouped[pkg.category]) {
        grouped[pkg.category] = [];
      }
      grouped[pkg.category].push(pkg);
    });

    this.mainContent.innerHTML = Object.entries(grouped)
      .map(([category, packages]) => {
        const categoryHtml = packages
          .map(pkg => this.createPackageCard(pkg))
          .join('');
        
        return `
          <div class="category-section">
            <h2 class="category-title"><span class="material-icons-outlined">inventory_2</span>${category}</h2>
            <div class="package-grid">
              ${categoryHtml}
            </div>
          </div>
        `;
      })
      .join('');

    // Attach event listeners
    this.attachPackageListeners();
  },

  createPackageCard(pkg) {
    const isSelected = appState.selected.has(pkg.key);
    const hasVersions = pkg.config.versions && Object.keys(pkg.config.versions).length > 0;
    
    let versionHtml = '';
    if (hasVersions) {
      const options = Object.keys(pkg.config.versions)
        .map(v => `<option value="${v}">${v}</option>`)
        .join('');
      versionHtml = `
        <div class="package-versions">
          <select class="version-select" data-key="${pkg.key}">
            <option value="">Default</option>
            ${options}
          </select>
        </div>
      `;
    }

    let descriptionHtml = '';
    if (pkg.config.args) {
      descriptionHtml = `<div class="package-description">${pkg.config.args}</div>`;
    }

    return `
      <div class="package-card ${isSelected ? 'selected' : ''}" data-key="${pkg.key}">
        <div class="package-header">
          <input type="checkbox" class="package-checkbox" data-key="${pkg.key}" ${isSelected ? 'checked' : ''}>
          <div style="flex: 1;">
            <div class="package-name"><span class="material-icons-outlined" style="font-size: 1.15rem; margin-right: 0.5rem;">download</span>${pkg.name}</div>
            <span class="package-type">${pkg.config.type}</span>
          </div>
        </div>
        ${descriptionHtml}
        <div class="package-details">
          <div class="detail-item">
            <span class="detail-label">Package:</span>
            <span>${pkg.config.args}</span>
          </div>
          ${pkg.config.ppa ? `
            <div class="detail-item">
              <span class="detail-label">PPA:</span>
              <span>${pkg.config.ppa}</span>
            </div>
          ` : ''}
        </div>
        ${versionHtml}
      </div>
    `;
  },

  attachPackageListeners() {
    this.mainContent.querySelectorAll('.package-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        if (e.target.checked) {
          appState.addSelected(key);
        } else {
          appState.removeSelected(key);
        }
      });
    });

    this.mainContent.querySelectorAll('.version-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        if (e.target.value) {
          appState.selected.add(`${key}::${e.target.value}`);
          appState.updateUI();
        }
      });
    });
  },

  toggleTheme() {
    // Toggle the `light-mode` class on <html>. CSS uses default (dark) in :root and
    // `html.light-mode` for light theme overrides.
    const isLight = document.documentElement.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    // Show the icon for the action the button will perform (opposite of current)
    this.themeToggle.innerHTML = `<span class="material-icons-outlined">${isLight ? 'dark_mode' : 'light_mode'}</span>`;
  },

  loadThemePreference() {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      this.themeToggle.innerHTML = '<span class="material-icons-outlined">dark_mode</span>';
    } else {
      document.documentElement.classList.remove('light-mode');
      this.themeToggle.innerHTML = '<span class="material-icons-outlined">light_mode</span>';
    }
  },

  async generateScript() {
    if (appState.selected.size === 0) {
      this.scriptStatus.textContent = '⚠️ Please select at least one package';
      return;
    }

    this.generateBtn.disabled = true;
    this.scriptStatus.textContent = '⏳ Generating script...';

    try {
      let script = '#!/bin/bash\n\n# Ubuntu Setup Installation Script\n';
      script += `# Generated: ${new Date().toLocaleString()}\n`;
      script += '# Selected packages to install\n\n';
      script += 'set -e\n\n';

      const ppaList = new Set();
      const aptList = new Set();
      const snapList = new Set();
      const scriptsList = [];
      let pwaCount = 0;

      // Process selected packages
      for (const key of appState.selected) {
        const [category, packageName, version] = key.split('::');
        const pkgConfig = appState.data[category]?.pkg?.[packageName];
        
        if (!pkgConfig) continue;

        switch (pkgConfig.type) {
          case 'apt':
            if (pkgConfig.ppa) {
              ppaList.add(pkgConfig.ppa);
            }
            aptList.add(pkgConfig.args);
            break;
          case 'snap':
            snapList.add(pkgConfig.args);
            break;
          case 'deb':
            script += `\n# Download and install ${packageName}\n`;
            script += `curl -fL "${pkgConfig.args}" -o /tmp/${packageName}.deb\n`;
            script += `sudo dpkg -i /tmp/${packageName}.deb\n`;
            script += `rm /tmp/${packageName}.deb\n`;
            break;
          case 'script':
            scriptsList.push(pkgConfig.args);
            break;
          case 'pwa':
            if (pwaCount === 0)
              script += `mkdir -p "\${HOME}/.local/share/applications"\n`;
            pwaCount++;
            script += `\n# Configure PWA: ${packageName}\n`;
            script += `cat > "\${HOME}/.local/share/applications/msedge-${pkgConfig.pwa}.desktop" << 'EOF'\n`;
            script += `[Desktop Entry]\n`;
            script += `Version=1.0\n`;
            script += `Type=Application\n`;
            script += `Name=${packageName}\n`;
            script += `Exec=/opt/microsoft/msedge/microsoft-edge --app-id=${pkgConfig.pwa} "--app-url=${pkgConfig.args}"\n`;
            script += `Icon=msedge-${pkgConfig.pwa}-Default.png\n`;
            script += `EOF\n`;
            break;
        }
      }

      if (pwaCount > 0)
        script += `\nupdate-desktop-database ~/.local/share/applications/\n`;

      // Add PPAs and update
      if (ppaList.size > 0) {
        script += '\n# Adding PPAs\n';
        ppaList.forEach(ppa => {
          script += `sudo add-apt-repository "${ppa}" -y\n`;
        });
        script += 'sudo apt update\n';
      }

      // Add apt packages
      if (aptList.size > 0) {
        script += '\n# Installing APT packages\n';
        script += `sudo apt install ${Array.from(aptList).join(' ')} -y\n`;
      }

      // Add snap packages
      if (snapList.size > 0) {
        script += '\n# Installing Snap packages\n';
        snapList.forEach(snap => {
          script += `sudo snap install ${snap}\n`;
        });
      }

      // Add custom scripts
      if (scriptsList.length > 0) {
        script += '\n# Running custom installation scripts\n';
        for (const scriptName of scriptsList) {
          const scriptContent = await utils.fetchText(`../sw/scripts/${scriptName}.sh`);
          if (scriptContent) {
            script += `\n# Script: ${scriptName}\n`;
            script += scriptContent + '\n';
          }
        }
      }

      script += '\n# Installation complete!\n';
      script += 'echo "✅ Installation completed successfully!"\n';

      // Download script
      const blob = new Blob([script], { type: 'text/plain' });
      const filename = `ubuntu-setup-${Date.now().toString(16)}.sh`;
      utils.downloadBlob(blob, filename);

      this.scriptStatus.textContent = `✅ Script downloaded: ${filename}`;
    } catch (error) {
      console.error('Error generating script:', error);
      this.scriptStatus.textContent = `❌ Error: ${error.message}`;
    } finally {
      this.generateBtn.disabled = false;
    }
  }
};

// Initialize application
async function initApp() {
  try {
    console.log('Starting application...');
    await appState.load();
    ui.init();
    appState.updateUI();
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('mainContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-text">Error loading configuration. Please check the console.</div>
      </div>
    `;
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
