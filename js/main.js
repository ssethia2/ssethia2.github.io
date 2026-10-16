// Animate navbar scrolling over one second with "swing" easing, like the
// original jQuery version of this site.

const DURATION = 1000;
let frame = null;

function swing(p) {
	return 0.5 - Math.cos(p * Math.PI) / 2;
}

function scrollToY(targetY) {
	const startY = window.scrollY;
	const distance = targetY - startY;
	const start = performance.now();

	cancelAnimationFrame(frame);
	frame = requestAnimationFrame(function step(now) {
		const p = Math.min((now - start) / DURATION, 1);
		window.scrollTo(0, startY + distance * swing(p));
		frame = p < 1 ? requestAnimationFrame(step) : null;
	});
}

// Let the reader take over mid-animation instead of fighting them
for (const event of ['wheel', 'touchstart', 'keydown']) {
	window.addEventListener(event, () => cancelAnimationFrame(frame), { passive: true });
}

document.querySelectorAll('.navbar a[href^="#"]').forEach(link => {
	link.addEventListener('click', e => {
		const target = document.querySelector(link.getAttribute('href'));
		if (!target) return;
		e.preventDefault();

		const navHeight = document.querySelector('.navbar').offsetHeight;
		const maxY = document.documentElement.scrollHeight - window.innerHeight;
		const y = Math.max(0, Math.min(maxY, target.getBoundingClientRect().top + window.scrollY - navHeight));

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			window.scrollTo(0, y);
		} else {
			scrollToY(y);
		}
	});
});
