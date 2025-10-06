<script lang="ts">
	import { Play, Pause, FastForward, Rewind, TimerReset, Tag } from 'lucide-svelte';
	import { timeScale, showTag, time } from '$lib/stores';

	function togglePause() {
		$timeScale = $timeScale === 0 ? 1 : 0;
	}
	function accelerate() {
		if ($timeScale < Infinity) {
			$timeScale *= 10;
		}
	}
	function decelerate() {
		$timeScale /= 10;
	}
	function resetTime() {
		$timeScale = 1;
	}
	function showtag() {
		$showTag = !$showTag;
	}

	// Format time for display
	$: formattedTime = new Date($time).toLocaleString();
	$: acceleration = $timeScale === 0 ? 'Paused' : `${$timeScale}x`;
</script>

<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/70 rounded-lg text-white flex flex-col gap-2 items-center p-4">
	<div class="flex gap-2 items-center mb-2">
		<span>Time: {formattedTime}</span>
		<span>Speed: {acceleration}</span>
	</div>
	<div class="flex gap-2 items-center">
		<button class="bg-gray-800/50 p-2 rounded-lg cursor-pointer" onclick={togglePause}>
			{#if $timeScale === 0}
				<Play />
			{:else}
				<Pause />
			{/if}
		</button>
		<button class="bg-gray-800/50 p-2 rounded-lg cursor-pointer" onclick={decelerate}>
			<Rewind />
		</button>
		<button class="bg-gray-800/50 p-2 rounded-lg cursor-pointer" onclick={accelerate}>
			<FastForward />
		</button>
		<button class="bg-gray-800/50 p-2 rounded-lg cursor-pointer" onclick={resetTime}>
			<TimerReset />
		</button>
		<button class="bg-gray-800/50 p-2 rounded-lg cursor-pointer" onclick={showtag}>
			{#if $showTag}
				<Tag color="white" />
			{:else}
				<Tag color="gray" />
			{/if}
		</button>
	</div>
</div>
