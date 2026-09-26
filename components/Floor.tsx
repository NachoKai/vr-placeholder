'use client'

import { RigidBody } from '@react-three/rapier'

export function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[0, -0.05, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[10, 0.1, 10]} />
        <meshStandardMaterial color="#777b80" roughness={0.9} />
      </mesh>
      <gridHelper args={[10, 20, '#9ca3af', '#6b7280']} position={[0, 0.01, 0]} />
    </RigidBody>
  )
}
