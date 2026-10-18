import React, { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, SRGBColorSpace, TextureLoader } from "three";

export const DEFAULT_CHARACTER_IMAGE = "/tabletop/personagem-exemplo.png";

// Upright billboards rotate around Y, keeping their feet on the floor.
export default function TabletopCharacter({ person, position, selected, onSelect, onPosition, image, height = 1.9, flipped = false }) {
  const root = useRef();
  const portrait = useRef();
  const [asset, setAsset] = useState(null);
  useEffect(() => {
    let cancelled = false;
    let texture;
    const loader = new TextureLoader();
    function load(url, fallback = false) {
      loader.load(url, loaded => {
        if (cancelled) { loaded.dispose(); return; }
        texture = loaded;
        loaded.colorSpace = SRGBColorSpace;
        const canvas = document.createElement("canvas");
        canvas.width = loaded.image.width;
        canvas.height = loaded.image.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(loaded.image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        setAsset({ texture: loaded, ratio: canvas.width / canvas.height, pixels });
      }, undefined, () => {
        if (!cancelled && !fallback) load(DEFAULT_CHARACTER_IMAGE, true);
      });
    }
    setAsset(null);
    load(image || DEFAULT_CHARACTER_IMAGE);
    return () => { cancelled = true; texture?.dispose(); };
  }, [image]);

  useFrame(({ camera }, delta) => {
    const target = root.current;
    const factor = Math.min(1, delta * 6);
    target.position.x += (position[0] - target.position.x) * factor;
    target.position.z += (position[1] - target.position.z) * factor;
    if (portrait.current) portrait.current.rotation.y = Math.atan2(camera.position.x - target.position.x, camera.position.z - target.position.z);
    onPosition([target.position.x, target.position.z]);
  });

  function select(e) {
    if (e.delta > 5) return;
    e.stopPropagation();
    onSelect();
  }
  function selectPortrait(e) {
    // Transparent margins must not capture clicks intended for the floor.
    if (asset && e.uv) {
      const { width, height: h, data } = asset.pixels;
      const x = Math.min(width - 1, Math.max(0, Math.floor(e.uv.x * width)));
      const y = Math.min(h - 1, Math.max(0, Math.floor((1 - e.uv.y) * h)));
      if (data[(y * width + x) * 4 + 3] < 32) return;
    }
    select(e);
  }
  return <group ref={root} position={[person.start[0], 0, person.start[1]]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
      <circleGeometry args={[0.28, 32]} /><meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} onClick={select}>
      <ringGeometry args={[0.29, 0.34, 40]} /><meshBasicMaterial color={selected ? "#eec77e" : person.color} />
    </mesh>
    <group ref={portrait}>
      {asset && <mesh position={[0, height / 2 - 0.025, 0]} scale={[flipped ? -1 : 1, 1, 1]} onClick={selectPortrait}>
        <planeGeometry args={[height * asset.ratio, height]} />
        <meshStandardMaterial map={asset.texture} transparent alphaTest={0.12} side={DoubleSide} roughness={1} metalness={0} />
      </mesh>}
    </group>
  </group>;
}
