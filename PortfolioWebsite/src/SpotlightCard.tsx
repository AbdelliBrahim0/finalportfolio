import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react'

import './SpotlightCard.css'

type SpotlightShape = 'circle' | 'beam'

type SpotlightCardProps = HTMLAttributes<HTMLDivElement> & {
  spotlightColor?: string
  intensity?: number
  spotlightSize?: number
  softness?: number
  shape?: SpotlightShape
  borderGlow?: number
  proximity?: number
  smoothing?: number
  ambient?: boolean
  flare?: boolean
  grain?: number
  theme?: 'dark' | 'light'
}

type Palette = {
  surface: string
  border: string
  shadow: string
  light: string
  fill: number
  edge: number
}

type Settings = {
  shape: SpotlightShape
  fill: string
  edge: string
  size: number
  intensity: number
  borderGlow: number
  proximity: number
  smoothing: number
  ambient: boolean
  flare: boolean
  grain: number
}

const THEMES: Record<'dark' | 'light', Palette> = {
  dark: {
    surface: '#111111',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: '0 24px 48px -24px rgba(0, 0, 0, 0.6)',
    light: '#ffffff',
    fill: 1,
    edge: 1,
  },
  light: {
    surface: '#ffffff',
    border: 'rgba(24, 24, 27, 0.1)',
    shadow: '0 1px 2px rgba(24, 24, 27, 0.04), 0 18px 40px -20px rgba(24, 24, 27, 0.16)',
    light: '#18181b',
    fill: 0.28,
    edge: 0.7,
  },
}

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const falloff = (color: string, softness: number) => {
  const soft = clamp(softness, 0, 1)
  const core = (1 - soft) ** 1.5 * 0.85
  const stop = (alpha: number, at: number) =>
    `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(2)}%, transparent) ${(at * 100).toFixed(2)}%`
  const list = [stop(1, 0)]

  for (let index = 0; index <= 14; index += 1) {
    const position = core + ((1 - core) * index) / 14
    const gradientPosition = (position - core) / (1 - core)
    const smooth = 1 - gradientPosition ** 2 * (3 - 2 * gradientPosition)
    const glow =
      Math.exp(-4.6 * gradientPosition ** 2) *
      (1 - gradientPosition ** 6)
    list.push(stop(smooth + (glow - smooth) * soft, position))
  }

  return list.join(', ')
}

const SpotlightCard = ({
  children,
  className = '',
  style,
  spotlightColor,
  intensity = 0.15,
  spotlightSize = 240,
  softness = 0.7,
  shape = 'circle',
  borderGlow = 0.6,
  proximity = 80,
  smoothing = 0.3,
  ambient = false,
  flare = true,
  grain = 0,
  theme = 'dark',
  ...rest
}: SpotlightCardProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const lightRef = useRef<HTMLSpanElement>(null)
  const grainRef = useRef<HTMLSpanElement>(null)
  const edgeRef = useRef<HTMLSpanElement>(null)
  const palette = THEMES[theme]
  const color = spotlightColor ?? palette.light
  const settingsRef = useRef<Settings | null>(null)

  settingsRef.current = {
    shape,
    fill: falloff(color, softness),
    edge: falloff(color, 1),
    size: Math.max(20, spotlightSize),
    intensity: clamp(intensity, 0, 1) * palette.fill,
    borderGlow: clamp(borderGlow, 0, 1) * palette.edge,
    proximity: Math.max(0, proximity),
    smoothing: clamp(smoothing, 0, 1),
    ambient,
    flare,
    grain: clamp(grain, 0, 1),
  }

  useEffect(() => {
    const root = rootRef.current
    const light = lightRef.current
    const noise = grainRef.current
    const edge = edgeRef.current
    if (!root || !light || !noise || !edge) return

    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const state = {
      x: 0,
      y: 0,
      presence: 0,
      flare: 0,
      time: Math.random() * 60,
      pressed: false,
      visible: true,
    }
    const pointer = { x: 0, y: 0, active: false }
    let animationFrame = 0
    let lastTime = 0
    let alive = true

    const gradient = (
      settings: Settings,
      size: number,
      x: number,
      y: number,
      stops: string,
    ) => {
      if (settings.shape === 'beam') {
        const reach = Math.max(size * 0.6, y + size * 0.55)
        return `radial-gradient(${(size * 0.55).toFixed(1)}px ${reach.toFixed(1)}px at ${x.toFixed(1)}px 0px, ${stops})`
      }
      return `radial-gradient(circle ${size.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, ${stops})`
    }

    const paint = (settings: Settings) => {
      const size = settings.size * (1 + 0.2 * state.flare)
      const boost = 1 + 0.7 * state.flare
      light.style.background = gradient(
        settings,
        size,
        state.x,
        state.y,
        settings.fill,
      )
      edge.style.background = gradient(
        settings,
        size * 0.6,
        state.x,
        settings.shape === 'beam' ? 0 : state.y,
        settings.edge,
      )
      light.style.opacity = String(
        Math.min(1, state.presence * settings.intensity * boost),
      )
      edge.style.opacity = String(
        Math.min(1, state.presence * settings.borderGlow * boost),
      )
      const grainGradient =
        settings.grain > 0
          ? gradient(settings, size, state.x, state.y, '#000 0%, transparent 100%')
          : 'none'
      noise.style.webkitMaskImage = grainGradient
      noise.style.maskImage = grainGradient
      noise.style.opacity = String(state.presence * settings.grain)
    }

    const tick = (now: number) => {
      animationFrame = 0
      if (!alive) return
      const settings = settingsRef.current
      if (!settings) return

      const delta = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000))
      lastTime = now
      const rect = root.getBoundingClientRect()
      let targetX = state.x
      let targetY = state.y
      let targetPresence = 0

      if (pointer.active) {
        targetX = pointer.x - rect.left
        targetY = pointer.y - rect.top
        const gap = Math.hypot(
          Math.max(0, -targetX, targetX - rect.width),
          Math.max(0, -targetY, targetY - rect.height),
        )
        targetPresence =
          gap === 0
            ? 1
            : settings.proximity > 0
              ? Math.max(0, 1 - gap / settings.proximity) ** 2
              : 0
      }

      if (targetPresence < 0.6 && settings.ambient && state.visible) {
        if (!reduceMotion) state.time += delta
        targetX +=
          (rect.width * (0.5 + 0.34 * Math.sin(state.time * 0.43)) - targetX) *
          (0.6 - targetPresence) /
          0.6
        targetY +=
          (rect.height * (0.5 + 0.3 * Math.sin(state.time * 0.61 + 1.3)) - targetY) *
          (0.6 - targetPresence) /
          0.6
        targetPresence = 0.6
      }

      const follow =
        reduceMotion || settings.smoothing === 0
          ? 1
          : 1 - Math.exp(-delta / (0.015 + settings.smoothing * 0.22))
      state.x += (targetX - state.x) * follow
      state.y += (targetY - state.y) * follow
      const fade =
        reduceMotion
          ? 1
          : 1 - Math.exp(-delta / (targetPresence > state.presence ? 0.1 : 0.32))
      state.presence += (targetPresence - state.presence) * fade
      const targetFlare = state.pressed && settings.flare && !reduceMotion ? 1 : 0
      state.flare +=
        (targetFlare - state.flare) *
        (1 - Math.exp(-delta / (targetFlare ? 0.05 : 0.28)))
      paint(settings)

      const moving =
        Math.abs(targetX - state.x) > 0.1 || Math.abs(targetY - state.y) > 0.1
      if (
        moving ||
        Math.abs(targetPresence - state.presence) >= 0.002 ||
        Math.abs(targetFlare - state.flare) >= 0.002 ||
        (settings.ambient && state.visible && !reduceMotion)
      ) {
        animationFrame = requestAnimationFrame(tick)
      }
    }

    const wake = () => {
      if (!animationFrame && alive) {
        lastTime = performance.now()
        animationFrame = requestAnimationFrame(tick)
      }
    }
    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
      wake()
    }
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) {
        pointer.active = false
        wake()
      }
    }
    const onDown = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
      state.pressed = true
      wake()
    }
    const onUp = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') pointer.active = false
      state.pressed = false
      wake()
    }
    const observer = new IntersectionObserver((entries) => {
      state.visible = entries.some((entry) => entry.isIntersecting)
      if (state.visible) wake()
    })

    observer.observe(root)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    document.addEventListener('pointerout', onOut)
    root.addEventListener('pointerdown', onDown)
    wake()

    return () => {
      alive = false
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('pointerout', onOut)
      root.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className={`spotlight-card${className ? ` ${className}` : ''}`}
      style={
        {
          '--spotlight-card-surface': palette.surface,
          '--spotlight-card-border': palette.border,
          '--spotlight-card-shadow': palette.shadow,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      <span ref={lightRef} className="spotlight-card__light" aria-hidden="true" />
      <span
        ref={grainRef}
        className="spotlight-card__grain"
        style={{ backgroundImage: NOISE }}
        aria-hidden="true"
      />
      {children}
      <span className="spotlight-card__border" aria-hidden="true" />
      <span ref={edgeRef} className="spotlight-card__edge" aria-hidden="true" />
    </div>
  )
}

export default SpotlightCard
