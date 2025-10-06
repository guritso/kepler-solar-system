<script lang="ts">
	import { coordinates, bodies, time, timeScale, showTag, selectedBody } from '$lib/stores';
	import { calculateGravity } from '$lib/gravity';
	import { createOrbitsForAllBodies } from '$lib/orbit';
	import type { Body } from '$lib/bodies';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let offsetX = $state(0);
	let offsetY = $state(0);
	let scale = $state(0.1);
	let gridSize = $state(20);
	let isDragging = false;
	let startX: number, startY: number;

	let cursorX = $state(0);
	let cursorY = $state(0);
	let centerX = $state(0);
	let centerY = $state(0);

	let animationId: number;
	let lastTime = 0;

	let actualTime = $state(0);
	let isVisible = $state(true);

	// Cache para órbitas - evita recálculo desnecessário
	let orbitCache = $state<Map<string, { x: number; y: number }[]> | null>(null);
	let lastBodiesState = $state<string>('');

	$effect(() => {
		if (!canvas) return;

		const handleVisibility = () => {
			if (document.hidden) {
				isVisible = false;
				cancelAnimationFrame(animationId);
			} else {
				isVisible = true;
				lastTime = performance.now();
				animationId = requestAnimationFrame(animate);
			}
		};

		document.addEventListener('visibilitychange', handleVisibility);

		ctx = canvas.getContext('2d')!;

		lastTime = performance.now();
		animationId = requestAnimationFrame(animate);

		resize();

		window.addEventListener('resize', resize);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	});

	let date = new Date().getTime();
	let seconds = 0;

	function isComet(body: Body): boolean {
		// Identifica cometas baseado no nome ou outras características
		return body.name.includes('ATLAS') || body.name.includes('Comet') || body.trail !== undefined;
	}

	function animate(currentTime: number) {
		if (!isVisible) return;

		const dt = ((currentTime - lastTime) / 1000) * $timeScale; // Seconds
		lastTime = currentTime;

		seconds += dt;

		actualTime = date + seconds * 1000;

		calculateGravity(dt, $bodies); // Update physics

		$bodies.forEach((body) => {
			if (body !== $bodies[0]) {
				// Skip Sun - only add trails for comets
				if (isComet(body) && body.trail) {
					body.trail.push({ x: body.x, y: body.y });
					if (body.trail.length > 500) body.trail.shift(); // Shorter trail for comets
				}
			}
		});

		bodies.set([...$bodies]); // Trigger reactivity
		draw(); // Redraw

		if ($selectedBody) {
			offsetX = -scale * $selectedBody.x * gridSize;
			offsetY = -scale * $selectedBody.y * gridSize;
		}

		animationId = requestAnimationFrame(animate);
	}

	function drawOrbits() {
		// Verifica se precisamos recalcular as órbitas
		const currentState = JSON.stringify($bodies.map(b => ({ name: b.name, x: b.x, y: b.y, vx: b.vx, vy: b.vy })));

		if (orbitCache === null || lastBodiesState !== currentState) {
			orbitCache = createOrbitsForAllBodies($bodies);
			lastBodiesState = currentState;
		}

		orbitCache.forEach((orbitPoints, bodyName) => {
			const body = $bodies.find(b => b.name === bodyName);
			if (!body || orbitPoints.length < 2) return;

			ctx.save();

			// Configurações para desenho eficiente
			ctx.strokeStyle = body.gradient.one;
			ctx.lineWidth = 1 / scale;
			ctx.globalAlpha = 0.4;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';

			// Usa linha sólida para máxima performance
			ctx.setLineDash([]);

			ctx.beginPath();

			// Move to first point
			const firstPoint = orbitPoints[0];
			ctx.moveTo(firstPoint.x * gridSize, firstPoint.y * gridSize);

			// Draw line through all orbit points
			for (let i = 1; i < orbitPoints.length; i++) {
				const point = orbitPoints[i];
				ctx.lineTo(point.x * gridSize, point.y * gridSize);
			}

			// Close the path for elliptical orbits
			if (orbitPoints.length > 10) {
				ctx.closePath();
			}

			ctx.stroke();
			ctx.restore();
		});
	}

	function drawCometTrails() {
		$bodies.forEach((body: Body) => {
			if (isComet(body) && body.trail && body.trail.length > 1) {
				ctx.strokeStyle = body.gradient.one;
				ctx.lineWidth = 2 / scale;
				ctx.globalAlpha = 0.6;
				ctx.lineCap = 'round';

				ctx.beginPath();
				ctx.moveTo(body.trail[0].x * gridSize, body.trail[0].y * gridSize);

				// Draw trail with fading effect (newer points are brighter)
				for (let i = 1; i < body.trail.length; i++) {
					const alpha = i / body.trail.length;
					ctx.globalAlpha = alpha * 0.6;

					ctx.lineTo(body.trail[i].x * gridSize, body.trail[i].y * gridSize);
				}

				ctx.stroke();
				ctx.globalAlpha = 1;
			}
		});
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
		ctx.scale(scale, scale);

		// Draw orbits first (behind bodies)
		drawOrbits();

		// Draw comet trails (between orbits and bodies)
		drawCometTrails();

		$bodies.forEach((body: Body) => {
			// Draw glow effect for the Sun
			if (body.name === 'Sun') {
				const glowGradient = ctx.createRadialGradient(
					body.x * gridSize,
					body.y * gridSize,
					body.radius,
					body.x * gridSize,
					body.y * gridSize,
					body.radius * 7
				);
				glowGradient.addColorStop(0, 'rgba(255, 253, 131, 0.9)');
				glowGradient.addColorStop(0.3, 'rgba(255, 230, 100, 0.6)');
				glowGradient.addColorStop(0.7, 'rgba(255, 200, 50, 0.3)');
				glowGradient.addColorStop(1, 'rgba(255, 180, 0, 0)');
				ctx.fillStyle = glowGradient;
				ctx.beginPath();
				ctx.arc(body.x * gridSize, body.y * gridSize, body.radius * 7, 0, Math.PI * 2);
				ctx.fill();
			}

			const gradient = ctx.createRadialGradient(
				body.x * gridSize,
				body.y * gridSize,
				0,
				body.x * gridSize,
				body.y * gridSize,
				body.radius
			);
			gradient.addColorStop(0, body.gradient.one);
			gradient.addColorStop(1, body.gradient.two);
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(body.x * gridSize, body.y * gridSize, body.radius, 0, Math.PI * 2);
			ctx.fill();

			if ($showTag) {
				ctx.fillStyle = 'white';
				ctx.font = `${12 / scale}px Arial`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(body.name, body.x * gridSize + body.radius * 2, body.y * gridSize);
			}
		});
		ctx.restore();
	}
	// pan events
	function pointerdown(event: PointerEvent) {
		event.preventDefault();

		isDragging = true;
		startX = event.clientX - offsetX;
		startY = event.clientY - offsetY;

		const rect = canvas.getBoundingClientRect();
		const clickClientX = event.clientX - rect.left;
		const clickClientY = event.clientY - rect.top;

		let closest: Body | null = null;
		let minDistPx = Infinity;

		// Hitbox sizing (in pixels): ensures small bodies are clickable when zoomed out
		const MIN_HIT_PX = 8; // minimum clickable radius in pixels
		const MAX_HIT_PX = 80; // maximum clickable radius in pixels
		const HIT_MULTIPLIER = 1.5; // multiplier of drawn radius

		$bodies.forEach((body) => {
			// Convert body world coordinates to screen (pixel) coordinates
			const bodyScreenX = canvas.width / 2 + offsetX + scale * (body.x * gridSize);
			const bodyScreenY = canvas.height / 2 + offsetY + scale * (body.y * gridSize);

			const dx = bodyScreenX - clickClientX;
			const dy = bodyScreenY - clickClientY;
			const distPx = Math.sqrt(dx * dx + dy * dy);

			// On-screen drawn radius (pixels) = body.radius * scale
			const drawnRadiusPx = Math.abs(body.radius * scale);

			// Dynamic hit radius: proportional to drawn size but clamped between min/max
			const hitRadiusPx = Math.max(
				MIN_HIT_PX,
				Math.min(drawnRadiusPx * HIT_MULTIPLIER, MAX_HIT_PX)
			);

			if (distPx <= hitRadiusPx && distPx < minDistPx) {
				minDistPx = distPx;
				closest = body;
			}
		});

		selectedBody.set(closest);
		// console.debug('clicked', closest?.name, closest, { scale, offsetX, offsetY });
	}

	function pointerup() {
		isDragging = false;
	}

	function pointerleave() {
		isDragging = false;
	}

	const closestZoom = 1000;
	const farthestZoom = 0.001;
	// zoom events
	function wheel(event: WheelEvent) {
		event.preventDefault();

		const zoomSpeed = 0.1;
		const oldScale = scale;

		scale *= event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
		scale = Math.max(farthestZoom, Math.min(scale, closestZoom)); // limit zoom

		// keep zoom on the cursor
		const cursorX = event.clientX - canvas.width / 2;
		const cursorY = event.clientY - canvas.height / 2;

		offsetX = cursorX - (cursorX - offsetX) * (scale / oldScale);
		offsetY = cursorY - (cursorY - offsetY) * (scale / oldScale);

		draw();
	}
	// resize canvas
	function resize() {
		canvas.height = window.innerHeight;
		canvas.width = window.innerWidth;
		draw();
	}
	// coordinates of the cursor and center
	function pointermove(event: PointerEvent) {
		cursorX = (event.clientX - canvas.width / 2 - offsetX) / (scale * gridSize);
		cursorY = (event.clientY - canvas.height / 2 - offsetY) / (scale * gridSize);
		centerX = -offsetX / (scale * gridSize);
		centerY = -offsetY / (scale * gridSize);

		if (isDragging) {
			event.preventDefault();

			offsetX = event.clientX - startX;
			offsetY = event.clientY - startY;
		}

		draw();
	}

	$effect(() => {
		$coordinates = {
			x: centerX,
			y: centerY,
			z: scale,
			mx: cursorX,
			my: cursorY
		};
		$time = actualTime;
	});
</script>

<canvas
	class="absolute inset-0 overflow-hidden"
	style="touch-action: none;"
	bind:this={canvas}
	onpointerdown={pointerdown}
	onpointerup={pointerup}
	onpointerleave={pointerleave}
	onwheel={wheel}
	onpointermove={pointermove}
></canvas>