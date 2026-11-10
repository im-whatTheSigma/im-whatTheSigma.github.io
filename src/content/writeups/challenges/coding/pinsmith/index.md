---
title: "PinSmith"
platform: "HTB"
difficulty: "Easy"
summary: "Expand a PIN template's wildcards, keeping PINs with no repeated adjacent digits."
tags: ["coding","python","itertools"]
order: 3
---

- Prob: https://app.hackthebox.com/challenges/PINsmith?tab=play_challenge
- Very straightforward problem and easy to understand
```python
from itertools import product
 
template = input()
 
for i in product('0123456789', repeat=template.count('*')):
    pin = list(template)
    it = iter(i)
    for j in range(len(pin)):
        if pin[j] == '*':
            pin[j] = next(it)
    if all(pin[j] != pin[j+1] for j in range(len(pin)-1)):
        print(''.join(pin))
 
```
