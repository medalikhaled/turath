"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

const defaultReturn = {
  news: [],
  isLoading: true,
  error: null
}

export function useNews(limit = 10) {
  try {
    const [mounted, setMounted] = React.useState(false)
    
    React.useEffect(() => {
      setMounted(true)
    }, [])
    
    const news = useQuery(api.news.getPublishedNews, mounted ? { limit } : "skip")
    
    return {
      news: news || [],
      isLoading: !mounted || news === undefined,
      error: news === null && mounted ? new Error("Failed to load news") : null
    }
  } catch (error) {
    return defaultReturn
  }
}

export function useNewsWithFiles(limit = 10) {
  try {
    const [mounted, setMounted] = React.useState(false)
    
    React.useEffect(() => {
      setMounted(true)
    }, [])
    
    const news = useQuery(api.news.getPublishedNewsWithFiles, mounted ? { limit } : "skip")
    
    return {
      news: news || [],
      isLoading: !mounted || news === undefined,
      error: news === null && mounted ? new Error("Failed to load news") : null
    }
  } catch (error) {
    return defaultReturn
  }
}

export function useRecentNews(days = 30) {
  try {
    const [mounted, setMounted] = React.useState(false)
    
    React.useEffect(() => {
      setMounted(true)
    }, [])
    
    const news = useQuery(api.news.getRecentNews, mounted ? { days } : "skip")
    
    return {
      news: news || [],
      isLoading: !mounted || news === undefined,
      error: news === null && mounted ? new Error("Failed to load recent news") : null
    }
  } catch (error) {
    return defaultReturn
  }
}

