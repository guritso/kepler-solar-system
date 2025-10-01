<script lang="ts">
	import { coordinates } from '$lib/stores';

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

	$effect(() => {
		if (!canvas) return;

		ctx = canvas.getContext('2d')!;

		resize();

		window.addEventListener('resize', resize);

		return () => {
			window.removeEventListener('resize', resize);
		};
	});

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
		ctx.scale(scale, scale);

		ctx.strokeStyle = 'gray';
		ctx.lineWidth = 0.5 / scale;

		// temporary grid
		const canvasSize = 300000;

		for (let x = -canvasSize / 2; x < canvasSize / 2; x += gridSize) {
			ctx.beginPath();
			ctx.moveTo(x, -canvasSize / 2);
			ctx.lineTo(x, canvasSize / 2);
			ctx.stroke();
		}

		for (let y = -canvasSize / 2; y < canvasSize / 2; y += gridSize) {
			ctx.beginPath();
			ctx.moveTo(-canvasSize / 2, y);
			ctx.lineTo(canvasSize / 2, y);
			ctx.stroke();
		}

		// temporary sun
		ctx.fillStyle = 'yellow';
		ctx.beginPath();
		ctx.arc(0, 0, 5, 0, Math.PI * 2);
		ctx.fill();

		ctx.restore();
	}

	// pan events
	function pointerdown(event: PointerEvent) {
		event.preventDefault();

		isDragging = true;
		startX = event.clientX - offsetX;
		startY = event.clientY - offsetY;
	}

	function pointerup() {
		isDragging = false;
	}

	function pointerleave() {
		isDragging = false;
	}

	const zoomMax = 10;
	const zoomMin = 0.1;

	// zoom events
	function wheel(event: WheelEvent) {
		event.preventDefault();

		const zoomSpeed = 0.1;
		const oldScale = scale;

		scale *= event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
		scale = Math.max(zoomMin, Math.min(scale, zoomMax)); // limit zoom

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
	});
</script>

<canvas
	class="absolute inset-0"
	style="touch-action: none;"
	bind:this={canvas}
	onpointerdown={pointerdown}
	onpointerup={pointerup}
	onpointerleave={pointerleave}
	onwheel={wheel}
	onpointermove={pointermove}
></canvas>
