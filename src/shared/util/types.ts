// Forum notification types based on API response from gateway POST
// Source: user-provided sample

export type ForumsGQL = {
  count: string;
  forumId: string;
  posts: any[];
  __typename: 'ForumsGQL';
};

export type ClassesGQL = {
  classId: string;
  count: string;
  forums: ForumsGQL[];
  __typename: 'ClassesGQL';
};

export type InboxGQL = {
  classes: ClassesGQL[];
  count: string;
  __typename: 'InboxGQL';
};

export type ForumTypesGQL = {
  INBOX: InboxGQL;
  __typename: 'ForumTypesGQL';
};

export type NotificationGQL = {
  forumTypes: ForumTypesGQL;
  __typename: 'NotificationGQL';
};

export type NotificationResponse = {
  data: {
    classes: NotificationGQL[];
  };
};

// Halo session/user info type based on validate URL response
// Source: user-provided sample
export type HaloRole = {
  baseRole: string;
  permissions: string[];
  name: string;
  id: string;
  isActive: boolean;
};

export type HaloClassGroupContext = {
  id: string;
  groupIds: string[];
};

export type HaloValidateResponse = {
  user: {
    email: string;
  };
  expires: string; // ISO date string
  roles: HaloRole[];
  userId: string;
  tenantId: string;
  username: string;
  allClassGroupsContext: HaloClassGroupContext[];
  authToken: string;
  contextToken: string;
  authMethod: string;
}; 