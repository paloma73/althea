'use client'

interface Props {
  templates: string[]
  onSelect: (text: string) => void
  label?: string
}

export default function TemplateChips({ templates, onSelect, label }: Props) {
  if (templates.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {label && (
        <span className="text-xs text-muted-foreground self-center mr-1">{label}</span>
      )}
      {templates.map((tpl) => (
        <button
          key={tpl}
          type="button"
          onClick={() => onSelect(tpl)}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer"
          title={`Ajouter : ${tpl}`}
        >
          {tpl}
        </button>
      ))}
    </div>
  )
}
