<!--
  ~ Copyright (C) 2024 Elijah Olmos
  ~
  ~ This program is free software: you can redistribute it and/or modify
  ~ it under the terms of the GNU Affero General Public License as
  ~ published by the Free Software Foundation, version 3.
  ~
  ~ This program is distributed in the hope that it will be useful,
  ~ but WITHOUT ANY WARRANTY; without even the implied warranty of
  ~ MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  ~ GNU Affero General Public License for more details.
  ~
  ~ You should have received a copy of the GNU Affero General Public License
  ~ along with this program. If not, see <http://www.gnu.org/licenses/>.
-->
<script lang="ts">
	import { notionInfo, haloCookies, haloInfo, selectedClasses } from '@/shared/stores';
	import { AUTHORIZATION_KEY, CONTEXT_KEY } from '@/shared/util/halo';
	import Error from './components/Error.svelte';
	import ImportAssignments from './ImportAssignments.svelte';
	import Login from './Login.svelte';

	console.log('in popup');
	console.log('notion_info', $notionInfo);
	console.log('cookies', $haloCookies);
	console.log('halo_info', $haloInfo);

	// Svelte 5: Use $derived() instead of reactive statements
	const access_token = $derived($notionInfo?.access_token);
	const halo_logged_in = $derived(
		!$haloCookies?.hasOwnProperty(AUTHORIZATION_KEY) || 
		!$haloCookies?.hasOwnProperty(CONTEXT_KEY)
	);
	const roles = $derived($haloInfo?.roles);
</script>

<main>
	{#if halo_logged_in}
		<Error error={null}>
			<p class="text-center">
				You need to log into <a href="https://halo.gcu.edu" class="link" target="_blank">halo.gcu.edu</a> for the
				extension to work
			</p>
		</Error>
	{:else if !roles?.some(({ baseRole, isActive }) => baseRole === 'Student' && isActive)}
		<Error error={null}>
			<p>You must be an active GCU student to use this extension</p>
		</Error>
	{:else if !access_token}
		<Login />
	{:else}
		<ImportAssignments />
	{/if}
</main>
