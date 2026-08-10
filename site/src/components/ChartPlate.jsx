/*
 * The generated SVGs are dark ink (#141414) on a transparent ground, so they
 * only read on a light plate. This component is the only place a chart is
 * mounted, which keeps that rule in one file.
 */
export default function ChartPlate({ src, alt, className = '', padded = true }) {
  return (
    <figure className={`plate group overflow-hidden ${padded ? 'p-5 md:p-7' : ''} ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.035]"
      />
    </figure>
  )
}
