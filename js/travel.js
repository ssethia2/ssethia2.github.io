// Travel map: cities and places I've been, plus states in the US and India.
//
// PLACES are pinned on the map and listed under it, grouped by country. Coordinates are
// [longitude, latitude]. A country with a pin in it is shaded automatically, as long as
// `country` matches a name in data/countries-110m.json (countries too small for that data,
// like Singapore, still get a pin).
//
// The US and India are drawn state by state instead: list states in STATES, using the
// names in data/states.json. COUNTRIES shades a whole country with no pins in it.

const PLACES = [
	{ name: 'New York City', country: 'United States of America', coords: [-74.006, 40.713], home: true },
	{ name: 'Tokyo', country: 'Japan', coords: [139.692, 35.690] },
	{ name: 'Osaka', country: 'Japan', coords: [135.502, 34.694] },
	{ name: 'Kyoto', country: 'Japan', coords: [135.768, 35.012] },
	{ name: 'Singapore', country: 'Singapore', coords: [103.820, 1.352] },
	{ name: 'Bangkok', country: 'Thailand', coords: [100.502, 13.756] },
	{ name: 'Dubai', country: 'United Arab Emirates', coords: [55.271, 25.205] },
	{ name: 'Doha', country: 'Qatar', coords: [51.531, 25.285] },
	{ name: 'London', country: 'United Kingdom', coords: [-0.128, 51.507] },
	{ name: 'Barcelona', country: 'Spain', coords: [2.169, 41.387] },
	{ name: 'Sevilla', country: 'Spain', coords: [-5.985, 37.389] },
	{ name: 'Berlin', country: 'Germany', coords: [13.405, 52.520] },
	{ name: 'Hanover', country: 'Germany', coords: [9.732, 52.376] },
	{ name: 'Rome', country: 'Italy', coords: [12.496, 41.903] },
	{ name: 'Vienna', country: 'Austria', coords: [16.374, 48.208] },
	{ name: 'Sölden', country: 'Austria', coords: [11.008, 46.966] },
	{ name: 'Prague', country: 'Czechia', coords: [14.438, 50.076] },
	{ name: 'Český Krumlov', country: 'Czechia', coords: [14.318, 48.813] },
	{ name: 'Bratislava', country: 'Slovakia', coords: [17.108, 48.149] },
	{ name: 'Cancún', country: 'Mexico', coords: [-86.852, 21.162] },
];

const STATES = [
	'New York',
	'Illinois',
];

// Remove India from here once its states are listed above
const COUNTRIES = [
	'India',
];

const STATE_LEVEL = new Set(['United States of America', 'India']);
const DISPLAY_NAMES = { 'United States of America': 'United States' };

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

function warnUnknown(names, known, kind) {
	for (const name of names) {
		if (!known.has(name)) console.warn(`travel map: no ${kind} named "${name}"`);
	}
}

function renderMap(container, countries, states) {
	const projection = d3.geoNaturalEarth1()
		.fitSize([WIDTH, HEIGHT], { type: 'FeatureCollection', features: countries });
	const path = d3.geoPath(projection);

	const shadedCountries = new Set([...COUNTRIES, ...PLACES.map(p => p.country)]);
	const shadedStates = new Set(STATES);

	const svg = svgEl('svg', {
		viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
		role: 'img',
		'aria-label': "World map of places I've been"
	});

	for (const f of countries) {
		const name = f.properties.name;
		if (STATE_LEVEL.has(name)) continue;
		svg.appendChild(svgEl('path', {
			d: path(f),
			class: shadedCountries.has(name) ? 'region visited' : 'region'
		}, DISPLAY_NAMES[name] || name));
	}

	for (const f of states) {
		const { name, admin } = f.properties;
		const visited = shadedStates.has(name) || COUNTRIES.includes(admin);
		svg.appendChild(svgEl('path', {
			d: path(f),
			class: visited ? 'region visited' : 'region'
		}, name));
	}

	// Home pin last, so it sits on top
	const pins = PLACES.map(place => {
		const [x, y] = projection(place.coords);
		return svgEl('circle', {
			cx: x, cy: y, r: place.home ? 5 : 3.5,
			class: place.home ? 'pin pin-home' : 'pin'
		}, place.home ? `${place.name} (home)` : place.name);
	});
	pins.filter((_, i) => !PLACES[i].home).forEach(pin => svg.appendChild(pin));
	pins.filter((_, i) => PLACES[i].home).forEach(pin => svg.appendChild(pin));

	container.appendChild(svg);
	return pins;
}

function renderList(list, pins) {
	const groups = new Map(COUNTRIES.map(c => [c, []]));
	PLACES.forEach((place, i) => {
		if (!groups.has(place.country)) groups.set(place.country, []);
		groups.get(place.country).push(i);
	});

	for (const [country, indices] of groups) {
		const item = document.createElement('li');
		const name = document.createElement('span');
		name.className = 'travel-country';
		name.textContent = DISPLAY_NAMES[country] || country;
		item.appendChild(name);

		const highlight = (el, i) => {
			el.addEventListener('mouseenter', () => pins[i].classList.add('active'));
			el.addEventListener('mouseleave', () => pins[i].classList.remove('active'));
		};

		// A city-state like Singapore is listed once, not as "Singapore Singapore"
		if (indices.length === 1 && PLACES[indices[0]].name === name.textContent) {
			highlight(name, indices[0]);
		} else {
			indices.forEach((i, n) => {
				if (n > 0) item.append(' · ');
				const place = document.createElement('span');
				place.className = 'travel-place';
				place.textContent = PLACES[i].name;
				highlight(place, i);
				item.appendChild(place);
			});
		}
		list.appendChild(item);
	}
}

async function renderTravel() {
	const container = document.getElementById('travel-map');
	const list = document.getElementById('travel-list');
	if (!container || !list) return;

	const [world, stateData] = await Promise.all([
		fetch('data/countries-110m.json').then(r => r.json()),
		fetch('data/states.json').then(r => r.json()),
	]);
	const countries = topojson.feature(world, world.objects.countries).features
		.filter(f => f.properties.name !== 'Antarctica');
	const states = topojson.feature(stateData, stateData.objects.states).features;

	const countryNames = new Set(countries.map(f => f.properties.name));
	warnUnknown(COUNTRIES, countryNames, 'country');
	warnUnknown(PLACES.map(p => p.country).filter(c => c !== 'Singapore'), countryNames, 'country');
	warnUnknown(STATES, new Set(states.map(f => f.properties.name)), 'state');

	const pins = renderMap(container, countries, states);
	renderList(list, pins);
}

renderTravel();
