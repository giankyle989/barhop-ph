-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column derived from lat/lng
ALTER TABLE listings ADD COLUMN location geography(Point, 4326);

-- Create spatial index
CREATE INDEX listings_location_idx ON listings USING GIST (location);

-- Create function to auto-update location from lat/lng
CREATE OR REPLACE FUNCTION update_listing_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER listing_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON listings
FOR EACH ROW
EXECUTE FUNCTION update_listing_location();

-- Add full-text search index
ALTER TABLE listings ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX listings_search_idx ON listings USING GIN (search_vector);

-- GIN index for array containment queries on categories
CREATE INDEX listings_categories_idx ON listings USING GIN (categories);
