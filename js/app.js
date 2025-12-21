class AutoSlider {
  constructor() {
    this.slides = Array.from(document.querySelectorAll(".slide"));
    this.slider = document.getElementById("slider");
    this.current = 0;
    this.total = this.slides.length;
    this.intervalMs = 6000; // autoplay delay
    this.timer = null;

    this.progressRing = document.getElementById("progressRing");
    this.progressText = document.getElementById("progressText");

    this.initAutoplay();
    this.initControls();
    this.initInput();
    this.updateProgress();
  }

  initAutoplay() {
    this.startAutoplay();
  }

  startAutoplay() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.goTo((this.current + 1) % this.total, "right", true);
    }, this.intervalMs);
  }

  pauseAutoplay() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  resumeAutoplay() {
    this.startAutoplay();
  }

  initControls() {
    document.getElementById("prevBtn").addEventListener("click", () => {
      this.pauseAutoplay();
      this.prev();
    });
    document.getElementById("nextBtn").addEventListener("click", () => {
      this.pauseAutoplay();
      this.next();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        this.pauseAutoplay();
        this.next();
      } else if (e.key === "ArrowLeft") {
        this.pauseAutoplay();
        this.prev();
      }
    });
  }

  next() {
    const nextIndex = (this.current + 1) % this.total;
    this.goTo(nextIndex, "right", false);
  }

  prev() {
    const prevIndex = (this.current - 1 + this.total) % this.total;
    this.goTo(prevIndex, "left", false);
  }

  goTo(index, direction = "right", fromAuto = false) {
    if (index === this.current) return;

    const currentSlide = this.slides[this.current];
    const nextSlide = this.slides[index];

    currentSlide.classList.remove("enter-from-left", "enter-from-right");
    nextSlide.classList.remove(
      "enter-from-left",
      "enter-from-right",
      "leave-to-left",
      "leave-to-right"
    );

    // prepare directions
    if (direction === "right") {
      currentSlide.classList.add("leave-to-left");
      nextSlide.classList.add("enter-from-right");
    } else {
      currentSlide.classList.add("leave-to-right");
      nextSlide.classList.add("enter-from-left");
    }

    currentSlide.classList.remove("active");
    nextSlide.classList.add("active");

    this.current = index;
    this.updateProgress();

    // clean up animation classes after transition
    setTimeout(() => {
      currentSlide.classList.remove("leave-to-left", "leave-to-right");
      nextSlide.classList.remove("enter-from-left", "enter-from-right");
    }, 650);

    // if autoplay triggered this, keep it running
    if (fromAuto) return;
  }

  updateProgress() {
    const max = 327;
    const ratio = this.current / (this.total - 1 || 1);
    this.progressRing.style.strokeDashoffset = String(max - ratio * max);
    this.progressText.textContent = `${String(this.current + 1).padStart(
      2,
      "0"
    )}/${String(this.total).padStart(2, "0")}`;
  }

  /* --------- data / input (simple demo) --------- */
  initInput() {
    const input = document.getElementById("username");
    const btn = document.getElementById("generateBtn");

    input.addEventListener("input", () => {
      btn.disabled = input.value.trim().length < 2;
    });

    btn.addEventListener("click", () => this.generate());
    input.addEventListener("keyup", (e) => {
      if (e.key === "Enter" && !btn.disabled) this.generate();
    });
  }

  async generate() {
    const username = document.getElementById("username").value.trim();
    if (!username) return;

    this.setLoader(true, "Fetching GitHub data…");

    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(
          `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
        )
      ]);

      if (!userRes.ok) throw new Error("User not found");
      const user = await userRes.json();
      const repos = await reposRes.json();

      const stats = {
        repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        stars: repos.reduce((sum, r) => sum + r.stargazers_count, 0)
      };

      const langCounts = {};
      repos.forEach((r) => {
        if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
      });
      const languages = Object.entries(langCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      this.renderProfile(user);
      this.renderStats(stats);
      this.renderLanguages(languages);
      this.renderRepos(repos);

      this.setLoader(false);

      // jump to slide 2 and restart autoplay
      this.goTo(1, "right", true);
      this.resumeAutoplay();
    } catch (e) {
      this.setLoader(false);
      alert("User not found. Try torvalds / sindresorhus / facebook.");
    }
  }

  setLoader(on, text) {
    const loader = document.getElementById("loader");
    const label = document.getElementById("loaderText");
    loader.classList.toggle("active", on);
    if (text) label.textContent = text;
  }

  renderProfile(user) {
    document.getElementById("userName").textContent =
      user.name || user.login || "Unknown user";
    document.getElementById("userBio").textContent =
      user.bio || "No bio provided.";
  }

  renderStats(stats) {
    const root = document.getElementById("statsGrid");
    root.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${stats.repos}</div>
        <div class="stat-label">Repos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.followers}</div>
        <div class="stat-label">Followers</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.following}</div>
        <div class="stat-label">Following</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.stars}</div>
        <div class="stat-label">Stars</div>
      </div>
    `;
  }

  renderLanguages(languages) {
    const root = document.getElementById("languageBars");
    if (!languages.length) {
      root.textContent = "No languages detected.";
      return;
    }
    const total = languages.reduce((s, [, c]) => s + c, 0);
    root.innerHTML = languages
      .map(([name, count]) => {
        const pct = ((count / total) * 100).toFixed(1);
        return `
        <div class="language-row">
          <div class="language-swatch" style="background:${this.langColor(
            name
          )}"></div>
          <div class="language-meta">
            <div class="language-name">${name}</div>
            <div class="language-extra">${count} repos • ${pct}%</div>
          </div>
        </div>`;
      })
      .join("");
  }

  renderRepos(repos) {
    const root = document.getElementById("repoGrid");
    const top = repos
      .filter((r) => r.stargazers_count > 0)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 4);

    if (!top.length) {
      root.textContent = "No popular repositories.";
      return;
    }

    root.innerHTML = top
      .map(
        (r) => `
      <div class="repo-card" data-url="${r.html_url}">
        <div class="repo-name">${r.name}</div>
        <div class="repo-meta">⭐ ${r.stargazers_count} • ${
          r.language || "Unknown"
        }</div>
      </div>`
      )
      .join("");

    root.onclick = (e) => {
      const card = e.target.closest(".repo-card");
      if (card?.dataset.url) window.open(card.dataset.url, "_blank");
    };
  }

  langColor(name) {
    const map = {
      JavaScript: "#facc15",
      TypeScript: "#0ea5e9",
      Python: "#22c55e",
      Java: "#ef4444",
      Go: "#22d3ee",
      Rust: "#f97316"
    };
    return map[name] || `hsl(${Math.random() * 360}, 70%, 55%)`;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new AutoSlider();
});
