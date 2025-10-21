interface SearchHighlightProps {
  text: string
  query: string
  className?: string
}

export function SearchHighlight({ text, query, className = '' }: SearchHighlightProps) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  )
}