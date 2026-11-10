---
title: "Cred Hunter"
platform: "HTB"
difficulty: "Easy"
summary: "Pair emails with passwords that contain the username, then sort."
tags: ["coding","python","strings"]
order: 2
---

- Prob: https://app.hackthebox.com/challenges/cred-hunter?tab=play_challenge
- Literally reminiscent of 大一程設 when teaching C strings / C++ strings, do parsing and matching. Solution:
```python
n = int(input())

data = list()
email = list()
pwd = list()
pairs = list()

for i in range(n):
    data.append(input())
for i in range(len(data)):
    if "." in data[i]:
        email.append(data[i])
    else:
        pwd.append(data[i])
for i in range(len(email)):
    for j in range(len(pwd)):
        username = email[i].split('@')[0]
        nameToMatch = username[:-1]
        if nameToMatch in pwd[j]:
            pairs.append((email[i], pwd[j]))
pairs.sort()

for pair in pairs:
    print(pair[0], pair[1])
```
- 終於又可以手刻很沒效率的程式碼 感覺真不錯 雖然沒多難 (但也沒有到 piece of cake 吧，那些評 piece of cake 的大概都是 AI 寫的 ==
- note: i used "." to check for email instead of "@" because pwd can't have "." but can have "@"
