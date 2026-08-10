import { useEffect } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

import Nav from './components/Nav'
import Hero from './sections/Hero'
import Finding from './sections/Finding'
import Data from './sections/Data'
import Evidence from './sections/Evidence'
import Model from './sections/Model'
import Shipped from './sections/Shipped'
import Honesty from './sections/Honesty'
import Action from './sections/Action'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function App() {
  useEffect(() => {
    // Chart plates are lazily decoded SVGs. Pin distances computed before they
    // have height would be wrong, so recompute once everything has settled.
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    const timers = [400, 1200, 2400].map((ms) => window.setTimeout(refresh, ms))
    return () => {
      window.removeEventListener('load', refresh)
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return (
    <>
      <Nav />
      {/* overflow-x-clip, not hidden: hidden would create a scroll container and
          break the pinned rail in the evidence section. */}
      <main className="w-full max-w-full overflow-x-clip">
        <Hero />
        <Finding />
        <Data />
        <Evidence />
        <Model />
        <Shipped />
        <Honesty />
        <Action />
      </main>
    </>
  )
}
