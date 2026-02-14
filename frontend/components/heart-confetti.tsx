"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface HeartParticle {
  id: number
  x: number
  delay: number
  size: number
  color: string
}

export function HeartConfetti({ show }: { show: boolean }) {
  const [particles, setParticles] = useState<HeartParticle[]>([])

  useEffect(() => {
    if (show) {
      const colors = ["#FF6B6B", "#FFE5E5", "#C73866", "#ffa3a3", "#ff9999"]
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: Math.random() * 16 + 8,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
      setParticles(newParticles)
    } else {
      setParticles([])
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
              animate={{
                y: "110vh",
                rotate: Math.random() > 0.5 ? 360 : -360,
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.5 + Math.random(),
                delay: p.delay,
                ease: "easeIn",
              }}
              className="absolute"
              style={{ left: `${p.x}%` }}
            >
              <svg
                width={p.size}
                height={p.size}
                viewBox="0 0 24 24"
                fill={p.color}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
