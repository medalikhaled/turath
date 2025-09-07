import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new news article
export const createNews = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    publishedAt: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    attachments: v.optional(v.array(v.id("files"))),
    createdBy: v.id("students"),
  },
  handler: async (ctx, args) => {
    const newsId = await ctx.db.insert("news", {
      title: args.title,
      content: args.content,
      publishedAt: args.publishedAt || Date.now(),
      isPublished: args.isPublished ?? true,
      attachments: args.attachments || [],
      createdBy: args.createdBy,
    });
    return newsId;
  },
});

// Get news article by ID
export const getNews = query({
  args: { id: v.id("news") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all published news (for student view)
export const getPublishedNews = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("news")
      .withIndex("by_published", (q) => 
        q.eq("isPublished", true).lt("publishedAt", Date.now())
      )
      .order("desc")
      .take(limit);
  },
});

// Get published news with file details
export const getPublishedNewsWithFiles = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const news = await ctx.db
      .query("news")
      .withIndex("by_published", (q) => 
        q.eq("isPublished", true).lt("publishedAt", Date.now())
      )
      .order("desc")
      .take(limit);
    
    // Get file details for each news item
    const newsWithFiles = await Promise.all(
      news.map(async (newsItem) => {
        const files = await Promise.all(
          newsItem.attachments.map(fileId => ctx.db.get(fileId))
        );
        
        const filesWithUrls = await Promise.all(
          files.filter(file => file !== null).map(async (file) => {
            if (!file) return null;
            const url = await ctx.storage.getUrl(file.storageId);
            return {
              ...file,
              url,
            };
          })
        );
        
        return {
          ...newsItem,
          attachments: filesWithUrls.filter(file => file !== null),
        };
      })
    );
    
    return newsWithFiles;
  },
});

// Get all news (for admin view)
export const getAllNews = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    return await ctx.db
      .query("news")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc")
      .take(limit);
  },
});

// Get draft news articles
export const getDraftNews = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("news")
      .withIndex("by_published", (q) => q.eq("isPublished", false))
      .order("desc")
      .collect();
  },
});

// Get news by creator
export const getNewsByCreator = query({
  args: { createdBy: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("news")
      .withIndex("by_created_by", (q) => q.eq("createdBy", args.createdBy))
      .order("desc")
      .collect();
  },
});

// Get recent news (last 30 days)
export const getRecentNews = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    return await ctx.db
      .query("news")
      .withIndex("by_published", (q) => 
        q.eq("isPublished", true).gt("publishedAt", cutoffTime)
      )
      .order("desc")
      .collect();
  },
});

// Update news article
export const updateNews = mutation({
  args: {
    id: v.id("news"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    attachments: v.optional(v.array(v.id("files"))),
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

// Publish news article
export const publishNews = mutation({
  args: {
    id: v.id("news"),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isPublished: true,
      publishedAt: args.publishedAt || Date.now(),
    });
    return args.id;
  },
});

// Unpublish news article
export const unpublishNews = mutation({
  args: { id: v.id("news") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isPublished: false });
    return args.id;
  },
});

// Delete news article
export const deleteNews = mutation({
  args: { id: v.id("news") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Add attachment to news
export const addAttachmentToNews = mutation({
  args: {
    newsId: v.id("news"),
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const news = await ctx.db.get(args.newsId);
    if (!news) throw new Error("News article not found");
    
    const updatedAttachments = [...news.attachments, args.fileId];
    await ctx.db.patch(args.newsId, { attachments: updatedAttachments });
    return args.newsId;
  },
});

// Remove attachment from news
export const removeAttachmentFromNews = mutation({
  args: {
    newsId: v.id("news"),
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const news = await ctx.db.get(args.newsId);
    if (!news) throw new Error("News article not found");
    
    const updatedAttachments = news.attachments.filter(id => id !== args.fileId);
    await ctx.db.patch(args.newsId, { attachments: updatedAttachments });
    return args.newsId;
  },
});