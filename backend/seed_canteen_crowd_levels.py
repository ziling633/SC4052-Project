"""
Seed a randomized crowd_level field for each canteen document in Firestore.
"""
import random
from database import get_db

CROWD_LEVELS = ["Low", "Medium", "High"]


def generate_random_crowd_level():
    return random.choice(CROWD_LEVELS)


def seed_canteen_crowd_levels():
    db = get_db()
    canteen_docs = list(db.collection("canteens").stream())
    if not canteen_docs:
        print("❌ No canteen documents found in Firestore. Run update_canteens.py first.")
        return

    for canteen_doc in canteen_docs:
        canteen_id = canteen_doc.id
        level = generate_random_crowd_level()
        db.collection("canteens").document(canteen_id).set(
            {"crowd_level": level},
            merge=True
        )
        print(f"✅ Set random crowd_level={level} for Canteen ID {canteen_id}")

    print(f"\n✅ Seeded crowd_level for {len(canteen_docs)} canteens.")


if __name__ == "__main__":
    print("🚀 Seeding random crowd levels for all canteens...")
    seed_canteen_crowd_levels()
