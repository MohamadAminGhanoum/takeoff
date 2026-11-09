"use client";
import { useEffect, useRef } from "react";
import type { Material, Object3D, Mesh } from "three";

const SCROLL_MULTIPLIER = 1;
const LAST_FRAME = 720;

const CAMERA_KEYS: [number, [number, number, number], [number, number, number]][] = [
  [1, [-0.6, 29.0, 2.2], [-0.6, 80.0, 1.0]],
  [72, [-0.6, 29.6, 2.2], [-0.6, 80.0, 1.0]],
  [120, [0.0, 34.5, 2.0], [0.0, 90.0, 1.0]],
  [170, [10.0, 48.0, 4.0], [0.0, 30.0, 0.0]],
  [216, [45.0, 8.0, 8.0], [0.0, 0.0, 0.0]],
  [260, [47.0, 20.0, 9.5], [55.0, 15.0, 9.0]],
  [300, [46.0, 24.0, 10.0], [37.0, 33.0, 10.7]],
  [336, [60.0, 45.0, 13.0], [90.0, 60.0, 12.0]],
  [420, [66.0, 40.0, 13.0], [92.0, 48.0, 11.0]],
  [480, [70.0, 30.0, 12.0], [100.0, 0.0, 11.0]],
  [530, [115.0, 30.0, 8.0], [150.0, 60.0, -20.0]],
  [580, [118.0, 32.0, 14.0], [150.0, 60.0, 40.0]],
  [624, [125.0, 40.0, 60.0], [150.0, 60.0, 120.0]],
  [680, [132.0, 40.0, 250.0], [150.0, 60.0, 300.0]],
  [700, [130.0, 30.0, 345.0], [155.0, 65.0, 358.0]],
  [720, [128.0, 28.0, 350.0], [155.0, 65.0, 358.0]],
];

const DRONE_KEYS: [number, [number, number, number]][] = [[240, [70, 0, 8]], [330, [20, 50, 12]]];
const SPITFIRE_KEYS: [number, [number, number, number]][] = [[337, [90, 140, 12]], [480, [90, -20, 12]]];
const BIPLANE_KEYS: [number, [number, number, number]][] = [[337, [98, 150, 9]], [480, [98, -10, 9]]];
const ROCKET_KEYS: [number, [number, number, number]][] = [
  [481, [150, 60, -60]], [580, [150, 60, 30]], [624, [150, 60, 110]], [700, [150, 60, 345]], [720, [150, 60, 420]],
];
const EXTERIOR_REVEAL_FRAME = 125;

const CLOUDS: [number, number, number, number][] = [
  [-60, 40, -35, 18], [20, 80, -40, 22], [80, 20, -38, 20], [140, 90, -42, 25], [170, 30, -36, 16],
  [110, -40, -40, 24], [-20, -60, -38, 20], [60, 140, -40, 22], [200, 120, -45, 26], [40, -20, -36, 15],
];

export default function SceneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let rafId = 0;
    let disposer: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (cancelled) return;

      function blenderToThree([x, y, z]: [number, number, number]) {
        return new THREE.Vector3(x, z, -y);
      }

      function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number) {
        const t2 = t * t;
        const t3 = t2 * t;
        return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
      }

      function sampleKeys(keys: [number, [number, number, number]][], frame: number): [number, number, number] {
        const lastIndex = keys.length - 1;
        if (frame <= keys[0][0]) return keys[0][1];
        if (frame >= keys[lastIndex][0]) return keys[lastIndex][1];
        let index = 0;
        while (frame >= keys[index + 1][0]) index++;
        const t = (frame - keys[index][0]) / (keys[index + 1][0] - keys[index][0]);
        const before = keys[Math.max(index - 1, 0)][1];
        const from = keys[index][1];
        const to = keys[index + 1][1];
        const after = keys[Math.min(index + 2, lastIndex)][1];
        return from.map((_, axis) => catmullRom(before[axis], from[axis], to[axis], after[axis], t)) as [number, number, number];
      }

      const SKY_COLOUR = new THREE.Color(0.62, 0.74, 0.88);
      const SPACE_COLOUR = new THREE.Color(0.005, 0.005, 0.02);
      const SKY_FADE_START = 560;
      const SKY_FADE_END = 680;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.background = SKY_COLOUR.clone();
      scene.fog = new THREE.Fog(SKY_COLOUR.clone(), 250, 1400);

      const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 6000);

      const blenderWorld = new THREE.Group();
      blenderWorld.rotation.x = -Math.PI / 2;
      scene.add(blenderWorld);

      const sunDirection = new THREE.Vector3(0.32, 0.88, 0.34);
      scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x6b6f7a, 1.4));
      const sunLight = new THREE.DirectionalLight(0xffd9b3, 2.4);
      sunLight.position.copy(blenderToThree(sunDirection.toArray() as [number, number, number]).multiplyScalar(100));
      scene.add(sunLight);

      function material(colour: number, options: Record<string, unknown> = {}) {
        return new THREE.MeshStandardMaterial({ color: colour, roughness: 0.6, metalness: 0.1, flatShading: true, ...options });
      }

      const materials = {
        hull: material(0xd9dbe6),
        engine: material(0x26262b),
        cockpit: material(0x383d45),
        seat: material(0x5a4033),
        drone: material(0x1a1a1a),
        rotor: material(0x8a8a90, { transparent: true, opacity: 0.45 }),
        spitfire: material(0x5c6b4d),
        biplane: material(0xb31f1a),
        rocket: material(0xf2f2f2),
        flame: new THREE.MeshBasicMaterial({ color: 0xff8a1f }),
        cloud: material(0xffffff, { flatShading: false, roughness: 1 }),
        cloudDeck: material(0xeceef5, { roughness: 1 }),
      };

      function addBox(size: [number, number, number], position: [number, number, number], mat: Material, parent: Object3D, rotationZ = 0) {        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
        mesh.position.set(...position);
        mesh.rotation.z = rotationZ;
        parent.add(mesh);
        return mesh;
      }

      function addCylinderAlongY(radius: number, length: number, position: [number, number, number], mat: Material, parent: Object3D) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), mat);
        mesh.position.set(...position);
        parent.add(mesh);
        return mesh;
      }

      function addCylinderAlongZ(radius: number, length: number, position: [number, number, number], mat: Material, parent: Object3D) {
        const mesh = addCylinderAlongY(radius, length, position, mat, parent);
        mesh.rotation.x = Math.PI / 2;
        return mesh;
      }

      function addEllipsoid(radii: [number, number, number], position: [number, number, number], mat: Material, parent: Object3D) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat);
        mesh.scale.set(...radii);
        mesh.position.set(...position);
        parent.add(mesh);
        return mesh;
      }

      function addCone(radius: number, length: number, position: [number, number, number], mat: Material, parent: Object3D, pointingDown = false) {
        const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, length, 24), mat);
        mesh.position.set(...position);
        mesh.rotation.x = pointingDown ? -Math.PI / 2 : Math.PI / 2;
        parent.add(mesh);
        return mesh;
      }

      function makeAssetSlot(rotationZ = 0) {
        const slot = new THREE.Group();
        slot.rotation.z = rotationZ;
        blenderWorld.add(slot);
        return slot;
      }

      function build747Exterior() {
        const slot = makeAssetSlot();
        addCylinderAlongY(3.2, 64, [0, -2, 0], materials.hull, slot);
        addEllipsoid([3.2, 6.4, 3.2], [0, 30, 0], materials.hull, slot);
        addBox([2.6, 20, 1.6], [0, 20, 3.2], materials.hull, slot);
        addBox([30, 8, 0.5], [15, -8, -1.2], materials.hull, slot, THREE.MathUtils.degToRad(-25));
        addBox([30, 8, 0.5], [-15, -8, -1.2], materials.hull, slot, THREE.MathUtils.degToRad(25));
        for (const side of [1, -1]) {
          addCylinderAlongY(1.1, 4.5, [10 * side, -3.5, -2.6], materials.engine, slot);
          addCylinderAlongY(1.1, 4.5, [19 * side, -7.7, -2.6], materials.engine, slot);
        }
        addBox([0.5, 8, 9], [0, -30, 5], materials.hull, slot);
        addBox([20, 5, 0.4], [0, -31, 0.5], materials.hull, slot);
        return slot;
      }

      function build747Cockpit() {
        const slot = makeAssetSlot();
        addBox([3, 6, 0.1], [0, 30.5, 0.5], materials.cockpit, slot);
        addBox([3, 0.8, 0.9], [0, 32.8, 1.3], materials.cockpit, slot);
        addBox([3, 0.5, 0.15], [0, 32.6, 1.8], materials.cockpit, slot);
        addBox([2, 1.5, 0.15], [0, 31.5, 3.0], materials.cockpit, slot);
        addBox([3, 0.1, 0.1], [0, 33.3, 1.9], materials.cockpit, slot);
        addBox([3, 0.1, 0.1], [0, 33.3, 2.8], materials.cockpit, slot);
        for (const postX of [-1.4, -0.45, 0.45, 1.4]) addBox([0.08, 0.08, 0.9], [postX, 33.3, 2.35], materials.cockpit, slot);
        for (const seatX of [-0.6, 0.6]) {
          addBox([0.6, 0.6, 1.2], [seatX, 28.4, 1.4], materials.seat, slot);
          addBox([0.4, 0.05, 0.25], [seatX, 32.0, 1.6], materials.engine, slot);
        }
      }

      function buildDrone() {
        const slot = makeAssetSlot();
        addBox([1.2, 1.2, 0.3], [0, 0, 0], materials.drone, slot);
        addBox([3.2, 0.15, 0.1], [0, 0, 0], materials.drone, slot, Math.PI / 4);
        addBox([3.2, 0.15, 0.1], [0, 0, 0], materials.drone, slot, -Math.PI / 4);
        const rotors: Mesh[] = [];
        for (const rotorX of [1.13, -1.13]) {
          for (const rotorY of [1.13, -1.13]) rotors.push(addCylinderAlongZ(0.6, 0.05, [rotorX, rotorY, 0.2], materials.rotor, slot));
        }
        return { slot, rotors };
      }

      function buildSpitfire() {
        const slot = makeAssetSlot(Math.PI);
        addCylinderAlongY(0.6, 9, [0, 0, 0], materials.spitfire, slot);
        addEllipsoid([0.35, 0.35, 0.35], [0, 4.6, 0], materials.engine, slot);
        const propeller = addCylinderAlongY(1.6, 0.05, [0, 4.7, 0], materials.rotor, slot);
        addEllipsoid([5.5, 1.3, 0.12], [0, 1, -0.3], materials.spitfire, slot);
        addEllipsoid([1.6, 0.6, 0.08], [0, -4, 0.1], materials.spitfire, slot);
        addBox([0.1, 1, 1.2], [0, -4.1, 0.7], materials.spitfire, slot);
        return { slot, propeller };
      }

      function buildBiplane() {
        const slot = makeAssetSlot(Math.PI);
        addBox([1, 7, 1], [0, 0, 0], materials.biplane, slot);
        addBox([9, 1.5, 0.12], [0, 1, 1.3], materials.biplane, slot);
        addBox([9, 1.5, 0.12], [0, 1, -0.5], materials.biplane, slot);
        for (const strutX of [-3, 3]) addBox([0.08, 0.08, 1.8], [strutX, 1, 0.4], materials.engine, slot);
        addBox([3, 1, 0.1], [0, -3.2, 0.2], materials.biplane, slot);
        addBox([0.1, 1, 1], [0, -3.3, 0.7], materials.biplane, slot);
        const propeller = addCylinderAlongY(1.2, 0.05, [0, 3.6, 0], materials.rotor, slot);
        return { slot, propeller };
      }

      function buildRocket() {
        const slot = makeAssetSlot();
        addCylinderAlongZ(1.8, 24, [0, 0, 12], materials.rocket, slot);
        addCone(1.8, 6, [0, 0, 27], materials.rocket, slot);
        for (const finAngleDegrees of [0, 120, 240]) {
          const finAngle = THREE.MathUtils.degToRad(finAngleDegrees);
          addBox([3, 0.2, 4], [2.3 * Math.cos(finAngle), 2.3 * Math.sin(finAngle), 2], materials.engine, slot, finAngle);
        }
        const flame = addCone(1.6, 10, [0, 0, -5], materials.flame, slot, true);
        return { slot, flame };
      }

      const exterior747 = build747Exterior();
      build747Cockpit();
      const drone = buildDrone();
      const spitfire = buildSpitfire();
      const biplane = buildBiplane();
      const rocket = buildRocket();

      const cloudDeck = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), materials.cloudDeck);
      cloudDeck.position.set(0, 0, -55);
      blenderWorld.add(cloudDeck);
      for (const [cloudX, cloudY, cloudZ, cloudSize] of CLOUDS) {
        addEllipsoid([cloudSize, cloudSize * 0.7, cloudSize * 0.3], [cloudX, cloudY, cloudZ], materials.cloud, blenderWorld);
      }
      const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffe2b0, fog: false }));
      sunDisc.position.copy(blenderToThree(sunDirection.clone().multiplyScalar(1500).toArray() as [number, number, number]));
      scene.add(sunDisc);

      const starCount = 1800;
      const positions = new Float32Array(starCount * 3);
      for (let index = 0; index < starCount; index++) {
        const direction = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(2500);
        positions.set([direction.x + 150, direction.y + 300, direction.z - 60], index * 3);
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false });
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);

      function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        const horizontalFieldOfView = 2 * Math.atan(18 / 20);
        const verticalFieldOfView = 2 * Math.atan(Math.tan(horizontalFieldOfView / 2) / Math.max(camera.aspect, 0.6));
        camera.fov = THREE.MathUtils.radToDeg(verticalFieldOfView);
        camera.updateProjectionMatrix();
      }
      window.addEventListener("resize", resize);
      resize();

      function frameFromScroll() {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
        return 1 + progress * (LAST_FRAME - 1) * SCROLL_MULTIPLIER;
      }

      let displayedFrame = frameFromScroll();
      const clock = new THREE.Clock();

      function placeAtFrame(object: THREE.Object3D, keys: [number, [number, number, number]][], frame: number) {
        object.position.set(...sampleKeys(keys, frame));
      }

      function render() {
        if (cancelled) return;
        const elapsed = clock.getElapsedTime();
        const targetFrame = frameFromScroll();
        displayedFrame += (targetFrame - displayedFrame) * 0.12;
        if (Math.abs(targetFrame - displayedFrame) < 0.01) displayedFrame = targetFrame;
        const frame = displayedFrame;

        const camPos = sampleKeys(CAMERA_KEYS.map(([k, p]) => [k, p]), frame);
        const camTarget = sampleKeys(CAMERA_KEYS.map(([k, , t]) => [k, t]), frame);
        camera.position.copy(blenderToThree(camPos));
        camera.lookAt(blenderToThree(camTarget));

        placeAtFrame(drone.slot, DRONE_KEYS, frame);
        placeAtFrame(spitfire.slot, SPITFIRE_KEYS, frame);
        placeAtFrame(biplane.slot, BIPLANE_KEYS, frame);
        placeAtFrame(rocket.slot, ROCKET_KEYS, frame);
        drone.rotors.forEach((rotor) => { rotor.rotation.y = elapsed * 40; });
        spitfire.propeller.rotation.y = elapsed * 30;
        biplane.propeller.rotation.y = elapsed * 30;
        rocket.flame.scale.set(1, 0.85 + Math.random() * 0.3, 1);
        rocket.flame.visible = frame > 481;
        exterior747.visible = frame >= EXTERIOR_REVEAL_FRAME;

        const spaceAmount = THREE.MathUtils.smoothstep(frame, SKY_FADE_START, SKY_FADE_END);
        scene.background.copy(SKY_COLOUR).lerp(SPACE_COLOUR, spaceAmount);
        scene.fog.color.copy(scene.background);
        starMaterial.opacity = spaceAmount;

        renderer.render(scene, camera);
        rafId = requestAnimationFrame(render);
      }
      render();

      disposer = () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resize);
        renderer.dispose();
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
      };
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      disposer?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-0 pointer-events-none"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-slate-950/65" />
    </div>
  );
}