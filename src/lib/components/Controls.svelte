<script lang="ts">
	import { Play, Pause, FastForward, Rewind, TimerReset, Tag, Orbit, CircleSmall, Torus, Bubbles } from 'lucide-svelte';
	import {
		timeScale,
		showTag,
		simulationTime,
		resetTime,
		resetBodies,
		showOrbits,
		showDwarf,
		showComets,
		showAsteroids
	} from '$lib/stores';

	function togglePause() {
		$timeScale = $timeScale === 0 ? 1 : 0;
	}
	function accelerate() {
		if ($timeScale === -1) {
			$timeScale = 1;
			return;
		}

		if ($timeScale < 0) {
			$timeScale /= 10;
			return;
		}

		$timeScale *= 10;
	}

	function decelerate() {
		if ($timeScale < 0) {
			$timeScale *= 10;
			return;
		}

		if ($timeScale > 1) {
			$timeScale /= 10;
		} else {
			$timeScale = -1;
		}
	}

	function resetSimulation() {
		$timeScale = 1;
		simulationTime.set(Date.now());
		resetTime.set(true);
		resetBodies();
	}
	function showtag() {
		$showTag = !$showTag;
	}

	// Format time for display
	let formattedTime = $derived(new Date($simulationTime).toLocaleString());
	let acceleration = $derived(
		$timeScale === 0 ? 'Paused' : $timeScale > 0 ? `${$timeScale}x` : `-${Math.abs($timeScale)}x`
	);
	function showorbits() {
		$showOrbits = !$showOrbits;
	}
	function showdwarf() {
		$showDwarf = !$showDwarf;
	}
	function showcomets() {
		$showComets = !$showComets;
	}
	function showasteroids() {
		$showAsteroids = !$showAsteroids;
	}
</script>

<div
	class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/70 rounded-lg text-white flex flex-col gap-2 items-center p-4"
>
	<div class="flex gap-2 items-center mb-2">
		<span>Time: {formattedTime}</span>
		<span>Speed: {acceleration}</span>
	</div>
	<div class="flex gap-2 items-center">
		<button
		aria-label="Pause"
		title="Pause"
			class="bg-gray-800/50 p-2 rounded-lg cursor-pointer"
			onclick={togglePause}
			>
			{#if $timeScale === 0}
			<Play />
			{:else}
			<Pause />
			{/if}
		</button>
		<button
			aria-label="Decelerate"
			title="Decelerate"
			class="bg-gray-800/50 p-2 rounded-lg cursor-pointer"
			onclick={decelerate}
		>
		<Rewind />
		</button>
		<button
			aria-label="Accelerate"
			title="Accelerate"
			class="bg-gray-800/50 p-2 rounded-lg cursor-pointer"
			onclick={accelerate}
		>
			<FastForward />
		</button>
		<button
		aria-label="Reset simulation"
		title="Reset simulation"
		class="bg-gray-800/50 p-2 rounded-lg cursor-pointer"
		onclick={resetSimulation}
		>
			<TimerReset />
		</button>
		<button
		aria-label="Show tag"
		title="Show tag"
		class="bg-gray-800/50 p-2 rounded-lg cursor-pointer"
		onclick={showtag}
		>
		{#if $showTag}
		<Tag color="white" />
		{:else}
		<Tag color="gray" />
		{/if}
	</button>
	<button
		aria-label="Show orbits"
		title="Show orbits"
		class="bg-gray-800/50 p-2 rounded-lg cursor-pointer"
		onclick={showorbits}
	>
		{#if $showOrbits}
			<Orbit color="white" />
		{:else}
			<Orbit color="gray" />
		{/if}
	</button>
	<button
	aria-label="Show dwarf Planets"
	title="Show dwarf planets"
	class="bg-gray-800/50 p-2 rounded-lg cursor-pointer"
	onclick={showdwarf}
>
	{#if $showDwarf}
		<CircleSmall color="white" />
	{:else}
		<CircleSmall color="gray" />
	{/if}
</button>
<button
aria-label="Show comets"
title="Show comets"
class="bg-gray-800/50 p-2 rounded-lg cursor-pointer"
onclick={showcomets}
>
	{#if $showComets}
		<Torus color="white" />
	{:else}
		<Torus color="gray" />
	{/if}
</button>
<button
aria-label="Show asteroids"
title="Show asteroids"
class="bg-gray-800/50 p-2 rounded-lg cursor-pointer"
onclick={showasteroids}
>
	{#if $showAsteroids}
		<Bubbles color="white" />
	{:else}
		<Bubbles color="gray" />
	{/if}
</button>
</div>
</div>
