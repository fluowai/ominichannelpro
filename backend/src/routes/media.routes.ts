import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { mediaService } from '../services/media.service.js';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

export async function mediaRoutes(fastify: FastifyInstance) {
    fastify.post('/upload', {
        onRequest: [authenticate],
    }, async (request, reply) => {
        const data = await request.file();
        if (!data) {
            return reply.code(400).send({ error: 'No file uploaded' });
        }

        try {
            const mimeType = data.mimetype;
            const mediaType = mediaService.detectMediaType(mimeType);
            const typeDir = mediaService.getMediaDirectory(mediaType);
            
            // Ensure directory exists relative to backend root
            const absoluteDir = path.join(process.cwd(), 'uploads', typeDir);
            if (!fs.existsSync(absoluteDir)) {
                fs.mkdirSync(absoluteDir, { recursive: true });
            }

            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const ext = path.extname(data.filename) || '.bin';
            const filename = `${timestamp}_${random}${ext}`;
            const filepath = path.join(absoluteDir, filename);

            const writer = fs.createWriteStream(filepath);
            await pipeline(data.file, writer);

            const stats = fs.statSync(filepath);

            return reply.send({
                url: `/uploads/${typeDir}/${filename}`,
                filename: data.filename,
                size: stats.size,
                mimetype: mimeType,
                type: mediaType
            });
        } catch (error: any) {
            console.error('[MediaUpload] Error:', error);
            return reply.code(500).send({ error: 'Failed to upload file' });
        }
    });
}
