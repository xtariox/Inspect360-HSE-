-- Enhanced Prebuilt Templates with Comprehensive Field Coverage
-- Execute this script in your Supabase SQL editor

INSERT INTO templates (
  id,
  title,
  description,
  category,
  tags,
  sections,
  created_by,
  created_at,
  updated_at,
  is_active,
  is_prebuilt
) VALUES 
-- 1. Enhanced Safety Equipment Inspection
(
  'tpl_safety_equipment_enhanced',
  'Safety Equipment Inspection',
  'Comprehensive inspection of personal protective equipment and safety devices',
  'safety',
  ARRAY['safety', 'ppe', 'equipment'],
  '[
    {
      "id": "safety_equipment_section",
      "title": "Safety Equipment Assessment",
      "description": "Detailed inspection of safety equipment and PPE",
      "fields": [
        {
          "id": "inspector_name",
          "label": "Inspector Name",
          "type": "text",
          "required": true,
          "placeholder": "Enter inspector full name"
        },
        {
          "id": "inspection_date",
          "label": "Inspection Date",
          "type": "date",
          "required": true
        },
        {
          "id": "inspection_time",
          "label": "Inspection Time",
          "type": "time",
          "required": true
        },
        {
          "id": "location",
          "label": "Location/Area",
          "type": "text",
          "required": true,
          "placeholder": "Building, floor, room number"
        },
        {
          "id": "equipment_photo",
          "label": "Equipment Overview Photo",
          "type": "image",
          "required": true,
          "placeholder": "Take photo of equipment being inspected"
        },
        {
          "id": "hard_hat_condition",
          "label": "Hard Hat Condition",
          "type": "select",
          "required": true,
          "options": ["Excellent", "Good", "Fair", "Poor", "Damaged"]
        },
        {
          "id": "hard_hat_photo",
          "label": "Hard Hat Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of hard hat condition"
        },
        {
          "id": "safety_glasses_available",
          "label": "Safety Glasses Available",
          "type": "boolean",
          "required": true
        },
        {
          "id": "safety_glasses_condition",
          "label": "Safety Glasses Condition",
          "type": "select",
          "required": false,
          "options": ["Excellent", "Good", "Scratched", "Cracked", "Missing"]
        },
        {
          "id": "gloves_condition",
          "label": "Work Gloves Condition",
          "type": "select",
          "required": true,
          "options": ["New", "Good", "Worn", "Torn", "Missing"]
        },
        {
          "id": "safety_boots_condition",
          "label": "Safety Boots Condition",
          "type": "select",
          "required": true,
          "options": ["Excellent", "Good", "Worn Soles", "Damaged", "Non-compliant"]
        },
        {
          "id": "first_aid_kit_accessible",
          "label": "First Aid Kit Accessible",
          "type": "boolean",
          "required": true
        },
        {
          "id": "first_aid_kit_photo",
          "label": "First Aid Kit Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of first aid kit and contents"
        },
        {
          "id": "fire_extinguisher_present",
          "label": "Fire Extinguisher Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "fire_extinguisher_pressure",
          "label": "Fire Extinguisher Pressure",
          "type": "select",
          "required": false,
          "options": ["Normal", "Low", "Empty", "Expired"]
        },
        {
          "id": "emergency_contacts_posted",
          "label": "Emergency Contacts Posted",
          "type": "boolean",
          "required": true
        },
        {
          "id": "additional_observations",
          "label": "Additional Observations",
          "type": "textarea",
          "required": false,
          "placeholder": "Any additional safety concerns or recommendations"
        },
        {
          "id": "corrective_actions_needed",
          "label": "Corrective Actions Needed",
          "type": "textarea",
          "required": false,
          "placeholder": "List any corrective actions required"
        },
        {
          "id": "priority_level",
          "label": "Priority Level",
          "type": "select",
          "required": true,
          "options": ["Low", "Medium", "High", "Critical"]
        },
        {
          "id": "compliance_score",
          "label": "Overall Compliance Score (1-10)",
          "type": "number",
          "required": true,
          "placeholder": "Rate from 1 (poor) to 10 (excellent)"
        }
      ]
    }
  ]'::jsonb,
  NULL,
  NOW(),
  NOW(),
  true,
  true
),

-- 2. Enhanced Workplace Safety Inspection
(
  'tpl_workplace_safety_enhanced',
  'Workplace Safety Inspection',
  'Comprehensive workplace safety assessment covering all major safety aspects',
  'safety',
  ARRAY['workplace', 'safety', 'environment'],
  '[
    {
      "id": "workplace_safety_section",
      "title": "Workplace Safety Assessment",
      "description": "Complete evaluation of workplace safety conditions",
      "fields": [
        {
          "id": "inspector_name",
          "label": "Inspector Name",
          "type": "text",
          "required": true,
          "placeholder": "Enter inspector full name"
        },
        {
          "id": "inspection_date",
          "label": "Inspection Date",
          "type": "date",
          "required": true
        },
        {
          "id": "inspection_time",
          "label": "Inspection Time",
          "type": "time",
          "required": true
        },
        {
          "id": "department",
          "label": "Department/Section",
          "type": "text",
          "required": true,
          "placeholder": "Department or work section being inspected"
        },
        {
          "id": "workplace_overview_photo",
          "label": "Workplace Overview Photo",
          "type": "image",
          "required": true,
          "placeholder": "General photo of the workplace"
        },
        {
          "id": "housekeeping_rating",
          "label": "Housekeeping Rating",
          "type": "select",
          "required": true,
          "options": ["Excellent", "Good", "Needs Improvement", "Poor"]
        },
        {
          "id": "housekeeping_photo",
          "label": "Housekeeping Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo showing housekeeping conditions"
        },
        {
          "id": "lighting_adequate",
          "label": "Lighting Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "lighting_level",
          "label": "Lighting Level Assessment",
          "type": "select",
          "required": false,
          "options": ["Excellent", "Adequate", "Dim", "Poor"]
        },
        {
          "id": "walkways_clear",
          "label": "Walkways Clear and Safe",
          "type": "boolean",
          "required": true
        },
        {
          "id": "slip_hazards_present",
          "label": "Slip/Trip Hazards Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "hazards_photo",
          "label": "Hazards Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of any identified hazards"
        },
        {
          "id": "emergency_exits_clear",
          "label": "Emergency Exits Clear",
          "type": "boolean",
          "required": true
        },
        {
          "id": "emergency_lighting_working",
          "label": "Emergency Lighting Working",
          "type": "boolean",
          "required": true
        },
        {
          "id": "ventilation_adequate",
          "label": "Ventilation Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "noise_level",
          "label": "Noise Level Assessment",
          "type": "select",
          "required": true,
          "options": ["Acceptable", "Elevated", "Requires Hearing Protection", "Excessive"]
        },
        {
          "id": "machinery_guards_present",
          "label": "Machinery Guards Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "electrical_panels_accessible",
          "label": "Electrical Panels Accessible",
          "type": "boolean",
          "required": true
        },
        {
          "id": "chemical_storage_proper",
          "label": "Chemical Storage Proper",
          "type": "boolean",
          "required": true
        },
        {
          "id": "msds_sheets_available",
          "label": "Safety Data Sheets Available",
          "type": "boolean",
          "required": true
        },
        {
          "id": "spill_kit_available",
          "label": "Spill Kit Available",
          "type": "boolean",
          "required": true
        },
        {
          "id": "employees_using_ppe",
          "label": "Employees Using Required PPE",
          "type": "boolean",
          "required": true
        },
        {
          "id": "safety_training_current",
          "label": "Safety Training Current",
          "type": "boolean",
          "required": true
        },
        {
          "id": "incident_reporting_visible",
          "label": "Incident Reporting Procedures Visible",
          "type": "boolean",
          "required": true
        },
        {
          "id": "temperature_comfortable",
          "label": "Temperature Comfortable",
          "type": "boolean",
          "required": true
        },
        {
          "id": "safety_violations",
          "label": "Safety Violations Observed",
          "type": "textarea",
          "required": false,
          "placeholder": "Describe any safety violations observed"
        },
        {
          "id": "corrective_actions",
          "label": "Required Corrective Actions",
          "type": "textarea",
          "required": false,
          "placeholder": "List all corrective actions needed"
        },
        {
          "id": "follow_up_date",
          "label": "Follow-up Inspection Date",
          "type": "date",
          "required": false
        },
        {
          "id": "overall_safety_rating",
          "label": "Overall Safety Rating (1-10)",
          "type": "number",
          "required": true,
          "placeholder": "Rate overall safety from 1 (poor) to 10 (excellent)"
        }
      ]
    }
  ]'::jsonb,
  NULL,
  NOW(),
  NOW(),
  true,
  true
),

-- 3. Enhanced Chemical Handling Inspection
(
  'tpl_chemical_handling_enhanced',
  'Chemical Handling Inspection',
  'Comprehensive assessment of chemical storage, handling, and safety procedures',
  'chemical',
  ARRAY['chemical', 'hazmat', 'storage'],
  '[
    {
      "id": "chemical_handling_section",
      "title": "Chemical Handling Assessment",
      "description": "Detailed inspection of chemical handling and storage practices",
      "fields": [
        {
          "id": "inspector_name",
          "label": "Inspector Name",
          "type": "text",
          "required": true,
          "placeholder": "Enter inspector full name"
        },
        {
          "id": "inspection_date",
          "label": "Inspection Date",
          "type": "date",
          "required": true
        },
        {
          "id": "inspection_time",
          "label": "Inspection Time",
          "type": "time",
          "required": true
        },
        {
          "id": "storage_area",
          "label": "Chemical Storage Area",
          "type": "text",
          "required": true,
          "placeholder": "Location of chemical storage area"
        },
        {
          "id": "storage_area_photo",
          "label": "Storage Area Photo",
          "type": "image",
          "required": true,
          "placeholder": "Photo of chemical storage area"
        },
        {
          "id": "containers_properly_labeled",
          "label": "All Containers Properly Labeled",
          "type": "boolean",
          "required": true
        },
        {
          "id": "labeling_photo",
          "label": "Chemical Labeling Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo showing chemical labeling"
        },
        {
          "id": "incompatible_chemicals_separated",
          "label": "Incompatible Chemicals Separated",
          "type": "boolean",
          "required": true
        },
        {
          "id": "secondary_containment_present",
          "label": "Secondary Containment Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "ventilation_adequate",
          "label": "Ventilation Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "emergency_shower_accessible",
          "label": "Emergency Shower Accessible",
          "type": "boolean",
          "required": true
        },
        {
          "id": "eyewash_station_functional",
          "label": "Eyewash Station Functional",
          "type": "boolean",
          "required": true
        },
        {
          "id": "emergency_equipment_photo",
          "label": "Emergency Equipment Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of emergency shower/eyewash station"
        },
        {
          "id": "spill_kit_present",
          "label": "Appropriate Spill Kit Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "spill_kit_contents",
          "label": "Spill Kit Contents Adequate",
          "type": "select",
          "required": true,
          "options": ["Complete", "Mostly Complete", "Incomplete", "Missing Items"]
        },
        {
          "id": "sds_sheets_current",
          "label": "Safety Data Sheets Current and Accessible",
          "type": "boolean",
          "required": true
        },
        {
          "id": "chemical_inventory_updated",
          "label": "Chemical Inventory Updated",
          "type": "boolean",
          "required": true
        },
        {
          "id": "ppe_available",
          "label": "Appropriate PPE Available",
          "type": "boolean",
          "required": true
        },
        {
          "id": "ppe_condition",
          "label": "PPE Condition",
          "type": "select",
          "required": true,
          "options": ["Excellent", "Good", "Needs Replacement", "Inadequate"]
        },
        {
          "id": "ppe_photo",
          "label": "PPE Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of chemical handling PPE"
        },
        {
          "id": "waste_disposal_proper",
          "label": "Chemical Waste Disposal Proper",
          "type": "boolean",
          "required": true
        },
        {
          "id": "warning_signs_posted",
          "label": "Warning Signs Posted",
          "type": "boolean",
          "required": true
        },
        {
          "id": "temperature_controlled",
          "label": "Temperature Controlled (if required)",
          "type": "boolean",
          "required": false
        },
        {
          "id": "fire_suppression_appropriate",
          "label": "Fire Suppression System Appropriate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "containers_condition",
          "label": "Container Condition Assessment",
          "type": "select",
          "required": true,
          "options": ["All Good", "Minor Issues", "Leaking Containers", "Severely Damaged"]
        },
        {
          "id": "training_records_current",
          "label": "Employee Training Records Current",
          "type": "boolean",
          "required": true
        },
        {
          "id": "violations_observed",
          "label": "Violations Observed",
          "type": "textarea",
          "required": false,
          "placeholder": "Describe any violations or unsafe practices"
        },
        {
          "id": "immediate_actions_required",
          "label": "Immediate Actions Required",
          "type": "textarea",
          "required": false,
          "placeholder": "List any immediate corrective actions needed"
        },
        {
          "id": "risk_level",
          "label": "Overall Risk Level",
          "type": "select",
          "required": true,
          "options": ["Low", "Medium", "High", "Critical"]
        },
        {
          "id": "compliance_score",
          "label": "Compliance Score (1-10)",
          "type": "number",
          "required": true,
          "placeholder": "Rate compliance from 1 (poor) to 10 (excellent)"
        }
      ]
    }
  ]'::jsonb,
  NULL,
  NOW(),
  NOW(),
  true,
  true
),

-- 4. Enhanced Fire Safety Inspection
(
  'tpl_fire_safety_enhanced',
  'Fire Safety Inspection',
  'Comprehensive fire safety assessment including equipment, exits, and procedures',
  'fire_safety',
  ARRAY['fire', 'safety', 'emergency', 'evacuation'],
  '[
    {
      "id": "fire_safety_section",
      "title": "Fire Safety Assessment",
      "description": "Complete evaluation of fire safety systems and procedures",
      "fields": [
        {
          "id": "inspector_name",
          "label": "Inspector Name",
          "type": "text",
          "required": true,
          "placeholder": "Enter inspector full name"
        },
        {
          "id": "inspection_date",
          "label": "Inspection Date",
          "type": "date",
          "required": true
        },
        {
          "id": "inspection_time",
          "label": "Inspection Time",
          "type": "time",
          "required": true
        },
        {
          "id": "building_area",
          "label": "Building/Area Inspected",
          "type": "text",
          "required": true,
          "placeholder": "Specific building or area name"
        },
        {
          "id": "building_photo",
          "label": "Building Overview Photo",
          "type": "image",
          "required": true,
          "placeholder": "Photo of building exterior or main area"
        },
        {
          "id": "fire_extinguishers_count",
          "label": "Number of Fire Extinguishers",
          "type": "number",
          "required": true,
          "placeholder": "Total count of fire extinguishers"
        },
        {
          "id": "extinguishers_condition",
          "label": "Fire Extinguishers Condition",
          "type": "select",
          "required": true,
          "options": ["All Good", "Some Need Service", "Some Expired", "Multiple Issues"]
        },
        {
          "id": "extinguisher_photo",
          "label": "Fire Extinguisher Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of fire extinguisher and pressure gauge"
        },
        {
          "id": "extinguisher_accessibility",
          "label": "Extinguishers Easily Accessible",
          "type": "boolean",
          "required": true
        },
        {
          "id": "smoke_detectors_functional",
          "label": "Smoke Detectors Functional",
          "type": "boolean",
          "required": true
        },
        {
          "id": "smoke_detector_count",
          "label": "Number of Smoke Detectors",
          "type": "number",
          "required": true,
          "placeholder": "Total count of smoke detectors"
        },
        {
          "id": "fire_alarm_system_tested",
          "label": "Fire Alarm System Recently Tested",
          "type": "boolean",
          "required": true
        },
        {
          "id": "alarm_test_date",
          "label": "Last Alarm Test Date",
          "type": "date",
          "required": false
        },
        {
          "id": "sprinkler_system_present",
          "label": "Sprinkler System Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "sprinkler_heads_unobstructed",
          "label": "Sprinkler Heads Unobstructed",
          "type": "boolean",
          "required": false
        },
        {
          "id": "emergency_exits_count",
          "label": "Number of Emergency Exits",
          "type": "number",
          "required": true,
          "placeholder": "Count of emergency exits"
        },
        {
          "id": "exits_clearly_marked",
          "label": "Emergency Exits Clearly Marked",
          "type": "boolean",
          "required": true
        },
        {
          "id": "exit_signs_illuminated",
          "label": "Exit Signs Illuminated",
          "type": "boolean",
          "required": true
        },
        {
          "id": "emergency_exit_photo",
          "label": "Emergency Exit Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of emergency exit and signage"
        },
        {
          "id": "exits_unobstructed",
          "label": "All Exits Unobstructed",
          "type": "boolean",
          "required": true
        },
        {
          "id": "exit_doors_functional",
          "label": "Exit Doors Open Easily",
          "type": "boolean",
          "required": true
        },
        {
          "id": "emergency_lighting_present",
          "label": "Emergency Lighting Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "emergency_lighting_functional",
          "label": "Emergency Lighting Functional",
          "type": "boolean",
          "required": true
        },
        {
          "id": "evacuation_plan_posted",
          "label": "Evacuation Plan Posted",
          "type": "boolean",
          "required": true
        },
        {
          "id": "evacuation_plan_photo",
          "label": "Evacuation Plan Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of posted evacuation plan"
        },
        {
          "id": "assembly_point_marked",
          "label": "Assembly Point Clearly Marked",
          "type": "boolean",
          "required": true
        },
        {
          "id": "fire_wardens_assigned",
          "label": "Fire Wardens Assigned",
          "type": "boolean",
          "required": true
        },
        {
          "id": "hot_work_permits_controlled",
          "label": "Hot Work Permits Controlled",
          "type": "boolean",
          "required": true
        },
        {
          "id": "flammable_materials_stored_properly",
          "label": "Flammable Materials Stored Properly",
          "type": "boolean",
          "required": true
        },
        {
          "id": "electrical_panels_accessible",
          "label": "Electrical Panels Accessible",
          "type": "boolean",
          "required": true
        },
        {
          "id": "housekeeping_adequate",
          "label": "Housekeeping Reduces Fire Risk",
          "type": "boolean",
          "required": true
        },
        {
          "id": "fire_drill_conducted",
          "label": "Fire Drill Recently Conducted",
          "type": "boolean",
          "required": true
        },
        {
          "id": "last_fire_drill_date",
          "label": "Last Fire Drill Date",
          "type": "date",
          "required": false
        },
        {
          "id": "violations_found",
          "label": "Fire Safety Violations Found",
          "type": "textarea",
          "required": false,
          "placeholder": "Describe any fire safety violations"
        },
        {
          "id": "corrective_actions",
          "label": "Corrective Actions Required",
          "type": "textarea",
          "required": false,
          "placeholder": "List all required corrective actions"
        },
        {
          "id": "priority_level",
          "label": "Priority Level for Corrections",
          "type": "select",
          "required": true,
          "options": ["Low", "Medium", "High", "Immediate"]
        },
        {
          "id": "overall_fire_safety_rating",
          "label": "Overall Fire Safety Rating (1-10)",
          "type": "number",
          "required": true,
          "placeholder": "Rate fire safety from 1 (poor) to 10 (excellent)"
        }
      ]
    }
  ]'::jsonb,
  NULL,
  NOW(),
  NOW(),
  true,
  true
),

-- 5. Enhanced Environmental Health Inspection
(
  'tpl_environmental_health_enhanced',
  'Environmental Health Inspection',
  'Comprehensive assessment of environmental health factors and workplace hygiene',
  'environmental',
  ARRAY['environmental', 'health', 'hygiene', 'air_quality'],
  '[
    {
      "id": "environmental_health_section",
      "title": "Environmental Health Assessment",
      "description": "Complete evaluation of environmental health conditions",
      "fields": [
        {
          "id": "inspector_name",
          "label": "Inspector Name",
          "type": "text",
          "required": true,
          "placeholder": "Enter inspector full name"
        },
        {
          "id": "inspection_date",
          "label": "Inspection Date",
          "type": "date",
          "required": true
        },
        {
          "id": "inspection_time",
          "label": "Inspection Time",
          "type": "time",
          "required": true
        },
        {
          "id": "facility_area",
          "label": "Facility/Area Inspected",
          "type": "text",
          "required": true,
          "placeholder": "Specific facility or area name"
        },
        {
          "id": "facility_photo",
          "label": "Facility Overview Photo",
          "type": "image",
          "required": true,
          "placeholder": "General photo of the facility"
        },
        {
          "id": "air_quality_assessment",
          "label": "Air Quality Assessment",
          "type": "select",
          "required": true,
          "options": ["Excellent", "Good", "Acceptable", "Poor", "Hazardous"]
        },
        {
          "id": "ventilation_adequate",
          "label": "Ventilation Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "ventilation_photo",
          "label": "Ventilation System Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of ventilation system"
        },
        {
          "id": "dust_levels",
          "label": "Dust Levels",
          "type": "select",
          "required": true,
          "options": ["Minimal", "Acceptable", "Elevated", "Excessive"]
        },
        {
          "id": "odors_present",
          "label": "Unusual Odors Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "odor_description",
          "label": "Odor Description",
          "type": "text",
          "required": false,
          "placeholder": "Describe any unusual odors"
        },
        {
          "id": "temperature_comfortable",
          "label": "Temperature Comfortable",
          "type": "boolean",
          "required": true
        },
        {
          "id": "temperature_reading",
          "label": "Temperature Reading (°C)",
          "type": "number",
          "required": false,
          "placeholder": "Enter temperature in Celsius"
        },
        {
          "id": "humidity_levels",
          "label": "Humidity Levels",
          "type": "select",
          "required": true,
          "options": ["Too Dry", "Comfortable", "Too Humid", "Condensation Issues"]
        },
        {
          "id": "lighting_adequate",
          "label": "Lighting Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "natural_light_available",
          "label": "Natural Light Available",
          "type": "boolean",
          "required": true
        },
        {
          "id": "noise_levels",
          "label": "Noise Levels",
          "type": "select",
          "required": true,
          "options": ["Quiet", "Acceptable", "Loud", "Requires Protection", "Excessive"]
        },
        {
          "id": "noise_source",
          "label": "Primary Noise Source",
          "type": "text",
          "required": false,
          "placeholder": "Identify main source of noise"
        },
        {
          "id": "water_quality_adequate",
          "label": "Drinking Water Quality Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "water_fountains_clean",
          "label": "Water Fountains/Dispensers Clean",
          "type": "boolean",
          "required": true
        },
        {
          "id": "restroom_facilities_adequate",
          "label": "Restroom Facilities Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "restroom_cleanliness",
          "label": "Restroom Cleanliness",
          "type": "select",
          "required": true,
          "options": ["Excellent", "Good", "Acceptable", "Poor", "Unsanitary"]
        },
        {
          "id": "restroom_photo",
          "label": "Restroom Facilities Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of restroom facilities"
        },
        {
          "id": "hand_washing_facilities",
          "label": "Hand Washing Facilities Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "soap_paper_towels_available",
          "label": "Soap and Paper Towels Available",
          "type": "boolean",
          "required": true
        },
        {
          "id": "waste_disposal_adequate",
          "label": "Waste Disposal Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "recycling_program_present",
          "label": "Recycling Program Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "pest_control_adequate",
          "label": "Pest Control Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "evidence_of_pests",
          "label": "Evidence of Pests",
          "type": "boolean",
          "required": true
        },
        {
          "id": "pest_evidence_photo",
          "label": "Pest Evidence Photo",
          "type": "image",
          "required": false,
          "placeholder": "Photo of any pest evidence"
        },
        {
          "id": "mold_moisture_issues",
          "label": "Mold or Moisture Issues",
          "type": "boolean",
          "required": true
        },
        {
          "id": "ergonomic_hazards",
          "label": "Ergonomic Hazards Present",
          "type": "boolean",
          "required": true
        },
        {
          "id": "ergonomic_description",
          "label": "Ergonomic Hazard Description",
          "type": "textarea",
          "required": false,
          "placeholder": "Describe any ergonomic concerns"
        },
        {
          "id": "break_areas_adequate",
          "label": "Break Areas Adequate",
          "type": "boolean",
          "required": true
        },
        {
          "id": "food_storage_areas_clean",
          "label": "Food Storage Areas Clean",
          "type": "boolean",
          "required": true
        },
        {
          "id": "environmental_violations",
          "label": "Environmental Health Violations",
          "type": "textarea",
          "required": false,
          "placeholder": "Describe any environmental health violations"
        },
        {
          "id": "improvement_recommendations",
          "label": "Improvement Recommendations",
          "type": "textarea",
          "required": false,
          "placeholder": "Suggest improvements for environmental health"
        },
        {
          "id": "health_risk_level",
          "label": "Health Risk Level",
          "type": "select",
          "required": true,
          "options": ["Low", "Medium", "High", "Severe"]
        },
        {
          "id": "overall_environmental_rating",
          "label": "Overall Environmental Rating (1-10)",
          "type": "number",
          "required": true,
          "placeholder": "Rate environmental conditions from 1 (poor) to 10 (excellent)"
        }
      ]
    }
  ]'::jsonb,
  NULL,
  NOW(),
  NOW(),
  true,
  true
);

-- Verify the insertion
SELECT 
  id,
  title,
  description,
  category,
  array_length(tags, 1) as tag_count,
  jsonb_array_length(sections) as section_count,
  is_prebuilt,
  created_at
FROM templates 
WHERE is_prebuilt = true
ORDER BY created_at DESC;
