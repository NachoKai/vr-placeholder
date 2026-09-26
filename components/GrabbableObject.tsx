'use client'

import { Handle, HandleTarget, type HandleStore } from '@react-three/handle'
import { RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Quaternion, Vector3, type Group } from 'three'

type Shape = 'cube' | 'sphere' | 'cylinder'

type Props = {
  shape: Shape
  color: string
  position: [number, number, number]
}

// Objects collide with the table and floor, but not with other objects.
const COLLISION_GROUPS = 0x0001 | (0x0006 << 16)

// The handle target carries the drag and the rigid body chases it, so a release
// inherits the motion of the last grabbed frames. Cap it so a single bad frame
// delta cannot launch an object across the room.
const MAX_RELEASE_SPEED = 6
const MAX_RELEASE_SPIN = 12
const RELEASE_SMOOTHING = 0.5

function clampMagnitude(vector: Vector3, max: number) {
  const length = vector.length()
  if (length > max) vector.multiplyScalar(max / length)
}

export function GrabbableObject({ shape, color, position }: Props) {
  const { rapier } = useRapier()
  const bodyRef = useRef<RapierRigidBody>(null)
  const targetRef = useRef<Group>(null)
  const handleRef = useRef<HandleStore<unknown>>(null)
  const wasGrabbed = useRef(false)

  // World pose of the visual as of the last grabbed frame. The handle keeps its
  // drag offset on the target, so this is what the collider has to be moved to.
  const heldPosition = useRef(new Vector3())
  const heldRotation = useRef(new Quaternion())
  const previousPosition = useRef(new Vector3())
  const previousRotation = useRef(new Quaternion())
  const releaseSpeed = useRef(new Vector3())
  const releaseSpin = useRef(new Vector3())
  const sampleSpeed = useRef(new Vector3())
  const sampleSpin = useRef(new Vector3())
  const rotationDelta = useRef(new Quaternion())

  useFrame((_, delta) => {
    const body = bodyRef.current
    const target = targetRef.current
    const handle = handleRef.current
    if (!body || !target || !handle || delta <= 0) return

    const grabbed = (handle.capturedObjects?.size ?? 0) > 0

    if (grabbed) {
      target.getWorldPosition(heldPosition.current)
      target.getWorldQuaternion(heldRotation.current)

      if (wasGrabbed.current) {
        sampleSpeed.current.copy(heldPosition.current).sub(previousPosition.current).multiplyScalar(1 / delta)
        releaseSpeed.current.lerp(sampleSpeed.current, RELEASE_SMOOTHING)

        // World-space rotation over the last frame, turned into axis * angle.
        rotationDelta.current.copy(previousRotation.current).invert().premultiply(heldRotation.current)
        if (rotationDelta.current.w < 0) {
          rotationDelta.current.set(
            -rotationDelta.current.x,
            -rotationDelta.current.y,
            -rotationDelta.current.z,
            -rotationDelta.current.w,
          )
        }
        const sinHalfAngle = Math.hypot(rotationDelta.current.x, rotationDelta.current.y, rotationDelta.current.z)
        if (sinHalfAngle > 1e-6) {
          const scale = (2 * Math.atan2(sinHalfAngle, rotationDelta.current.w)) / (sinHalfAngle * delta)
          sampleSpin.current
            .set(rotationDelta.current.x, rotationDelta.current.y, rotationDelta.current.z)
            .multiplyScalar(scale)
          releaseSpin.current.lerp(sampleSpin.current, RELEASE_SMOOTHING)
        }
      }

      previousPosition.current.copy(heldPosition.current)
      previousRotation.current.copy(heldRotation.current)

      if (!wasGrabbed.current) {
        body.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true)
      }
      body.setNextKinematicTranslation(heldPosition.current)
      body.setNextKinematicRotation(heldRotation.current)
    } else if (wasGrabbed.current) {
      // Hand the visual transform back to the collider and clear the handle
      // offset, otherwise the mesh stays detached from its own collider.
      body.setTranslation(heldPosition.current, true)
      body.setRotation(heldRotation.current, true)
      target.position.set(0, 0, 0)
      target.quaternion.identity()
      target.scale.set(1, 1, 1)

      clampMagnitude(releaseSpeed.current, MAX_RELEASE_SPEED)
      clampMagnitude(releaseSpin.current, MAX_RELEASE_SPIN)

      body.setBodyType(rapier.RigidBodyType.Dynamic, true)
      body.setLinvel(releaseSpeed.current, true)
      body.setAngvel(releaseSpin.current, true)
      body.wakeUp()

      releaseSpeed.current.set(0, 0, 0)
      releaseSpin.current.set(0, 0, 0)
    }

    wasGrabbed.current = grabbed
    // Priority -1 keeps this after the handle updates the target (also -1, but
    // registered by a child first) and before Rapier steps, so the collider
    // tracks the visual within the same frame instead of a frame behind.
  }, -1)

  return (
    <RigidBody ref={bodyRef} colliders={shape === 'sphere' ? 'ball' : 'hull'} position={position} mass={0.25} friction={0.7} restitution={0.2} linearDamping={0.05} angularDamping={0.05} collisionGroups={COLLISION_GROUPS}>
      <HandleTarget targetRef={targetRef}>
        <group ref={targetRef}>
          <Handle ref={handleRef} targetRef="from-context" translate rotate scale={false}>
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
