// AnimationController — GSAP animations with character reveals, magnetic buttons, parallax
class AnimationController {
    constructor() {
        gsap.registerPlugin(ScrollTrigger);
        this._addHoverListeners = null;
        this.initLoadingAnimation();
        this.initNavbarAnimation();
        this.initCursorAnimation();
    }

    initLoadingAnimation() {
        const tl = gsap.timeline();
        tl.from('.loader-ring', { scale: 0, opacity: 0, duration: 0.5, stagger: 0.15, ease: 'back.out(2)' })
          .to('.loader-progress-bar', { width: '100%', duration: 2.5, ease: 'power1.inOut' }, 0.3)
          .to('.loader-text', { opacity: 0, duration: 0.4 }, '-=0.8')
          .to('.loader-ring, .loader-ring-2, .loader-ring-3', { scale: 2, opacity: 0, duration: 0.6, stagger: 0.05 }, '-=0.6')
          .to('#loading-screen', {
              opacity: 0, duration: 0.8,
              onComplete: () => {
                  document.getElementById('loading-screen').style.display = 'none';
                  this.initHeroAnimations();
              }
          }, '-=0.3');
    }

    initNavbarAnimation() {
        gsap.from('#navbar', { y: -100, opacity: 0, duration: 1.2, delay: 3, ease: 'power3.out' });

        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (!navbar) return;
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Active nav link
            const sections = document.querySelectorAll('.section');
            let current = '';
            sections.forEach(section => {
                if (scrollY >= section.offsetTop - 200) {
                    current = section.getAttribute('id');
                }
            });
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });
    }

    initHeroAnimations() {
        const tl = gsap.timeline();

        // Character-by-character greeting reveal
        const greeting = document.querySelector('.hero-greeting');
        if (greeting) {
            const text = greeting.textContent;
            greeting.innerHTML = text.split('').map(char =>
                '<span class="char">' + (char === ' ' ? '&nbsp;' : char) + '</span>'
            ).join('');

            tl.from('.hero-greeting .char', {
                y: 40, opacity: 0, rotateX: -90,
                duration: 0.6, stagger: 0.03, ease: 'back.out(2)'
            });
        }

        // Name elastic bounce
        tl.from('#hero-name', { scale: 0.5, opacity: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)' }, '-=0.3')
        // Subtitle fade
          .from('#hero-title', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        // CTA buttons stagger up
          .from('.hero-cta .btn', { y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }, '-=0.4')
        // Scroll indicator
          .from('.scroll-indicator', { opacity: 0, y: 20, duration: 1, ease: 'power2.out' }, '-=0.2');
    }

    initScrollAnimations() {
        // Section titles
        gsap.utils.toArray('.section-title').forEach(title => {
            gsap.from(title, {
                scrollTrigger: { trigger: title, start: 'top 85%', toggleActions: 'play none none none' },
                x: -60, opacity: 0, duration: 1, ease: 'power3.out'
            });
        });

        // Section dividers
        gsap.utils.toArray('.divider-line').forEach(line => {
            gsap.from(line, {
                scrollTrigger: { trigger: line, start: 'top 90%' },
                scaleY: 0, duration: 0.8, ease: 'power2.out'
            });
        });

        // About section
        if (document.querySelector('.about-content')) {
            gsap.from('.about-image-frame', {
                scrollTrigger: { trigger: '.about-content', start: 'top 80%' },
                scale: 0.7, opacity: 0, rotation: -10, duration: 1.2, ease: 'back.out(1.5)'
            });
            gsap.from('.image-decoration', {
                scrollTrigger: { trigger: '.about-content', start: 'top 80%' },
                scale: 0, opacity: 0, duration: 1.5, ease: 'elastic.out(1, 0.5)'
            });
            gsap.from('.about-text > *', {
                scrollTrigger: { trigger: '.about-content', start: 'top 80%' },
                y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out'
            });
        }

        // Contact form
        if (document.querySelector('.contact-form')) {
            gsap.from('.contact-form', {
                scrollTrigger: { trigger: '.contact-content', start: 'top 80%' },
                x: 60, opacity: 0, duration: 1, ease: 'power3.out'
            });
            gsap.from('.contact-info > *', {
                scrollTrigger: { trigger: '.contact-content', start: 'top 80%' },
                x: -40, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out'
            });
        }
    }

    initCursorAnimation() {
        const dot = document.querySelector('.cursor-dot');
        const ring = document.querySelector('.cursor-ring');
        if (!dot || !ring) return;

        // Touch device — hide cursor
        if ('ontouchstart' in window) {
            dot.style.display = 'none';
            ring.style.display = 'none';
            return;
        }

        let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

        window.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.left = mouseX + 'px';
            dot.style.top = mouseY + 'px';
        });

        const renderCursor = () => {
            ringX += (mouseX - ringX) * 0.12;
            ringY += (mouseY - ringY) * 0.12;
            ring.style.left = ringX + 'px';
            ring.style.top = ringY + 'px';
            requestAnimationFrame(renderCursor);
        };
        requestAnimationFrame(renderCursor);

        // Magnetic effect on .magnetic elements
        const initMagnetic = (elements) => {
            elements.forEach(el => {
                el.addEventListener('mousemove', (e) => {
                    const rect = el.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    el.style.transform = 'translate(' + (x * 0.3) + 'px, ' + (y * 0.3) + 'px)';
                });
                el.addEventListener('mouseleave', () => {
                    el.style.transform = 'translate(0, 0)';
                    el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
                    setTimeout(() => { el.style.transition = ''; }, 500);
                });
            });
        };
        initMagnetic(document.querySelectorAll('.magnetic'));

        // Hover effects
        const addHoverListeners = (elements) => {
            elements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    ring.style.width = '60px';
                    ring.style.height = '60px';
                    ring.style.borderColor = 'rgba(123, 47, 255, 0.6)';
                    ring.style.background = 'rgba(123, 47, 255, 0.05)';
                });
                el.addEventListener('mouseleave', () => {
                    ring.style.width = '44px';
                    ring.style.height = '44px';
                    ring.style.borderColor = 'rgba(0, 240, 255, 0.4)';
                    ring.style.background = 'transparent';
                });
            });
        };
        addHoverListeners(document.querySelectorAll('a, button, .project-card, .skill-card, input, textarea'));
        this._addHoverListeners = addHoverListeners;
        this._initMagnetic = initMagnetic;
    }

    animateNewContent(selector) {
        const elements = document.querySelectorAll(selector + ' .reveal-up');
        if (!elements.length) return;

        gsap.to(elements, {
            scrollTrigger: { trigger: selector, start: 'top 85%' },
            y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
            onComplete: () => {
                // Animate skill bars
                if (selector === '#skills-container') {
                    document.querySelectorAll('.skill-bar-fill').forEach(bar => {
                        gsap.to(bar, { width: bar.getAttribute('data-width'), duration: 1.5, ease: 'power3.out' });
                    });
                }
            }
        });

        // Re-apply cursor and magnetic effects to new elements
        if (this._addHoverListeners) {
            this._addHoverListeners(document.querySelectorAll(selector + ' .project-card, ' + selector + ' .skill-card'));
        }
        if (this._initMagnetic) {
            this._initMagnetic(document.querySelectorAll(selector + ' .magnetic'));
        }
    }
}
