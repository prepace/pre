import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  const { id } = params

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: 'Collection not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, collection: data })
}

export async function PUT(request, { params }) {
  const { id } = params
  const updates = await request.json()

  // stamp updated_at
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, collection: data[0] })
}

export async function DELETE(request, { params }) {
  const { id } = params

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
