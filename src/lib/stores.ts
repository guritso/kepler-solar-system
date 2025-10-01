import { writable } from 'svelte/store';

export const coordinates = writable({ x: 0, y: 0, z: 1, mx: 0, my: 0 });
