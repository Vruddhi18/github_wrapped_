class GitHubWrapped {
  constructor() {
    this.data = null; this.repos = []; this.currentFilter = 'all'; this.current = 0; this.isLoading = false;
    this.init();
  }

  init() {
    this.cacheElements(); this.bindEvents(); this.addAnimations(); this.loadTrendingRepos(); this.showHints();
  }

  cacheElements() {
    this.elements = {
      slides: document.querySelectorAll('.slide'), username: document.getElementById('username'),
      generateBtn: document.getElementById('generateBtn'), progressArc: document.getElementById('progressArc'),
      progressText: document.getElementById('progressText'), loader: document.getElementById('loader'),
      loaderText: document.getElementById('loaderText'), toast: document.getElementById('toast'),
      trendingRepos: document.getElementById('trendingRepos'), navDots: document.querySelectorAll('.nav-dot'),
      arrowHint: document.getElementById('arrowHint')
    };
    this.totalSlides = this.elements.slides.length;
  }

  bindEvents() {
    // Input
    if (this.elements.username && this.elements.generateBtn) {
      this.elements.username.oninput = () => this.elements.generateBtn.disabled = this.elements.username.value.trim().length < 2;
      this.elements.username.onkeyup = e => e.key === 'Enter' && !this.elements.generateBtn.disabled && this.generateWrapped();
      this.elements.generateBtn.onclick = () => this.generateWrapped();
    }

    // Keyboard + Mobile Nav
    document.addEventListener('keydown', e => {
      if (this.isLoading) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.nextSlide();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') this.prevSlide();
    });

    // Mobile dots
    this.elements.navDots.forEach(dot => {
      dot.onclick = () => this.goToSlide(parseInt(dot.dataset.slide));
    });

    // Filters
    document.addEventListener('click', e => {
      if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.filterRepos();
      }
    });
  }

  async generateWrapped() {
    const username = this.elements.username.value.trim();
    if (!username || username.length < 2) return this.showToast('Enter your GitHub username!');

    this.isLoading = true;
    this.showLoader(true, `Analyzing ${username}'s 2025 activity...`);

    try {
      const [userRes, eventsRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/events?per_page=100`),
        fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
      ]);

      if (!userRes.ok) throw new Error('User not found');

      const user = await userRes.json();
      const events = await eventsRes.json();
      const repos = await reposRes.json();

      // REAL CONTRIBUTION COUNTING
      const contributionsByRepo = {};
      events.forEach(event => {
        if (event.repo?.name) {
          const repoName = event.repo.name.split('/')[1];
          contributionsByRepo[repoName] = (contributionsByRepo[repoName] || 0) + 1;
        }
      });

      repos.forEach(repo => {
        const repoName = repo.name;
        repo.contributions = contributionsByRepo[repoName] || 0;
        repo.totalActivity = (repo.stargazers_count || 0) * 10 + (repo.forks_count || 0) * 5 + repo.contributions;
      });

      // TOP REPOS BY TOTAL ACTIVITY (not just stars)
      const topRepos = repos
        .filter(r => r.contributions > 0 || r.stargazers_count > 0)
        .sort((a, b) => b.totalActivity - a.totalActivity)
        .slice(0, 6);

      // Language analysis
      const languageCount = {};
      repos.forEach(repo => {
        if (repo.language) languageCount[repo.language] = (languageCount[repo.language] || 0) + repo.contributions;
      });
      const topLanguages = Object.entries(languageCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      // REAL TOTALS
      const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
      const totalContributions = events.length + Object.values(contributionsByRepo).reduce((sum, c) => sum + c, 0);
      const score = Math.min(100, Math.floor(totalStars / 5 + totalContributions / 10));

      this.data = { user, topRepos, topLanguages, stats: { totalStars, totalContributions, score, repoCount: repos.length } };

      this.renderAllSlides();
      this.showLoader(false);
      this.goToSlide(1);
      this.elements.arrowHint.textContent = `🎉 ${username}'s Wrapped ready! 👈`;
      this.showToast(`2025 Wrapped: ${score}/100 • ${totalContributions.toLocaleString()} contributions!`);

    } catch (error) {
      this.showLoader(false);
      this.showToast(`"${username}" not found or private. Try: torvalds, sindresorhus`);
    } finally {
      this.isLoading = false;
    }
  }

  renderAllSlides() {
    if (!this.data) return;

    // Profile Slide 1
    this.elements.slides[1].innerHTML = `<div class="content"><div class="profile-card">
      <img src="${this.data.user.avatar_url}" style="width:160px;height:160px;border-radius:50%;border:5px solid rgba(255,255,255,0.2);">
      <h2 style="font-size:clamp(2.5rem,8vw,4rem);margin:24px 0 16px;">${this.data.user.name || this.data.user.login}</h2>
      <p style="color:#94a3b8;font-size:1.3rem;margin-bottom:40px;">${this.data.stats.totalContributions.toLocaleString()} contributions in 2025</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;">
        <div class="stat-card"><div style="font-size:3rem;font-weight:900;">⭐ ${this.data.stats.totalStars.toLocaleString()}</div><div>Total Stars</div></div>
        <div class="stat-card"><div style="font-size:3rem;font-weight:900;">💾 ${this.data.stats.totalContributions.toLocaleString()}</div><div>Contributions</div></div>
        <div class="stat-card"><div style="font-size:3rem;font-weight:900;">📂 ${this.data.repoCount}</div><div>Repositories</div></div>
      </div>
    </div></div>`;

    // Top Repos Slide 4
    this.elements.slides[4].innerHTML = `<div class="content">
      <h2 style="font-size:clamp(2.5rem,8vw,4rem);margin-bottom:48px;">🏆 Top Repositories</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:28px;max-width:1200px;margin:0 auto;">
        ${this.data.topRepos.map((repo, i) => `
          <div class="trending-card" style="cursor:pointer;" onclick="window.open('https://github.com/${this.data.user.login}/${repo.name}')">
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
              <div style="width:48px;height:48px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:white;">#${i+1}</div>
              <div style="font-size:1.4rem;font-weight:800;">${repo.name}</div>
            </div>
            <div style="color:#94a3b8;font-size:15px;margin-bottom:16px;">⭐ ${repo.stargazers_count?.toLocaleString() || 0} stars • 💾 ${repo.contributions} contributions</div>
            <div style="color:#667eea;font-weight:700;font-size:14px;">${repo.language || 'Unknown'}</div>
          </div>
        `).join('')}
      </div>
    </div>`;

    // Languages Slide 3
    this.elements.slides[3].innerHTML = `<div class="content">
      <h2 style="font-size:clamp(2.5rem,8vw,4rem);margin-bottom:48px;">🌈 Top Languages</h2>
      <div style="max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:24px;">
        ${this.data.topLanguages.map(([lang, count], i) => `
          <div class="trending-card" style="display:flex;align-items:center;gap:24px;cursor:pointer;transition:all 0.3s ease;" onmouseenter="this.style.transform='translateX(20px)'" onmouseleave="this.style.transform='translateX(0)'">
            <div style="width:80px;height:80px;border-radius:20px;background:${this.getLangColor(lang)};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;color:white;flex-shrink:0;">${lang.slice(0,3).toUpperCase()}</div>
            <div style="flex:1;">
              <div style="font-size:1.6rem;font-weight:800;margin-bottom:6px;">${lang}</div>
              <div style="color:#94a3b8;font-size:15px;">${count} contributions across repos</div>
            </div>
            <div style="font-size:1.5rem;font-weight:900;color:#667eea;">#${i+1}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  goToSlide(index) {
    if (index < 0 || index >= this.totalSlides || index === this.current || this.isLoading) return;
    this.elements.slides.forEach((s, i) => s.classList.toggle('active', i === index));
    this.elements.navDots.forEach((d, i) => d.classList.toggle('active', i === index));
    this.current = index; this.updateProgress();
  }

  nextSlide() { this.goToSlide((this.current + 1) % this.totalSlides); }
  prevSlide() { this.goToSlide((this.current - 1 + this.totalSlides) % this.totalSlides); }
  updateProgress() {
    if (this.elements.progressArc) this.elements.progressArc.style.strokeDashoffset = 100 - ((this.current + 1) / this.totalSlides * 100);
    if (this.elements.progressText) this.elements.progressText.textContent = `${String(this.current + 1).padStart(2,'0')}/${String(this.totalSlides).padStart(2,'0')}`;
  }

  getLangColor(lang) {
    const colors = {'JavaScript':'#f7df1e','TypeScript':'#3178c6','Python':'#3776ab','Java':'#007396','C++':'#f34b7d','Go':'#00add8','Rust':'#dea584'};
    return colors[lang] || '#64748b';
  }

  async loadTrendingRepos() {
    if (!this.elements.trendingRepos) return;
    this.elements.trendingRepos.innerHTML = '<div style="grid-column:1/-1;padding:80px;text-align:center;color:#64748b;">🔥 Loading popular repos...</div>';
    try {
      const res = await fetch('https://api.github.com/search/repositories?q=stars:>15000&sort=stars&per_page=20');
      const data = await res.json();
      this.repos = data.items || [];
      this.filterRepos();
    } catch(e) {
      this.elements.trendingRepos.innerHTML = '<div style="grid-column:1/-1;padding:80px;text-align:center;color:#64748b;">Popular repos loading...</div>';
    }
  }

  filterRepos() {
    if (!this.elements.trendingRepos || !this.repos.length) return;
    const filtered = this.repos.filter(r => this.currentFilter === 'all' || (r.language || '').toLowerCase().includes(this.currentFilter));
    this.elements.trendingRepos.innerHTML = filtered.slice(0, 12).map(r => `
      <div class="trending-card" onclick="window.open('${r.html_url}','_blank')" style="cursor:pointer;">
        <div style="font-weight:800;font-size:16px;margin-bottom:8px;">${r.name}</div>
        <div style="color:#94a3b8;font-size:14px;margin-bottom:4px;">${r.owner.login}</div>
        <div style="color:#94a3b8;font-size:13px;margin-bottom:16px;">${r.language || 'Unknown'}</div>
        <div style="font-weight:800;color:#667eea;">⭐ ${r.stargazers_count.toLocaleString()}</div>
      </div>
    `).join('');
  }

  addAnimations() {
    const style = document.createElement('style');
    style.textContent = `@keyframes float{0%{transform:translateY(100vh)rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100vh)rotate(360deg);opacity:0}}.particles>*{animation:float ${20+Math.random()*15}s infinite linear;animation-delay:${Math.random()*15}s;}.stat-card{animation:slideIn 0.6s ease forwards;opacity:0;}.stat-card:nth-child(1){animation-delay:0.1s;}.stat-card:nth-child(2){animation-delay:0.2s;}.stat-card:nth-child(3){animation-delay:0.3s;}@keyframes slideIn{from{opacity:0;transform:translateX(50px);}to{opacity:1;transform:translateX(0);}}.trending-card:hover{transform:translateY(-12px)!important;box-shadow:0 40px 80px rgba(0,0,0,0.6)!important;}`;
    document.head.appendChild(style);
  }

  showHints() {
    this.elements.arrowHint.classList.add('show');
    setTimeout(() => this.elements.arrowHint.classList.remove('show'), 5000);
  }

  showLoader(show, text='') {
    if (this.elements.loader) this.elements.loader.classList.toggle('active', show);
    if (this.elements.loaderText && text) this.elements.loaderText.textContent = text;
  }

  showToast(message) {
    if (!this.elements.toast) return;
    this.elements.toast.textContent = message; this.elements.toast.classList.add('show');
    setTimeout(() => this.elements.toast.classList.remove('show'), 4000);
  }
}

// Particles
for(let i=0;i<30;i++){
  const p=document.createElement('div');
  p.style.cssText=`position:fixed;width:${Math.random()*4+1}px;height:${Math.random()*4+1}px;background:linear-gradient(45deg,rgba(102,126,234,0.6),rgba(139,92,246,0.4));border-radius:50%;left:${Math.random()*100}vw;animation:float ${25+Math.random()*20}s infinite linear;animation-delay:${Math.random()*20}s;top:${Math.random()*100}vh;z-index:1;`;
  document.querySelector('.particles').appendChild(p);
}

new GitHubWrapped();
