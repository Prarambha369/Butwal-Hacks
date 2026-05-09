"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const width = container.clientWidth
    const height = container.clientHeight
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 50
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0.1)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create particles
    const particleCount = 500
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200
      positions[i + 1] = (Math.random() - 0.5) * 200
      positions[i + 2] = (Math.random() - 0.5) * 200

      velocities[i] = (Math.random() - 0.5) * 0.5
      velocities[i + 1] = (Math.random() - 0.5) * 0.5
      velocities[i + 2] = (Math.random() - 0.5) * 0.5
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3))

    const material = new THREE.PointsMaterial({
      color: 0xff6b5b,
      size: 0.7,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)
    particlesRef.current = particles

    // Handle window resize
    const handleResize = () => {
      const newWidth = container?.clientWidth || width
      const newHeight = container?.clientHeight || height

      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener("resize", handleResize)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      if (particlesRef.current) {
        particlesRef.current.rotation.x += 0.0001
        particlesRef.current.rotation.y += 0.0002

        const positionAttribute = geometry.getAttribute("position")
        const velocityAttribute = geometry.getAttribute("velocity")
        const positions = positionAttribute.array as Float32Array
        const velocities = velocityAttribute.array as Float32Array

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i]
          positions[i + 1] += velocities[i + 1]
          positions[i + 2] += velocities[i + 2]

          // Wrap around
          if (positions[i] > 100) positions[i] = -100
          if (positions[i] < -100) positions[i] = 100
          if (positions[i + 1] > 100) positions[i + 1] = -100
          if (positions[i + 1] < -100) positions[i + 1] = 100
        }

        positionAttribute.needsUpdate = true
      }

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 z-0" style={{ pointerEvents: "none" }} />
  )
}

