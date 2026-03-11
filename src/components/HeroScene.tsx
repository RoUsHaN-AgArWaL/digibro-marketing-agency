import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight("#d9e7ff", 1.2);
    const primaryLight = new THREE.PointLight("#4f9cff", 16, 20);
    const secondaryLight = new THREE.PointLight("#8b5cf6", 14, 20);
    primaryLight.position.set(3.2, 2, 4);
    secondaryLight.position.set(-3.5, -1.4, 3);
    scene.add(ambientLight, primaryLight, secondaryLight);

    const orbGeometry = new THREE.IcosahedronGeometry(1.5, 8);
    const orbMaterial = new THREE.MeshPhysicalMaterial({
      color: "#4f9cff",
      metalness: 0.28,
      roughness: 0.08,
      transmission: 0.12,
      clearcoat: 1,
      emissive: new THREE.Color("#103f98"),
      emissiveIntensity: 0.9,
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(1.5, 0.2, 0);
    scene.add(orb);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.64, 0.18, 180, 24),
      new THREE.MeshPhysicalMaterial({
        color: "#8b5cf6",
        metalness: 0.75,
        roughness: 0.14,
        clearcoat: 1,
        emissive: new THREE.Color("#3c1c8a"),
        emissiveIntensity: 1.1,
      }),
    );
    knot.position.set(-2.1, -0.7, -1.2);
    scene.add(knot);

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    for (let index = 0; index < starCount * 3; index += 3) {
      starPositions[index] = (Math.random() - 0.5) * 18;
      starPositions[index + 1] = (Math.random() - 0.5) * 12;
      starPositions[index + 2] = (Math.random() - 0.5) * 18;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: "#c7d8ff", size: 0.03, transparent: true, opacity: 0.8 }),
    );
    scene.add(stars);

    const pointer = { x: 0, y: 0 };
    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("resize", handleResize);

    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      orb.rotation.x = elapsed * 0.18;
      orb.rotation.y = elapsed * 0.24;
      orb.position.x += (pointer.x * 1.1 + 1.5 - orb.position.x) * 0.03;
      orb.position.y += (pointer.y * 0.65 + 0.2 - orb.position.y) * 0.03;

      knot.rotation.x = elapsed * 0.24;
      knot.rotation.z = elapsed * 0.18;
      knot.position.x += (-pointer.x * 0.7 - 2.1 - knot.position.x) * 0.03;
      knot.position.y += (-pointer.y * 0.4 - 0.7 - knot.position.y) * 0.03;

      stars.rotation.y = elapsed * 0.02;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
      orbGeometry.dispose();
      orbMaterial.dispose();
      starGeometry.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}