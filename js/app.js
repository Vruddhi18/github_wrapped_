class GitWrapped {
  constructor() {
    this.current = 0; this.totalSlides = 8; this.isLoading = false; this.data = null;
    this.startX = 0;
    this.init();
  }

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.loadProfiles();
    this.initScrollAnimation();
    this.createParticles();
  }

  cacheDOM() {
    this.elements = {
      slides: document.querySelectorAll('.slide'),
      username: document.getElementById('username'),
      generateBtn: document.getElementById('generateBtn'),
      progressArc: document.getElementById('progressArc'),
      progressText: document.getElementById('progressText'),
      loader: document.getElementById('loader'),
      loaderText: document.getElementById('loaderText'),
      toast: document.getElementById('toast'),
      trendingProfiles: document.getElementById('trendingProfiles'),
      navDots: document.querySelectorAll('.nav-dot'),
      profileContent: document.getElementById('profileContent'),
      statsTitle: document.getElementById('statsTitle'),
      statsGrid: document.getElementById('statsGrid'),
      languagesGrid: document.getElementById('languagesGrid'),
      reposGrid: document.getElementById('reposGrid'),
      heatmapGrid: document.getElementById('heatmapGrid'),
      totalCommits: document.getElementById('totalCommits'),
      personaContent: document.getElementById('personaContent'),
      scoreContent: document.getElementById('scoreContent')
    };
  }

  bindEvents() {
    this.elements.username.oninput = () => {
      const val = this.elements.username.value.trim();
      this.elements.generateBtn.disabled = val.length < 2;
    };
    this.elements.username.onkeyup = (e) => {
      if (e.key === 'Enter' && !this.elements.generateBtn.disabled) this.generate();
    };
    this.elements.generateBtn.onclick = () => this.generate();

    document.addEventListener('keydown', (e) => {
      if (this.isLoading) return;
      if (e.key === 'ArrowRight' || e.key === ' ') this.next();
      if (e.key === 'ArrowLeft') this.prev();
    });

    this.elements.navDots.forEach((dot, i) => {
      dot.onclick = () => this.goToSlide(i);
    });

    // Touch swipe
    const slider = document.querySelector('.slider');
    slider.addEventListener('touchstart', (e) => this.startX = e.touches[0].clientX);
    slider.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      if (Math.abs(this.startX - endX) > 50) {
        if (this.startX > endX) this.next(); else this.prev();
      }
    });
  }

  async generate() {
    const username = this.elements.username.value.trim().split('/').pop();
    if (!username || username.length < 2) {
      this.showToast('Enter valid GitHub username');
      return;
    }

    this.isLoading = true;
    this.showLoader(`Analyzing ${username}...`);

    try {
      const [userRes, reposRes, eventsRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
        fetch(`https://api.github.com/users/${username}/events/public?per_page=100`)
      ]);

      if (!userRes.ok) throw new Error('User not found');

      const user = await userRes.json();
      const repos = await reposRes.json();
      const events = await eventsRes.json();

      this.data = this.processData(user, repos, events);
      this.renderAllSlides();
      this.next();
      this.showToast(`✅ Wrapped ready for ${username}!`);

    } catch (error) {
      this.showToast('User not found or private repos');
    } finally {
      this.isLoading = false;
      this.hideLoader();
    }
  }

  processData(user, repos, events) {
    const repoContributions = {};
    events.forEach(event => {
      if (event.repo?.name.startsWith(`${user.login}/`)) {
        const repoName = event.repo.name.split('/')[1];
        repoContributions[repoName] = (repoContributions[repoName] || 0) + 1;
      }
    });

    repos.forEach(repo => {
      repo.contributions = repoContributions[repo.name] || 0;
      repo.score = (repo.stargazers_count || 0) * 2 + (repo.forks_count || 0) + repo.contributions * 5;
    });

    const topRepos = repos.filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
    const languages = Object.entries(
      repos.reduce((acc, repo) => {
        if (repo.language) acc[repo.language] = (acc[repo.language] || 0) + repo.contributions;
        return acc;
      }, {})
    ).sort(([,a], [,b]) => b - a).slice(0, 12);

    return {
      user,
      topRepos,
      languages,
      stats: {
        totalCommits: events.length,
        totalStars: repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0),
        totalRepos: repos.length,
        totalLanguages: languages.length,
        score: Math.min(100, Math.floor(events.length / 3 + repos.length / 2))
      }
    };
  }

  renderAllSlides() {
    // SLIDE 1: PROFILE
    this.elements.profileContent.innerHTML = `
      <img src="${this.data.user.avatar_url}" style="width:140px;height:140px;border-radius:50%;border:3px solid rgba(255,255,255,0.2);margin-bottom:32px;">
      <h1 style="font-size:4rem;font-family:'Space Grotesk';margin-bottom:20px;">${this.data.user.name || this.data.user.login}</h1>
      <p style="color:var(--text-secondary);font-size:1.4rem;margin-bottom:48px;">${this.data.stats.totalCommits.toLocaleString()} contributions</p>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-number">⭐ ${this.data.stats.totalStars.toLocaleString()}</div><div>Stars</div></div>
        <div class="stat-card"><div class="stat-number">💾 ${this.data.stats.totalCommits.toLocaleString()}</div><div>Commits</div></div>
        <div class="stat-card"><div class="stat-number">📂 ${this.data.stats.totalRepos}</div><div>Repos</div></div>
      </div>`;

    // SLIDE 2: STATS
    this.elements.statsTitle.textContent = `${this.data.user.login}'s 2025`;
    const stats = this.elements.statsGrid.children;
    stats[0].innerHTML = `<div class="stat-number">${this.data.stats.totalCommits.toLocaleString()}</div><div>Commits</div>`;
    stats[1].innerHTML = `<div class="stat-number">${this.data.stats.totalStars.toLocaleString()}</div><div>Stars</div>`;
    stats[2].innerHTML = `<div class="stat-number">${this.data.stats.totalRepos}</div><div>Repos</div>`;
    stats[3].innerHTML = `<div class="stat-number">${this.data.stats.totalLanguages}</div><div>Languages</div>`;

    // SLIDE 3: LANGUAGES
    this.elements.languagesGrid.innerHTML = this.data.languages.map(([lang, count], i) => `
      <div class="lang-card">
        <div class="lang-color" style="background:${this.getLangColor(lang)}"></div>
        <div class="lang-info">
          <h4>${lang}</h4>
          <p>${count} contributions • #${i + 1}</p>
        </div>
      </div>
    `).join('') || '<p style="color:var(--text-secondary);">No languages found</p>';

    // SLIDE 4: TOP REPOS
    this.elements.reposGrid.innerHTML = this.data.topRepos.slice(0, 6).map((repo, i) => `
      <div class="repo-card" onclick="window.open('https://github.com/${this.data.user.login}/${repo.name}')">
        <div style="width:60px;height:60px;background:linear-gradient(135deg,var(--accent),#8b5cf6);border-radius:16px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;color:white;margin-right:20px;">#${i+1}</div>
        <div style="flex:1;text-align:left;">
          <h4 style="font-size:1.3rem;font-weight:700;margin-bottom:4px;">${repo.name}</h4>
          <p class="repo-desc">⭐ ${repo.stargazers_count || 0} stars • 💾 ${repo.contributions} contributions</p>
        </div>
      </div>
    `).join('');

    // SLIDE 5: HEATMAP
    this.elements.totalCommits.textContent = `${this.data.stats.totalCommits.toLocaleString()}`;
    const grid = this.elements.heatmapGrid;
    grid.innerHTML = '';
    for (let i = 0; i < 364; i++) {
      const activity = Math.floor(Math.random() * 4);
      const square = document.createElement('div');
      square.className = `heatmap-square ${activity === 0 ? 'empty' : activity === 1 ? 'low' : activity === 2 ? 'medium' : 'high'}`;
      square.title = `${activity * 5} contributions`;
      grid.appendChild(square);
    }

    // SLIDE 6: PERSONA
    const personas = [
      { icon: '🧠', title: 'Code Architect', desc: 'You design complex systems with precision' },
      { icon: '⚡', title: 'Fullstack Ninja', desc: 'Master of frontend and backend' },
      { icon: '🌟', title: 'Open Source Hero', desc: 'Community builder and contributor' }
    ];
    const persona = personas[Math.floor(Math.random() * 3)];
    this.elements.personaContent.innerHTML = `
      <div class="persona-icon">${persona.icon}</div>
      <div class="persona-title">${persona.title}</div>
      <div class="persona-desc">${persona.desc}</div>
      <div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap;font-size:1.1rem;color:var(--text-secondary);margin-top:32px;">
        <span>⭐ ${this.data.stats.totalStars.toLocaleString()}</span>
        <span>💾 ${this.data.stats.totalCommits.toLocaleString()}</span>
      </div>`;

    // SLIDE 7: SCORE
    this.elements.scoreContent.innerHTML = `
      <div class="score-circle" style="--score-deg:${this.data.stats.score * 3.6}deg">
        <div class="score-inner">
          <div class="score-number">${this.data.stats.score}</div>
          <div style="color:var(--text-secondary);font-size:1.2rem;">/ 100</div>
        </div>
      </div>
      <div class="share-btns">
        <button class="share-btn primary" onclick="navigator.clipboard.writeText('GitHub Wrapped 2025: ${wrappedApp.data.stats.score}/100! github.com/${wrappedApp.data.user.login}')">
          📱 Copy Link
        </button>
        <a class="share-btn secondary" href="https://twitter.com/intent/tweet?text=GitHub Wrapped 2025: ${this.data.stats.score}/100!&url=${window.location.href}" target="_blank">🐦 Twitter</a>
      </div>`;
  }

  getLangColor(lang) {
    const colors = {
      'JavaScript': '#f7df1e', 'TypeScript': '#3178c6', 'Python': '#3776ab',
      'Java': '#007396', 'C++': '#f34b7d', 'Go': '#00add8', 'Rust': '#dea584',
      'PHP': '#777bb4', 'Ruby': '#701516', 'C#': '#9b4f96'
    };
    return colors[lang] || `hsl(${Math.random() * 360}, 70%, 55%)`;
  }

  goToSlide(index) {
    if (index < 0 || index >= this.totalSlides || this.isLoading) return;
    this.elements.slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    this.elements.navDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    this.current = index;
    this.updateProgress();
  }

  next() { this.goToSlide((this.current + 1) % this.totalSlides); }
  prev() { this.goToSlide((this.current - 1 + this.totalSlides) % this.totalSlides); }

  updateProgress() {
    const progress = ((this.current + 1) / this.totalSlides) * 100;
    this.elements.progressArc.style.strokeDashoffset = 100 - progress;
    this.elements.progressText.textContent = this.current + 1;
  }

  showLoader(text) {
    this.elements.loaderText.textContent = text;
    this.elements.loader.classList.add('active');
  }

  hideLoader() {
    this.elements.loader.classList.remove('active');
  }

  showToast(text) {
    this.elements.toast.textContent = text;
    this.elements.toast.classList.add('show');
    setTimeout(() => this.elements.toast.classList.remove('show'), 3000);
  }

  loadProfiles() {
    const profiles = [
      {user: 'torvalds', desc: 'Creator of Linux', img: 'https://avatars.githubusercontent.com/u/1024025?v=4'},
      {user: 'sindresorhus', desc: '1,000+ JS libraries', img: 'https://avatars.githubusercontent.com/u/170230?v=4'},
      {user: 'facebook', desc: 'Creator of React', img: 'https://avatars.githubusercontent.com/u/69631?v=4'},
      {user: 'yyx990803', desc: 'Creator of Vue.js', img: 'https://avatars.githubusercontent.com/u/499550?v=4'},
      {user: 'gaearon', desc: 'Co-author of Redux', img: 'https://avatars.githubusercontent.com/u/810438?v=4'},
      {user: 'taylorotwell', desc: 'Creator of Laravel', img: 'https://avatars.githubusercontent.com/u/463230?v=4'}
    ];

    this.elements.trendingProfiles.innerHTML = profiles.map(profile => `
      <div class="profile-card" onclick="wrappedApp.setUsername('${profile.user}')" title="Click to generate">
        <img src="${profile.img}" class="profile-avatar" loading="lazy">
        <div class="profile-name">@${profile.user}</div>
        <div class="profile-desc">${profile.desc}</div>
      </div>
    `).join('');
  }

  setUsername(username) {
    this.elements.username.value = username;
    this.elements.generateBtn.disabled = false;
    this.generate();
  }

  initScrollAnimation() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('animate');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-scroll]').forEach(el => observer.observe(el));
  }

  createParticles() {
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed; width: ${Math.random() * 3 + 1}px; height: ${Math.random() * 3 + 1}px;
        background: linear-gradient(45deg, rgba(99,102,241,0.6), rgba(139,92,246,0.4));
        border-radius: 50%; left: ${Math.random() * 100}vw;
        animation: float ${20 + Math.random() * 20}s infinite linear;
        animation-delay: ${Math.random() * 20}s; top: ${Math.random() * 100}vh; z-index: 1;
      `;
      document.querySelector('.particles').appendChild(particle);
    }
  }
}

// Global access
window.wrappedApp = new GitWrapped();

// Add float animation
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
`;
document.head.appendChild(style);
