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
<script>
	import { stores } from '../stores';
	import { getInformation, getUserId, getUserOverview } from '../util/halo';
	import { importSingleAssignment, prepClassAssignmentImport } from '../util/notion';
	import Error from './components/Error.svelte';
	import ProgressBar from './components/ProgressBar.svelte';
	import LazyLoader from './LazyLoader.svelte';
	const { halo_cookies, selected_classes, notion_info } = stores;

	// ----- state -----
	let error;
	let classes = [];
	let isImportingAssignments = false;
	let currentCourse = {};
	$: ({ value, max, courseCode, done } = currentCourse);

	const logout = async function () {
		notion_info.set(null);
		console.log('logged out of notion!');
	};

	const importAssignments = async function () {
		if (isImportingAssignments) return;
		isImportingAssignments = true;
		currentCourse.done = false;
		const { ['userId']: _, ...cookie } = await getInformation(); //get latest cookie

		// get full class objects
		const { classes } = await getUserOverview({
			uid: await getUserId({ cookie }),
			cookie,
		});

		console.log('retrieved classes', classes);

		for (const { slugId } of classes.courseClasses.filter(
			({ courseCode }) => $selected_classes?.[courseCode] === true
		)) {
			let val = 0; //tracking current assignment no. for progressbar
			const { current_class, totalpoints, max } = await prepClassAssignmentImport({ slugId, cookie });
			for (const unit of current_class.units) {
				for (const assessment of unit.assessments) {
					try {
						console.log(currentCourse);
						await importSingleAssignment({ current_class, totalpoints, unit, assessment });
						currentCourse = { max, value: ++val, courseCode: current_class.courseCode };
					} catch (e) {
						console.error(e);
						await importSingleAssignment({ current_class, totalpoints, unit, assessment });
						currentCourse = { max, value: ++val, courseCode: current_class.courseCode };
					}
				}
			}
		}
		currentCourse.done = true;
		isImportingAssignments = false;
	};

	const lazyLoad = async function () {
		const cookie = halo_cookies.get();
		const uid = await getUserId({ cookie });
		const class_res = await getUserOverview({ uid, cookie });
		console.log(class_res);
		for (const { courseCode } of class_res.classes.courseClasses.filter(({ stage }) => stage !== 'POST'))
			classes.push(courseCode);
	};
</script>

<LazyLoader {lazyLoad}>
	{#if error}
		<Error {error} />
	{:else}
		<div class="text-center mt-3">
			<h1 class="text-lg font-semibold">Select Classes to Import</h1>
			<div class="form-control">
				{#each Object.keys($selected_classes) as code}
					<label class="label cursor-pointer justify-around pb-0">
						<div class="badge badge-primary badge-md m-1">{code}</div>
						<input type="checkbox" class="toggle toggle-primary" bind:checked={$selected_classes[code]} />
					</label>
				{:else}
					<div class="badge badge-error badge-md">No active classes</div>
				{/each}
			</div>
		</div>

		<br />

		<div class="flex flex-col items-center">
			<button class="btn btn-primary btn-md text-lg" on:click={importAssignments}> Import Assignments </button>
			<button class="btn btn-secondary btn-md text-lg" on:click={logout}> Logout </button>
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
