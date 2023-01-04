/*
 * Copyright (C) 2023 Elijah Olmos
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { stores } from '../stores';
const url = 'https://halo-notion.vercel.app/api';

/**
 * @typedef NotionToken
 * @type {object}
 * @property {string} access_token An access token used to authorize requests to the Notion API.
 * @property {string} workspace_id The ID of the workspace where this authorization took place.
 * @property {string} [workspace_name] A human-readable name which can be used to display this authorization in UI.
 * @property {string} [workspace_icon] A URL to an image which can be used to display this authorization in UI.
 * @property {string} bot_id An identifier for this authorization.
 * @property {object} owner An object containing information about who can view and share this integration. `{ "workspace": true }` will be returned for installations of workspace-level tokens. For user level tokens, a user object will be returned.
 */

/**
 * @returns {Promise<NotionToken | null>}
 */
const convertNotionAuthCodeToToken = async function ({ auth_code }) {
	const res = await fetch(`${url}/code`, {
		method: 'POST',
		//application/x-www-form-urlencoded to avoid preflight which doesn't work w/ my vercel funcs for some reason
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code: auth_code,
			redirect_uri: chrome.identity.getRedirectURL(),
		}).toString(),
	});

	return await res.json().catch(() => null);
};

export const triggerNotionAuthFlow = function () {
	return new Promise((resolve, reject) => {
		// CHROME RESTRICTION: is documented as returning a promise, does not actually return a promise
		chrome.identity.launchWebAuthFlow(
			{
				url: `https://api.notion.com/v1/oauth/authorize?client_id=c4caddd8-0c2c-459c-8b86-26dba209bca3&response_type=code&owner=user&redirect_uri=${chrome.identity.getRedirectURL()}`,
				interactive: true,
			},
			async (redirect_url) => {
				try {
					if (!redirect_url) return console.error('No redirect url');
					const tokens = await convertNotionAuthCodeToToken({
						auth_code: new URL(redirect_url).searchParams.get('code'),
					});

					console.log('notion access approved', tokens);
					//store tokens locally
					stores.notion_info.set(tokens);

					//set uninstall URL for internal purposes
					// chrome.runtime.setUninstallURL(
					// 	`http://www.glassintel.com/elijah/programs/halodiscord/uninstall?${new URLSearchParams({
					// 		discord_uid,
					// 		access_token,
					// 	}).toString()}`
					// );
					resolve();
				} catch (e) {
					reject(e);
				}
			}
		);
	});
};
