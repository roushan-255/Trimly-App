import { Controller, Post, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";

const DEFAULT_CLOUDINARY_FOLDER = "trimly/shop-images";

type SignatureParameter = string | number;

export function signCloudinaryParameters(
  parameters: Record<string, SignatureParameter>,
  apiSecret: string,
) {
  const serialized = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${serialized}${apiSecret}`)
    .digest("hex");
}

@Controller("uploads")
export class UploadsController {
  constructor(private readonly config: ConfigService) {}

  @Post("shop-images/signature")
  createShopImageSignature() {
    const cloudName = this.requiredSetting("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.requiredSetting("CLOUDINARY_API_KEY");
    const apiSecret = this.requiredSetting("CLOUDINARY_API_SECRET");
    const uploadPreset = this.requiredSetting("CLOUDINARY_UPLOAD_PRESET");
    const folder =
      this.config.get<string>("CLOUDINARY_FOLDER")?.trim() ||
      DEFAULT_CLOUDINARY_FOLDER;

    if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
      throw new ServiceUnavailableException(
        "Cloudinary is not configured correctly",
      );
    }

    const timestamp = Math.floor(Date.now() / 1_000);
    const signedParameters = {
      folder,
      timestamp,
      upload_preset: uploadPreset,
    };

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      apiKey,
      timestamp,
      folder,
      uploadPreset,
      signature: signCloudinaryParameters(signedParameters, apiSecret),
    };
  }

  private requiredSetting(name: string) {
    const value = this.config.get<string>(name)?.trim();
    if (!value) {
      throw new ServiceUnavailableException(
        "Cloudinary image uploads are not configured",
      );
    }
    return value;
  }
}
