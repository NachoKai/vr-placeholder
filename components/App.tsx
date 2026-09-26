'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { createXRStore, XR, XROrigin, useXRInputSourceState } from '@react-three/xr'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Vector3, type Group } from 'three'
import { Floor } from './Floor'
import { Table } from './Table'
import { GrabbableObject } from './GrabbableObject'

function Locomotion() {
  const originRef = useRef<Group>(null)
  const leftController = useXRInputSourceState('controller', 'left')
  const rightController = useXRInputSourceState('controller', 'right')
  const { camera } = useThree()
  const verticalVelocity = useRef(0)
  const wasJumpPressed = useRef(false)

  useFrame((_, delta) => {
    const origin = originRef.current
    if (!origin) return

    const leftThumbstick = leftController?.gamepad?.['xr-standard-thumbstick']
    const rightGamepad = rightController?.gamepad
    const xAxis = leftThumbstick?.xAxis ?? 0
    const yAxis = leftThumbstick?.yAxis ?? 0
    const jumpPressed = rightGamepad?.['a-button']?.state === 'pressed' || rightGamepad?.['b-button']?.state === 'pressed'
    const grounded = origin.position.y <= 0.001

    if (jumpPressed && !wasJumpPressed.current && grounded) {
      verticalVelocity.current = 3.2
    }
    wasJumpPressed.current = jumpPressed
    verticalVelocity.current -= 9.81 * delta
    origin.position.y = Math.max(0, origin.position.y + verticalVelocity.current * delta)
    if (origin.position.y === 0) verticalVelocity.current = 0

    const magnitude = Math.min(1, Math.hypot(xAxis, yAxis))
    if (magnitude < 0.08) return

    const forward = camera.getWorldDirection(new Vector3())
    forward.y = 0
    forward.normalize()
    const right = new Vector3(-forward.z, 0, forward.x)
    const speed = 1.4 * delta
    origin.position.addScaledVector(right, xAxis * speed)
    origin.position.addScaledVector(forward, -yAxis * speed)
  })

  return <XROrigin ref={originRef} />
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#b9c6d1']} />
      <ambientLight intensity={1.4} />
      <directionalLight castShadow position={[3, 5, 2]} intensity={2.2} shadow-mapSize={[1024, 1024]} />
      <Physics gravity={[0, -9.81, 0]}>
        <Floor />
        <Table />
        <GrabbableObject shape="cube" color="#e76f51" position={[-0.27, 0.86, -2]} />
        <GrabbableObject shape="sphere" color="#2a9d8f" position={[0, 0.87, -2]} />
        <GrabbableObject shape="cylinder" color="#e9c46a" position={[0.28, 0.88, -2]} />
      </Physics>
      <OrbitControls target={[0, 0.7, -2]} maxPolarAngle={Math.PI / 2 - 0.05} />
    </>
  )
}

export function App() {
  const store = useMemo(() => createXRStore(), [])
  const [canEnterVR, setCanEnterVR] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)
  const [vrError, setVrError] = useState<string | null>(null)

  const enterVR = async () => {
    if (!canvasReady || !canEnterVR) return

    try {
      setVrError(null)
      await store.enterVR()
    } catch {
      setVrError('VR could not start. Use a WebXR-compatible browser and try again.')
    }
  }

  useEffect(() => {
    setCanEnterVR(typeof navigator !== 'undefined' && 'xr' in navigator)

    const canvas = document.createElement('canvas')
    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null

    try {
      context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    } catch {
      context = null
    }

    setHasWebGL(Boolean(context))
  }, [])

  return (
    <main className="xr-app">
      {hasWebGL === false ? (
        <div className="xr-fallback" role="alert">
          <div>
            <strong>3D preview unavailable</strong>
            <p>WebGL is disabled in this browser preview. Open the page in a hardware-accelerated browser or Meta Quest Browser to view the XR scene.</p>
          </div>
        </div>
      ) : hasWebGL === true ? (
        <Canvas
          shadows
          camera={{ position: [0, 1.55, 1.1], fov: 65 }}
          onCreated={() => setCanvasReady(true)}
        >
          <XR store={store}>
            <Locomotion />
            <Scene />
          </XR>
        </Canvas>
      ) : null}
      <div className="xr-controls">
        {canEnterVR ? (
          <>
            <button type="button" onClick={enterVR} disabled={!canvasReady}>
              {canvasReady ? 'Enter VR' : 'Loading 3D scene…'}
            </button>
            {vrError ? <p role="alert">{vrError}</p> : null}
          </>
        ) : (
          <p>WebXR is unavailable in this browser. Open this page in Meta Quest Browser to enter VR.</p>
        )}
      </div>
      {/* Testing: run the dev server with --host, open its local network URL in Meta/Oculus Browser on Quest 2, then tap Enter VR. */}
    </main>
  )
}
