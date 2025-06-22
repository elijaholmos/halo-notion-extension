import { getHaloUserInfo, getInformation, getUserOverview } from '@/shared/util/halo';
import { haloCookies, haloInfo, notionInfo, selectedClasses } from '@/shared/stores';

export default defineBackground(() => {
	// console.log(`${chrome.runtime.getManifest().name} v${VERSION}`);

	(async () => {
		console.log('Background script starting...');
		const info = await getInformation();
		
		if (!info || !('userId' in info)) {
			console.log('User not logged into Halo. Extension will work once user logs in.');
			return;
		}
		
		const { userId, ...cookies } = info;
		
		// Check if we have valid cookies
		if (!cookies.TE1TX0FVVEg || !cookies.TE1TX0NPTlRFWFQ) {
			console.log('Invalid Halo cookies. User needs to log in again.');
			return;
		}
		
		console.log('User authenticated with Halo, fetching data...');
		
		// Set cookies first
		haloCookies.set(cookies);

		// Fetch and set the user's profile information
		try {
			const userInfo = await getHaloUserInfo({ cookie: cookies });
			if (userInfo) {
				haloInfo.set(userInfo);
			}
		} catch (error) {
			console.error('Failed to get user information:', error);
		}

		// Fetch the user's classes and set the default selections
		try {
			const overview = await getUserOverview({ cookie: cookies, uid: userId });
			if (overview?.classes?.courseClasses) {
				const classesToSelect = overview.classes.courseClasses
					.filter(({ stage }) => stage !== 'POST')
					.reduce((acc, { courseCode }) => ({ ...acc, [courseCode]: true }), {});
				selectedClasses.set(classesToSelect);
			}
		} catch (error) {
			console.error('Failed to get user overview:', error);
		}

		console.log('Background script initialization complete');

		// FIREFOX RESTRICTION: popup is closed during auth, so it needs to be triggered from background script
		chrome.runtime.onMessage.addListener((msg: any, sender: any, sendResponse: any) => {
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
			({ reason }: { reason: chrome.runtime.OnInstalledReason }) =>
				reason === chrome.runtime.OnInstalledReason.INSTALL && chrome.action.openPopup()
		);
	})();
});
