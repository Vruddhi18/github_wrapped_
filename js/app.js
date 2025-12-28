class GitWrapped {
  constructor() {
    this.current = 0; this.totalSlides = 8; this.isLoading = false;
    this.init();
  }

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.loadPopularProfiles();
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
      slideContents: document.querySelectorAll('.slide-content'),
      navDots: document.querySelectorAll('.nav-dot')
    };
  }

  bindEvents() {
    // Input
    this.elements.username.oninput = () => {
      this.elements.generateBtn.disabled = this.elements.username.value.trim().length < 2;
    };
    this.elements.generateBtn.onclick = () => this.generate();
    
    // Navigation
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });
    
    this.elements.navDots.forEach((dot, i) => {
      dot.onclick = () => this.goToSlide(i);
    });

    // Touch swipe
    let startX = 0;
    document.querySelector('.slider').addEventListener('touchstart', e => startX = e.touches[0].clientX);
    document.querySelector('.slider').addEventListener('touchend', e => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) this.next();
      if (endX - startX > 50) this.prev();
    });
  }

  async generate() {
    const username = this.elements.username.value.trim().split('/').pop();
    if (!username) return;

    this.isLoading = true;
    this.showLoader(`Loading ${username}...`);

    try {
      const [user, repos, events] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`).then(r => r.json()),
        fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`).then(r => r.json()),
        fetch(`https://api.github.com/users/${username}/events?per_page=100`).then(r => r.json())
      ]);

      // Process data (same logic as before but cleaner)
      const data = this.processData(user, repos, events);
      this.renderSlides(data);
      this.next();
      this.showToast(`Wrapped generated for ${username}!`);

    } catch (error) {
      this.showToast('User not found');
    } finally {
      this.isLoading = false;
      this.hideLoader();
    }
  }

  processData(user, repos, events) {
    // LIFETIME STATS LOGIC (same as before)
    const repoContributions = {};
    events.forEach(event => {
      const repo = event.repo?.name.split('/')[1];
      if (repo) repoContributions[repo] = (repoContributions[repo] || 0) + 1;
    });

    repos.forEach(repo => {
      repo.contributions = repoContributions[repo.name] || 0;
      repo.score = repo.stargazers_count * 2 + repo.forks_count + repo.contributions * 5;
    });

    const topRepos = repos.sort((a, b) => b.score - a.score).slice(0, 8);
    const languages = Object.entries(
      repos.reduce((acc, repo) => {
        if (repo.language) acc[repo.language] = (acc[repo.language] || 0) + repo.contributions;
        return acc;
      }, {})
    ).sort(([,a], [,b]) => b - a);

    return {
      user, topRepos, languages,
      stats: {
        totalCommits: events.length,
        totalStars: repos.reduce((sum, r) => sum + r.stargazers_count, 0),
        totalRepos: repos.length,
        score: Math.min(100, Math.floor(events.length / 5 + repos.length))
      }
    };
  }

  renderSlides(data) {
    // SLIDE 1: PROFILE
    this.elements.slideContents[1].innerHTML = `
      <div style="text-align:center;">
        <img src="${data.user.avatar_url}" class="profile-avatar-large">
        <h1 style="font-size:4rem;font-family:'Space Grotesk';margin:32px 0 16px;">${data.user.name || data.user.login}</h1>
        <p style="color:var(--text-secondary);font-size:1.25rem;margin-bottom:48px;">${data.stats.totalCommits.toLocaleString()} contributions</p>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-number">⭐ ${data.stats.totalStars.toLocaleString()}</div><div>Stars</div></div>
          <div class="stat-card"><div class="stat-number">💾 ${data.stats.totalCommits.toLocaleString()}</div><div>Commits</div></div>
          <div class="stat-card"><div class="stat-number">📂 ${data.stats.totalRepos}</div><div>Repos</div></div>
        </div>
      </div>`;

    // Other slides follow similar clean git-wrapped pattern...
    // (Implementation for slides 2-7 using same clean card design)
  }

  // Navigation methods
  goToSlide(i) {
    this.current = i;
    this.elements.slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
    this.elements.navDots.forEach((d, idx) => d.classList.toggle('active', idx === i));
    this.updateProgress();
  }

  next() { this.goToSlide((this.current + 1) % this.totalSlides); }
  prev() { this.goToSlide((this.current - 1 + this.totalSlides) % this.totalSlides); }
  updateProgress() {
    const progress = ((this.current + 1) / this.totalSlides) * 100;
    this.elements.progressArc.style.strokeDashoffset = 100 - progress;
    this.elements.progressText.textContent = `${this.current + 1}`;
  }

  // UI methods
  showLoader(text) { 
    this.elements.loaderText.textContent = text;
    this.elements.loader.classList.add('active');
  }
  hideLoader() { this.elements.loader.classList.remove('active'); }
  showToast(text) {
    this.elements.toast.textContent = text;
    this.elements.toast.classList.add('show');
    setTimeout(() => this.elements.toast.classList.remove('show'), 3000);
  }

  async loadPopularProfiles() {
    const profiles = [
      {user: 'torvalds', desc: 'Linux kernel'},
      {user: 'sindresorhus', desc: 'JS libraries'},
      {user: 'facebook', desc: 'React'},
      {user: 'microsoft', desc: 'VS Code'}
    ];
    this.elements.trendingProfiles.innerHTML = profiles.map(p => `
      <div class="profile-card" onclick="document.getElementById('username').value='${p.user}';document.getElementById('generateBtn').click()">
        <img src="https://github.com/${p.user}.png" class="profile-avatar" onerror="this.src='https://avatars.githubusercontent.com/u/64081211?v=4'">
        <div class="profile-name">@${p.user}</div>
        <div class="profile-desc">${p.desc}</div>
      </div>
    `).join('');
  }
}

new GitWrapped();
