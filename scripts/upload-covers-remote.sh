#!/bin/bash
# Upload blog cover images to production via API endpoint
# Usage: ./scripts/upload-covers-remote.sh [BASE_URL]
# Example: ./scripts/upload-covers-remote.sh https://lovelygirls.cz

BASE_URL="${1:-https://lovelygirls.cz}"
SECRET="blog-covers-2026"
IMG_DIR="/Users/zen/Desktop/ted"

echo "Uploading blog covers to $BASE_URL..."
echo ""

upload() {
  local file="$1"
  local slug="$2"
  local alt="$3"

  echo -n "  $file → $slug ... "

  RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/blog-covers" \
    -H "x-admin-secret: $SECRET" \
    -F "file=@$IMG_DIR/$file" \
    -F "slug=$slug" \
    -F "alt=$alt")

  if echo "$RESPONSE" | grep -q '"ok":true'; then
    URL=$(echo "$RESPONSE" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "✓ $URL"
  else
    echo "✗ $RESPONSE"
  fi
}

# Existing articles (CZ covers)
upload "EscortTuristi.webp"                         "escort-praha-kompletni-pruvodce"     "Escort v Praze pro turisty"
upload "JakvybratSPOLECNICI.webp"                   "jak-vybrat-spolecnici-praha"          "Jak vybrat společnici v Praze"
upload "CoznamenaGFE.webp"                           "girlfriend-experience-gfe-praha"      "Co znamená GFE"
upload "PruvodcePrivaty.webp"                        "soukrome-apartmany-escort-praha"      "Průvodce priváty v Praze"
upload "DiskretniINCALLpraha.webp"                   "prvni-navsteva-escort-agentury"       "Diskrétní incall v Praze"
upload "Cenyescortuvprazecoovlivnujecenu.webp"       "ceny-escort-praha"                    "Ceny escortu v Praze"
upload "EtikaEscort.webp"                            "etiketa-escort-setkani"               "Etika escort setkání"
upload "BDSMvysvetlení.webp"                         "bdsm-praha-pruvodce"                  "BDSM vysvětlení"
upload "EscortoutcallHOTELCZ.webp"                   "escort-do-hotelu-praha"               "Outcall do hotelu v Praze"
upload "JakvybratpodleTYPU.webp"                     "typy-spolecnic-praha"                 "Jak vybrat podle typu"

# New articles (CZ covers)
upload "DiskretníIncall.webp"                        "diskretni-setkani-praha"              "Diskrétní incall v Praze"
upload "RecenzevERO.webp"                            "recenze-v-erotickem-byznysu"          "Recenze v erotickém byznysu"
upload "KalendardostupnostiJAKHOCIST.webp"           "kalendar-dostupnosti-escort"          "Kalendář dostupnosti"
upload "Tria,ShowAUTOERO.webp"                       "tria-show-autoerotika-praha"          "Tria, show a autoerotika"

echo ""
echo "Done! 14 covers uploaded."
echo ""
echo "Articles without covers: #10 (nocni-zivot-escort-praha), #11 (bezpecnost-escort-setkani)"
