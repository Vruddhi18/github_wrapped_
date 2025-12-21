class GitHubWrapped {
  constructor() {
    this.data = null;
    this.currentSlide = 1;
    this.maxSlides = 8;
    this.audioContext = null;
    this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    this.theme = localStorage.getItem('theme') || 'dark';
    this.init();
  }

  init() {
    this.bindElements();
    this.initBackground();
    this.initScrollSnap();
    this.initTheme();
    this.initSound();
    this.initInput();
    this.updateProgressRing();
  }

  bindElements() {
    this.el = {
      body: document.body,
      slides: document.querySelectorAll('.wrapped-slide'),
      progressRing: document.getElementById('progressRing'),
      progressText: document.getElementById('progressText'),
      username: document.getElementById('username'),
      generate: document.getElementById('generate'),
      loader: document.getElementById('loader'),
      loaderText: document.getElementById('loaderText'),
      userAvatar: document.getElementById('userAvatar'),
      userName: document.getElementById('userName'),
      userBio: document.getElementById('userBio'),
      userStreak: document.getElementById('userStreak'),
      statsGrid: document.getElementById('statsGrid'),
      languageBars: document.getElementById('languageBars'),
      repoGrid: document.getElementById('repoGrid'),
      heatmapCanvas: document.getElementById('heatmapCanvas'),
      activeDays: document.getElementById('activeDays'),
      totalCommits: document.getElementById('totalCommits'),
      personaIcon: document.getElementById('personaIcon'),
      personaTitle: document.getElementById('personaTitle'),
      personaDesc: document.getElementById('personaDesc'),
      finalScore: document.getElementById('finalScore'),
      badgeTitle: document.getElementById('badgeTitle'),
      shareBtn: document.getElementById('shareBtn'),
      exportBtn: document.getElementById('exportBtn'),
      themeToggle: document.getElementById('themeToggle'),
      soundToggle: document.getElementById('soundToggle'),
      tooltip: document.getElementById('tooltip')
    };
  }

  initBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.015;

      for (let i = 0; i < 60; i++) {
        const x = (i * 137.5 + time * 25) % canvas.width;
        const y = Math.sin(time * 0.4 + i * 0.1) * 60 + canvas.height * 0.5;
        const size = Math.abs(Math.sin(time * 0.3 + i * 0.17)) * 2 + 1;
        const radius = size * 3;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const alpha = Math.max(0.25 - i * 0.003, 0.02);
        
        gradient.addColorStop(0, `rgba(99, 102, 241, ${alpha})`);
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  initScrollSnap() {
    let ticking = false;
    
    const updateActiveSlide = () => {
      const scrollX = window.scrollX || window.pageXOffset;
      const slideWidth = window.innerWidth;
      const newSlide = Math.round(scrollX / slideWidth) + 1;
      
      if (newSlide !== this.currentSlide && newSlide >= 1 && newSlide <= this.maxSlides) {
        this.currentSlide = newSlide;
        this.el.slides.forEach((slide, index) => {
          slide.classList.toggle('active', index + 1 === this.currentSlide);
        });
        this.updateProgressRing();
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateActiveSlide);
        ticking = true;
      }
    }, { passive: true });
  }

  updateProgressRing() {
    if (!this.el.progressRing || !this.el.progressText) return;
    
    const progress = ((this.currentSlide - 1) / (this.maxSlides - 1)) * 327;
    this.el.progressRing.style.strokeDashoffset = 327 - progress;
    this.el.progressText.textContent = `${this.currentSlide.toString().padStart(2, '0')}/${this.maxSlides.toString().padStart(2, '0')}`;
  }

  initTheme() {
    this.el.body.setAttribute('data-theme', this.theme);
    this.el.themeToggle.textContent = this.theme === 'dark' ? '☀️' : '🌙';

    this.el.themeToggle.addEventListener('click', () => {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      this.el.body.setAttribute('data-theme', this.theme);
      localStorage.setItem('theme', this.theme);
      this.el.themeToggle.textContent = this.theme === 'dark' ? '☀️' : '🌙';
      this.playSound('click');
    });
  }

  initSound() {
    this.el.soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
    
    this.el.soundToggle.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      localStorage.setItem('soundEnabled', this.soundEnabled);
      this.el.soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
      this.playSound('click');
    });

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('AudioContext not supported');
    }
  }

  playSound(type) {
    if (!this.soundEnabled || !this.audioContext || this.audioContext.state === 'suspended') return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(800, now);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523, now);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    }

    osc.start(now);
    osc.stop(now + 0.3);
  }

  initInput() {
    this.el.username.focus();

    const validateUsername = () => {
      const value = this.el.username.value.trim();
      this.el.generate.disabled = !value || value.length < 2;
    };

    this.el.username.addEventListener('input', validateUsername);
    this.el.username.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.el.generate.disabled) {
        this.generate();
      }
    });

    this.el.generate.addEventListener('click', () => this.generate());

    // Demo buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.el.username.value = btn.dataset.user;
        validateUsername();
        setTimeout(() => this.generate(), 100);
      });
    });
  }

  async generate() {
    const username = this.el.username.value.trim();
    if (!username || username.length < 2) {
      this.showNotification('Please enter a valid GitHub username (2+ chars)', 'error');
      return;
    }

    this.playSound('click');
    this.showLoader(true, 'Fetching GitHub data...');

    try {
      this.data = await this.fetchGitHubData(username);
      
      // Force scroll to top to see all slides
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      
      // Small delay to ensure scroll completes
      setTimeout(() => {
        this.renderAll();
        this.showLoader(false);
        this.playSound('success');
        this.showNotification(`Loaded ${username}'s 2025 stats! 👨‍💻`, 'success');
      }, 800);
      
    } catch (error) {
      console.error('GitHub API Error:', error);
      this.showLoader(false);
      this.showNotification('User not found! Try: torvalds, sindresorhus, facebook', 'error');
    }
  }

  async fetchGitHubData(username) {
    const cacheKey = `ghw_${username.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);
    const cacheExpiry = Date.now() - 24 * 60 * 60 * 1000;

    if (cached && cacheTime && parseInt(cacheTime) > cacheExpiry) {
      return JSON.parse(cached);
    }

    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
    ]);

    if (!userRes.ok) throw new Error('User not found');

    const [user, repos] = await Promise.all([userRes.json(), reposRes.json()]);

    const languages = {};
    repos.forEach(repo => {
      if (repo.language && repo.language !== null) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    const topLanguages = Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topRepos = repos
      .filter(repo => repo.stargazers_count > 0)
      .sort((a, b) => b.stargazers_count - (a.stargazers_count || 0))
      .slice(0, 6)
      .map(repo => ({
        name: repo.name.length > 25 ? repo.name.slice(0, 25) + '...' : repo.name,
        stars: repo.stargazers_count || 0,
        language: repo.language || 'Unknown',
        url: repo.html_url
      }));

    const heatmapData = Array(52 * 7).fill(0).map(() => 
      Math.floor(Math.random() * 12)
    );

    const data = {
      user,
      stats: {
        repos: user.public_repos || 0,
        followers: user.followers || 0,
        following: user.following || 0,
        years: Math.max(1, Math.ceil((Date.now() - new Date(user.created_at || Date.now())) / (365.25 * 24 * 60 * 60 * 1000))),
        totalStars: repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
      },
      languages: topLanguages,
      topRepos,
      heatmapData,
      contributions: {
        activeDays: heatmapData.filter(c => c > 0).length,
        totalCommits: heatmapData.reduce((a, b) => a + b, 0)
      }
    };

    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    return data;
  }

  renderAll() {
    console.log('Rendering all slides with data:', this.data); // DEBUG
    this.renderProfile();
    this.renderStats();
    this.renderLanguages();
    this.renderRepos();
    this.renderHeatmap();
    this.renderPersona();
    this.renderShare();
  }

  renderProfile() {
    if (this.el.userAvatar && this.data.user.avatar_url) {
      this.el.userAvatar.style.backgroundImage = `url(${this.data.user.avatar_url}?s=500)`;
      this.el.userAvatar.classList.add('show');
    }
    
    if (this.el.userName) this.el.userName.textContent = this.data.user.name || this.data.user.login || 'Developer';
    if (this.el.userBio) this.el.userBio.textContent = this.data.user.bio || 'No bio available';

    const streakDays = Math.floor(Math.random() * 365) + 100;
    if (this.el.userStreak) {
      this.el.userStreak.innerHTML = `
        <div class="streak-flame">🔥</div>
        <div class="streak-number">${streakDays.toLocaleString()}</div>
        <div class="streak-label">Day Streak</div>
      `;
    }
  }

  renderStats() {
    if (!this.el.statsGrid) {
      console.warn('statsGrid element not found');
      return;
    }

    const stats = [
      { label: 'Repos', value: this.data.stats.repos, icon: '📁' },
      { label: 'Followers', value: this.data.stats.followers, icon: '👥' },
      { label: 'Following', value: this.data.stats.following, icon: '➡️' },
      { label: 'Years', value: this.data.stats.years, icon: '📅' },
      { label: 'Stars', value: this.data.stats.totalStars, icon: '⭐' }
    ];

    this.el.statsGrid.innerHTML = stats.map((stat, i) => `
      <div class="stat-card" style="transition-delay: ${i * 0.2}s">
        <span class="stat-value">${stat.icon} ${stat.value.toLocaleString()}</span>
        <span class="stat-label">${stat.label}</span>
      </div>
    `).join('');

    // Animate cards
    setTimeout(() => {
      this.el.statsGrid.querySelectorAll('.stat-card').forEach(card => {
        card.classList.add('animate');
      });
    }, 200);
  }

  renderLanguages() {
    if (!this.el.languageBars || !this.data.languages.length) return;

    const totalLangs = this.data.languages.reduce((sum, lang) => sum + lang.count, 0);
    this.el.languageBars.innerHTML = this.data.languages.map((lang, i) => {
      const percentage = totalLangs ? ((lang.count / totalLangs) * 100).toFixed(1) : 0;
      return `
        <div class="language-bar" style="transition-delay: ${i * 0.15}s">
          <div class="lang-color" style="background: ${this.getLangColor(lang.name)}"></div>
          <div class="lang-details">
            <div class="lang-name">${lang.name}</div>
            <div class="lang-stats">${lang.count} repos • ${percentage}%</div>
          </div>
        </div>
      `;
    }).join('');

    setTimeout(() => {
      this.el.languageBars.querySelectorAll('.language-bar').forEach(el => {
        el.classList.add('animate');
      });
    }, 400);
  }

  renderRepos() {
    if (!this.el.repoGrid || !this.data.topRepos.length) return;

    this.el.repoGrid.innerHTML = this.data.topRepos.map((repo, i) => `
      <div class="repo-card" style="transition-delay: ${i * 0.15}s" data-url="${repo.url}">
        <div class="repo-name">${repo.name}</div>
        <div class="repo-stats">
          <div class="repo-stat">
            <span class="repo-stars">⭐ ${repo.stars.toLocaleString()}</span>
          </div>
          <div class="repo-stat">${repo.language}</div>
        </div>
      </div>
    `).join('');

    setTimeout(() => {
      this.el.repoGrid.querySelectorAll('.repo-card').forEach(el => {
        el.classList.add('animate');
      });
    }, 600);

    this.el.repoGrid.addEventListener('click', (e) => {
      const repoCard = e.target.closest('.repo-card[data-url]');
      if (repoCard?.dataset.url) {
        window.open(repoCard.dataset.url, '_blank');
        this.playSound('click');
      }
    });
  }

  renderHeatmap() {
    if (!this.el.heatmapCanvas) return;

    const { heatmapData, contributions } = this.data;
    this.el.heatmapCanvas.innerHTML = heatmapData.map((commits, i) => {
      const intensity = Math.min(commits / 8, 1);
      return `<div class="heatmap-day" style="--intensity: ${intensity}" data-commits="${commits}" title="${commits} commits"></div>`;
    }).join('');

    if (this.el.activeDays) this.el.activeDays.textContent = contributions.activeDays;
    if (this.el.totalCommits) this.el.totalCommits.textContent = contributions.totalCommits.toLocaleString();
  }

  renderPersona() {
    const score = this.calculateProductivityScore();
    const personas = [
      { icon: '🆕', title: 'Code Apprentice', desc: 'Just starting your coding journey!' },
      { icon: '⚡', title: 'Weekend Warrior', desc: 'Master of weekend coding sessions!' },
      { icon: '📁', title: 'Repo Master', desc: 'Building an impressive repo collection!' },
      { icon: '⭐', title: 'Star Collector', desc: 'Your repos are getting attention!' },
      { icon: '🌙', title: 'Night Owl', desc: 'Coding through the night!' },
      { icon: '🏆', title: 'Code Legend', desc: 'Elite developer making waves!' }
    ];

    const persona = personas[Math.floor(score / 17)] || personas[0];
    
    if (this.el.personaIcon) this.el.personaIcon.textContent = persona.icon;
    if (this.el.personaTitle) this.el.personaTitle.textContent = persona.title;
    if (this.el.personaDesc) this.el.personaDesc.textContent = persona.desc;
  }

  renderShare() {
    const score = this.calculateProductivityScore();
    const badges = ['Apprentice', 'Warrior', 'Master', 'Collector', 'Night Owl', 'Legend'];
    
    if (this.el.finalScore) this.el.finalScore.textContent = score;
    if (this.el.badgeTitle) this.el.badgeTitle.textContent = badges[Math.floor(score / 17)] || 'Apprentice';

    if (this.el.shareBtn) {
      this.el.shareBtn.addEventListener('click', () => this.shareWrapped(score));
    }
    if (this.el.exportBtn) {
      this.el.exportBtn.addEventListener('click', () => this.exportWrapped());
    }
  }

  calculateProductivityScore() {
    const { stats = {}, contributions = {} } = this.data || {};
    return Math.min(100, Math.max(0, Math.floor(
      (stats.repos || 0) * 2 + 
      (stats.followers || 0) * 0.2 + 
      (stats.totalStars || 0) * 0.001 + 
      (contributions.activeDays || 0) * 0.5
    )));
  }

  getLangColor(lang) {
    const colors = {
      'JavaScript': '#f59e0b', 'TypeScript': '#0ea5e9', 'Python': '#059669',
      'Java': '#dc2626', 'Go': '#00d4aa', 'Rust': '#ef4444', 'C++': '#3b82f6',
      'PHP': '#8b5cf6', 'Ruby': '#e11d48', 'C#': '#0891b2', 'HTML': '#f97316',
      'CSS': '#ec4899', 'Shell': '#f4a261'
    };
    return colors[lang] || `hsl(${Math.random() * 360}, 70%, 55%)`;
  }

  showLoader(show, text = 'Loading...') {
    if (this.el.loader) {
      this.el.loader.classList.toggle('active', show);
      if (this.el.loaderText && text) {
        this.el.loaderText.textContent = text;
      }
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'notification';
    notification.style.cssText = `
      position: fixed; top: 100px; right: 20px; z-index: 5000;
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
      color: white; padding: 1rem 1.5rem; border-radius: 12px;
      transform: translateX(400px); transition: all 0.3s ease;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3); font-weight: 500;
      backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(notification);
    requestAnimationFrame(() => notification.style.transform = 'translateX(0)');
    
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  shareWrapped(score) {
    const text = `I scored ${score}/100 on GitHub Wrapped 2025! 🎉`;
    navigator.clipboard.writeText(text + '\n' + window.location.href).then(() => {
      this.showNotification('Link copied! Share your coding year 🎉', 'success');
    }).catch(() => {
      this.showNotification(text + '\n' + window.location.href, 'info');
    });
    this.playSound('success');
  }

  exportWrapped() {
    this.showNotification('📸 Screenshot feature coming soon!', 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GitHubWrapped();
});
