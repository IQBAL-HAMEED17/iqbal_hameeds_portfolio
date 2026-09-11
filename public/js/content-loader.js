// ContentLoader — Fetches data from API and renders dynamic DOM with enhanced visuals
class ContentLoader {
    constructor() {
        this.profile = {};
        this.projects = [];
        this.skills = [];
        this.achievements = [];
    }

    async loadAll() {
        try {
            const [profileRes, projectsRes, skillsRes, achievementsRes] = await Promise.all([
                fetch('/api/profile').then(r => r.ok ? r.json() : null).catch(() => null),
                fetch('/api/projects').then(r => r.ok ? r.json() : null).catch(() => null),
                fetch('/api/skills').then(r => r.ok ? r.json() : null).catch(() => null),
                fetch('/api/achievements').then(r => r.ok ? r.json() : null).catch(() => null),
            ]);

            this.profile = profileRes || { name: 'Iqbal', title: 'Full Stack Developer', bio: 'A passionate developer crafting digital experiences.', email: '', github: '', linkedin: '', twitter: '' };
            this.projects = projectsRes || [];
            this.skills = skillsRes || [];
            this.achievements = achievementsRes || [];

            this.renderProfile();
            this.renderProjects();
            this.renderSkills();
            this.renderAchievements();
            this.setupContactForm();
            this.initTiltEffect();

            return true;
        } catch (error) {
            console.error('Failed to load content:', error);
            return false;
        }
    }

    renderProfile() {
        const name = this.profile.name || 'Iqbal';
        const heroName = document.getElementById('hero-name');
        if (heroName) {
            heroName.textContent = name;
            heroName.setAttribute('data-text', name);
        }

        const heroTitle = document.getElementById('hero-title');
        if (heroTitle) heroTitle.textContent = this.profile.title || 'Full Stack Developer';

        const bio = document.getElementById('about-bio');
        if (bio) bio.textContent = this.profile.bio || '';

        const photo = document.getElementById('about-photo');
        if (photo) {
            photo.src = this.profile.photo || 'https://images.unsplash.com/photo-1531297172867-4f50fcc71120?auto=format&fit=crop&w=400&q=80';
        }

        // Social links with SVG icons
        const socials = document.getElementById('about-socials');
        if (socials) {
            let html = '';
            if (this.profile.github) {
                html += '<a href="' + this.profile.github + '" target="_blank" class="social-link" title="GitHub"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg></a>';
            }
            if (this.profile.linkedin) {
                html += '<a href="' + this.profile.linkedin + '" target="_blank" class="social-link" title="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>';
            }
            if (this.profile.twitter) {
                html += '<a href="' + this.profile.twitter + '" target="_blank" class="social-link" title="Twitter"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg></a>';
            }
            if (this.profile.email) {
                html += '<a href="mailto:' + this.profile.email + '" class="social-link" title="Email"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></a>';
            }
            socials.innerHTML = html;
        }

        const footerName = document.getElementById('footer-name');
        if (footerName) footerName.textContent = name;

        const navLogo = document.querySelector('.nav-logo');
        if (navLogo) navLogo.textContent = name + '.';

        const contactEmail = document.getElementById('contact-email');
        if (contactEmail) contactEmail.textContent = this.profile.email || '';
    }

    renderProjects() {
        const container = document.getElementById('projects-container');
        if (!container) return;

        if (!this.projects || this.projects.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Projects coming soon...</p></div>';
            return;
        }

        let html = '';
        this.projects.forEach(p => {
            const desc = (p.description || '').length > 120 ? p.description.substring(0, 120) + '...' : (p.description || '');
            const techTags = p.tech_stack ? p.tech_stack.split(',').map(t => '<span class="tech-tag">' + t.trim() + '</span>').join('') : '';
            const liveLink = p.live_url ? '<a href="' + p.live_url + '" target="_blank" class="project-link" onclick="event.stopPropagation()">Live Demo</a>' : '';
            const gitLink = p.github_url ? '<a href="' + p.github_url + '" target="_blank" class="project-link" onclick="event.stopPropagation()">GitHub</a>' : '';
            const badge = p.featured ? '<span class="featured-badge">★ Featured</span>' : '';
            const imgSrc = p.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80';

            html += '<div class="project-card reveal-up" data-id="' + p.id + '" data-tilt>' +
                '<div class="project-image">' +
                    '<img src="' + imgSrc + '" alt="' + (p.title || '') + '" loading="lazy">' +
                    '<div class="project-overlay"><div class="project-links">' + liveLink + gitLink + '</div></div>' +
                    badge +
                '</div>' +
                '<div class="project-info">' +
                    '<h3 class="project-title">' + (p.title || '') + '</h3>' +
                    '<p class="project-description">' + desc + '</p>' +
                    '<div class="project-tech">' + techTags + '</div>' +
                '</div>' +
            '</div>';
        });
        container.innerHTML = html;

        // Modal click
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => this.openProjectModal(card.getAttribute('data-id')));
        });
    }

    renderSkills() {
        const container = document.getElementById('skills-container');
        if (!container) return;

        if (!this.skills || this.skills.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Skills coming soon...</p></div>';
            return;
        }

        let html = '';
        this.skills.forEach(s => {
            html += '<div class="skill-card reveal-up">' +
                '<div class="skill-icon">' + (s.icon || '⚡') + '</div>' +
                '<div class="skill-info">' +
                    '<div class="skill-header">' +
                        '<span class="skill-name">' + s.name + '</span>' +
                        '<span class="skill-percentage">' + s.proficiency + '%</span>' +
                    '</div>' +
                    '<div class="skill-bar">' +
                        '<div class="skill-bar-fill" data-width="' + s.proficiency + '%" style="width: 0%"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });
        container.innerHTML = html;
    }

    renderAchievements() {
        const container = document.getElementById('achievements-container');
        if (!container) return;

        if (!this.achievements || this.achievements.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Achievements coming soon...</p></div>';
            return;
        }

        let html = '';
        this.achievements.forEach(a => {
            html += '<div class="achievement-card reveal-up">' +
                '<div class="achievement-icon">' + (a.icon || '🏅') + '</div>' +
                '<div class="achievement-content">' +
                    '<h3 class="achievement-title">' + a.title + '</h3>' +
                    '<p class="achievement-description">' + (a.description || '') + '</p>' +
                    '<span class="achievement-date">' + (a.date || '') + '</span>' +
                '</div>' +
            '</div>';
        });
        container.innerHTML = html;
    }

    setupContactForm() {
        const form = document.getElementById('contact-form');
        const status = document.getElementById('form-status');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('.btn-submit');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<span class="btn-text">Sending...</span>';
            btn.disabled = true;

            try {
                const fd = new FormData(form);
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fd.get('name'),
                        email: fd.get('email'),
                        message: fd.get('message')
                    })
                });
                const data = await res.json();
                if (data.success) {
                    status.innerHTML = '<span class="success">Message sent! I\'ll get back to you soon.</span>';
                    form.reset();
                } else {
                    status.innerHTML = '<span class="error">Failed to send. Please try again.</span>';
                }
            } catch (err) {
                status.innerHTML = '<span class="error">Connection error. Please try again.</span>';
            }

            btn.innerHTML = originalHTML;
            btn.disabled = false;
            setTimeout(() => { status.innerHTML = ''; }, 5000);
        });
    }

    // 3D tilt effect on project cards
    initTiltEffect() {
        document.querySelectorAll('[data-tilt]').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                const rotateX = (0.5 - y) * 12;
                const rotateY = (x - 0.5) * 12;
                card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-8px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
                card.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
                setTimeout(() => { card.style.transition = ''; }, 600);
            });
        });
    }

    openProjectModal(id) {
        const project = this.projects.find(p => p.id == id);
        if (!project) return;

        const modal = document.getElementById('project-modal');
        const body = document.getElementById('modal-body');
        const techTags = project.tech_stack ? project.tech_stack.split(',').map(t => '<span class="tech-tag">' + t.trim() + '</span>').join('') : '';
        const liveLink = project.live_url ? '<a href="' + project.live_url + '" target="_blank" class="btn btn-primary" style="display:inline-flex"><span class="btn-text">Live Demo</span></a>' : '';
        const gitLink = project.github_url ? '<a href="' + project.github_url + '" target="_blank" class="btn btn-outline" style="display:inline-flex"><span class="btn-text">GitHub</span></a>' : '';
        const imgSrc = project.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80';

        body.innerHTML = '<img src="' + imgSrc + '" alt="' + project.title + '" style="width:100%;border-radius:12px;margin-bottom:24px;">' +
            '<h2 style="font-family:var(--font-heading);color:var(--accent-cyan);margin-bottom:12px;font-size:2rem;">' + project.title + '</h2>' +
            '<div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">' + techTags + '</div>' +
            '<p style="color:var(--text-secondary);line-height:1.8;margin-bottom:32px;font-size:1.05rem;">' + (project.description || '') + '</p>' +
            '<div style="display:flex;gap:16px;">' + liveLink + gitLink + '</div>';

        modal.classList.add('active');

        const closeBtn = modal.querySelector('.modal-close');
        const backdrop = modal.querySelector('.modal-backdrop');
        const closeModal = () => modal.classList.remove('active');
        closeBtn.onclick = closeModal;
        backdrop.onclick = closeModal;
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', handler); }
        });
    }
}
