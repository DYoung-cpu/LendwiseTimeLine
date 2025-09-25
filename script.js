// Company founding date
const FOUNDING_DATE = new Date("2025-01-01");

// Calculate days since founding
function updateDaysOperating() {
  const now = new Date();
  const diffTime = Math.abs(now - FOUNDING_DATE);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const element = document.getElementById("days-operating");
  if (element) {
    element.textContent = diffDays;
  }
}

// Calculate overall progress
function calculateOverallProgress() {
  const categories = document.querySelectorAll(".milestone-category");
  let totalProgress = 0;
  let categoryCount = 0;

  categories.forEach((category) => {
    const progressText =
      category.querySelector(".category-progress").textContent;
    const progress = parseInt(progressText);
    totalProgress += progress;
    categoryCount++;
  });

  return Math.round(totalProgress / categoryCount);
}

// Count completed milestones
function countCompletedMilestones() {
  const completedMilestones = document.querySelectorAll(".milestone.completed");
  return completedMilestones.length;
}

// Update all statistics
function updateStatistics() {
  // Update days operating
  updateDaysOperating();

  // Update milestones complete
  const milestonesComplete = countCompletedMilestones();
  const milestonesElement = document.getElementById("milestones-complete");
  if (milestonesElement) {
    milestonesElement.textContent = milestonesComplete;
  }

  // Update overall percentage
  const overallProgress = calculateOverallProgress();
  const percentageElement = document.getElementById("overall-percentage");
  if (percentageElement) {
    percentageElement.textContent = overallProgress + "%";
  }

  // Update progress ring
  updateProgressRing(overallProgress);

  // Update phases complete
  const phasesComplete = document.querySelectorAll(
    ".milestone-category",
  ).length;
  const phasesElement = document.getElementById("phases-complete");
  if (phasesElement) {
    // Count categories with >50% progress as "complete phases"
    let completedPhases = 0;
    document.querySelectorAll(".milestone-category").forEach((category) => {
      const progress = parseInt(
        category.querySelector(".category-progress").textContent,
      );
      if (progress > 50) completedPhases++;
    });
    phasesElement.textContent = completedPhases;
  }

  // Calculate days to next milestone
  const nextMilestoneDate = new Date("2025-04-01"); // Q2 2025
  const now = new Date();
  const daysToNext = Math.ceil(
    (nextMilestoneDate - now) / (1000 * 60 * 60 * 24),
  );
  const nextMilestoneElement = document.getElementById("next-milestone-days");
  if (nextMilestoneElement) {
    nextMilestoneElement.textContent = Math.max(0, daysToNext);
  }
}

// Update progress ring animation
function updateProgressRing(percentage) {
  const ring = document.getElementById("overall-ring");
  if (ring) {
    const circumference = 2 * Math.PI * 90; // radius = 90
    const offset = circumference - (percentage / 100) * circumference;

    // Add gradient definition if not exists
    if (!document.getElementById("progress-gradient")) {
      const svg = ring.closest("svg");
      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs",
      );
      const gradient = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "linearGradient",
      );
      gradient.id = "progress-gradient";

      const stop1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop",
      );
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", "#0066ff");

      const stop2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop",
      );
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("stop-color", "#00d4ff");

      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
      svg.appendChild(defs);
    }

    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = offset;
  }
}

// Animate elements on scroll
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";

        // Animate progress bars
        if (entry.target.classList.contains("milestone-category")) {
          const progressBar = entry.target.querySelector(".progress-fill");
          if (progressBar) {
            const width = progressBar.style.width;
            progressBar.style.width = "0";
            setTimeout(() => {
              progressBar.style.width = width;
            }, 100);
          }
        }
      }
    });
  }, observerOptions);

  // Observe all animated elements
  const animatedElements = document.querySelectorAll(
    ".milestone-category, .achievement, .vision-item, .overview-card",
  );
  animatedElements.forEach((element) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(30px)";
    element.style.transition = "all 0.6s ease-out";
    observer.observe(element);
  });
}

// Add hover effects to milestones
function setupMilestoneHovers() {
  const milestones = document.querySelectorAll(".milestone");

  milestones.forEach((milestone) => {
    milestone.addEventListener("mouseenter", function () {
      if (this.classList.contains("in-progress")) {
        this.querySelector(".milestone-icon").style.transform =
          "scale(1.2) rotate(360deg)";
        this.querySelector(".milestone-icon").style.transition =
          "all 0.5s ease";
      }
    });

    milestone.addEventListener("mouseleave", function () {
      if (this.classList.contains("in-progress")) {
        this.querySelector(".milestone-icon").style.transform =
          "scale(1) rotate(0deg)";
      }
    });
  });
}

// WISR Teleportation System - Complete Rewrite with State Machine
function setupWISRTeleportation() {
  const wisrShowcase = document.getElementById("wisr-assistant");
  const wisrCorner = document.getElementById("wisr-corner");
  const mainOwlVideo = document.getElementById("main-owl-video");
  const cornerOwlVideo = document.getElementById("corner-owl-video");
  const mainDematerialize = document.getElementById("main-dematerialize");
  const mainMaterialize = document.getElementById("main-materialize");
  const cornerDematerialize = document.getElementById("corner-dematerialize");
  const cornerMaterialize = document.getElementById("corner-materialize");
  
  // State machine: 'main', 'teleporting-to-corner', 'corner', 'teleporting-to-main'
  let currentState = 'main';
  
  // Fixed scroll thresholds (not dynamic)
  const SCROLL_DOWN_THRESHOLD = 300; // When to teleport to corner
  const SCROLL_UP_THRESHOLD = 250;   // When to teleport back to main
  
  // Debug logging
  function setState(newState) {
    console.log(`[WISR] State change: ${currentState} -> ${newState}`);
    currentState = newState;
    updateDebugDisplay();
  }
  
  // Debug display (temporary)
  function updateDebugDisplay() {
    let debugDiv = document.getElementById('wisr-debug');
    if (!debugDiv) {
      debugDiv = document.createElement('div');
      debugDiv.id = 'wisr-debug';
      debugDiv.style.cssText = 'position: fixed; bottom: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; font-size: 12px; z-index: 99999; border-radius: 5px;';
      document.body.appendChild(debugDiv);
    }
    debugDiv.textContent = `WISR State: ${currentState} | Scroll: ${window.pageYOffset}`;
  }
  
  // Initialize - ensure main WISR is visible
  function initialize() {
    console.log('[WISR] Initializing teleportation system');
    
    // Hide all effect videos
    [mainDematerialize, mainMaterialize, cornerDematerialize, cornerMaterialize].forEach(video => {
      if (video) video.style.display = 'none';
    });
    
    // Set main WISR visible
    if (wisrShowcase) {
      wisrShowcase.style.opacity = '1';
      wisrShowcase.style.display = 'block';
    }
    if (mainOwlVideo) {
      mainOwlVideo.style.display = 'block';
    }
    
    // Hide corner WISR
    if (wisrCorner) {
      wisrCorner.style.display = 'none';
    }
    if (cornerOwlVideo) {
      cornerOwlVideo.style.display = 'none';
    }
    
    setState('main');
  }
  
  // Clean up all videos
  function cleanupVideos() {
    [mainDematerialize, mainMaterialize, cornerDematerialize, cornerMaterialize].forEach(video => {
      if (video) {
        video.pause();
        video.currentTime = 0;
        video.style.display = 'none';
      }
    });
  }
  
  // Teleport to corner with promise-based flow
  function teleportToCorner() {
    if (currentState !== 'main') {
      console.log('[WISR] Cannot teleport to corner - not in main state');
      return;
    }
    
    setState('teleporting-to-corner');
    
    // Step 1: Hide main owl and play dematerialization
    mainOwlVideo.style.display = 'none';
    mainDematerialize.style.display = 'block';
    mainDematerialize.currentTime = 0;
    
    // Start dematerialization but don't wait for it to finish
    mainDematerialize.play().catch(() => {
      console.log('[WISR] Dematerialization video failed to play');
    });
    
    // Immediately start showing corner after a brief delay (300ms)
    setTimeout(() => {
      // Hide main showcase
      mainDematerialize.style.display = 'none';
      wisrShowcase.style.opacity = '0';
      
      // Show corner container and start materialization immediately
      wisrCorner.style.display = 'block';
      cornerMaterialize.style.display = 'block';
      cornerMaterialize.currentTime = 0;
      
      // Play materialization
      cornerMaterialize.play().then(() => {
        // When materialization ends, show the owl video
        setTimeout(() => {
          cornerMaterialize.style.display = 'none';
          cornerOwlVideo.style.display = 'block';
          setState('corner');
          console.log('[WISR] Materialization in corner complete');
        }, 500); // Shorten the materialization display time
      }).catch(() => {
        // Fallback if video fails - just show the owl
        cornerMaterialize.style.display = 'none';
        cornerOwlVideo.style.display = 'block';
        setState('corner');
      });
    }, 300); // Start corner appearance after just 300ms
  }
  
  // Teleport back to main with promise-based flow
  function teleportToMain() {
    if (currentState !== 'corner') {
      console.log('[WISR] Cannot teleport to main - not in corner state');
      return;
    }
    
    setState('teleporting-to-main');
    
    // Step 1: Hide corner owl and play dematerialization
    cornerOwlVideo.style.display = 'none';
    cornerDematerialize.style.display = 'block';
    cornerDematerialize.currentTime = 0;
    
    // Start dematerialization but don't wait for it to finish
    cornerDematerialize.play().catch(() => {
      console.log('[WISR] Corner dematerialization video failed to play');
    });
    
    // Immediately start showing main after a brief delay (300ms)
    setTimeout(() => {
      // Hide corner
      cornerDematerialize.style.display = 'none';
      wisrCorner.style.display = 'none';
      
      // Show main container and start materialization immediately
      wisrShowcase.style.opacity = '1';
      wisrShowcase.style.display = 'block';
      mainMaterialize.style.display = 'block';
      mainMaterialize.currentTime = 0;
      
      // Play materialization
      mainMaterialize.play().then(() => {
        // When materialization ends, show the owl video
        setTimeout(() => {
          mainMaterialize.style.display = 'none';
          mainOwlVideo.style.display = 'block';
          setState('main');
          console.log('[WISR] Materialization in main complete');
        }, 500); // Shorten the materialization display time
      }).catch(() => {
        // Fallback if video fails - just show the owl
        mainMaterialize.style.display = 'none';
        mainOwlVideo.style.display = 'block';
        setState('main');
      });
    }, 300); // Start main appearance after just 300ms
  }
  
  // Scroll handler with fixed thresholds
  let lastScrollY = 0;
  function handleScroll() {
    const scrollY = window.pageYOffset;
    updateDebugDisplay();
    
    // Only check if not transitioning
    if (currentState === 'teleporting-to-corner' || currentState === 'teleporting-to-main') {
      return;
    }
    
    // Check for teleport to corner
    if (currentState === 'main' && scrollY > SCROLL_DOWN_THRESHOLD) {
      console.log('[WISR] Scroll threshold reached - teleporting to corner');
      teleportToCorner();
    }
    // Check for teleport back to main
    else if (currentState === 'corner' && scrollY < SCROLL_UP_THRESHOLD) {
      console.log('[WISR] Scroll threshold reached - teleporting to main');
      teleportToMain();
    }
    
    lastScrollY = scrollY;
  }
  
  // Debounced scroll handler
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScroll, 50); // 50ms debounce
  });
  
  // Corner WISR click handler
  if (wisrCorner) {
    wisrCorner.addEventListener('click', () => {
      showNotification('WISR is ready to assist! Scroll up to return to the main interface.');
    });
  }
  
  // Initialize on load
  initialize();
}

// Simulate live updates (in production, this would fetch from an API)
function simulateLiveUpdates() {
  // Randomly update a milestone status every 30 seconds (for demo)
  setInterval(() => {
    const pendingMilestones = document.querySelectorAll(
      ".milestone:not(.completed):not(.in-progress)",
    );
    if (pendingMilestones.length > 0) {
      const randomIndex = Math.floor(Math.random() * pendingMilestones.length);
      const milestone = pendingMilestones[randomIndex];

      // Add "NEW" animation
      milestone.classList.add("in-progress");
      milestone.querySelector(".milestone-icon").textContent = "⟳";

      // Create notification
      showNotification(
        `New Progress: ${milestone.querySelector(".milestone-text").textContent}`,
      );
    }
  }, 30000);
}

// Show notification for updates
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `
        <div class="notification-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <span>${message}</span>
        </div>
    `;

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #34d399);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(16, 185, 129, 0.3);
            animation: slideInRight 0.5s ease-out;
            z-index: 10000;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;

  if (!document.querySelector("style[data-notifications]")) {
    style.setAttribute("data-notifications", "true");
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.5s ease-out";
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 5000);
}

// Particle effect for hero background
function createParticles() {
  const particlesContainer = document.createElement("div");
  particlesContainer.className = "particles";
  particlesContainer.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
    `;

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div");
    particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: rgba(0, 212, 255, ${Math.random() * 0.5 + 0.2});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 10 + 10}s infinite ease-in-out;
            animation-delay: ${Math.random() * 5}s;
        `;
    particlesContainer.appendChild(particle);
  }

  const heroBackground = document.querySelector(".hero-background");
  if (heroBackground) {
    heroBackground.appendChild(particlesContainer);
  }

  // Add float animation
  if (!document.querySelector("style[data-particles]")) {
    const style = document.createElement("style");
    style.setAttribute("data-particles", "true");
    style.textContent = `
            @keyframes float {
                0%, 100% {
                    transform: translate(0, 0) scale(1);
                    opacity: 0.2;
                }
                25% {
                    transform: translate(50px, -50px) scale(1.1);
                    opacity: 0.5;
                }
                50% {
                    transform: translate(-30px, 30px) scale(0.9);
                    opacity: 0.3;
                }
                75% {
                    transform: translate(40px, 20px) scale(1.05);
                    opacity: 0.4;
                }
            }
        `;
    document.head.appendChild(style);
  }
}

// Setup WISR Assistant button
function setupWISRButton() {
  const wisrButton = document.getElementById("wisr-assistant");
  if (wisrButton) {
    wisrButton.addEventListener("click", () => {
      // For now, show a coming soon message
      showNotification(
        "WISR Q&A Coming Soon! Ask me anything about LendWise Mortgage.",
      );

      // In the future, this will open a chat interface
      console.log(
        "WISR Assistant clicked - Q&A interface will be implemented here",
      );
    });

    // Add hover tooltip
    wisrButton.addEventListener("mouseenter", () => {
      if (!document.querySelector(".wisr-tooltip")) {
        const tooltip = document.createElement("div");
        tooltip.className = "wisr-tooltip";
        tooltip.textContent = "Ask WISR about LendWise";
        tooltip.style.cssText = `
                    position: absolute;
                    top: 220px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(30, 41, 59, 0.95);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    white-space: nowrap;
                    z-index: 1000;
                    pointer-events: none;
                    animation: fadeIn 0.3s ease;
                `;
        wisrButton.appendChild(tooltip);
      }
    });

    wisrButton.addEventListener("mouseleave", () => {
      const tooltip = document.querySelector(".wisr-tooltip");
      if (tooltip) {
        tooltip.remove();
      }
    });
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("LendWise Mortgage - Company Progress Tracker Initialized");

  // Initialize all features
  updateStatistics();
  setupScrollAnimations();
  setupMilestoneHovers();
  setupWISRTeleportation(); // Teleportation to top-right corner
  setupWISRButton();
  createParticles();

  // Start live updates (demo mode)
  // simulateLiveUpdates(); // Commented out for production

  // Update statistics every minute
  setInterval(updateStatistics, 60000);

  // Log milestone data for tracking
  console.log(
    `Total Milestones: ${document.querySelectorAll(".milestone").length}`,
  );
  console.log(`Completed: ${countCompletedMilestones()}`);
  console.log(`Overall Progress: ${calculateOverallProgress()}%`);
});
