// LendWise Auto-Inspector - Automatically analyzes CSS for AI assistance
// Paste this in DevTools Console or include in your HTML

const LendWiseInspector = {
  // CSS Change Validator - Captures state before/after changes
  validator: {
    stateHistory: [],
    currentState: null,

    // Capture state before making changes
    captureState: function(selectors = ['.timeline-border-container', '.new-filter-container', '.timeline-container']) {
      const state = {};
      selectors.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
          const computed = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          state[selector] = {
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              centerX: rect.left + (rect.width / 2),
              centerY: rect.top + (rect.height / 2)
            },
            computed: {
              position: computed.position,
              top: computed.top,
              left: computed.left,
              padding: computed.padding,
              margin: computed.margin,
              transform: computed.transform,
              overflow: computed.overflow,
              zIndex: computed.zIndex
            },
            parents: this.getParentChain(el)
          };
        }
      });

      this.currentState = state;
      this.stateHistory.push({
        timestamp: new Date().toISOString(),
        state: JSON.parse(JSON.stringify(state))
      });

      console.log('📸 State captured:', Object.keys(state));
      return state;
    },

    // Get parent CSS context chain
    getParentChain: function(element) {
      const chain = [];
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const computed = window.getComputedStyle(parent);
        chain.push({
          tag: parent.tagName,
          class: parent.className,
          position: computed.position,
          overflow: computed.overflow,
          transform: computed.transform
        });
        parent = parent.parentElement;
      }
      return chain;
    },

    // Verify position after changes
    verifyPosition: function(selector, expectations = {}) {
      const el = document.querySelector(selector);
      if (!el) {
        console.error('❌ Element not found:', selector);
        return false;
      }

      const rect = el.getBoundingClientRect();
      const errors = [];

      // Check if element is visible
      if (rect.width === 0 || rect.height === 0) {
        errors.push('Element has no dimensions (might be hidden)');
      }

      // Check expected position
      if (expectations.top !== undefined) {
        const diff = Math.abs(rect.top - expectations.top);
        if (diff > 50) {
          errors.push(`Top position off by ${diff}px (expected: ${expectations.top}, actual: ${rect.top})`);
        }
      }

      // Check if centered horizontally
      if (expectations.centered) {
        const parent = el.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const parentCenter = parentRect.left + (parentRect.width / 2);
          const elCenter = rect.left + (rect.width / 2);
          const centerDiff = Math.abs(parentCenter - elCenter);
          if (centerDiff > 10) {
            errors.push(`Not centered - off by ${centerDiff}px`);
          }
        }
      }

      // Check if within viewport
      if (rect.top < -100 || rect.left < -100 || rect.bottom > window.innerHeight + 100 || rect.right > window.innerWidth + 100) {
        errors.push('Element appears to be outside viewport');
      }

      if (errors.length > 0) {
        console.error('❌ Position verification failed:', selector);
        errors.forEach(err => console.error('  -', err));
        return false;
      }

      console.log('✅ Position verified:', selector);
      return true;
    },

    // Compare current state to captured state
    compareStates: function(selector) {
      if (!this.currentState || !this.currentState[selector]) {
        console.warn('No previous state to compare');
        return null;
      }

      const el = document.querySelector(selector);
      if (!el) return null;

      const rect = el.getBoundingClientRect();
      const oldState = this.currentState[selector];

      const comparison = {
        position: {
          topDiff: rect.top - oldState.position.top,
          leftDiff: rect.left - oldState.position.left,
          widthDiff: rect.width - oldState.position.width,
          heightDiff: rect.height - oldState.position.height
        },
        significant: false
      };

      // Check if changes are significant
      if (Math.abs(comparison.position.topDiff) > 5 ||
          Math.abs(comparison.position.leftDiff) > 5) {
        comparison.significant = true;
      }

      return comparison;
    },

    // Auto-rollback if position is wrong
    rollback: function(cssFile = 'timeline-dev.css') {
      console.warn('🔄 Initiating rollback...');
      const lastGoodCommit = 'WORKS-2025-10-02-before-changes';

      // This would typically run a git command
      console.log(`Would run: git checkout ${lastGoodCommit} -- ${cssFile}`);
      console.log('⚠️ Manual rollback command copied to clipboard');

      const command = `git checkout ${lastGoodCommit} -- ${cssFile}`;
      navigator.clipboard.writeText(command);

      return command;
    },

    // Automatic rollback with validation
    autoRollback: {
      enabled: false,
      threshold: {
        positionDelta: 100,  // Max allowed position change in pixels
        sizeDelta: 200,      // Max allowed size change in pixels
        visibilityLoss: true // Rollback if element becomes invisible
      },

      // Enable auto-rollback monitoring
      enable: function() {
        this.enabled = true;
        console.log('🛡️ Auto-rollback protection ENABLED');
        console.log('Thresholds:', this.threshold);
      },

      // Disable auto-rollback
      disable: function() {
        this.enabled = false;
        console.log('🛡️ Auto-rollback protection DISABLED');
      },

      // Check if rollback is needed based on changes
      checkRollbackNeeded: function(selector, beforeState, afterState) {
        if (!this.enabled) return false;

        const reasons = [];

        // Check position changes
        if (beforeState && afterState) {
          const posDelta = {
            top: Math.abs(afterState.position.top - beforeState.position.top),
            left: Math.abs(afterState.position.left - beforeState.position.left)
          };

          if (posDelta.top > this.threshold.positionDelta ||
              posDelta.left > this.threshold.positionDelta) {
            reasons.push(`Position changed too much: Δtop=${posDelta.top}px, Δleft=${posDelta.left}px`);
          }

          // Check size changes
          const sizeDelta = {
            width: Math.abs(afterState.position.width - beforeState.position.width),
            height: Math.abs(afterState.position.height - beforeState.position.height)
          };

          if (sizeDelta.width > this.threshold.sizeDelta ||
              sizeDelta.height > this.threshold.sizeDelta) {
            reasons.push(`Size changed too much: Δwidth=${sizeDelta.width}px, Δheight=${sizeDelta.height}px`);
          }

          // Check visibility
          if (this.threshold.visibilityLoss &&
              beforeState.position.width > 0 && beforeState.position.height > 0 &&
              (afterState.position.width === 0 || afterState.position.height === 0)) {
            reasons.push('Element became invisible');
          }
        }

        if (reasons.length > 0) {
          console.error('🚨 ROLLBACK NEEDED!');
          reasons.forEach(r => console.error('  -', r));
          return { needed: true, reasons };
        }

        return { needed: false };
      },

      // Monitor and auto-rollback if needed
      monitor: function(selectors, callback) {
        console.log('👁️ Starting auto-rollback monitor...');

        // Capture initial state
        const initialStates = {};
        selectors.forEach(selector => {
          const el = document.querySelector(selector);
          if (el) {
            const rect = el.getBoundingClientRect();
            initialStates[selector] = { position: rect };
          }
        });

        // Set up monitoring
        const checkInterval = setInterval(() => {
          let rollbackNeeded = false;

          selectors.forEach(selector => {
            const el = document.querySelector(selector);
            if (!el && initialStates[selector]) {
              console.error(`🚨 Element lost: ${selector}`);
              rollbackNeeded = true;
              return;
            }

            if (el && initialStates[selector]) {
              const rect = el.getBoundingClientRect();
              const currentState = { position: rect };
              const check = this.checkRollbackNeeded(selector, initialStates[selector], currentState);

              if (check.needed) {
                rollbackNeeded = true;
              }
            }
          });

          if (rollbackNeeded) {
            clearInterval(checkInterval);
            console.error('🚨 AUTO-ROLLBACK TRIGGERED!');
            const command = LendWiseInspector.validator.rollback();

            if (callback) {
              callback(command);
            } else {
              console.log('Run this command to rollback:', command);
              alert('CSS changes exceeded safety thresholds!\n\nRollback command copied to clipboard.');
            }
          }
        }, 500);

        // Auto-stop after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log('⏹️ Auto-rollback monitor stopped (timeout)');
        }, 30000);

        return checkInterval;
      }
    },

    // Visual verification - takes screenshot-like snapshot
    captureVisualState: function(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;

      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);

      // Capture visual properties
      const visualState = {
        // Position and size
        bounds: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom
        },
        // Visual styles
        appearance: {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          borderWidth: computed.borderWidth,
          borderRadius: computed.borderRadius,
          boxShadow: computed.boxShadow,
          opacity: computed.opacity,
          transform: computed.transform
        },
        // Visibility checks
        visibility: {
          isVisible: rect.width > 0 && rect.height > 0,
          isInViewport: (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
          ),
          isPartiallyInViewport: (
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < window.innerHeight &&
            rect.left < window.innerWidth
          ),
          isOverflowing: el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth
        },
        // Children count and structure
        structure: {
          childCount: el.children.length,
          hasText: el.textContent.trim().length > 0,
          tagName: el.tagName.toLowerCase(),
          className: el.className
        }
      };

      return visualState;
    },

    // Compare visual states and detect significant changes
    compareVisualStates: function(selector, previousState = null) {
      const currentState = this.captureVisualState(selector);
      if (!currentState || !previousState) return null;

      const changes = {
        positionChanged: false,
        sizeChanged: false,
        styleChanged: false,
        visibilityChanged: false,
        details: []
      };

      // Check position changes
      if (Math.abs(currentState.bounds.top - previousState.bounds.top) > 2 ||
          Math.abs(currentState.bounds.left - previousState.bounds.left) > 2) {
        changes.positionChanged = true;
        changes.details.push(`Position moved: Δtop=${currentState.bounds.top - previousState.bounds.top}px, Δleft=${currentState.bounds.left - previousState.bounds.left}px`);
      }

      // Check size changes
      if (Math.abs(currentState.bounds.width - previousState.bounds.width) > 2 ||
          Math.abs(currentState.bounds.height - previousState.bounds.height) > 2) {
        changes.sizeChanged = true;
        changes.details.push(`Size changed: Δwidth=${currentState.bounds.width - previousState.bounds.width}px, Δheight=${currentState.bounds.height - previousState.bounds.height}px`);
      }

      // Check style changes
      if (currentState.appearance.backgroundColor !== previousState.appearance.backgroundColor ||
          currentState.appearance.borderColor !== previousState.appearance.borderColor ||
          currentState.appearance.boxShadow !== previousState.appearance.boxShadow) {
        changes.styleChanged = true;
        changes.details.push('Visual style properties changed');
      }

      // Check visibility changes
      if (currentState.visibility.isVisible !== previousState.visibility.isVisible) {
        changes.visibilityChanged = true;
        changes.details.push(`Visibility changed: ${previousState.visibility.isVisible ? 'visible→hidden' : 'hidden→visible'}`);
      }

      return changes;
    },

    // Generate visual diff report
    visualDiff: function(selectors) {
      console.log('📸 Generating visual diff report...');
      const report = [];

      selectors.forEach(selector => {
        const el = document.querySelector(selector);
        if (!el) {
          report.push({
            selector,
            status: 'not found',
            error: 'Element does not exist'
          });
          return;
        }

        const visualState = this.captureVisualState(selector);
        const previousState = this.currentState?.[selector];

        if (previousState) {
          const changes = this.compareVisualStates(selector, previousState);
          report.push({
            selector,
            status: 'analyzed',
            visual: visualState,
            changes
          });
        } else {
          report.push({
            selector,
            status: 'no baseline',
            visual: visualState
          });
        }
      });

      // Output formatted report
      console.log('===== Visual Diff Report =====');
      report.forEach(item => {
        console.log(`\n📍 ${item.selector}:`);
        if (item.status === 'not found') {
          console.error('  ❌ Element not found');
        } else if (item.status === 'no baseline') {
          console.warn('  ⚠️ No baseline to compare (run captureCSS first)');
          console.log('  Current state:', item.visual);
        } else {
          if (item.changes && item.changes.details.length > 0) {
            console.log('  🔄 Changes detected:');
            item.changes.details.forEach(detail => console.log('    -', detail));
          } else {
            console.log('  ✅ No significant changes');
          }
        }
      });

      return report;
    },

    // Position tracking system - monitors element positions over time
    positionTracker: {
      tracking: {},
      intervals: {},

      // Start tracking an element's position
      startTracking: function(selector, interval = 100) {
        if (this.intervals[selector]) {
          console.warn('Already tracking:', selector);
          return;
        }

        this.tracking[selector] = [];
        const startTime = Date.now();

        this.intervals[selector] = setInterval(() => {
          const el = document.querySelector(selector);
          if (!el) {
            console.error('Lost element:', selector);
            this.stopTracking(selector);
            return;
          }

          const rect = el.getBoundingClientRect();
          const computed = window.getComputedStyle(el);

          const snapshot = {
            timestamp: Date.now() - startTime,
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            },
            computed: {
              position: computed.position,
              transform: computed.transform,
              display: computed.display
            }
          };

          this.tracking[selector].push(snapshot);

          // Keep only last 100 snapshots
          if (this.tracking[selector].length > 100) {
            this.tracking[selector].shift();
          }
        }, interval);

        console.log(`📍 Started tracking: ${selector} (every ${interval}ms)`);
      },

      // Stop tracking an element
      stopTracking: function(selector) {
        if (this.intervals[selector]) {
          clearInterval(this.intervals[selector]);
          delete this.intervals[selector];
          console.log(`⏹️ Stopped tracking: ${selector}`);
        }
      },

      // Get tracking history for an element
      getHistory: function(selector) {
        return this.tracking[selector] || [];
      },

      // Analyze movement patterns
      analyzeMovement: function(selector) {
        const history = this.tracking[selector];
        if (!history || history.length < 2) {
          console.warn('Not enough data to analyze');
          return null;
        }

        const first = history[0];
        const last = history[history.length - 1];

        const analysis = {
          totalMovement: {
            x: last.position.left - first.position.left,
            y: last.position.top - first.position.top
          },
          sizeChange: {
            width: last.position.width - first.position.width,
            height: last.position.height - first.position.height
          },
          duration: last.timestamp,
          samples: history.length,
          isStable: true
        };

        // Check if position is stable (not changing in last 5 samples)
        if (history.length >= 5) {
          const recent = history.slice(-5);
          for (let i = 1; i < recent.length; i++) {
            if (Math.abs(recent[i].position.top - recent[i-1].position.top) > 1 ||
                Math.abs(recent[i].position.left - recent[i-1].position.left) > 1) {
              analysis.isStable = false;
              break;
            }
          }
        }

        return analysis;
      },

      // Stop all tracking
      stopAll: function() {
        Object.keys(this.intervals).forEach(selector => {
          this.stopTracking(selector);
        });
        this.tracking = {};
        console.log('⏹️ Stopped all tracking');
      }
    },

    // Validate CSS change impact
    validateChange: function(selectors, expectations = {}) {
      console.log('🔍 Validating CSS changes...');

      const results = {
        passed: [],
        failed: [],
        warnings: []
      };

      selectors.forEach(selector => {
        const el = document.querySelector(selector);
        if (!el) {
          results.failed.push(`${selector}: Element not found`);
          return;
        }

        // Check position
        if (expectations[selector]) {
          const valid = this.verifyPosition(selector, expectations[selector]);
          if (valid) {
            results.passed.push(`${selector}: Position correct`);
          } else {
            results.failed.push(`${selector}: Position incorrect`);
          }
        }

        // Check for common CSS issues
        const computed = window.getComputedStyle(el);

        // Warning for absolute positioned elements without positioned parents
        if (computed.position === 'absolute') {
          let parent = el.parentElement;
          let hasPositionedParent = false;
          while (parent && parent !== document.body) {
            const parentComputed = window.getComputedStyle(parent);
            if (parentComputed.position !== 'static') {
              hasPositionedParent = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (!hasPositionedParent) {
            results.warnings.push(`${selector}: Absolute positioned without positioned parent`);
          }
        }

        // Warning for overflow hidden that might clip children
        if (computed.overflow === 'hidden') {
          results.warnings.push(`${selector}: Has overflow:hidden - might clip children`);
        }
      });

      // Output summary
      console.log('===== Validation Results =====');
      if (results.passed.length > 0) {
        console.log('✅ Passed:', results.passed.length);
        results.passed.forEach(p => console.log('  ✓', p));
      }
      if (results.failed.length > 0) {
        console.error('❌ Failed:', results.failed.length);
        results.failed.forEach(f => console.error('  ✗', f));
      }
      if (results.warnings.length > 0) {
        console.warn('⚠️ Warnings:', results.warnings.length);
        results.warnings.forEach(w => console.warn('  !', w));
      }

      return results;
    }
  },

  // Analyze element based on visual description
  findElement: function(description) {
    const keywords = {
      'border': ['.timeline-border-container', '.timeline-border', '.border'],
      'timeline': ['.timeline-container', '.timeline', '.timeline-viewport'],
      'filter': ['.filter-btn', '.new-filter-btn', '.filter-container'],
      'arrow': ['.nav-arrow', '.timeline-nav', '.arrow-left', '.arrow-right'],
      'event': ['.timeline-event', '.event-item', '.milestone']
    };

    // Find matching selectors based on description
    for (let [key, selectors] of Object.entries(keywords)) {
      if (description.toLowerCase().includes(key)) {
        for (let selector of selectors) {
          const element = document.querySelector(selector);
          if (element) return element;
        }
      }
    }
    return null;
  },

  // Get all relevant CSS for an element
  analyzeElement: function(element) {
    if (!element) return null;

    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return {
      selector: this.getSelector(element),
      dimensions: {
        width: rect.width + 'px',
        height: rect.height + 'px',
        top: rect.top + 'px',
        left: rect.left + 'px'
      },
      spacing: {
        padding: computed.padding,
        margin: computed.margin,
        border: computed.border
      },
      positioning: {
        position: computed.position,
        top: computed.top,
        left: computed.left,
        transform: computed.transform
      },
      appearance: {
        background: computed.background,
        color: computed.color,
        opacity: computed.opacity,
        boxShadow: computed.boxShadow
      }
    };
  },

  // Get unique selector for element
  getSelector: function(element) {
    if (element.id) return '#' + element.id;
    if (element.className) return '.' + element.className.split(' ')[0];
    return element.tagName.toLowerCase();
  },

  // Main analysis function - call this with your request
  analyze: function(request) {
    console.log('🔍 Analyzing:', request);

    // Parse the request
    const element = this.findElement(request);
    if (!element) {
      return {
        error: "Element not found for: " + request,
        suggestion: "Try being more specific or check element exists"
      };
    }

    // Get full analysis
    const analysis = this.analyzeElement(element);

    // Add interpretation based on request
    if (request.includes('thin') || request.includes('thick')) {
      analysis.relevant = {
        padding: analysis.spacing.padding,
        borderWidth: analysis.spacing.border,
        actualHeight: analysis.dimensions.height
      };
    }

    if (request.includes('move') || request.includes('position')) {
      analysis.relevant = {
        position: analysis.positioning.position,
        top: analysis.positioning.top,
        marginTop: analysis.spacing.margin,
        transform: analysis.positioning.transform
      };
    }

    return analysis;
  },

  // Copy result to clipboard for pasting to AI
  copyAnalysis: function(request) {
    const analysis = this.analyze(request);
    const text = `CSS Analysis Result:\n${JSON.stringify(analysis, null, 2)}`;
    navigator.clipboard.writeText(text);
    console.log('📋 Analysis copied to clipboard!');
    return analysis;
  },

  // Monitor changes in real-time
  watchElement: function(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.error('Element not found:', selector);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      console.log('🔄 Element changed:', selector);
      console.table(this.analyzeElement(element));
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    console.log('👁️ Watching:', selector);
  }
};

// Auto-run helpers
window.inspect = LendWiseInspector.analyze.bind(LendWiseInspector);
window.inspectCopy = LendWiseInspector.copyAnalysis.bind(LendWiseInspector);
window.watchCSS = LendWiseInspector.watchElement.bind(LendWiseInspector);

// CSS Validator shortcuts
window.captureCSS = LendWiseInspector.validator.captureState.bind(LendWiseInspector.validator);
window.verifyCSS = LendWiseInspector.validator.verifyPosition.bind(LendWiseInspector.validator);
window.validateCSS = LendWiseInspector.validator.validateChange.bind(LendWiseInspector.validator);
window.compareCSS = LendWiseInspector.validator.compareStates.bind(LendWiseInspector.validator);
window.rollbackCSS = LendWiseInspector.validator.rollback.bind(LendWiseInspector.validator);
window.visualDiff = LendWiseInspector.validator.visualDiff.bind(LendWiseInspector.validator);

// Position tracking shortcuts
window.trackPosition = LendWiseInspector.validator.positionTracker.startTracking.bind(LendWiseInspector.validator.positionTracker);
window.stopTracking = LendWiseInspector.validator.positionTracker.stopTracking.bind(LendWiseInspector.validator.positionTracker);
window.analyzeMovement = LendWiseInspector.validator.positionTracker.analyzeMovement.bind(LendWiseInspector.validator.positionTracker);

// Auto-rollback shortcuts
window.enableAutoRollback = LendWiseInspector.validator.autoRollback.enable.bind(LendWiseInspector.validator.autoRollback);
window.disableAutoRollback = LendWiseInspector.validator.autoRollback.disable.bind(LendWiseInspector.validator.autoRollback);
window.monitorCSS = LendWiseInspector.validator.autoRollback.monitor.bind(LendWiseInspector.validator.autoRollback);

// Helper for filter positioning workflow
window.checkFilter = function() {
  const selectors = ['.timeline-border-container', '.new-filter-container', '.filter-btn'];
  const expectations = {
    '.new-filter-container': { centered: true },
    '.timeline-border-container': { top: 200 } // Approximate expected position
  };
  return LendWiseInspector.validator.validateChange(selectors, expectations);
};

// Comprehensive validation workflow
window.safeCSS = function() {
  console.log('🛡️ Starting SAFE CSS workflow...');

  // 1. Capture current state
  window.captureCSS();

  // 2. Enable auto-rollback
  window.enableAutoRollback();

  // 3. Start monitoring critical elements
  const criticalSelectors = ['.timeline-border-container', '.new-filter-container', '.timeline-container'];
  window.monitorCSS(criticalSelectors);

  console.log('✅ Safe mode activated! Make your CSS changes now.');
  console.log('If something breaks, rollback will be triggered automatically.');
};

console.log(`
🚀 LendWise Inspector Ready with CSS Change Validator!

📋 Analysis Commands:
- inspect('border')           // Analyze border
- inspect('timeline')         // Analyze timeline
- inspectCopy('border')       // Analyze & copy to clipboard
- watchCSS('.timeline-border') // Watch for changes

🛡️ CSS Validator Commands:
- captureCSS()               // Capture current state before changes
- verifyCSS(selector, {})    // Verify element position
- validateCSS(selectors, {}) // Validate multiple elements
- compareCSS(selector)       // Compare to captured state
- visualDiff(selectors)      // Generate visual diff report
- rollbackCSS()             // Get rollback command

📍 Position Tracking:
- trackPosition(selector)    // Start tracking element position
- stopTracking(selector)     // Stop tracking
- analyzeMovement(selector)  // Analyze movement patterns

🔄 Auto-Rollback Protection:
- enableAutoRollback()       // Enable automatic protection
- disableAutoRollback()      // Disable protection
- monitorCSS(selectors)      // Monitor elements for drastic changes
- safeCSS()                  // ONE COMMAND to enable all protections!

🎯 Quick Helpers:
- checkFilter()             // Validate filter positioning
- safeCSS()                 // Activate all safety features

📝 RECOMMENDED Workflow:
1. safeCSS()                                 // Enable ALL protections
2. [Make CSS changes]
3. checkFilter()                             // Verify filter position
4. visualDiff(['.new-filter-container'])     // See what changed

💡 Pro tip: Always use safeCSS() before making changes!
`);

// Auto-initialize protection on page load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    // Auto-capture initial state
    setTimeout(() => {
      console.log('🛡️ Auto-protection initializing...');

      // Capture baseline state
      LendWiseInspector.validator.captureState();

      // Enable auto-rollback with sensible defaults
      LendWiseInspector.validator.autoRollback.threshold = {
        positionDelta: 150,  // Allow reasonable movement
        sizeDelta: 300,      // Allow size changes
        visibilityLoss: true // Always protect against hiding
      };
      LendWiseInspector.validator.autoRollback.enable();

      // Start monitoring critical elements
      const criticalElements = [
        '.timeline-border-container',
        '.new-filter-container',
        '.timeline-container'
      ];

      // Check for changes every second
      setInterval(() => {
        criticalElements.forEach(selector => {
          const el = document.querySelector(selector);
          if (!el) return;

          const comparison = LendWiseInspector.validator.compareStates(selector);
          if (comparison && comparison.significant) {
            console.warn(`⚠️ ${selector} moved significantly`);
          }
        });

        // Re-capture state periodically for fresh baseline
        LendWiseInspector.validator.captureState();
      }, 1000);

      console.log('✅ CSS protection active in background');
      console.log('The page will warn you if elements move unexpectedly');

    }, 1000); // Wait 1 second for page to fully load
  });
}

// Return inspector object
LendWiseInspector;