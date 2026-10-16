// Travel map: countries I've been to, plus pinned places.
//
// Country names must match data/countries-110m.json exactly (e.g. "United States of
// America", "United Kingdom", "Czechia"). Countries too small to appear in that data
// (Singapore, Malta, Maldives, ...) can go in PINS instead.

const VISITED = [
	'India',
	'United States of America',
];

// coords are [longitude, latitude]
const PINS = [
	{ name: 'New York City (home)', coords: [-74.006, 40.7128], home: true },
];

const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 960;
const HEIGHT = 470;

function svgEl(name, attrs, title) {
	const el = document.createElementNS(SVG_NS, name);
	for (const [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
	if (title) {
		const t = document.createElementNS(SVG_NS, 'title');
		t.textContent = title;
		el.appendChild(t);
	}
	return el;
}

async function renderTravelMap() {
	const container = document.getElementById('travel-map');
	if (!container) return;

	const world = await fetch('data/countries-110m.json').then(r => r.json());
	const countries = topojson.feature(world, world.objects.countries).features
		.filter(f => f.properties.name !== 'Antarctica');

	const names = new Set(countries.map(f => f.properties.name));
	for (const name of VISITED) {
		if (!names.has(name)) console.warn(`travel map: no country named "${name}"`);
	}

	const projection = d3.geoNaturalEarth1()
		.fitSize([WIDTH, HEIGHT], { type: 'FeatureCollection', features: countries });
	const path = d3.geoPath(projection);
	const visited = new Set(VISITED);

	const svg = svgEl('svg', {
		viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
		role: 'img',
		'aria-label': `World map of places I've visited: ${VISITED.join(', ')}`
	});

	for (const f of countries) {
		const name = f.properties.name;
		svg.appendChild(svgEl('path', {
			d: path(f),
			class: visited.has(name) ? 'country visited' : 'country'
		}, name));
	}

	for (const pin of PINS) {
		const [x, y] = projection(pin.coords);
		svg.appendChild(svgEl('circle', {
			cx: x, cy: y, r: pin.home ? 5 : 3.5,
			class: pin.home ? 'pin pin-home' : 'pin'
		}, pin.name));
	}

	container.appendChild(svg);
}

renderTravelMap();
