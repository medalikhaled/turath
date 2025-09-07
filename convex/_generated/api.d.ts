/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as courses from "../courses.js";
import type * as dashboard from "../dashboard.js";
import type * as files from "../files.js";
import type * as lessons from "../lessons.js";
import type * as meetings from "../meetings.js";
import type * as news from "../news.js";
import type * as seed from "../seed.js";
import type * as seedRunner from "../seedRunner.js";
import type * as students from "../students.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  courses: typeof courses;
  dashboard: typeof dashboard;
  files: typeof files;
  lessons: typeof lessons;
  meetings: typeof meetings;
  news: typeof news;
  seed: typeof seed;
  seedRunner: typeof seedRunner;
  students: typeof students;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
