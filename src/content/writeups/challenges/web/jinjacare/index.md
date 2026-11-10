---
title: "JinjaCare"
platform: "HTB"
difficulty: "Very Easy"
summary: "The name on a downloadable vaccination certificate is rendered as a Jinja2 template: SSTI to command execution."
tags: ["web","ssti","jinja2","python"]
order: 5
---

- At first I tried doing SQLi for the forms with `sqlmap` but it seems that it is not injectable
- So i created an account and went into the dashboard
    - ![image](./img-01.png)
- We can see that we can download a cert, namely the name changes when we change our name, so we can try SSTI, note that the challenge name "Jinja", which is a python backend framework
    - ![image](./img-02.png)
- ![image](./img-03.png)
- ![image](./img-04.png)
- Yeah SSTI is confirmed, let's inject 
    - first try `{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}`
    - ![image](./img-05.png)
- Great! now we just iterate thru the filesystem
- ![image](./img-06.png)
- Cat it out
    - ![image](./img-07.png)

---
