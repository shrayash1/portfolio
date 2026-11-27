import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export type Quality = "high" | "lite";

export const defaultQuality = (touch: boolean): Quality => (touch ? "lite" : "high");

const NO_WEBGL =
  "3D graphics are turned off in this browser. Turn on hardware acceleration: Chrome or Edge → Settings → System → \u201cUse graphics acceleration when available\u201d, then restart the browser. Or open this link in a normal Chrome, Edge or Safari window. You can test 3D support at get.webgl.org.";

export type RendererResult =
  | {
      ok: true;
      renderer: THREE.WebGLRenderer;
      composer: EffectComposer;
      setQuality(q: Quality): void;
      render(scene: THREE.Scene, camera: THREE.Camera): void;
      resize(): void;
    }
  | { ok: false; message: string };

export function createRenderer(canvasHost: HTMLElement): RendererResult {
  let renderer: THREE.WebGLRenderer | null = null;
  // try the best settings first, then simpler ones, before giving up
  for (const opts of [
    { antialias: true, powerPreference: "high-performance" as const },
    { antialias: false },
    { antialias: false, failIfMajorPerformanceCaveat: false, precision: "mediump" as const },
  ]) {
    try {
      renderer = new THREE.WebGLRenderer(opts);
      break;
    } catch {
      /* try the next, simpler setting */
    }
  }
  if (!renderer) return { ok: false, message: NO_WEBGL };
  const r = renderer;

  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.55;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasHost.appendChild(r.domElement);

  const composer = new EffectComposer(r);
  let quality: Quality = defaultQuality(matchMedia("(hover: none)").matches);
  let materialsDirty = false;
  let built: { scene: THREE.Scene; camera: THREE.Camera } | null = null;

  // passes need the scene and camera, so they are built on first render (and rebuilt if either changes)
  function buildPasses(scene: THREE.Scene, camera: THREE.Camera) {
    for (const p of composer.passes.splice(0)) p.dispose?.();
    const w = innerWidth, h = innerHeight;
    composer.addPass(new RenderPass(scene, camera));
    // soft contact shadows in corners and under objects (ambient occlusion) for depth
    try {
      const ao = new GTAOPass(scene, camera, w, h);
      ao.blendIntensity = 0.85;
      // GTAO hides Points and Lines from its normal/depth pass but not Sprites, so a translucent sprite (steam) would shade a solid rectangle: hide them too
      ao.overrideVisibility = function () {
        const cache = (this as unknown as { _visibilityCache: Map<THREE.Object3D, boolean> })._visibilityCache;
        scene.traverse((o) => { cache.set(o, o.visible); if ((o as THREE.Points).isPoints || (o as THREE.Line).isLine || (o as THREE.Sprite).isSprite) o.visible = false; });
      };
      composer.addPass(ao);
    } catch {
      /* AO unsupported: skip it */
    }
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.28, 0.6, 0.86));
    composer.addPass(new OutputPass());
    built = { scene, camera };
    syncComposer();
  }

  function syncComposer() {
    composer.setPixelRatio(r.getPixelRatio());
    composer.setSize(innerWidth, innerHeight);
  }

  function resize() {
    r.setPixelRatio(quality === "high" ? Math.min(devicePixelRatio, 2) : 1);
    r.setSize(innerWidth, innerHeight);
    syncComposer();
  }

  function setQuality(q: Quality) {
    if (q !== quality) materialsDirty = true;
    quality = q;
    r.shadowMap.enabled = q === "high";
    resize();
  }

  setQuality(quality);

  return {
    ok: true,
    renderer: r,
    composer,
    setQuality,
    resize,
    render(scene, camera) {
      if (materialsDirty) {
        materialsDirty = false;
        scene.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
          if (m) for (const x of Array.isArray(m) ? m : [m]) x.needsUpdate = true;
        });
      }
      if (quality === "lite") return r.render(scene, camera);
      if (!built || built.scene !== scene || built.camera !== camera) buildPasses(scene, camera);
      composer.render();
    },
  };
}
