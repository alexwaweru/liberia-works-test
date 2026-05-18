import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { lwColors, lwFont } from '@/lib/theme'

type InlineSpan = { text: string; bold?: boolean }

type Block =
  | { kind: 'h1' | 'h2' | 'h3' | 'h4' | 'p'; spans: InlineSpan[] }
  | { kind: 'li'; spans: InlineSpan[]; ordered: boolean; index: number }

const BLOCK_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'br', 'div', 'blockquote']

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
}

function parseInline(html: string): InlineSpan[] {
  const spans: InlineSpan[] = []
  let i = 0
  let bold = 0
  let buf = ''

  const flush = () => {
    if (buf) {
      spans.push({ text: decodeEntities(buf), bold: bold > 0 || undefined })
      buf = ''
    }
  }

  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i)
      if (end === -1) {
        buf += html.slice(i)
        break
      }
      const tag = html.slice(i + 1, end).trim().toLowerCase()
      const isClose = tag.startsWith('/')
      const name = (isClose ? tag.slice(1) : tag).split(/\s|\//)[0]
      if (name === 'strong' || name === 'b') {
        flush()
        bold += isClose ? -1 : 1
      } else {
        // unknown inline tag — skip
      }
      i = end + 1
    } else {
      buf += html[i]
      i++
    }
  }
  flush()
  return spans.filter((s) => s.text.length > 0)
}

function parseBlocks(html: string): Block[] {
  // Normalize: drop comments and scripts, collapse whitespace within text runs
  let src = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')

  // Split at block-level boundaries, marking the tag context
  const blocks: Block[] = []
  const re = new RegExp(`<(/?)(${BLOCK_TAGS.join('|')})(\\s[^>]*)?>`, 'gi')

  let cursor = 0
  let currentTag: string = 'p'
  let inList: 'ul' | 'ol' | null = null
  let listIndex = 0
  let buf = ''

  const flushBlock = () => {
    const text = buf.replace(/[ \t\r\n]+/g, ' ').trim()
    buf = ''
    if (!text) return
    const spans = parseInline(text)
    if (spans.length === 0) return
    if (currentTag === 'li') {
      listIndex += 1
      blocks.push({ kind: 'li', spans, ordered: inList === 'ol', index: listIndex })
    } else if (currentTag === 'h1' || currentTag === 'h2' || currentTag === 'h3' || currentTag === 'h4') {
      blocks.push({ kind: currentTag, spans })
    } else if (currentTag === 'h5' || currentTag === 'h6') {
      blocks.push({ kind: 'h4', spans })
    } else {
      blocks.push({ kind: 'p', spans })
    }
  }

  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    buf += src.slice(cursor, m.index)
    cursor = m.index + m[0].length

    const closing = m[1] === '/'
    const name = m[2].toLowerCase()

    if (name === 'br') {
      flushBlock()
      currentTag = 'p'
      continue
    }

    if (name === 'ul' || name === 'ol') {
      flushBlock()
      if (!closing) {
        inList = name as 'ul' | 'ol'
        listIndex = 0
      } else {
        inList = null
      }
      currentTag = 'p'
      continue
    }

    if (name === 'li') {
      flushBlock()
      currentTag = closing ? 'p' : 'li'
      continue
    }

    // p, h1-6, div, blockquote
    flushBlock()
    currentTag = closing ? 'p' : name
  }
  buf += src.slice(cursor)
  flushBlock()

  return blocks
}

type Props = {
  html: string
}

function joinSpans(spans: InlineSpan[]): string {
  return spans.map((s) => s.text).join('')
}

export default function HtmlContent({ html }: Props) {
  const blocks = useMemo(() => parseBlocks(html), [html])

  return (
    <View>
      {blocks.map((block, i) => {
        const text = joinSpans(block.spans)

        if (block.kind === 'li') {
          const marker = block.ordered ? `${block.index}.` : '•'
          return (
            <View key={i} style={styles.liRow}>
              <Text style={styles.liMarker}>{marker}</Text>
              <Text style={styles.liText}>{text}</Text>
            </View>
          )
        }

        return (
          <Text key={i} style={styles[block.kind]}>
            {text}
          </Text>
        )
      })}
    </View>
  )
}

const baseText = {
  fontFamily: lwFont.family,
  color: lwColors.foreground,
  fontSize: 14,
  lineHeight: 22,
}

const styles = StyleSheet.create({
  p: { ...baseText, marginBottom: 12 },
  h1: { fontFamily: lwFont.familyBold, color: lwColors.foreground, fontSize: 20, lineHeight: 28, marginTop: 12, marginBottom: 8 },
  h2: { fontFamily: lwFont.familyBold, color: lwColors.foreground, fontSize: 18, lineHeight: 26, marginTop: 12, marginBottom: 8 },
  h3: { fontFamily: lwFont.familyBold, color: lwColors.foreground, fontSize: 16, lineHeight: 24, marginTop: 10, marginBottom: 6 },
  h4: { fontFamily: lwFont.familyBold, color: lwColors.foreground, fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 6 },
  bold: { fontFamily: lwFont.familyBold },
  liRow: { flexDirection: 'row', marginBottom: 6, paddingLeft: 4 },
  liMarker: { ...baseText, width: 18 },
  liText: { ...baseText, flex: 1 },
})
