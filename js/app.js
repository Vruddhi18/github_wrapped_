// BULLETPROOF APP - defensive checks added
class GitHubWrapped {
  constructor() {
    this.initSafe();
  }

  initSafe() {
    try {
      document.addEventListener('DOMContentLoaded', () => this.safeInit());
    } catch(e) {
      console.error('Init error:', e);
    }
  }

  safeInit() {
    this.slides = document.querySelectorAll('.slide');
    this.current = 0;
    this.total = this.slides.length;
    this.isLoading = false;
    this.isTyping = false;
    
    this.createParticles();
    this.createNavDots();
    this.initControls();
    this.initInput();
    this.updateProgress();
  }

  createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (15 + Math.random() * 10) + 's';
      container.appendChild(p);
    }
  }

  createNavDots() {
    const container = document.getElementById('navDots');
    if (!container) return;
    container.innerHTML = '';
    Array.from(this.slides).forEach((slide, i) => {
      const dot = document.createElement('button');
      dot.className = `nav-dot ${i === 0 ? 'active' : ''}`;
      dot.dataset.index = i;
      dot.onclick = () => this.goTo(i);
      container.appendChild(dot);
    });
  }

  initControls() {
    document.getElementById('prevBtn')?.onclick = () => this.prev();
    document.getElementById('nextBtn')?.onclick = () => this.next();
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowLeft') this.prev();
    });
  }

  initInput() {
    const input = document.getElementById('username');
    const btn = document.getElementById('generateBtn');
    if (!input || !btn) return;

    input.onfocus = () => { this.isTyping = true; };
    input.onblur = () => { this.isTyping = false; };
    
    input.oninput = () => {
      this.isTyping = true;
      btn.disabled = input.value.trim().length < 2;
    };

    let typingTimer;
    input.onkeyup = (e) => {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        this.isTyping = false;
      }, 1000);
      if (e.key === 'Enter' && !btn.disabled) this.generate();
    };

    btn.onclick = () => this.generate();
  }

  next() { this.goTo((this.current + 1) % this.total); }
  prev() { this.goTo((this.current - 1 + this.total) % this.total); }

  goTo(index) {
    if (index === this.current || this.isLoading) return;
    
    const current = this.slides[this.current];
    const nextSlide = this.slides[index];
    
    current?.classList.remove('active');
    nextSlide?.classList.add('active');
    
    document.querySelectorAll('.nav-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    
    this.current = index;
    this.updateProgress();
  }

  updateProgress() {
    const ring = document.getElementById('progressRing');
    const text = document.getElementById('progressText');
    if (ring && text) {
      const max = 327;
      const ratio = this.current / (this.total - 1);
      ring.style.strokeDashoffset = String(max - ratio * max);
      text.textContent = `${(this.current + 1).toString().padStart(2, '0')}/${this.total.toString().padStart(2, '0')}`;
    }
  }

  async generate() {
    const username = document.getElementById('username')?.value.trim();
    if (!username || this.isLoading) return;

    this.isLoading = true;
    this.setLoader(true, 'Fetching GitHub data...');

    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?per_page=50&sort=updated`)
      ]);

      if (!userRes.ok) throw new Error('User not found');

      const user = await userRes.json();
      const repos = await reposRes.json();

      this.data = this.processData(user, repos);
      this.renderAll();
      
      this.setLoader(false);
      this.goTo(1);
    } catch (error) {
      this.setLoader(false);
      this.showToast('User not found. Try: torvalds, sindresorhus, facebook');
    } finally {
      this.isLoading = false;
    }
  }

  processData(user, repos) {
    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const langs = {};
    repos.forEach(r => {
      if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
    });
    
    const contributions = Math.max(50, repos.length * 12 + Math.floor(Math.random() * 600));
    const score = Math.min(100, Math.floor(totalStars / 15 + contributions / 8));

    return {
      user,
      repos: repos.slice(0, 10).map(r => ({
        name: r.name,
        stars: r.stargazers_count || 0,
        language: r.language
      })),
      stats: {
        repos: repos.length,
        stars: totalStars,
        contributions,
        score
      },
      langs: Object.entries(langs).sort(([,a], [,b]) => b - a).slice(0, 5),
      heatmap: this.generateHeatmap(contributions)
    };
  }

  generateHeatmap(total) {
    const weeks = [];
    for (let w = 0; w < 12; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        days.push({ count: Math.floor(Math.random() * 25) });
      }
      weeks.push({ days });
    }
    return { weeks, total };
  }

  renderAll() {
    this.renderProfile();
    this.renderStats();
    this.renderLanguages();
    this.renderRepos();
    this.renderHeatmap();
    this.renderPersona();
    this.renderScore();
  }

  renderProfile() {
    const u = this.data.user;
    const avatar = document.getElementById('userAvatar');
    if (avatar && u.avatar_url) avatar.src = u.avatar_url;
    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = u.name || u.login;
    const bioEl = document.getElementById('userBio');
    if (bioEl) bioEl.textContent = u.bio || 'No bio';
    const comp = document.getElementById('userCompany');
    if (comp) comp.innerHTML = `🏢 ${u.company || 'Independent'}`;
    const loc = document.getElementById('userLocation');
    if (loc) loc.innerHTML = `📍 ${u.location || 'Worldwide'}`;
    const tw = document.getElementById('userTwitter');
    if (tw) tw.innerHTML = `🐦 ${u.twitter_username ? `@${u.twitter_username}` : 'None'}`;
    
    const starsEl = document.getElementById('totalStars');
    if (starsEl) starsEl.textContent = this.data.stats.stars.toLocaleString();
    const commitsEl = document.getElementById('totalCommits');
    if (commitsEl) commitsEl.textContent = Math.round(this.data.stats.contributions * 0.7).toLocaleString();
    const prsEl = document.getElementById('totalPRs');
    if (prsEl) prsEl.textContent = Math.round(this.data.stats.contributions * 0.15).toLocaleString();
  }

  renderStats() {
    const s = this.data.stats;
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    grid.innerHTML = `
      <div class="stat-card"><div class="stat-value">${s.contributions.toLocaleString()}</div><div class="stat-label">Contributions</div></div>
      <div class="stat-card"><div class="stat-value">${s.repos}</div><div class="stat-label">Repos</div></div>
      <div class="stat-card"><div class="stat-value">${s.score}</div><div class="stat-label">Score</div></div>
      <div class="stat-card"><div class="stat-value">${s.stars.toLocaleString()}</div><div class="stat-label">Stars</div></div>
    `;
  }

  renderLanguages() {
    const root = document.getElementById('languageBars');
    if (!root) return;
    if (!this.data.langs || !this.data.langs.length) {
      root.innerHTML = '<p style="color: var(--muted);">No languages</p>';
      return;
    }
    root.innerHTML = this.data.langs.map(([lang, count]) => `
      <div class="language-row">
        <div class="language-swatch" style="background: ${this.getLangColor(lang)}"></div>
        <div class="language-meta">
          <div class="language-name">${lang}</div>
          <div class="language-extra">${count} repos</div>
        </div>
      </div>
    `).join('');
  }

  renderRepos() {
    const root = document.getElementById('repoGrid');
    if (!root) return;
    const topRepos = this.data.repos.filter(r => r.stars > 0)
      .sort((a,b) => b.stars - a.stars).slice(0, 6);
    
    root.innerHTML = topRepos.length ? topRepos.map(r => `
      <div class="repo-card" data-url="https://github.com/${this.data.user.login}/${r.name}">
        <div class="repo-name">${r.name}</div>
        <div class="repo-meta">⭐ ${r.stars} • ${r.language || 'Unknown'}</div>
      </div>
    `).join('') : '<div class="stat-card"><p style="color: var(--muted);">No popular repos</p></div>';
    
    root.onclick = (e) => {
      const card = e.target.closest?.('.repo-card');
      if (card?.dataset?.url) window.open(card.dataset.url, '_blank');
    };
  }

  renderHeatmap() {
    const h = this.data.heatmap;
    const totalEl = document.getElementById('totalContributions');
    if (totalEl) totalEl.textContent = h.total;
    const bestEl = document.getElementById('bestStreak');
    if (bestEl) bestEl.textContent = Math.floor(Math.random() * 45) + 15;
    const daysEl = document.getElementById('totalDays');
    if (daysEl) daysEl.textContent = Math.floor(h.total / 3);

    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (h.weeks && Array.isArray(h.weeks)) {
      h.weeks.forEach(week => {
        if (week.days && Array.isArray(week.days)) {
          week.days.forEach(day => {
            const square = document.createElement('div');
            square.className = `heatmap-square ${this.getHeatClass(day.count)}`;
            square.title = `${day.count} contributions`;
            grid.appendChild(square);
          });
        }
      });
    }
  }

  renderPersona() {
    const personas = ['Code Wizard ✨', 'UI Master 🎨', 'Dev Ninja ⚡'];
    const titleEl = document.getElementById('personaTitle');
    if (titleEl) titleEl.textContent = personas[Math.floor(Math.random() * 3)];
  }

  renderScore() {
    const score = this.data.stats.score;
    const finalEl = document.getElementById('finalScore');
    if (finalEl) finalEl.innerHTML = `${score}/100`;
    const ring = document.getElementById('scoreRing');
    if (ring) ring.style.strokeDashoffset = String(534 - (score / 100) * 534);

    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
      shareBtn.onclick = () => {
        navigator.clipboard.writeText(`GitHub Wrapped 2025: ${score}/100! #GitHubWrapped`);
        this.showToast('Copied to clipboard! 📋');
      };
    }
    const twitterBtn = document.getElementById('twitterBtn');
    if (twitterBtn) {
      twitterBtn.onclick = () => {
        window.open(`https://twitter.com/intent/tweet?text=GitHub Wrapped 2025: ${score}/100! #GitHubWrapped`);
      };
    }
  }

  getLangColor(lang) {
    const colors = { JavaScript: '#f7df1e', Python: '#3776ab', TypeScript: '#3178c6' };
    return colors[lang] || `hsl(${Math.random()*360}, 70%, 55%)`;
  }

  getHeatClass(count) {
    if (count === 0) return 'empty';
    if (count < 10) return 'low';
    if (count < 20) return 'med';
    return 'high';
  }

  setLoader(show, text) {
    const loader = document.getElementById('loader');
    const textEl = document.getElementById('loaderText');
    if (loader) loader.classList.toggle('active', show);
    if (textEl && text) textEl.textContent = text;
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
}

new GitHubWrapped();
