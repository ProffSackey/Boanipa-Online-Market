import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('name');
  if (error) throw error;
  return (data ?? []).map((row: any) => row.name as string);
}

async function insertCategory(name: string) {
  const { error } = await supabase.from('categories').insert({ name });
  if (error) throw error;
}

async function updateCategory(oldName: string, newName: string) {
  const { error } = await supabase
    .from('categories')
    .update({ name: newName })
    .eq('name', oldName);
  if (error) throw error;
}

async function deleteCategory(name: string) {
  const { error } = await supabase.from('categories').delete().eq('name', name);
  if (error) throw error;
}

export async function GET() {
  try {
    const categories = await fetchCategories();
    return NextResponse.json(categories);
  } catch (err) {
    console.error('GET /api/categories failed:', err);
    // return a JSON error message so the client doesn't try to parse an empty body
    return NextResponse.json({ error: 'could not fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    await insertCategory(name);
    const categories = await fetchCategories();
    return NextResponse.json(categories);
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}

// simple PATCH for rename, DELETE for remove by name
export async function PATCH(request: Request) {
  try {
    const { oldName, newName } = await request.json();
    if (!oldName || !newName) {
      return NextResponse.json({ error: 'Both old and new names required' }, { status: 400 });
    }
    await updateCategory(oldName, newName);
    const categories = await fetchCategories();
    return NextResponse.json(categories);
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}

export async function DELETE(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    await deleteCategory(name);
    const categories = await fetchCategories();
    return NextResponse.json(categories);
  } catch (err) {
    console.error(err);
    return NextResponse.error();
  }
}