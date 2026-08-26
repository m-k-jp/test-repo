import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * Three.js で回転する多面体を描画するアイランド。
 *
 * このファイルの JavaScript は、client:visible が付いている場合
 * 「画面に入るまでダウンロードすらされない」。
 * それを目で確認できるよう、実際に動き出した時刻を表示している。
 */
export default function ThreeScene() {
  const mountRef = useRef(null);
  const [status, setStatus] = useState('読み込み中…');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup = () => {};

    // 動的 import。ここで初めて three.js 本体が取得される。
    import('three').then((THREE) => {
      if (disposed) return;

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        45,
        mount.clientWidth / mount.clientHeight,
        0.1,
        100,
      );
      camera.position.set(0, 0, 6);

      // alpha: true で背景を透過させ、ページ側の配色をそのまま活かす
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);

      // 本体：面をフラットシェーディングにして多面体らしさを出す
      const geometry = new THREE.IcosahedronGeometry(2, 1);
      const material = new THREE.MeshStandardMaterial({
        color: 0x4f7cff,
        flatShading: true,
        roughness: 0.35,
        metalness: 0.15,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // 稜線を重ねてワイヤーフレーム風に
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }),
      );
      mesh.add(edges);

      scene.add(new THREE.AmbientLight(0xffffff, 1.2));

      const keyLight = new THREE.DirectionalLight(0xffffff, 3);
      keyLight.position.set(5, 5, 5);
      scene.add(keyLight);

      // 背後からのリムライト。稜線に色が乗って立体感が出る
      const rimLight = new THREE.DirectionalLight(0xff5fa2, 1.8);
      rimLight.position.set(-5, -2, -3);
      scene.add(rimLight);

      const fillLight = new THREE.DirectionalLight(0x35e0d0, 1.1);
      fillLight.position.set(3, -4, 3);
      scene.add(fillLight);

      // --- ドラッグで回す ---
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let velocityX = 0.004;
      let velocityY = 0.002;

      const pointerDown = (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        renderer.domElement.setPointerCapture(e.pointerId);
      };
      const pointerMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        mesh.rotation.y += dx * 0.01;
        mesh.rotation.x += dy * 0.01;
        velocityX = dx * 0.001;
        velocityY = dy * 0.001;
      };
      const pointerUp = (e) => {
        dragging = false;
        if (renderer.domElement.hasPointerCapture?.(e.pointerId)) {
          renderer.domElement.releasePointerCapture(e.pointerId);
        }
      };

      renderer.domElement.addEventListener('pointerdown', pointerDown);
      renderer.domElement.addEventListener('pointermove', pointerMove);
      renderer.domElement.addEventListener('pointerup', pointerUp);
      renderer.domElement.addEventListener('pointercancel', pointerUp);
      renderer.domElement.style.touchAction = 'none';
      renderer.domElement.style.cursor = 'grab';

      // --- リサイズ追従 ---
      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(mount);

      // --- 描画ループ ---
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let frame;
      const animate = () => {
        frame = requestAnimationFrame(animate);
        if (!dragging && !reduceMotion) {
          mesh.rotation.y += velocityX;
          mesh.rotation.x += velocityY;
          // ドラッグの勢いを徐々に既定の回転へ戻す
          velocityX += (0.004 - velocityX) * 0.02;
          velocityY += (0.002 - velocityY) * 0.02;
        }
        renderer.render(scene, camera);
      };
      animate();

      setStatus(
        `three.js 起動 — ${new Date().toLocaleTimeString('ja-JP')}（ドラッグで回せます）`,
      );

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        renderer.domElement.removeEventListener('pointerdown', pointerDown);
        renderer.domElement.removeEventListener('pointermove', pointerMove);
        renderer.domElement.removeEventListener('pointerup', pointerUp);
        renderer.domElement.removeEventListener('pointercancel', pointerUp);
        geometry.dispose();
        material.dispose();
        edges.geometry.dispose();
        edges.material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div class="scene">
      <div class="scene-canvas" ref={mountRef} />
      <p class="scene-status">{status}</p>
    </div>
  );
}
