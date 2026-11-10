---
title: "BabyEncryption"
platform: "HTB"
difficulty: "Very Easy"
summary: "A per-byte affine cipher, (123·c + 18) mod 256, reversed by brute-forcing printable characters."
tags: ["crypto","affine-cipher","python"]
order: 2
---

- We are provided with the encryption script, so we can just reverse what they did
    - ![image](./img-01.png)
- ![image](./img-02.png)
- ![image](./img-03.png)
- Okay, so we want to brute force from [33-126], read in bytes by bytes from ./msg.enc and see if `(123 * brute_value + 18) mod 256` equals to the bytes inside ./msg.enc, if it is true then we have found the original value for that char
```python
fd = open("./msg.enc","r")

sec = fd.read()
bytestr = bytes.fromhex(sec)

dec = ''

for char in bytestr:
	for brute_value in range(33,127):
		if((123 * brute_value + 18) % 256) == char:
			dec += chr(brute_value)

print(dec)
```
