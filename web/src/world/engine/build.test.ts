import { expect, it } from "vitest";
import * as THREE from "three";
import { put, mergeBuckets, tint } from "./build";

it("tint gives a geometry one vertex colour (for the shared vertex-coloured buckets)", () => {
  const g = tint(new THREE.BoxGeometry(1, 1, 1), 0xff0000);
  expect(g.index).toBeNull();
  const c = g.getAttribute("color");
  expect(c.count).toBe(g.getAttribute("position").count);
  expect([c.getX(5), c.getY(5), c.getZ(5)]).toEqual([1, 0, 0]);
});

it("a key@area bucket merges separately but uses the key's material and shadow rules", () => {
  const mat = new THREE.MeshStandardMaterial(), road = new THREE.MeshStandardMaterial();
  put("vc", new THREE.BoxGeometry(1, 1, 1), 0, 0, 0);
  put("vc@falls", new THREE.BoxGeometry(1, 1, 1), 400, 0, 0);
  put("road@falls", new THREE.PlaneGeometry(1, 1), 400, 0, 0);
  const scene = new THREE.Scene();
  mergeBuckets(scene, { vc: mat, road });
  const meshes = scene.children as THREE.Mesh[];
  expect(meshes).toHaveLength(3);
  expect(meshes.filter((m) => m.material === mat)).toHaveLength(2);
  expect(meshes.find((m) => m.material === road)!.castShadow).toBe(false);
});
