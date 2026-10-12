import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export const getFileUrl = async (key: string) =>
	(await utapi.generateSignedURL(key)).ufsUrl;

export const deleteFiles = async (keys: string[]) => {
	if (keys.length === 0) return;
	const { success } = await utapi.deleteFiles(keys);
	if (!success) throw new Error("UploadThing could not delete the files");
};
