/* One-shot request channel from Conversation Intelligence → Practice.
   Module-level (not component state) because HeatmapView unmounts when the
   view switches to practice — same pattern as utils/tourSignal.js. */
let pending = null

export function requestPractice(req) { pending = req || {} }

export function consumePracticeRequest() {
  const was = pending
  pending = null
  return was
}