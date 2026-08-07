---
title: "Digital Wallet Push Provisioning, and the Pipeline That Shipped It"
summary: "Adding a card to Apple Pay from inside the banking app, where the app is never allowed to see the card number. Plus the release pipeline built alongside it, because a feature you cannot safely roll back is a feature you ship slowly."
status: "published"
tags: ["Fiserv", "tokenization", "Apple Pay", "PCI DSS", "CI/CD"]
order: 3
readTime: 9
---

"Add to Apple Wallet" is a single button, and the reason it is worth writing about is that the button works without the app ever holding a card number.
That constraint drives the entire architecture, and it is the thing most descriptions of wallet provisioning skip straight past.

## The problem with the obvious approach

Manual card entry is bad in a specific, measurable way: the member has to find the physical card, type sixteen digits, an expiry, and a CVV into a phone, and then very likely fail a step-up verification because the issuer has no strong signal that the person typing is the cardholder.
Every one of those steps is a drop-off point, and the last one generates a call to the contact centre.

Push provisioning inverts it.
The member is already authenticated inside the issuer's app.
The issuer already knows the card is theirs, that it is active, and that the account is in good standing.
That existing authentication is the strongest identity signal in the flow, so the sensible design is to let the issuer assert it rather than making the member re-prove it to a wallet.
Fiserv makes exactly this point publicly about digital issuance: provisioning from the issuer's processing environment removes the need for additional cardholder verification, because the card is being added from a context that already established identity.

## How the flow keeps the PAN out of the app

Apple's API shape tells you the architecture if you read it carefully.

The app presents `PKAddPaymentPassViewController`, gated on `PKAddPaymentPassViewController.canAddPaymentPass()`.
The configuration the app supplies is deliberately thin: payment network, cardholder name, encryption scheme, a localized description, and `primaryAccountSuffix`, which is the last four digits.
Last four is enough to display the card and to de-duplicate against passes already in the wallet. It is not enough to transact.

The interesting part is the delegate callback:

```swift
func addPaymentPassViewController(
    _ controller: PKAddPaymentPassViewController,
    generateRequestWithCertificateChain certificates: [Data],
    nonce: Data,
    nonceSignature: Data,
    completionHandler handler: @escaping (PKAddPaymentPassRequest) -> Void
)
```

Apple hands the app a certificate chain, a nonce, and a signature over that nonce.
The app's entire job is to relay those three values to the issuer host and hand back what it gets in return.
What comes back is a `PKAddPaymentPassRequest`, whose properties are `activationData`, `encryptedPassData`, `ephemeralPublicKey`, and `wrappedKey`.

Every one of those is opaque to the app.
The app cannot decrypt `encryptedPassData`, and it has no reason to want to.
The card number lives on the issuer and processor side of that boundary and is never transmitted through the mobile client.

Visa describes the same shape from the other direction: an issuer registers the account to obtain a universal card identifier, calls the in-app provisioning API with it, receives encrypted card data, and passes that payload to Apple Pay, Google Pay, or Samsung Pay for tokenization.
One server-side flow, three wallets.

The entitlement is worth knowing about before you plan a timeline: `com.apple.developer.payment-pass-provisioning` is not self-serve.
Apple's own documentation says you need special permission to submit an app with it enabled.
That is a lead-time item, not an engineering item, and it belongs on the schedule early.

The Android path is architecturally the same - the issuer app relays an opaque, issuer-encrypted payload rather than card data - though Google distributes its push provisioning documentation under partner access rather than publishing it openly.

## Tokenization vocabulary, used correctly

This is a domain where imprecise terminology is an immediate credibility problem, so it is worth being exact.

The **FPAN** is the funding PAN, the real number on the plastic.
The **DPAN** is the device PAN, the network token provisioned to one specific device and wallet.
One FPAN maps to many DPANs, which is precisely what makes the model useful: a token can be suspended per device without touching the underlying card.

The **Token Service Provider** mints and manages those tokens, and in OEM wallets the TSP is the card network.
Mastercard's is **MDES**, the Mastercard Digital Enablement Service.
Visa's is **VTS**, the Visa Token Service.

**VDEP**, the Visa Digital Enablement Program, is a commercial and contractual framework granting access to VTS.
It is not a technology, and using the two names interchangeably is a reliable signal that someone has read about tokenization rather than shipped it.

Fiserv's public positioning maps onto this cleanly: it offers tokenization through VTS and MDES for its processed debit and credit issuers, and push provisioning that drives tokens from the issuer out to wallets.

The half of this that gets least attention and causes most operational pain is **token lifecycle management**, which Fiserv also markets explicitly.
Cards get reissued after fraud or expiry.
If that reissue does not propagate to the DPANs already sitting in members' wallets, the member's phone stops working at the till with no explanation and no action they can take.
The provisioning flow is the launch; lifecycle is the part you live with.

## What tokenization does and does not do to PCI scope

The overclaim here is "we tokenized, so we are out of PCI scope," and it does not survive contact with the actual guidance.

The PCI Security Standards Council's [tokenization guidance](https://www.pcisecuritystandards.org/documents/Tokenization_Guidelines_Info_Supplement.pdf) frames tokenization as something that may reduce the applicability of some requirements and shrink the cardholder data environment.
It is explicit that before any system is deemed out of scope it must be verified that it is not connected to the CDE and cannot retrieve or access PAN, and that any component with access to the tokenization or de-tokenization process is in scope.

The sharper point, and the one usually omitted: tokens that can be used to initiate a transaction may themselves be in scope, even when they cannot be reversed to a PAN.
A network token is exactly that kind of token.

So the defensible claim is narrow and specific.
Because the app receives only a certificate chain, a nonce, a nonce signature, and an opaque encrypted blob it has no key for, **the mobile application is kept outside the cardholder data environment**.
The PAN-handling boundary stays with the issuer and processor, which remain fully in scope.
Final scoping is a determination for a QSA and the acquirer, not something an architecture diagram settles.

Stating it that way is both more accurate and more persuasive than the confident version.

## Shipping it: the pipeline built alongside

A provisioning defect is not a normal bug.
It touches a member's payment credentials, the feedback loop runs through a card network, and you cannot fix forward in the ten seconds someone is standing at a checkout.
That risk profile is what justified overhauling delivery at the same time.

Three changes did most of the work.

**Feature-flagged deployment**, so that release and activation stopped being the same event.
Shipping the code and turning it on became separate decisions, which meant the rollback path was a flag flip rather than a redeploy under pressure.
For a payments feature that distinction is the difference between an incident lasting seconds and lasting an hour.

**Browser-level end-to-end tests in the pipeline** with Playwright, in addition to unit coverage.
The failures that matter in an integration like this are integration failures: a step that silently no-ops, a callback that never fires, a state the UI can reach that the backend does not expect.
Unit tests do not see those.

**Test management wired to the pipeline** through TestRail, so that regulated release evidence was a by-product of running tests rather than a document assembled afterwards.
This is the same instinct as the audit trail in the [Plaid work](/case-studies/plaid-ach/): if evidence has to be reconstructed later, it will be reconstructed badly.

All of it on GitHub Actions, triggered on push, so the pipeline was the path of least resistance rather than a thing to remember.

## What I would do differently

I would start the entitlement request before writing any code.
It is pure calendar time with no engineering dependency, and it can gate a launch that is otherwise complete.

I would also design token lifecycle handling in the first pass instead of treating it as a follow-up.
Provisioning is the demo; reissuance is where members actually get hurt, and it is much cheaper to design for at the start than to retrofit once real tokens are in the field.

## Notes on scope

Clean-room. No employer code, configuration, vendor API details, contract terms, or volumes appear here.
The Apple API surface, Visa and Fiserv product descriptions, and PCI SSC guidance cited are all public.
Fiserv's own integration documentation is distributed under partner access, so nothing specific to it is described here.
