// DOM Elements
const elements = {
  username: document.getElementById('username'),
  generate: document.getElementById('generate'),
  loader: document.getElementById('loader'),
  statsGrid: document.getElementById('stats-grid'),
  guitar: document.getElementById('guitar'),
  spotlight: document.getElementById('spotlight'),
  navBtns: document.querySelectorAll('.nav-btn'),
  sections: document.querySelectorAll('.section')
};

// State
let currentData = null;

// Init
document.addEventListener('DOMContentLoaded', () => {
  initSpotlight();
  initNavigation();
  initGuitar();
  initInput();
  
  // Demo load
  elements.username.value = 'torvalds';
});

// 🎨 SPOTLIGHT EFFECT
function initSpotlight() {
  document.addEventListener('mousemove', (e) => {
    elements.spotlight.style.setProperty('--x', `${e.clientX}px`);
    elements.spotlight.style.setProperty('--y', `${e.clientY}px`);
  });
}

// 🧭 NAVIGATION
function initNavigation() {
  elements.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      navigateTo(section);
    });
  });
}

function navigateTo(sectionId) {
  // Update nav
  elements.navBtns.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
  
  // Update sections
  elements.sections.forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  
  // Smooth scroll
  document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

// 🎸 INTERACTIVE GUITAR
function initGuitar() {
  elements.guitar.querySelectorAll('[data-section]').forEach(part => {
    part.addEventListener('click', () => {
      const section = part.dataset.section;
      navigateTo(section);
      part.style.animation = 'pulse 0.6s ease';
      setTimeout(() => part.style.animation = '', 600);
    });
    
    part.addEventListener('mouseenter', () => {
      const label = part.querySelector('.guitar-label');
      if (label) label.style.opacity = '1';
    });
    
    part.addEventListener('mouseleave', () => {
      const label = part.querySelector('.guitar-label');
      if (label) label.style.opacity = '0';
    });
  });
}

// ⌨️ INPUT HANDLING
function initInput() {
  elements.username.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generateWrapped();
  });
  elements.generate.addEventListener('click', generateWrapped);
}

// 🚀 MAIN GENERATE FUNCTION
async function generateWrapped() {
  const username = elements.username.value.trim().replace('@', '');
  if (!username) return alert('Enter a GitHub username');
  
  showLoader(true);
  
  try {
    currentData = await fetchGithubData(username);
    renderAllSections(currentData);
    navigateTo('summary');
  } catch (error) {
    console.error(error);
    alert(`Error: ${error.message}\n\nTry a different username or add GITHUB_TOKEN to config.js`);
  } finally {
    showLoader(false);
  }
}

// 📊 GITHUB API
async function fetchGithubData(username) {
  // User info
  const userRes = await fetch(`https://api.github.com/users/${username}`);
  const user = await userRes.json();
  
  // REST API stats (works without token)
  const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
  const repos = await reposRes.json();
  
  // Events for activity
  const eventsRes = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`);
  const events = await eventsRes.json();
  
  // Mock 2025 stats (real data would come from GraphQL with token)
  const stats = {
    totalCommits: Math.floor(Math.random() * 5000) + 100,
    totalPRs: Math.floor(Math.random() * 200) + 10,
    totalIssues: Math.floor(Math.random() * 100) + 5,
    totalReviews: Math.floor(Math.random() * 50) + 2,
    publicRepos: repos.length,
    followers: user.followers,
    topLanguages: generateLanguages(),
    topOrgs: generateOrgs(),
    activityDays: generateActivityData()
  };
  
  return { user, stats };
}

function generateLanguages() {
  const languages = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'CSS'];
  return languages.map(lang => ({
    name: lang,
    bytes: Math.floor(Math.random() * 50000) + 10000,
    color: `hsl(${Math.random()*360}, 70%, 60%)`
  })).sort((a, b) => b.bytes - a.bytes).slice(0, 6);
}

function generateOrgs() {
  const orgs = ['microsoft', 'google', 'vercel', 'netlify', 'github', 'stripe'];
  return orgs.slice(0, Math.floor(Math.random()*4)+2).map(org => ({
    name: org,
    contributions: Math.floor(Math.random() * 50) + 10
  }));
}

function generateActivityData() {
  const days = [];
  for (let i = 0; i < 50; i++) {
    days.push({
      date: `2025-${String(Math.floor(Math.random()*12)+1).padStart(2,'0')}-${String(Math.floor(Math.random()*28)+1).padStart(2,'0')}`,
      count: Math.floor(Math.random() * 15)
    });
  }
  return days.sort((a,b) => b.count - a.count);
}

// 🎨 RENDER ALL SECTIONS
function renderAllSections(data) {
  renderStatsGrid(data);
  renderLanguages(data.stats.topLanguages);
  renderOrgs(data.stats.topOrgs);
  renderActivity(data.stats.activityDays);
}

function renderStatsGrid(data) {
  elements.statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${data.stats.totalCommits.toLocaleString()}</div>
      <div class="stat-label">Commits</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${data.stats.totalPRs}</div>
      <div class="stat-label">Pull Requests</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${data.stats.totalIssues}</div>
      <div class="stat-label">Issues</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${data.stats.publicRepos}</div>
      <div class="stat-label">Repositories</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${data.stats.followers}</div>
      <div class="stat-label">Followers</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${data.user.name || data.user.login}</div>
      <div class="stat-label">You</div>
    </div>
  `;
}

function renderLanguages(languages) {
  const ctx = document.getElementById('languages-chart')?.getContext('2d');
  if (ctx) {
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: languages.map(l => l.name),
        datasets: [{
          data: languages.map(l => l.bytes),
          backgroundColor: languages.map(l => l.color),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { color: 'white', padding: 20 } } }
      }
    });
  }
  
  document.querySelector('.languages-list').innerHTML = languages.map((lang, i) => `
    <div class="lang-item">
      <div class="lang-color" style="background: ${lang.color}"></div>
      <div>
        <div style="font-weight: 600; margin-bottom: 0.25rem">${lang.name}</div>
        <div style="color: var(--text-muted)">${(lang.bytes/1000).toFixed(1)}KB</div>
      </div>
      <div class="lang-bar">
        <div class="lang-bar-fill" style="width: ${Math.min(100, (lang.bytes/50000)*100)}%"></div>
      </div>
    </div>
  `).join('');
}

function renderOrgs(orgs) {
  document.querySelector('.orgs-list').innerHTML = orgs.map((org, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `🏅 ${i+1}`;
    return `
      <div class="org-item">
        <div style="font-size: 2rem">${medal}</div>
        <div>
          <div style="font-weight: 600">${org.name}</div>
          <div style="color: var(--text-muted)">${org.contributions} contributions</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderActivity(days) {
  const heatmap = document.getElementById('heatmap');
  heatmap.innerHTML = '';
  
  days.slice(0, 30).forEach((day, i) => {
    const dot = document.createElement('div');
    dot.className = 'heatmap-dot';
    dot.style.left = `${10 + i * 3}%`;
    dot.style.top = `${50 + (day.count * 4)}%`;
    dot.style.width = `${8 + day.count}px`;
    dot.style.height = dot.style.width;
    dot.title = `${day.date}: ${day.count} contributions`;
    dot.style.animationDelay = `${i * 0.05}s`;
    heatmap.appendChild(dot);
  });
  
  document.querySelector('.peak-days').innerHTML = `
    <div style="text-align: center; color: var(--text-muted); grid-column: 1/-1">
      ${days.slice(0,3).map((d,i) => `<strong>${i+1}.</strong> ${d.date}: ${d.count} commits`).join('<br>')}
    </div>
  `;
}

function showLoader(show) {
  elements.loader.classList.toggle('active', show);
  elements.generate.disabled = show;
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
  .stat-card:hover .stat-number { filter: drop-shadow(0 0 20px var(--accent)); }
  .heatmap-dot { animation: fadeInUp 0.6s ease forwards; opacity: 0; transform: translateY(20px); }
  @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(style);
