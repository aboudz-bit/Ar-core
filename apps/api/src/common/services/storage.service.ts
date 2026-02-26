import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

export interface StorageDriver {
  save(file: Express.Multer.File, folder: string): Promise<{ path: string; sizeBytes: number }>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): string;
}

@Injectable()
export class StorageService implements StorageDriver {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_LOCAL_PATH || './uploads';
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async save(file: Express.Multer.File, folder: string): Promise<{ path: string; sizeBytes: number }> {
    const ext = path.extname(file.originalname);
    const fileName = `${uuid()}${ext}`;
    const folderPath = path.join(this.basePath, folder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return {
      path: `${folder}/${fileName}`,
      sizeBytes: file.size,
    };
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }
}
