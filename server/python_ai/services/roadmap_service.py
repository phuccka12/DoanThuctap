import math
import random
import numpy as np
from datetime import datetime

class RoadmapService:
    # --- CẤU HÌNH HỆ THỐNG V4.0 ---
    TASK_TYPES = ["reading", "listening", "speaking", "writing", "vocabulary", "grammar", "story"]
    
    # Tầng 2: Dependency DAG
    DEPENDENCY_GRAPH = {
        "reading": ["vocabulary", "grammar"],
        "writing": ["grammar", "vocabulary"],
        "speaking": ["vocabulary", "grammar", "listening"],
        "listening": ["vocabulary"],
        "grammar": ["vocabulary"],
        "story": ["vocabulary", "reading"]
    }

    # Tầng 2: Cấu hình Tải trọng (Workload Weight)
    TASK_WEIGHTS = {
        "reading": 3, "listening": 3, "speaking": 5, "writing": 5, 
        "vocabulary": 1, "grammar": 2, "story": 2
    }

    # Tầng 1: Clustering Centers (6 Personas)
    PERSONA_CENTERS = {
        "ACADEMIC_PRO": np.array([5, 8, 20]),
        "EXAM_SPRINTER": np.array([5, 5, 25]),
        "BALANCED_STEADY": np.array([3, 5, 10]),
        "CASUAL_LEARNER": np.array([2, 2, 3]),
        "LANGUAGE_ENTHUSIAST": np.array([4, 6, 15]),
        "BUSY_PROFESSIONAL": np.array([3, 4, 5])
    }

    @staticmethod
    def get_user_persona(profile):
        goal_score = 5 if profile.get('goal') == 'ielts' else 3
        level_map = {"beginner": 2, "intermediate": 5, "advanced": 8}
        level_score = level_map.get(profile.get('current_level', 'intermediate'), 5)
        hours = float(profile.get('study_hours_per_week', 5))
        
        user_vector = np.array([goal_score, level_score, hours])
        best_persona = "BALANCED_STEADY"
        min_dist = float('inf')
        
        for name, center in RoadmapService.PERSONA_CENTERS.items():
            dist = np.linalg.norm(user_vector - center)
            if dist < min_dist:
                min_dist = dist
                best_persona = name
        
        intensity_map = {
            "ACADEMIC_PRO": "IMMERSE",
            "EXAM_SPRINTER": "IMMERSE",
            "BALANCED_STEADY": "STEADY",
            "CASUAL_LEARNER": "CASUAL",
            "LANGUAGE_ENTHUSIAST": "STEADY",
            "BUSY_PROFESSIONAL": "CASUAL"
        }
        
        intensity = intensity_map.get(best_persona, "STEADY")
        # V4.0: Task count co giãn theo cường độ
        tasks_per_day = 3 if intensity == "IMMERSE" else (2 if intensity == "STEADY" else 1)
        
        return {
            "persona": best_persona,
            "intensity": intensity,
            "tasks_per_day": tasks_per_day
        }

    @staticmethod
    def fitness_function(chromosome, persona_info):
        """
        Genetic Fitness Function V4.0 (Elastic Brain)
        - Multi-objective: DAG, Load, Progressive Overload, Review, Semantic Flow.
        """
        score = 500 
        days_tasks = [day for day in chromosome]
        all_tasks_flat = [t for day in chromosome for t in day]
        
        # 1. Dependency DAG
        seen_so_far = set(persona_info.get('mastered_skills', []))
        for day_tasks in days_tasks:
            for task in day_tasks:
                prereqs = RoadmapService.DEPENDENCY_GRAPH.get(task, [])
                for pre in prereqs:
                    if pre not in seen_so_far:
                        score -= 60
                seen_so_far.add(task)

        # 2. Workload Balancing & Elastic Intensity
        intensity = persona_info.get('intensity', 'STEADY')
        for day_tasks in days_tasks:
            day_load = sum([RoadmapService.TASK_WEIGHTS.get(t, 2) for t in day_tasks])
            # CASUAL không được quá 4, STEADY không nên quá 8, IMMERSE phải trên 5
            if intensity == 'CASUAL' and day_load > 4: score -= 80
            if intensity == 'STEADY' and day_load > 8: score -= 70
            if intensity == 'IMMERSE' and day_load < 5: score -= 50

        # 3. Semantic & Pedagogical Flow (MỚI V4.0)
        # Khuyến khích thứ tự: Vocabulary -> Reading/Listening -> Writing/Speaking (Input -> Output)
        flow_order = {"vocabulary": 0, "grammar": 0, "reading": 1, "listening": 1, "story": 1, "writing": 2, "speaking": 2}
        for day_tasks in days_tasks:
            if len(day_tasks) > 1:
                for i in range(len(day_tasks) - 1):
                    curr_rank = flow_order.get(day_tasks[i], 1)
                    next_rank = flow_order.get(day_tasks[i+1], 1)
                    if next_rank >= curr_rank:
                        score += 40 # Thưởng cho luồng sư phạm hợp lý
                    else:
                        score -= 30 # Phạt nếu học Output trước khi có Input

        # 4. Weekend Push (Progressive Overload)
        if len(days_tasks) >= 7:
            weekend_load = sum([sum([RoadmapService.TASK_WEIGHTS.get(t, 2) for t in d]) for d in days_tasks[5:]])
            weekday_load = sum([sum([RoadmapService.TASK_WEIGHTS.get(t, 2) for t in d]) for d in days_tasks[:3]])
            score += (weekend_load - weekday_load) * 10

        # 5. Targeted Review (Early Week Priority)
        needs_review = persona_info.get('needs_review', [])
        for day_idx, day_tasks in enumerate(days_tasks):
            for task in day_tasks:
                if task in needs_review:
                    bonus = 100 if day_idx < 3 else 40
                    score += bonus

        # 6. Interest Alignment (Anchor-Driven)
        focus_skills = persona_info.get('focus_skills', [])
        for t in all_tasks_flat:
            if t in focus_skills: score += 40

        # 7. Monotony Penalty
        for d in range(1, len(days_tasks)):
            if len(set(days_tasks[d]) & set(days_tasks[d-1])) > 0:
                score -= 40 # Tránh lặp lại quá nhiều giữa 2 ngày sát nhau
                
        return score

    @staticmethod
    def optimize_sequence(persona_info, days=7, pop_size=60, generations=120):
        tasks_per_day = persona_info['tasks_per_day']
        
        # Mô hình Rolling Horizon: Nếu có roadmap cũ, có thể bắt đầu từ đó (future update)
        population = []
        for _ in range(pop_size):
            chromosome = []
            for _ in range(days):
                chromosome.append(random.sample(RoadmapService.TASK_TYPES, tasks_per_day))
            population.append(chromosome)
            
        for gen in range(generations):
            population = sorted(population, key=lambda c: RoadmapService.fitness_function(c, persona_info), reverse=True)
            next_gen = population[:int(pop_size * 0.25)] # Elitism 25%
            
            while len(next_gen) < pop_size:
                # Tournament Selection size 4
                competitors = random.sample(population[:int(pop_size * 0.8)], 4)
                p1 = max(competitors, key=lambda c: RoadmapService.fitness_function(c, persona_info))
                p2 = random.choice(next_gen)
                
                # Dynamic Crossover
                cp = random.randint(1, days - 1)
                child = p1[:cp] + p2[cp:]
                
                # Mutation (Semantic Mutation)
                if random.random() < 0.35:
                    d_idx = random.randint(0, days - 1)
                    if persona_info.get('focus_skills') and random.random() < 0.7:
                        # Ưu tiên kỹ năng trọng tâm
                        child[d_idx] = random.sample(persona_info['focus_skills'] * 2 + RoadmapService.TASK_TYPES, tasks_per_day)
                    else:
                        child[d_idx] = random.sample(RoadmapService.TASK_TYPES, tasks_per_day)
                next_gen.append(child)
            population = next_gen
            
        return [{"day": i+1, "tasks": day} for i, day in enumerate(population[0])]

    @staticmethod
    def calculate_bkt(p_prior, p_transit, p_guess, p_slip, is_correct, last_seen_at=None):
        current_p = p_prior
        if last_seen_at:
            current_time = datetime.now().timestamp()
            current_p = RoadmapService.apply_forgetting_curve(p_prior, last_seen_at, current_time)
            
        if is_correct:
            p_obs = (current_p * (1 - p_slip)) / (current_p * (1 - p_slip) + (1 - current_p) * p_guess)
        else:
            p_obs = (current_p * p_slip) / (current_p * p_slip + (1 - current_p) * (1 - p_guess))
            
        p_new = p_obs + (1 - p_obs) * p_transit
        return float(np.clip(p_new, 0.01, 0.99))

    @staticmethod
    def apply_forgetting_curve(p_mastery, last_seen_seconds, current_time_seconds, stability=1.0):
        elapsed_days = (current_time_seconds - last_seen_seconds) / (24 * 3600)
        if elapsed_days <= 0: return p_mastery
        retrievability = math.exp(-elapsed_days / (stability * (1 + p_mastery * 5)))
        return p_mastery * retrievability
