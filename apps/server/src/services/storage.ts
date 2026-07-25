import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

export interface StoredFile {
  key: string;
  url: string;
}

const useAws = process.env.USE_AWS?.trim().toLowerCase() === "true";
const localStorageDirectory = path.resolve(
  process.cwd(),
  process.env.LOCAL_STORAGE_DIR || "storage"
);

let s3: AWS.S3 | undefined;

function getS3(): AWS.S3 {
  if (!s3) {
    s3 = new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }

  return s3;
}

function publicUrl(key: string, requestBaseUrl?: string): string {
  const baseUrl = (process.env.PUBLIC_BASE_URL || requestBaseUrl || "http://localhost:3001")
    .replace(/\/$/, "");
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/files/${encodedKey}`;
}

export function usesAwsStorage(): boolean {
  return useAws;
}

export function getLocalStorageDirectory(): string {
  return localStorageDirectory;
}

/** Stores a rendered file in S3 or the local development storage directory. */
export async function storeFile(
  sourcePath: string,
  key: string,
  contentType: string,
  requestBaseUrl?: string
): Promise<StoredFile> {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`File to store was not found: ${sourcePath}`);
  }

  if (!useAws) {
    const destination = path.resolve(localStorageDirectory, key);
    const relativeDestination = path.relative(localStorageDirectory, destination);
    if (relativeDestination.startsWith("..") || path.isAbsolute(relativeDestination)) {
      throw new Error("Invalid local storage key");
    }

    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await fs.promises.copyFile(sourcePath, destination);
    return { key, url: publicUrl(key, requestBaseUrl) };
  }

  const result = await getS3()
    .upload({
      Bucket: process.env.S3_BUCKET_NAME as string,
      Key: key,
      Body: fs.createReadStream(sourcePath),
      ContentType: contentType,
      ACL: "public-read",
    })
    .promise();

  return { key: result.Key, url: result.Location };
}
