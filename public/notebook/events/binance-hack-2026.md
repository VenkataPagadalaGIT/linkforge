# The Binance hack, October 2026

Updated 2026-10-30 20:42:55 UTC. Source page: https://venkatapagadala.com/notebook/events/binance-hack-2026

On 29 October 2026 an attacker emptied Binance's hot wallets on ten blockchains in about four hours. Binance puts the impact at around $6.3 billion; three blockchain analytics firms count $6.36 billion to $6.43 billion, the largest crypto theft on record at the value when taken. About $3 billion has been frozen. Binance says it will cover every loss. The analytics firms blame North Korea's TraderTraitor group; Binance and the US government have not confirmed who did it.

## Key takeaways

- **Binance's own estimate:** around $6.3B
  - "The estimated total impact sits at around $6.3B." (Binance https://www.binance.com/en/support/announcement/detail/c5a8729a97ac486d963784d96c5642d7)
- **Counted on-chain:** $6.36B to $6.43B (Valued at each asset's price at the moment it was taken.)
  - "Valuing each transfer at the price of the asset at the moment it was taken, the total is approximately USD 6.36 billion." (TRM Labs https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
  - "On 29 October 2026, $6.43 billion in cryptoassets were stolen from Binance, the world's largest cryptoasset exchange, according to Elliptic's analysis." (Elliptic https://www.elliptic.co/insights/binance-largest-hack-in-history/)
  - "Across the affected blockchains, the unauthorized transfers totaled approximately $6.4 billion USD." (Chainalysis https://www.chainalysis.com/blog/binance-exploit-latest-findings-and-response/)
- **Frozen so far:** about $2.8B to $3B
  - "We are still working with partners to freeze many of the impacted assets, and have frozen around $3 billion thus far." (Binance https://x.com/binance/status/2116089661408108712)
  - "In total, Elliptic has verified $2.84 billion of frozen funds on-chain, close to Binance's estimate of around $3 billion." (Elliptic https://www.elliptic.co/insights/binance-largest-hack-in-history/)
- **Still with the attacker, beyond any freeze:** about $2.4B to $3.3B (TRM values it at the time of theft; Elliptic at current prices.)
  - "It now holds more than 420,000 ETH and 18,270 BTC, about USD 2.4 billion in assets beyond any issuer's reach." (TRM Labs https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
  - "At current prices, the attacker now controls around $3.28 billion of assets that cannot be frozen by an issuer, spread across around 72 addresses." (Elliptic https://www.elliptic.co/insights/binance-largest-hack-in-history/)
- **How it happened:** A compromised engineer's laptop, then "additional points of breach" (No technical post-mortem yet.)
  - "Binance's initial investigation suggests that the security incident may involve a compromised DevOps engineer’s laptop, which allowed an attacker to gain access to a service container and submit unauthorized withdrawal transactions." (Binance https://www.binance.com/en/support/announcement/detail/c5a8729a97ac486d963784d96c5642d7)
  - "Our initial investigation suggested that the security incident may have involved a compromised laptop, however our subsequent investigation has uncovered additional points of breach." (Binance https://x.com/binance/status/2116089661408108712)
  - "On Ethereum, the attacker used an EIP-7702 delegation to turn a Binance hot wallet into a sweeper it controlled, with 50 pre-signed authorizations prepared in advance." (TRM Labs https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
- **Private keys:** No evidence of a key leak, says Binance
  - "We have found no evidence of any wallet private key leak." (Binance https://www.binance.com/en/support/announcement/detail/c5a8729a97ac486d963784d96c5642d7)
- **Who did it:** North Korea's TraderTraitor, say the analytics firms; not confirmed by Binance or any government
  - "We make this judgment with high confidence." (TRM Labs https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
  - "Chainalysis attributes the hack to TraderTraitor, a North Korean cybercrime group." (Chainalysis https://www.chainalysis.com/blog/binance-exploit-latest-findings-and-response/)
  - "Our investigation has not attributed responsibility to any individual." (Richard Teng https://x.com/_RichardTeng/status/2116072080525656150)
  - "The FBI is aware of the incident and is engaged with relevant public and private partners to understand the scope of the activity, evaluate potential impacts and coordinate appropriate investigative steps" (Nextgov/FCW https://www.nextgov.com/cybersecurity/2026/10/fbi-involved-response-63-billion-binance-hack-linked-north-korea/416946/)
- **Customers' money:** Binance says it covers every loss; checkable when its Proof of Reserves is out
  - "Binance will cover all losses from the SAFU fund and the company’s funds." (Binance https://www.binance.com/en/support/announcement/detail/c5a8729a97ac486d963784d96c5642d7)
  - "It has said it will cover all losses using its SAFU fund and company funds, and that it has reserved more than $6.34 billion of company funds to do so." (Elliptic https://www.elliptic.co/insights/binance-largest-hack-in-history/)
- **Withdrawals and deposits:** Withdrawals paused; deposits working
  - "We are still on track towards the expected timeline to resume the withdrawal service in 45 hours. Deposits remain unaffected." (Binance https://x.com/binance/status/2116089661408108712)
- **Is it the biggest ever?:** Yes, at the value when taken: about 4x Bybit (Valued at today's prices, older Bitcoin thefts such as LuBian (2020) are larger.)
  - "That makes this the largest crypto theft on record, about four times the USD 1.5 billion Bybit hack of February 2025." (TRM Labs https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
  - "Based on analysis of on-chain data, it appears that 127,426 BTC was stolen from LuBian in December 2020, worth $3.5 billion at the time and now worth approximately $14.5 billion." (Arkham https://info.arkm.com/announcements/arkham-uncovers)
- **Markets:** Bitcoin to a six-week low of $76,368
  - "Bitcoin hit a six-week low of $76,368 and ether fell more than 3% to a two-month low of $2,178 before markets stabilised." (finance.yahoo.com https://finance.yahoo.com/markets/crypto/articles/tether-circle-freeze-2-38-222607515.html)
- **Regulators:** Abu Dhabi's regulator is "monitoring"; the FBI is "aware"
  - "Abu Dhabi's Financial Services Regulatory Authority, which issued Binance's main operating licence, said it was "engaging closely with Binance and monitoring the incident"." (finance.yahoo.com https://finance.yahoo.com/markets/crypto/articles/tether-circle-freeze-2-38-222607515.html)

## What happened (UTC)

- 2026-10-29 15:59: The attacker deploys the contract it will use, four hours ahead. "At 15:59 UTC on 29 October, the attacker deployed the "sweeper" contract used in the attack, which was rehearsed on another wallet around four hours before it was used against Binance." (https://www.elliptic.co/insights/binance-largest-hack-in-history/)
- 2026-10-29 20:05: First theft: 233 million XRP. "Between 20:05 and 20:09 UTC, five Binance wallets sent 233.46 million XRP to a single attacker address, leaving each wallet with only its minimum balance." (https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
- 2026-10-29 20:10: Solana and Optimism wallets follow. "Binance wallets on Solana and Optimism followed shortly after 20:10 UTC." (https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
- 2026-10-29 20:20: 18,270 bitcoin leave in one transfer; 50 pre-signed authorizations hit Ethereum. "At 20:20 UTC, a Binance Bitcoin hot wallet sent 18,270 BTC to an attacker address, which began splitting the funds into round 1,000 BTC and 100 BTC pieces inside the same block." (https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
- 2026-10-29 20:24: $2.53 billion leaves Ethereum in a single transaction. "Two-thirds of the Ethereum losses, $2.53 billion, left in a single transaction at 20:24 UTC." (https://www.elliptic.co/insights/binance-largest-hack-in-history/)
- 2026-10-29 21:15: Binance's co-founder: "It does look like a hack". "It does look like a hack on Binance." (https://x.com/cz_binance/status/2115915423174853077)
- 2026-10-29 21:29: Binance's first statement. "Our teams are aware of reports of a potential security issue and are actively investigating." (https://x.com/binance/status/2115918888429133902)
- 2026-10-29 23:05: Second wave: Avalanche and Polygon. "About two and a half hours later, at 23:05 UTC, Binance wallets on Avalanche and Polygon followed." (https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
- 2026-10-29 23:35: Frozen total passes $2.5 billion. "Binance said at 23:35 UTC that the verified total frozen had reached USD 2.54 billion." (https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
- 2026-10-29 23:56: Last sweep of new deposits. "As new funds reached the Binance hot wallet, the operator swept them again at 20:41, 20:59, 21:04, 21:44, 22:39 and 23:56 UTC." (https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)
- 2026-10-30 02:23: Binance puts the impact at around $6.3 billion. "The estimated total impact sits at around $6.3B." (https://www.binance.com/en/support/announcement/detail/c5a8729a97ac486d963784d96c5642d7)
- 2026-10-30 04:51: Stolen funds meet funds from the Bitget hack. "This indicates the same actor is likely behind both incidents." (https://x.com/zachxbt/status/2116030284261179538)
- 2026-10-30 07:37: CEO Richard Teng: "your money is safe". "Bottom line - your money is safe, and we're covering every loss." (https://x.com/_RichardTeng/status/2116072080525656150)
- 2026-10-30 08:47: Binance finds "additional points of breach"; withdrawals in 45 hours. "We are still on track towards the expected timeline to resume the withdrawal service in 45 hours." (https://x.com/binance/status/2116089661408108712)

## The numbers

| Chain | USD | What |
|---|---|---|
| Ethereum | 3,790,000,000 | ETH and 185 tokens |
| Bitcoin | 1,470,000,000 | 18,270 BTC |
| Tron | 628,000,000 | 612.7M USDT and 46.4M TRX |
| XRP Ledger | 296,000,000 | 233.46M XRP |
| Solana | 96,000,000 | 970,500 SOL |
| Arbitrum, Optimism, Base | 39,000,000 | including 74.6M ARB |
| Avalanche | 28,000,000 |  |
| Polygon | 10,000,000 |  |

Frozen: about USD 2,700,000,000 by Tether, Circle, Ripple, World Liberty Financial and Arbitrum's Security Council. "Tether, Circle, Ripple and World Liberty Financial froze about USD 2.67 billion in stablecoins, and Arbitrum's Security Council froze 8,426 ETH and 74.6 million ARB on its network, for a total of roughly USD 2.7 billion." (https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history)

## Is it true? Claims people are making

| Claim | Verdict | Why | Items making it |
|---|---|---|---|
| North Korea did it | Unconfirmed | Three analytics firms say so, TRM with high confidence. No government has said so yet. | 93 |
| The biggest crypto hack ever | True | True at the value when taken, about four times Bybit. Older Bitcoin thefts are bigger at today's prices. | 62 |
| It was done in 20 minutes | True | The main transfers ran from 20:05 to 20:24 UTC; smaller sweeps went on until 23:56. | 20 |
| $6.3 billion is gone | Misleading | $6.3 billion was taken, but about $3 billion is frozen and Binance says it covers every customer loss. | 7 |
| Binance halted trading | False | Binance paused withdrawals only; deposits kept working. Its statements never mention halting trading. | 3 |
| One engineer's laptop let the hacker in | Misleading | Binance first pointed to a laptop, then said it found additional points of breach; its CEO said it was not a one-click attack. | 2 |
| Cold wallets were hacked | False | The thefts came from hot wallets, the ones kept online to pay withdrawals. | 1 |
| Binance confirmed North Korea did it | False | Binance's CEO said its investigation has not attributed responsibility to anyone. | 0 |
| Customers lost their money | Unconfirmed | Binance says it covers every loss from its emergency fund and company money; its Proof of Reserves will show whether it can. | 0 |
| Binance's private keys were stolen | Unconfirmed | Binance says it found no evidence of a key leak; the analytics firms say the attacker got Binance's own signing to approve the transfers. | 0 |

## What happens next

- **Withdrawals reopen** (expected 2026-11-01): Binance said 45 hours from 08:47 UTC on 30 October. "Binance aims to restore withdrawals by Sunday and publish a full proof of reserves by Monday, as the attacker keeps moving funds on Tron." (https://decrypt.co/382237/binance-sets-aside-6-34b-to-cover-hack-losses-ceo-says-your-assets-are-safe)
- **Proof of Reserves report** (expected 2026-11-02): Shows whether Binance holds every customer's assets after the theft. "It plans to publish a full proof of reserves report by Monday, with an initial view before then." (https://decrypt.co/382237/binance-sets-aside-6-34b-to-cover-hack-losses-ceo-says-your-assets-are-safe)
- **Technical post-mortem**: Binance's own account of how the attacker got in. "We will share a detailed technical post-mortem once the investigation is complete and the facts are fully verified." (https://www.binance.com/en/support/announcement/detail/c5a8729a97ac486d963784d96c5642d7)
- **An official attribution**: So far only private firms name North Korea. "The FBI is aware of the incident and is engaged with relevant public and private partners to understand the scope of the activity, evaluate potential impacts and coordinate appropriate investigative steps" (https://www.nextgov.com/cybersecurity/2026/10/fbi-involved-response-63-billion-binance-hack-linked-north-korea/416946/)
- **The unfrozen $2.4B to $3.3B**: Whether the attacker can cash out the assets no issuer can freeze. "The attacker is swapping the rest into ETH and other assets that cannot be frozen, and has begun moving funds between blockchains." (https://www.elliptic.co/insights/binance-largest-hack-in-history/)

## People in this story

- Binance: The exchange that was hit
- Richard Teng: Binance CEO
- Changpeng Zhao (CZ): Binance co-founder and shareholder
- Yi He: Binance co-founder
- TraderTraitor: North Korean group the analytics firms blame
- TRM Labs, Chainalysis, Elliptic: Blockchain analytics firms tracing the funds
- ZachXBT: Independent on-chain investigator
- Tether, Circle: Stablecoin issuers that froze stolen funds
- FBI, US Secret Service: US agencies involved in the response
- Abu Dhabi FSRA: Binance's main licensing regulator

## Subjects

- Technology > Cybersecurity > Hacks & Breaches > Crypto Exchange Hacks (primary): An attacker emptied Binance's hot wallets on ten blockchains in about four hours.
- Crime, Law & Justice > Cybercrime > Crypto Theft: Three blockchain analytics firms count $6.36 billion to $6.43 billion taken, the largest crypto theft on record at the value when taken.
- Business & Finance > Crypto & Digital Assets > Crypto Exchanges > Withdrawals & Customer Funds: Customer withdrawals, and Binance's statement that it will cover every loss.
- Technology > Cybersecurity > Threat Actors > State-Sponsored Hacking: The analytics firms blame North Korea's TraderTraitor group; Binance and the US government have not confirmed who did it.
- Technology > Cybersecurity > Attack Methods > Private Key & Wallet Compromise: The transfers ran from hot wallets, including 50 pre-signed authorizations on Ethereum.
- Technology > Cybersecurity > Security Response > Asset Freezes & Recovery: About $3 billion has been frozen so far.
- Business & Finance > Crypto & Digital Assets > Stablecoins > Stablecoin Freezes: Tether, Circle, Ripple and World Liberty Financial froze about $2.67 billion in stablecoins.
- Business & Finance > Crypto & Digital Assets > Crypto Markets > Bitcoin: The file's markets fact: Bitcoin at a six-week low of $76,368.
- Society > Misinformation & Fact-Checks > Viral Claims: Ten claims spread across platforms; each is checked against its sources in the file.

## Sources

### From Binance (23)

- [User funds are safe!

It does look like a hack on Binance. Appreciate the quick freeze from Tether (~$971m) and Circle (~$823m).

I don't ma](https://x.com/cz_binance/status/2115915423174853077) (Changpeng Zhao (CZ), co-founder, 2026-10-29, 6,228,881 views)
- [Binance's initial investigation suggests that the security incident may involve a compromised DevOps engineer’s laptop, which allowed an att](https://x.com/binance/status/2115993361517891592) (Binance, 2026-10-30, 5,936,380 views)
- [Binance has begun recovering affected assets for users and continues to work with law enforcement, issuers, blockchain intelligence firms an](https://x.com/binance/status/2116121748555153621) (Binance, 2026-10-30, 1,952,158 views)
- [Our teams are aware of reports of a potential security issue and are actively investigating. User funds are completely safe.

Our security t](https://x.com/binance/status/2115918888429133902) (Binance, 2026-10-29, 1,383,928 views)
- [Update: The current verified total frozen amount is around $3 billion. 

Our teams continue to work closely with law enforcement, issuers, b](https://x.com/binance/status/2115970069696217576) (Binance, 2026-10-30, 1,247,516 views)
- [We are working non-stop to resolve this issue. Binance will cover all losses.

As a precaution, all deposits and withdrawals are temporarily](https://x.com/binance/status/2115960292115124558) (Binance, 2026-10-30, 1,002,572 views)
- [Binance will cover all losses.

As a precaution, all deposits and withdrawals are temporarily suspended while our team conducts security che](https://x.com/binance/status/2115981055043981791) (Binance, 2026-10-30, 951,318 views)
- [Seems token recovery already began.

Another little detail in addition to the effort described, users pay trading fees on Binance in the coi](https://x.com/cz_binance/status/2116137390180065546) (Changpeng Zhao (CZ), co-founder, 2026-10-30, 835,959 views)
- [We are aware of differing figures circulating publicly regarding the amount frozen, including references to $1.8 billion.

For clarity, the](https://x.com/binance/status/2115947325617299903) (Binance, 2026-10-29, 823,733 views)
- [Saw a few discussions about size of hack, why impact to bitcoin price is small, etc. 👇 

$6.3 billion is the biggest in USD terms, but not i](https://x.com/cz_binance/status/2116198836729520420) (Changpeng Zhao (CZ), co-founder, 2026-10-30, 741,748 views)
- [Investigation update: Our initial investigation suggested that the security incident may have involved a compromised laptop, however our sub](https://x.com/binance/status/2116089661408108712) (Binance, 2026-10-30, 721,583 views)
- [I want to speak to you directly about what happened.

Bottom line - your money is safe, and we're covering every loss.

Our initial investig](https://x.com/_richardteng/status/2116072080525656150) (Richard Teng, CEO, 2026-10-30, 556,354 views)
- [I want to speak to you directly about what happened.

Bottom line - your money is safe, and we're covering every loss.

Our initial investig](https://x.com/_RichardTeng/status/2116072080525656150) (Richard Teng, CEO, 2026-10-30, 555,125 views)
- [Service Update

Deposits remain unaffected and continue to operate as normal.

Withdrawals remain paused while our team completes a security](https://x.com/binance/status/2116026356740034858) (Binance, 2026-10-30, 534,661 views)
- [An update on the security incident.](https://x.com/_richardteng/status/2116176335722913865) (Richard Teng, CEO, 2026-10-30, 520,261 views)
- [User funds are SAFU.](https://x.com/heyibinance/status/2116189354418897261) (Yi He, co-founder, 2026-10-30, 492,545 views)
- [Our team is conducting security checks. Withdrawals will resume as soon as the security issue is fully resolved.

User funds remain safe.

W](https://x.com/binance/status/2115935002139742437) (Binance, 2026-10-29, 489,214 views)
- [We are aware of reports of a potential security issue and we are actively investigating. 
Our security teams are reviewing all relevant info](https://x.com/heyibinance/status/2115915841195942020) (Yi He, co-founder, 2026-10-29, 440,524 views)
- [As part of our ongoing security measures, Binance Alpha trading has been temporarily suspended - CEX Buy Token/Alpha instant/CEX purchase pr](https://x.com/binance/status/2115943482204574108) (Binance, 2026-10-29, 388,983 views)
- [Our team is conducting security checks. Withdrawals will resume as soon as the security issue is fully resolved.

User funds remain safe.

W](https://x.com/binance/status/2115930656589119995) (Binance, 2026-10-29, 233,248 views)
- [Our teams are aware of reports regarding a potential security issue and are actively investigating.

I want to be direct: user funds remain](https://x.com/_richardteng/status/2115962445584081395) (Richard Teng, CEO, 2026-10-30, 105,024 views)
- [Our team is conducting security checks. Withdrawals will resume as soon as the security issue is fully resolved.

User funds remain safe.

W](https://x.com/binance/status/2115933712856891856) (Binance, 2026-10-29, 1 views)
- [Security Incident Update (2026-10-30)](https://www.binance.com/en/support/announcement/detail/c5a8729a97ac486d963784d96c5642d7) (Binance, 2026-10-30)

### Investigators and agencies (7)

- [BREAKING: Arbitrum Security Council has executed a transaction to freeze ~$30.5M from the Binance Exploit.  

Thanks to all other signers in](https://x.com/zachxbt/status/2115960582230913357) (ZachXBT, 2026-10-30, 1,089,983 views)
- [Update: Stolen funds from the $6.3B Binance exploit and $388M Bitget exploit were commingled at the same address 45 minutes ago, after arriv](https://x.com/zachxbt/status/2116030284261179538) (ZachXBT, 2026-10-30, 402,052 views)
- [Internet Crime Complaint Center (IC3) | North Korea Responsible for $1.5 Billion Bybit Hack](https://www.ic3.gov/PSA/2025/PSA250226) (FBI)
- [Arkham Uncovers $3.5B Heist - the Largest Ever](https://info.arkm.com/announcements/arkham-uncovers) (Arkham, 2025-08-15)
- [North Korea Steals USD 6.36 Billion From Binance in the Largest Hack in History](https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history) (TRM Labs, 2026-10-30)
- [The largest theft in history: Sanctioned actors linked to North Korea behind the $6.4 billion Binance hack | Elliptic](https://www.elliptic.co/insights/binance-largest-hack-in-history/) (Elliptic, 2026-10-30)
- [Binance Hack: Tracing the $6.4 Billion Theft to North Korea - Chainalysis](https://www.chainalysis.com/blog/binance-exploit-latest-findings-and-response/) (Chainalysis, 2026-10-30)

### News (125)

- [Binance Suffers Security Breach Affecting $6.3 Billion in Assets, Nearly $3 Billion Frozen](https://thehackernews.com/2026/10/binance-suffers-security-breach.html) (The Hacker News)
- Updated Details of Binance's Proof of Reserves (2025-03-09)
- Binance’s Latest Proof-of-Reserves: What It Means for You? (2025-04-25)
- Binance's Latest Proof Of Reserves Report Reveals Over 100% Supported Assets (2025-05-08)
- Important Update to Proof of Reserves (POR) (2026-01-07)
- [Binance Proof of Reserves: How 1:1 Asset Backing Is Verified](https://www.binance.com/en/square/post/288692460454002) (binance.com, 2026-02-06)
- [BitEagle News(@News)'s insights](https://www.binance.com/en/square/post/288769569810290) (binance.com, 2026-02-06)
- Binance Proof of Reserves: Strengthening Transparency in Crypto (2026-03-04)
- Binance Updated April Certificate of Reserves with PAXG Included for The First Time (2026-04-07)
- [What Is Proof of Reserves (PoR)?](https://www.binance.com/en/academy/articles/what-is-proof-of-reserves-and-how-it-works-on-binance) (binance.com, 2026-05-14)
- [Improving Crypto Transparency With Zero-Knowledge Proofs](https://www.binance.com/en/academy/articles/improving-crypto-transparency-with-zero-knowledge-proof) (binance.com, 2026-06-26)
- [Safest Crypto Exchanges in MENA in 2026: Binance, OKX, Bybit and More](https://www.binance.com/en/square/post/358885163648266) (binance.com, 2026-08-23)
- [Is My Money Safe on Binance? Understanding Proof of Reserves, SAFU and Security Safeguards](https://www.binance.com/en/square/post/377871930710107) (binance.com, 2026-10-16)
- [Is My Money Safe on Binance? How Binance Protects User Funds](https://www.binance.com/en/square/post/377185258072702) (binance.com, 2026-10-16)
- Binance proof of reserves: what you can verify yourself and what no one guarantees (2026-10-16)
- [Binance North Korea Hack: $6.3B, TraderTraitor, Bybit [2026]](https://shattered.io/binance-6-3b-theft-north-korea-tradertraitor-bybit-comparison-2026/) (shattered.io, 2026-10-28)
- [North Korea’s TraderTraitor linked to $6.3B Binance hack](https://lcx.com/en/cryptonews/north-koreas-tradertraitor-linked-to-63b-binance-hack) (lcx.com, 2026-10-29)
- [Binance loses over $6 billion in the largest crypto hack to date](https://www.coindesk.com/business/2026/10/29/potential-multi-billion-binance-hack-hitting-crypto-markets) (CoinDesk, 2026-10-29)
- [Binance targeted in $6.3 billion crypto heist, the largest ever](https://www.nbcnews.com/business/markets/binance-hack-tether-circle-stablecoins-rcna606445) (nbcnews.com, 2026-10-29)
- [Watch Binance’s $6.3 Billion Cyber Heist Shows Crypto Vulnerabilities](https://www.bloomberg.com/news/videos/2026-10-30/binance-s-6-3b-cyber-heist-shows-crypto-vulnerabilities-video) (bloomberg.com, 2026-10-30)
- [Watch Binance Suspends Withdrawals After Suspected Hack](https://www.bloomberg.com/news/videos/2026-10-30/binance-suspends-withdrawals-after-suspected-hack-video) (bloomberg.com, 2026-10-30)
- [Binance says customer money is safe after huge hack drains key reserve wallets](https://www.coindesk.com/business/2026/10/30/binance-hack-drained-wallets-backing-customer-assets-reserve-data-shows) (coindesk.com, 2026-10-30)
- [Binance's $6.3 billion hack: What we know and what comes next](https://www.cnbc.com/2026/10/30/billions-in-crypto-frozen-in-binance-hack-heres-what-happens-next-.html) (cnbc.com, 2026-10-30)
- [Binance’s Teng Sets Monday Reserve Report Deadline as Withdrawals Stay Paused](https://thedefiant.io/news/hacks/binance-s-teng-sets-monday-reserve-report-deadline-as-withdrawals-stay-paused) (thedefiant.io, 2026-10-30)
- Binance Accounts for 68.7% of Reserves in Eight-Exchange Comparison (2026-10-30)
- North Korea Steals USD 6.36 Billion From Binance in the Largest Hack in History (2026-10-30)
- [Crypto's longtime foe, North Korea's Lazarus Group, likely behind Binance hack: blockchain sleuths](https://www.coindesk.com/policy/2026/10/29/crypto-s-longtime-foe-north-korea-s-lazarus-group-likely-behind-binance-hack-blockchain-sleuths) (coindesk.com, 2026-10-30)
- [Binance Security Incident: Withdrawal Status, Timeline and FAQs](https://thedefiant.io/news/hacks/binance-security-incident-withdrawal-status-timeline-and-faqs) (thedefiant.io, 2026-10-30)
- [Binance halts trading after biggest-ever crypto hack](https://www.axios.com/2026/10/29/binance-cyberattack-crypto-heist) (axios.com, 2026-10-30)
- [World’s largest crypto exchange hit by world’s largest heist](https://edition.cnn.com/2026/10/30/tech/binance-crypto-heist-hnk-intl) (edition.cnn.com, 2026-10-30)
- [Binance Halts Withdrawals, Confirms Hack Of $6.3 Billion](https://bitcoinmagazine.com/news/bitcoin-price-slides-near-76000-binance) (bitcoinmagazine.com, 2026-10-30)
- [TRM Labs Attributes Binance Attack to North Korean Group TraderTraitor](https://www.tokenpost.com/news/technology/44270) (tokenpost.com, 2026-10-30)
- TRM Labs Links $6.36 Billion Binance Hack to North Korean Group TraderTraitor (2026-10-30)
- [Was Binance Hacked? Crypto Exchange Says Funds Are Safe After ‘Potential Security Issue’](https://www.forbes.com/sites/antoniopequenoiv/2026/10/30/binance-says-63-billion-impacted-in-record-crypto-hack-suspends-withdrawals/) (forbes.com, 2026-10-30)
- [The Compensation Bill Behind Binance's $6.3 Billion Loss: Where Will the Money Come From?](https://www.panewslab.com/en/articles/01a18b3b-9417-766f-a825-a36da480f88f) (panewslab.com, 2026-10-30)
- North Korean hackers behind $6.3 billion Binance crypto raid, says TRM Labs (2026-10-30)
- [Binance $6.3 Billion Crypto Hack: What Happened](https://www.forbes.com/sites/digital-assets/2026/10/30/binances-63-billion-hack-started-with-one-engineers-laptop/) (forbes.com, 2026-10-30)
- Binance to resume withdrawals within 48 hours after $6.3B hack (2026-10-30)
- Live updates: Binance $6.3B hack linked to North Korea’s TraderTraitor (2026-10-30)
- [TRM Labs links North Korea to $6.36 billion Binance hack](https://grafa.com/en/news/crypto/trm-labs-links-north-korea-to-6-36-billion-binance-hack) (grafa.com, 2026-10-30)
- $6 Billion Binance Hack Bears Hallmarks of North Korea’s TraderTraitor (2026-10-30)
- Binance Hack: $6.36B Moved, North Korea Blamed [2026] (2026-10-30)
- [Crypto giant Binance hit by $6.3bn hack suspected to be largest in history](https://www.bbc.com/news/articles/cwg7xp8kx4v5o) (bbc.com, 2026-10-30)
- Binance estimates security breach impact at $6.3 billion (2026-10-30)
- Who is TraderTraitor? North Korean hackers behind the $6.3-billion Binance hack (2026-10-30)
- [Binance Suspends Transactions After It Is Targeted in Biggest-Ever Cyber Heist](https://www.wsj.com/finance/currencies/binance-founder-says-exchange-may-be-victim-of-biggest-ever-crypto-heist-24a82e5f) (wsj.com, 2026-10-30)
- [Binance Suspends Withdrawals After $6.3 Billion Cryptocurrency Hack as Bitcoin and Crypto Stocks Fall](https://finance.yahoo.com/markets/crypto/articles/binance-suspends-withdrawals-6-3-102432013.html) (finance.yahoo.com, 2026-10-30)
- [Binance Hack Could Leave ETH Reserves 6% Short: Can Its November Proof of Reserves Close the Gap?](https://finance.yahoo.com/markets/crypto/articles/binance-hack-could-leave-eth-103715253.html) (finance.yahoo.com, 2026-10-30)
- North Korea Behind the Binance Hack? What We Know (2026-10-30)
- [Crypto platform Binance confirms 'complex' $6.3 bn hack](https://finance.yahoo.com/markets/crypto/articles/crypto-platform-binance-confirms-major-013059975.html) (finance.yahoo.com, 2026-10-30)
- [How the Binance hack happened and who was behind it](https://www.euronews.com/2026/10/30/how-the-binance-hack-happened-and-who-was-behind-it) (euronews.com, 2026-10-30)
- [Binance hackers stole $6.3 billion in record-breaking crypto heist](https://www.theverge.com/tech/1023021/binance-hack-billions-biggest-crypto-heist) (theverge.com, 2026-10-30)
- [Cryptocurrency exchange Binance suspends trading after suspected hack linked to North Korea](https://www.dw.com/en/binance-crypto-exchange-suspends-trades-over-north-korea-linked-hack/a-79803280) (dw.com, 2026-10-30)
- [How North Korea became a hacking superpower](https://www.ft.com/content/46c03338-63d5-43fc-a946-ebcbe9e1c07a?syn-25a6b1a6=1) (ft.com, 2026-10-30)
- [Binance Suspends Withdrawals After Hackers Steal $6.3 Billion](https://finance.yahoo.com/markets/crypto/articles/binance-suspends-withdrawals-hackers-steal-114800375.html) (finance.yahoo.com, 2026-10-30)
- Binance flags 'potential security issue,' says approximately $6.3 billion impacted (2026-10-30)
- Binance halts withdrawals after $6.3bn security breach (2026-10-30)
- Binance Suffers "Largest Bank Heist In Human History," And Musk Issues Warning About State Of Cybersecurity After $6.3 Billion Hack (2026-10-30)
- [The $6.3 Billion Binance Hack Was Pulled Off in Just 20 Minutes](https://www.wired.com/story/the-dollar63-billion-binance-hack-was-pulled-off-in-just-20-minutes/) (wired.com, 2026-10-30)
- [$6.3 billion Binance hack was likely work of North Korea, blockchain intel firms say](https://www.cbsnews.com/news/binance-hack-north-korea/) (cbsnews.com, 2026-10-30)
- [Who are Lazarus and TraderTraitor, the North Korean hackers blamed for the Binance hack?](https://www.nacionale.com/en/articles/lazarus-tradertraitor-north-korea-hackers-binance) (nacionale.com, 2026-10-30)
- North Korea-linked TraderTraitor likely behind Rs 59,820 crore Binance hack (2026-10-30)
- Who is TraderTraitor? The North Korean hacking group suspected of stealing $6.3 billion from Binance (2026-10-30)
- [Binance arranges $6.34 billion to cover losses from biggest crypto hack ever](https://www.coindesk.com/business/2026/10/30/binance-arranges-usd6-34-billion-to-cover-losses-from-record-crypto-hack) (CoinDesk, 2026-10-30)
- [TRM and Chainalysis Tie $6.4B Binance Hack to North Korea's TraderTraitor - Decrypt](https://decrypt.co/382224/trm-and-chainalysis-tie-6-4b-binance-hack-to-north-koreas-tradertraitor) (Decrypt, 2026-10-30)
- Binance hacked, billions in crypto stolen (2026-10-30)
- [Hackers steal $6.3 billion from Binance in record heist blamed on North Korea](https://finance.yahoo.com/markets/crypto/articles/tether-circle-freeze-2-38-222607515.html) (finance.yahoo.com, 2026-10-30)
- Clues Point to Familiar Culprit in Massive Binance Crypto Heist: North Korea (2026-10-30)
- Binance Says It Has Reserved Over $6.34 Billion to Cover Hack Losses (2026-10-30)
- [Binance says it holds $5B in matching tokens to cover hack losses](https://www.tradingview.com/news/cointelegraph:4b99f03fa094b:0-binance-says-it-holds-5b-in-matching-tokens-to-cover-hack-losses/) (tradingview.com, 2026-10-30)
- [TRM and Chainalysis Tie $6.4B Binance Hack to North Korea's TraderTraitor](https://finance.yahoo.com/markets/crypto/articles/trm-chainalysis-tie-6-4b-122204759.html) (finance.yahoo.com, 2026-10-30)
- Who are the hackers suspected in Binance's $6.3 billion crypto theft? Are they state-backed groups? (2026-10-30)
- [FBI is involved in response to $6.3 billion Binance hack linked to North Korea - Nextgov/FCW](https://www.nextgov.com/cybersecurity/2026/10/fbi-involved-response-63-billion-binance-hack-linked-north-korea/416946/) (Nextgov/FCW, 2026-10-30)
- [UAE's FSRA issues statement after Binance reports $6.3-billion security breach | Khaleej Times](https://www.khaleejtimes.com/business/uae-fsra-statement-binance-63-billion-security-breach) (Khaleej Times, 2026-10-30)
- [Binance says $6.3bn stolen in biggest crypto heist in history: What we know | Crypto News | Al Jazeera](https://www.aljazeera.com/news/2026/10/30/binance-says-6-3bn-stolen-in-biggest-crypto-heist-in-history-what-we-know) (Al Jazeera, 2026-10-30)
- [Hackers steal $6.3-billion from Binance in record heist blamed on North Korea - The Globe and Mail](https://www.theglobeandmail.com/business/international-business/us-business/article-hackers-steal-63-billion-from-binance-in-record-heist-blamed-on-north/) (Reuters (via The Globe and Mail), 2026-10-30)
- How big a deal is the $6.3bn Binance crypto heist, who did it, and are investments safe? (2026-10-30)
- North Korean hackers steal over $6 billion from the largest cryptocurrency exchange (2026-10-30)
- Bitcoin slides after crypto’s nightmare scenario: a historic $6.3 billion heist (2026-10-30)
- [What we know about the $6.3bn Binance hack](https://www.ft.com/content/58fee10f-8a99-4e8b-835d-ddba5e434ce3?syn-25a6b1a6=1) (ft.com, 2026-10-30)
- Binance hit by record $6.3B crypto hack, suspends withdrawals (2026-10-30)
- [Blockchain intelligence firms link North Korea to $6.3B hack on Binance](https://www.npr.org/2026/10/30/g-s1-150902/blockchain-intelligence-firms-link-north-korea-to-6-3b-hack-on-binance) (npr.org, 2026-10-30)
- [Binance Hack, Linked to North Korea backed TraderTraitor and Lazarus Group, Crashes Bitcoin and Crypto Markets, as Hacker’s BTC Holdings Exceed Coinbase’s Corpo](https://www.crowdfundinsider.com/2026/10/320963-binance-hack-linked-to-north-korea-backed-tradertraitor-and-lazarus-group-crashes-bitcoin-and-crypto-markets-as-hackers-btc-holdings-exceed-coinbases-corporate-treasury/) (crowdfundinsider.com, 2026-10-30)
- [Crypto: North Korea suspected behind the $6.3 billion stolen from Binance](https://www.cointribune.com/en/binance-hack-new-clues-point-to-north-korean-hackers/) (cointribune.com, 2026-10-30)
- FBI and US Secret Service working with Binance after $6.3 billion hack, source says (2026-10-30)
- [North Korean hackers blamed for stealing record $6.3B in Binance breach](https://techcrunch.com/2026/10/30/north-korean-hackers-blamed-for-stealing-record-6-3b-in-binance-breach/) (techcrunch.com, 2026-10-30)
- [Binance halts withdrawals after $6.3 billion cryptocurrency heist](https://www.nhregister.com/news/article/binance-hack-6-3-billion-cryptocurrency-22502164.php) (nhregister.com, 2026-10-30)
- Binance suspends deposits and withdrawals after suspected hack (2026-10-30)
- North Korea's TraderTraitor behind USD 6.3 billion Binance hack? What you should know (2026-10-30)
- [$6.3 billion Binance crypto hack could be biggest ever as new details emerge](https://www.cleveland.com/news/2026/10/63-billion-binance-crypto-hack-could-be-biggest-ever-as-new-details-emerge.html) (cleveland.com, 2026-10-30)
- Binance Estimates $6.3 Billion Hacked in Crypto's Biggest Heist (2026-10-30)
- [What Binance users should do right now following $6.3 billion hack](https://finance.yahoo.com/personal-finance/investing/article/what-binance-users-should-do-right-now-following-63-billion-hack-152239989.html) (finance.yahoo.com, 2026-10-30)
- [Cryptocurrency giant Binance hit by $6.3 billion hack](https://amp.dw.com/en/how-crypto-hackers-drained-binance-of-63-billion-in-20-minutes/video-79808229) (amp.dw.com, 2026-10-30)
- [North Korea-linked group steals $6.3B from Binance in largest-ever cryptocurrency hack](https://www.cybersecuritydive.com/news/binance-hack-north-korea-cryptocurrency-theft/873304/) (cybersecuritydive.com, 2026-10-30)
- North Korea linked to $6.3B Binance hack (2026-10-30)
- Binance hacked, and withdrawals are now on hold, plus Nasdaq wants tokenization on its own terms (2026-10-30)
- Binance CEO Says Full Proof-of-Reserves Report Due Nov. 2, Pledges Full Compensation for Hack Losses (2026-10-30)
- [FBI is involved in response to $6.3 billion Binance hack linked to North Korea](https://www.nextgov.com/cybersecurity/2026/10/fbi-involved-response-63-billion-binance-hack-linked-north-korea/416946/?oref=ng-homepage-river) (nextgov.com, 2026-10-30)
- Binance Suspends Withdrawals After Crypto Hackers Steal $6.3 Billion (2026-10-30)
- Binance Lost Over $6 Billion in Crypto Hack. Here’s What to Know. (2026-10-30)
- Binance Hack Sends Crypto Stocks Tumbling (2026-10-30)
- [Bitcoin Price Plummets: Why a Binance Hack Is Shaking Crypto Today](https://www.barrons.com/articles/bitcoin-price-binance-crypto-hack-909849ff) (barrons.com, 2026-10-30)
- [Binance hack update: How the $6.3 billion crypto hack happened](https://mashable.com/tech/crypto-binance-hack-update-cause-revealed) (mashable.com, 2026-10-30)
- [$6.3 billion Binance hack is largest crypto theft on record](https://www.cnbc.com/video/2026/10/30/6point3-billion-binance-hack-is-largest-crypto-theft-on-record.html) (cnbc.com, 2026-10-30)
- Binance hit by record $6.3 billion cryptocurrency theft (2026-10-30)
- Binance says $6.3B US hacked in what could be largest cryptocurrency theft ever (2026-10-30)
- [Crypto giant Binance attempting to recover $6.3bn stolen in hack linked to North Korea](https://www.bbc.co.uk/news/articles/cwe8lp7zy07zo) (bbc.co.uk, 2026-10-30)
- [Binance discovers multiple breach points in $6.3 billion attack, eyes Sunday reopening](https://www.coindesk.com/tech/2026/10/30/binance-uncovers-wider-breach-in-usd6-3-billion-exploit-targets-sunday-withdrawal-restart) (coindesk.com, 2026-10-30)
- Binance $6.34B Reserve After $6.3B Hack [2026] (2026-10-30)
- Binance reserves $6.34bn to cover stolen assets after cyberattack – CEO (2026-10-30)
- [$6.3B gone: Meet TraderTraitor, the elite North Korean hackers accused of the 'largest bank heist in human history'](https://finance.yahoo.com/markets/crypto/articles/6-3b-gone-meet-tradertraitor-161500933.html) (finance.yahoo.com, 2026-10-30)
- [TRM and Chainalysis Attributes $6.4B Binance Breach To TraderTraitor](https://crypto-economy.com/trm-and-chainalysis-attributes-6-4b-binance-breach-to-tradertraitor/) (crypto-economy.com, 2026-10-30)
- [Binance Sets Aside $6.34B to Cover Hack Losses, CEO Says 'Your Assets Are Safe' - Decrypt](https://decrypt.co/382237/binance-sets-aside-6-34b-to-cover-hack-losses-ceo-says-your-assets-are-safe) (Decrypt, 2026-10-30)
- [Binance’s Record $6.3B Hack Recapped From Cointelegraph’s Live Coverage](https://cointelegraph.com/news/recap-binances-record-63b-hack-unfolded) (Cointelegraph, 2026-10-30)
- Massive crypto hack probably the largest theft of digital currencies in history (2026-10-30)
- Binance’s $6.3 Billion Hack Is Just the Start of a Risky New Era (2026-10-30)
- North Korean Hackers Blamed for Record $6.3B Binance Breach (2026-10-30)
- Binance plans to publish full proof of reserves by Monday following hack (2026-10-30)
- Binance says hackers who stole a record $6.3 billion in crypto used a 'self-destruct mechanism' to hide their tracks (2026-10-30)
- What Is TraderTraitor? North Korea Group Accused Of $6 Billion Binance Heist (2026-10-30)
- [Why bitcoin held up better after the record Binance hack](https://www.cnbc.com/2026/10/30/binance-hack-bitcoin-price.html) (cnbc.com, 2026-10-30)
- [North Korean hackers likelinked to record-breaking $6.3 billion Binance crypto heist](https://finance.yahoo.com/markets/article/bitcoin-drops-to-76000-as-binance-hack-spooks-investors-tether-circle-freeze-assets-083406383.html) (finance.yahoo.com, 2026-10-30)
- Binance hack: Investigators in a 'cat and mouse game' to recover $6.3 billion in stolen funds (2026-10-30)
- [Crypto exchange security in 2026: 5 platforms compared](https://qz.com/crypto-exchange-security-2026-compared) (qz.com, 2026-10-30)
- [Hackers steal $6.3B from Binance in record heist blamed on North Korea](https://thedailyrecord.com/2026/10/30/hackers-steal-6-3-billion-from-binance-north-korea/) (thedailyrecord.com, 2026-10-30)

### YouTube (25)

- [The Binance Hack | Explained.](https://www.youtube.com/watch?v=BMO6RQAFGhM) (Meet Kevin, 142,544 views)
- [How crypto hackers drained Binance of $6.3 billion in 20 minutes | DW News](https://www.youtube.com/watch?v=3tmPCylnuKE) (DW News, 122,528 views)
- [How Binance was hacked for $6 billion?!](https://www.youtube.com/watch?v=LVTOyJNbMA4) (Coin Bureau and The Bureau Podcast, 102,155 views)
- [Binance HACKED...Billions of Bitcoin and Crypto Lost](https://www.youtube.com/watch?v=fVlEM1k2IFU) (CryptosRUs, 95,315 views)
- [How Binance Was HACKED For $6 Billion](https://www.youtube.com/watch?v=5u2IlJytBT8) (Coin Bureau, 71,056 views)
- [Up to $8.9b stolen from Binance in largest ever cryptocurrency hack | ABC NEWS](https://www.youtube.com/watch?v=Pw0ehu59r8A) (ABC News (Australia), 67,865 views)
- [Binance Suffers $6.3 Billion Hack in Crypto’s Biggest Heist](https://www.youtube.com/watch?v=cw7WST9jBFI) (Bloomberg Television, 65,133 views)
- [Binance Hacked For BILLIONS. Market Plummets. Funds Are SAFU?](https://www.youtube.com/watch?v=hWWDsQuBjRA) (Digital Asset News, 61,063 views)
- [URGENT! Binance Hacked, What Crypto Investors NEED to Know!](https://www.youtube.com/watch?v=tShDQ4GUa1g) (Crypto Banter and Crypto Insider, 36,846 views)
- [Crypto hack described as ‘largest in bank heist history’](https://www.youtube.com/watch?v=2TeyeFeN4ks) (ABC News, 30,997 views)
- [🚨🚨🚨 BINANCE HACKED FOR $5.6 BILLION!!!! 🚨🚨🚨](https://www.youtube.com/watch?v=5Mn-rO_o1c0) (Thomas Kralow, 22,506 views)
- [Binance Confirms $6.3 Billion In Total Hack Impact](https://www.youtube.com/watch?v=DfJNgEbHcD4) (The Wolf Of All Streets, 18,532 views)
- [Crypto Rocked by Biggest Heist on Record](https://www.youtube.com/watch?v=JtvNQLdExBY) (Bloomberg Television, 15,991 views)
- [Binance Hacked?! $6.3B GONE (Crypto Is Crashing)](https://www.youtube.com/watch?v=yLh79rkPW1Q) (JM Crypto, 15,215 views)
- [Binance Hack: $5.7 Billion Gone in 20 Minutes. How It Happened](https://www.youtube.com/watch?v=kwv-Jcg_OrY) (Hidden Economy, 12,552 views)
- [Hackers Steal $6.3 Billion From Binance. What You Need To Know - October 30](https://www.youtube.com/watch?v=BKTqPU3IPxM) (ABC News, 11,719 views)
- [Binance Hacked $6.3B: Is Your Crypto Safe? - How to Protect Your Crypto After Binance's Hack](https://www.youtube.com/watch?v=OZADEGy-Ryk) (ilme aalim, 10,091 views)
- [How Alphabet's AI strategy, worst-ever stock drop could impact your 401K](https://www.youtube.com/watch?v=E_rqbLH1960) (CBS Mornings, 6,687 views)
- [Binance hack: What we know so far](https://www.youtube.com/watch?v=-RxZkrZWLLY) (CNBC International Live, 5,346 views)
- [Gil Messing: This is probably the biggest and most sophisticated crypto hack](https://www.youtube.com/watch?v=keYg_u5E7xQ) (CNBC Television, 3,761 views)
- [Binance loses $6.3 billion in the biggest crypto heist ever | The 8:30](https://www.youtube.com/watch?v=qdtKiFU2Pns) (Yahoo Finance, 2,355 views)
- [How Did Hackers Steal $6.3 BILLION from Binance?](https://www.youtube.com/watch?v=v0w0KIswFvw) (The CryptoDad, 1,164 views)
- [What to Know About the $6.3 Billion Binance Hack](https://www.youtube.com/watch?v=tx_G1ScRVWQ) (Bitcoin Magazine, 228 views)
- [Binance hack: World's largest cryptocurrency exchange estimates $6.3 billion stolen](https://www.youtube.com/watch?v=R6Gp0hafKQo) (ABC7, 140 views)
- [Binance Hacked: $6.3 Billion Stolen in Biggest Crypto Breach Ever](https://www.youtube.com/watch?v=PXACUMOYU3E) (WFTV Channel 9, 45 views)

### TikTok (30)

- [Hackers stole over to $6 billion in cryptocurrency on Thursday from crypto exchange Binance, shattering the record for the largest such heis](https://www.tiktok.com/@cnn/video/7702395721504263438) (CNN, 2026-10-30, 1,100,000 views)
- [BREAKING: Binance is investigating a possible major security breach after billions of dollars in suspicious wallet movements sparked fears o](https://www.tiktok.com/@dailytrenches/video/7702247157344193812) (Trenches Daily, 2026-10-30, 469,200 views)
- [Sau vụ sàn Binance bị tấn công thiệt hại hơn 6 tỷ đô thì tỷ phú Elon Musk chỉ để lại đúng một bình luận ngắn gọn là Everyday is Zeroday #onc](https://www.tiktok.com/@oncoinx2/video/7702292465973234964) (Oncoin X, 2026-10-30, 318,000 views)
- [Binance hack ခံရပီး Crypto တန်ဖိုး စျေးထိုးကျ #binance #hack #news #money #crypto](https://www.tiktok.com/@phyohankyawphillip/video/7702337843368135957) (tiktok.com, 2026-10-30, 204,800 views)
- [The suspected #Binance hack — said to be the biggest attack in #crypto history — is "not the end of the world," says Ballet CEO Bobby Lee, w](https://www.tiktok.com/@bloombergbusiness/video/7702335493156965662) (Bloomberg Business, 2026-10-30, 203,600 views)
- [ከ1 ትሪሊዮን ብር በላይ ተዘረፈ #kbnews #ethiopian_news #ethiopian_tik_tok](https://www.tiktok.com/@kb_news1/video/7702481263147486471) (KB News, 2026-10-30, 106,800 views)
- [A U.S.-based blockchain intelligence firm says North Korean hackers were likely behind the theft of $6.3 billion US — nearly $9 billion Cdn](https://www.tiktok.com/@cbcnews/video/7702482207499095303) (CBC News, 2026-10-30, 97,300 views)
- [North Korea linked to the $6.3 BILLION Binance hack! Blockchain investigators suspect North Korea’s notorious TraderTraitor hacking group wa](https://www.tiktok.com/@dailytrenches/video/7702446131883674901) (Trenches Daily, 2026-10-30, 55,000 views)
- [Will you lose money after this massive Binance hack? #Binance #CryptoExchange #Cryptocurrency #NorthKorea #BBCNews](https://www.tiktok.com/@bbcnews/video/7702506867527879958) (BBC News, 2026-10-30, 44,200 views)
- [So they’re saying that Binance got hacked #bnb #binance ##coinbase #crypto](https://www.tiktok.com/@zyph0g0/video/7702192936892648734) (tiktok.com, 2026-10-29, 36,500 views)
- [Largest bank heist in human history… #bnb #binance #eth #solana #btc](https://www.tiktok.com/@damemoves/video/7702319639262448917) (tiktok.com, 2026-10-30, 34,700 views)
- [Are North Korean hackers behind the biggest bank heist in history? #crypto #binance #bitcoin #fyp](https://www.tiktok.com/@lbcnews/video/7702362657529023766) (LBC News, 2026-10-30, 29,400 views)
- [#cz #binance #btc #hack](https://www.tiktok.com/@syamsults/video/7702360902065999122) (tiktok.com, 2026-10-30, 26,400 views)
- [#Binance said Friday that a security incident impacted about $6.3 billion in client assets, with around $3 billion frozen on-chain, marking](https://www.tiktok.com/@cnbc/video/7702495108276423949) (cnbc, 2026-10-30, 21,600 views)
- [Binance Hacked and Robbed of $2.8 Billion: The Greatest Heist in History? #Binance #hacked #crypto #heist #stablecoin](https://www.tiktok.com/@dollarindex/video/7702289667382627597) (tiktok.com, 2026-10-30, 15,300 views)
- [#binance #fyp #4u](https://www.tiktok.com/@znakthekid/video/7702225036572216628) (tiktok.com, 2026-10-29, 11,900 views)
- [Elon Musk trolled Binance's massive hack. Its founder CZ hit back with a billion-dollar reminder. #elonmusk #binance #cz #crypto #spacex](https://www.tiktok.com/@moniify/video/7702491313651993876) (Moniify, 2026-10-30, 10,700 views)
- [Cryptocurrency giant Binance suffered a record-breaking $6.3 billion heist that analysts believe was carried out by North Korean hacking gro](https://www.tiktok.com/@cbsnews/video/7702511123660131597) (cbsnews, 2026-10-30, 6,071 views)
- [CNBC's MacKenzie Sigalos reports on how the cryptocurrency exchange #Binance is addressing the fallout from a roughly $6.3 billion hack. ⠀ R](https://www.tiktok.com/@cnbc/video/7702510530736508174) (cnbc, 2026-10-30, 5,761 views)
- [Was Binance just hacked? 🚨 Billions drained, Tether + Circle froze $2.4B. Yes or no: would you pull your crypto? binance hack, binance withd](https://www.tiktok.com/@webthreechain/video/7702241927999048990) (tiktok.com, 2026-10-29, 4,740 views)
- [The great Binance exploit. #crypto #binance #exploit #malone #larp](https://www.tiktok.com/@x%E2%80%8A%CD%8F%E2%80%8D%CD%8F%E2%80%8D/video/7702516066593017108) (tiktok.com, 2026-10-30, 1,719 views)
- [This is absolutely massive news, one of the biggest hacks in history. That is a hell of a lot of money in crypto to go missing.  Wow.  #bina](https://www.tiktok.com/@tangofy/video/7702399250013080835) (tiktok.com, 2026-10-30, 507 views)
- [BINANCE JUST GOT HACKED FOR $2,7 BILLION!!🚨🚨 move off from exchange and Cold wallet 🚨 #xrp #crypto #binance #hack #moveofffromexchange](https://www.tiktok.com/@qfs_digitalassset0/video/7702286247540313364) (3T Global Academy, 2026-10-30, 485 views)
- [🚨 ¿ESTAMOS ANTE UNA NUEVA ERA DE HACKERS? Un ataque multimillonario sacude el mundo cripto: 6.300 millones de dólares en juego. ¿Pudo la int](https://www.tiktok.com/@juanarielsalvatrierra/video/7702515148753292558) (tiktok.com, 2026-10-30, 332 views)
- [Le sacaron US$ 6.300 millones a Binance en unos 20 minutos 😳 Es el mayor hackeo cripto de la historia, casi 4 veces el récord anterior (Bybi](https://www.tiktok.com/@jorgediaz.finanzas/video/7702514758121016584) (tiktok.com, 2026-10-30, 165 views)
- [#FYP #breakingnews #binance](https://www.tiktok.com/@archeiaaurora/video/7702517359491173662) (tiktok.com, 2026-10-30, 134 views)
- [🚨 BREAKING: BINANCE HACKED?! 😳🔥 Rumors are circulating, but has an actual breach been confirmed? If you hold XRP, BTC, or other crypto on Bi](https://www.tiktok.com/@hansiwoox/video/7702525279511563527) (tiktok.com, 2026-10-30, 127 views)
- [Binance $6.3 Billion Hack — The Largest Crypto Theft Ever 🚨 Hackers drained an estimated $6.3 billion from Binance without stealing private](https://www.tiktok.com/@muhammad.abbas.kh223/video/7702514955794386184) (tiktok.com, 2026-10-30, 77 views)
- [🚨 BINANCE HACKED? 👀💰 If a major crypto platform can face security threats, what does that mean for the rest of us? 🔐 From phishing scams to](https://www.tiktok.com/@amarachi_amazone/video/7702520635427261716) (tiktok.com, 2026-10-30, 8 views)
- [🚨Secure Your Crypto the Right Way Don't leave your assets sitting on exchanges or wallets both carry risks. Protect and structure them prope](https://www.tiktok.com/@jakeclaverdigital01/video/7702523630260931892) (tiktok.com, 2026-10-30, 4 views)

### Instagram (6)

- [Binance, the world's largest cryptocurrency exchange, has suffered the biggest crypto hack in history, with an estimated $6.3 billion stolen](https://www.instagram.com/p/DfHT9FqgJpg) (evolving.ai, 2026-10-30)
- [World’s largest crypto exchange Binance hacked with over $5.6 billion stolen:

• $1.45 billion $BTC 
• $875 million $ETH
• $234 million $TRX](https://www.instagram.com/p/DfGCTT4IPNV) (watcher.guru, 2026-10-29)
- [BREAKING: Blockchain investigators at TRM Labs and Chainalysis say North Korea’s elite hacking unit, TraderTraitor, is responsible for the $](https://www.instagram.com/p/DfHlj4CIcRM) (bitcoinmagazine, 2026-10-30)
- [Hackers steal $6.3 billion worth of crypto from Binance in record heist blamed on North Korea. 

#crypto #northkorea #finance #bitcoin #tech](https://www.instagram.com/p/DfH-VEzIAkY) (watcher.guru, 2026-10-30)
- [How Binance got hacked for $6.3 billion last night: 

• $1.41 billion $BTC 
• $1.17 billion $ETH
• $234 million $TRX
• $50 million $XAUT
• $](https://www.instagram.com/reel/DfILDESCEYJ) (watcher.guru, 2026-10-30)
- [Thursday night’s breach of Binance is now the largest crypto theft on record. Tether and Circle froze their tokens within the hour, but roug](https://www.instagram.com/p/DfHhK-aFCuz) (cointelegraph, 2026-10-30)

### On X (4)

- [The Kobeissi Letter on X: "BREAKING](https://x.com/KobeissiLetter/status/2116124957805514847) (KobeissiLetter)
- [Matt Johansen on X: "wtf is going on" / X](https://x.com/mattjay/status/2115945696025346492) (x.com)
- [Whale Alert (@whale_alert) on X](https://x.com/whale_alert/status/2115907228301426881) (x.com)
- [ALERT: Binance allegedly suffered a $2.77 billion hack.](https://x.com/Cointelegraph/status/2115914944696689147) (Cointelegraph)

### Reddit (38)

- [North Korea Steals USD 6.36 Billion From Binance in the Largest Hack in History](https://www.reddit.com/r/technology/comments/1xj6gwl/north_korea_steals_usd_636_billion_from_binance/) (reddit.com, 2026-10-30)
- [The $6.3 Billion Binance Hack Was Pulled Off in Just 20 Minutes](https://www.reddit.com/r/technology/comments/1xjdg5q/the_63_billion_binance_hack_was_pulled_off_in/) (reddit.com, 2026-10-30)
- [Binance was just hacked for 5.6B - Get your Funds Out of Binance IF YOU CAN.](https://www.reddit.com/r/CryptoCurrency/comments/1xj1agm/binance_was_just_hacked_for_56b_get_your_funds/) (reddit.com, 2026-10-30)
- [At the same time Adam Silver announces partnership with Polymarket, Hackers drain Polymarket accounts to the tune of over $2.7 Million](https://www.reddit.com/r/nba/comments/1xj0ypp/at_the_same_time_adam_silver_announces/) (reddit.com, 2026-10-30)
- [Crypto exchange Binance hacked of over $6 billion](https://www.reddit.com/r/wallstreetbets/comments/1xj7w95/crypto_exchange_binance_hacked_of_over_6_billion/) (reddit.com, 2026-10-30)
- [TIL that after Binance lost about 7,000 BTC (roughly $40 million) in a 2019 hack, it covered every user's losses from an emergency insurance fund it had set up ](https://www.reddit.com/r/todayilearned/comments/1xjdx0b/til_that_after_binance_lost_about_7000_btc/) (reddit.com, 2026-10-30)
- [Binance loses $5.7 billion in largest crypto hack to date](https://www.reddit.com/r/anime_titties/comments/1xiy8oq/binance_loses_57_billion_in_largest_crypto_hack/) (reddit.com, 2026-10-29)
- [BINANCE HACKED - $5.6B gone. Biggest hack in crypto history. Get your funds out while you still can](https://www.reddit.com/r/IndianStreetBets/comments/1xj2x4h/binance_hacked_56b_gone_biggest_hack_in_crypto/) (reddit.com, 2026-10-30)
- [Geisteskrank was grade abgeht](https://www.reddit.com/r/wallstreetbetsGER/comments/1xj252a/geisteskrank_was_grade_abgeht/) (reddit.com, 2026-10-30)
- [BINANCE HACKED?? WTF IS GOING ON](https://www.reddit.com/r/Bitcoin/comments/1xiwbgv/binance_hacked_wtf_is_going_on/) (reddit.com, 2026-10-29)
- [Binance halts withdrawals after record $6.3bn heist](https://www.reddit.com/r/CryptoCurrency/comments/1xjenal/binance_halts_withdrawals_after_record_63bn_heist/) (reddit.com, 2026-10-30)
- [Polymarket and Binance allegedly suffering severe hacks. Undetermined amounts of crypto being "drained".](https://www.reddit.com/r/PrepperIntel/comments/1xj2fd2/polymarket_and_binance_allegedly_suffering_severe/) (reddit.com, 2026-10-30)
- [$2.77 Billion Flows Out of Binance-Linked Wallets Across Five Blockchains; Hacking Unconfirmed](https://www.reddit.com/r/CryptoCurrency/comments/1xiwlen/277_billion_flows_out_of_binancelinked_wallets/) (reddit.com, 2026-10-29)
- [The girls are fighting: Elon laughs about the Binance hack. CZ pleads "Please stop."](https://www.reddit.com/r/Buttcoin/comments/1xjg02d/the_girls_are_fighting_elon_laughs_about_the/) (reddit.com, 2026-10-30)
- [North Korea Steals USD 6.36 Billion From Binance in the Largest Hack in History](https://www.reddit.com/r/CryptoCurrency/comments/1xj9oyy/north_korea_steals_usd_636_billion_from_binance/) (reddit.com, 2026-10-30)
- [Binance hack and a DevOps laptop](https://www.reddit.com/r/devops/comments/1xj4flc/binance_hack_and_a_devops_laptop/) (reddit.com, 2026-10-30)
- [North Korea Steals USD 6.36 Billion From Binance in the Largest Hack in History](https://www.reddit.com/r/pwnhub/comments/1xj85x9/north_korea_steals_usd_636_billion_from_binance/) (reddit.com, 2026-10-30)
- [The Binance hack is real.](https://www.reddit.com/r/CryptoCurrency/comments/1xixi3o/the_binance_hack_is_real/) (reddit.com, 2026-10-29)
- [The Binance hack is real.](https://www.reddit.com/r/Bitcoin/comments/1xixhk9/the_binance_hack_is_real/) (reddit.com, 2026-10-29)
- [Otra victoria de los gordos Corralito](https://www.reddit.com/r/argentina/comments/1xj1djm/otra_victoria_de_los_gordos_corralito/) (reddit.com, 2026-10-30)
- [More context on the Binance crypto hack.](https://www.reddit.com/r/btc/comments/1xj7lny/more_context_on_the_binance_crypto_hack/) (reddit.com, 2026-10-30)
- [Binance gets “hacked” after Trump pardons their CEO](https://www.reddit.com/r/WhitePeopleTwitter/comments/1xjlz4f/binance_gets_hacked_after_trump_pardons_their_ceo/) (reddit.com, 2026-10-30)
- [Binance hack updates: Crypto firm finds multiple 'points of breach' in $6.3bn heist](https://www.reddit.com/r/Economics/comments/1xjcjyo/binance_hack_updates_crypto_firm_finds_multiple/) (reddit.com, 2026-10-30)
- [North Korea Steals USD 6.36 Billion From Binance in the Largest Hack in History](https://www.reddit.com/r/Bitcoin/comments/1xjehto/north_korea_steals_usd_636_billion_from_binance/) (reddit.com, 2026-10-30)
- [Crypto giant Binance hit by ‘biggest bank hack in history’ as £4.7bn stolen and Bitcoin market in chaos](https://www.reddit.com/r/hacking/comments/1xjbj4w/crypto_giant_binance_hit_by_biggest_bank_hack_in/) (reddit.com, 2026-10-30)
- [Binance and Kucoin hacked for over $3 billion - CZ Says Everything’s Fine](https://www.reddit.com/r/Buttcoin/comments/1xiwt7y/binance_and_kucoin_hacked_for_over_3_billion_cz/) (reddit.com, 2026-10-29)
- [Crypto industry suffers 'largest bank heist in human history' as billions stolen in Binance hack](https://www.reddit.com/r/USNEWS/comments/1xj6duw/crypto_industry_suffers_largest_bank_heist_in/) (reddit.com, 2026-10-30)
- [JUST IN: Approximately $5.7 billion left Binance-linked wallets across the Ethereum, Bitcoin, and TRON networks in a suspected hack that the exchange is current](https://www.reddit.com/r/EconomyCharts/comments/1xixpi7/just_in_approximately_57_billion_left/) (reddit.com, 2026-10-29)
- [Binance взломала Северная Корея — и совершила крупнейшее крипто-ограбление на планете на 6.3 миллиарда долларов.](https://www.reddit.com/r/KafkaBTC/comments/1xj8bm4/binance_%D0%B2%D0%B7%D0%BB%D0%BE%D0%BC%D0%B0%D0%BB%D0%B0_%D1%81%D0%B5%D0%B2%D0%B5%D1%80%D0%BD%D0%B0%D1%8F_%D0%BA%D0%BE%D1%80%D0%B5%D1%8F_%D0%B8_%D1%81%D0%BE%D0%B2%D0%B5%D1%80%D1%88%D0%B8%D0%BB%D0%B0/) (reddit.com, 2026-10-30)
- [Binance Hacked - $5.6 Billion - Largest Crypto Theft EVER!](https://www.reddit.com/r/CryptoIndia/comments/1xj04a5/binance_hacked_56_billion_largest_crypto_theft/) (reddit.com, 2026-10-29)
- [Black October update: The largest hack in crypto history just happened. $5.6 billion stolen.](https://www.reddit.com/r/ArtificialInteligence/comments/1xjb86s/black_october_update_the_largest_hack_in_crypto/) (reddit.com, 2026-10-30)
- [This website is tracking the Binance hack. So far, "2.72b" frozen, "$2.55b" got away, and "$144m" has been sold.](https://www.reddit.com/r/Buttcoin/comments/1xj26zr/this_website_is_tracking_the_binance_hack_so_far/) (reddit.com, 2026-10-30)
- [⚠️Binance⚠️ sofre maior hack da história -> 5 Biliões](https://www.reddit.com/r/literaciafinanceira/comments/1xiy1g4/binance_sofre_maior_hack_da_hist%C3%B3ria_5_bili%C3%B5es/) (reddit.com, 2026-10-29)
- [The Binance hack is the largest heist in human history by pure dollar value, dwarfing all previous physical and digital robberies of any asset class, ever. Is t](https://www.reddit.com/r/Buttcoin/comments/1xj9nxh/the_binance_hack_is_the_largest_heist_in_human/) (reddit.com, 2026-10-30)
- [Biggest hack in crypto history and I rushed to check my fortune](https://www.reddit.com/r/binance/comments/1xj5p1s/biggest_hack_in_crypto_history_and_i_rushed_to/) (reddit.com, 2026-10-30)
- [Be your own bank. 😂](https://www.reddit.com/r/Buttcoin/comments/1xj3lwf/be_your_own_bank/) (reddit.com, 2026-10-30)
- [North Korea Steals USD 6.36 Billion From Binance in the Largest Hack in History](https://www.reddit.com/r/atrioc/comments/1xjfy8j/north_korea_steals_usd_636_billion_from_binance/) (reddit.com, 2026-10-30)
- [“Minha vida aqui é uma desgraça, é problema o tempo todo, não posso mais sair na rua tomar um caldo de cana e comer um pastel “](https://www.reddit.com/r/farialimabets/comments/1xixk6v/minha_vida_aqui_%C3%A9_uma_desgra%C3%A7a_%C3%A9_problema_o_tempo/) (reddit.com, 2026-10-29)

### Hacker News (25)

- [Binance-hacker-1029 – $5.6B stolen from Binance](https://news.ycombinator.com/item?id=50296470) (arkm.com, 2026-10-29)
- [The $6.3B Binance hack was pulled off in just 20 minutes](https://news.ycombinator.com/item?id=50303172) (wired.com, 2026-10-30)
- [Blockchain intelligence firms link North Korea to $6.3B hack on Binance](https://news.ycombinator.com/item?id=50305480) (npr.org, 2026-10-30)
- ['Elite North Korean hackers' blamed for $6.3B Binance hack](https://news.ycombinator.com/item?id=50300853) (theguardian.com, 2026-10-30)
- [Over $5B drained from Binance in apparent hack](https://news.ycombinator.com/item?id=50296272) (twitter.com, 2026-10-29)
- [North Korea Steals USD 6.36B from Binance in the Largest Hack in History](https://news.ycombinator.com/item?id=50300644) (trmlabs.com, 2026-10-30)
- [Binance hot wallet drained of about $2.5B in tokens on Ethereum](https://news.ycombinator.com/item?id=50296234) (etherscan.io, 2026-10-29)
- [One of Binance Hot Wallets drained to a new account, funded by Tornado Cash](https://news.ycombinator.com/item?id=50295824) (etherscan.io, 2026-10-29)
- [Binance hot wallet signed 50 EIP-7702 delegations 3 minutes before the drain](https://news.ycombinator.com/item?id=50300979) (808bits.com, 2026-10-30)
- [Binance's possible hack triggers $3B freeze in crypto assets](https://news.ycombinator.com/item?id=50298941) (reuters.com, 2026-10-30)
- [Is Binance Being Hacked? $2B Outflow Puts Customer Funds in Question](https://news.ycombinator.com/item?id=50296425) (beincrypto.com, 2026-10-29)
- [Binance Hacked](https://news.ycombinator.com/item?id=50296451) (twitter.com, 2026-10-29)
- [Binance hot wallet signed 50 EIP-7702 delegations 3 minutes before the drain](https://news.ycombinator.com/item?id=50306715) (reddit.com, 2026-10-30)
- [Blockchain analysis firm TRM says North Korea behind Binance crypto theft](https://news.ycombinator.com/item?id=50300299) (reuters.com, 2026-10-30)
- [Binance Suspends Transactions After It Is Targeted in Biggest-Ever Cyber Heist](https://news.ycombinator.com/item?id=50300568) (wsj.com, 2026-10-30)
- [Binance Hacker Hunts for Exit Ramps as DeFi Exchanges Pause Markets](https://news.ycombinator.com/item?id=50298707) (decrypt.co, 2026-10-30)
- [The largest theft in history: DPRK behind the $6.4B Binance hack](https://news.ycombinator.com/item?id=50304607) (elliptic.co, 2026-10-30)
- [Binance $6.3B Hack Analysis](https://news.ycombinator.com/item?id=50305533) (hacken.io, 2026-10-30)
- [Binance cofounder Changpeng Zhao asks Elon Musk for 'respect'](https://news.ycombinator.com/item?id=50306023) (cnbc.com, 2026-10-30)
- [Binance: Who Opened the Vault? – Cold Logic – EP00](https://news.ycombinator.com/item?id=50300794) (2tinteractive.com, 2026-10-30)
- [Why do Binance-like exchange development quotes vary so much?](https://news.ycombinator.com/item?id=50301398) (cryptiecraft.com, 2026-10-30)
- [Binance – Total impact sits at around $6.3B](https://news.ycombinator.com/item?id=50301550) (twitter.com, 2026-10-30)
- [Binance lost $6.3B without leaking a single private key](https://news.ycombinator.com/item?id=50301659) (syncroma.com, 2026-10-30)
- [Hackers stole $6.3B from Binance, likely NK and compromised dev's laptop](https://news.ycombinator.com/item?id=50302868) (finance.yahoo.com, 2026-10-30)
- [Binance $5.5B Hack: Blockaid Detects the Biggest Theft in Crypto History](https://news.ycombinator.com/item?id=50303386) (blockaid.io, 2026-10-30)

## How this page is made

Every fact, moment and verdict carries the exact words of its source, checked word for word against the stored page before publishing. Public posts are listed without their authors' names. Data files: https://venkatapagadala.com/notebook/events/binance-hack-2026.json, https://venkatapagadala.com/notebook/events/binance-hack-2026-sources.csv, https://venkatapagadala.com/notebook/events/binance-hack-2026.rss.xml. Cite as: The Binance hack, October 2026, Venkata Pagadala, https://venkatapagadala.com/notebook/events/binance-hack-2026
