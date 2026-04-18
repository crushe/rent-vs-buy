'use client';

import { createClient } from './supabase';
import type { ScenarioState } from './urlState';

export interface SavedScenario {
  id: string;
  name: string;
  state: ScenarioState;
  createdAt: string;
  updatedAt: string;
}

interface SupabaseRow {
  id: string;
  name: string;
  state: ScenarioState;
  created_at: string;
  updated_at: string;
}

const rowToScenario = (row: SupabaseRow): SavedScenario => ({
  id: row.id,
  name: row.name,
  state: row.state,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listScenarios(): Promise<SavedScenario[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as SupabaseRow[]).map(rowToScenario);
}

export async function saveScenario(name: string, state: ScenarioState): Promise<SavedScenario> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('scenarios')
    .insert({ user_id: user.id, name, state })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToScenario(data as SupabaseRow);
}

export async function updateScenario(
  id: string,
  updates: { name?: string; state?: ScenarioState }
): Promise<SavedScenario> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scenarios')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToScenario(data as SupabaseRow);
}

export async function deleteScenario(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('scenarios').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
