"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface TagInputProps {
  /** Current list of tags */
  tags: string[];
  /** Setter for the tags array */
  setTags: (tags: string[]) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Input label */
  label?: string;
  /** Icon to show next to label */
  icon?: React.ReactNode;
}

/**
 * TagInput — reusable multi-tag input with add/remove chips.
 *
 * Extracted from duplicated logic in sponsor-company-form and opportunity-form.
 * Supports Enter to add, Plus button to add, and X to remove.
 */
export function TagInput({ tags, setTags, placeholder, label, icon }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags([...tags, trimmed]);
  };

  const handleAdd = () => {
    addTag(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
          {icon && icon}
          {label}
        </label>
      )}

      <div className="flex gap-2 mt-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-xl bg-surface/10 border border-border px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="p-2.5 rounded-xl bg-surface/10 border border-border text-secondary hover:text-primary hover:bg-surface/10 transition-all disabled:opacity-40"
        >
          <Plus size={18} />
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface/10 border border-border text-[11px] text-secondary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="text-secondary/50 hover:text-primary-red"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
