---
title: "Baggage"
platform: "HTB"
difficulty: "Very Easy"
summary: "Rebuild an attacker's hands-on-keyboard session from a user's shellbags: the downloaded archive, a search utility, the VPN and password folders, a network share, and a staging folder compressed for exfiltration."
tags: ["shellbags","registry","eric-zimmerman","collection","exfiltration"]
order: 2
---

> **What Are Shellbags?**\
Shellbags are Windows registry artifacts that record a user's folder navigation history in Windows Explorer. Every time a user opens a folder - whether local, on a network share, or inside a zip archive - Windows stores metadata about that interaction in the registry.
## T1: What was the name of the archive file downloaded by the compromised account?
- Using Eric Zimmerman's shellbag explorer, we can open the .dat file of steve and see that 
    - ![image](./img-01.png)



## T2: What was the name of the utility brought in by the attacker to search for sensitive data?
- ![image](./img-02.png)



## T3: The attacker navigated the filesystem and found sensitive files used by the victim in their day-to-day work. When was the VPN folder accessed by the attacker?
- ![image](./img-03.png)
- Remember to minus 8 hours

## T4: What was the name of the directory containing the victim's passwords?
- ![image](./img-04.png)



## T5: The attacker also accessed a network share to pillage network data. What is the UNC path?
- `UNC 是 \\Server Name\path 而 FQDN 是 協定://域名/子路徑`
    - ![image](./img-05.png)


## T6: When is the dam construction planned?
- Shows above
## T7: What was the name of the archive file present on the network share?
- ![image](./img-06.png)

## T8: When was the archive file from the network share accessed?
- ![image](./img-07.png)



## T9: The attacker created a staging folder to prepare for collection and exfiltration. What is the full path of the staging folder?
- Attacker hid it under `Pictures`
    - ![image](./img-08.png)

## T10: The attacker compressed the staging folder to prepare the data for exfiltration. When was the exfiltration archive file accessed?

- ![image](./img-09.png)

>Lessons learnt: always look at the "last write" time instead of the last access time

## Detection & mitigation

- **Shellbags show folders, not files.** They prove the attacker *browsed* the VPN and password folders, but not which files were opened. Pair them with LNK files, Jump Lists, prefetch and object-access auditing (Event 4663) to see what was actually read.
- **Staging in a user folder is a pattern to hunt.** Copying loot into `Pictures` and zipping it is local data staging (T1074.001) followed by archive creation (T1560). New archives appearing in profile folders shortly before large outbound transfers are worth alerting on.
- **Don't keep passwords in a folder.** The victim had a directory of passwords for the attacker to find; a password manager with MFA removes that whole step.

### References

- [MITRE ATT&CK — T1074.001 Local Data Staging](https://attack.mitre.org/techniques/T1074/001/)
- [MITRE ATT&CK — T1560 Archive Collected Data](https://attack.mitre.org/techniques/T1560/)
- [Eric Zimmerman's tools (ShellBags Explorer, MFTECmd …)](https://ericzimmerman.github.io/)
