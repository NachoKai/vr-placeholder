'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { createXRStore, XR } from '@react-three/xr'
import { useEffect, useMemo, useState } from 'react'
import { Floor } from './Floor'
import { Table } from './Table'
import { GrabbableObject } from './GrabbableObject'

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

  useEffect(() => {
    setCanEnterVR(typeof navigator !== 'undefined' && 'xr' in navigator)
  }, [])

  return (
    <main className="xr-app">
      <Canvas shadows camera={{ position: [0, 1.55, 1.1], fov: 65 }}>
        <XR store={store}>
          <Scene />
        </XR>
      </Canvas>
      <div className="xr-controls">
        {canEnterVR ? (
          <button type="button" onClick={() => store.enterVR()}>
            Enter VR
          </button>
        ) : (
          <p>WebXR is unavailable in this browser. Open this page in Meta Quest Browser to enter VR.</p>
        )}
      </div>
      {/* Testing: run the dev server with --host, open its local network URL in Meta/Oculus Browser on Quest 2, then tap Enter VR. */}
    </main>
  )
}
