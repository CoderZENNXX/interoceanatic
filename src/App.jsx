import { useMemo, useState, useRef, useEffect } from "react"
import "./App.css"

const metricMeta = {
  seaLevel: { unit: "cm", min: 0, max: 50, step: 0.1, decimals: 1 },
  plastic: { unit: "Mt/yr", min: 0, max: 8, step: 0.1, decimals: 1 },
  pollution: { unit: "ppm", min: 0, max: 600, step: 1, decimals: 0 },
  temperature: { unit: "°C", min: -10, max: 10, step: 0.1, decimals: 1 },
  coralLoss: { unit: "%", min: 0, max: 100, step: 1, decimals: 0 },
  wind: { unit: "%/yr", min: -1, max: 1, step: 0.025, decimals: 3 },
}

const metricConfig = [
  { key: "seaLevel", label: "Sea Level" },
  { key: "plastic", label: "Plastic" },
  { key: "pollution", label: "Pollution" },
  { key: "temperature", label: "Temperature" },
  { key: "coralLoss", label: "Coral Loss" },
  { key: "wind", label: "Wind/Current" },
]

const defaultMetrics = {
  seaLevel: 10.1,
  plastic: 1.7,
  pollution: 431,
  temperature: 1.2,
  coralLoss: 84,
  wind: 0.075,
}

const publishedMetrics = { ...defaultMetrics }

const publishedMetricNotes = {
  seaLevel: "101.4 mm (3.99 inches) since 1993 (NOAA)",
  plastic: "1.7 Mt/yr entering the ocean (Our World in Data)",
  pollution: "431 ppm CO2 (NASA/NOAA, Apr 2026)",
  temperature: "1.19 °C (2.14 °F) anomaly (NASA 2025)",
  coralLoss: "~84.4% of reefs hit by bleaching-level heat stress, 2023-2025 (NOAA/ICRI)",
  wind: "Ocean surface winds rising ~0.074% per year (peer-reviewed summaries)",
}

const publishedMetricLinks = {
  seaLevel: "https://www.climate.gov/news-features/understanding-climate/climate-change-global-sea-level",
  plastic: "https://ourworldindata.org/plastic-pollution",
  pollution: "https://climate.nasa.gov/vital-signs/carbon-dioxide/",
  temperature: "https://climate.nasa.gov/vital-signs/global-temperature/",
  coralLoss: "https://coralreefwatch.noaa.gov/satellite/research/coral_bleaching_report.php",
  wind: "https://www.cell.com/heliyon/fulltext/S2405-8440(25)01169-7?_returnURL=https%3A%2F%2Flinkinghub.elsevier.com%2Fretrieve%2Fpii%2FS2405844025011697%3Fshowall%3Dtrue",
}

const optimizeMetrics = {
  seaLevel: 0,
  plastic: 0,
  pollution: 280,
  temperature: 0,
  coralLoss: 0,
  wind: 0,
}

const commentSets = {
  denial: [
    '“This is just weather. Scientists are exaggerating the map.”',
    '“CO₂ is measured monthly. The ocean doesn’t shift overnight.”',
    '“A little plastic? We’ve seen worse. Relax.”',
  ],
  uncertainty: [
    '“The sea looks different... maybe we should pay attention.”',
    '“Not sure if this is climate or just a bad season.”',
    '“If this keeps up, the coastlines won’t stay the same.”',
  ],
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

function App() {
  const [metrics, setMetrics] = useState(defaultMetrics)
  const holdTimer = useRef(null)
  const holdDelta = useRef(0)

  const formatValue = (key, value) => {
    const meta = metricMeta[key]
    if (!meta) return `${value}`
    return `${Number(value).toFixed(meta.decimals)} ${meta.unit}`
  }

    const [editingKey, setEditingKey] = useState(null)
    const [editValue, setEditValue] = useState("")

    const startEdit = (key) => {
      stopAdjust()
      const meta = metricMeta[key]
      if (!meta) return
      setEditingKey(key)
      setEditValue(String(Number(metrics[key]).toFixed(meta.decimals)))
    }

    const commitEdit = () => {
      if (!editingKey) return
      const meta = metricMeta[editingKey]
      let v = parseFloat(editValue)
      if (Number.isNaN(v)) {
        setEditingKey(null)
        return
      }
      v = clamp(Number(v.toFixed(meta.decimals)), meta.min, meta.max)
      setMetrics((cur) => ({ ...cur, [editingKey]: v }))
      setEditingKey(null)
    }

    const cancelEdit = () => setEditingKey(null)

  const handleChange = (key, amount) => {
    const meta = metricMeta[key]
    if (!meta) return
    setMetrics((current) => ({
      ...current,
      [key]: clamp(Number((current[key] + amount).toFixed(meta.decimals)), meta.min, meta.max),
    }))
  }

  const stopAdjust = () => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current)
      holdTimer.current = null
      holdDelta.current = 0
    }
  }

  const startAdjust = (key, direction) => {
    const meta = metricMeta[key]
    if (!meta) return
    // perform immediate change
    handleChange(key, direction * meta.step)
    stopAdjust()
    holdDelta.current = direction * meta.step
    holdTimer.current = setInterval(() => {
      handleChange(key, holdDelta.current)
    }, 120)
  }

  // cleanup on unmount
  useEffect(() => {
    return () => stopAdjust()
  }, [])

  const optimizeMetrics = {
    seaLevel: 0,
    plastic: 0,
    pollution: 280,
    temperature: 0,
    coralLoss: 0,
    wind: 0,
  }

  const normalized = useMemo(() => {
    const out = {}
    metricConfig.forEach((item) => {
      const meta = metricMeta[item.key]
      const v = metrics[item.key]
      if (meta.min < 0 && meta.max > 0 && Math.abs(meta.min) === Math.abs(meta.max)) {
        out[item.key] = clamp(Math.abs(v) / meta.max, 0, 1)
      } else if (item.key === "pollution") {
        const optimalPollution = 280
        const maxDist = Math.max(optimalPollution - meta.min, meta.max - optimalPollution)
        out[item.key] = clamp(Math.abs(v - optimalPollution) / maxDist, 0, 1)
      } else {
        out[item.key] = clamp((v - meta.min) / (meta.max - meta.min), 0, 1)
      }
    })
    return out
  }, [metrics])

  const overallScore = useMemo(() => {
    const sum = metricConfig.reduce((acc, item) => acc + normalized[item.key], 0)
    return sum / metricConfig.length
  }, [normalized])

  const stage = useMemo(() => {
    if (overallScore < 0.28) return "restored"
    if (overallScore < 0.5) return "denial"
    if (overallScore < 0.75) return "uncertainty"
    return "quiet"
  }, [overallScore])

  const damageMessage = {
    restored: "A faint pulse of relief appears as balance begins to return.",
    denial: "Early comments read like skepticism and social media shrug.",
    uncertainty: "The tone shifts to nervous uncertainty and paused scrolling.",
    quiet: "The scene grows still. No more easy dismissals — only the system speaks.",
  }[stage]

  const showComments = stage === "denial" || stage === "uncertainty"

  const waterDarkness = Math.min((normalized.pollution + normalized.plastic) / 2, 1)
  const temperatureShift = Math.min(1, normalized.temperature)
  const heatIntensity = Math.max(0, Math.min(1, (metrics.temperature - 1.5) / 3))
  const seaTranslation = metrics.seaLevel * 0.085
  const coralOpacity = Math.max(0.05, 1 - normalized.coralLoss * 0.95)
  const fishOpacity = Math.max(0.06, 1 - (normalized.pollution * 0.6 + normalized.coralLoss * 0.4))
  const windDetail = Math.max(0.2, 1 - normalized.wind * 0.9)
  const windMotion = (normalized.wind - 0.5) * 12
  const plasticHaze = normalized.plastic
  const pollutionHaze = normalized.pollution
  const coralFade = normalized.coralLoss
  const temperatureHue = metrics.temperature * 6

  const impactText = `Lands destroyed: +${Math.round(metrics.seaLevel * 1800)} m²`
  const commentList = stage === "denial" ? commentSets.denial : stage === "uncertainty" ? commentSets.uncertainty : []
  const sceneComment = useMemo(() => {
    if (stage === "restored") {
      return "Coast lines settle, the day lightens, and the current narrative softens with restored balance."
    }
    if (metrics.seaLevel > 22) {
      return "Tide alerts flash across the dashboard as the shoreline creep becomes impossible to ignore."
    }
    if (metrics.plastic > 5) {
      return "Plastic ribbons drift in the water; the surface has a film and the mood of the feed darkens."
    }
    if (metrics.pollution > 510) {
      return "The water loses its blue sheen and a thick haze begins to settle over the scene."
    }
    if (metrics.coralLoss > 70) {
      return "The reef looks ghostly and the sea seems to have lost its saturation and life."
    }
    if (metrics.temperature > 2) {
      return "Heat haze rolls in and the horizon warms, changing the whole scene to a harsher glow."
    }
    if (metrics.wind < -0.4) {
      return "Currents slow and the water lies flatter, giving the scene an uneasy stillness."
    }
    if (metrics.wind > 0.4) {
      return "Stronger surface currents churn the water and push the story toward a more volatile ocean state."
    }
    return commentList[0] || "Each metric has a distinct effect now; the scene and the narrative move together."
  }, [metrics, stage, commentList])

  return (
    <>
    <div className="rotate-warning">
      <h2>Please rotate your device to landscape mode for the best experience.</h2>
    </div>
    <div className="app-container">
      <div className="app-inner">
        <section className="header-panel">
          <h1 className="page-title">Ocean Control: cause, consequence, and the choice to restore.</h1>
          <p className="page-copy">
            Begin from the latest published NOAA/NASA release, then adjust the dials to shape the scene.
            Each tap changes the water, the coastline, and the tone of the comments so you can feel how
            rising seas, plastic, pollution, heat, coral loss, and currents combine into a story.
          </p>
        </section>

        <div className="dashboard-grid">
          <aside className="control-column">
            <div className="control-card">
              <div className="stats-header">
                <div>
                  <h2 className="stats-title">Control room</h2>
                  <p className="control-hint">
                    Adjust each module like a tactile dial. The ocean, fauna, and social tone respond in real time.
                  </p>
                </div>
              </div>

              <div className="control-track">
                {metricConfig.map((metric) => (
                  <div key={metric.key} className="control-item">
                    <div className="control-title">
                      <span>{metric.label}</span>
                      {editingKey === metric.key ? (
                        <input
                          className="control-value-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit()
                            if (e.key === "Escape") cancelEdit()
                          }}
                          autoFocus
                          onFocus={(e) => e.target.select()}
                        />
                      ) : (
                        <span
                          className="control-value"
                          role="button"
                          tabIndex={0}
                          onClick={() => startEdit(metric.key)}
                          onKeyDown={(e) => e.key === "Enter" && startEdit(metric.key)}
                          aria-label={`Edit ${metric.label} value`}
                        >
                          {formatValue(metric.key, metrics[metric.key])}
                        </span>
                      )}
                    </div>
                    <div className="control-buttons">
                      <button
                        type="button"
                        className="control-button"
                        onMouseDown={() => startAdjust(metric.key, -1)}
                        onMouseUp={stopAdjust}
                        onMouseLeave={stopAdjust}
                        onTouchStart={() => startAdjust(metric.key, -1)}
                        onTouchEnd={stopAdjust}
                        onTouchCancel={stopAdjust}
                        aria-label={`Decrease ${metric.label}`}
                      >
                        –
                      </button>
                      <button
                        type="button"
                        className="control-button"
                        onMouseDown={() => startAdjust(metric.key, 1)}
                        onMouseUp={stopAdjust}
                        onMouseLeave={stopAdjust}
                        onTouchStart={() => startAdjust(metric.key, 1)}
                        onTouchEnd={stopAdjust}
                        onTouchCancel={stopAdjust}
                        aria-label={`Increase ${metric.label}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="button-primary"
                onClick={() => setMetrics({ ...publishedMetrics })}
              >
                Restore — Published NOAA / NASA
              </button>
              <button
                type="button"
                className="button-primary button-secondary"
                onClick={() => setMetrics({ ...optimizeMetrics })}
              >
                Optimize — Perfect world ocean
              </button>
              <div className="stats-copy metric-references">
                Latest published references:
                <ul className="metric-notes">
                  {metricConfig.map((metric) => (
                    <li key={metric.key}>
                      <a
                        className="metric-note"
                        href={publishedMetricLinks[metric.key]}
                        target="_blank"
                        rel="noreferrer"
                        title={`View ${metric.label} reference`}
                      >
                        <strong>{metric.label}:</strong> {publishedMetricNotes[metric.key]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          <div className="scene-column">
            <div className="scene-card">
              <div
                className="scene-sky"
                style={{
                  filter: `sepia(${Math.min(0.8, heatIntensity * 0.8)}) saturate(${1 + heatIntensity * 1.5}) brightness(${1 + heatIntensity * 1.4})`,
                }}
              />
              <div
                className="sun-glow"
                style={{
                  opacity: 0.5 + heatIntensity * 0.26,
                  transform: `translateX(-50%) scale(${1 + heatIntensity * 0.16})`,
                  background: `radial-gradient(circle, rgba(255, 210, 110, ${0.2 + heatIntensity * 0.18}), rgba(255, 110, 45, ${0.08 + heatIntensity * 0.22}) 48%, transparent 65%)`,
                }}
              />
              <div className="horizon-line" />
              <div
                className="scene-grid"
                style={{
                  transform: `translateX(${windMotion * 0.7}px)`,
                  backgroundPosition: `${windMotion * 6}px ${windMotion * 2}px`,
                }}
              />
              <div className="plastic-cloud" style={{ opacity: plasticHaze * 0.42 }} />
              {stage === "restored" && <div className="restoration-glow" />}

              <div className="scene-sea">
                <div className="island-cluster">
                  <div
                    className="land-mass"
                    style={{
                      transform: `translateY(${seaTranslation * -0.1}px) scale(${1 - metrics.seaLevel * 0.0025})`,
                      filter: `saturate(${1 - coralFade * 0.14}) contrast(${1 - pollutionHaze * 0.08})`,
                    }}
                  />
                  <div className="small-island island-one" />
                  <div className="small-island island-two" />
                </div>
                <div
                  className="ocean-layer"
                  style={{
                    transform: `translateY(${-seaTranslation}px)`,
                    filter: `brightness(${1.08 - waterDarkness * 0.28}) saturate(${Math.max(0.55, 1 - coralFade * 0.35)}) hue-rotate(${temperatureHue * 0.2}deg) blur(${waterDarkness * 0.55}px)`,
                    opacity: 0.98,
                  }}
                />
                <div
                  className="coral-reef"
                  style={{ opacity: coralOpacity, transform: `translateY(${metrics.coralLoss * 1.4}px)` }}
                />
                <div
                  className="fish-school"
                  style={{
                    opacity: fishOpacity,
                    transform: `translate(${windMotion * 6}px, ${metrics.pollution * 0.7}px) scale(${windDetail})`,
                    filter: `saturate(${Math.max(0.45, 1 - coralFade * 0.5)})`,
                  }}
                />
              </div>

              <div className="scene-overlay">
                <div className="impact-chip">{impactText}</div>
                <div className="scene-meter">
                  <div className="meter-label">
                    <span>Damage index</span>
                    <strong>{Math.round(overallScore * 100)}%</strong>
                  </div>
                  <div className="meter-track">
                    <div className="meter-fill" style={{ width: `${Math.min(100, Math.round(overallScore * 100))}%` }} />
                  </div>
                </div>
              </div>
              <div className="scene-comment-strip">
                <span>{sceneComment}</span>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-header">
                <div>
                  <h2 className="stats-title">Current narrative</h2>
                  <p className="stats-copy">{damageMessage}</p>
                </div>
              </div>
              <p className="note-line">
                NOAA and NASA releases are updated monthly/quarterly; this screen reflects the latest
                published values, not instant live telemetry.
              </p>

              {showComments ? (
                <div className="comment-panel">
                  {commentList.map((comment) => (
                    <div key={comment} className="comment-card">
                      <strong>{comment}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="comments-muted">
                  {stage === "restored"
                    ? "The final light appears only once the system is balanced enough. Comments fade as the urgency becomes collective."
                    : "The surface grows quiet as denial and hesitation are replaced by the weight of the changes."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <img src="/favicon.png" alt="Interoceanatic Logo"/>
            Interoceanatic — Ocean Control | Tayzar Naing
          </div>
          <div className="footer-right">
            <a href="https://github.com/CoderZENNXX" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.instagram.com/tayzar.naing.insta/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.tiktok.com/@tayzar.naing.tiktok" target="_blank" rel="noreferrer">TikTok</a>
            <a href="https://www.facebook.com/tayzar.naing.fb" target="_blank" rel="noreferrer">Facebook</a>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}

export default App