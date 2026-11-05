"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  shortcut?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, shortcut = "⌘K", ...props }, ref) => {
    const hasValue = value !== undefined && value !== "";

    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          ref={ref}
          value={value}
          onChange={onChange}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-12 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {hasValue && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-sm text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {shortcut && !hasValue && (
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              {shortcut}
            </kbd>
          )}
        </div>
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
