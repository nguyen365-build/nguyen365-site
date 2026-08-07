---
title: "Plaid ACH Verification, Built for an Examiner"
summary: "Replacing manual account verification with Plaid without losing the evidence trail. The interesting half was not the integration - it was designing the record so that 'show me how you validated this account' has an answer that takes seconds."
status: "published"
tags: ["Plaid", "ACH", "Nacha", "compliance", "audit trail"]
order: 2
readTime: 10
---

Account verification is one of those features where the integration is the easy part.
Plaid's API is good and the happy path is genuinely short.

The part that took real design work was everything that happens after verification succeeds: what we write down, in what shape, and whether it still answers a question asked eighteen months later by someone who was not in the room.
Getting that wrong does not produce a bug. It produces an evidence-gathering exercise during an exam, which is worse, because by then the facts are unrecoverable.

## What the rule actually requires

The requirement people cite here is Nacha's [supplemental fraud-detection standard for WEB debits](https://www.nacha.org/rules/supplementing-fraud-detection-standards-web-debits), effective **March 19, 2021**.
It amended the additional ODFI warranties so that a fraudulent transaction detection system must, at minimum, validate the account to be debited.

Two things about that rule are widely misstated, and both change the design.

**It does not require ownership verification.**
Nacha's own FAQ on the rule is direct about this: the minimum standard requires originators to validate that an account is open and accepts ACH entries.
The rule's words are that the originator must use a commercially reasonable means to determine the account is "a legitimate, open account to which ACH entries may be posted at the RDFI."
Whether you additionally need to prove the person owns the account is a risk decision your institution makes, not something the rule settles for you.
Conflating the two leads teams to either over-build or, worse, to claim compliance coverage they do not have.

**It is technology-neutral, and applies at first use.**
Nacha enumerates acceptable approaches rather than mandating one: prenotification entries, ACH micro-transaction verification, a commercially available validation service, or account validation capabilities enabled by APIs.
So the defensible statement is never "we use Plaid, therefore we comply." It is "an API-based account validation service is an enumerated example of a commercially reasonable means, and here is the record proving we used it."
The rule applies to the first use of an account number or a change to it, and it is explicitly not retroactive.
There is also a sensible carve-out: if the RDFI sends a Notification of Change with a corrected account number, you do not re-validate, because the RDFI warrants that change.

That scoping is the whole data model in disguise.
The unit of evidence is not "a member." It is **(member, account number, first-use event)**, and a changed account number starts a new one.

## What Plaid actually returns

Worth being precise, because the common description of micro-deposits is wrong for Plaid specifically.

Plaid's product here is **Auth**, and it has several coverage flows with meaningfully different properties:

| Flow | Mechanism | Speed |
| --- | --- | --- |
| Instant Auth | Credential-based login at the institution | Instant |
| Instant Match | User enters account and routing numbers; last four matched against the mask retrieved from the institution | Instant |
| Instant Micro-deposits | Micro-deposit sent over RTP or FedNow | Seconds |
| Same Day Micro-deposits | Micro-deposit via Same Day ACH; user enters a code | About one business day |
| Automated Micro-deposits | Deposit verified automatically, no code entry by the user | One to two business days |
| Database Auth | Entered numbers matched against known-good account data | Instant |

The textbook micro-deposit story is two small deposits that the user reports back and that are later reversed.
That is the legacy industry pattern, not Plaid's.
Plaid sends **one $0.01 deposit** carrying a three-letter code in the description, and does not reverse it.
Same Day gives the user three code-entry attempts before the item is permanently locked, and automated verification expires if not completed within seven days.

Those details matter operationally because they determine your support burden and your failure states.
"Locked after three attempts" and "expired after seven days" are member-service events you have to design for, not edge cases.

The verification status transitions are what you actually persist: instant flows return no pending status because verification already happened, while the micro-deposit flows move through `pending_manual_verification` or `pending_automatic_verification` and land on `manually_verified`, `automatically_verified`, `verification_failed`, or `verification_expired`.
An audit record that captures only the final state has thrown away the timeline, which is the part that answers "when did you know."

## Designing the record

The design goal I settled on: an examiner's question should be answerable by a query, not by an investigation.

The concrete requirement behind that is not vague.
Nacha's authorization retention rule requires the originator to keep the authorization record for **two years from the termination or revocation of the authorization**, and on an RDFI's written request the ODFI must produce it **within ten banking days**.
Ten banking days is not long enough to reconstruct anything. It is only long enough to retrieve something.

So each validation event records:

- The member and the account, with the account number masked in anything queryable and the full value held only where it must be.
- **Which validation method was used**, mapped explicitly to the Nacha-enumerated category it satisfies. This is the field auditors care about and the one most likely to be missing, because at write time it feels redundant with "we called Plaid."
- The provider's own identifiers for the interaction, so a claim on our side can be reconciled against the provider's records rather than merely asserted.
- Every status transition with its timestamp, not just the terminal state.
- The authorization artifact itself: what text was presented to the member, when they accepted, and the surrounding request context.
- The linkage from this validation to every entry subsequently originated under it. Without that join, you can prove you validated an account and separately prove you debited one, but not that the debit was covered by the validation.

Structurally the log is append-only.
Corrections are compensating events, never in-place updates, and current state is a projection over the event history.
The reason is not purity, it is that "what did you know and when did you know it" is unanswerable against a table that gets updated in place.
For the same reason, the record keeps both when an authorization was effective and when we recorded it. Those two clocks diverge, and the gap is exactly what gets asked about.

Where the storage supports it, mutation is revoked at the role level rather than merely discouraged in code, and artifact blobs sit on write-once storage with a retention period at least as long as the rule requires.
A control a reviewer can verify from outside the application is worth considerably more than one that depends on reading our code and trusting it.

## The return codes that this does and does not fix

This is where I have seen the value of account validation oversold, and overselling it is how you lose credibility with a risk team.

Validation directly attacks the **bad account data** family: R02 account closed, R03 no account or unable to locate account, R04 invalid account number structure.
Those are exactly the failures that come from a member mistyping a number or using a stale one, and they are what "is this a legitimate, open account that accepts ACH" is designed to catch.

It does **not** prevent R01, insufficient funds.
R01 is a balance question at debit time, not an account-validity question at enrolment time, and it is addressed by balance or risk-scoring products, not by Auth.
Claiming account validation reduces R01 is the single most common technical error I see in ACH write-ups.

It also does not prevent the **authorization** family: R10 where the receiver says they do not know the originator or did not authorize the debit, R11 where an authorization exists but the entry does not conform to it, and R29 where a non-consumer receiver says the entry was unauthorized.
Those are disputes about permission, not about account existence, and the audit trail is what defends them.

R11 is worth understanding properly because it was repurposed: it previously meant a check truncation entry return, and as of April 1, 2020 it covers an authorized debit that departs from its authorization terms.
From April 1, 2021 it also became subject to the unauthorized entry fee and counts toward the unauthorized entry return rate.
The consumer dispute codes carry a 60 calendar day window and a written statement of unauthorized debit; R29 for non-consumer accounts runs on a two banking day deadline instead.
Those windows are why the evidence horizon has to be measured in years rather than months.

## What I would do differently

I would write the audit schema before writing the integration, not alongside it.
Working in the other order meant the first version of the record captured what the API happened to return, rather than what a reviewer would ask for, and the difference between those two sets is not small.

I would also treat "which enumerated method does this satisfy" as a required field from the first commit.
It is trivial to record at the moment of the call and effectively impossible to backfill correctly once several flows exist and some accounts predate the rule's scope.

## Notes on scope

Clean-room. No employer code, configuration, member data, vendor terms, or volume figures appear here.
The rule text, return code definitions, and Plaid product behaviour cited above are public, and I have linked the primary sources where they exist.
Retention and records-preservation obligations for a federally insured credit union also sit under [NCUA 12 CFR Part 749](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-749), which was itself revised in 2026 - check the current text rather than relying on a summary, including this one.
