import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";

export type TimeName = "morning" | "golden" | "dusk";

export const TIMES = {
  morning: { elev: 30, az: 150, sun: 0xfff0dc, si: 4.2, hemi: 0.75, fog: 0xe6d6c4, dens: 0.0019, exp: 0.62, lamps: 0 },
  golden: { elev: 10, az: 188, sun: 0xffb46e, si: 5.2, hemi: 0.6, fog: 0xeaa97c, dens: 0.0022, exp: 0.68, lamps: 0 },
  dusk: { elev: -1.5, az: 230, sun: 0x9a7ac0, si: 0.5, hemi: 0.4, fog: 0x5b4870, dens: 0.0026, exp: 1.25, lamps: 1 },
};

const SKY_PARAMS = { turbidity: 7, rayleigh: 2.2, mieCoefficient: 0.006, mieDirectionalG: 0.86 } as const;

export function createSky(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  const sky = new Sky();
  sky.scale.setScalar(4500);
  scene.add(sky);
  Object.entries(SKY_PARAMS).forEach(([k, v]) => (sky.material.uniforms[k].value = v));

  const sun = new THREE.DirectionalLight(0xffd2a0, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 320 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const hemi = new THREE.HemisphereLight(0xffe3c4, 0x7a4e36, 0.6);
  scene.add(hemi);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const sunDir = new THREE.Vector3();
  let envRT: THREE.WebGLRenderTarget | undefined;

  function setTime(name: TimeName): number {
    const t = TIMES[name];
    sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - t.elev), THREE.MathUtils.degToRad(t.az));
    sky.material.uniforms.sunPosition.value.copy(sunDir);
    sun.color.set(t.sun);
    sun.intensity = t.si;
    hemi.intensity = t.hemi;
    scene.fog = new THREE.FogExp2(t.fog, t.dens);
    renderer.toneMappingExposure = t.exp;
    // image-based light from this sky, so every surface picks up its colour
    const envScene = new THREE.Scene();
    const s2 = new Sky();
    s2.scale.setScalar(4500);
    s2.material.uniforms.sunPosition.value.copy(sunDir);
    Object.entries(SKY_PARAMS).forEach(([k, v]) => (s2.material.uniforms[k].value = v));
    envScene.add(s2);
    envRT?.dispose();
    envRT = pmrem.fromScene(envScene);
    scene.environment = envRT.texture;
    s2.geometry.dispose();
    s2.material.dispose();
    return t.lamps;
  }

  // keep the shadow box around the player
  function followShadow(target: THREE.Vector3) {
    sun.position.copy(target).addScaledVector(sunDir, 120);
    sun.target.position.copy(target);
  }

  return { setTime, followShadow, sunDir };
}
