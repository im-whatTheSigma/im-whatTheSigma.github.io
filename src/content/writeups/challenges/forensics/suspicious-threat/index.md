---
title: "Suspicious Threat"
platform: "HTB"
difficulty: "Easy"
summary: "A userland rootkit hidden as an extra shared library in the dynamic loader chain; ldd exposes it."
tags: ["forensics","linux","rootkit","ld-preload"]
order: 1
---

- First ssh into the station
- Then, due to the problem statement "Investigate the anomalies in the **library loading process** and filesystem. Look for hidden manipulations that could indicate a userland **rootkit.**", we know that we want to look using the cmd `ldd /bin/ls`
- We find something sus:
    - ![image](./img-01.png)
- .hook looks some kind of hooker to other malicious prog, maybe a rootkit, let us remove it my just simply `mv /lib... /tmp`
- then we see that we can indeed read the flag.txt??
