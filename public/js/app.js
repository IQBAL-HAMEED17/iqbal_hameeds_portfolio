// App — Main orchestrator with robust error handling
class App {
    constructor() {
        this.threeScene = null;
        this.particles = null;
        this.animations = null;
        this.contentLoader = null;
        this.init();
    }

    async init() {
        try {
            // 1. Three.js scene (may fail if post-processing CDN didn't load)
            try {
                this.threeScene = new ThreeScene();
            } catch (e) {
                console.warn('Three.js scene failed, continuing without 3D:', e);
            }

            // 2. Particle system
            if (this.threeScene) {
                try {
                    this.particles = new ParticleSystem(this.threeScene);
                } catch (e) {
                    console.warn('Particle system failed:', e);
                }
            }

            // 3. Load content from API
            this.contentLoader = new ContentLoader();
            await this.contentLoader.loadAll();

            // 4. GSAP animations
            this.animations = new AnimationController();
            this.animations.initScrollAnimations();
            this.animations.animateNewContent('#skills-container');
            this.animations.animateNewContent('#projects-container');
            this.animations.animateNewContent('#achievements-container');

            // 5. Navigation
            this.setupNavigation();
            this.setupMobileMenu();

            // 6. Render loop (only if 3D is working)
            if (this.threeScene) {
                this.startRenderLoop();
            }

            // 7. Footer year
            const yearEl = document.querySelector('.footer-year');
            if (yearEl) yearEl.textContent = '\u00A9 ' + new Date().getFullYear();

        } catch (err) {
            console.error('App init error:', err);
            // ALWAYS dismiss loading screen even if something crashes
            this.forceHideLoadingScreen();
        }
    }

    forceHideLoadingScreen() {
        const ls = document.getElementById('loading-screen');
        if (ls) {
            ls.style.opacity = '0';
            ls.style.transition = 'opacity 0.5s';
            setTimeout(() => { ls.style.display = 'none'; }, 500);
        }
    }

    setupNavigation() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                const target = document.querySelector(targetId);
                if (target) {
                    const navH = document.getElementById('navbar').offsetHeight;
                    window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
                }
                document.querySelector('.nav-links')?.classList.remove('mobile-open');
                document.querySelector('.nav-hamburger')?.classList.remove('active');
            });
        });
    }

    setupMobileMenu() {
        const hamburger = document.querySelector('.nav-hamburger');
        const navLinks = document.querySelector('.nav-links');
        if (!hamburger || !navLinks) return;

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('mobile-open');
        });
    }

    startRenderLoop() {
        const loop = () => {
            requestAnimationFrame(loop);
            try {
                const elapsed = this.threeScene.clock.getElapsedTime();
                if (this.particles) this.particles.update(elapsed);
                this.threeScene.animate();
            } catch (e) {
                // Silently handle render errors
            }
        };
        loop();
    }
}

// Fallback: if ANYTHING goes wrong, force-hide loading screen after 5 seconds
setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls && ls.style.display !== 'none') {
        ls.style.opacity = '0';
        ls.style.transition = 'opacity 0.5s';
        setTimeout(() => { ls.style.display = 'none'; }, 500);
        console.warn('Loading screen force-dismissed by timeout');
    }
}, 5000);

document.addEventListener('DOMContentLoaded', () => { new App(); });
