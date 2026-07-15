-- Day 92: Organizer Analytics - Growth Metrics RPC
-- This function aggregates user sign-ups and project submissions per month.

CREATE OR REPLACE FUNCTION get_growth_metrics()
RETURNS TABLE (
  month text,
  users bigint,
  projects bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_users AS (
    SELECT 
      to_char(created_at, 'Mon') as m,
      count(*) as u_count,
      extract(year from created_at) as yr,
      extract(month from created_at) as mo
    FROM profiles
    GROUP BY yr, mo, m
  ),
  monthly_projects AS (
    SELECT 
      to_char(created_at, 'Mon') as m,
      count(*) as p_count,
      extract(year from created_at) as yr,
      extract(month from created_at) as mo
    FROM projects
    GROUP BY yr, mo, m
  )
  SELECT 
    u.m, 
    u.u_count, 
    COALESCE(p.p_count, 0)
  FROM monthly_users u
  LEFT JOIN monthly_projects p ON u.m = p.m AND u.yr = p.yr AND u.mo = p.mo
  ORDER BY u.yr, u.mo;
END;
$$ LANGUAGE plpgsql;
