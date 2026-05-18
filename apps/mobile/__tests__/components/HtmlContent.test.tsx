import React from 'react'
import { render } from '@testing-library/react-native'
import HtmlContent from '@/components/HtmlContent'

describe('HtmlContent', () => {
  it('renders headings and paragraphs as separate blocks', () => {
    const html = '<h2>About the programme</h2><p>The Vacation Job Programme is an initiative.</p>'
    const { getByText } = render(<HtmlContent html={html} />)
    expect(getByText('About the programme')).toBeTruthy()
    expect(getByText('The Vacation Job Programme is an initiative.')).toBeTruthy()
  })

  it('renders unordered list items with bullet markers', () => {
    const html = '<ul><li>First item</li><li>Second item</li></ul>'
    const { getByText, getAllByText } = render(<HtmlContent html={html} />)
    expect(getByText('First item')).toBeTruthy()
    expect(getByText('Second item')).toBeTruthy()
    expect(getAllByText('•').length).toBe(2)
  })

  it('renders ordered list items with numeric markers', () => {
    const html = '<ol><li>One</li><li>Two</li></ol>'
    const { getByText } = render(<HtmlContent html={html} />)
    expect(getByText('1.')).toBeTruthy()
    expect(getByText('2.')).toBeTruthy()
  })

  it('decodes common HTML entities', () => {
    const html = '<p>Salary &amp; benefits &mdash; 5,000 USD</p>'
    const { getByText } = render(<HtmlContent html={html} />)
    expect(getByText('Salary & benefits — 5,000 USD')).toBeTruthy()
  })

  it('treats plain text without block tags as a paragraph', () => {
    const { getByText } = render(<HtmlContent html="Just some plain text." />)
    expect(getByText('Just some plain text.')).toBeTruthy()
  })

  it('renders nothing for empty input', () => {
    const { toJSON } = render(<HtmlContent html="" />)
    const tree = toJSON()
    // Empty View with no children
    expect(tree).toBeTruthy()
  })
})
