-- Add category column to projects table for high-level project classification

ALTER TABLE projects
  ADD COLUMN category text DEFAULT NULL;

-- Predefined project categories
COMMENT ON COLUMN projects.category IS 'Project category: Web App, Mobile App, AI/ML, Data Science, Blockchain, Hardware/IoT, DevOps/Tools, Game Dev, Open Source Tool, Other';
