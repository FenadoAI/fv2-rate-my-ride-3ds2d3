#!/usr/bin/env python3
"""
Test script for Hot Cars API endpoints
"""
import requests
import json
import base64
import sys

API_BASE = "http://localhost:8001/api"

def create_test_image():
    """Create a simple test image as base64"""
    # Create a minimal base64 encoded image (1x1 pixel PNG)
    # This is a valid 1x1 red PNG image
    red_pixel_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    return f"data:image/png;base64,{red_pixel_png}"

def test_upload_car():
    """Test car upload endpoint"""
    print("🚗 Testing car upload...")

    test_image = create_test_image()
    data = {"photo": test_image}

    try:
        response = requests.post(f"{API_BASE}/cars/upload", json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload successful! Car ID: {result['id']}")
            return result['id']
        else:
            print(f"❌ Upload failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

def test_get_random_car():
    """Test getting random car"""
    print("\n🎲 Testing random car endpoint...")

    try:
        response = requests.get(f"{API_BASE}/cars/random")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Got random car! ID: {result['id']}, Score: {result['score']:.2f}")
            return result
        elif response.status_code == 404:
            print("ℹ️ No cars available yet")
            return None
        else:
            print(f"❌ Random car failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Random car error: {e}")
        return None

def test_vote_on_car(car_id, is_hot=True):
    """Test voting on a car"""
    vote_type = "HOT" if is_hot else "NOT"
    print(f"\n🗳️ Testing vote ({vote_type}) on car {car_id}...")

    data = {"car_id": car_id, "is_hot": is_hot}

    try:
        response = requests.post(f"{API_BASE}/cars/vote", json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Vote successful! {result}")
        else:
            print(f"❌ Vote failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Vote error: {e}")

def test_leaderboard():
    """Test leaderboard endpoint"""
    print("\n🏆 Testing leaderboard...")

    try:
        response = requests.get(f"{API_BASE}/cars/leaderboard?limit=5")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Got leaderboard with {len(result)} cars")
            for i, car in enumerate(result, 1):
                print(f"  {i}. Car {car['id'][:8]}... Score: {car['score']:.2f} ({car['hot_votes']}/{car['total_votes']})")
        else:
            print(f"❌ Leaderboard failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Leaderboard error: {e}")

def main():
    print("🔥 Hot Cars API Test")
    print("=" * 30)

    # Test basic API
    try:
        response = requests.get(f"{API_BASE}/")
        if response.status_code == 200:
            print("✅ API is running!")
        else:
            print("❌ API not responding correctly")
            return
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        return

    # Upload a test car
    car_id = test_upload_car()

    # Get random car
    random_car = test_get_random_car()

    # Vote on the car we uploaded
    if car_id:
        test_vote_on_car(car_id, is_hot=True)
        test_vote_on_car(car_id, is_hot=False)
        test_vote_on_car(car_id, is_hot=True)  # Make it "hot"

    # Check leaderboard
    test_leaderboard()

    print("\n🎉 Test completed!")

if __name__ == "__main__":
    main()