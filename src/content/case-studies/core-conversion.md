---
title: "Notes From the Middle of a Core Conversion"
summary: "Moving a credit union off a legacy core onto Jack Henry's Symitar Episys, written while it is still happening rather than reconstructed afterwards. What a core conversion actually consists of, and why the data mapping is the whole project."
status: "published"
tags: ["core conversion", "Jack Henry", "Symitar Episys", "data migration"]
order: 4
readTime: 10
---

Most write-ups about core conversions are written afterwards, by which point the author remembers a clean narrative with a happy ending.
I am writing this one from the middle, which means I can be accurate about what is hard instead of accurate about what made a good story later.

## Getting the names right first

This trips people up constantly, including vendors' own sales material, so it is worth being precise.

**Jack Henry & Associates** is the parent company.
**Symitar** is its credit union division. It is a brand, not a product.
**Episys** is the actual core processing platform that credit unions run.
So "converting to Symitar" is shorthand; the system is Episys, and saying so correctly is a small but real signal that someone has worked with it rather than read about it.

A few more that matter in practice:

- **Symitar EASE** is the outsourced, service-bureau delivery model, as opposed to running Episys in-house. The distinction changes who owns which operational failure.
- **Episys Quest** is the user-facing application layer that staff actually work in.
- **SymXchange** is the web services API. It is **SOAP with WSDL definitions**, not REST, and the services are named after the underlying files: `AccountService`, `MemberService`, `UserService`, `GeneralLedgerService`, `CheckService`, `WireService` and others.
- **SymConnect** is the older socket-based integration protocol, overlapping in capability.
- **PowerOn** is Symitar's proprietary scripting language for Episys. Scripts are called **specfiles**, and SymXchange can execute them.
- **jXchange** is Jack Henry's API for its *bank* cores. It is not the credit union path, and reaching for it in a Symitar context is a tell.

One genuinely useful constraint from Jack Henry's own SymXchange documentation: it can interact directly with the Symitar database but cannot use workflow functionality built into Quest, such as Card Wizard and Collection Queue.
That boundary decides, early, which integrations can be automated through the API and which are going to remain staff workflow inside the application.

## What a core actually is, and why replacing it is different

The core is the system of record for memberships, shares, loans, and the general ledger.
It is not one application among many. It is the thing every other application asks questions of.

That is what makes the conversion unlike a normal migration.
Online and mobile banking, the card processor, bill pay, e-statements, ACH origination, wires, the IVR, card production, collections, BSA/AML monitoring and the data warehouse all hold identifiers issued by the outgoing core.
Every one of them has to be re-pointed and, more painfully, **re-keyed**.

The mechanic that makes this concrete is the crosswalk: a file mapping old account number and suffix to new account number and suffix, handed to each downstream vendor.
The crosswalk is not a temporary artifact.
Historical statements, disputes, and archived records keep referring to the old identifiers for years, so the mapping becomes a permanent part of the estate.
Treating it as throwaway migration scaffolding is a mistake you discover long after the project closes.

## The data mapping is the project

Everything else is scheduling. This part is the actual work.

The naive model of a conversion is that data moves from one shape to another.
The real model is that the target core has **different opinions about what a record means**, and you are frequently not moving data at all but synthesizing records that never existed.

The clearest example, and one a conversion programmer put well in a [first-person account of the work](https://cusomag.com/2020/02/21/core-conversions-through-the-eyes-of-a-programmer/): if the outgoing core did not require a membership share and the new core requires one for every account, you have to create membership shares that were never there.
That is not a mapping rule. That is a business decision about what those synthesized records should say, and it needs someone with authority to make it.

The same account describes the more mundane failures that consume the calendar:

- **Field decomposition.** A single legacy name field becoming first, middle initial, and last, across decades of records entered by different people following different conventions. There is no parser that gets this fully right, so the question becomes what error rate is acceptable and who reviews the exceptions.
- **Referential and date integrity.** A membership whose open date is later than the open date on a share, draft, certificate, or loan beneath it. Legacy systems tolerated it; the new one may not.
- **Garbage in, garbage out.** Conversion is where every data-quality shortcut taken over twenty years arrives at once, with a deadline attached.

The exceptions that hurt are never the ordinary accounts.
They are deceased members, charged-off loans, dormant accounts, escrow, dividend accruals, and IRA and HSA plan codes: small populations, unusual states, rarely exercised in testing, and highly visible when wrong.

## Mock conversions, and what they are for

You do not get one attempt at this.
Mock conversions are full test loads of real extracted data into the target, and two to three runs is the normal range rather than a sign of trouble.

The reason there are several is structural.
Each mock is bounded by the set of test files the outgoing core provides, and each run surfaces a tier of exceptions that was hidden behind the previous tier.
Fix the records that failed to load, and now records that loaded *incorrectly* become visible.
That layering is why a single heroic mock run is not a viable plan.

A caution on vocabulary here, because it is a place people overclaim.
In modern credit union conversions, "parallel" usually means balancing the outgoing and incoming systems against each other on mock data - reconciling the loan portfolio, the membership base, and the general ledger - rather than running both cores live and dual-posting real transactions.
If you claim a true parallel run, expect to be asked how you handled duplicate posting, and have an answer.

## The cutover, and the part after it

Cutover is a weekend, and it is the most rehearsed and least interesting part if the preceding months went well.
The general ledger has to balance to the penny. Not approximately.

The phase that gets systematically under-planned is stabilization.
Member-facing credentials, payee and bill-pay history, scheduled transfers, and statement continuity are where members personally feel the conversion, and contact centre volume spikes accordingly.
Staff are simultaneously learning new software while handling that spike, which is a compounding problem rather than two separate ones.

Reporting is its own quiet cliff.
PowerOn specfiles and customized reports do not port from another core's equivalents; they get rewritten.
Every operational report someone depends on but never documented surfaces during stabilization, usually as an urgent request.

## What I am taking from it so far

**The inventory is the first deliverable, not the discovery phase.**
Every system holding a core-issued identifier, every integration, every report, every scheduled job. Anything missing from that list is found later at a worse time.

**Decisions about synthesized data need an owner with authority, early.**
Engineering can identify that the target core demands a record the source never had. It cannot decide what that record should say.

**Exception handling deserves as much design as the happy path.**
The bulk of records convert without incident. The project is judged on the ones that do not.

**Write it down while it is happening.**
Which is the reason this page exists in this form. The specific decisions and their reasons are recoverable now and will not be in six months.

## Notes on scope

This is a live project, and this write-up is deliberately about the general shape of the work rather than the specifics of one institution's conversion.
No employer data, configuration, code, vendor terms, timelines, or account structures appear here.
Product and API names are drawn from [Jack Henry's public developer documentation](https://jackhenry.dev/symxchange-api-docs/).
I will add to this as the project progresses.
