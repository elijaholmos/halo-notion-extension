<script>
	import { stores } from '../stores';
	import { getHaloCookies, getUserId, getUserOverview } from '../util/halo';
	import { importSingleAssignment, prepClassAssignmentImport } from '../util/notion';
	import Error from './components/Error.svelte';
	import ProgressBar from './components/ProgressBar.svelte';
	import LazyLoader from './LazyLoader.svelte';
	const { halo_cookies } = stores;

	// ----- state -----
	let error;
	let classes = [];
	let isImportingAssignments = false;
	let currentCourse = {};
	$: ({ value, max, courseCode, done } = currentCourse);

	const importAssignments = async function () {
		if (isImportingAssignments) return;
		isImportingAssignments = true;
		currentCourse.done = false;
		const cookie = await getHaloCookies(); //get latest cookie

		// get full class objects
		const { classes } = await getUserOverview({
			uid: await getUserId({ cookie }),
			cookie,
		});

		console.log('retrieved classes', classes);

		for (const { slugId } of classes.courseClasses) {
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
		for (const { courseCode } of class_res.classes.courseClasses) classes.push(courseCode);
	};
</script>

<LazyLoader {lazyLoad}>
	{#if error}
		<Error {error} />
	{:else}
		<div class="text-center mt-3">
			<h1 class="text-lg">Active Classes</h1>
			{#each classes as code}
				<div class="badge badge-primary badge-md m-1">{code}</div>
			{:else}
				<div class="badge badge-error badge-md">No active classes</div>
			{/each}
		</div>

		<br />

		<div class="flex flex-col items-center">
			<button class="btn btn-primary btn-md text-lg" on:click={importAssignments}> Import Assignments </button>
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
