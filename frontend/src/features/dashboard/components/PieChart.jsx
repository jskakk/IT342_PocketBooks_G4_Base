function PieChart({ data, total }) {
  const colors = ['#1b5f99', '#d9534f', '#5cb85c', '#f0ad4e', '#5bc0de']
  let currentAngle = 0
  const slices = []

  data.forEach((item, index) => {
    const sliceAngle = (item.value / total) * 360
    const midAngle = currentAngle + sliceAngle / 2
    const labelRadius = 110

    slices.push({
      category: item.category,
      value: item.value,
      percentage: ((item.value / total) * 100).toFixed(0),
      color: colors[index % colors.length],
      startAngle: currentAngle,
      endAngle: currentAngle + sliceAngle,
      labelX: 150 + labelRadius * Math.cos(((midAngle - 90) * Math.PI) / 180),
      labelY: 150 + labelRadius * Math.sin(((midAngle - 90) * Math.PI) / 180),
    })

    currentAngle += sliceAngle
  })

  const svgPaths = slices.map((slice) => {
    const startRad = (slice.startAngle * Math.PI) / 180
    const endRad = (slice.endAngle * Math.PI) / 180
    const r = 80

    const x1 = 150 + r * Math.cos(startRad - Math.PI / 2)
    const y1 = 150 + r * Math.sin(startRad - Math.PI / 2)
    const x2 = 150 + r * Math.cos(endRad - Math.PI / 2)
    const y2 = 150 + r * Math.sin(endRad - Math.PI / 2)

    const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0

    return (
      <g key={`${slice.category}-path`}>
        <path
          d={`M 150 150 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={slice.color}
          opacity="0.9"
        />
      </g>
    )
  })

  return (
    <div className="pie-chart-container">
      <svg width="300" height="300" viewBox="0 0 300 300" className="pie-svg">
        {svgPaths}
        <circle cx="150" cy="150" r="50" fill="white" />
        <text x="150" y="150" textAnchor="middle" dominantBaseline="middle" className="pie-center-text">
          Total
        </text>
      </svg>

      <div className="pie-legend">
        {slices.map((slice) => (
          <div key={`${slice.category}-legend`} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: slice.color }} />
            <span className="legend-label">
              {slice.category}{' '}
              <strong>
                {slice.percentage}%
              </strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PieChart
