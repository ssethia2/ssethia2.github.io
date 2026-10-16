// Travel map: cities and places I've been, plus states in the US and India.
//
// PLACES are pinned on the map; hovering (or tapping) shows their names. Coordinates are
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

const displayName = country => DISPLAY_NAMES[country] || country;

function svgEl(name, attrs) {
	const el = document.createElementNS(SVG_NS, name);
	for (const [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
	return el;
}

function warnUnknown(names, known, kind) {
	for (const name of names) {
		if (!known.has(name)) console.warn(`travel map: no ${kind} named "${name}"`);
	}
}

// Small popup that follows the mouse, or opens where you tap on touch screens
function createTip(container, tips) {
	const tip = document.createElement('div');
	tip.className = 'map-tip';
	tip.hidden = true;
	const title = document.createElement('strong');
	const detail = document.createElement('span');
	tip.append(title, detail);
	container.appendChild(tip);

	const move = e => {
		const rect = container.getBoundingClientRect();
		const half = tip.offsetWidth / 2;
		const x = Math.min(Math.max(e.clientX - rect.left, half), rect.width - half);
		tip.style.left = `${x}px`;
		tip.style.top = `${e.clientY - rect.top}px`;
	};
	const hide = () => { tip.hidden = true; };

	container.addEventListener('pointerover', e => {
		const data = tips.get(e.target.closest('[data-tip]'));
		if (!data) return hide();
		title.textContent = data.title;
		detail.textContent = data.detail || '';
		detail.hidden = !data.detail;
		tip.hidden = false;
		move(e);
	});
	container.addEventListener('pointermove', e => {
		if (!tip.hidden && e.pointerType === 'mouse') move(e);
	});
	container.addEventListener('pointerleave', e => {
		if (e.pointerType === 'mouse') hide();
	});
	document.addEventListener('pointerdown', e => {
		if (!container.contains(e.target)) hide();
	});
}

function renderMap(container, countries, states) {
	const projection = d3.geoNaturalEarth1()
		.fitSize([WIDTH, HEIGHT], { type: 'FeatureCollection', features: countries });
	const path = d3.geoPath(projection);
	const tips = new WeakMap();

	const placesIn = country => PLACES.filter(p => p.country === country).map(p => p.name);
	const shadedCountries = new Set([...COUNTRIES, ...PLACES.map(p => p.country)]);

	const svg = svgEl('svg', {
		viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
		role: 'img',
		'aria-label': `World map of places I've been: ${PLACES.map(p => p.name).join(', ')}`
	});

	const addRegion = (feature, visited, tip) => {
		const region = svgEl('path', { d: path(feature), class: visited ? 'region visited' : 'region' });
		if (visited) {
			region.setAttribute('data-tip', '');
			tips.set(region, tip);
		}
		svg.appendChild(region);
	};

	for (const f of countries) {
		const name = f.properties.name;
		if (STATE_LEVEL.has(name)) continue;
		addRegion(f, shadedCountries.has(name), {
			title: displayName(name),
			detail: placesIn(name).filter(place => place !== name).join(' · ')
		});
	}

	for (const f of states) {
		const { name, admin } = f.properties;
		addRegion(f, STATES.includes(name) || COUNTRIES.includes(admin), {
			title: name,
			detail: displayName(admin)
		});
	}

	// Each pin gets a larger invisible hit area; the home pin is drawn last, on top
	const ordered = [...PLACES.filter(p => !p.home), ...PLACES.filter(p => p.home)];
	for (const place of ordered) {
		const [x, y] = projection(place.coords);
		const group = svgEl('g', { class: 'pin-group', 'data-tip': '' });
		group.append(
			svgEl('circle', { cx: x, cy: y, r: 9, class: 'pin-hit' }),
			svgEl('circle', { cx: x, cy: y, r: place.home ? 5 : 3.5, class: place.home ? 'pin pin-home' : 'pin' })
		);
		tips.set(group, { title: place.name, detail: place.home ? 'Home' : displayName(place.country) });
		svg.appendChild(group);
	}

	container.appendChild(svg);
	createTip(container, tips);
}

async function renderTravel() {
	const container = document.getElementById('travel-map');
	if (!container) return;

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

	renderMap(container, countries, states);
}

renderTravel();
