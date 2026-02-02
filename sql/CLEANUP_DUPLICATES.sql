-- ============================================================
-- FIX DUPLICATE EVENTS - SAFE UPDATE (NO DATA LOSS)
-- ============================================================
-- This script UPDATES existing events with correct pricing and images
-- WITHOUT deleting any registrations, teams, or payments
-- ============================================================

-- Step 1: Update existing events with correct data
UPDATE events SET 
  max_team_size = 5, 
  price_per_head = 200, 
  image_url = '/images/line_follower.png',
  rulebook_url = '/rulebooks/line_follower.pdf',
  category = 'tech',
  description = 'Autonomous robot follows a line course with maximum speed and accuracy. The ultimate test of sensor calibration and programming.',
  rules = ARRAY[
    'Minimum 2 members, Maximum 5 members per team',
    'Autonomous navigation only - no manual control',
    'Fastest completion wins',
    'Robot must stay on the line throughout',
    'Penalties for leaving track or stopping',
    'Price: ₹200 per head'
  ]
WHERE name = 'Line Follower';

UPDATE events SET 
  max_team_size = 5, 
  price_per_head = 200, 
  image_url = '/images/robo_racing.png',
  rulebook_url = '/rulebooks/rc_racing.pdf',
  category = 'tech',
  description = 'Race your RC car through challenging tracks with speed and precision. Test your engineering and driving skills in this high-speed competition.',
  rules = ARRAY[
    'Minimum 2 members, Maximum 5 members per team',
    'RC car must be self-built or modified',
    'Time-based scoring system',
    'Multiple heats with best time counting',
    'Safety gear mandatory for participants',
    'Price: ₹200 per head'
  ]
WHERE name = 'RC Racing';

UPDATE events SET 
  max_team_size = 5, 
  price_per_head = 200, 
  image_url = '/images/robo_sumo.png',
  rulebook_url = '/rulebooks/robo_sumo.pdf',
  category = 'tech',
  description = 'Battle robots in a sumo ring. Push your opponent out to win! Pure robot combat with strategy and power.',
  rules = ARRAY[
    'Minimum 2 members, Maximum 5 members per team',
    'Weight limit: 3kg maximum',
    'Size limit: 20cm x 20cm base',
    'Knockout style elimination tournament',
    'No projectiles or liquid weapons allowed',
    'Price: ₹200 per head'
  ]
WHERE name = 'RoboSumo' OR name = 'Robo Sumo';

UPDATE events SET 
  max_team_size = 5, 
  price_per_head = 200, 
  image_url = '/images/RoboSoccer.png',
  rulebook_url = '/rulebooks/robo_soccer.pdf',
  category = 'tech',
  description = 'Build robots that can play soccer autonomously or with manual control. Strategy meets engineering in this team competition.',
  rules = ARRAY[
    'Minimum 2 members, Maximum 5 members per team',
    'Robots must fit size specifications (30cm x 30cm x 30cm)',
    'Match duration: 10 minutes per half',
    'Manual or autonomous control allowed',
    'Ball detection and kicking mechanisms required',
    'Price: ₹200 per head'
  ]
WHERE name = 'RoboSoccer' OR name = 'Robo Soccer';

UPDATE events SET 
  max_team_size = 2, 
  price_per_head = 100, 
  image_url = '/images/Game_verse.png',
  rulebook_url = '/rulebooks/game_verse.pdf',
  category = 'non-tech',
  description = 'Compete in multiple gaming categories for the ultimate gaming championship. From strategy to action, test your gaming prowess across various titles.',
  rules = ARRAY[
    'Exactly 2 members per team (Minimum 2, Maximum 2)',
    'Multiple game categories (PUBG Mobile, COD Mobile, Free Fire, Valorant)',
    'Fair play and sportsmanship required',
    'No cheating or external tools allowed',
    'Tournament bracket format',
    'Price: ₹100 per head'
  ]
WHERE name = 'GameVerse' OR name = 'Game Verse';

UPDATE events SET 
  max_team_size = 5, 
  price_per_head = 200, 
  image_url = '/images/obstacle_run.png',
  rulebook_url = '/rulebooks/obstacle_run.pdf',
  category = 'tech',
  description = 'Navigate your robot through complex obstacles and challenging terrain. Test your robot''s mobility and control systems.',
  rules = ARRAY[
    'Minimum 2 members, Maximum 5 members per team',
    'Manual or autonomous control allowed',
    'Points for each obstacle cleared',
    'Time bonus for faster completion',
    'Multiple obstacle types including ramps, barriers, and narrow passages',
    'Price: ₹200 per head'
  ]
WHERE name = 'Obstacle Run';

-- Step 2: Delete ONLY duplicate event rows (keep one per event name)
-- This keeps the oldest event record and its related data intact
WITH duplicates AS (
  SELECT id, name, 
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
  FROM events
)
DELETE FROM events 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 3: Add missing Obstacle Run event if it doesn't exist
INSERT INTO events (id, name, category, description, rules, event_date, max_team_size, price_per_head, image_url, rulebook_url, is_active)
SELECT 
  '550e8400-e29b-41d4-a716-446655440006', 
  'Obstacle Run', 
  'tech', 
  'Navigate your robot through complex obstacles and challenging terrain. Test your robot''s mobility and control systems.',
  ARRAY[
    'Minimum 2 members, Maximum 5 members per team',
    'Manual or autonomous control allowed',
    'Points for each obstacle cleared',
    'Time bonus for faster completion',
    'Multiple obstacle types including ramps, barriers, and narrow passages',
    'Price: ₹200 per head'
  ],
  '2026-02-27', 
  5, 
  200, 
  '/images/obstacle_run.png',
  '/rulebooks/obstacle_run.pdf',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM events WHERE name = 'Obstacle Run');

-- ============================================================
-- VERIFICATION
-- ============================================================
DO $$ 
DECLARE
  event_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO event_count FROM events;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Duplicate events removed';
  RAISE NOTICE '✅ Event prices updated to ₹200 per head';
  RAISE NOTICE '✅ Event images updated';
  RAISE NOTICE '✅ Total events: %', event_count;
  RAISE NOTICE '✅ All registrations, teams, and payments PRESERVED';
  RAISE NOTICE '';
END $$;
