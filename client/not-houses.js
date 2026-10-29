// Not houses. Written by tools/build_scene.py drop_phantoms.
// OSM height under 2.5 m with no building:levels, and not touching an
// ordinary neighbour, is open pavement. Worship footprints under 12 m2
// are shrines, not towers. A low tag on a street-row end is kept.
export const NOT_HOUSES = new Set([
  420286759, // small-worship
  420286785, // small-worship
  908861401, // low-plinth
  1028854863, // small-worship
]);
