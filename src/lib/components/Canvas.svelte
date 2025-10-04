<script lang="ts">
	import { coordinates, bodies, time, timeScale, showTag, selectedBody } from '$lib/stores';
	import { calculateGravity } from '$lib/gravity';
	import type { Body } from '$lib/bodies';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let offsetX = $state(0);
	let offsetY = $state(0);
	let scale = $state(1);
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

	let date = new Date().getTime();
	let seconds = 0;

	function animate(currentTime: number) {
		if (!isVisible) return;

		const dt = ((currentTime - lastTime) / 1000) * $timeScale; // Seconds
		lastTime = currentTime;

		seconds += dt;

		actualTime = date + seconds * 1000;

		calculateGravity(dt, $bodies); // Update physics

		$bodies.forEach((body) => {
			if (body !== $bodies[0]) {
				// Skip Sun
				body.trail.push({ x: body.x, y: body.y });
				if (body.trail.length > 1000) body.trail.shift();
			}
		});

		bodies.set([...$bodies]); // Trigger reactivity
		draw(); // Redraw

		animationId = requestAnimationFrame(animate);
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
		ctx.scale(scale, scale);

		$bodies.forEach((body: Body) => {
			if (body.trail.length > 1 && body.name !== 'Sun') {
				ctx.strokeStyle = body.gradient.one;
				ctx.lineWidth = 1 / scale;
				ctx.lineCap = 'round';
				ctx.beginPath();
				ctx.moveTo(body.trail[0].x * gridSize, body.trail[0].y * gridSize);
				body.trail.forEach((point) => {
					ctx.lineTo(point.x * gridSize, point.y * gridSize);
				});
				ctx.stroke();
			}
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
		const clickX = (event.clientX - rect.left - canvas.width / 2 - offsetX) / (scale * gridSize);
		const clickY = (event.clientY - rect.top - canvas.height / 2 - offsetY) / (scale * gridSize);

		let closest: Body | null = null;
		let minDist = Infinity;

		$bodies.forEach((body) => {
			const dist = Math.sqrt((body.x - clickX) ** 2 + (body.y - clickY) ** 2);
			if (dist < (body.radius / scale) * gridSize && dist < minDist) {
				// Threshold
				minDist = dist;
				closest = body;
			}
		});
		selectedBody.set(closest);

		console.log(closest);
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
