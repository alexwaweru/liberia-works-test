import React from 'react'
import { render } from '@testing-library/react-native'
import Badge from '@/components/Badge'

describe('Badge', () => {
  it('renders with APPLIED status and auto-formats label', () => {
    const { getByText } = render(<Badge status="APPLIED" />)
    expect(getByText('Applied')).toBeTruthy()
  })

  it('renders with SHORTLISTED status and auto-formats label', () => {
    const { getByText } = render(<Badge status="SHORTLISTED" />)
    expect(getByText('Shortlisted')).toBeTruthy()
  })

  it('renders with REJECTED status and auto-formats label', () => {
    const { getByText } = render(<Badge status="REJECTED" />)
    expect(getByText('Rejected')).toBeTruthy()
  })

  it('renders the provided label instead of formatting status', () => {
    const { getByText } = render(<Badge status="APPLIED" label="Under Review" />)
    expect(getByText('Under Review')).toBeTruthy()
  })

  it('renders with an unknown status using fallback colors', () => {
    const { getByText } = render(<Badge status="UNKNOWN_STATUS" />)
    expect(getByText('Unknown_status')).toBeTruthy()
  })
})
