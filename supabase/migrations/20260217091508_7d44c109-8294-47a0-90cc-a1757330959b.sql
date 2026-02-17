
-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, room_number)
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Anyone can view rooms for listed listings
CREATE POLICY "Anyone can view rooms" ON public.rooms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = rooms.listing_id AND (listings.is_listed = true OR listings.host_id = auth.uid()))
  );

-- Hosts can manage rooms on their listings
CREATE POLICY "Hosts can insert rooms" ON public.rooms
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = rooms.listing_id AND listings.host_id = auth.uid())
  );

CREATE POLICY "Hosts can update rooms" ON public.rooms
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = rooms.listing_id AND listings.host_id = auth.uid())
  );

CREATE POLICY "Hosts can delete rooms" ON public.rooms
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = rooms.listing_id AND listings.host_id = auth.uid())
  );

-- Add room_id to bookings (nullable for backward compat with existing bookings)
ALTER TABLE public.bookings ADD COLUMN room_id UUID REFERENCES public.rooms(id);

-- Update the booking validation trigger to check per-room availability
CREATE OR REPLACE FUNCTION public.check_booking_dates()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.check_out <= NEW.check_in THEN
    RAISE EXCEPTION 'Check-out date must be after check-in date';
  END IF;

  -- If room_id is set, check that specific room isn't double-booked
  IF NEW.room_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings
      WHERE room_id = NEW.room_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
        AND status != 'cancelled'
        AND check_in < NEW.check_out
        AND check_out > NEW.check_in
    ) THEN
      RAISE EXCEPTION 'This room is already booked for the selected dates';
    END IF;
  ELSE
    -- Legacy: check listing-level (no room)
    IF EXISTS (
      SELECT 1 FROM public.bookings
      WHERE listing_id = NEW.listing_id
        AND room_id IS NULL
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
        AND status != 'cancelled'
        AND check_in < NEW.check_out
        AND check_out > NEW.check_in
    ) THEN
      RAISE EXCEPTION 'Property is already booked for the selected dates';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
