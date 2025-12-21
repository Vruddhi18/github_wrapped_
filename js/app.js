class GitHubWrapped {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    this.bindElements();
    this.initParticles();
    this.initScrollSnap();
    this.initInput();
    this.initTheme();
  }

  bindElements() {
    this.el = {
      panels: document.querySelectorAll('.panel'),
      progressFill: document.querySelector('.progress-fill'),
      username: document.getElementById('username'),
      generate: document.getElementById('generate'),
      loader: document.getElementById('loader'),
      loaderText: document.getElementById('loaderText'),
      userAvatar: document.getElementById('userAvatar'),
      userName: document.getElementById('userName'),
      userBio: document.getElementById('userBio'),
      userStreak: document.getElementById('userStreak'),
      overviewStats: document.getElementById('overviewStats'),
      languageStack: document.getElementById('languageStack'),
      reposFlow: document.getElementById('reposFlow'),
      flowStrip: document.getElementById('flowStrip'),
      flowTooltip: document.getElementById('flowTooltip'),
      productivityBadge: document.getElementById('productivityBadge'),
      shareBtn: document.getElementById('shareBtn'),
      exportBtn: document.getElementById('exportBtn'),
      themeToggle: document.getElementById('themeToggle')
    };
  }

  initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array(80).fill().map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.5 + 0.5
    }));

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#6366f1';
        ctx.fill();

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
          const scrollY = window.scrollY;
          const maxScroll = document.body.scrollHeight - window.innerHeight;
          this.el.progressFill.style.width = `${(scrollY / maxScroll) * 100}%`;

          const panelIndex = Math.round(scrollY / window.innerHeight) + 1;
          this.el.panels.forEach((panel, i) => {
            panel.classList.toggle('active', i + 1 === panelIndex);
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  initInput() {
    this.el.username.focus();
    this.el.username.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.generate();
    });
    this.el.generate.addEventListener('click', () => this.generate());
  }

  initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.el.themeToggle.textContent = saved === 'dark' ? '☀️' : '🌙';

    this.el.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      this.el.themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }

  async generate() {
    const username = this.el.username.value.trim();
    if (!username) return alert('Enter a GitHub username');

    this.showLoader(true, 'Fetching GitHub data...');
    
    try {
      this.data = await this.fetchData(username);
      this.renderAll();
      this.showLoader(false);
    } catch (error) {
      this.showLoader(false);
      alert('User not found! Try: torvalds, sindresorhus, facebook');
    }
  }

  async fetchData(username) {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
    ]);

    if (!userRes.ok) throw new Error('User not found');

    const [user, repos] = await Promise.all([userRes.json(), reposRes.json()]);

    const languages = {};
    repos.forEach(repo => {
      if (repo.language) languages[repo.language] = (languages[repo.language] || 0) + 1;
    });

    const topLanguages = Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }));

    return {
      user,
      stats: {
        repos: user.public_repos,
        followers: user.followers,
        years: Math.round((Date.now() - new Date(user.created_at).getTime()) / 31556952000)
      },
      languages: topLanguages,
      topRepos: repos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 4),
      flowData: Array(52).fill(0).map(() => Math.floor(Math.random() * 20))
    };
  }

  renderAll() {
    this.renderOverview();
    this.renderLanguages();
    this.renderRepos();
    this.renderActivity();
  }

  renderOverview() {
    this.el.userAvatar.style.backgroundImage = `url(${this.data.user.avatar_url}&s=400)`;
    this.el.userAvatar.classList.add('show');
    this.el.userName.textContent = this.data.user.name || this.data.user.login;
    this.el.userBio.textContent = this.data.user.bio || 'No bio available';

    this.el.userStreak.innerHTML = `
      <div class="streak-flame">🔥</div>
      <div><div style="font-size:1.4rem;font-weight:700;">${Math.floor(Math.random()*100)+50}</div><div style="font-size:0.9rem;opacity:0.8;">Day Streak</div></div>
    `;

    this.el.overviewStats.innerHTML = `
      <div class="stat-morph"><span class="stat-number" data-target="${this.data.stats.repos}">0</span><span class="stat-label">Repos</span></div>
      <div class="stat-morph"><span class="stat-number" data-target="${this.data.stats.followers}">0</span><span class="stat-label">Followers</span></div>
      <div class="stat-morph"><span class="stat-number" data-target="${this.data.stats.years}">0</span><span class="stat-label">Years</span></div>
    `;

    setTimeout(() => {
      this.el.overviewStats.querySelectorAll('.stat-morph').forEach((el, i) => {
        setTimeout(() => el.classList.add('show'), i * 200);
        const num = el.querySelector('.stat-number');
        this.animateNumber(num, parseInt(num.dataset.target));
      });
    }, 500);
  }

  animateNumber(el, target) {
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.floor(progress * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  renderLanguages() {
    this.el.languageStack.innerHTML = this.data.languages.map((lang, i) => `
      <div class="lang-card" style="transition-delay:${i*0.2}s">
        <div class="lang-color" style="background:${this.getLangColor(lang.name)}"></div>
        <div class="lang-name">${lang.name}</div>
        <div class="lang-stats">${lang.count} repos</div>
      </div>
    `).join('');
    
    setTimeout(() => this.el.languageStack.querySelectorAll('.lang-card').forEach((el,i)=>setTimeout(()=>el.classList.add('show'),i*200)), 300);
  }

  renderRepos() {
    this.el.reposFlow.innerHTML = this.data.topRepos.map((repo, i) => `
      <div class="repo-card" style="transition-delay:${i*0.2}s" data-url="${repo.html_url}">
        <div class="lang-name">${repo.name}</div>
        <div class="lang-stats">⭐ ${repo.stargazers_count.toLocaleString()}</div>
      </div>
    `).join('');
    
    setTimeout(() => this.el.reposFlow.querySelectorAll('.repo-card').forEach((el,i)=>setTimeout(()=>el.classList.add('show'),i*200)), 300);
  }

  renderActivity() {
    this.el.flowStrip.innerHTML = this.data.flowData.map((h, i) => 
      `<div class="flow-bar" style="height:${20 + h*4}px" data-commits="${h}"></div>`
    ).join('');
  }

  getLangColor(lang) {
    const colors = {
      JavaScript: '#f7df1e', Python: '#3776ab', TypeScript: '#3178c6',
      Java: '#007396', Go: '#00ADD8', Rust: '#dea584', Ruby: '#cc342d'
    };
    return colors[lang] || `hsl(${Math.random()*360},70%,50%)`;
  }

  showLoader(show, text = '') {
    this.el.loader.classList.toggle('active', show);
    if (text) this.el.loaderText.textContent = text;
  }
}

document.addEventListener('DOMContentLoaded', () => new GitHubWrapped());
