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
    let { error = null, children }: { error: string | null, children: any } = $props();
    !!error && console.error(error);
</script>

<div class="w-full flex flex-col items-center h-full">
		<div class="alert alert-error shadow-lg text-base p-3 m-4 text-center">
                <span>Error! {error ?? 'Join the discord for support'}</span>
                {@render children()}
		</div>
		<a href="https://discord.gg/mY563YHScv" target="_blank">
			<button class="btn gap-2 bg-discord hover:bg-discord-hover m-2 p-2 text-white">
				<img
					class="h-6 w-6"
					src="../static/Discord-Logo-White.svg"
					srcset="../static/Discord-Logo-White.svg"
					alt="Discord logo"
				/>
                Support
			</button>
		</a>
	</div>