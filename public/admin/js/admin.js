class AdminDashboard {
    constructor() {
        this.currentPanel = 'dashboard';
        this.data = { projects: [], skills: [], achievements: [], messages: [], profile: {} };
        this.editingId = null;
        
        this.checkAuth();
    }
    
    async checkAuth() {
        try {
            const res = await fetch('/api/admin/check');
            const data = await res.json();
            if (!data.isAdmin) {
                window.location.href = '/admin/';
                return;
            }
            document.body.style.display = 'block';
            this.init();
        } catch (err) {
            window.location.href = '/admin/';
        }
    }
    
    async init() {
        await this.loadAllData();
        this.setupNavigation();
        this.setupEventListeners();
        this.renderDashboard();
        this.showPanel('dashboard');
    }
    
    async loadAllData() {
        try {
            const [profile, projects, skills, achievements, messages] = await Promise.all([
                fetch('/api/profile').then(r => r.json()),
                fetch('/api/projects').then(r => r.json()),
                fetch('/api/skills').then(r => r.json()),
                fetch('/api/achievements').then(r => r.json()),
                fetch('/api/messages').then(r => r.json())
            ]);
            this.data = { profile, projects, skills, achievements, messages };
        } catch (e) {
            this.showToast('Failed to load initial data', 'error');
        }
    }
    
    setupNavigation() {
        document.querySelectorAll('.sidebar-nav .nav-item[data-target]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.currentTarget.getAttribute('data-target');
                this.showPanel(target);
            });
        });

        document.getElementById('logout-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            await this.logout();
        });
    }
    
    setupEventListeners() {
        // Profile form
        document.getElementById('profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            await this.saveProfile(data);
        });

        // Photo uploads
        document.getElementById('profile-photo-upload').addEventListener('change', async (e) => {
            if(e.target.files.length > 0) {
                const url = await this.uploadImage(e.target.files[0]);
                if(url) document.querySelector('#profile-form input[name="photo"]').value = url;
            }
        });
        document.getElementById('project-image-upload').addEventListener('change', async (e) => {
            if(e.target.files.length > 0) {
                const url = await this.uploadImage(e.target.files[0]);
                if(url) document.querySelector('#form-project input[name="image"]').value = url;
            }
        });

        // Project form
        document.getElementById('form-project').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.featured = formData.has('featured');
            data.display_order = parseInt(data.display_order) || 0;
            // Handle tech stack string to array logic if needed (assumed string or JSON string from user)
            // Storing as string for simplicity as per requirements
            await this.saveProject(data);
        });

        // Skill form
        const profSlider = document.querySelector('#form-skill input[name="proficiency"]');
        if(profSlider) {
            profSlider.addEventListener('input', (e) => {
                document.getElementById('skill-prof-val').textContent = e.target.value + '%';
            });
        }
        document.getElementById('form-skill').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.proficiency = parseInt(data.proficiency) || 0;
            await this.saveSkill(data);
        });

        // Achievement form
        document.getElementById('form-achievement').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            await this.saveAchievement(data);
        });
    }
    
    showPanel(panelName) {
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
        
        const panel = document.getElementById(`panel-${panelName}`);
        if(panel) panel.classList.add('active');
        
        const nav = document.querySelector(`.sidebar-nav .nav-item[data-target="${panelName}"]`);
        if(nav) nav.classList.add('active');
        
        this.currentPanel = panelName;
        
        switch(panelName) {
            case 'dashboard': this.renderDashboard(); break;
            case 'profile': this.renderProfile(); break;
            case 'projects': this.renderProjects(); break;
            case 'skills': this.renderSkills(); break;
            case 'achievements': this.renderAchievements(); break;
            case 'messages': this.renderMessages(); break;
        }
    }
    
    renderDashboard() {
        document.getElementById('count-projects').textContent = this.data.projects.length;
        document.getElementById('count-skills').textContent = this.data.skills.length;
        document.getElementById('count-achievements').textContent = this.data.achievements.length;
        
        const unreadMsg = this.data.messages.filter(m => !m.read).length;
        document.getElementById('count-messages').textContent = this.data.messages.length; // or unreadMsg
        
        const badge = document.getElementById('unread-badge');
        if(unreadMsg > 0) {
            badge.textContent = unreadMsg;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    // Profile
    renderProfile() {
        const form = document.getElementById('profile-form');
        const p = this.data.profile || {};
        form.elements['name'].value = p.name || '';
        form.elements['title'].value = p.title || '';
        form.elements['bio'].value = p.bio || '';
        form.elements['photo'].value = p.photo || '';
        form.elements['email'].value = p.email || '';
        form.elements['github'].value = p.github || '';
        form.elements['linkedin'].value = p.linkedin || '';
        form.elements['twitter'].value = p.twitter || '';
    }
    
    async saveProfile(data) {
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            if(res.ok) {
                this.data.profile = await res.json();
                this.showToast('Profile updated successfully');
            } else throw new Error('Save failed');
        } catch (e) {
            this.showToast(e.message, 'error');
        }
    }
    
    // Projects
    renderProjects() {
        const tbody = document.getElementById('projects-tbody');
        tbody.innerHTML = '';
        this.data.projects.sort((a,b) => (a.display_order||0) - (b.display_order||0)).forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.title}</td>
                <td>${Array.isArray(p.tech_stack) ? p.tech_stack.join(', ') : p.tech_stack}</td>
                <td>${p.featured ? '⭐ Yes' : 'No'}</td>
                <td>
                    <button class="action-btn edit" onclick="adminApp.showProjectForm(${p.id})">✏️</button>
                    <button class="action-btn delete" onclick="adminApp.deleteProject(${p.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    showProjectForm(id = null) {
        this.editingId = id;
        const form = document.getElementById('form-project');
        form.reset();
        document.getElementById('modal-project-title').textContent = id ? 'Edit Project' : 'Add Project';
        
        if (id) {
            const p = this.data.projects.find(x => x.id == id);
            if (p) {
                form.elements['id'].value = p.id;
                form.elements['title'].value = p.title;
                form.elements['description'].value = p.description;
                form.elements['image'].value = p.image;
                form.elements['tech_stack'].value = Array.isArray(p.tech_stack) ? p.tech_stack.join(', ') : p.tech_stack;
                form.elements['live_url'].value = p.live_url || '';
                form.elements['github_url'].value = p.github_url || '';
                form.elements['featured'].checked = p.featured;
                form.elements['display_order'].value = p.display_order || 0;
            }
        }
        document.getElementById('modal-project').classList.add('active');
    }
    
    async saveProject(data) {
        const isEdit = !!data.id;
        const url = isEdit ? `/api/projects/${data.id}` : '/api/projects';
        const method = isEdit ? 'PUT' : 'POST';
        
        try {
            const res = await fetch(url, {
                method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
            });
            if (res.ok) {
                await this.loadAllData();
                this.renderProjects();
                this.closeModal('project');
                this.showToast('Project saved!');
            } else throw new Error('Save failed');
        } catch(e) { this.showToast(e.message, 'error'); }
    }
    
    async deleteProject(id) {
        if (!await this.confirm('Are you sure you want to delete this project?')) return;
        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this.data.projects = this.data.projects.filter(p => p.id != id);
                this.renderProjects();
                this.showToast('Project deleted');
            }
        } catch(e) { this.showToast('Delete failed', 'error'); }
    }
    
    // Skills
    renderSkills() {
        const tbody = document.getElementById('skills-tbody');
        tbody.innerHTML = '';
        this.data.skills.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.icon}</td>
                <td>${s.name}</td>
                <td>${s.category}</td>
                <td>${s.proficiency}%</td>
                <td>
                    <button class="action-btn edit" onclick="adminApp.showSkillForm(${s.id})">✏️</button>
                    <button class="action-btn delete" onclick="adminApp.deleteSkill(${s.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    showSkillForm(id = null) {
        this.editingId = id;
        const form = document.getElementById('form-skill');
        form.reset();
        document.getElementById('modal-skill-title').textContent = id ? 'Edit Skill' : 'Add Skill';
        document.getElementById('skill-prof-val').textContent = '50%';
        
        if (id) {
            const s = this.data.skills.find(x => x.id == id);
            if (s) {
                form.elements['id'].value = s.id;
                form.elements['name'].value = s.name;
                form.elements['category'].value = s.category;
                form.elements['proficiency'].value = s.proficiency;
                form.elements['icon'].value = s.icon;
                document.getElementById('skill-prof-val').textContent = s.proficiency + '%';
            }
        }
        document.getElementById('modal-skill').classList.add('active');
    }
    
    async saveSkill(data) {
        const isEdit = !!data.id;
        const url = isEdit ? `/api/skills/${data.id}` : '/api/skills';
        const method = isEdit ? 'PUT' : 'POST';
        
        try {
            const res = await fetch(url, {
                method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
            });
            if (res.ok) {
                await this.loadAllData();
                this.renderSkills();
                this.closeModal('skill');
                this.showToast('Skill saved!');
            }
        } catch(e) { this.showToast('Save failed', 'error'); }
    }
    
    async deleteSkill(id) {
        if (!await this.confirm('Delete this skill?')) return;
        try {
            const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this.data.skills = this.data.skills.filter(x => x.id != id);
                this.renderSkills();
                this.showToast('Skill deleted');
            }
        } catch(e) {}
    }
    
    // Achievements
    renderAchievements() {
        const tbody = document.getElementById('achievements-tbody');
        tbody.innerHTML = '';
        this.data.achievements.forEach(a => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${a.icon}</td>
                <td>${a.title}</td>
                <td>${a.date}</td>
                <td>
                    <button class="action-btn edit" onclick="adminApp.showAchievementForm(${a.id})">✏️</button>
                    <button class="action-btn delete" onclick="adminApp.deleteAchievement(${a.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    showAchievementForm(id = null) {
        this.editingId = id;
        const form = document.getElementById('form-achievement');
        form.reset();
        document.getElementById('modal-achievement-title').textContent = id ? 'Edit Achievement' : 'Add Achievement';
        
        if (id) {
            const a = this.data.achievements.find(x => x.id == id);
            if (a) {
                form.elements['id'].value = a.id;
                form.elements['title'].value = a.title;
                form.elements['description'].value = a.description;
                form.elements['icon'].value = a.icon;
                form.elements['date'].value = a.date;
            }
        }
        document.getElementById('modal-achievement').classList.add('active');
    }
    
    async saveAchievement(data) {
        const isEdit = !!data.id;
        const url = isEdit ? `/api/achievements/${data.id}` : '/api/achievements';
        const method = isEdit ? 'PUT' : 'POST';
        
        try {
            const res = await fetch(url, {
                method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
            });
            if (res.ok) {
                await this.loadAllData();
                this.renderAchievements();
                this.closeModal('achievement');
                this.showToast('Achievement saved!');
            }
        } catch(e) {}
    }
    
    async deleteAchievement(id) {
        if (!await this.confirm('Delete this achievement?')) return;
        try {
            const res = await fetch(`/api/achievements/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this.data.achievements = this.data.achievements.filter(x => x.id != id);
                this.renderAchievements();
                this.showToast('Achievement deleted');
            }
        } catch(e) {}
    }
    
    // Messages
    renderMessages() {
        const list = document.getElementById('messages-list');
        list.innerHTML = '';
        if (this.data.messages.length === 0) {
            list.innerHTML = '<p style="color: var(--admin-text-secondary)">No messages yet.</p>';
            return;
        }
        
        this.data.messages.forEach(m => {
            const card = document.createElement('div');
            card.className = `message-card ${m.read ? '' : 'unread'}`;
            card.innerHTML = `
                <div class="msg-header">
                    <div>
                        <span class="msg-name">${m.name}</span>
                        <span class="msg-email">&lt;${m.email}&gt;</span>
                    </div>
                    <div class="msg-date">${new Date(m.created_at || Date.now()).toLocaleString()}</div>
                </div>
                <div class="msg-body">${m.message}</div>
                <div class="msg-actions">
                    <button class="btn btn-sm btn-secondary" onclick="adminApp.deleteMessage(${m.id})">Delete</button>
                </div>
            `;
            list.appendChild(card);
        });
    }
    
    async deleteMessage(id) {
        if (!await this.confirm('Delete this message forever?')) return;
        try {
            const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this.data.messages = this.data.messages.filter(x => x.id != id);
                this.renderMessages();
                this.renderDashboard();
                this.showToast('Message deleted');
            }
        } catch(e) {}
    }
    
    // Modal controls
    closeModal(type) {
        document.getElementById(`modal-${type}`).classList.remove('active');
        this.editingId = null;
    }
    
    // Upload image
    async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if(res.ok) {
                const data = await res.json();
                this.showToast('Image uploaded successfully');
                return data.url;
            }
            throw new Error('Upload failed');
        } catch (e) {
            this.showToast(e.message, 'error');
            return null;
        }
    }
    
    // Utilities
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    async confirm(message) {
        return window.confirm(message);
    }
    
    async logout() {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin/';
    }
}

let adminApp;
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminDashboard();
});
