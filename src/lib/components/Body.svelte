<script lang="ts">
	import { selectedBody, bodies } from '$lib/stores';

	let x = $state(0);
	let y = $state(0);
	let vx = $state(0);
	let vy = $state(0);

	$effect(() => {
		const body = $bodies.find((body) => body.name === $selectedBody?.name);
		if (body) {
			x = body.x;
			y = body.y;
			vx = body.vx;
			vy = body.vy;
		}
	});
</script>

{#if $selectedBody}
	<div class="info-panel fixed top-4 right-4 bg-black/50 text-gray-400 p-4 rounded">
		<h3>{$selectedBody.name}</h3>
		<p>Mass: {$selectedBody.mass.toExponential(2)} kg</p>
		<p>Radius: {$selectedBody.radius.toFixed(2)} m</p>
		<p>Pos: ({x.toFixed(2)}, {y.toFixed(2)})</p>
		<p>Vel: ({vx.toExponential(2)}, {vy.toExponential(2)})</p>
	</div>
{/if}
