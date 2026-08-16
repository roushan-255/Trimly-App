import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
// Import the interceptor implementation directly. Vercel's Node service
// bundler does not preserve this function correctly through the package's
// CommonJS barrel export.
import { FileInterceptor } from "@nestjs/platform-express/multer/interceptors/file.interceptor";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
};

const IMAGE_DIRECTORY = join(process.cwd(), "uploads", "shop-images");
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

@Controller("uploads")
export class UploadsController {
  @Post("shop-images")
  @UseInterceptors(FileInterceptor("image"))
  async uploadShopImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    image: UploadedImage,
  ) {
    await mkdir(IMAGE_DIRECTORY, { recursive: true });
    const fileName = `${randomUUID()}${IMAGE_TYPES[image.mimetype]}`;
    await writeFile(join(IMAGE_DIRECTORY, fileName), image.buffer, {
      flag: "wx",
    });
    return { path: `/uploads/shop-images/${fileName}` };
  }

  @Get("shop-images/:fileName")
  async shopImage(@Param("fileName") fileName: string) {
    if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(fileName)) {
      throw new NotFoundException("Image not found");
    }

    try {
      const extension = extname(fileName).slice(1);
      const mimeType = extension === "jpg" ? "image/jpeg" : `image/${extension}`;
      return new StreamableFile(await readFile(join(IMAGE_DIRECTORY, fileName)), {
        type: mimeType,
        disposition: `inline; filename="${fileName}"`,
      });
    } catch {
      throw new NotFoundException("Image not found");
    }
  }
}
