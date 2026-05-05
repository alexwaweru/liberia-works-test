import type React from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../../ui/context-menu";
import { cn } from "../../../../lib/utils";
import type { CardItemProps } from "../types";

export function CardItem({
  item,
  density,
  isSelected,
  onSelect,
  onItemOpen,
  contextMenuActions,
  selectedItems,
  renderCard,
}: CardItemProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onSelect(item.id, e.shiftKey, e.metaKey || e.ctrlKey);
  };

  const handleDoubleClick = () => {
    onItemOpen?.(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onItemOpen?.(item);
    } else if (e.key === " ") {
      e.preventDefault();
      onSelect(item.id, e.shiftKey, e.metaKey || e.ctrlKey);
    }
  };

  const cardContent = (
    <div
      role="option"
      data-slot="card-item"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={item.name}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "cursor-pointer rounded-lg border transition-colors overflow-hidden",
        "hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "ring-2 ring-primary",
        !renderCard && "flex flex-col gap-1",
        !renderCard && density === "compact" && "p-1",
        !renderCard && density === "regular" && "p-2",
        !renderCard && density === "expanded" && "p-3",
      )}
    >
      {renderCard ? (
        renderCard(item, { onOpen: () => onItemOpen?.(item) })
      ) : (
        <>
          {/* Thumbnail area */}
          <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={item.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground" aria-hidden="true">
                <ImageIcon className="size-8" />
              </div>
            )}
          </div>

          {/* Name */}
          <p
            className={cn(
              "truncate font-medium",
              density === "compact" ? "text-xs" : "text-sm"
            )}
          >
            {item.name}
          </p>

          {/* Metadata - only for regular and expanded densities */}
          {density !== "compact" && (
            <div className="flex flex-col gap-0.5">
              {density === "regular" &&
                Object.entries(item.metadata)
                  .slice(0, 2)
                  .map(([key, value]) => (
                    <span key={key} className="truncate text-xs text-muted-foreground">
                      <span className="sr-only">{key}: </span>
                      {String(value)}
                    </span>
                  ))}
              {density === "expanded" &&
                Object.entries(item.metadata).map(([key, value]) => (
                  <span key={key} className="text-xs text-muted-foreground">
                    {key}: {String(value)}
                  </span>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  // If no context menu actions, return just the card
  if (!contextMenuActions || contextMenuActions.length === 0) {
    return cardContent;
  }

  // Wrap in context menu if actions are provided
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>
      <ContextMenuContent>
        {contextMenuActions.map((action) => (
          <ContextMenuItem
            key={action.id}
            disabled={action.disabled}
            variant={action.destructive ? "destructive" : "default"}
            onClick={() => action.onAction(selectedItems)}
          >
            {action.icon && <span aria-hidden="true">{action.icon}</span>}
            {action.label}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
