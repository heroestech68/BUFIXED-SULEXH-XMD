#!/bin/bash

# Bulk update script for BUFIXED-SULEXH-XMD

# Existing replacements already here...
# ---------------- NEW ONES BELOW ---------------- #

# bugfixed sulexh → bugfixed sulexh
sed -i 's/bugfixed sulexh/bugfixed sulexh/g' $(grep -rl "bugfixed sulexh" .)

# Phone number 264768161116 → 264768161116
sed -i 's/264768161116/264768161116/g' $(grep -rl "264768161116" .)

# bugfixed sulexh -xmd → bugfixed sulexh -xmd
sed -i 's/bugfixed sulexh -xmd/bugfixed sulexh -xmd/g' $(grep -rl "bugfixed sulexh -xmd" .)

# bugfixed sulexh → bugfixed sulexh
sed -i 's/bugfixed sulexh/bugfixed sulexh/g' $(grep -rl "bugfixed sulexh" .)

# POWERED BY BUGFIXED SULEXH-XMD → POWERED BY BUGFIXED SULEXH-XMD
sed -i 's/POWERED BY BUGFIXED SULEXH-XMD/POWERED BY BUGFIXED SULEXH-XMD/g' $(grep -rl "POWERED BY BUGFIXED SULEXH-XMD" .)

# BY BUGFIXED SULEXH-XMD → BY BUGFIXED SULEXH-XMD
sed -i 's/BY BUGFIXED SULEXH-XMD/BY BUGFIXED SULEXH-XMD/g' $(grep -rl "BY BUGFIXED SULEXH-XMD" .)

# bugfixed sulexh -xmd → bugfixed sulexh -xmd
sed -i 's/bugfixed sulexh -xmd/bugfixed sulexh -xmd/g' $(grep -rl "bugfixed sulexh -xmd" .)

# @bugfixed sulexh -xmd → @bugfixed sulexh -xmd
sed -i 's/@bugfixed sulexh -xmd/@bugfixed sulexh -xmd/g' $(grep -rl "@bugfixed sulexh -xmd" .)

# KENYA/TANARIVER → KENYA/TANARIVER
sed -i 's/KENYA\/ELDORET/KENYA\/TANARIVER/g' $(grep -rl "KENYA/TANARIVER" .)

# Kenya/Tanariver → Kenya/Tanariver
sed -i 's/Kenya\/Eldoret/Kenya\/Tanariver/g' $(grep -rl "Kenya/Tanariver" .)

echo "✅ All replacements done!"
