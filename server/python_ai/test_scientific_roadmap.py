import sys
import os
import time
sys.path.append(os.getcwd())

from services.roadmap_service import RoadmapService

def test_scientific_roadmap():
    # Giả lập User đã học Vocabulary nhưng chưa học Grammar
    # Và kỹ năng Reading đang bị "quên" (cần review)
    profile = {
        "goal": "ielts",
        "current_level": "intermediate",
        "study_hours_per_week": 10,
        "focus_skills": ["writing"],
        "mastered_skills": ["vocabulary"], # Thiếu grammar cho Reading/Writing
        "needs_review": ["reading"], # Quên Reading, cần đẩy lên đầu
        "interests": ["tech"]
    }
    
    print("--- TESTING SCIENTIFIC ROADMAP GENERATION ---")
    persona_info = RoadmapService.get_user_persona(profile)
    persona_info.update({
        "mastered_skills": profile["mastered_skills"],
        "needs_review": profile["needs_review"],
        "focus_skills": profile["focus_skills"]
    })

    print(f"Persona: {persona_info['persona']}, Tasks/Day: {persona_info['tasks_per_day']}")
    
    sequence = RoadmapService.optimize_sequence(persona_info, days=7, pop_size=30, generations=50)
    
    for day in sequence:
        print(f"Day {day['day']}: {', '.join(day['tasks'])}")

    # Kiểm tra tính đa dạng (Monotony Penalty)
    first_tasks = [d['tasks'][0] for d in sequence]
    unique_first_tasks = set(first_tasks)
    print(f"\nDiversity Check: {len(unique_first_tasks)} unique primary tasks in 7 days.")
    
    # Kiểm tra Spaced Repetition
    if "reading" in sequence[0]['tasks'] or "reading" in sequence[1]['tasks']:
        print("✅ Spaced Repetition: 'reading' (needs review) prioritized early.")

    # Kiểm tra BKT Forgetting Curve
    print("\n--- TESTING BKT FORGETTING CURVE ---")
    p_mastery = 0.8
    # Nghỉ 5 ngày
    last_seen = time.time() - (5 * 24 * 3600)
    p_decayed = RoadmapService.apply_forgetting_curve(p_mastery, last_seen, time.time())
    print(f"Mastery 0.8 after 5 days break: {p_decayed:.4f}")
    
    p_new = RoadmapService.calculate_bkt(p_mastery, 0.1, 0.2, 0.1, True, last_seen_at=last_seen)
    print(f"BKT Update after correct answer + 5 days break: {p_new:.4f}")

if __name__ == "__main__":
    test_scientific_roadmap()
