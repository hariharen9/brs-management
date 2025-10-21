import { useState, useEffect } from 'react'

const SEARCH_HISTORY_KEY = 'brs-search-history'
const MAX_HISTORY_ITEMS = 10

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }, [history])

  const addToHistory = (query: string) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery || trimmedQuery.length < 2) return

    setHistory(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item !== trimmedQuery)
      // Add to beginning
      const newHistory = [trimmedQuery, ...filtered]
      // Limit to max items
      return newHistory.slice(0, MAX_HISTORY_ITEMS)
    })
  }

  const removeFromHistory = (query: string) => {
    setHistory(prev => prev.filter(item => item !== query))
  }

  const clearHistory = () => {
    setHistory([])
  }

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}