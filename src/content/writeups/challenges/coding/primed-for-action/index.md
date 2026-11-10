---
title: "Primed for Action"
platform: "HTB"
difficulty: "Very Easy"
summary: "Find the two primes in a list and multiply them."
tags: ["coding","python","primes"]
order: 1
---

- Prob: https://app.hackthebox.com/challenges/Primed%2520for%2520Action?tab=play_challenge
- Just write a check for prime nothing hard
```python
nums = input().split()
primes = []
def is_prime(n):
    if n <= 1:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

for i in range(len(nums)):
    val = int(nums[i])
    if is_prime(val):
        primes.append(val)

print(primes[0] * primes[1])
```
