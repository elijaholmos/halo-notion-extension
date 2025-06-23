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
  import { AlertCircle } from "@lucide/svelte";
  import DiscordLogo from "../../../assets/discord.svg";
  import Button from "$lib/components/ui/button/button.svelte";
    let { error = null, children }: { error?: string | null, children?: any } = $props();
    !!error && console.error(error);
</script>

<div class="w-full flex flex-col items-center h-full gap-4">
		<div class="alert alert-error p-3 m-4 text-center rounded-lg flex flex-col gap-2">
      <div class="flex items-center gap-2 justify-center">
        <AlertCircle class="w-5 h-5" />
        <span class="font-semibold text-xl">
          Error
        </span>
      </div>
      <span class="font-semibold text-lg">
        {error ?? 'Join the discord for support'}
      </span>
      {@render children()}
		</div>
		<a href="https://discord.gg/mY563YHScv" target="_blank">
      <Button>
        <img src={DiscordLogo} class="h-6 w-6" alt="Discord logo" />
        Support
      </Button>
    </a>
	</div>