CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE users(id serial PRIMARY KEY,name text NOT NULL,contact text UNIQUE NOT NULL,password_hash text NOT NULL,
  role text NOT NULL CHECK(role IN('resident','authority','volunteer')),created_at timestamptz DEFAULT now());
CREATE TABLE reports(id serial PRIMARY KEY,user_id int REFERENCES users,description text NOT NULL,photo text,
  geom geometry(Point,4326) NOT NULL,status text DEFAULT 'PENDING' CHECK(status IN('PENDING','VERIFIED','REJECTED','ARCHIVED')),
  created_at timestamptz DEFAULT now(),decided_at timestamptz);
CREATE TABLE flood_zones(id serial PRIMARY KEY,name text NOT NULL,severity text DEFAULT 'Medium',geom geometry(Geometry,4326) NOT NULL,created_at timestamptz DEFAULT now());
CREATE TABLE relief_centers(id serial PRIMARY KEY,name text NOT NULL,geom geometry(Point,4326) NOT NULL,capacity int NOT NULL CHECK(capacity>=0),
  available int NOT NULL CHECK(available>=0),status text DEFAULT 'OPEN' CHECK(status IN('OPEN','CLOSED')),updated_at timestamptz DEFAULT now(),CHECK(available<=capacity));
CREATE TABLE requests(id serial PRIMARY KEY,user_id int REFERENCES users,center_id int REFERENCES relief_centers,people int NOT NULL CHECK(people>0),need text NOT NULL,
  geom geometry(Point,4326) NOT NULL,status text DEFAULT 'PENDING' CHECK(status IN('PENDING','ACCEPTED','ASSIGNED','IN_PROGRESS','COMPLETED','RESOLVED')),created_at timestamptz DEFAULT now());
CREATE TABLE tasks(id serial PRIMARY KEY,request_id int UNIQUE REFERENCES requests,volunteer_id int REFERENCES users,
  priority text CHECK(priority IN('Low','Medium','High')),status text DEFAULT 'ASSIGNED' CHECK(status IN('ASSIGNED','IN_PROGRESS','COMPLETED')),updated_at timestamptz DEFAULT now());
CREATE INDEX ON reports USING gist(geom);CREATE INDEX ON flood_zones USING gist(geom);
CREATE INDEX ON relief_centers USING gist(geom);CREATE INDEX ON requests USING gist(geom);
INSERT INTO relief_centers(name,geom,capacity,available) VALUES
('Govt Girls School Shelter',ST_SetSRID(ST_MakePoint(74.33,31.55),4326),200,120),
('Community Hall Relief Camp',ST_SetSRID(ST_MakePoint(74.38,31.50),4326),100,0);
