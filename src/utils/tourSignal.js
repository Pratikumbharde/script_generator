/* ============================================================
   Tour signal — one-shot flag saying "the user just logged in,
   show the quick-start tour". Deliberately module-level (not
   localStorage/sessionStorage): it resets on page refresh, so a
   restored session never re-triggers the tour — only an actual
   login (or registration) does. Closing the tour clears it, so
   it stays hidden until the next logout → login cycle.
   ============================================================ */

let pending = false

export function requestTour() {
  pending = true
}

export function consumeTourRequest() {
  const was = pending
  pending = false
  return was
}