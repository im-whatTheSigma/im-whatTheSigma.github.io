---
title: "oBfsC4t10n2"
platform: "HTB"
difficulty: "Hard"
summary: "An Excel 4.0 (XLM) macro sheet: olevba and XLMMacroDeobfuscator recover the flag in three pieces."
tags: ["forensics","excel","xlm-macros","olevba"]
order: 5
---

- Hmm, i got an excel file, which VT shows malicious
    - ![image](./img-01.png)
- So let's run it in any.run
    - ![image](./img-02.png)
- but nothing malicious shows...
- I found a tool called `olevba` for static analysis of Microsoft OLE2 files
    - ![image](./img-03.png)
- But it seems useless, and also running the excel file straightly shows nothing but some scatter chars.
- Thus i found another deobfuscator tool: running `xlmdeobfuscator --file oBfsC4t10n2.xls -x -o 0`
    - ![image](./img-04.png)
    - We see a part of the flag?
- If we simply do `xlmdeobfuscator -f oBfusC4t10n2.xls`
    - ![image](./img-05.png)
- We see another part of the flag, now it seems its missing the middle part
- hmm, wait if we look even more closer:
    - ![image](./img-06.png)
- Do you see that `Xc3l_4.0_...`? if we concatenate our findings:
    - `HTB{n0w_eXc3l_4.0_M4cr0s_r_b4cK}`

> Conclusion: I guess it's hard due to there are very difficult ways to piece the flag, but there are also easy ways like running a deobfuscator to piece the flag, thats why the ratings are so normal..?
