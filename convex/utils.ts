// Utility functions for Convex backend

// File type validation
export const ALLOWED_FILE_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    videos: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    archives: ['application/zip', 'application/x-rar-compressed'],
};

export const ALL_ALLOWED_TYPES = [
    ...ALLOWED_FILE_TYPES.images,
    ...ALLOWED_FILE_TYPES.documents,
    ...ALLOWED_FILE_TYPES.videos,
    ...ALLOWED_FILE_TYPES.audio,
    ...ALLOWED_FILE_TYPES.archives,
];

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024, // 50MB
    archive: 20 * 1024 * 1024, // 20MB
    default: 10 * 1024 * 1024, // 10MB
};

// Validate file type
export function isValidFileType(mimeType: string): boolean {
    return ALL_ALLOWED_TYPES.includes(mimeType);
}

// Get file category from mime type
export function getFileCategory(mimeType: string): string {
    if (ALLOWED_FILE_TYPES.images.includes(mimeType)) return 'image';
    if (ALLOWED_FILE_TYPES.documents.includes(mimeType)) return 'document';
    if (ALLOWED_FILE_TYPES.videos.includes(mimeType)) return 'video';
    if (ALLOWED_FILE_TYPES.audio.includes(mimeType)) return 'audio';
    if (ALLOWED_FILE_TYPES.archives.includes(mimeType)) return 'archive';
    return 'unknown';
}

// Validate file size
export function isValidFileSize(size: number, mimeType: string): boolean {
    const category = getFileCategory(mimeType);
    const limit = FILE_SIZE_LIMITS[category as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.default;
    return size <= limit;
}

// Format file size for display
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate safe filename
export function generateSafeFilename(originalName: string): string {
    // Remove special characters and spaces, keep extension
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const safeName = nameWithoutExt
        .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') // Allow Arabic characters
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

    const timestamp = Date.now();
    return `${safeName}_${timestamp}.${extension}`;
}

// Time utilities
export function getStartOfWeek(date: Date = new Date()): number {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
}

export function getEndOfWeek(date: Date = new Date()): number {
    const startOfWeek = getStartOfWeek(date);
    return startOfWeek + (7 * 24 * 60 * 60 * 1000) - 1;
}

export function getStartOfDay(date: Date = new Date()): number {
    return new Date(date).setHours(0, 0, 0, 0);
}

export function getEndOfDay(date: Date = new Date()): number {
    return new Date(date).setHours(23, 59, 59, 999);
}

export function isValidGoogleMeetLink(link: string): boolean {
    const meetRegex = /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/;
    return meetRegex.test(link);
}

export class ConvexError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'ConvexError';
    }
}

export function handleError(error: unknown): never {
    if (error instanceof ConvexError) {
        throw error;
    }

    if (error instanceof Error) {
        throw new ConvexError(error.message);
    }

    throw new ConvexError('An unknown error occurred');
}