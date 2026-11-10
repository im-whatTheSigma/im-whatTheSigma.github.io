---
title: "MangoBleed"
platform: "HTB"
difficulty: "Very Easy"
summary: "Logs from a MongoDB server hit by MongoBleed: trace the exploit in mongod.log, the brute-forced SSH login in auth.log, and the attacker's privilege-escalation attempt and exfiltration in bash history."
tags: ["mongodb","mongobleed","logs","auth-log","bash-history"]
order: 5
---

## T1: What is the CVE ID designated to the MongoDB vulnerability explained in the scenario?
- Just google it

## T2: What is the version of MongoDB installed on the server that the CVE exploited?
- Go into /var/log/mongodb/mongod.log and ctrl+f for "version"
 
## T3: Analyze the MongoDB logs to identify the attacker's remote IP address used to exploit the CVE.
- Just scroll down a bit and we see that the attributes of the attacker is obvious: "remote":"65.0.76.43:35368"...

## T4: Based on the MongoDB logs, determine the exact date and time the attacker’s exploitation activity began (the earliest confirmed malicious event)
- Just when the attacker's IP first appears is the answer

## T5: Using the MongoDB logs, calculate the total number of malicious connections initiated by the attacker.
- Scroll to the bottom and see the number after conn, means how many instances the attacker has started, but there is connection and disconnection, so you need to multiply by 2.

## T6: The attacker gained remote access after a series of brute‑force attempts. The attack likely exposed sensitive information, which enabled them to gain remote access. Based on the logs, when did the attacker successfully gain interactive hands-on remote access?
- Check auth.log for more info, where we see there is a bunch of failure attempts, so we just try to ctrl+f for "Accepted"

## T7: Identify the exact command line the attacker used to execute an in‑memory script as part of their privilege‑escalation attempt.

- We need to analyze the bash history for the attacker (now mongoadmin), so we go to /root/home/mongoadmin and search the .bash_history file to find the command

## T8: The attacker was interested in a specific directory and also opened a Python web server, likely for exfiltration purposes. Which directory was the target?

- The answer is also in the same history file, where we see that they started a python server listener in /var/lib/mongodb

## Detection & mitigation

- **Patch, and turn off zlib compression as a stopgap.** MongoBleed leaks server memory through the zlib network-compression path before authentication. Upgrade to a fixed release; until then, remove `zlib` from `net.compression.compressors`.
- **Never expose MongoDB to the internet.** Bind it to localhost or a private network and firewall port 27017.
- **Assume leaked memory means leaked secrets.** The attacker turned what the leak exposed into SSH access, so rotate any credentials that could have been in the server's memory.
- **Detect it in the logs.** Bursts of short-lived connections from one IP in `mongod.log`, followed by SSH failures then an `Accepted` line in `auth.log`, is the whole story in two files. Use key-only SSH and fail2ban.

### References

- [NVD — CVE-2025-14847 (MongoBleed)](https://nvd.nist.gov/vuln/detail/CVE-2025-14847)
- [MongoDB — network compression settings](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-net.compression.compressors)
- [MongoDB — security checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
