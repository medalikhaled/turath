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
import type * as createAdmin from "../createAdmin.js";
import type * as createSpecificAdmin from "../createSpecificAdmin.js";
import type * as dashboard from "../dashboard.js";
import type * as demo from "../demo.js";
import type * as files from "../files.js";
import type * as lessons from "../lessons.js";
import type * as meetings from "../meetings.js";
import type * as migrations from "../migrations.js";
import type * as news from "../news.js";
import type * as otp from "../otp.js";
import type * as studentAuth from "../studentAuth.js";
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
  createAdmin: typeof createAdmin;
  createSpecificAdmin: typeof createSpecificAdmin;
  dashboard: typeof dashboard;
  demo: typeof demo;
  files: typeof files;
  lessons: typeof lessons;
  meetings: typeof meetings;
  migrations: typeof migrations;
  news: typeof news;
  otp: typeof otp;
  studentAuth: typeof studentAuth;
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
