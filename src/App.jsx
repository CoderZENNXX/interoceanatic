import { useMemo, useState } from 'react'
import './App.css'

const defaultMetrics = {
  seaLevel: 12,
  plastic: 4,
  pollution: 4,
  temperature: 3,
  coralLoss: 4,
  wind: 5,
}

const metricConfig = [
  { key: 'seaLevel', label: 'Sea Level', unit: 'cm', max: 50 },
  { key: 'plastic', label: 'Plastic', unit: '/10', max: 10 },
  { key: 'pollution', label: 'Pollution', unit: '/10', max: 10 },
  { key: 'temperature', label: 'Temperature', unit: '°C', max: 20 },
  { key: 'coralLoss', label: 'Coral Loss', unit: '/10', max: 10 },
  { key: 'wind', label: 'Wind/Current', unit: '/10', max: 10 },
]

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

  const handleChange = (key, amount) => {
    setMetrics((current) => ({
      ...current,
      [key]: clamp(current[key] + amount, 0, metricConfig.find((item) => item.key === key).max),
    }))
  }

  const resetMetrics = () => {
    setMetrics(defaultMetrics)
  }

  const overallScore = useMemo(() => {
    const sum = metricConfig.reduce((acc, item) => acc + metrics[item.key] / item.max, 0)
    return sum / metricConfig.length
  }, [metrics])

  const stage = useMemo(() => {
    if (overallScore < 0.28) return 'restored'
    if (overallScore < 0.5) return 'denial'
    if (overallScore < 0.75) return 'uncertainty'
    return 'quiet'
  }, [overallScore])

  const damageMessage = {
    restored: 'A faint pulse of relief appears as balance begins to return.',
    denial: 'Early comments read like skepticism and social media shrug.',
    uncertainty: 'The tone shifts to nervous uncertainty and paused scrolling.',
    quiet: 'The scene grows still. No more easy dismissals — only the system speaks.',
  }[stage]

  const showComments = stage === 'denial' || stage === 'uncertainty'

  const waterDarkness = Math.min((metrics.pollution + metrics.plastic) / 20, 1)
  const temperatureShift = Math.min(1, metrics.temperature / 20)
  const heatIntensity = Math.max(0, Math.min(1, (metrics.temperature - 8) / 12))
  const seaTranslation = metrics.seaLevel * 0.85
  const coralOpacity = Math.max(0.1, 1 - metrics.coralLoss / 11)
  const fishOpacity = Math.max(0.08, 1 - (metrics.pollution + metrics.coralLoss) / 18)
  const windDetail = Math.max(0.2, 1 - metrics.wind / 12)
  const windMotion = (metrics.wind - 5) * 2
  const plasticHaze = metrics.plastic / 10
  const pollutionHaze = metrics.pollution / 10
  const coralFade = metrics.coralLoss / 10
  const temperatureHue = metrics.temperature * 2

  const impactText = `Lands destroyed: +${Math.round(metrics.seaLevel * 1800)} m²`
  const commentList = stage === 'denial' ? commentSets.denial : stage === 'uncertainty' ? commentSets.uncertainty : []
  const sceneComment = useMemo(() => {
    if (stage === 'restored') {
      return 'Coast lines settle, the day lightens, and the current narrative softens with restored balance.'
    }
    if (metrics.seaLevel > 22) {
      return 'Tide alerts flash across the dashboard as the shoreline creep becomes impossible to ignore.'
    }
    if (metrics.plastic > 7) {
      return 'Plastic ribbons drift in the water; the surface has a film and the mood of the feed darkens.'
    }
    if (metrics.pollution > 7) {
      return 'The water loses its blue sheen and a thick haze begins to settle over the scene.'
    }
    if (metrics.coralLoss > 7) {
      return 'The reef looks ghostly and the sea seems to have lost its saturation and life.'
    }
    if (metrics.temperature > 7) {
      return 'Heat haze rolls in and the horizon warms, changing the whole scene to a harsher glow.'
    }
    if (metrics.wind < 4) {
      return 'Currents slow and the water lies flatter, giving the scene an uneasy stillness.'
    }
    return commentList[0] || 'Each metric has a distinct effect now; the scene and the narrative move together.'
  }, [metrics, stage, commentList])

  return (
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
                      <span className="control-value">{metrics[metric.key]}{metric.unit}</span>
                    </div>
                    <div className="control-buttons">
                      <button
                        type="button"
                        className="control-button"
                        onClick={() => handleChange(metric.key, -1)}
                        aria-label={`Decrease ${metric.label}`}
                      >
                        –
                      </button>
                      <button
                        type="button"
                        className="control-button"
                        onClick={() => handleChange(metric.key, 1)}
                        aria-label={`Increase ${metric.label}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" className="button-primary" onClick={resetMetrics}>
                Current stats — latest published release
              </button>
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
              {stage === 'restored' && <div className="restoration-glow" />}

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
                  {stage === 'restored'
                    ? 'The final light appears only once the system is balanced enough. Comments fade as the urgency becomes collective.'
                    : 'The surface grows quiet as denial and hesitation are replaced by the weight of the changes.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
