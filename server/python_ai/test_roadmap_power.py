import sys
import os
sys.path.append(os.getcwd())

from services.roadmap_service import RoadmapService

def test_genetic_roadmap():
    profile = {
        "goal": "ielts",
        "current_level": "intermediate",
        "study_hours_per_week": 15,
        "focus_skills": ["speaking", "writing"],
        "interests": ["technology", "travel"]
    }
    
    print("--- TESTING PERSONA CLUSTERING ---")
    persona_info = RoadmapService.get_user_persona(profile)
    persona_info['focus_skills'] = profile['focus_skills']
    print(f"Detected Persona: {persona_info['persona']}")
    print(f"Intensity: {persona_info['intensity']}")
    print(f"Tasks per day: {persona_info['tasks_per_day']}")
    
    print("\n--- TESTING GENETIC PATH OPTIMIZATION ---")
    sequence = RoadmapService.optimize_sequence(persona_info, days=7, pop_size=10, generations=20)
    
    for day in sequence:
        print(f"Day {day['day']}: {', '.join(day['tasks'])}")

    # Basic Validation
    tasks = [t for d in sequence for t in d['tasks']]
    if "speaking" in tasks:
        print("\n✅ Success: Focus skill 'speaking' included in roadmap.")
    if len(set(tasks)) > 4:
        print("✅ Success: High skill diversity detected.")

if __name__ == "__main__":
    test_genetic_roadmap()
