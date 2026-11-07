import requests

BASE = "http://127.0.0.1:8000"

def fresh_login():
    s = requests.Session()
    s.get(BASE + "/api/auth/csrf/")
    csrf = s.cookies.get("csrftoken", "")
    r = s.post(BASE + "/api/auth/login/",
               json={"email": "customer@gmail.com", "password": "CustomerPassword123!",
                     "device_id": "sec-test-CUSTOMER", "device_name": "sec-test"},
               headers={"X-CSRFToken": csrf})
    if r.status_code != 200:
        raise SystemExit(f"Login failed: {r.status_code} {r.text[:150]}")
    return s, csrf

results = []

def run(name, path, header, expect_blocked):
    s, csrf = fresh_login()
    headers = {}
    if header == "correct":
        headers["X-CSRFToken"] = csrf
    elif header == "wrong":
        headers["X-CSRFToken"] = "x" * 64
    r = s.post(BASE + path, headers=headers)
    blocked = r.status_code == 403
    ok = (blocked == expect_blocked)
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  {name}  -> {r.status_code}  {r.text[:90]!r}")

print("--- Sanity: correct token must work ---")
run("refresh, correct CSRF token", "/api/auth/refresh/", "correct", expect_blocked=False)
run("logout, correct CSRF token",  "/api/auth/logout/",  "correct", expect_blocked=False)

print("--- Attack: no CSRF token (must be blocked with 403) ---")
run("refresh, NO token", "/api/auth/refresh/", "none", expect_blocked=True)
run("logout, NO token",  "/api/auth/logout/",  "none", expect_blocked=True)

print("--- Attack: wrong CSRF token (must be blocked with 403) ---")
run("refresh, WRONG token", "/api/auth/refresh/", "wrong", expect_blocked=True)
run("logout, WRONG token",  "/api/auth/logout/",  "wrong", expect_blocked=True)

print(f"\n{sum(results)}/{len(results)} passed")