import { useEffect, useRef, useState } from 'react'

import ElasticMesh from './ElasticMesh'
import IdentityBlock from './IdentityBlock'
import InteractiveIconCloud from './InteractiveIconCloud'
import Lanyard from './Lanyard'
import ScrollReveal from './ScrollReveal'
import './IdentityBlock.css'

const FRAME_PATH = '/frames/ezgif-frame-'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const cursorRevealRef = useRef<HTMLDivElement>(null)
  const [revealActive, setRevealActive] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    let targetFrame = 0
    let displayedFrame = 0
    let animationFrame = 0
    let resizeFrame = 0
    let disposed = false
    let frameCount = 0
    let frames: HTMLImageElement[] = []

    const drawFrame = (frameIndex: number) => {
      const image = frames[frameIndex]
      if (!image) return
      if (!image.complete || image.naturalWidth === 0) return

      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const scale = Math.min(
        width / image.naturalWidth,
        height / image.naturalHeight,
      ) * 0.9
      const drawWidth = image.naturalWidth * scale
      const drawHeight = image.naturalHeight * scale
      const imageX = (width - drawWidth) / 2
      const imageY = height - drawHeight
      const leftGap = imageX
      const rightGap = width - imageX - drawWidth
      context.clearRect(0, 0, width, height)
      if (leftGap > 0) {
        context.save()
        context.beginPath()
        context.rect(0, 0, leftGap, height)
        context.clip()
        context.translate(imageX, 0)
        context.scale(-1, 1)
        context.drawImage(image, 0, imageY, drawWidth, drawHeight)
        context.restore()
      }

      if (rightGap > 0) {
        context.save()
        context.beginPath()
        context.rect(imageX + drawWidth, 0, rightGap, height)
        context.clip()
        context.translate(imageX + drawWidth, 0)
        context.scale(-1, 1)
        context.drawImage(image, -drawWidth, imageY, drawWidth, drawHeight)
        context.restore()
      }

      if (imageY > 0) {
        context.save()
        context.beginPath()
        context.rect(0, 0, width, imageY)
        context.clip()
        context.translate(0, imageY * 2)
        context.scale(1, -1)
        context.drawImage(image, 0, imageY, image.naturalWidth, image.naturalHeight, 0, imageY, width, drawHeight)
        context.restore()
      }

      const bottomGap = height - imageY - drawHeight
      if (bottomGap > 0) {
        context.save()
        context.beginPath()
        context.rect(0, imageY + drawHeight, width, bottomGap)
        context.clip()
        const bottomTop = imageY + drawHeight
        context.translate(0, bottomTop + bottomGap)
        context.scale(1, -1)
        context.drawImage(
          image,
          0,
          0,
          image.naturalWidth,
          image.naturalHeight,
          0,
          0,
          width,
          bottomGap,
        )
        context.restore()
      }

      context.drawImage(image, imageX, imageY, drawWidth, drawHeight)
    }

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      const viewportWidth = document.documentElement.clientWidth
      const viewportHeight = window.innerHeight
      canvas.width = Math.floor(viewportWidth * pixelRatio)
      canvas.height = Math.floor(window.innerHeight * pixelRatio)
      canvas.style.width = `${viewportWidth}px`
      canvas.style.height = `${viewportHeight}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      drawFrame(Math.round(displayedFrame))
    }

    const updateTargetFrame = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0
      targetFrame = Math.min(frameCount - 1, Math.max(0, progress * (frameCount - 1)))
    }

    const animate = () => {
      displayedFrame += (targetFrame - displayedFrame) * 0.14
      const frameIndex = Math.round(displayedFrame)
      drawFrame(frameIndex)
      animationFrame = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(resizeCanvas)
    }

    const loadFrames = async () => {
      const response = await fetch('/frames/manifest.json')
      if (!response.ok) throw new Error('Unable to load animation frame manifest')

      const manifest: { frameCount: number } = await response.json()
      frameCount = manifest.frameCount
      frames = Array.from({ length: frameCount }, (_, index) => {
        const image = new Image()
        image.src = `${FRAME_PATH}${String(index + 1).padStart(3, '0')}.jpg`
        image.onload = () => drawFrame(Math.round(displayedFrame))
        return image
      })

      if (disposed) return
      resizeCanvas()
      updateTargetFrame()
      window.addEventListener('scroll', updateTargetFrame, { passive: true })
      window.addEventListener('resize', handleResize)
      animationFrame = requestAnimationFrame(animate)
    }

    void loadFrames()

    return () => {
      cancelAnimationFrame(animationFrame)
      cancelAnimationFrame(resizeFrame)
      window.removeEventListener('scroll', updateTargetFrame)
      window.removeEventListener('resize', handleResize)
      frames.forEach((image) => {
        image.onload = null
      })
    }
  }, [])

  useEffect(() => {
    const main = mainRef.current
    const reveal = cursorRevealRef.current
    if (!main || !reveal) return

    let frame = 0
    let pointerX = 0
    let pointerY = 0
    let targetX = 0
    let targetY = 0
    let active = false

    const render = () => {
      pointerX += (targetX - pointerX) * 0.14
      pointerY += (targetY - pointerY) * 0.14
      reveal.style.setProperty('--cursor-x', `${pointerX}px`)
      reveal.style.setProperty('--cursor-y', `${pointerY}px`)
      frame = requestAnimationFrame(render)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (window.scrollY > window.innerHeight * 0.08) return
      targetX = event.clientX
      targetY = event.clientY
      if (!active) {
        pointerX = targetX
        pointerY = targetY
        active = true
        reveal.classList.add('is-active')
        setRevealActive(true)
      }
    }

    const handlePointerLeave = () => {
      active = false
      reveal.classList.remove('is-active')
      setRevealActive(false)
    }

    const handleScroll = () => {
      const isHeroVisible = window.scrollY <= window.innerHeight * 0.08
      reveal.classList.toggle('is-active', active && isHeroVisible)
      setRevealActive(active && isHeroVisible)
    }

    main.addEventListener('pointermove', handlePointerMove)
    main.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      main.removeEventListener('pointermove', handlePointerMove)
      main.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <>
      <nav className="squishy-navbar" aria-label="Main navigation">
        <a className="squishy-navbar__brand" href="#" aria-label="Abdelli Brahim home">
          <span className="squishy-navbar__brand-mark">A</span>
          <span>ABDELLI</span>
        </a>
        <div className="squishy-navbar__links">
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#contact">Contact</a>
        </div>
        <a className="squishy-navbar__cta" href="#contact">
          <span className="squishy-navbar__status-dot" aria-hidden="true" />
          Let&apos;s talk
        </a>
      </nav>
      <main ref={mainRef} className="scroll-scene relative min-h-[500vh] bg-black">
      <canvas
        ref={canvasRef}
        aria-label="Scroll-controlled animation"
        className="scroll-animation block h-screen w-full object-contain"
      />
      <div ref={cursorRevealRef} className="cursor-reveal" aria-hidden="true" />
      <div className="hero-mesh hero-mesh--left">
        <ElasticMesh
          text="Software"
          color="#3b5bff"
          inflate={1}
          stiffness={0.5}
          wobble={0.6}
          theme="dark"
          aria-label="Software"
        />
        <IdentityBlock revealActive={revealActive} />
        <div className="ai-pendulum" aria-label="Artificial Intelligence">
          <span className="ai-pendulum__thread" aria-hidden="true" />
          <div className="ai-pendulum__label">
            <ElasticMesh
              text="AI"
              color="#3b5bff"
              inflate={1}
              stiffness={0.5}
              wobble={0.6}
              theme="dark"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      <div className="hero-mesh hero-mesh--right">
        <div className="engineer-title">
          <ElasticMesh
            text="Engineer"
            color="#3b5bff"
            inflate={1}
            stiffness={0.5}
            wobble={0.6}
            theme="dark"
            aria-label="Engineer"
          />
          <InteractiveIconCloud />
          <div className={`stack-status${revealActive ? ' is-revealed' : ''}`} aria-label="Professional status">
            <span className="stack-status__rule" aria-hidden="true" />
            <span className="stack-status__domains">FULLSTACK · AI · CLOUD</span>
            <span className="stack-status__availability">
              <span className="stack-status__dot" aria-hidden="true" />
              Available for work
            </span>
          </div>
        </div>
      </div>
      <div className="engineer-lanyard" aria-label="Interactive hanging card">
        <Lanyard
          frontImage="/portrait-brahim.png"
          cardColor="#11162d"
          orientation="portrait"
          finish="glossy"
          cornerRadius={0.3}
          size={0.504}
          anchor="left"
          strapLength={0.5}
          strapColor="#111827"
          strapWidth={0.55}
          metal="silver"
          gravity={1}
          damping={0.5}
          elasticity={0.5}
          breeze={0.5}
          interactive
          intro
        />
      </div>
      </main>
      <section id="about" className="about-section" aria-label="About">
        <ScrollReveal
          containerClassName="about-section__reveal"
          textClassName="about-section__text"
          highlightColor="#3b82f6"
          mode="scrub"
          splitBy="chars"
          effect="flip"
          stagger={0.012}
          duration={0.8}
          smoothing={0.3}
          baseOpacity={0}
          baseRotation={0}
          baseOffset={0}
          enableBlur={false}
          blurStrength={4}
          wordAnimationEnd="bottom 20%"
        >
          From responsive frontends and model training pipelines to backend architectures and cloud infrastructure, my 360° view of the software lifecycle enables me to design intelligent, end-to-end ecosystems. Versatile by nature and rigorous in my approach, I transform raw data into scalable, robust, and maintainable applications.
        </ScrollReveal>
      </section>
    </>
  )
}

export default App
