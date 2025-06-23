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
	import { notionInfo, haloCookies, haloInfo, selectedClasses } from '../../../shared/stores';
	import { getInformation, getUserId, getUserOverview } from '../../../shared/util/halo';
	// import { importSingleAssignment, prepClassAssignmentImport } from './util/notion';
	import Error from '../components/Error.svelte';
	import ProgressBar from '../components/ProgressBar.svelte';
	import LazyLoader from '../components/LazyLoader.svelte';

	// Svelte 5: Use $state() for local state
	let errorMessage = $state<string | null>(null);
	let classes = $state<string[]>([]);
	let isImportingAssignments = $state(false);
	let currentCourse = $state({
		value: 0,
		max: 0,
		courseCode: '',
		done: false,
	});

	// Svelte 5: Use $derived() for computed values
	const { value, max, courseCode, done } = $derived(currentCourse);

	const logout = async function () {
		notionInfo.set(null);
		console.log('logged out of notion!');
	};

	const importAssignments = async function () {
		if (isImportingAssignments) return;
		isImportingAssignments = true;
		currentCourse.done = false;
		const info = await getInformation();
		if ('userId' in info) {
			const { userId, ...cookie } = info;
			const userOverview = await getUserOverview({ uid: userId, cookie });
			if (!userOverview) return;
			const { classes } = userOverview;
			console.log('retrieved classes', classes);
			if (!classes) return;

			// for (const { slugId } of classes.courseClasses.filter(
			// 	({ courseCode }) => $selectedClasses?.[courseCode] === true
			// )) {
			// 	let val = 0; //tracking current assignment no. for progressbar
			// 	const { current_class, totalpoints, max } = await prepClassAssignmentImport({ slugId, cookie });
			// 	for (const unit of current_class.units) {
			// 		for (const assessment of unit.assessments) {
			// 			try {
			// 				console.log(currentCourse);
			// 				await importSingleAssignment({ current_class, totalpoints, unit, assessment });
			// 				currentCourse = { max, value: ++val, courseCode: current_class.courseCode };
			// 			} catch (e) {
			// 				console.error(e);
			// 				await importSingleAssignment({ current_class, totalpoints, unit, assessment });
			// 				currentCourse = { max, value: ++val, courseCode: current_class.courseCode };
			// 			}
			// 		}
			// 	}
		}
		currentCourse.done = true;
		isImportingAssignments = false;
	};

	const lazyLoad = async function () {
		// Get the current value from the store
		let cookie;
		haloCookies.subscribe((value) => {
			cookie = value;
		})();

		if (!cookie) {
			errorMessage = 'No Halo cookies found. Please log into Halo first.';
			return;
		}

		const uid = await getUserId({ cookie });
		if (!uid) {
			errorMessage = 'Failed to get user ID';
			return;
		}

		const class_res = await getUserOverview({ uid, cookie });
		console.log(class_res);
		if (class_res?.classes?.courseClasses) {
			classes = class_res.classes.courseClasses
				.filter(({ stage }) => stage !== 'POST')
				.map(({ courseCode }) => courseCode);
		}
	};
</script>

<LazyLoader {lazyLoad}>
	{#if errorMessage}
		<Error error={errorMessage}>
			<div class="text-center">
				<p class="font-semibold text-2xl">Error! {errorMessage}</p>
			</div>
		</Error>
	{:else}
		<div class="text-center mt-3">
			<h1 class="text-lg font-semibold">Select Classes to Import</h1>
			<div class="form-control">
				{#each Object.keys($selectedClasses) as code}
					<label class="label cursor-pointer justify-around pb-0">
						<div class="badge badge-primary badge-md m-1">{code}</div>
						<input type="checkbox" class="toggle toggle-primary" bind:checked={$selectedClasses[code]} />
					</label>
				{:else}
					<div class="badge badge-error badge-md">No active classes</div>
				{/each}
			</div>
		</div>

		<br />

		<div class="flex flex-col items-center">
			<button class="btn btn-primary btn-md text-lg" onclick={importAssignments}> Import Assignments </button>
			<button class="btn btn-secondary btn-md text-lg" onclick={logout}> Logout </button>
			<br />
			{#if isImportingAssignments}
				<ProgressBar {max} {value} />
				{#if !!courseCode}
					<p>Importing assignments for {courseCode}...</p>
				{:else}
					<p>Importing assignments...</p>
				{/if}
				<p class="font-bold">Do NOT close this window</p>
			{:else if done}
				<p>Assignments successfully imported!</p>
			{/if}
		</div>
	{/if}
</LazyLoader>
