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

// CourseClass API response types
// Source: user-provided sample

export type SocialContact = {
  id: string;
  value: string;
  socialContactType: string;
  __typename: 'SocialContact';
};

export type User = {
  id: string;
  username: string | null;
  firstName: string;
  lastName: string;
  preferredFirstName: string | null;
  sourceId: string | null;
  userImgUrl: string | null;
  lastLogin: string | null;
  isAccommodated: boolean | null;
  userStatus: string | null;
  socialContacts: SocialContact[] | null;
  __typename: 'User';
};

export type CourseClassUser = {
  courseClassId: string;
  createdDate: string;
  id: string;
  isHonors: boolean | null;
  isAccommodated: boolean | null;
  user: User;
  baseRoleName: string;
  roleName: string;
  status: string;
  userId: string;
  __typename: 'CourseClassUser';
};

export type Rubric = {
  id: string;
  name: string;
  __typename: 'Rubric';
};

export type CourseClassAttachment = {
  id: string;
  resourceId: string;
  title: string;
  __typename: 'CourseClassAttachment';
};

export type CourseClassAssessment = {
  id: string;
  sequence: string;
  title: string;
  description: string | null;
  startDate: string;
  dueDate: string;
  exemptAccommodations: boolean;
  showAccommodatedTrait: boolean;
  points: number;
  type: string;
  tags: string[];
  requiresLopesWrite: boolean;
  isGroupEnabled: boolean;
  inPerson: boolean;
  rubric: Rubric | null;
  attachments: CourseClassAttachment[];
  ltiParameters: any[];
  __typename: 'CourseClassAssessment';
};

export type CourseClassUnit = {
  id: string;
  title: string;
  sequence: number;
  startDate: string;
  endDate: string;
  current: boolean;
  points: number | null;
  description: string;
  assessments: CourseClassAssessment[];
  __typename: 'CourseClassUnit';
};

export type GradeScaleEntry = {
  id: string;
  label: string;
  minPercent: number;
  maxPercent: number;
  minPoints: number;
  maxPoints: number;
  type: string;
  __typename: 'GradeScaleEntry';
};

export type GradeScale = {
  id: string;
  entries: GradeScaleEntry[];
  __typename: 'GradeScale';
};

export type CourseClassParticipationPolicy = {
  description: string;
  id: string;
  numDays: number;
  numPosts: number;
  __typename: 'CourseClassParticipationPolicy';
};

export type CourseClass = {
  id: string;
  classCode: string;
  slugId: string;
  degreeLevel: string;
  startDate: string;
  endDate: string;
  description: string;
  name: string;
  stage: string;
  modality: string;
  modifiedDate: string;
  credits: number;
  courseCode: string;
  version: string;
  lastPublishedDate: string | null;
  sectionId: string;
  holidays: any[];
  students: CourseClassUser[];
  participationPolicy: CourseClassParticipationPolicy;
  gradeScale: GradeScale;
  instructors: CourseClassUser[];
  units: CourseClassUnit[];
  __typename: 'CourseClass';
};

export type CourseClassResponse = {
  data: {
    currentClass: CourseClass;
  };
}; 