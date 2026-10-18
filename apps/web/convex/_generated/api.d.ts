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
import type * as authEmails from "../authEmails.js";
import type * as emails from "../emails.js";
import type * as favorites from "../favorites.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as oauth from "../oauth.js";
import type * as readingListLimits from "../readingListLimits.js";
import type * as readingLists from "../readingLists.js";
import type * as reportFields from "../reportFields.js";
import type * as reports from "../reports.js";
import type * as tracking from "../tracking.js";
import type * as turnstile from "../turnstile.js";
import type * as users from "../users.js";

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
  authEmails: typeof authEmails;
  emails: typeof emails;
  favorites: typeof favorites;
  http: typeof http;
  migrations: typeof migrations;
  oauth: typeof oauth;
  readingListLimits: typeof readingListLimits;
  readingLists: typeof readingLists;
  reportFields: typeof reportFields;
  reports: typeof reports;
  tracking: typeof tracking;
  turnstile: typeof turnstile;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
