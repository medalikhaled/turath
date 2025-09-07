"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useNews(limit = 10) {
  const news = useQuery(api.news.getPublishedNews, { limit })
  
  return {
    news,
    isLoading: news === undefined,
    error: news === null ? new Error("Failed to load news") : null
  }
}

export function useNewsWithFiles(limit = 10) {
  const news = useQuery(api.news.getPublishedNewsWithFiles, { limit })
  
  return {
    news,
    isLoading: news === undefined,
    error: news === null ? new Error("Failed to load news") : null
  }
}

export function useRecentNews(days = 30) {
  const news = useQuery(api.news.getRecentNews, { days })
  
  return {
    news,
    isLoading: news === undefined,
    error: news === null ? new Error("Failed to load recent news") : null
  }
}

