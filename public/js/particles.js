// ParticleSystem — Mouse trail, ambient particles, constellation connections, click bursts
class ParticleSystem {
    constructor(threeScene) {
        this.scene = threeScene.scene;
        this.camera = threeScene.camera;
        this.mouse = threeScene.mouse;
        this.mouseTrail = [];
        this.ambientParticles = [];
        this.burstParticles = [];
        this.trailCount = 40;
        this.ambientCount = 80;
        this.connectionDistance = 3;

        this.initMouseTrail();
        this.initAmbientParticles();
        this.initConnectionLines();
        this.initClickBurst();
    }

    createGlowTexture(color, size) {
        size = size || 64;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const half = size / 2;
        const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.4, color + '88');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(canvas);
    }

    initMouseTrail() {
        const texCyan = this.createGlowTexture('#00f0ff');
        const texPurple = this.createGlowTexture('#7b2fff');

        for (let i = 0; i < this.trailCount; i++) {
            const ratio = i / this.trailCount;
            const mat = new THREE.SpriteMaterial({
                map: ratio < 0.5 ? texCyan : texPurple,
                transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending, depthWrite: false
            });
            const sprite = new THREE.Sprite(mat);
            const size = (1 - ratio) * 0.4 + 0.05;
            sprite.scale.set(size, size, 1);
            this.scene.add(sprite);
            this.mouseTrail.push({ mesh: sprite, pos: new THREE.Vector3() });
        }
    }

    initAmbientParticles() {
        const tex = this.createGlowTexture('#ffffff', 32);

        for (let i = 0; i < this.ambientCount; i++) {
            const mat = new THREE.SpriteMaterial({
                map: tex, transparent: true,
                opacity: Math.random() * 0.4 + 0.1,
                blending: THREE.AdditiveBlending, depthWrite: false
            });
            const sprite = new THREE.Sprite(mat);
            const size = Math.random() * 0.08 + 0.03;
            sprite.scale.set(size, size, 1);
            sprite.position.set(
                (Math.random() - 0.5) * 16,
                (Math.random() - 0.5) * 16,
                (Math.random() - 0.5) * 8 - 2
            );
            this.scene.add(sprite);
            this.ambientParticles.push({
                mesh: sprite,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.008,
                    (Math.random() - 0.5) * 0.008,
                    (Math.random() - 0.5) * 0.004
                ),
                baseOpacity: mat.opacity,
                twinkleSpeed: Math.random() * 2 + 0.5,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
    }

    initConnectionLines() {
        const maxConn = 200;
        const positions = new Float32Array(maxConn * 6);
        const colors = new Float32Array(maxConn * 6);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setDrawRange(0, 0);

        this.constellationLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, opacity: 0.25,
            blending: THREE.AdditiveBlending, depthWrite: false
        }));
        this.scene.add(this.constellationLines);
    }

    initClickBurst() {
        window.addEventListener('click', (e) => this.createBurst(e.clientX, e.clientY));
    }

    createBurst(screenX, screenY) {
        const x = (screenX / window.innerWidth) * 2 - 1;
        const y = -(screenY / window.innerHeight) * 2 + 1;
        const vec = new THREE.Vector3(x, y, 0.5).unproject(this.camera);
        const dir = vec.sub(this.camera.position).normalize();
        const dist = -this.camera.position.z / dir.z;
        const worldPos = this.camera.position.clone().add(dir.multiplyScalar(dist));

        const colors = ['#00f0ff', '#7b2fff', '#ff2d95'];
        for (let i = 0; i < 25; i++) {
            const tex = this.createGlowTexture(colors[Math.floor(Math.random() * colors.length)]);
            const mat = new THREE.SpriteMaterial({
                map: tex, transparent: true, opacity: 1,
                blending: THREE.AdditiveBlending, depthWrite: false
            });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(0.12, 0.12, 1);
            sprite.position.copy(worldPos);
            this.scene.add(sprite);
            this.burstParticles.push({
                mesh: sprite,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.25,
                    (Math.random() - 0.5) * 0.25,
                    (Math.random() - 0.5) * 0.12
                ),
                life: 1.0,
                decay: Math.random() * 0.02 + 0.015
            });
        }
    }

    update(elapsed) {
        // Mouse trail
        const camPos = this.camera.position.clone();
        const vec = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5).unproject(this.camera);
        const dir = vec.sub(camPos).normalize();
        const dist = -camPos.z / dir.z;
        const mouseWorld = camPos.clone().add(dir.clone().multiplyScalar(dist));

        let prevPos = mouseWorld;
        const speed = Math.abs(this.mouse.targetX - this.mouse.x) + Math.abs(this.mouse.targetY - this.mouse.y);

        for (let i = 0; i < this.trailCount; i++) {
            const p = this.mouseTrail[i];
            p.mesh.position.lerp(prevPos, 0.25 - i * 0.004);
            prevPos = p.mesh.position.clone();
            const targetOp = speed > 0.005 ? (1 - i / this.trailCount) * 0.7 : 0;
            p.mesh.material.opacity += (targetOp - p.mesh.material.opacity) * 0.08;
        }

        // Ambient particles
        for (let i = 0; i < this.ambientCount; i++) {
            const p = this.ambientParticles[i];
            p.mesh.position.add(p.velocity);
            if (p.mesh.position.x > 8) p.mesh.position.x = -8;
            if (p.mesh.position.x < -8) p.mesh.position.x = 8;
            if (p.mesh.position.y > 8) p.mesh.position.y = -8;
            if (p.mesh.position.y < -8) p.mesh.position.y = 8;
            p.mesh.material.opacity = p.baseOpacity + Math.sin(elapsed * p.twinkleSpeed + p.twinkleOffset) * 0.15;
            p.mesh.position.x += Math.sin(elapsed * 0.3 + i) * 0.002;
        }

        // Constellation connections
        const posAttr = this.constellationLines.geometry.getAttribute('position');
        const colAttr = this.constellationLines.geometry.getAttribute('color');
        let lineCount = 0;
        const maxLines = 200;
        const cyanCol = new THREE.Color(0x00f0ff);

        for (let i = 0; i < this.ambientCount && lineCount < maxLines; i++) {
            for (let j = i + 1; j < this.ambientCount && lineCount < maxLines; j++) {
                const a = this.ambientParticles[i].mesh.position;
                const b = this.ambientParticles[j].mesh.position;
                const d = a.distanceTo(b);
                if (d < this.connectionDistance) {
                    const idx = lineCount * 6;
                    posAttr.array[idx] = a.x; posAttr.array[idx + 1] = a.y; posAttr.array[idx + 2] = a.z;
                    posAttr.array[idx + 3] = b.x; posAttr.array[idx + 4] = b.y; posAttr.array[idx + 5] = b.z;
                    const op = 1 - d / this.connectionDistance;
                    colAttr.array[idx] = cyanCol.r * op; colAttr.array[idx + 1] = cyanCol.g * op; colAttr.array[idx + 2] = cyanCol.b * op;
                    colAttr.array[idx + 3] = cyanCol.r * op; colAttr.array[idx + 4] = cyanCol.g * op; colAttr.array[idx + 5] = cyanCol.b * op;
                    lineCount++;
                }
            }
        }
        this.constellationLines.geometry.setDrawRange(0, lineCount * 2);
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;

        // Burst particles
        for (let i = this.burstParticles.length - 1; i >= 0; i--) {
            const p = this.burstParticles[i];
            p.mesh.position.add(p.velocity);
            p.velocity.multiplyScalar(0.97);
            p.life -= p.decay;
            p.mesh.material.opacity = Math.max(0, p.life);
            p.mesh.scale.setScalar(0.12 * Math.max(0, p.life));
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.material.dispose();
                this.burstParticles.splice(i, 1);
            }
        }
    }
}
