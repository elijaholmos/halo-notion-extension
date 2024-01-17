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

<!--
  ~ Copyright (C) 2023 Elijah Olmos
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
	import Error from './components/Error.svelte';

	//state
	let error;

	const launchAuthFlow = async function () {
		const message = await chrome.runtime.sendMessage('launch_auth');
		if (!!message) error = { message };
	};
</script>

{#if error}
	<Error {error} />
{:else}
	<div class="flex flex-col items-center">
		<img src="../static/logo.png" alt="IHA Logo" class="w-56 m-4" />
		<h1 class="text-xl">Welcome!</h1>
		<span class="h-4" />
		<a id="login-button" class="dsl-notion-btn" title="Login with Notion" on:click={launchAuthFlow}>
			<span class="dsl-notion-btn-icon" />
			<span>Login with Notion</span>
		</a>
		<a href="https://elijaho.notion.site/Import-Halo-Assignments-bb29114c25294a14a2fc24247fbabe53" target="_blank">
			<button class="btn btn-md btn-primary gap-2">
				<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M4 4V20C4 21.1046 4.89543 22 6 22L18 22C19.1046 22 20 21.1046 20 20V8.34162C20 7.8034 19.7831 7.28789 19.3982 6.91161L14.9579 2.56999C14.5842 2.20459 14.0824 2 13.5597 2L6 2C4.89543 2 4 2.89543 4 4Z"
						stroke="white"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M14 2V6C14 7.10457 14.8954 8 16 8H20"
						stroke="white"
						stroke-width="2"
						stroke-linejoin="round"
					/>
				</svg>

				Instructions
			</button>
		</a>
	</div>
{/if}

<!--
	todo:
	fix login notion icon formatting
	test auth flow again
	upload h2n icon
	add zip plugin
	publish extension asap
	create Notion tutorial doc
	test firefox?
-->
<style>
	.dsl-notion-btn {
		display: inline-block;
		border: none;
		padding: 8px 14px 8px 10px;
		margin: 10px 0 20px;
		font-size: 14px;
		text-transform: none;
		text-decoration: none;
		transition: background 0.3s ease;
		white-space: normal;
		background-image: initial;
		background-color: #5865f2;
		border-color: initial;
		color: #ffffff;
		text-decoration-color: initial;
	}

	.dsl-notion-btn:hover {
		background-image: initial;
		background-color: #8189e5;
		cursor: pointer;
	}

	.dsl-notion-btn-icon {
		background-image: url('../static/notion-logo.svg');
		background-repeat: no-repeat;
		background-size: 100%;
		display: inline-block;
		height: 20px;
		width: 20px;
		vertical-align: middle;
		margin: -2px 6px 0;
	}
</style>
