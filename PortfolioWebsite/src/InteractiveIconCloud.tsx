import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import {
  Cloud,
  fetchSimpleIcons,
  renderSimpleIcon,
  type ICloud,
  type SimpleIcon,
} from 'react-icon-cloud'

import './InteractiveIconCloud.css'

const cloudProps: Omit<ICloud, 'children'> = {
  containerProps: {
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
  },
  options: {
    reverse: true,
    depth: 1,
    wheelZoom: false,
    imageScale: 2,
    activeCursor: 'default',
    tooltip: 'native',
    initial: [0.1, -0.1],
    clickToFront: 500,
    tooltipDelay: 0,
    outlineColour: '#0000',
    maxSpeed: 0.025,
    minSpeed: 0.012,
  },
}

const slugs = [
  'typescript',
  'javascript',
  'python',
  'react',
  'html5',
  'css3',
  'nodedotjs',
  'express',
  'nextdotjs',
  'postgresql',
  'mongodb',
  'tensorflow',
  'pytorch',
  'docker',
  'git',
  'github',
  'linux',
  'amazonaws',
  'figma',
  'visualstudiocode',
]

const renderCustomIcon = (icon: SimpleIcon) =>
  renderSimpleIcon({
    icon,
    bgHex: '#0b1026',
    fallbackHex: '#8eeaff',
    minContrastRatio: 1.4,
    size: 46,
    aProps: {
      href: undefined,
      target: undefined,
      rel: undefined,
      onClick: (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault(),
    },
  })

type IconData = Awaited<ReturnType<typeof fetchSimpleIcons>>

const InteractiveIconCloud = () => {
  const [data, setData] = useState<IconData | null>(null)

  useEffect(() => {
    let active = true
    fetchSimpleIcons({ slugs }).then((result) => {
      if (active) setData(result)
    })
    return () => {
      active = false
    }
  }, [])

  const renderedIcons = useMemo(
    () => (data ? Object.values(data.simpleIcons).map(renderCustomIcon) : null),
    [data],
  )

  return (
    <div className="interactive-icon-cloud" aria-label="Technology stack">
      <div className="interactive-icon-cloud__frame">
        {renderedIcons ? (
          <Cloud {...cloudProps}>{renderedIcons}</Cloud>
        ) : (
          <span className="interactive-icon-cloud__loading">STACK / LOADING</span>
        )}
      </div>
    </div>
  )
}

export default InteractiveIconCloud
