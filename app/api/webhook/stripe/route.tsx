import stripe from 'stripe'
import { NextResponse } from 'next/server'
import GlobalApi from '../../../../app/_services/GlobalApi'
import moment from 'moment'

export async function POST(request: Request) {
  const body = await request.text()

  const sig = request.headers.get('stripe-signature') as string
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    return NextResponse.json({ message: 'Webhook error', error: err })
  }

  // Get the ID and type
  const eventType = event.type

  // CREATE
  if (eventType === 'checkout.session.completed') {
    const { id, amount_total, metadata, } = event.data.object

    const order = {
      businessId: metadata.business.id,
      date: moment(metadata.date).format('DD-MMM-yyyy'),
      selectedTime: metadata.selectedTime,
      userEmail: metadata.userEmail,
      userName: metadata.userName,
      time: metadata.time
    }

    const newOrder = await GlobalApi.createNewBooking(order)
    return NextResponse.json({ message: 'OK', order: newOrder })
  }

  return new Response('', { status: 200 })
}