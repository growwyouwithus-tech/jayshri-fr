export const deriveCommissionsFromBookings = (bookings = []) => {
  if (!Array.isArray(bookings)) return []

  const DEFAULT_RATE = 2 // %
  const DEFAULT_TDS_RATE = 0.05

  const formatAgent = (booking, commission) => {
    return commission?.agentDetails || commission?.agent || booking.agent || booking.agentId || null
  }

  return bookings.reduce((acc, booking) => {
    const saleAmount = booking.totalAmount ?? booking.finalAmount ?? 0
    const bookingNumber = booking.bookingNumber || booking.referenceNo || booking._id?.slice(-6) || 'N/A'
    const createdAt = booking.createdAt || booking.bookingDate || new Date().toISOString()

    if (Array.isArray(booking.commissions) && booking.commissions.length > 0) {
      booking.commissions.forEach((commission, idx) => {
        const rate = commission.percentage ?? commission.rate ?? DEFAULT_RATE
        const commissionAmount = commission.amount ?? (saleAmount * rate) / 100
        const tdsAmount = commission.tdsAmount ?? commissionAmount * DEFAULT_TDS_RATE
        acc.push({
          _id: commission._id || `${booking._id}-${idx}`,
          bookingNumber,
          saleAmount,
          commissionRate: rate,
          commissionAmount,
          tdsAmount,
          finalAmount: commission.finalAmount ?? commissionAmount - tdsAmount,
          status: commission.status || 'pending',
          agent: formatAgent(booking, commission),
          createdAt,
        })
      })
      return acc
    }

    const agent = formatAgent(booking) || {
      _id: booking.createdBy?._id || `${booking._id}-unassigned`,
      name: booking.createdBy?.name || 'Unassigned'
    }

    const commissionAmount = (saleAmount * DEFAULT_RATE) / 100
    const tdsAmount = commissionAmount * DEFAULT_TDS_RATE

    acc.push({
      _id: `${booking._id}-default`,
      bookingNumber,
      saleAmount,
      commissionRate: DEFAULT_RATE,
      commissionAmount,
      tdsAmount,
      finalAmount: commissionAmount - tdsAmount,
      status: 'pending',
      agent,
      createdAt,
    })

    return acc
  }, [])
}
