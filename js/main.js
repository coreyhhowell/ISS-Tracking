// Cache the display container once since it doesn't change.
const positionEl = document.getElementById("position");

// Render the base HTML for coordinates and a placeholder for the resolved location.
function renderPosition(latitude, longitude) {
  positionEl.innerHTML = `Latitude: ${latitude.toFixed(4)}<br>Longitude: ${longitude.toFixed(
    4
  )}<br>Location: <span id="country">Resolving...</span>`;
}

// Resolve a human-readable location name from lat/lon using reverse geocoding.
// Prefers country names; if over water, prefers specific oceans, then seas/gulfs/bays.
async function resolveLocationName(latitude, longitude) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
  const geoResp = await fetch(url);
  const geo = await geoResp.json();

  const country = geo.countryName || geo.countryCode;
  if (country && country !== "N/A") return country;

  // Inspect localityInfo to find a named body of water.
  const informative = geo.localityInfo && geo.localityInfo.informative;
  const candidates = Array.isArray(informative) ? informative : [];

  // Prefer explicit oceans (e.g., "South Pacific Ocean").
  const ocean = candidates.find(
    (entry) => entry && typeof entry.name === "string" && /\bOcean\b/i.test(entry.name)
  );
  if (ocean && ocean.name) return ocean.name;

  // Otherwise, accept other marine features.
  const marine = candidates.find(
    (entry) => entry && typeof entry.name === "string" && /(Sea|Gulf|Bay|Strait|Channel)/i.test(entry.name)
  );
  if (marine && marine.name) return marine.name;

  // Last resort: sometimes geo.locality carries an ocean/sea name.
  if (typeof geo.locality === "string" && /Ocean|Sea/i.test(geo.locality)) {
    return geo.locality;
  }

  // Fallback when nothing specific is available.
  return "Over the ocean";
}

// Fetch the ISS coordinates, render them, then resolve the location line.
async function fetchISSPosition() {
  try {
    const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    const data = await response.json();
    const latitude = data.latitude;
    const longitude = data.longitude;

    // First, show coordinates and a "resolving" placeholder.
    renderPosition(latitude, longitude);

    // Then, asynchronously resolve and fill the human-readable location.
    try {
      const locationName = await resolveLocationName(latitude, longitude);
      const countryEl = document.getElementById("country");
      if (countryEl) countryEl.textContent = locationName;
    } catch (_) {
      const countryEl = document.getElementById("country");
      if (countryEl) countryEl.textContent = "Unknown";
    }
  } catch (_) {
    positionEl.textContent = "Error fetching ISS position.";
  }
}

// Initial load and periodic refresh (every 3 seconds).
fetchISSPosition();
setInterval(fetchISSPosition, 3000);


