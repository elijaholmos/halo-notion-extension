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

import { decodeHTML } from 'entities';
import { DateTime } from 'luxon';
import { stores } from '../stores';
import { getClassInformation, getHaloCookies } from './halo';
const _url = 'https://halo-notion.vercel.app/api/proxy?url=';
let database_id;

console.log('in notion.js');
console.log(stores);

const headers = new Proxy(
	{
		Authorization: null,
		'Notion-Version': '2022-06-28',
		'Content-Type': 'application/json',
	},
	{
		get: (target, prop) => {
			if (prop === 'Authorization') return `Bearer ${stores.notion_info.get()?.access_token}`;

			return target[prop];
		},
	}
);

// screw CORS.
const proxy = async function (url, options) {
	return (
		(await (
			await fetch(`${_url}${encodeURIComponent(url)}`, {
				method: 'POST',
				body: JSON.stringify(options),
			})
		)?.json()) || {}
	);
};

export const getAssignmentsDatabaseId = async function () {
	if (!!database_id) return database_id;
	const { results } = await proxy('https://api.notion.com/v1/search', {
		method: 'POST',
		headers,
		body: JSON.stringify({
			filter: {
				value: 'database',
				property: 'object',
			},
		}),
	});

	return (database_id = results?.find((r) => 'Course' in r.properties)?.id);
};

export const createPage = async function ({ database_id, ...data }) {
	return await proxy('https://api.notion.com/v1/pages', {
		method: 'POST',
		headers,
		body: JSON.stringify({
			parent: { database_id, type: 'database_id' },
			...data,
		}),
	});
};

// https://stackoverflow.com/a/29202760/8396479
const chunkSubstr = function (str, size) {
	const numChunks = Math.ceil(str.length / size);
	const chunks = new Array(numChunks);

	for (let i = 0, o = 0; i < numChunks; ++i, o += size) chunks[i] = str.substr(o, size);

	return chunks;
};

export const prepClassAssignmentImport = async function ({ slugId, cookie }) {
	if (!cookie) cookie = await getHaloCookies();
	if (!database_id) await getAssignmentsDatabaseId(); //cache database_id if it hasn't been stored

	const current_class = await getClassInformation({ cookie, slugId });

	const totalpoints = current_class.units.reduce(
		(acc, { assessments }) => acc + assessments.reduce((a, { points }) => points + a, 0),
		0
	);

	const max = current_class.units.reduce((acc, { assessments }) => acc + assessments.length, 0);

	return {
		current_class,
		totalpoints,
		max,
	};
};

export const importSingleAssignment = async function ({ assessment, current_class, unit, totalpoints }) {
	if (!database_id) await getAssignmentsDatabaseId(); //cache database_id if it hasn't been stored

	// utility function
	const parseURL = function (data, slugId) {
		if (data.isGroupEnabled) return `https://halo.gcu.edu/courses/${slugId}/groups?assessmentId=${data.id}`;
		if (['ASSIGNMENT', 'PARTICIPATION'].includes(data.type))
			return `https://halo.gcu.edu/courses/${slugId}#assignment-submission/${data.id}`;
		return null;
	};

	return await createPage({
		database_id,
		properties: {
			Name: {
				title: [
					{
						type: 'text',
						text: {
							content: assessment.title,
						},
					},
				],
			},
			URL: {
				type: 'url',
				url: parseURL(assessment, current_class.slugId),
			},
			Weight: { number: assessment.points / totalpoints },
			Points: { type: 'number', number: assessment.points },
			Course: {
				type: 'select',
				select: {
					name: current_class.courseCode,
				},
			},
			'Start date': {
				type: 'date',
				date: {
					start: DateTime.fromISO(assessment.startDate).toISO(),
				},
			},
			'Due date': {
				type: 'date',
				date: {
					start: DateTime.fromISO(assessment.dueDate).toISO(),
				},
			},
			Tags: {
				type: 'multi_select',
				multi_select: [
					...(assessment.type !== 'ASSIGNMENT'
						? [
								{
									name: assessment.type,
								},
						  ]
						: []),
					...(assessment.isGroupEnabled
						? [
								{
									name: 'CLC',
								},
						  ]
						: []),
					...(!!assessment.rubric
						? [
								{
									name: 'RUBRIC',
								},
						  ]
						: []),
					...(assessment.title.toLowerCase().includes('milestone')
						? [
								{
									name: 'MILESTONE',
								},
						  ]
						: []),
				],
			},
			Topic: {
				type: 'multi_select',
				multi_select: [
					{
						name: unit.title.split(':')[0],
					},
				],
			},
			Status: {
				type: 'select',
				select: { name: 'Upcoming' },
			},
		},
		children: [
			{
				object: 'block',
				type: 'heading_1',
				heading_1: {
					rich_text: [
						{
							type: 'text',
							text: {
								content: 'Description',
							},
						},
					],
				},
			},
			{
				object: 'block',
				type: 'paragraph',
				paragraph: {
					rich_text: chunkSubstr(
						decodeHTML(assessment.description ?? '')
							.replaceAll('</p><p>', '\n\n')
							.replaceAll('<br>', '\n')
							.replaceAll('<li>', '\n\t\u2022 ')
							.replaceAll('</ol>', '\n')
							.replace(/<\/?[^>]+(>|$)/g, ''),
						2000
					).map((content) => ({
						type: 'text',
						text: { content },
					})),
				},
			},
			...(!!assessment.attachments.length
				? assessment.attachments.map((att) => ({
						object: 'block',
						type: 'file',
						file: {
							caption: [
								{
									type: 'text',
									text: { content: att.title },
								},
							],
							type: 'external',
							external: {
								url: `https://halo.gcu.edu/resource/${att.resourceId}`,
							},
						},
				  }))
				: []),
		],
	});
};

export const populateClassAssignments = async function (slugId) {
	const database_id = await getAssignmentsDatabaseId(); //retrieve and "cache"

	// utility function
	const parseURL = function (data, slugId) {
		if (data.isGroupEnabled) return `https://halo.gcu.edu/courses/${slugId}/groups?assessmentId=${data.id}`;
		if (data.type === 'ASSIGNMENT' || data.type === 'PARTICIPATION')
			return `https://halo.gcu.edu/courses/${slugId}#assignment-submission/${data.id}`;
		return null;
	};

	const current_class = await getClassInformation({ cookie: await getHaloCookies(), slugId });

	const totalpoints = current_class.units.reduce(
		(acc, { assessments }) => acc + assessments.reduce((a, { points }) => points + a, 0),
		0
	);
};
