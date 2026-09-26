'use client'

import { RigidBody } from '@react-three/rapier'

export function Table() {
  const legPositions: [number, number, number][] = [
    [-0.5, 0.375, -0.22],
    [0.5, 0.375, -0.22],
    [-0.5, 0.375, 0.22],
    [0.5, 0.375, 0.22],
  ]

  return (
    <group position={[0, 0, -2]}>
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.75, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.03, 0.6]} />
          <meshStandardMaterial color="#8b5a3c" roughness={0.75} />
        </mesh>
      </RigidBody>
      {legPositions.map((position) => (
        <RigidBody key={position.join(',')} type="fixed" colliders="cuboid" position={position}>
          <mesh castShadow>
            <boxGeometry args={[0.07, 0.75, 0.07]} />
            <meshStandardMaterial color="#5b3928" roughness={0.8} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  )
}
