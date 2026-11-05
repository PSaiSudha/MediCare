/*
# Seed additional doctors across all departments

## Overview
Adds 11 doctors across 8 departments so the patient portal doctor search
returns a rich directory. These are standalone doctor records (no linked
user account) — admin-created profiles that patients can book with.

## Notes
- All doctors have status 'active' and varied availability days.
- consultation_fee varies per doctor.
- user_id is intentionally NULL (no auth user linked); admin can link
  a real user account later if needed.
*/

INSERT INTO public.doctors (full_name, specialization, bio, consultation_fee, department_id, availability_days, status) VALUES
  ('James Carter', 'Interventional Cardiologist', 'Specializes in coronary artery disease, heart failure, and preventive cardiology with 15 years of experience.', 250.00, '32be3b2b-d8ea-455a-b2a1-15a82d82b092', ARRAY['Monday','Tuesday','Wednesday','Friday'], 'active'),
  ('Emily Chen', 'Cardiac Electrophysiologist', 'Expert in heart rhythm disorders, pacemakers, and catheter ablation procedures.', 300.00, '32be3b2b-d8ea-455a-b2a1-15a82d82b092', ARRAY['Tuesday','Thursday','Friday'], 'active'),
  ('Robert Hayes', 'Neurologist', 'Focused on stroke management, epilepsy, and movement disorders. Board-certified in neurology.', 220.00, 'c1cb8a60-4601-4730-a303-5ac2e321e6bd', ARRAY['Monday','Wednesday','Thursday'], 'active'),
  ('Patel Anika', 'Pediatric Neurologist', 'Cares for children with neurological conditions including seizures, developmental delays, and headaches.', 280.00, 'c1cb8a60-4601-4730-a303-5ac2e321e6bd', ARRAY['Monday','Tuesday','Friday'], 'active'),
  ('Michael Brennan', 'Orthopedic Surgeon', 'Joint replacement and sports medicine specialist. Treats fractures, arthritis, and ligament injuries.', 200.00, '8c653819-55e7-4b64-8a68-f1e2aabc094f', ARRAY['Monday','Tuesday','Wednesday','Thursday'], 'active'),
  ('Sarah Goldstein', 'Pediatrician', 'General pediatric care, vaccinations, and developmental screenings for children from birth to age 18.', 150.00, '54f40906-316c-40e9-98ad-01476afdad54', ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'], 'active'),
  ('David Okafor', 'Neonatologist', 'Specialized care for newborns and premature infants in the NICU.', 350.00, '54f40906-316c-40e9-98ad-01476afdad54', ARRAY['Wednesday','Thursday','Friday'], 'active'),
  ('Lisa Romano', 'Dermatologist', 'Treats acne, eczema, psoriasis, skin cancer screening, and cosmetic dermatology procedures.', 180.00, 'f66ce544-42c0-49d1-b3b5-475abab4df37', ARRAY['Monday','Tuesday','Thursday','Friday'], 'active'),
  ('Kevin Tran', 'Ophthalmologist', 'Comprehensive eye care including cataract surgery, glaucoma management, and refractive consultations.', 240.00, 'f5a919cc-378f-4092-bd68-10d74d9b2518', ARRAY['Tuesday','Wednesday','Thursday'], 'active'),
  ('Maria Santos', 'Psychiatrist', 'Adult and adolescent psychiatry. Specializes in anxiety, depression, and ADHD management.', 260.00, '3eea6ac3-7355-4614-a529-aa642605ec6b', ARRAY['Monday','Wednesday','Friday'], 'active'),
  ('Andrew Wells', 'General Practitioner', 'Primary care physician offering annual checkups, chronic disease management, and preventive health counseling.', 120.00, '8adfb28f-518f-4033-a2ca-84bb570ed90e', ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'], 'active');
