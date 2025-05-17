-- Create interpretations table
CREATE TABLE IF NOT EXISTS interpretations (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  element_type TEXT NOT NULL,
  key TEXT NOT NULL,
  text_content TEXT NOT NULL
);

-- Create an index on element_type and key for fast lookups
CREATE INDEX IF NOT EXISTS idx_interpretations_element_type_key ON interpretations (element_type, key);