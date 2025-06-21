import { supabase } from '@/lib/supabase';

// Read all rows from the artifacts table
async function readAllArtifacts() {
  try {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*');

    if (error) throw error;

    return data;
  } catch (error) {
    throw new Error(`Error fetching all artifacts: ${error.message}`);
  }
}

// Read specific columns from the artifacts table
async function readSpecificColumns(columns) {
  try {
    const { data, error } = await supabase
      .from('artifacts')
      .select(columns);

    if (error) throw error;

    return data;
  } catch (error) {
    throw new Error(`Error fetching specific columns: ${error.message}`);
  }
}

// Read artifacts with referenced tables
async function readArtifactsWithReferences() {
  try {
    const { data, error } = await supabase
      .from('artifacts')
      .select(`
        some_column,
        other_table (
          foreign_key
        )
      `);

    if (error) throw error;

    return data;
  } catch (error) {
    throw new Error(`Error fetching artifacts with references: ${error.message}`);
  }
}

// Read artifacts with filtering options
async function readFilteredArtifacts(filters) {
  try {
    let query = supabase
      .from('artifacts')
      .select('*');

    // Apply filters (e.g., filtering by type or date range)
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    throw new Error(`Error fetching filtered artifacts: ${error.message}`);
  }
}

export { readAllArtifacts, readSpecificColumns, readArtifactsWithReferences, readFilteredArtifacts };
