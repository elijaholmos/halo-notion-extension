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

/*
 * Copyright (C) 2022 Elijah Olmos
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

import { init, stores } from './stores';
import { triggerNotionAuthFlow } from './util/auth';
import chromeStorageSyncStore from './util/chromeStorageSyncStore';
import { getHaloCookies, getHaloUserInfo } from './util/halo';
// no stores - code is not shared between background and popup

const VERSION = chrome.runtime.getManifest().version;
const COOKIE_KEY = 'halo_cookies';

(async function () {
	console.log(`${chrome.runtime.getManifest().name} v${VERSION}`);

	console.log('initializing ApplicationStoreManager');
	const initial_cookies = await getHaloCookies();
	await init([
		chromeStorageSyncStore({ key: 'notion_info' }),
		chromeStorageSyncStore({ key: COOKIE_KEY, initial_value: initial_cookies }),
		chromeStorageSyncStore({ key: 'halo_info', initial_value: () => getHaloUserInfo({ cookie: initial_cookies }) }),
	]);
	console.log('ApplicationStoreManager initialized');
	console.log(stores);

	// FIREFOX RESTRICTION: popup is closed during auth, so it needs to be triggered from background script
	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		(async () => {
			try {
				if (sender.id !== chrome.runtime.id) return console.log('ids are not equal');
				msg === 'launch_auth' && (await triggerNotionAuthFlow());
				sendResponse(null);
			} catch (error) {
				sendResponse(JSON.stringify(error?.message || error));
			}
		})();
		return true; //required if using async/await in a message listener
	});

	//halo_cookies.set(await getHaloCookies()); //should be unnecessary w initial_value

	// currently broken, see https://github.com/GoogleChrome/developer.chrome.com/issues/2602
	chrome.runtime.onInstalled.addListener(
		({ reason }) => reason === chrome.runtime.OnInstalledReason.INSTALL && chrome.action.openPopup()
	);
})();
