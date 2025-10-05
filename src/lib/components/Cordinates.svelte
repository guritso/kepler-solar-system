<script lang="ts">
	import { coordinates, time } from '$lib/stores';
</script>

<div class="absolute bottom-2 right-2 text-gray-400 bg-black/50 p-2 rounded-lg text-xs text-right">
	<p>{$coordinates.z.toFixed(3)}</p>
	<p>{$coordinates.mx.toFixed(2)}, {$coordinates.my.toFixed(2)}</p>
	<p>{$coordinates.x.toFixed(2)}, {$coordinates.y.toFixed(2)}</p>
	<p>{new Date($time)}</p>
</div>
