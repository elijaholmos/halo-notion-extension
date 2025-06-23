import { mount } from 'svelte';
import Popup from './App.svelte';
import '../../assets/app.css';

const app = mount(Popup, {
    target: document.getElementById('app')!,
})

export default app;
