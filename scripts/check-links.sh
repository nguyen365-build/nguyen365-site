#!/usr/bin/env bash
# Verify every external URL referenced by the site still resolves.
# A dead citation on a portfolio page is worse than no citation.
# Usage: bash scripts/check-links.sh

UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"

urls=(
  "https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf"
  "https://www.usenix.org/system/files/conference/usenixsecurity12/sec12-final91.pdf"
  "https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html"
  "https://shibboleth.atlassian.net/wiki/spaces/CONCEPT/pages/928645229/SLOIssues"
  "https://www.nacha.org/rules/supplementing-fraud-detection-standards-web-debits"
  "https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-749"
  "https://www.pcisecuritystandards.org/documents/Tokenization_Guidelines_Info_Supplement.pdf"
  "https://cusomag.com/2020/02/21/core-conversions-through-the-eyes-of-a-programmer/"
  "https://jackhenry.dev/symxchange-api-docs/"
  "https://apps.apple.com/us/app/gasbuddy-find-pay-for-gas/id406719683"
  "https://www.linkedin.com/in/nguyen365/"
  "https://github.com/nguyen365-build"
)

fail=0
for u in "${urls[@]}"; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" -L --max-time 25 -A "$UA" "$u" 2>/dev/null)

  # LinkedIn answers automated requests with 999 regardless of whether the
  # profile exists, so it can only be checked by hand in a browser.
  case "$u" in
    *linkedin.com*)
      if [ "$code" = "999" ] || [ "$code" = "200" ]; then
        printf 'ok   %s  %s (999 = LinkedIn bot block, expected)\n' "$code" "$u"
        continue
      fi
      ;;
  esac

  if [ "$code" = "200" ]; then
    printf 'ok   %s  %s\n' "$code" "$u"
  else
    printf 'BAD  %s  %s\n' "$code" "$u"
    fail=1
  fi
done

exit $fail
