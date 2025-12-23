// app.js - PERFECT RESPONSIVE VERSION
class GitHubWrapped {
  constructor() {
    this.slides = Array.from(document.querySelectorAll(".slide"));
    this.current = 0;
    this.total = this.slides.length;
    this.intervalMs = 7000;
    this.timer = null;
    this.data = null;
    this.isLoading = false;
    this.isTyping = false; // NEW: Typing detection

    this.init();
  }

  init() {
    this.createParticles();
    this.createNavDots();
    this.initAutoplay();
    this.initControls();
    this.initInput();
    this.updateProgress();
    this.handleResize(); // NEW: Responsive handling
  }

  // FIXED: Autoplay pauses during typing
  initInput() {
    const input = document.getElementById("username");
    const btn = document.getElementById("generateBtn");
    if (!input || !btn) return;

    const enableBtn = () => {
      btn.disabled = input.value.trim().length < 2;
    };

    // PAUSE AUTOPLAY WHILE TYPING
    input.addEventListener("focus", () => {
      this.isTyping = true;
      this.pauseAutoplay();
    });

    input.addEventListener("blur", () => {
      this.isTyping = false;
      if (!this.isLoading) this.resumeAutoplay();
    });

    input.addEventListener("input", () => {
      enableBtn();
      this.isTyping = true;
      this.pauseAutoplay();
    });

    // Resume after short delay when typing stops
    let typingTimer;
    input.addEventListener("keyup", () => {
      this.isTyping = true;
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        this.isTyping = false;
        if (!this.isLoading) this.resumeAutoplay();
      }, 1500);
      
      if (e.key === "Enter" && !btn.disabled) this.generate();
    });

    btn.addEventListener("click", () => this.generate());
  }

  startAutoplay() {
    // ONLY start if NOT typing/loading
    if (this.timer || this.isTyping || this.isLoading) return;
    
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.isTyping && !this.isLoading) {
        this.next();
      }
    }, this.intervalMs);
  }

  pauseAutoplay() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resumeAutoplay() {
    if (!this.isTyping && !this.isLoading) {
      this.startAutoplay();
    }
  }

  // NEW: Responsive handling
  handleResize() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.updateLayout();
      }, 250);
    });
    this.updateLayout();
  }

  updateLayout() {
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle('mobile', isMobile);
    
    // Adjust nav dots position
    const navDots = document.getElementById('navDots');
    if (navDots) {
      navDots.style.right = isMobile ? '1rem' : '2rem';
    }
  }

  // Rest of methods unchanged...
  createParticles() {
    const container = document.getElementById("particles");
    if (!container) return;
    for (let i = 0; i < window.innerWidth < 768 ? 10 : 20; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${15 + Math.random() * 10}s`;
      particle.style.animationDelay = `${Math.random() * -20}s`;
      container.appendChild(particle);
    }
  }

  // [Include all other methods from previous version - renderProfile, renderStats, etc.]
  // ... (keeping everything else identical)
}

// Same initialization
window.addEventListener("DOMContentLoaded", () => new GitHubWrapped());
