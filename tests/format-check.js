// tests/format-check.js
// Quick verification that the frontend sends correctly formatted start_time / end_time params

function formatLocalIsoOffset(val) {
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  const pad = (n) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  const offsetMinutes = -d.getTimezoneOffset() // minutes east of UTC
  const offsetSign = offsetMinutes >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  const offsetH = pad(Math.floor(absOffset / 60))
  const offsetM = pad(absOffset % 60)
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}${offsetSign}${offsetH}:${offsetM}`
}

// Simulate apiRequest's URL building logic
function buildUrl(baseURL, endpoint, params) {
  const url = new URL(baseURL + endpoint)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') {
      url.searchParams.set(k, String(v))
    }
  })
  return url.toString()
}

console.log('=== Format ISO Test ===')
const inputs = [
  '2026-07-29T00:00',
  '2026-07-30T23:59',
  '2026-07-29T15:30:00',
  'invalid-date',
  ''
]
inputs.forEach((input) => {
  const out = formatLocalIsoOffset(input)
  console.log(`Input: "${input}"  →  Output: ${out}`)
})

console.log('\n=== URL Building Test ===')
const start = formatLocalIsoOffset('2026-07-29T00:00')
const end = formatLocalIsoOffset('2026-07-30T23:59')
const url = buildUrl('http://localhost:3000', '/api/v1/scans', {
  page: 1,
  pageSize: 20,
  search: undefined,
  rat: 'ALL',
  start_time: start,
  end_time: end
})
console.log('Generated URL:')
console.log(url)

console.log('\n=== Parameter validation ===')
const u = new URL(url)
console.log('start_time =', u.searchParams.get('start_time'))
console.log('end_time   =', u.searchParams.get('end_time'))
console.log('start_time matches ISO 8601 with offset:',
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(u.searchParams.get('start_time'))
)
console.log('end_time matches ISO 8601 with offset:',
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(u.searchParams.get('end_time'))
)
console.log('start_time <= end_time:',
  new Date(u.searchParams.get('start_time')).getTime() <= new Date(u.searchParams.get('end_time')).getTime()
)