import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { createRouteHandler } from "uploadthing/remix";
import { uploadRouter } from "~/lib/uploadthing.server";

const handler = createRouteHandler({ router: uploadRouter });

export const loader = (args: LoaderFunctionArgs) => handler.loader(args);
export const action = (args: ActionFunctionArgs) => handler.action(args);
