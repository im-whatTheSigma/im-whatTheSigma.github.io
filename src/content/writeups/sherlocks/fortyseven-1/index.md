---
title: "FortySeven-1"
platform: "HTB"
difficulty: "Very Easy"
summary: "Threat-intel sherlock on the Mysterious Elephant APT: answer from Kaspersky's SecureList report and Knownsec 404's analyses, then map its techniques to MITRE ATT&CK."
tags: ["threat-intel","apt","mysterious-elephant","mitre-attack"]
order: 6
---

## T1: What is the primary name of the APT group described in the SecureList report?
- Look in the top part of the report

## T2: According to the Knownsec 404 team's analysis(Evidence -3), since which year has this group's attack activity been dated back to?
- Look at the evidence-3 `At the same time, after backtracking analysis, we found that the earliest attack activities of the organization should start around March [year]`
## T3: The group uses a custom backdoor that communicates via Office Remote Procedure Call (ORPCBackdoor). According to the Knownsec 404 team's analysis(Evidence -2), what is the name of the first malicious exported entry function?
- We can use kind of a "cheat", and just ctrl+f for function and see which matches

## T4: The previously mentioned backdoor checks for a file before creating persistence. What is the name of the file?
- This is just under the persistence paragraph and it's easy to find

## T5: The use of the backdoor links the APT to another well-known South Asian APT group. What is the name of this other group?
- In evidence 2, there is `In the report, we identified the weapon as the latest weapon used by [name].`

## T6: The APT group we are currently investigating has consistently used and updated another backdoor since 2023, with its C2 communication evolving from TCP to HTTPS. What is the name of this tool?
- In evidence 3, we can search for tcp and read a bit to find the answer

## T7: To evade sandbox analysis, the MemLoader HidenDesk tool checks the number of active processes before running. What is the minimum number of processes required for it to proceed?

- Search for `MemLoader HidenDesk` in the 1st evidence.

## T8: The MemLoader HidenDesk tool creates a covert environment for its activities by creating and switching to a specific environment. What is the name of this hidden desktop?

- In the same paragraph below, part 3

## T9: The MemLoader HidenDesk tool achieves persistence by placing a shortcut in the autostart folder to ensure it runs after a system reboot. What is the MITRE ATT&CK ID for the 'Registry Run Keys / Startup Folder' technique?

- Just Google for this MITRE ATT&CK ID

## T10: The actor uses several custom exfiltration tools targeting WhatsApp. What is the name of the tool that recursively searches specific directories, including the “Desktop” and “Downloads” folders?

- In the 1st evidence too, search for `download`

## T11: Kaspersky's analysis highlights the actor's heavy use of scripts for execution and deploying payloads. What is the MITRE ATT&CK ID for the 'PowerShell' technique?

- Same as T9, just Google for the answer

## T12: In their early attack chains, Mysterious Elephant used a downloader that was previously associated with the Origami Elephant group. What was the name of this downloader?

- This is also very obvious in the 1st evidence in the paragraph "The emergence of Mysterious Elephant"

## T13: In a January 2024 campaign delivering an Asyncshell payload, which CVE was exploited in the malicious archive file? Be careful to use a hyphen - and not an emdash — in the flag.

- It's in the 3rd evidence, where we just ctrl+f for `CVE`

## T14: What is the MD5 hash of the ChromeStealer Exfiltrator sample named WhatsAppOB.exe?

- Scroll to the bottom of the 1st evidence and it's obvious

## T15: The intelligence describes multiple custom tools designed to upload stolen data to the actor's servers. According to the MITRE ATT&CK framework, what is the ID for the 'Exfiltration Over C2 Channel' technique?

- Same, just Google it

## Sources

The evidence files are the reports themselves; these are the ATT&CK pages the "just Google it" questions point to:

- [MITRE ATT&CK — T1547.001 Registry Run Keys / Startup Folder](https://attack.mitre.org/techniques/T1547/001/)
- [MITRE ATT&CK — T1059.001 PowerShell](https://attack.mitre.org/techniques/T1059/001/)
- [MITRE ATT&CK — T1041 Exfiltration Over C2 Channel](https://attack.mitre.org/techniques/T1041/)
