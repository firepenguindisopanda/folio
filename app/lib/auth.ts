import { GoogleStrategy } from "remix-auth-google";
import type { User as TUser } from "./db/schema";
import { getErrorMessage } from "./utils/get-error-message";
import { Authenticator } from "remix-auth";
import { sessionStorage } from "./auth/session.server";
import { provisionTenant } from "./lifecycle.server";

export type User = TUser & {
	vectorDbId: string;
};

export const authenticator = new Authenticator<User>(sessionStorage);

authenticator.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.GOOGLE_CALLBACK_URL,
		},
		async ({ profile }) => {
			try {
				return await provisionTenant({
					email: profile.emails[0].value,
					name: profile.displayName,
					avatarUrl: profile.photos[0]?.value,
				});
			} catch (error) {
				console.error("User creation error:", error);
				throw new Error(getErrorMessage(error));
			}
		},
	),
);
