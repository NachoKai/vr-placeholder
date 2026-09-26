'use client'

import { Handle, HandleTarget } from '@react-three/handle'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

type Shape = 'cube' | 'sphere' | 'cylinder'

type Props = {
  shape: Shape
  color: string
  position: [number, number, number]
}

export function GrabbableObject({ shape, color, position }: Props) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const targetRef = useRef<any>(null)
  const handleRef = useRef<any>(null)
  const wasGrabbed = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0, z: 0 })

  useFrame((_, delta) => {
    const body = bodyRef.current
    const target = targetRef.current
    const handle = handleRef.current
    if (!body || !target || !handle || !delta) return

    const grabbed = handle.capturedObjects?.size > 0
    const elements = target.matrixWorld.elements
    const position = { x: elements[12], y: elements[13], z: elements[14] }

    if (grabbed) {
      body.setBodyType('kinematicPositionBased' as any, true)
      body.setNextKinematicTranslation(position)
      lastPosition.current = position
    } else if (wasGrabbed.current) {
      body.setBodyType('dynamic' as any, true)
      body.setLinvel({
        x: (position.x - lastPosition.current.x) / delta,
        y: (position.y - lastPosition.current.y) / delta,
        z: (position.z - lastPosition.current.z) / delta,
      }, true)
    }

    wasGrabbed.current = grabbed
  })

  return (
    <RigidBody ref={bodyRef} colliders={shape === 'sphere' ? 'ball' : 'hull'} position={position} mass={0.25} friction={0.7} restitution={0.2} linearDamping={0.05} angularDamping={0.05}>
      <HandleTarget targetRef={targetRef}>
        <group ref={targetRef}>
          <Handle targetRef="from-context" translate rotate scale={false}>
            <mesh castShadow receiveShadow>
              {shape === 'cube' && <boxGeometry args={[0.1, 0.1, 0.1]} />}
              {shape === 'sphere' && <sphereGeometry args={[0.06, 24, 16]} />}
              {shape === 'cylinder' && <cylinderGeometry args={[0.05, 0.05, 0.12, 24]} />}
              <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
            </mesh>
          </Handle>
        </group>
      </HandleTarget>
    </RigidBody>
  )
}
