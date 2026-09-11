// ThreeScene — Cosmic 3D world with bloom post-processing, vortex portal, orbit rings
class ThreeScene {
    constructor() {
        this.container = document.getElementById('three-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.composer = null;
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.clock = new THREE.Clock();
        this.scrollY = 0;
        this.geometries = [];
        this.nebulae = [];
        this.rings = [];
        this.starField = null;
        this.vortex = null;
        this.light1 = null;
        this.light2 = null;

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x050510, 1);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.5;
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;

        // Post-processing BLOOM (graceful fallback if CDN didn't load)
        try {
            if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
                this.composer = new THREE.EffectComposer(this.renderer);
                this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
                const bloomPass = new THREE.UnrealBloomPass(
                    new THREE.Vector2(window.innerWidth, window.innerHeight),
                    1.2, 0.4, 0.2
                );
                this.composer.addPass(bloomPass);
                this.bloomPass = bloomPass;
            } else {
                console.warn('Post-processing not available, using standard rendering');
                this.composer = null;
            }
        } catch (e) {
            console.warn('Bloom setup failed, using standard rendering:', e);
            this.composer = null;
        }

        // Lights
        this.scene.add(new THREE.AmbientLight(0x111133, 0.3));

        this.light1 = new THREE.PointLight(0x00f0ff, 2, 100);
        this.light1.position.set(5, 5, 5);
        this.scene.add(this.light1);

        this.light2 = new THREE.PointLight(0x7b2fff, 1.5, 100);
        this.light2.position.set(-5, -5, 5);
        this.scene.add(this.light2);

        const pinkLight = new THREE.PointLight(0xff2d95, 0.8, 100);
        pinkLight.position.set(0, -3, -5);
        this.scene.add(pinkLight);

        // Fog
        this.scene.fog = new THREE.FogExp2(0x050510, 0.012);

        // Build world
        this.createStarField();
        this.createNebula();
        this.createVortex();
        this.createFloatingGeometries();
        this.createOrbitRings();

        // Events
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('scroll', () => { this.scrollY = window.scrollY; });
    }

    createStarField() {
        const count = 5000;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const palette = [
            new THREE.Color(0xffffff),
            new THREE.Color(0xaaccff),
            new THREE.Color(0x00f0ff),
            new THREE.Color(0x7b2fff),
            new THREE.Color(0xffddaa),
        ];

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 30 + Math.random() * 70;
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            const c = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.starField = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.08, vertexColors: true, transparent: true, opacity: 0.9,
            sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
        }));
        this.scene.add(this.starField);
    }

    createNebula() {
        const configs = [
            { color: 0x7b2fff, pos: [5, 5, -15], scale: [2, 1, 1.5], opacity: 0.04 },
            { color: 0x00f0ff, pos: [-8, -2, -20], scale: [1.5, 2, 1], opacity: 0.03 },
            { color: 0xff2d95, pos: [0, 8, -25], scale: [2.5, 1, 1.5], opacity: 0.025 },
            { color: 0x2d7bff, pos: [-5, -8, -18], scale: [1.8, 1.2, 1], opacity: 0.03 },
            { color: 0x7b2fff, pos: [10, -3, -22], scale: [1, 2, 1.5], opacity: 0.025 },
        ];
        const geo = new THREE.SphereGeometry(12, 32, 32);

        configs.forEach(cfg => {
            const mat = new THREE.MeshBasicMaterial({
                color: cfg.color, transparent: true, opacity: cfg.opacity,
                blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
            mesh.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
            this.scene.add(mesh);
            this.nebulae.push({ mesh, speed: (Math.random() - 0.5) * 0.003 });
        });
    }

    createVortex() {
        const count = 3000;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const cyan = new THREE.Color(0x00f0ff);
        const purple = new THREE.Color(0x7b2fff);
        const pink = new THREE.Color(0xff2d95);

        for (let i = 0; i < count; i++) {
            const t = i / count;
            const angle = t * Math.PI * 12;
            const radius = t * 4;
            const height = (t - 0.5) * 3;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height + Math.sin(angle * 2) * 0.3;
            positions[i * 3 + 2] = Math.sin(angle) * radius - 3;

            const c = new THREE.Color();
            if (t < 0.33) c.lerpColors(cyan, purple, t * 3);
            else if (t < 0.66) c.lerpColors(purple, pink, (t - 0.33) * 3);
            else c.lerpColors(pink, cyan, (t - 0.66) * 3);

            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.vortex = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.04, vertexColors: true, transparent: true, opacity: 0.8,
            blending: THREE.AdditiveBlending, sizeAttenuation: true, depthWrite: false
        }));
        this.scene.add(this.vortex);
    }

    createFloatingGeometries() {
        const geoTypes = [
            new THREE.OctahedronGeometry(0.4, 0),
            new THREE.IcosahedronGeometry(0.5, 0),
            new THREE.TorusGeometry(0.3, 0.12, 16, 32),
            new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8),
            new THREE.TetrahedronGeometry(0.4, 0),
            new THREE.DodecahedronGeometry(0.4, 0),
        ];
        const clrs = [0x00f0ff, 0x7b2fff, 0xff2d95, 0x2d7bff];

        for (let i = 0; i < 20; i++) {
            const geo = geoTypes[Math.floor(Math.random() * geoTypes.length)];
            const color = clrs[Math.floor(Math.random() * clrs.length)];
            const mat = new THREE.MeshBasicMaterial({
                color, wireframe: true, transparent: true,
                opacity: Math.random() * 0.2 + 0.15, blending: THREE.AdditiveBlending
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20 - 5
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            this.scene.add(mesh);
            this.geometries.push({
                mesh,
                rotSpeedX: (Math.random() - 0.5) * 0.015,
                rotSpeedY: (Math.random() - 0.5) * 0.015,
                rotSpeedZ: (Math.random() - 0.5) * 0.01,
                floatSpeed: Math.random() * 0.008 + 0.003,
                floatAmp: Math.random() * 0.8 + 0.3,
                floatOffset: Math.random() * Math.PI * 2,
                baseY: mesh.position.y
            });
        }
    }

    createOrbitRings() {
        const configs = [
            { radius: 8, color: 0x00f0ff, opacity: 0.12, rotX: 0.3, rotY: 0 },
            { radius: 12, color: 0x7b2fff, opacity: 0.08, rotX: -0.5, rotY: 0.3 },
            { radius: 16, color: 0xff2d95, opacity: 0.06, rotX: 0.1, rotY: -0.4 },
        ];
        configs.forEach(cfg => {
            const geo = new THREE.TorusGeometry(cfg.radius, 0.01, 16, 100);
            const mat = new THREE.MeshBasicMaterial({
                color: cfg.color, transparent: true, opacity: cfg.opacity,
                blending: THREE.AdditiveBlending, side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = cfg.rotX;
            mesh.rotation.y = cfg.rotY;
            this.scene.add(mesh);
            this.rings.push({ mesh, speed: (Math.random() - 0.5) * 0.002 });
        });
    }

    onMouseMove(e) {
        this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        const elapsed = this.clock.getElapsedTime();

        // Smooth mouse
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

        // Camera
        this.camera.position.x = this.mouse.x * 0.6;
        this.camera.position.y = this.mouse.y * 0.4;
        this.camera.lookAt(0, 0, 0);

        const scrollH = Math.max(document.body.scrollHeight - window.innerHeight, 1);
        const scrollP = this.scrollY / scrollH;
        this.camera.position.z = 5 - scrollP * 3;

        // Stars
        if (this.starField) {
            this.starField.rotation.y = elapsed * 0.015;
            this.starField.rotation.x = elapsed * 0.008;
        }

        // Vortex — swirling portal
        if (this.vortex) {
            this.vortex.rotation.z = elapsed * 0.3;
            this.vortex.rotation.y = elapsed * 0.1;
            this.vortex.material.opacity = Math.max(0, 0.8 * (1 - scrollP * 1.5));
        }

        // Nebulae
        this.nebulae.forEach(n => {
            n.mesh.rotation.y += n.speed;
            n.mesh.rotation.z += n.speed * 0.5;
        });

        // Floating geometries
        this.geometries.forEach(g => {
            g.mesh.rotation.x += g.rotSpeedX;
            g.mesh.rotation.y += g.rotSpeedY;
            g.mesh.rotation.z += g.rotSpeedZ;
            g.mesh.position.y = g.baseY + Math.sin(elapsed * g.floatSpeed * 10 + g.floatOffset) * g.floatAmp;
        });

        // Orbit rings
        this.rings.forEach(r => { r.mesh.rotation.z += r.speed; });

        // Animate lights
        if (this.light1) {
            this.light1.position.x = Math.sin(elapsed * 0.5) * 8;
            this.light1.position.y = Math.cos(elapsed * 0.3) * 6;
        }
        if (this.light2) {
            this.light2.position.x = Math.cos(elapsed * 0.4) * 7;
            this.light2.position.y = Math.sin(elapsed * 0.6) * 5;
        }

        // Render with bloom if available, otherwise standard
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
