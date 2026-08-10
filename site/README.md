# site

A single-page write-up of the sales seasonality and forecasting analysis in the parent
repository. Vite + React + Tailwind CSS 3.4 + GSAP.

```bash
npm install
npm run dev      # local
npm run build    # -> dist/
```

`vite.config.js` sets `base: './'`, so `dist/` can be served from any path.

## Two rules this site is built around

**Every number comes from `src/data.js`.** That file is the only source of figures on the
page, and each figure in it comes from the re-verified output of `analysis/run_analysis.py`.
Nothing is rounded, abbreviated or re-derived in a component. If a figure is not in
`data.js`, it does not render.

**The charts are the real files.** `public/charts/*.svg` are copied verbatim from
`../charts/`, which the pipeline generates. They are dark ink (`#141414`) on a transparent
ground, so they only read on a light plate — `src/components/ChartPlate.jsx` is the single
place a chart is mounted, which keeps that constraint in one file. The site palette
(`ink`, `bone`, `sand`, `volt`) is lifted from those SVGs so the page and the plotted ink
are one system.

To refresh the charts after re-running the analysis:

```bash
cp ../charts/*.svg public/charts/
```
