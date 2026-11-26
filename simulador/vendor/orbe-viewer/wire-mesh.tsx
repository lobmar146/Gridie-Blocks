// Adapted from maker-sandbox (MIT, Copyright 2026 Alwurts).
import { useEffect, useMemo } from "react";
import { BackSide, BoxGeometry, CatmullRomCurve3, MeshStandardMaterial, Quaternion, TubeGeometry, Vector3 } from "three";
import type { DrawnWire } from "./build";
import { along, HOUSING_MM, INSERT_MM, WIRE_RADIUS_MM, type WireEnd } from "./wire-geometry";

const HOUSING_WIDTH_MM = 2.5;
const housingGeometry = new BoxGeometry(HOUSING_WIDTH_MM, HOUSING_MM, HOUSING_WIDTH_MM);
const housingMaterial = new MeshStandardMaterial({ color: "#161616", roughness: 0.55, metalness: 0 });
housingMaterial.shadowSide = BackSide;
const Y = new Vector3(0, 1, 0);

/** A female housing over the lead's tip. */
function Housing({ end }: { end: WireEnd }) {
  const turn = useMemo(() => new Quaternion().setFromUnitVectors(Y, new Vector3(...end.axis)), [end]);
  return (
    <mesh
      castShadow
      geometry={housingGeometry}
      material={housingMaterial}
      position={along(end.at, end.axis, HOUSING_MM / 2 - INSERT_MM)}
      quaternion={turn}
      receiveShadow
    />
  );
}

export function WireMesh({ wire }: { wire: DrawnWire }) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(wire.path.points.map((point) => new Vector3(...point)));
    curve.curveType = "centripetal";
    return new TubeGeometry(curve, Math.max(wire.path.points.length * 2, 8), WIRE_RADIUS_MM, 8, false);
  }, [wire]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <mesh castShadow geometry={geometry} receiveShadow>
        {/* Insulation. A wire is plastic, and its colour is the insulation's. */}
        <meshStandardMaterial color={wire.colour} metalness={0} roughness={0.38} shadowSide={BackSide} />
      </mesh>
      <Housing end={wire.path.ends[0]} />
      <Housing end={wire.path.ends[1]} />
    </group>
  );
}
