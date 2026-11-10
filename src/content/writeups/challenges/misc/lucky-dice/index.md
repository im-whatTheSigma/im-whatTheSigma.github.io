---
title: "Lucky Dice"
platform: "HTB"
difficulty: "Very Easy"
summary: "Parse 100 rounds of dice rolls from a socket and answer the winner each round."
tags: ["misc","pwntools","regex","python"]
order: 1
---

- More like a coding challenge, where we need to write a script to just do calculation, hardest part is parsing(again) (fuck regex)
```python
from pwn import *

r = remote("154.57.164.64", 30538)

r.recvuntil(b"The humans are about to start the game! Are you ready?")
r.sendline(b"1")
print("playing")
for rnd in range(100):
    print(f"Round {rnd}")
    data = r.recvuntil(b"Who wins this round?")
    best_player, best_sum = 0, -1
    for num, dice in re.findall(rb"Player (\d+): ([\d ]+)", data):
        s = sum(map(int, dice.split()))
        if s >= best_sum:                 
            best_player, best_sum = int(num), s
    r.sendline(str(best_player).encode())

r.recvuntil(b"Here is your prize:")
log.success(r.recvline().strip().decode())

```
