// import { init, stores } from './src/shared/stores';
// import { triggerNotionAuthFlow } from './util/auth';
// import chromeStorageSyncStore from './util/chromeStorageSyncStore';
import { getHaloUserInfo, getInformation, getUserOverview } from '../shared/util/halo';

export default defineBackground(() => {
	// console.log(`${chrome.runtime.getManifest().name} v${VERSION}`);

	(async () => {
		console.log('initializing ApplicationStoreManager');
		console.log('getting information');
		const info = await getInformation();
		if ('userId' in info) {
			const { userId, ...cookies } = info;
			// use here
		} else {
			console.error(info);
		}
		// console.log('fetched user id', userId);
		// console.log('fetched halo cookies', cookies);
		// await init([
		// 	chromeStorageSyncStore({ key: 'notion_info' }),
		// 	chromeStorageSyncStore({ key: 'halo_cookies', initial_value: cookies }),
		// 	chromeStorageSyncStore({
		// 		key: 'halo_info',
		// 		initial_value: async () => await getHaloUserInfo({ cookie: cookies }),
		// 	}),
		// 	chromeStorageSyncStore({
		// 		key: 'selected_classes',
		// 		initial_value: async () =>
		// 			(
		// 				await getUserOverview({
		// 					uid: userId,
		// 					cookie: cookies,
		// 				})
		// 			)?.classes?.courseClasses
		// 				?.filter(({ stage }) => stage !== 'POST')
		// 				?.reduce((acc, { courseCode }) => ({ ...acc, [courseCode]: true }), {}),
		// 	}),
		// ]);
		console.log('ApplicationStoreManager initialized');
		// console.log(stores);

		// FIREFOX RESTRICTION: popup is closed during auth, so it needs to be triggered from background script
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			(async () => {
				try {
					if (sender.id !== chrome.runtime.id) return console.log('ids are not equal');
					// msg === 'launch_auth' && (await triggerNotionAuthFlow());
					sendResponse(null);
				} catch (error) {
					sendResponse(JSON.stringify(error));
				}
			})();
			return true; //required if using async/await in a message listener
		});

		// currently broken, see https://github.com/GoogleChrome/developer.chrome.com/issues/2602
		chrome.runtime.onInstalled.addListener(
			({ reason }) => reason === chrome.runtime.OnInstalledReason.INSTALL && chrome.action.openPopup()
		);
	})();
});
