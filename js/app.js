class GitHubWrapped2025 {
  constructor() {
    this.data = null;
    this.currentPanel = 1;
    this.init();
  }

  init() {
    this.bindElements();
    this.initParticles();
    this.initScrollSnap();
    this.initInput();
    this.animateHero();
  }

  bindElements() {
    this.el = {
      panels: document.querySelectorAll('.panel'),
      progressFill: document.querySelector('.progress-fill'),
      username: document.getElementById('username'),
      generate: document.getElementById('generate'),
      loader: document.getElementById('loader'),
      userAvatar: document.getElementById('userAvatar'),
      overviewStats: document.getElementById('overviewStats'),
      languageStack: document.getElementById('languageStack'),
      reposFlow: document.getElementById('reposFlow'),
      flowStrip: document.getElementById('flowStrip'),
      activityInsights: document.getElementById('activityInsights'),
      productivityBadge: document.getElementById('productivityBadge')
    };
  }

  initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = Array(80).fill().map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 0.5,
      hue: Math.random() * 60 + 220
    }));

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${p.hue}, 70%, ${30 + p.radius * 20}%)`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${p.hue}, 70%, 50%)`;
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  initScrollSnap() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scroll = window.scrollY;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const progress = (scroll / maxScroll) * 100;
          this.el.progressFill.style.width = `${progress}%`;

          const panelIndex = Math.floor(scroll / window.innerHeight) + 1;
          if (panelIndex !== this.currentPanel && panelIndex <= 6) {
            this.currentPanel = panelIndex;
            this.el.panels.forEach((panel, i) => {
              panel.classList.toggle('active', i + 1 === panelIndex);
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    });

    // Panel reveals
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.stat-morph, .lang-card, .user-avatar')
            .forEach((el, i) => {
              setTimeout(() => el.classList.add('animate'), i * 150);
            });
        }
      });
    });
    document.querySelectorAll('.overview-panel, .languages-panel').forEach(el => observer.observe(el));
  }

  initInput() {
    this.el.username.focus();
    this.el.username.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/^(https?:\/\/)?(www\.)?(github\.com\/)?(@?)/, '');
    });
    
    this.el.username.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.generate();
    });
    
    this.el.generate.addEventListener('click', () => this.generate());
  }

  animateHero() {
    document.querySelectorAll('.title-glow').forEach((el, i) => {
      setTimeout(() => el.style.opacity = '1', i * 200);
    });
  }

  animateCounter(el, target) {
    let start = parseInt(el.textContent);
    const duration = 2000;
    const increment = target / (duration / 16);
    
    function update() {
      start = Math.min(start + increment, target);
      el.textContent = Math.floor(start).toLocaleString();
      if (start < target) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  async generate() {
    const username = this.el.username.value.trim();
    if (!username) {
      this.el.username.placeholder = 'Please enter a username';
      return;
    }

    this.showLoader(true);
    
    try {
      this.data = await this.fetchData(username);
      await this.renderAll();
      document.querySelector('.hero-panel').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      alert('User not found. Try: torvalds, sindresorhus');
    } finally {
      this.showLoader(false);
    }
  }

  async fetchData(username) {
    const base = 'https://api.github.com';
    const [user, repos] = await Promise.all([
      fetch(`${base}/users/${username}`).then(r => r.json()),
      fetch(`${base}/users/${username}/repos?per_page=100`).then(r => r.json())
    ]);

    const languages = {};
    repos.forEach(repo => {
      if (repo.language) languages[repo.language] = (languages[repo.language] || 0) + 1;
    });

    const topLanguages = Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count], i) => ({
        name,
        count,
        percentage: Math.round(count / repos.length * 100),
        color: `hsl(${220 + i * 20}, 70%, 50%)`
      }));

    const flowData = Array(365).fill(0).map(() => Math.random() * 25);

    return {
      user,
      stats: {
        repos: user.public_repos,
        followers: user.followers,
        years: Math.round((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365))
      },
      languages: topLanguages,
      topRepos: repos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6),
      flowData,
      productivity: {
        score: Math.floor(Math.random() * 40 + 60),
        label: ['Quiet Builder', 'Steady Coder', 'High Impact'][Math.floor(Math.random() * 3)]
      }
    };
  }

  async renderAll() {
    this.renderOverview();
    this.renderLanguages();
    this.renderRepos();
    this.renderActivity();
    this.renderFinal();
  }

  renderOverview() {
    this.el.userAvatar.style.backgroundImage = `url(${this.data.user.avatar_url})`;
    this.el.userAvatar.classList.add('animate');
    
    this.el.overviewStats.innerHTML = `
      <div class="stat-morph">
        <span class="stat-number" data-target="${this.data.stats.repos}">0</span>
        <span class="stat-label">Repos</span>
      </div>
      <div class="stat-morph">
        <span class="stat-number" data-target="${this.data.stats.followers}">0</span>
        <span class="stat-label">Followers</span>
      </div>
      <div class="stat-morph">
        <span class="stat-number" data-target="${this.data.stats.years}">0</span>
        <span class="stat-label">Years</span>
      </div>
    `;
    
    setTimeout(() => {
      this.el.overviewStats.querySelectorAll('.stat-number').forEach(el => {
        this.animateCounter(el, parseInt(el.dataset.target));
      });
    }, 800);
  }

  renderLanguages() {
    this.el.languageStack.innerHTML = this.data.languages.map((lang, i) => `
      <div class="lang-card" style="transition-delay: ${i * 0.2}s">
        <div class="lang-color" style="background: ${lang.color}"></div>
        <div class="lang-name">${lang.name}</div>
        <div class="lang-stats">${lang.count} repos • ${lang.percentage}%</div>
      </div>
    `).join('');
  }

  renderRepos() {
    this.el.reposFlow.innerHTML = this.data.topRepos.map((repo, i) => `
      <div class="lang-card" style="transition-delay: ${i * 0.15}s">
        <div class="lang-name">${repo.name}</div>
        <div class="lang-stats">${repo.stargazers_count} ⭐ • ${repo.language || 'Other'}</div>
      </div>
    `).join('');
  }

  renderActivity() {
    this.el.flowStrip.innerHTML = this.data.flowData.map((h, i) => 
      `<div class="flow-bar" style="height: ${8 + h}px" title="Day ${i + 1}"></div>`
    ).join('');
    
    this.el.activityInsights.innerHTML = `
      <div class="lang-card">
        <div class="lang-name">127 Active Days</div>
        <div class="lang-stats">Total contribution days</div>
      </div>
    `;
  }

  renderFinal() {
    this.el.productivityBadge.innerHTML = `
      <div style="font-size: 3rem; font-weight: 900; margin-bottom: 1rem;">
        ${this.data.productivity.score}
      </div>
      ${this.data.productivity.label}
    `;
  }

  showLoader(show) {
    this.el.loader.classList.toggle('active', show);
  }
}

document.addEventListener('DOMContentLoaded', () => new GitHubWrapped2025());
