import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isValidFileType, isValidFileSize, generateSafeFilename, ConvexError } from "./utils";

// Create a new file record with validation
export const createFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    uploadedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Validate file type
    if (!isValidFileType(args.type)) {
      throw new ConvexError(`File type ${args.type} is not allowed`);
    }
    
    // Validate file size
    if (!isValidFileSize(args.size, args.type)) {
      throw new ConvexError(`File size ${args.size} exceeds limit for type ${args.type}`);
    }
    
    // Generate safe filename
    const safeName = generateSafeFilename(args.name);
    
    const fileId = await ctx.db.insert("files", {
      storageId: args.storageId,
      name: safeName,
      type: args.type,
      size: args.size,
      uploadedBy: args.uploadedBy,
      uploadedAt: Date.now(),
    });
    return fileId;
  },
});

// Get file by ID
export const getFile = query({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get file URL for download
export const getFileUrl = query({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) return null;
    
    return await ctx.storage.getUrl(file.storageId);
  },
});

// Get file URL for download (mutation version for direct download)
export const getFileDownloadUrl = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) return null;
    
    return await ctx.storage.getUrl(file.storageId);
  },
});

// Get files by uploader
export const getFilesByUploader = query({
  args: { uploadedBy: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_uploaded_by", (q) => q.eq("uploadedBy", args.uploadedBy))
      .order("desc")
      .collect();
  },
});

// Get recent files
export const getRecentFiles = query({
  args: { 
    limit: v.optional(v.number()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const days = args.days || 30;
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    return await ctx.db
      .query("files")
      .withIndex("by_uploaded_at")
      .filter((q) => q.gt(q.field("uploadedAt"), cutoffTime))
      .order("desc")
      .take(limit);
  },
});

// Get files by type
export const getFilesByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("type"), args.type))
      .order("desc")
      .collect();
  },
});

// Update file information
export const updateFile = mutation({
  args: {
    id: v.id("files"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

// Delete file (removes both database record and storage)
export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");
    
    // Delete from storage
    await ctx.storage.delete(file.storageId);
    
    // Delete database record
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Generate upload URL for file upload
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get file statistics
export const getFileStats = query({
  handler: async (ctx) => {
    const allFiles = await ctx.db.query("files").collect();
    
    const totalFiles = allFiles.length;
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
    
    const typeStats = allFiles.reduce((acc, file) => {
      const type = file.type.split('/')[0]; // Get main type (image, video, etc.)
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalFiles,
      totalSize,
      typeStats,
    };
  },
});

// Search files by name
export const searchFiles = query({
  args: { 
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const searchTerm = args.searchTerm.toLowerCase();
    
    const allFiles = await ctx.db.query("files").collect();
    
    const matchingFiles = allFiles
      .filter(file => file.name.toLowerCase().includes(searchTerm))
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(0, limit);
    
    return matchingFiles;
  },
});

// Get files with their URLs (for display purposes)
export const getFilesWithUrls = query({
  args: { 
    fileIds: v.array(v.id("files")),
  },
  handler: async (ctx, args) => {
    const filesWithUrls = await Promise.all(
      args.fileIds.map(async (fileId) => {
        const file = await ctx.db.get(fileId);
        if (!file) return null;
        
        const url = await ctx.storage.getUrl(file.storageId);
        return {
          ...file,
          url,
        };
      })
    );
    
    return filesWithUrls.filter(file => file !== null);
  },
});