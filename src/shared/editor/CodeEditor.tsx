// CodeEditor: a textarea with a syntax-highlighted overlay for write-a-query questions.
// Port of the old plain-JS createEditor. The overlay technique needs raw elements (a textarea and
// a positioned <pre> painted behind it share exact font metrics), which Astryx has no equivalent
// for; the label and description go through Astryx Field.
//
// Keys: Tab indents, Shift+Tab outdents; Esc arms the next Tab to move focus out (no keyboard
// trap — an sr-only hint explains it); Enter keeps indentation; ( and ' auto-pair. Auto-grows
// up to 24 lines, then scrolls. Callers add their own copy button.

import { Field } from '@astryxdesign/core/Field';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { useEffect, useMemo, useRef } from 'react';
import type { JSX, KeyboardEvent, MouseEvent } from 'react';
import './editor.css';
import { createHighlighter, type Syntax } from './highlight';

const MAX_LINES = 24; // auto-grow cap, then the textarea scrolls
const INDENT = '  ';

export interface CodeEditorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Keywords, operators and a "views" pattern for the highlighter (oral.query in course.json). */
  syntax?: Syntax;
  rows?: number;
  description?: string;
}

export function CodeEditor(props: CodeEditorProps): JSX.Element {
  const { id, label, value, onChange, placeholder, syntax, rows = 8, description } = props;

  const highlight = useMemo(() => createHighlighter(syntax), [syntax]);
  const helpId = `${id}-help`;
  const descriptionId = description ? `${id}-desc` : undefined;
  const describedBy = [helpId, descriptionId].filter(Boolean).join(' ');

  const taRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLPreElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const gutterInRef = useRef<HTMLDivElement>(null);
  const escToExit = useRef(false); // set by Escape: the next Tab must leave the editor
  const lastLines = useRef(-1);
  const lastDigits = useRef(-1);

  // --- rendering ---
  useEffect(() => {
    const ta = taRef.current;
    const code = codeRef.current;
    const gutter = gutterRef.current;
    const gutterIn = gutterInRef.current;
    if (!ta || !code || !gutter || !gutterIn) return;

    const lines = value.split('\n').length;
    if (lines !== lastLines.current) {
      lastLines.current = lines;
      let nums = '1';
      for (let i = 2; i <= lines; i++) nums += `\n${i}`;
      gutterIn.textContent = nums;
      const digits = String(lines).length;
      if (digits !== lastDigits.current) {
        lastDigits.current = digits;
        // ch is monospace (the gutter shares the editor font); 16px = gutter padding (10+6)
        gutter.style.width = `calc(${digits + 1}ch + 16px)`;
      }
    }
    // Trailing space keeps the overlay's last (empty) line in flow when the text ends with a
    // newline, so both layers have the same height when scrolled.
    code.innerHTML = highlight(value) + (value.endsWith('\n') ? ' ' : '');

    // Auto-grow: full height while <= ~MAX_LINES lines, then scroll inside.
    const cs = getComputedStyle(ta);
    const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 14) * 1.6;
    const padV = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const maxH = padV + Math.max(ta.rows, MAX_LINES) * lh;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, maxH)}px`;

    // The overlay and gutter are overflow:hidden boxes; mirroring scrollTop/scrollLeft keeps
    // them pixel-for-pixel with the textarea (same metrics).
    if (overlayRef.current) {
      overlayRef.current.scrollTop = ta.scrollTop;
      overlayRef.current.scrollLeft = ta.scrollLeft;
    }
    gutter.scrollTop = ta.scrollTop;
  }, [value, highlight, rows]);

  function syncScroll() {
    const ta = taRef.current;
    const overlay = overlayRef.current;
    const gutter = gutterRef.current;
    if (!ta) return;
    if (overlay) {
      overlay.scrollTop = ta.scrollTop;
      overlay.scrollLeft = ta.scrollLeft;
    }
    if (gutter) gutter.scrollTop = ta.scrollTop;
  }

  // --- edits (undoable) ---
  function insert(text: string, caretFromEnd = 0) {
    const ta = taRef.current;
    if (!ta) return;
    let done = false;
    try {
      done = document.execCommand('insertText', false, text);
    } catch {
      done = false;
    }
    if (!done) {
      // setRangeText fallback: fires no input event, so report the change manually
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
      onChange(ta.value);
    }
    if (caretFromEnd) {
      const pos = ta.selectionEnd + caretFromEnd;
      ta.setSelectionRange(pos, pos);
    }
  }

  function outdent() {
    const ta = taRef.current;
    if (!ta) return;
    const val = ta.value;
    const selStart = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    const start = val.lastIndexOf('\n', selStart - 1) + 1;
    let end = val.indexOf('\n', selEnd);
    if (end === -1) end = val.length;
    const region = val.slice(start, end);
    const caretRel = selStart - start;
    const parts: string[] = [];
    let off = 0;
    let cutsBeforeCaret = 0;
    for (const line of region.split('\n')) {
      const m = /^(?:\t| {1,2})/.exec(line); // one level = 2 spaces (or a tab)
      const cut = m ? m[0].length : 0;
      if (caretRel > off && cut) cutsBeforeCaret += Math.min(cut, caretRel - off);
      parts.push(line.slice(cut));
      off += line.length + 1;
    }
    const next = parts.join('\n');
    if (next === region) return;
    ta.setSelectionRange(start, end);
    let done = false;
    try {
      done = document.execCommand('insertText', false, next);
    } catch {
      done = false;
    }
    if (!done) {
      ta.setRangeText(next, start, end, 'end');
      onChange(ta.value);
    }
    const removed = region.length - next.length;
    const s = Math.max(start, selStart - cutsBeforeCaret);
    ta.setSelectionRange(s, Math.max(s, selEnd - removed));
  }

  // --- keyboard ---
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing) return;
    const ta = e.currentTarget;

    if (e.key === 'Escape') {
      escToExit.current = true; // do not preventDefault; only arm
      return;
    }
    if (e.key === 'Tab') {
      if (escToExit.current) {
        escToExit.current = false;
        return; // let the browser move focus out — no keyboard trap
      }
      e.preventDefault();
      if (e.shiftKey) outdent();
      else insert(INDENT);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const before = ta.value.slice(0, ta.selectionStart);
      const indent = before.slice(before.lastIndexOf('\n') + 1).match(/^[ \t]*/)?.[0] ?? '';
      insert(`\n${indent}`);
      return;
    }
    if (e.key === '(') {
      e.preventDefault();
      insert('()', -1);
      return;
    }
    if (e.key === ')' && ta.selectionStart === ta.selectionEnd && ta.value[ta.selectionEnd] === ')') {
      e.preventDefault();
      ta.setSelectionRange(ta.selectionEnd + 1, ta.selectionEnd + 1);
      return;
    }
    if (e.key === "'") {
      const next = ta.value[ta.selectionEnd] ?? '';
      if (ta.selectionStart === ta.selectionEnd && next === "'") {
        e.preventDefault();
        ta.setSelectionRange(ta.selectionEnd + 1, ta.selectionEnd + 1);
        return;
      }
      // auto-pair only outside words, so apostrophes inside text stay literal
      const prev = ta.value[ta.selectionStart - 1] ?? '';
      if (!/\w/.test(prev) && !/\w/.test(next)) {
        e.preventDefault();
        insert("''", -1);
      }
      return;
    }
  }

  function handleMouseDown(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    taRef.current?.focus();
  }

  return (
    <Field label={label} inputID={id} description={description} descriptionID={descriptionId} width="100%">
      <div className="ed-shell">
        <div className="ed-gutter" ref={gutterRef} aria-hidden="true" onMouseDown={handleMouseDown}>
          <div className="ed-gutter-in" ref={gutterInRef} />
        </div>
        <div className="ed-stack">
          <pre className="ed-overlay" ref={overlayRef} aria-hidden="true">
            <code className="ed-code" ref={codeRef} />
          </pre>
          <textarea
            className="ed-input"
            ref={taRef}
            id={id}
            value={value}
            rows={Math.max(1, rows)}
            placeholder={placeholder ?? ''}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off" /* hard horizontal scroll: overlay uses white-space: pre */
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={syncScroll}
            onFocus={() => {
              escToExit.current = false;
            }}
          />
        </div>
      </div>
      <VisuallyHidden as="span" id={helpId}>
        Tab indents. Press Esc, then Tab, to leave the editor.
      </VisuallyHidden>
    </Field>
  );
}
