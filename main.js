// ═══════════════════════════════════════════════════════════
//  Microservices Network — Interactive Three.js Background
//
//  Interactions:
//    mousemove  →  network rotates + cursor projected into 3D
//                  glowing lines from cursor to nearby nodes
//                  nodes near cursor scale up & glow brighter
//    click      →  ripple wave pulses outward from cursor
// ═══════════════════════════════════════════════════════════
(function () {
    if (typeof THREE === 'undefined') return;

    const canvas = document.querySelector('canvas.webgl');
    const sizes  = { w: window.innerWidth, h: window.innerHeight };

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(sizes.w, sizes.h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, sizes.w / sizes.h, 0.1, 100);
    camera.position.set(0, 0, 11);

    // ── Dracula colours ──────────────────────────────────────
    const C = {
        green:  0x50fa7b,
        cyan:   0x8be9fd,
        purple: 0xbd93f9,
        orange: 0xffb86c,
        pink:   0xff79c6,
        yellow: 0xf1fa8c,
        red:    0xff5555,
    };

    // ── Node data ────────────────────────────────────────────
    const nodeData = [
        { pos: [ 0.0,  0.0,  0.0], r: 0.22, color: C.green,  label: 'API Gateway'  },
        { pos: [-4.2,  1.5, -1.0], r: 0.17, color: C.purple, label: 'PostgreSQL'   },
        { pos: [ 3.8,  1.2, -0.5], r: 0.15, color: C.cyan,   label: 'Redis Cache'  },
        { pos: [-3.0, -2.2,  1.0], r: 0.15, color: C.orange, label: 'Job Queue'    },
        { pos: [ 2.0,  2.8, -2.0], r: 0.14, color: C.pink,   label: 'Auth'         },
        { pos: [ 4.5, -1.2,  0.5], r: 0.13, color: C.green,  label: 'Notif. Svc'  },
        { pos: [-1.8, -1.0,  2.2], r: 0.14, color: C.yellow, label: 'Import/Export'},
        { pos: [-4.8, -0.8, -1.5], r: 0.12, color: C.red,    label: 'Logger'       },
        { pos: [ 0.5,  3.2,  1.0], r: 0.12, color: C.cyan,   label: 'Protobuf'     },
    ];

    const edgeData = [
        [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],
        [1,3],[1,7],[2,5],[3,6],[4,1],[8,1],
    ];

    // ── Network group ────────────────────────────────────────
    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    // ── Build nodes ──────────────────────────────────────────
    const nodes = nodeData.map(nd => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(nd.r, 16, 16),
            new THREE.MeshBasicMaterial({ color: nd.color })
        );
        mesh.position.set(...nd.pos);

        // glow halo
        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(nd.r * 2.5, 16, 16),
            new THREE.MeshBasicMaterial({ color: nd.color, transparent: true, opacity: 0.06, side: THREE.BackSide })
        );
        mesh.add(halo);

        // orbit ring
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(nd.r * 1.5, nd.r * 1.75, 32),
            new THREE.MeshBasicMaterial({ color: nd.color, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
        );
        ring.rotation.x = Math.PI * 0.5;
        mesh.add(ring);

        networkGroup.add(mesh);
        return { mesh, halo, ring, baseR: nd.r, color: nd.color, pos: nd.pos };
    });

    // ── Build static edges ───────────────────────────────────
    const edges = edgeData.map(([ai, bi]) => {
        const from = new THREE.Vector3(...nodeData[ai].pos);
        const to   = new THREE.Vector3(...nodeData[bi].pos);
        const geo  = new THREE.BufferGeometry().setFromPoints([from, to]);
        const mat  = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 });
        networkGroup.add(new THREE.Line(geo, mat));
        return { from, to, nodeA: nodeData[ai], nodeB: nodeData[bi] };
    });

    // ── Build data packets ───────────────────────────────────
    const packets = [];
    const tmp = new THREE.Vector3();

    edges.forEach(edge => {
        const count = Math.random() < 0.4 ? 2 : 1;
        for (let i = 0; i < count; i++) {
            const color = Math.random() < 0.5 ? edge.nodeA.color : edge.nodeB.color;
            const mesh  = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                new THREE.MeshBasicMaterial({ color })
            );
            networkGroup.add(mesh);
            packets.push({
                mesh, from: edge.from, to: edge.to,
                progress: Math.random(),
                speed: 0.003 + Math.random() * 0.005,
                reverse: Math.random() < 0.3,
                baseSpeed: 0.003 + Math.random() * 0.005,
            });
        }
    });

    // ── Cursor-to-node connection lines (in local space) ─────
    const CONNECT_DIST = 3.0;

    const cursorLines = nodes.map(nd => {
        const positions = new Float32Array(6);          // 2 pts × 3 coords
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat  = new THREE.LineBasicMaterial({ color: nd.color, transparent: true, opacity: 0 });
        const line = new THREE.Line(geo, mat);
        line.visible = false;
        line.frustumCulled = false;                     // always draw, even if origin outside frustum
        networkGroup.add(line);
        return line;
    });

    // ── Cursor probe sphere (shown at 3D cursor position) ────
    const probeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        new THREE.MeshBasicMaterial({ color: C.green, transparent: true, opacity: 0 })
    );
    // outer pulse ring around probe
    const probeRing = new THREE.Mesh(
        new THREE.RingGeometry(0.10, 0.14, 32),
        new THREE.MeshBasicMaterial({ color: C.green, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    probeRing.rotation.x = Math.PI * 0.5;
    probeMesh.add(probeRing);
    networkGroup.add(probeMesh);

    // ── Star field ───────────────────────────────────────────
    const starPos = new Float32Array(800 * 3);
    for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 40;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
        size: 0.04, sizeAttenuation: true,
        transparent: true, opacity: 0.28, color: 0x6272a4, depthWrite: false,
    })));

    // ── Mouse / raycasting state ─────────────────────────────
    const ndcMouse    = new THREE.Vector2(-9999, -9999);  // normalised device coords
    const raycaster   = new THREE.Raycaster();
    const cursorWorld = new THREE.Vector3();
    const cursorLocal = new THREE.Vector3();
    const invMatrix   = new THREE.Matrix4();
    // Plane at z = 1 in world space (roughly "in front of" the network)
    const probePane   = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1);

    // Smoothed rotation accumulators
    let rotY = 0, rotX = 0;
    let targetRotY = 0, targetRotX = 0;

    // Click ripple state
    let ripple = null;  // { localOrigin: Vector3, t: float }

    // ── Cursor speed tracking (for boosting packets) ─────────
    let prevMX = 0, prevMY = 0, cursorSpeed = 0;

    document.addEventListener('mousemove', e => {
        ndcMouse.x = (e.clientX / sizes.w) * 2 - 1;
        ndcMouse.y = -(e.clientY / sizes.h) * 2 + 1;

        const mx = (e.clientX / sizes.w - 0.5) * 2;
        const my = (e.clientY / sizes.h - 0.5) * 2;

        // Mouse drives rotation target (full range = ±0.6 rad)
        targetRotY = mx * 0.55;
        targetRotX = -my * 0.30;

        // Track cursor speed
        cursorSpeed = Math.sqrt((mx - prevMX) ** 2 + (my - prevMY) ** 2) * 30;
        prevMX = mx; prevMY = my;
    });

    // Click → ripple
    document.addEventListener('click', () => {
        ripple = { origin: cursorLocal.clone(), t: 0 };
        // Temporarily boost all packet speeds
        packets.forEach(p => { p.speed = p.baseSpeed * 5; });
        setTimeout(() => { packets.forEach(p => { p.speed = p.baseSpeed; }); }, 700);
    });

    // Resize
    window.addEventListener('resize', () => {
        sizes.w = window.innerWidth;
        sizes.h = window.innerHeight;
        camera.aspect = sizes.w / sizes.h;
        camera.updateProjectionMatrix();
        renderer.setSize(sizes.w, sizes.h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // ── Animation loop ───────────────────────────────────────
    const clock = new THREE.Clock();

    (function tick() {
        const t = clock.getElapsedTime();

        // ── Smooth rotation (mouse-driven + slow idle drift) ──
        rotY += (targetRotY - rotY) * 0.045 + 0.0003;
        rotX += (targetRotX - rotX) * 0.045;
        networkGroup.rotation.y = rotY;
        networkGroup.rotation.x = rotX;

        // ── Project cursor onto scene plane in local space ────
        networkGroup.updateMatrixWorld();
        invMatrix.copy(networkGroup.matrixWorld).invert();

        raycaster.setFromCamera(ndcMouse, camera);
        if (raycaster.ray.intersectPlane(probePane, cursorWorld)) {
            cursorLocal.copy(cursorWorld).applyMatrix4(invMatrix);
        }

        // ── Position probe sphere ─────────────────────────────
        probeMesh.position.copy(cursorLocal);
        probeMesh.material.opacity = 0.75;
        probeRing.rotation.z = t * 2.5;
        probeRing.material.opacity = 0.4 + Math.sin(t * 4) * 0.2;

        // ── Cursor-to-node lines + node hover ─────────────────
        let anyCursorClose = false;

        nodes.forEach((nd, i) => {
            const dist   = cursorLocal.distanceTo(nd.mesh.position);
            const inside = dist < CONNECT_DIST;

            if (inside) {
                anyCursorClose = true;
                const t01    = 1 - dist / CONNECT_DIST;              // 0..1 proximity
                const eased  = Math.pow(t01, 1.6);

                // Line from probe to node
                cursorLines[i].visible = true;
                cursorLines[i].material.opacity = eased * 0.7;

                const pos = cursorLines[i].geometry.attributes.position.array;
                pos[0] = cursorLocal.x;          pos[1] = cursorLocal.y;          pos[2] = cursorLocal.z;
                pos[3] = nd.mesh.position.x;     pos[4] = nd.mesh.position.y;     pos[5] = nd.mesh.position.z;
                cursorLines[i].geometry.attributes.position.needsUpdate = true;

                // Node scales up
                const s = 1 + eased * 0.9;
                nd.mesh.scale.lerp(tmp.set(s, s, s), 0.12);

                // Halo glows brighter
                nd.halo.material.opacity = 0.06 + eased * 0.22;

            } else {
                cursorLines[i].visible = false;
                nd.mesh.scale.lerp(tmp.set(1, 1, 1), 0.08);
            }
        });

        // Probe ring colour feedback — brighten if any node close
        probeMesh.material.color.setHex(anyCursorClose ? C.cyan : C.green);
        probeRing.material.color.setHex(anyCursorClose ? C.cyan : C.green);

        // ── Click ripple ──────────────────────────────────────
        if (ripple) {
            ripple.t += 0.03;
            const waveR = ripple.t * 6;         // expanding radius
            const waveW = 0.7;                   // wave width

            nodes.forEach(nd => {
                const dist = ripple.origin.distanceTo(nd.mesh.position);
                const diff = Math.abs(dist - waveR);
                if (diff < waveW) {
                    const strength = 1 - diff / waveW;
                    nd.halo.material.opacity = strength * 0.5;
                    const s = 1 + strength * 1.5;
                    nd.mesh.scale.set(s, s, s);
                }
            });

            // Flash edges near the wavefront
            if (ripple.t > 2.0) ripple = null;
        }

        // ── Idle node pulse ───────────────────────────────────
        nodes.forEach((nd, i) => {
            const p = Math.sin(t * 1.8 + i * 0.9);
            nd.halo.scale.setScalar(1 + p * 0.15);
            // Don't override opacity if ripple or cursor is active
            nd.ring.rotation.z = t * 0.6 + i;
        });

        // ── Move data packets ─────────────────────────────────
        // Cursor speed slightly boosts nearby packets
        packets.forEach(p => {
            const dist = cursorLocal.distanceTo(p.mesh.position);
            const boost = dist < 2.0 ? 1 + cursorSpeed * 0.3 : 1;
            p.progress += p.speed * boost;
            if (p.progress > 1) p.progress = 0;
            const f = p.reverse ? 1 - p.progress : p.progress;
            p.mesh.position.lerpVectors(p.from, p.to, f);
        });

        // Decay cursor speed
        cursorSpeed *= 0.85;

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    })();
})();
