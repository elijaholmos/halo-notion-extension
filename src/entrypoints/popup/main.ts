import { reconstruct } from '@/entrypoints/popup/stores';
import Popup from '@/entrypoints/popup/Popup.svelte';
import './style.css';

try {
	// NEEDS to be called for stores to be shared between background & popup
	await reconstruct();
} catch (e) {
	console.error('fatal error reconstructing stores', e);
}

export default new Popup({ target: document.body });
