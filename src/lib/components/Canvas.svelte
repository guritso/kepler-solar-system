<script lang="ts">
	import {
		coordinates,
		bodies,
		simulationTime,
		timeScale,
		showTag,
		selectedBody,
		resetTime
	} from '$lib/stores';
	import { updateBodies } from '$lib/simulation';
	import type { Body } from '$lib/bodies';
	import { drawTrail } from '$lib/trails';

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

	let date = Date.now();
	let seconds = 0;

	function animate(currentTime: number) {
		if (!isVisible) return;

		const dt = ((currentTime - lastTime) / 1000) * $timeScale; // Seconds
		lastTime = currentTime;

		seconds += dt;

		actualTime = date + seconds * 1000;

		if ($resetTime) {
			date = Date.now();
			seconds = 0;
			resetTime.set(false);
		}

		updateBodies($bodies, actualTime, dt);

		bodies.set([...$bodies]); // Trigger reactivity
		draw(); // Redraw
		// center on selected body
		if ($selectedBody) {
			const targetOffsetX = -scale * $selectedBody.x * gridSize;
			const targetOffsetY = -scale * $selectedBody.y * gridSize;

			// Lerp for smooth transition if needed (optional: set lerp=0.1 for easing)
			const lerp = 0.5; // m snap
			offsetX += (targetOffsetX - offsetX) * lerp;
			offsetY += (targetOffsetY - offsetY) * lerp;
		}

		animationId = requestAnimationFrame(animate);
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
		ctx.scale(scale, scale);

		$bodies.forEach((body: Body) => {
			drawTrail(ctx, body, gridSize, scale); // Nova linha: desenha órbitas/trails
		});

		$bodies.forEach((body: Body) => {
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

	const closestZoom = 100000;
	const farthestZoom = 0.0001;
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

		$simulationTime = actualTime;
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
