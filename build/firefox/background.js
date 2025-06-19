import { g as getInformation, i as init, c as chromeStorageSyncStore, s as stores, a as getHaloUserInfo, b as getUserOverview } from './halo-Z9JupVFD.js';

/*
 * Copyright (C) 2024 Elijah Olmos
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
			redirect_uri: browser.identity.getRedirectURL(),
		}).toString(),
	});

	return await res.json().catch(() => null);
};

const triggerNotionAuthFlow = function () {
	return new Promise((resolve, reject) => {
		// CHROME RESTRICTION: is documented as returning a promise, does not actually return a promise
		browser.identity.launchWebAuthFlow(
			{
				url: `https://api.notion.com/v1/oauth/authorize?client_id=c4caddd8-0c2c-459c-8b86-26dba209bca3&response_type=code&owner=user&redirect_uri=${browser.identity.getRedirectURL()}`,
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
					// browser.runtime.setUninstallURL(
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

/*
 * Copyright (C) 2024 Elijah Olmos
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

// no stores - code is not shared between background and popup

const VERSION = browser.runtime.getManifest().version;

(async function () {
	console.log(`${browser.runtime.getManifest().name} v${VERSION}`);

	console.log('initializing ApplicationStoreManager');
	const { ['userId']: userId, ...cookies } = await getInformation();
	console.log('fetched user id', userId);
	console.log('fetched halo cookies', cookies);
	await init([
		chromeStorageSyncStore({ key: 'notion_info' }),
		chromeStorageSyncStore({ key: 'halo_cookies', initial_value: cookies }),
		chromeStorageSyncStore({
			key: 'halo_info',
			initial_value: async () => await getHaloUserInfo({ cookie: cookies }),
		}),
		chromeStorageSyncStore({
			key: 'selected_classes',
			initial_value: async () =>
				(
					await getUserOverview({
						uid: userId,
						cookie: cookies,
					})
				)?.classes?.courseClasses
					?.filter(({ stage }) => stage !== 'POST')
					?.reduce((acc, { courseCode }) => ({ ...acc, [courseCode]: true }), {}),
		}),
	]);
	console.log('ApplicationStoreManager initialized');
	console.log(stores);

	// FIREFOX RESTRICTION: popup is closed during auth, so it needs to be triggered from background script
	browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		(async () => {
			try {
				if (sender.id !== browser.runtime.id) return console.log('ids are not equal');
				msg === 'launch_auth' && (await triggerNotionAuthFlow());
				sendResponse(null);
			} catch (error) {
				sendResponse(JSON.stringify(error?.message || error));
			}
		})();
		return true; //required if using async/await in a message listener
	});

	// currently broken, see https://github.com/GoogleChrome/developer.browser.com/issues/2602
	browser.runtime.onInstalled.addListener(
		({ reason }) => reason === browser.runtime.OnInstalledReason.INSTALL && browser.action.openPopup()
	);
})();
