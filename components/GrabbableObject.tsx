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
  const targetPosition = useRef({ x: 0, y: 0, z: 0 })

  // Objects collide with the table and floor, but not with other objects.
  const collisionGroups = 0x0001 | (0x0006 << 16)

  useFrame((_, delta) => {
    const body = bodyRef.current
    const target = targetRef.current
    const handle = handleRef.current
    if (!body || !target || !handle || !delta) return

    const grabbed = (handle.capturedObjects?.size ?? 0) > 0
    target.getWorldPosition(targetPosition.current)
    const position = targetPosition.current

    if (grabbed) {
      if (!wasGrabbed.current) {
        body.setBodyType('kinematicPositionBased' as any, true)
        body.wakeUp()
      }
      body.setNextKinematicTranslation(position)
      lastPosition.current = { x: position.x, y: position.y, z: position.z }
    } else if (wasGrabbed.current) {
      body.setBodyType('dynamic' as any, true)
      body.setLinvel({
        x: (position.x - lastPosition.current.x) / delta,
        y: (position.y - lastPosition.current.y) / delta,
        z: (position.z - lastPosition.current.z) / delta,
      }, true)
      body.wakeUp()
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
