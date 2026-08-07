---
title: "Three SAML Integrations, One Pattern"
summary: "Three SAML 2.0 SSO integrations shipped in 2025. The third took a fraction of the time of the first, and this is the pattern that made that true, plus the failure modes that cost me the difference."
status: "published"
tags: ["SAML 2.0", "SSO", "identity", "integration"]
order: 1
readTime: 9
---

Every vendor SSO integration looks the same on the slide: the member clicks a link, the vendor trusts us, the member is signed in.
In practice the first one took weeks longer than I estimated, and almost none of that time went into the part I had planned for.
It went into clock skew, a certificate nobody owned, and a `NameID` format argument conducted over email across three companies.

By the third integration I had a checklist and a test harness, and the work compressed into something closer to a routine change.
This is what that checklist contains and why each line is on it.

## What SAML actually asks you to verify

The temptation with SAML is to reach for a library, point it at some metadata, and stop as soon as a user lands logged in.
That produces a working demo and an insecure integration, because a successful login proves the happy path and nothing else.

The specification is unusually explicit about the service provider's obligations.
[SAML 2.0 Profiles §4.1.4.3](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf) requires the SP to verify signatures on the assertion or response, confirm the `Recipient` matches the assertion consumer service URL the response actually arrived at, confirm `NotOnOrAfter` has not passed subject to allowable clock skew, and confirm `InResponseTo` matches the ID of the original `AuthnRequest`.
Separately, §4.1.4.2 requires the assertion to carry an `AudienceRestriction` naming our entity ID.

That list is the checklist.
Most of my production incidents mapped to a line on it.

Two of those items deserve calling out because they are where I have seen integrations quietly go wrong.

**Under the HTTP POST binding, the assertion itself must be signed.**
The spec language in §4.1.4.5 is that the enclosed assertions "MUST be signed."
An implementation that verifies a signature on the outer `Response` and then reads claims out of an unsigned inner assertion has verified nothing useful.
That gap is the entry point for XML Signature Wrapping, where an attacker relocates the legitimately signed element and injects their own assertion so that the code doing verification and the code reading claims resolve to different nodes in the document.
This is not theoretical: the 2012 USENIX paper [On Breaking SAML](https://www.usenix.org/system/files/conference/usenixsecurity12/sec12-final91.pdf) tested 14 frameworks and found 11 vulnerable.

**Replay protection is a stateful requirement, and stateless services quietly fail it.**
The spec says the SP must ensure bearer assertions are not replayed by keeping the set of used assertion `ID` values for as long as the assertion remains valid.
If that cache lives in process memory behind a load balancer with more than one instance, an assertion replayed against a different instance is accepted.
The code looks correct in review. The deployment topology is what breaks it.

## The failure modes that actually cost me time

**Clock skew, with no number to point at.**
The spec says validation is "subject to allowable clock skew between the providers" and then declines to define a tolerance.
Every implementation picks its own, and they disagree wildly.
Shibboleth's SP defaults to roughly a three minute window either side; `passport-saml` defaults to zero.
A zero-tolerance default against an IdP whose clock has drifted by two seconds produces intermittent, unreproducible login failures that look like a network problem.
The first thing I now check on an intermittent failure is whether both ends are on NTP and what tolerance the SP library actually applies.

**The `NameID` format URI version trap.**
This one is worth memorising because it silently costs hours.
`emailAddress`, `unspecified`, `X509SubjectName` and `WindowsDomainQualifiedName` are all `urn:oasis:names:tc:SAML:1.1:nameid-format:...`, carrying the **1.1** prefix, even in SAML 2.0.
Only `persistent`, `transient`, `entity` and `kerberos` use the `2.0` prefix.
Writing `urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress` is an easy and very common mistake, and the resulting error message rarely points at the URI.

The related design question matters more than the string.
A `transient` NameID is deliberately different on every login.
If you key member records on the NameID and the IdP is sending transient identifiers, you create a fresh account per session and discover it in production, in support tickets, not in testing.

**Audience mismatch by one character.**
The `Audience` has to equal our entity ID exactly.
Trailing slash, `http` against `https`, a capitalisation difference: any of these fail validation, and the failure text is usually generic.
I now treat the entity ID as a literal string to be copied and compared, never retyped.

**Certificate rotation nobody scheduled.**
SAML metadata supports this properly. `KeyDescriptor` elements with `use="signing"` are repeatable precisely so an overlap window exists, and `validUntil` and `cacheDuration` tell consumers when to refresh.
The practical problem is that many vendor SPs consume metadata as a one-time file upload rather than a polled URL.
Rotation then stops being a smooth overlap and becomes a coordinated hard cutover, which means a scheduled outage and a calendar reminder that has to survive staff turnover.
Where I could not get metadata polled, I made the expiry date an owned, ticketed date rather than a fact buried in a certificate.

**Signature algorithm rejection that reads like signature failure.**
Modern stacks reject `rsa-sha1` by algorithm allowlist, matching the [OWASP SAML Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html) guidance to require RSA-SHA-256 or stronger.
The error surfaces as a signature validation failure, which sends you looking at certificates instead of at the algorithm.

**RelayState treated as a redirect target.**
`RelayState` is defined as opaque state.
Reflecting it into a redirect without allowlisting turns your login endpoint into an open redirect, which is a genuinely useful primitive for a phishing campaign against your own members.

## The pattern

The thing that made the third integration fast was refusing to treat these as three integrations.

**One assertion-validation path, not one per vendor.**
Vendors differ in metadata delivery, attribute naming, and which optional features they support.
They do not differ in what the spec requires you to verify.
Separating "how this vendor hands us an assertion" from "what we check before we trust one" meant each new vendor added configuration and attribute mapping, not a second copy of the security-critical code.
A bug fixed in validation is fixed everywhere, and there is one place to review.

**Configuration as data, with the entity ID and certificate treated as operational facts.**
Entity IDs, ACS URLs, expected `NameID` format, allowed clock skew, and certificate expiry all became declared configuration with an owner and an expiry date, rather than values discovered by reading a WSDL attachment in an old email thread.

**A test harness that produces bad assertions on purpose.**
This was the highest-leverage piece and the one I would build first next time.
A green light on a valid assertion tells you almost nothing.
What I wanted was fast, repeatable answers to: expired assertion rejected, `NotBefore` in the future rejected, wrong audience rejected, wrong ACS recipient rejected, unsigned assertion rejected, assertion signed by an untrusted key rejected, replayed assertion ID rejected, and a wrapped-signature document rejected.
Those cases are the actual contract. Once they ran in CI, upgrading a SAML library stopped being an act of faith.

**Single Logout scoped honestly.**
Front-channel SLO depends on the browser visiting every participant so each can clear its own cookie, and the Shibboleth project's own [write-up on SLO](https://shibboleth.atlassian.net/wiki/spaces/CONCEPT/pages/928645229/SLOIssues) is candid that if one SP is unresponsive the chain breaks and the remaining participants never receive the logout request.
Third-party cookie restrictions in modern browsers have not made this easier.
The honest engineering position is that partial logout is the normal outcome, so session lifetime at each participant has to be short enough to matter on its own.
Promising members a single button that reliably ends every session everywhere is a promise the architecture does not support.

## What I would do differently

I would build the negative-case harness before the first integration rather than after the second.
Every hour it took came back within a single vendor cycle, and it converted a category of security review from opinion into a test result.

I would also push much harder, much earlier, for metadata by URL instead of by file.
Nearly every rotation problem I hit traces back to that one decision, and it is far easier to negotiate at integration time than eighteen months later with an expiring certificate.

## Notes on scope

This describes the pattern and the reasoning, not an employer's implementation.
No configuration, code, entity IDs, certificates, or vendor contract terms appear here, and the specification references are all public.
