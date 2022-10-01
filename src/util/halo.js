export const AUTHORIZATION_KEY = 'TE1TX0FVVEg';
export const CONTEXT_KEY = 'TE1TX0NPTlRFWFQ';
const url = {
	gateway: 'https://gateway.halo.gcu.edu',
	validate: 'https://halo.gcu.edu/api/token-validate/',
};

export const getUserOverview = async function ({ cookie, uid }) {
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
				//Specific GraphQL query syntax, reverse-engineered
				operationName: 'HeaderFields',
				variables: {
					userId: uid,
					skipClasses: false,
				},
				query: 'query HeaderFields($userId: String!, $skipClasses: Boolean!) {\n  userInfo: getUserById(id: $userId) {\n    id\n    firstName\n    lastName\n    userImgUrl\n    sourceId\n    __typename\n  }\n  classes: getCourseClassesForUser @skip(if: $skipClasses) {\n    courseClasses {\n      id\n      classCode\n      slugId\n      startDate\n      endDate\n      name\n      description\n      stage\n      modality\n      version\n      courseCode\n      units {\n        id\n        current\n        title\n        sequence\n        __typename\n      }\n      instructors {\n        ...headerUserFields\n        __typename\n      }\n      students {\n        isAccommodated\n        isHonors\n        ...headerUserFields\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment headerUserFields on CourseClassUser {\n  id\n  courseClassId\n  roleName\n  baseRoleName\n  status\n  userId\n  user {\n    ...headerUser\n    __typename\n  }\n  __typename\n}\n\nfragment headerUser on User {\n  id\n  userStatus\n  firstName\n  lastName\n  userImgUrl\n  sourceId\n  lastLogin\n  __typename\n}\n',
			}),
		})
	).json();

	if (res.body?.errors?.[0]?.message?.includes('401')) throw { code: 401, cookie };
	//Error handling and data validation could be improved
	if (res.error) return console.error(res.error);
	return res.data;
};

export const getUserId = async function ({ cookie }) {
	const res = await (
		await fetch(url.validate, {
			method: 'POST',
			headers: {
				accept: '*/*',
				'content-type': 'application/json',
				authorization: `Bearer ${cookie[AUTHORIZATION_KEY]}`,
				contexttoken: `Bearer ${cookie[CONTEXT_KEY]}`,
			},
			body: JSON.stringify({
				userToken: cookie[AUTHORIZATION_KEY],
				contextToken: cookie[CONTEXT_KEY],
			}),
		})
	).json();

	if (res.body?.errors?.[0]?.message?.includes('401')) throw { code: 401, cookie };
	//Error handling and data validation could be improved
	if (res.error) return console.error(res.error);
	return res.payload.userid;
};

export const getHaloUserInfo = async function ({ cookie }) {
	const res = await (
		await fetch(url.validate, {
			method: 'POST',
			headers: {
				accept: '*/*',
				'content-type': 'application/json',
				authorization: `Bearer ${cookie[AUTHORIZATION_KEY]}`,
				contexttoken: `Bearer ${cookie[CONTEXT_KEY]}`,
			},
			body: JSON.stringify({
				userToken: cookie[AUTHORIZATION_KEY],
				contextToken: cookie[CONTEXT_KEY],
			}),
		})
	).json();

	if (res?.errors?.[0]?.message?.includes('401')) throw { code: 401, cookie };
	//Error handling and data validation could be improved
	if (res.error) return console.error(res.error);
	return res.payload;
};

export const getClassInformation = async function ({ cookie, slugId }) {
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

export const getHaloCookies = async function () {
	try {
		console.log('getHaloCookies');
		const cookies = (await chrome.cookies.getAll({ url: 'https://halo.gcu.edu' })).reduce(
			(acc, { name, value }) => ({ ...acc, [name]: value }),
			{}
		);
		return cookies;
	} catch (e) {
		console.log('getHaloCookies error', e);
		return {};
	}
};
