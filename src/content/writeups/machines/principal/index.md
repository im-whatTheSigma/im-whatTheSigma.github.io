---
title: "Principal"
platform: "HTB"
difficulty: "Medium"
os: "Linux"
summary: "A token-validation flaw in pac4j-jwt and client-side code that reveals the login scheme get past the dashboard, which exposes a service account's SSH credentials; a group-readable SSH certificate-authority key then lets that account sign its own certificate for root."
tags: ["pac4j","jwt","jwe","api","ssh-certificates","ssh-ca"]
order: 1
---

## User Flag
- Let's always start with enumeration
    - ![image](./img-01.png)
- After adding this to `/etc/hosts`, upon visiting the site with :8080 we get
    - ![image](./img-02.png)
- Let's fuzz for some endpoints:
    - `ffuf -u http://principal.htb:8080/api/FUZZ -w /usr/share/seclists/Discovery/Web-Content/api/objects.txt -mc all -fc 401 404`
    - Doesnt seem to show anythin useful why
- But it is ok, we can inspect the js header from the web page and see that 
    - ![image](./img-03.png)
    - Literally every scheme is leaked here, might be useful
    - This smells like we need to forge our own token, this is what im used to
- First we can easily see that the pub key is leaked at:
    - `n = lTh54vtBS1NAWrxAFU1NEZdrVxPeSMhHZ5NpZX-WtBsdWtJRaeeG61iNgYsFUXE9j2MAqmekpnyapD6A9dfSANhSgCF60uAZhnpIkFQVKEZday6ZIxoHpuP9zh2c3a7JrknrTbCPKzX39T6IK8pydccUvRl9zT4E_i6gtoVCUKixFVHnCvBpWJtmn4h3PCPCIOXtbZHAP3Nw7ncbXXNsrO3zmWXl-GQPuXu5-Uoi6mBQbmm0Z0SC07MCEZdFwoqQFC1E6OMN2G-KRwmuf661-uP9kPSXW8l4FutRpk6-LZW5C7gwihAiWyhZLQpjReRuhnUvLbG7I_m2PV0bWWy-Fw`
- But for now I think we can return to the version part and try some stuff, let's search for `pac4j-jwt 6.0.3 cve`
    - ![image](./img-04.png)
    - Interesting, so if we have the pub key we can inpersonate as anyone
- Let's use this PoC and we see that the bearer is 
    - ![image](./img-05.png)
- We can now use this bearer token to take a sneak peek inside the apis:
    - ![image](./img-06.png)
- But there is no really useful stuff, so our target still remains on, how to bypass the login portal?
- Good this is that `app.js` already leaks how the service verifies the user:
    - ![image](./img-07.png)
- We just have to add the KV inside sessionStorage and visit `/` again to be able to login
- ![image](./img-08.png)
- ![image](./img-09.png)
- There seems to be no useful info, so my immediate thought is to fuzz based on this directory:
    - `ffuf -u http://principal.htb:8080/dashboard/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -H "Authorization: Bearer eyJhbGciOiAiUlNBLU9BRVAtMjU2IiwgImVuYyI6ICJBMTI4R0NNIiwgImtpZCI6ICJlbmMta2V5LTEiLCAiY3R5IjogIkpXVCJ9.TSCQlPJz-DlBN4dnr19IyE9yY83ICd-AkY6XPuqBWDesXZ-ODtApYvHxBRId-NewqPKcbPWEzAViJr5KeYb4wf9n8Ce6TNcxs9FeEDD_fw-4P186fu5cRPV1QQZZO5IUUuba32SnDXG_1xcq74CIrOWvwkowhvH8iRsZc7eonYSJ1Uk2Nq_Ltc0LigFBb-5Md4xKjMB16jh5QSDWNgTwueBWpDFmbF_7vJ_uK6Ced2nKDZbXLsbpw14Z1D16h7_dAXdBFUURo7X9Q3s6igC6EfwX6DAiBA4aSMhf9cQyijQOcNQ8EdbcocGbIHWxs0LO-kggAQ_1UHyFjTfnSJ4Ijg.YtgozOMkA22xfDZY.YTWXtrglBp35GsIYbALM-_EpUTouGzk1jKX_183fpEZHoAJbfcztaBVs7SbBhc-KE8yFgCOTn_JBn7COHlSr8ncXrfs2N4PHgMsgYkHBpqsBZ3v6fcKKe-LDpfJOiVCYCgSr2z80BRjPOjXi98TEmfmUIpnYott0MgaeOueADuWvWIo0IA_87QwxRRvfQyOl1xz4s0Lla8c5Nc9NJobTLo0E.qw0YbcwaGPSVPzuB_zpV7g" \
  -mc all -fc 404`
- I still do not see anythin useful, on a relook i noticed that
    - ![image](./img-10.png)
- `svc_deploy` seems to have something to do with OIDC SSH auth, so like if we can get the key then we do not need the password to ssh in?
    - ![image](./img-11.png)
- Ok i was blind there is actually useful info here
- So link this wit the `svc-deploy` account, we see that there is a key that looks like a pwd, trying this in ssh it actually works
    - ![image](./img-12.png)
## Root Flag
- We always start with static checks:
    - `sudo -l` fails
    - `id` shows:
        - ![image](./img-13.png)
- hmm, deployers? let's see what root files deployers have access to and can modify
    - Let's try `find / -group deployers -ls 2>/dev/null`
        - ![image](./img-14.png)
- This provides a lot of info, we as deployers can read `/opt/principal/ssh`, and there is a custom config for `principal?`
- ![image](./img-15.png)
- Now this is obvious, we just have to extract the private key to our machine, and use that to sign our cert s.t. we can login as principal
- `ssh-keygen -t rsa -b 2048 -f ./mykey -N ""`
- `ssh-keygen -s ca -I pwned -n root -V +52w ./mykey.pub`
- ![image](./img-16.png)
- yeah this privesc is pretty straightforward, even bit easier than easy boxes

## Remediation

- **Patch pac4j-jwt.** The way in was a known token-validation flaw in pac4j-jwt 6.0.3. Upgrade it, and treat the public key as public: the server's security must never depend on that key staying secret.
- **Don't let the client decide who is logged in.** `app.js` showed that a value in `sessionStorage` was enough for the front end to treat us as authenticated. Every API call must be authorised on the server, whatever the browser claims.
- **Keep secrets out of dashboards.** The `svc_deploy` credential was readable in the dashboard. Store deployment secrets in a vault and show only references to them.
- **Protect the SSH CA key like a root password.** The `deployers` group could read the private key of the SSH certificate authority under `/opt/principal/ssh`, and that key can mint a certificate for any user, including root. It should be readable only by root (or kept offline or in an HSM), with `AuthorizedPrincipalsFile` limiting which principals each certificate may log in as.

### References

- [OWASP — JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [ssh-keygen(1) — certificates](https://man.openbsd.org/ssh-keygen#CERTIFICATES)
- [sshd_config(5) — AuthorizedPrincipalsFile](https://man.openbsd.org/sshd_config#AuthorizedPrincipalsFile)
