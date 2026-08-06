// scripts/test-date-format.js
// Test that the selected dates are formatted correctly by our function

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

console.log("=== Testing Date Format for Filter ===\n")

// Get today and one month ago
const today = new Date();
today.setHours(0,0,0,0); // start of today
const oneMonthAgo = new Date(today);
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); // subtract one month

console.log('Today (date only):', today.toISOString().split('T')[0])
console.log('One month ago (date only):', oneMonthAgo.toISOString().split('T')[0])

// Simulate datetime-local input values: they typically include hours and minutes only (no seconds)
const startDateTime = `${oneMonthAgo.getFullYear()}-${String(oneMonthAgo.getMonth()+1).padStart(2,'0')}-${String(oneMonthAgo.getDate()).padStart(2,'0')}T00:00`
const endDateTime = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}T23:59`

console.log('\nInput from UI (format YYYY-MM-DDTHH:mm):')
console.log('  Start:', startDateTime)
console.log('  End:', endDateTime)

console.log('\nFormatted output:')
const startFormatted = formatLocalIsoOffset(startDateTime)
const endFormatted = formatLocalIsoOffset(endDateTime)
console.log('  Start ISO:', startFormatted)
console.log('  End ISO:', endFormatted)

if (startFormatted && endFormatted) {
  console.log('\n✓ Both dates are valid ISO strings with timezone offset.')
  // Verify order
  const dStart = new Date(startFormatted)
  const dEnd = new Date(endFormatted)
  console.log('  Start <= End?', dStart <= dEnd)
  
  // Also check backend expected format? We'll just compare basic pattern.
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
  console.log('  Start matches pattern?', isoPattern.test(startFormatted))
  console.log('  End matches pattern?', isoPattern.test(endFormatted))
} else {
  console.error('\n✗ One or both dates are invalid.')
}
