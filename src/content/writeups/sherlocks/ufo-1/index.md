---
title: "UFO-1"
platform: "HTB"
difficulty: "Very Easy"
summary: "Threat-intel sherlock on Sandworm Team and its attacks on Ukrainian power and SCADA systems, answered from MITRE ATT&CK group, campaign and Navigator data."
tags: ["threat-intel","sandworm","ics","scada","mitre-attack"]
order: 9
---

## T1: According to the sources cited by Mitre, in what year did the Sandworm Team begin operations?
- Just Google "Sandworm Team" and head into the MITRE ATT&CK website

## T2: Mitre notes two credential access techniques used by the BlackEnergy group to access several hosts in the compromised network during a 2016 campaign against the Ukrainian electric power grid. One is LSASS Memory access (T1003.001). What is the Attack ID for the other?

- Head to Navigation Layers and search under the "Credential Access" tab for
    - ![image](./img-01.png)





## T3: During the 2016 campaign, the adversary was observed using a VBS script during their operations. What is the name of the VBS file?
- ![image](./img-02.png)
  <span class="caption">MITRE's Sandworm entry: in the 2016 Ukraine attack, `ufn.vbs` was run with `cscript` to copy ICS payloads.</span>


## T4: The APT conducted a major campaign in 2022. The server application was abused to maintain persistence. What is the Mitre Att&ck ID for the persistence technique was used by the group to allow them remote access?
- ![image](./img-03.png)
  <span class="caption">Under T1505 Server Software Component, MITRE notes Sandworm deployed the Neo-REGEORG web shell on an internet-facing server in 2022: sub-technique `.003`, Web Shell.</span>



## T5: What is the name of the malware / tool used in question 4?
- It is in the same picture above

## T6: Which SCADA application binary was abused by the group to achieve code execution on SCADA Systems in the same campaign in 2022?
- ![image](./img-04.png)
  <span class="caption">ATT&CK for ICS, T0807 Command-Line Interface: in 2022 Sandworm used MicroSCADA's SCIL-API through the `scilc.exe` binary.</span>

## T7: Identify the full command line associated with the execution of the tool from question 6 to perform actions against substations in the SCADA environment.
- ![image](./img-05.png)
  <span class="caption">T0894 System Binary Proxy Execution gives the full command: `C:\sc\prog\exec\scilc.exe -do pack\scil\s1.txt`, which sends the SCADA instructions listed in `s1.txt` to remote substations.</span>


## T8: What malware/tool was used to carry out data destruction in a compromised environment during the same campaign?
- Under Impact in the navigation tab, there is
    - ![image](./img-06.png)

## T9: The malware/tool identified in question 8 also had additional capabilities. What is the Mitre Att&ck ID of the specific technique it could perform in Execution tactic?
- ![image](./img-07.png)
  <span class="caption">Hovering Native API (T1106) in the Navigator layer shows the comment: Sandworm's Prestige calls `Wow64DisableWow64FsRedirection()` and `Wow64RevertWow64FsRedirection()`.</span>


## T10: The Sandworm Team is known to use different tools in their campaigns. They are associated with an auto-spreading malware that acted as a ransomware while having worm-like features. What is the name of this malware?
- ![image](./img-08.png)
  <span class="caption">MITRE's NotPetya page: ransomware in appearance, a wiper in practice, spreading worm-style over SMBv1 with EternalBlue and EternalRomance.</span>


## T11: What was the Microsoft security bulletin ID for the vulnerability that the malware from question 10 used to spread around the world?
- ![image](./img-09.png)
  <span class="caption">The SMBv1 flaws EternalBlue used were patched by Microsoft security bulletin MS17-010, published 14 March 2017.</span>


## T12: What is the name of the malware/tool used by the group to target modems?
- ![image](./img-10.png)
  <span class="caption">MITRE's Sandworm references cite SentinelOne's "AcidRain | A Modem Wiper Rains Down on Europe": AcidRain is the modem-targeting tool.</span>

## T13: Threat Actors also use non-standard ports across their infrastructure for Operational-Security purposes. On which port did the Sandworm team reportedly establish their SSH server for listening?
- ![image](./img-11.png)
  <span class="caption">Sandworm's SSH server listened on the non-standard port 6789.</span>


## T14: The Sandworm Team has been assisted by another APT group on various operations. Which specific group is known to have collaborated with them?
- ![image](./img-12.png)
  <span class="caption">MITRE's group description: some operations were carried out with the help of GRU Unit 26165, also known as APT28.</span>

## Sources

- [MITRE ATT&CK — Sandworm Team (G0034)](https://attack.mitre.org/groups/G0034/)
- [MITRE ATT&CK for ICS](https://attack.mitre.org/matrices/ics/)
- [MITRE ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/)
