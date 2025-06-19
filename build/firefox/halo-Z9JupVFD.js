/** @returns {void} */
function noop() {}

/**
 * @template T
 * @template S
 * @param {T} tar
 * @param {S} src
 * @returns {T & S}
 */
function assign(tar, src) {
	// @ts-ignore
	for (const k in src) tar[k] = src[k];
	return /** @type {T & S} */ (tar);
}

// Adapted from https://github.com/then/is-promise/blob/master/index.js
// Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
/**
 * @param {any} value
 * @returns {value is PromiseLike<any>}
 */
function is_promise(value) {
	return (
		!!value &&
		(typeof value === 'object' || typeof value === 'function') &&
		typeof (/** @type {any} */ (value).then) === 'function'
	);
}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

/**
 * @param {Function[]} fns
 * @returns {void}
 */
function run_all(fns) {
	fns.forEach(run);
}

/**
 * @param {any} thing
 * @returns {thing is Function}
 */
function is_function(thing) {
	return typeof thing === 'function';
}

/** @returns {boolean} */
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}

let src_url_equal_anchor;

/**
 * @param {string} element_src
 * @param {string} url
 * @returns {boolean}
 */
function src_url_equal(element_src, url) {
	if (element_src === url) return true;
	if (!src_url_equal_anchor) {
		src_url_equal_anchor = document.createElement('a');
	}
	// This is actually faster than doing URL(..).href
	src_url_equal_anchor.href = url;
	return element_src === src_url_equal_anchor.href;
}

/** @returns {boolean} */
function is_empty(obj) {
	return Object.keys(obj).length === 0;
}

function subscribe(store, ...callbacks) {
	if (store == null) {
		for (const callback of callbacks) {
			callback(undefined);
		}
		return noop;
	}
	const unsub = store.subscribe(...callbacks);
	return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}

/** @returns {void} */
function component_subscribe(component, store, callback) {
	component.$$.on_destroy.push(subscribe(store, callback));
}

function create_slot(definition, ctx, $$scope, fn) {
	if (definition) {
		const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
		return definition[0](slot_ctx);
	}
}

function get_slot_context(definition, ctx, $$scope, fn) {
	return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}

function get_slot_changes(definition, $$scope, dirty, fn) {
	if (definition[2] && fn) {
		const lets = definition[2](fn(dirty));
		if ($$scope.dirty === undefined) {
			return lets;
		}
		if (typeof lets === 'object') {
			const merged = [];
			const len = Math.max($$scope.dirty.length, lets.length);
			for (let i = 0; i < len; i += 1) {
				merged[i] = $$scope.dirty[i] | lets[i];
			}
			return merged;
		}
		return $$scope.dirty | lets;
	}
	return $$scope.dirty;
}

/** @returns {void} */
function update_slot_base(
	slot,
	slot_definition,
	ctx,
	$$scope,
	slot_changes,
	get_slot_context_fn
) {
	if (slot_changes) {
		const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
		slot.p(slot_context, slot_changes);
	}
}

/** @returns {any[] | -1} */
function get_all_dirty_from_scope($$scope) {
	if ($$scope.ctx.length > 32) {
		const dirty = [];
		const length = $$scope.ctx.length / 32;
		for (let i = 0; i < length; i++) {
			dirty[i] = -1;
		}
		return dirty;
	}
	return -1;
}

const subscriber_queue = [];

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 *
 * https://svelte.dev/docs/svelte-store#writable
 * @template T
 * @param {T} [value] initial value
 * @param {import('./public.js').StartStopNotifier<T>} [start]
 * @returns {import('./public.js').Writable<T>}
 */
function writable(value, start = noop) {
	/** @type {import('./public.js').Unsubscriber} */
	let stop;
	/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
	const subscribers = new Set();
	/** @param {T} new_value
	 * @returns {void}
	 */
	function set(new_value) {
		if (safe_not_equal(value, new_value)) {
			value = new_value;
			if (stop) {
				// store is ready
				const run_queue = !subscriber_queue.length;
				for (const subscriber of subscribers) {
					subscriber[1]();
					subscriber_queue.push(subscriber, value);
				}
				if (run_queue) {
					for (let i = 0; i < subscriber_queue.length; i += 2) {
						subscriber_queue[i][0](subscriber_queue[i + 1]);
					}
					subscriber_queue.length = 0;
				}
			}
		}
	}

	/**
	 * @param {import('./public.js').Updater<T>} fn
	 * @returns {void}
	 */
	function update(fn) {
		set(fn(value));
	}

	/**
	 * @param {import('./public.js').Subscriber<T>} run
	 * @param {import('./private.js').Invalidator<T>} [invalidate]
	 * @returns {import('./public.js').Unsubscriber}
	 */
	function subscribe(run, invalidate = noop) {
		/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
		const subscriber = [run, invalidate];
		subscribers.add(subscriber);
		if (subscribers.size === 1) {
			stop = start(set, update) || noop;
		}
		run(value);
		return () => {
			subscribers.delete(subscriber);
			if (subscribers.size === 0 && stop) {
				stop();
				stop = null;
			}
		};
	}
	return { set, update, subscribe };
}

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


/**
 * A Svelte store that syncs with `browser.storage.sync`.
 *
 * Changes to the store update the Chrome Sync storage, and
 * changes to the Chrome Sync storage update the store.
 */
class ChromeStorageSyncStore {
	constructor({ key, initial_value }) {
		return (async () => {
			console.log(`creating ${key} store`);
			this.key = key;
			this.store = writable(initial_value);
			this.value = null;

			browser.storage.onChanged.addListener(
				(changes, areaName) =>
					areaName === 'sync' && changes.hasOwnProperty(key) && this.#setStoreOnly(changes[key].newValue)
			);

			// browser.storage.sync.get(key, (item) => {
			// 	console.log(`in callback for ${key}`, initial_value, item);
			// 	//if initial_value null, load from localstorage (if localstorage item exists)
			// 	initial_value === null && !!Object.keys(item).length ? this.set(item[key]) : this.set(initial_value);
			// });
			const item = await browser.storage.sync.get(key);
			console.log(`in callback for ${key}`, initial_value, item);
			//if initial_value null, load from localstorage (if localstorage item exists)
			initial_value === null && !!Object.keys(item).length ? this.set(item[key]) : this.set(initial_value);
			return this;
		})();
	}

	get() {
		return this.value;
	}

	set(value) {
		const { store, key } = this;
		//synchronously update store
		this.value = value;
		store.set(value);
		browser.storage.sync.set({ [key]: value });
	}

	/**
	 * Update only `this.value` and the Svelte store
	 */
	#setStoreOnly(value) {
		this.value = value;
		this.store.set(value);
	}

	/**
	 * Merge two objects or arrays together, then set the merged object to the store.
	 * Deeply nested updating not supported
	 */
	update(new_value) {
		const isLiteralObject = (o) => !!o && o.constructor === Object; //https://stackoverflow.com/a/16608074/8396479
		const { value } = this;
		if (isLiteralObject(value) && isLiteralObject(new_value)) new_value = { ...value, ...new_value };
		else if (Array.isArray(value) && Array.isArray(new_value)) new_value = [...value, ...new_value];
		this.set(new_value);
	}
}

// if initial_value null, will attempt to load from browser storage
// if initial_value is a function, function will be called and return value passed into store
async function chromeStorageSyncStore ({ key, initial_value = null } = {}) {
	initial_value instanceof Function && (initial_value = await initial_value());
	const custom_store = await new ChromeStorageSyncStore({ key, initial_value });
	let {
		store: { subscribe },
		get,
		set,
		update,
	} = custom_store;
	get = get.bind(custom_store);
	set = set.bind(custom_store);
	update = update.bind(custom_store);

	return { key, subscribe, get, set, update };
}

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


class ApplicationStoreManager {
	stores = {};

	constructor() {}

	async init(i_stores = []) {
		console.log('init', this);
		await this.#init(i_stores);

		//create listener for reconstruct message
		browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
			console.log('beginning of onMessage', message);
			if (sender.id !== browser.runtime.id) return console.log('ids are not equal');
			if (message !== 'store_reconstruct') return console.log('message is not store_reconstruct');
			//stringify stores and send as response
			sendResponse(JSON.stringify(Object.entries(this.stores).map(([key, store]) => [key, store.get()])));
		});

		return this;
	}

	/**
	 *
	 * @param {Promise[]} i_stores
	 */
	async #init(i_stores) {
		for await (const store of i_stores) this.addStore(store);
	}

	async reconstruct() {
		try {
			console.log('in reconstruct, stores', this.stores);
			const res = await browser.runtime.sendMessage('store_reconstruct');
			console.log('received response', res);
			//reconstruct stores from JSON
			await this.#init(
				JSON.parse(res).map(([key, initial_value]) => chromeStorageSyncStore({ key, initial_value }))
			);
			console.log('reconstruction complete', this.stores);
		} catch (e) {
			console.log('reconstruct error', e);
			//wait 1 second and try again
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return this.reconstruct();
		}
		return this;
	}

	get(key) {
		return this.stores[key];
	}

	getMany(keys) {
		return keys.reduce((acc, key) => ({ ...acc, [key]: this.get(key) }), {});
	}

	addStore(store) {
		this.stores[store.key] = store;
	}

	updateStore(obj) {
		console.log('in updateStore, stores: ', this.stores);
		for (const [key, val] of Object.entries(obj)) {
			console.log('updating Store', key, val);
			this.stores[key].update(val);
		}
	}
}

const { stores, init, reconstruct } = new Proxy(new ApplicationStoreManager(), {
	//https://stackoverflow.com/a/50104359/8396479
	get: (target, prop) => {
		const value = target[prop];
		// if method, and not bound, bind the method
		return value instanceof Function && !value.name.startsWith('bound ') ? value.bind(target) : value;
	},
});

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

const AUTHORIZATION_KEY = 'TE1TX0FVVEg';
const CONTEXT_KEY = 'TE1TX0NPTlRFWFQ';
const url = {
	gateway: 'https://gateway.halo.gcu.edu',
	validate: 'https://halo.gcu.edu/api/auth/session',
};

const getUserOverview = async function ({ cookie, uid }) {
	console.log('getUserOverview', cookie, uid);

	const data = await fetch(url.gateway, {
		method: 'POST',
		headers: {
			accept: '*/*',
			'content-type': 'application/json',
			authorization: `Bearer ${cookie[AUTHORIZATION_KEY]}`,
			contexttoken: `Bearer ${cookie[CONTEXT_KEY]}`,
		},
		body: JSON.stringify({
			//Specific GraphQL query syntax, reverse-engineered
			operationName: 'HeaderFields',
			variables: {
				userId: uid,
				skipClasses: false,
			},
			query: 'query HeaderFields($userId: String!, $skipClasses: Boolean!) {\n  userInfo: getUserById(id: $userId) {\n    id\n    firstName\n    lastName\n    userImgUrl\n    sourceId\n    __typename\n  }\n  classes: getCourseClassesForUser @skip(if: $skipClasses) {\n    courseClasses {\n      id\n      classCode\n      slugId\n      startDate\n      endDate\n      name\n      description\n      stage\n      modality\n      version\n      courseCode\n      units {\n        id\n        current\n        title\n        sequence\n        __typename\n      }\n      instructors {\n        ...headerUserFields\n        __typename\n      }\n      students {\n        isAccommodated\n        isHonors\n        ...headerUserFields\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment headerUserFields on CourseClassUser {\n  id\n  courseClassId\n  roleName\n  baseRoleName\n  status\n  userId\n  user {\n    ...headerUser\n    __typename\n  }\n  __typename\n}\n\nfragment headerUser on User {\n  id\n  userStatus\n  firstName\n  lastName\n  userImgUrl\n  sourceId\n  lastLogin\n  __typename\n}\n',
		}),
	});

	try {
		console.log(data);

		const res = await data.json();

		if (res.body?.errors?.[0]?.message?.includes('401')) throw { code: 401, cookie };
		//Error handling and data validation could be improved
		if (res.error) return console.error(res.error);
		return res.data;
	} catch (e) {
		console.log('getUserOverview error', e);
		return {};
	}
};

const getUserId = async function ({ cookie }) {
	console.log('getUserId', cookie);

	const data = await fetch(url.validate, {
		method: 'GET',
		headers: {
			accept: '*/*',
			'content-type': 'application/json',
		},
	});

	try {
		console.log('getUserId-data', data);
		const res = await data.json();

		if (res.body?.errors?.[0]?.message?.includes('401')) throw { code: 401, cookie };
		//Error handling and data validation could be improved
		if (res.error) return console.error(res.error);
		return res['userId'];
	} catch (e) {
		throw { code: 500, error: e };
	}
};

const getHaloUserInfo = async function ({ cookie }) {
	const data = await fetch(url.validate, {
		method: 'GET',
		headers: {
			accept: '*/*',
			'content-type': 'application/json',
		},
	});

	try {
		const res = await data.json();
		console.log('getHaloUserInfo', res);

		if (res?.errors?.[0]?.message?.includes('401')) throw { code: 401, cookie };
		//Error handling and data validation could be improved
		if (res.error) return console.error(res.error);
		return res;
	} catch (e) {
		throw { code: 500, cookie };
	}
};

const getClassInformation = async function ({ cookie, slugId }) {
	const res = await (
		await fetch(url.gateway, {
			method: 'POST',
			headers: {
				accept: '*/*',
				'content-type': 'application/json',
				authorization: `Bearer ${cookie[AUTHORIZATION_KEY]}`,
				contexttoken: `Bearer ${cookie[CONTEXT_KEY]}`,
			},
			body: JSON.stringify({
				operationName: 'CurrentClass',
				variables: { slugId, isStudent: true },
				query: 'query CurrentClass($slugId: String!, $isStudent: Boolean!) {\n  currentClass: getCourseClassBySlugId(slugId: $slugId) {\n    id\n    classCode\n    slugId\n    degreeLevel\n    startDate\n    endDate\n    description\n    name\n    stage\n    modality\n    credits\n    courseCode\n    version\n    lastPublishedDate\n    sectionId\n    holidays {\n      ...holidayDetailFields\n      __typename\n    }\n    students {\n      ...studentDetailFields\n      __typename\n    }\n    participationPolicy {\n      description\n      id\n      numDays\n      numPosts\n      __typename\n    }\n    gradeScale {\n      id\n      entries {\n        id\n        label\n        minPercent\n        maxPercent\n        minPoints\n        maxPoints\n        type\n        __typename\n      }\n      __typename\n    }\n    instructors {\n      ...instructorDetailFields\n      __typename\n    }\n    units {\n      id\n      title\n      sequence\n      startDate\n      endDate\n      current\n      points\n      description\n      assessments {\n        id\n        sequence\n        title\n        description\n        startDate\n        dueDate\n        accommodatedDueDate @skip(if: $isStudent)\n        exemptAccommodations\n        points\n        type\n        tags\n        requiresLopesWrite\n        isGroupEnabled\n        inPerson\n        rubric {\n          id\n          name\n          id\n          __typename\n        }\n        attachments {\n          id\n          resourceId\n          title\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment studentDetailFields on CourseClassUser {\n  id\n  isAccommodated\n  courseClassId\n  isHonors\n  user {\n    id\n    firstName\n    lastName\n    sourceId\n    userImgUrl\n    lastLogin\n    isAccommodated @skip(if: $isStudent)\n    __typename\n  }\n  baseRoleName\n  roleName\n  status\n  userId\n  __typename\n}\n\nfragment instructorDetailFields on CourseClassUser {\n  id\n  user {\n    id\n    firstName\n    lastName\n    sourceId\n    userImgUrl\n    socialContacts {\n      id\n      value\n      socialContactType\n      __typename\n    }\n    __typename\n  }\n  baseRoleName\n  roleName\n  status\n  userId\n  __typename\n}\n\nfragment holidayDetailFields on HolidayCalendar {\n  id\n  active\n  description\n  duration\n  startDate\n  title\n  __typename\n}\n',
			}),
		})
	).json();

	if (res?.errors?.[0]?.message?.includes('401')) throw res.errors;
	//Error handling and data validation could be improved
	if (res.error) return console.error(res.error);
	return res.data.currentClass;
};

const getInformation = async function () {
	try {
		const data = await fetch(url.validate, {
			method: 'GET',
			headers: {
				accept: '*/*',
				'content-type': 'application/json',
			},
		});

		const res = await data.json();

		const output = {
			[AUTHORIZATION_KEY]: res['authToken'],
			[CONTEXT_KEY]: res['contextToken'],
			userId: res['userId'],
		};
		console.log('information', output);

		return output;
	} catch (e) {
		return { code: 500, error: e };
	}
};

export { AUTHORIZATION_KEY as A, CONTEXT_KEY as C, getHaloUserInfo as a, getUserOverview as b, chromeStorageSyncStore as c, blank_object as d, run_all as e, is_function as f, getInformation as g, is_empty as h, init as i, safe_not_equal as j, component_subscribe as k, run as l, create_slot as m, noop as n, get_all_dirty_from_scope as o, get_slot_changes as p, getUserId as q, reconstruct as r, stores as s, getClassInformation as t, update_slot_base as u, src_url_equal as v, is_promise as w };
