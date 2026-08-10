import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

const strip = (word) => word.replace(/[^0-9A-Za-z.%-]/g, '')

/*
 * Word-by-word opacity scrub. Words start near-invisible and resolve as the
 * reader scrolls the block through the viewport.
 */
export default function ScrubText({ text, className = '', accent = [] }) {
  const root = useRef(null)

  useGSAP(
    () => {
      const words = root.current.querySelectorAll('[data-word]')
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(words, { opacity: 1 })
        return
      }
      gsap.fromTo(
        words,
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.5,
          scrollTrigger: {
            trigger: root.current,
            start: 'top 78%',
            end: 'bottom 55%',
            scrub: 0.6,
          },
        },
      )
    },
    { scope: root },
  )

  return (
    <p ref={root} className={className}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`}>
          <span data-word className={`inline-block ${accent.includes(strip(word)) ? 'text-lift' : ''}`}>
            {word}
          </span>{' '}
        </span>
      ))}
    </p>
  )
}
