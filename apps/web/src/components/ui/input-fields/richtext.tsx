import * as React from "react";
import { useRef, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Unlink2,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FieldWrapper } from "./field-wrapper";
import type { BaseFieldProps } from "./types";
import type { Editor } from "@tiptap/react";

interface RichTextInputProps extends BaseFieldProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxCharacters?: number;
  showWordCount?: boolean;
  showCharacterCount?: boolean;
}

function ToolbarSeparator() {
  return <div className="mx-0.5 h-5 w-px bg-border" role="separator" aria-orientation="vertical" />;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      disabled={disabled}
      className={cn(isActive && "bg-accent text-accent-foreground")}
      aria-label={ariaLabel}
      aria-pressed={isActive}
    >
      {children}
    </Button>
  );
}

const SAFE_URL_PATTERN = /^(https?:\/\/|mailto:)/i;

function isSafeUrl(url: string): boolean {
  return SAFE_URL_PATTERN.test(url.trim());
}

function LinkButton({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      const currentUrl = editor.getAttributes("link").href ?? "";
      setUrl(currentUrl);
      setUrlError("");
    }
    setOpen(isOpen);
  }

  const [urlError, setUrlError] = useState("");

  function handleApply() {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isSafeUrl(trimmed)) {
      setUrlError("URL must start with http://, https://, or mailto:");
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmed })
      .run();
    setOpen(false);
    setUrl("");
    setUrlError("");
  }

  function handleRemove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
    setUrl("");
  }

  const isActive = editor.isActive("link");

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          className={cn(isActive && "bg-accent text-accent-foreground")}
          aria-label={isActive ? "Edit link" : "Insert link"}
          aria-pressed={isActive}
        >
          <Link2 className="size-3" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-[calc(100vw-2rem)] p-3" align="start">
        <div className="space-y-2">
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setUrlError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply();
              }
            }}
            aria-label="URL"
            aria-invalid={!!urlError}
            aria-describedby={urlError ? "link-url-error" : undefined}
            className="h-8"
          />
          {urlError && (
            <p id="link-url-error" className="text-xs text-destructive" role="alert">{urlError}</p>
          )}
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={!url}
            >
              Apply
            </Button>
            {isActive && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
              >
                <Unlink2 className="size-3" aria-hidden="true" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Toolbar({
  editor,
  disabled,
}: {
  editor: Editor | null;
  disabled?: boolean;
}) {
  if (!editor) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1"
      role="toolbar"
      aria-label="Formatting options"
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        disabled={disabled}
        ariaLabel="Bold"
      >
        <Bold className="size-3" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        disabled={disabled}
        ariaLabel="Italic"
      >
        <Italic className="size-3" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        disabled={disabled}
        ariaLabel="Underline"
      >
        <UnderlineIcon className="size-3" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        disabled={disabled}
        ariaLabel="Strikethrough"
      >
        <Strikethrough className="size-3" aria-hidden="true" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        isActive={editor.isActive("heading", { level: 1 })}
        disabled={disabled}
        ariaLabel="Heading 1"
      >
        <Heading1 className="size-3" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        isActive={editor.isActive("heading", { level: 2 })}
        disabled={disabled}
        ariaLabel="Heading 2"
      >
        <Heading2 className="size-3" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        isActive={editor.isActive("heading", { level: 3 })}
        disabled={disabled}
        ariaLabel="Heading 3"
      >
        <Heading3 className="size-3" aria-hidden="true" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        disabled={disabled}
        ariaLabel="Bullet list"
      >
        <List className="size-3" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        disabled={disabled}
        ariaLabel="Ordered list"
      >
        <ListOrdered className="size-3" aria-hidden="true" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        disabled={disabled}
        ariaLabel="Blockquote"
      >
        <Quote className="size-3" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        disabled={disabled}
        ariaLabel="Code block"
      >
        <Code2 className="size-3" aria-hidden="true" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
        isActive={editor.isActive({ textAlign: "left" })}
        disabled={disabled}
        ariaLabel="Align left"
      >
        <AlignLeft className="size-3" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
        isActive={editor.isActive({ textAlign: "center" })}
        disabled={disabled}
        ariaLabel="Align center"
      >
        <AlignCenter className="size-3" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
        isActive={editor.isActive({ textAlign: "right" })}
        disabled={disabled}
        ariaLabel="Align right"
      >
        <AlignRight className="size-3" aria-hidden="true" />
      </ToolbarButton>

      <ToolbarSeparator />

      <LinkButton editor={editor} disabled={disabled} />

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        ariaLabel="Undo"
      >
        <Undo2 className="size-3" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        ariaLabel="Redo"
      >
        <Redo2 className="size-3" aria-hidden="true" />
      </ToolbarButton>
    </div>
  );
}

function RichTextInput({
  label,
  error,
  helperText,
  required,
  disabled,
  id,
  className,
  value,
  onChange,
  placeholder,
  minHeight = "150px",
  maxCharacters,
  showWordCount,
  showCharacterCount,
}: RichTextInputProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      CharacterCount.configure({
        limit: maxCharacters ?? undefined,
      }),
    ],
    content: value ?? "",
    editable: !disabled,
    onUpdate: ({ editor: ed }: { editor: Editor }) => {
      onChangeRef.current?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (value !== undefined && value !== currentHtml) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  // Sync editable state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  // Store FieldWrapper-provided IDs for use in ARIA effect
  const fieldIdRef = useRef<string>("");
  const labelIdRef = useRef<string | undefined>(undefined);
  const describedByRef = useRef<string | undefined>(undefined);

  // Sync ARIA attributes on the contenteditable element
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom;
    if (fieldIdRef.current) {
      el.setAttribute("id", fieldIdRef.current);
    }
    if (labelIdRef.current) {
      el.setAttribute("aria-labelledby", labelIdRef.current);
    } else {
      el.removeAttribute("aria-labelledby");
    }
    el.setAttribute("aria-invalid", String(!!error));
    el.setAttribute("aria-required", String(!!required));
    if (describedByRef.current) {
      el.setAttribute("aria-describedby", describedByRef.current);
    } else {
      el.removeAttribute("aria-describedby");
    }
  }, [editor, error, required, label]);

  const characterCount = editor?.storage.characterCount?.characters() ?? 0;
  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const showFooter = showCharacterCount || showWordCount;

  return (
    <FieldWrapper
      id={id}
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}
    >
      {({ id: fieldId, labelId, describedBy }) => {
        // Store FieldWrapper IDs for the ARIA useEffect
        fieldIdRef.current = fieldId;
        labelIdRef.current = labelId;
        describedByRef.current = describedBy;

        return (
          <div
            className={cn(
              "overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-colors",
              "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
              error &&
                "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
              disabled && "pointer-events-none bg-muted/30",
            )}
          >
            <Toolbar editor={editor} disabled={disabled} />
            <EditorContent
              editor={editor}
              className={cn(
                "prose prose-sm max-w-none px-3 py-2 overflow-x-auto",
                "text-foreground",
                "prose-headings:text-foreground",
                "prose-strong:text-foreground",
                "prose-a:text-primary",
                "prose-blockquote:text-muted-foreground prose-blockquote:border-border",
                "prose-code:text-foreground",
                "prose-pre:bg-muted prose-pre:text-foreground",
                "prose-hr:border-border",
                "prose-th:text-foreground",
                "prose-lead:text-muted-foreground",
                "[&_.tiptap]:outline-none",
                "[&_.tiptap.is-editor-empty_.is-empty::before]:text-muted-foreground",
                "[&_.tiptap.is-editor-empty_.is-empty::before]:float-left",
                "[&_.tiptap.is-editor-empty_.is-empty::before]:h-0",
                "[&_.tiptap.is-editor-empty_.is-empty::before]:pointer-events-none",
                "[&_.tiptap.is-editor-empty_.is-empty::before]:content-[attr(data-placeholder)]",
              )}
              style={{ minHeight }}
            />
            {showFooter && (
              <div
                className="flex justify-end gap-3 border-t border-input px-3 py-1.5 text-xs text-muted-foreground"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {showCharacterCount && (
                  <span>
                    {maxCharacters
                      ? `${characterCount} / ${maxCharacters} characters`
                      : `${characterCount} characters`}
                  </span>
                )}
                {showWordCount && <span>{wordCount} words</span>}
              </div>
            )}
          </div>
        );
      }}
    </FieldWrapper>
  );
}

export { RichTextInput };
export type { RichTextInputProps };
