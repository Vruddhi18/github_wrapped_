class GitHubWrapped {
  constructor() {
    this.data = null;
    this.audioContext = null;
    this.soundEnabled = true;
    this.init();
  }

  init() {
    this.bindElements();
    this.initAmbient();
    this.initScrollSnap();
    this.initInput();
    this.initTheme();
    this.initSound();
    this.initInteractions();
  }

  bindElements() {
    this.el = {
      panels: document.querySelectorAll('.panel'),
      progressLine: document.querySelector('.progress-line'),
      username: document.getElementById('username'),
      generate: document.getElementById('generate'),
      loader: document.getElementById('loader'),
      loaderText: document.getElementById('loaderText'),
      profileCard: document.getElementById('profileCard'),
      userAvatar: document.getElementById('userAvatar'),
      userName: document.getElementById('userName'),
      userBio: document.getElementById('userBio'),
      userStreak: document.getElementById('userStreak'),
      overviewStats: document.getElementById('overviewStats'),
      languageStack: document.getElementById('languageStack'),
      reposFlow: document.getElementById('reposFlow'),
      heatmapGrid: document.getElementById('heatmapGrid'),
      networkViz: document.getElementById('networkViz'),
      achievementsGrid: document.getElementById('achievementsGrid'),
      productivityBadge: document.getElementById('productivityBadge'),
      finalScore: document.getElementById('finalScore'),
      badgeTitle: document.getElementById('badgeTitle'),
      shareBtn: document.getElementById('shareBtn'),
      exportBtn: document.getElementById('exportBtn'),
      playlistBtn: document.getElementById('playlistBtn'),
      themeToggle: document.getElementById('themeToggle'),
      soundToggle: document.getElementById('soundToggle'),
      tooltip: document.getElementById('globalTooltip'),
      networkCanvas: document.getElementById('networkCanvas')
    };
  }

  initAmbient() {
    const canvas = document.getElementById('ambient');
    const ctx = canvas.getContext('2d');
    
    let time = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.02;

      // FIXED: Ensure positive radius values for createRadialGradient
      for (let i = 0; i < 100; i++) {
        const x = (i * 0.1 + time * 20) % canvas.width;
        const y = Math.sin(time * 0.5 + i * 0.1) * 50 + canvas.height * 0.5;
        const size = Math.abs(Math.sin(time * 0.3 + i)) * 2 + 1; // FIXED: Use Math.abs()
        const radius = Math.max(size * 3, 1); // FIXED: Ensure minimum radius of 1
        
        // FIXED: Safe radial gradient creation
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const alpha = Math.max(0.4 - i * 0.003, 0.05); // FIXED: Ensure positive alpha
        
        gradient.addColorStop(0, `rgba(16, 185, 129, ${alpha})`);
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        
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
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const maxScroll = document.body.scrollHeight - window.innerHeight;
          const progress = Math.min(scrollY / maxScroll, 1);
          
          this.el.progressLine.style.width = `${progress * 100}%`;

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

    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.el.username.value = btn.dataset.user;
        this.generate();
      });
    });
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
      this.playSound('click');
    });
  }

  initSound() {
    this.el.soundToggle.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.el.soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
      this.playSound('click');
    });

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  playSound(type) {
    if (!this.soundEnabled || !this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    if (type === 'click') {
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    }

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  initInteractions() {
    document.addEventListener('mousemove', (e) => {
      const tooltip = this.el.tooltip;
      tooltip.style.left = e.pageX + 15 + 'px';
      tooltip.style.top = e.pageY - 10 + 'px';
    });

    // Safe event delegation for repos
    document.addEventListener('click', (e) => {
      const repoCard = e.target.closest('.repo-card');
      if (repoCard && repoCard.dataset.url) {
        window.open(repoCard.dataset.url, '_blank');
      }
    });
  }

  async generate() {
    const username = this.el.username.value.trim();
    if (!username) {
      alert('Please enter a GitHub username');
      return;
    }

    this.playSound('click');
    this.showLoader(true, 'Fetching GitHub data...');
    
    try {
      this.data = await this.fetchEnhancedData(username);
      this.renderAll();
      this.showLoader(false);
      this.playSound('success');
    } catch (error) {
      this.showLoader(false);
      alert('User not found! Try: torvalds, sindresorhus, facebook');
    }
  }

  async fetchEnhancedData(username) {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
    ]);

    if (!userRes.ok) throw new Error('User not found');

    const [user, repos] = await Promise.all([userRes.json(), reposRes.json()]);

    const languages = {};
    const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    
    repos.forEach(repo => {
      if (repo.language && repo.language !== null) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    const topLanguages = Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const topRepos = repos
      .filter(repo => repo.stargazers_count > 0)
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, 6);

    const heatmapData = Array(52 * 7).fill(0).map(() => Math.floor(Math.random() * 10));

    return {
      user,
      stats: {
        repos: user.public_repos || 0,
        followers: user.followers || 0,
        years: Math.max(1, Math.ceil((Date.now() - new Date(user.created_at || Date.now())) / (365.25 * 24 * 60 * 60 * 1000))),
        totalStars
      },
      languages: topLanguages,
      topRepos,
      heatmapData,
      achievements: this.generateAchievements(user, repos)
    };
  }

  generateAchievements(user, repos) {
    const achievements = [];
    const stars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    
    if ((user.public_repos || 0) >= 50) achievements.push({ icon: '🏆', title: 'Repository Master', desc: '50+ public repositories' });
    if (stars >= 1000) achievements.push({ icon: '⭐', title: 'Star Collector', desc: '1000+ total stars' });
    if ((user.followers || 0) >= 100) achievements.push({ icon: '👥', title: 'Community Leader', desc: '100+ followers' });
    
    const randomAchievements = [
      { icon: '⚡', title: 'Weekend Warrior', desc: 'Most commits on weekends' },
      { icon: '🌙', title: 'Night Owl', desc: 'Active at midnight hours' },
      { icon: '🚀', title: 'Consistent Coder', desc: 'Coded every week' }
    ];
    
    return achievements.concat(randomAchievements.slice(0, Math.max(0, 3 - achievements.length)));
  }

  renderAll() {
    this.renderOverview();
    this.renderLanguages();
    this.renderRepos();
    this.renderHeatmap();
    this.renderNetwork();
    this.renderAchievements();
    this.renderSummary();
  }

  renderOverview() {
    if (this.data.user.avatar_url) {
      this.el.userAvatar.style.backgroundImage = `url(${this.data.user.avatar_url}&s=500)`;
    }
    this.el.userAvatar.classList.add('show');
    
    this.el.userName.textContent = this.data.user.name || this.data.user.login || 'Unknown';
    this.el.userBio.textContent = this.data.user.bio || 'No bio available';

    const streakDays = Math.floor(Math.random() * 150) + 50;
    this.el.userStreak.innerHTML = `
      <span class="streak-flame">🔥</span>
      <div>
        <div style="font-size: 1.5rem; font-weight: 700;">${streakDays}</div>
        <div style="font-size: 0.95rem; opacity: 0.8;">Day Streak</div>
      </div>
    `;

    const stats = this.el.overviewStats.querySelectorAll('.stat-card');
    stats.forEach((stat, i) => {
      const label = stat.querySelector('.stat-label').textContent.toLowerCase().replace(/s$/, '').replace(' ', '');
      const target = this.data.stats[label] || 0;
      const valueEl = stat.querySelector('.stat-value');
      valueEl.dataset.target = target;
      
      setTimeout(() => {
        stat.classList.add('animate');
        this.animateNumber(valueEl, target);
      }, i * 150);
    });
  }

  animateNumber(el, target) {
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();
    
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      el.textContent = Math.floor(easeProgress * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  renderLanguages() {
    this.el.languageStack.innerHTML = this.data.languages.map((lang, i) => `
      <div class="lang-card" style="transition-delay: ${i * 0.15}s">
        <div class="lang-color" style="background: ${this.getLangColor(lang.name)}"></div>
        <div class="lang-details">
          <h3>${lang.name}</h3>
          <div class="stats">${lang.count} repositories</div>
        </div>
      </div>
    `).join('');

    setTimeout(() => {
      this.el.languageStack.querySelectorAll('.lang-card').forEach((el, i) => {
        setTimeout(() => el.classList.add('animate'), i * 200);
      });
    }, 600);
  }

  renderRepos() {
    this.el.reposFlow.innerHTML = this.data.topRepos.map((repo, i) => `
      <div class="repo-card" style="transition-delay: ${i * 0.15}s" data-url="${repo.html_url || ''}">
        <div class="repo-name">${repo.name || 'Unnamed'}</div>
        <div class="repo-stats">
          <span>⭐ ${(repo.stargazers_count || 0).toLocaleString()}</span>
          <span>📁 ${repo.language || 'Various'}</span>
        </div>
      </div>
    `).join('');

    setTimeout(() => {
      this.el.reposFlow.querySelectorAll('.repo-card').forEach((el, i) => {
        setTimeout(() => el.classList.add('animate'), i * 200);
      });
    }, 600);
  }

  renderHeatmap() {
    this.el.heatmapGrid.innerHTML = this.data.heatmapData.map((commits, i) => {
      const intensity = Math.min(commits / 10, 1);
      const week = Math.floor(i / 7);
      const day = i % 7;
      
      return `
        <div class="heatmap-day" 
             style="background: rgba(16, 185, 129, ${intensity * 0.8})"
             data-commits="${commits}"
             data-week="${week}"
             data-day="${day}">
        </div>
      `;
    }).join('');

    this.el.heatmapGrid.querySelectorAll('.heatmap-day').forEach(day => {
      day.addEventListener('mouseenter', (e) => {
        const commits = e.currentTarget.dataset.commits;
        this.showTooltip(`Week ${e.currentTarget.dataset.week}: ${commits} commits`, e);
      });
      
      day.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  renderNetwork() {
    this.initNetworkViz();
  }

  initNetworkViz() {
    const canvas = this.el.networkCanvas;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let nodes = [];
    let animationId;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const createNodes = () => {
      const rect = canvas.getBoundingClientRect();
      nodes = Array.from({ length: 25 }, (_, i) => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 4 + Math.random() * 6,
        hue: 160 + Math.random() * 40
      }));
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.hypot(dx, dy);
          
          if (distance < 120) {
            ctx.globalAlpha = (1 - distance / 120) * 0.3;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 20 || node.x > rect.width - 20) node.vx *= -1;
        if (node.y < 20 || node.y > rect.height - 20) node.vy *= -1;

        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 2);
        gradient.addColorStop(0, `hsla(${node.hue}, 60%, 50%, 0.9)`);
        gradient.addColorStop(1, `hsla(${node.hue}, 60%, 20%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    createNodes();
    animate();
    this.networkAnimationId = animationId;
  }

  renderAchievements() {
    this.el.achievementsGrid.innerHTML = this.data.achievements.map((ach, i) => `
      <div class="achievement-card" style="transition-delay: ${i * 0.1}s">
        <div class="achievement-icon">${ach.icon}</div>
        <h3 class="achievement-title">${ach.title}</h3>
        <p style="color: var(--color-text-secondary); font-size: 1rem;">${ach.desc}</p>
      </div>
    `).join('');

    setTimeout(() => {
      this.el.achievementsGrid.querySelectorAll('.achievement-card').forEach((el, i) => {
        setTimeout(() => el.classList.add('animate'), i * 150);
      });
    }, 400);
  }

  renderSummary() {
    const totalCommits = this.data.heatmapData.reduce((a, b) => a + b, 0);
    const productivityScore = Math.min(100, Math.max(0, Math.floor(
      (this.data.stats.repos * 0.3 + 
       this.data.stats.totalStars * 0.0005 + 
       totalCommits * 0.1)
    )));
    
    const badges = [
      'Code Apprentice', 'Weekend Warrior', 'Repo Master', 
      'Star Collector', 'Night Owl', 'Code Legend'
    ];
    
    this.el.finalScore.textContent = productivityScore;
    this.el.badgeTitle.textContent = badges[Math.floor(productivityScore / 20)] || 'Code Apprentice';

    this.el.productivityBadge.addEventListener('click', () => {
      this.playSound('click');
    });

    this.el.shareBtn.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: 'My GitHub Wrapped 2025',
          text: `I scored ${productivityScore}/100 on GitHub Wrapped!`,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert('Link copied to clipboard!');
        }).catch(() => {
          alert('Share link: ' + window.location.href);
        });
      }
      this.playSound('success');
    });

    this.el.exportBtn.addEventListener('click', () => {
      alert('📸 Export feature coming soon!');
      this.playSound('click');
    });

    this.el.playlistBtn.addEventListener('click', () => {
      window.open('https://open.spotify.com', '_blank');
      this.playSound('click');
    });
  }

  getLangColor(lang) {
    const colors = {
      'JavaScript': '#f59e0b', 'TypeScript': '#0ea5e9', 'Python': '#059669',
      'Java': '#dc2626', 'Go': '#00d4aa', 'Rust': '#ef4444', 'C++': '#3b82f6',
      'PHP': '#8b5cf6', 'Ruby': '#e11d48', 'C#': '#0891b2', 'HTML': '#f97316'
    };
    return colors[lang] || `hsl(${Math.random() * 360}, 70%, 55%)`;
  }

  showTooltip(text, event) {
    this.el.tooltip.textContent = text;
    this.el.tooltip.classList.add('show');
  }

  hideTooltip() {
    this.el.tooltip.classList.remove('show');
  }

  showLoader(show, text = '') {
    this.el.loader.classList.toggle('active', show);
    if (text) this.el.loaderText.textContent = text;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GitHubWrapped();
});
